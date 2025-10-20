import { createPublicClient, http, getContract, encodePacked, hexToBigInt } from 'viem';
import { erc20Abi } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { toCircleSmartAccount } from '@circle-fin/modular-wallets-core';
import { getCurrentNetworkConfig, getTokenConfig } from '../config/networks.js';
import { signPermit } from '../utils/paymaster-permit.js';
import SmartAccountService from './SmartAccountService.js';
import { ethers } from 'ethers';
import EscrowFactoryABI from '../abis/EscrowFactory.json' with { type: 'json' };
import EscrowImplementationABI from '../abis/EscrowImplementation.json' with { type: 'json' };
import EncryptionService from './EncryptionService.js';
import { OrderStatus } from '../utils/types.js';

class GaslessPaymentService {
  constructor() {
    this.networkConfig = getCurrentNetworkConfig();
    this.chain = this.networkConfig.chain;
    this.supportedTokens = this.networkConfig.tokens;
    
    this.escrowFactoryAddress = process.env.ESCROW_FACTORY_ADDRESS || '0xFAFE1410d0BdfCF3892eDc3E1D43d14A503ed022';
    this.escrowImplementationAddress = process.env.ESCROW_IMPLEMENTATION_ADDRESS || '0x10027eD558656253A105F34C6316741A1C66079C';
    this.paymasterAddress = process.env.PAYMASTER_V07_ADDRESS || '0x31BE08D380A21fc740883c0BC434FcFc88740b58';
  }

  async checkTokenBalance(userAddress, tokenSymbol) {
    try {
      const tokenConfig = getTokenConfig(this.networkConfig.networkName, tokenSymbol);
      
      const client = createPublicClient({
        chain: this.chain,
        transport: http(this.networkConfig.rpcUrl)
      });

      const tokenContract = getContract({
        client,
        address: tokenConfig.address,
        abi: erc20Abi
      });

      const balance = await tokenContract.read.balanceOf([userAddress]);
      
      return {
        raw: balance.toString(),
        formatted: ethers.formatUnits(balance.toString(), tokenConfig.decimals),
        decimals: tokenConfig.decimals,
        symbol: tokenSymbol.toUpperCase()
      };
    } catch (error) {
      throw new Error(`Failed to check ${tokenSymbol} balance: ${error.message}`);
    }
  }

  async createPaymaster(account, client, tokenConfig) {
    return {
      async getPaymasterData() {
        try {
          const permitAmount = ethers.parseUnits("10", tokenConfig.decimals); // 10 tokens for gas
          
          const permitSignature = await signPermit({
            tokenAddress: tokenConfig.address,
            account,
            client,
            spenderAddress: this.paymasterAddress,
            permitAmount,
          });

          return {
            paymaster: this.paymasterAddress,
            paymasterData: encodePacked(
              ["uint8", "address", "uint256", "bytes"],
              [0, tokenConfig.address, permitAmount, permitSignature]
            ),
            paymasterVerificationGasLimit: 200000n,
            paymasterPostOpGasLimit: 15000n,
            isFinal: true,
          };
        } catch (error) {
          console.error('Paymaster data creation failed:', error);
          throw new Error(`Paymaster setup failed: ${error.message}`);
        }
      },
    };
  }

  async estimateTransactionFees(tokenSymbol, amount) {
    try {
      const tokenConfig = getTokenConfig(this.networkConfig.networkName, tokenSymbol);
      
      return {
        networkFee: {
          amount: "0",
          symbol: "ETH",
          usd: "0.00",
          description: "Gas fees covered by paymaster"
        },
        platformFee: {
          amount: (parseFloat(amount) * 0.01).toFixed(6), // 1% platform fee
          symbol: tokenSymbol.toUpperCase(),
          percentage: "1.0%"
        },
        totalCost: "0.00", // User pays $0 in gas
        estimatedTime: "30-90 seconds",
        gasless: true,
        network: this.networkConfig.networkName,
        chainId: this.chain.id
      };
    } catch (error) {
      throw new Error(`Fee estimation failed: ${error.message}`);
    }
  }

  async getAllTokenBalances(userAddress) {
    try {
      const balances = [];
      
      for (const [symbol, config] of Object.entries(this.supportedTokens)) {
        try {
          const balance = await this.checkTokenBalance(userAddress, symbol);
          balances.push({
            ...balance,
            tokenAddress: config.address,
            network: this.networkConfig.networkName
          });
        } catch (error) {
          console.warn(`Failed to fetch ${symbol} balance:`, error.message);
          balances.push({
            raw: "0",
            formatted: "0",
            decimals: config.decimals,
            symbol: symbol,
            tokenAddress: config.address,
            network: this.networkConfig.networkName,
            error: error.message
          });
        }
      }
      
      return balances;
    } catch (error) {
      throw new Error(`Failed to fetch token balances: ${error.message}`);
    }
  }

  validateTransactionParams({
    recipientAddress,
    tokenSymbol,
    amount,
    encryptedPrivateKey,
    userId
  }) {
    const errors = [];

    // Validate recipient address
    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      errors.push('Invalid recipient address');
    }

    // Validate token symbol
    if (!tokenSymbol || !this.supportedTokens[tokenSymbol.toUpperCase()]) {
      errors.push(`Unsupported token: ${tokenSymbol}`);
    }

    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.push('Invalid amount');
    }

    // Validate required fields
    if (!encryptedPrivateKey || !userId) {
      errors.push('Missing required authentication data');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  getNetworkInfo() {
    return {
      networkName: this.networkConfig.networkName,
      chainId: this.chain.id,
      chainName: this.chain.name,
      isTestnet: this.networkConfig.isTestnet,
      supportedTokens: Object.keys(this.supportedTokens),
      rpcUrl: this.networkConfig.rpcUrl,
      blockExplorer: this.chain.blockExplorers?.default?.url
    };
  }

  /**
   * Create escrow for product purchase
   */
async createEscrowPurchase({
  encryptedPrivateKey,
  userId,
  userPassword,
  sellerAddress,
  tokenSymbol,
  amount,
  orderId,
  metadataUri,
  releaseAfter = 7 * 24 * 60 * 60
}) {
  try {
    const userPrivateKey = await SmartAccountService.decryptUserPrivateKey(
      encryptedPrivateKey,
      userId,
      userPassword
    );

    const tokenConfig = getTokenConfig(this.networkConfig.networkName, tokenSymbol);
    const amountInWei = ethers.parseUnits(amount.toString(), tokenConfig.decimals);

    const client = createPublicClient({
      chain: this.chain,
      transport: http(this.networkConfig.rpcUrl)
    });

    const owner = privateKeyToAccount(userPrivateKey);
    const account = await toCircleSmartAccount({ client, owner });

    // Check balance first
    const balance = await this.checkTokenBalance(account.address, tokenSymbol);
    const balanceInWei = ethers.parseUnits(balance.formatted, tokenConfig.decimals);
    
    if (balanceInWei < amountInWei) {
      throw new Error(`Insufficient ${tokenSymbol} balance. Required: ${amount}, Available: ${balance.formatted}`);
    }

    // Store paymasterAddress in a local variable to avoid 'this' context issues
    const paymasterAddress = this.paymasterAddress;
    const pimlicoApiKey = process.env.PIMLICO_API_KEY;

    const paymaster = {
      async getPaymasterData(parameters) {
        try {
          const permitAmount = ethers.parseUnits('10', tokenConfig.decimals);
          
          console.log(`Creating permit for amount: ${permitAmount.toString()}`);
          console.log(`Using paymaster address: ${paymasterAddress}`);
          
          const permitSignature = await signPermit({
            tokenAddress: tokenConfig.address,
            account,
            client,
            spenderAddress: paymasterAddress,
            permitAmount
          });

          return {
            paymaster: paymasterAddress,
            paymasterData: encodePacked(
              ["uint8", "address", "uint256", "bytes"],
              [0, tokenConfig.address, permitAmount, permitSignature]
            ),
            paymasterVerificationGasLimit: 200000n,
            paymasterPostOpGasLimit: 150000n,
            isFinal: true,
          };
        } catch (error) {
          console.error('Paymaster data creation failed:', error);
          throw new Error(`Paymaster setup failed: ${error.message}`);
        }
      },
    };

    const bundlerClient = createBundlerClient({
      account,
      client,
      paymaster,
      userOperation: {
        estimateFeesPerGas: async () => {
          const { standard: fees } = await bundlerClient.request({
            method: "pimlico_getUserOperationGasPrice",
          });
          return {
            maxFeePerGas: hexToBigInt(fees.maxFeePerGas),
            maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas),
          };
        },
      },
      transport: http(`https://api.pimlico.io/v2/${this.chain.id}/rpc?apikey=${pimlicoApiKey}`),
    });

    // STEP 1: Check and grant approval if needed
    console.log('Checking token approval for escrow factory...');
    const approvalResult = await this.ensureTokenApproval({
      bundlerClient,
      account,
      tokenConfig,
      tokenAddress: tokenConfig.address,
      spenderAddress: this.escrowFactoryAddress,
      amount: amountInWei
    });

    if (!approvalResult.success) {
      throw new Error(`Token approval failed: ${approvalResult.error}`);
    }

    console.log('Token approval confirmed, creating escrow...');

    // STEP 2: Create escrow via factory
    console.log('Creating escrow with factory:', this.escrowFactoryAddress);
    const userOpHash = await bundlerClient.sendUserOperation({
      account,
      calls: [{
        to: this.escrowFactoryAddress,
        abi: EscrowFactoryABI,
        functionName: "createEscrow",
        args: [
          orderId,
          sellerAddress,
          tokenConfig.address,
          amountInWei,
          metadataUri,
          releaseAfter
        ],
        chain: this.chain
      }],
    });

    console.log('User operation submitted:', userOpHash);

    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash
    });

    console.log('User operation completed:', receipt);

    // Extract escrow address from event logs
    const escrowAddress = this.extractEscrowAddressFromLogs(receipt.logs, orderId);

    console.log("escrow Address", escrowAddress)

    return {
      success: true,
      transactionHash: receipt.receipt.transactionHash,
      userOpHash: userOpHash,
      escrowAddress: escrowAddress,
      blockNumber: receipt.receipt.blockNumber.toString(),
      gasUsed: receipt.receipt.gasUsed.toString(),
      orderId: orderId,
      amount: amount.toString(),
      tokenSymbol: tokenSymbol.toUpperCase()
    };

  } catch (error) {
    console.error("Escrow creation failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

  /**
   * Release escrow funds to seller
   */
  async releaseEscrow({
    encryptedPrivateKey,
    userId,
    userPassword,
    escrowAddress
  }) {
    try {
      const userPrivateKey = await SmartAccountService.decryptUserPrivateKey(
        encryptedPrivateKey,
        userId,
        userPassword
      );

      const client = createPublicClient({
        chain: this.chain,
        transport: http(this.networkConfig.rpcUrl)
      });

      const owner = privateKeyToAccount(userPrivateKey);
      const account = await toCircleSmartAccount({ client, owner });

      // Get token info from escrow
      const escrowContract = getContract({
        address: escrowAddress,
        abi: EscrowImplementationABI,
        client
      });

      const tokenAddress = await escrowContract.read.token();
      const tokenConfig = Object.values(this.supportedTokens).find(t => 
        t.address.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (!tokenConfig) {
        throw new Error('Token not supported for gasless transactions');
      }

    const paymasterAddress = this.paymasterAddress;

    const paymaster = {
      async getPaymasterData(parameters) {
        try {
          const permitAmount = ethers.parseUnits('10', tokenConfig.decimals);
          
          console.log(`Creating permit for amount: ${permitAmount.toString()}`);
          console.log(`Using paymaster address: ${paymasterAddress}`);
          
          const permitSignature = await signPermit({
            tokenAddress: tokenConfig.address,
            account,
            client,
            spenderAddress: paymasterAddress,
            permitAmount
          });

          return {
            paymaster: paymasterAddress,
            paymasterData: encodePacked(
              ["uint8", "address", "uint256", "bytes"],
              [0, tokenConfig.address, permitAmount, permitSignature]
            ),
            paymasterVerificationGasLimit: 200000n,
            paymasterPostOpGasLimit: 150000n,
            isFinal: true,
          };
        } catch (error) {
          console.error('Paymaster data creation failed:', error);
          throw new Error(`Paymaster setup failed: ${error.message}`);
        }
      },
    };

      const bundlerClient = createBundlerClient({
        account,
        client,
        paymaster,
        userOperation: {
          estimateFeesPerGas: async () => {
            const { standard: fees } = await bundlerClient.request({
              method: "pimlico_getUserOperationGasPrice",
            });
            return {
              maxFeePerGas: hexToBigInt(fees.maxFeePerGas),
              maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas),
            };
          },
        },
        transport: http(`https://api.pimlico.io/v2/${this.chain.id}/rpc?apikey=${process.env.PIMLICO_API_KEY}`),
      });

      const userOpHash = await bundlerClient.sendUserOperation({
        account,
        calls: [{
          to: escrowAddress,
          abi: EscrowImplementationABI,
          functionName: "buyerRelease",
          args: [],
          chain: this.chain
        }],
      });

      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash
      });

      return {
        success: true,
        transactionHash: receipt.receipt.transactionHash,
        userOpHash: userOpHash,
        escrowAddress: escrowAddress,
        blockNumber: receipt.receipt.blockNumber.toString(),
        action: OrderStatus.delivered
      };

    } catch (error) {
      console.error("Escrow release failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Raise dispute on escrow
   */
  async raiseDispute({
    encryptedPrivateKey,
    userId,
    userPassword,
    escrowAddress,
    reason
  }) {
    try {
      const userPrivateKey = await SmartAccountService.decryptUserPrivateKey(
        encryptedPrivateKey,
        userId,
        userPassword
      );

      const client = createPublicClient({
        chain: this.chain,
        transport: http(this.networkConfig.rpcUrl)
      });

      const owner = privateKeyToAccount(userPrivateKey);
      const account = await toCircleSmartAccount({ client, owner });

      // Get token info for paymaster
      const escrowContract = getContract({
        address: escrowAddress,
        abi: EscrowImplementationABI,
        client
      });

      const tokenAddress = await escrowContract.read.token();
      const tokenConfig = Object.values(this.supportedTokens).find(t => 
        t.address.toLowerCase() === tokenAddress.toLowerCase()
      );

      const paymaster = await this.createPaymaster(account, client, tokenConfig);

      const bundlerClient = createBundlerClient({
        account,
        client,
        paymaster,
        userOperation: {
          estimateFeesPerGas: async () => {
            const { standard: fees } = await bundlerClient.request({
              method: "pimlico_getUserOperationGasPrice",
            });
            return {
              maxFeePerGas: hexToBigInt(fees.maxFeePerGas),
              maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas),
            };
          },
        },
        transport: http(`https://api.pimlico.io/v2/${this.chain.id}/rpc?apikey=${process.env.PIMLICO_API_KEY}`),
      });

      // Raise dispute
      const userOpHash = await bundlerClient.sendUserOperation({
        account,
        calls: [{
          to: escrowAddress,
          abi: EscrowImplementationABI,
          functionName: "raiseDispute",
          args: [reason],
          chain: this.chain
        }],
      });

      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash
      });

      return {
        success: true,
        transactionHash: receipt.receipt.transactionHash,
        userOpHash: userOpHash,
        escrowAddress: escrowAddress,
        blockNumber: receipt.receipt.blockNumber.toString(),
        action: 'dispute_raised'
      };

    } catch (error) {
      console.error("Dispute raise failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get escrow details
   */
  async getEscrowDetails(escrowAddress) {
    try {
      const client = createPublicClient({
        chain: this.chain,
        transport: http(this.networkConfig.rpcUrl)
      });

      const escrowContract = getContract({
        address: escrowAddress,
        abi: EscrowImplementationABI,
        client
      });

      const [
        factory,
        buyer,
        seller,
        token,
        amount,
        metadataUri,
        status,
        releaseAfter,
        disputeInfo
      ] = await Promise.all([
        escrowContract.read.factory(),
        escrowContract.read.buyer(),
        escrowContract.read.seller(),
        escrowContract.read.token(),
        escrowContract.read.amount(),
        escrowContract.read.metadataUri(),
        escrowContract.read.status(),
        escrowContract.read.releaseAfter(),
        escrowContract.read.getDisputeInfo(),
      ]);

      const balance = await escrowContract.read.getBalance();

      return {
        factory,
        buyer,
        seller,
        token,
        amount: amount.toString(),
        metadataUri,
        status: this.getStatusString(status),
        releaseAfter: Number(releaseAfter),
        balance: balance.toString(),
        canAutoRelease: await escrowContract.read.canAutoRelease(),
        disputeInfo: disputeInfo
      };

    } catch (error) {
      console.error("Failed to get escrow details:", error);
      throw new Error(`Escrow details retrieval failed: ${error.message}`);
    }
  }

  /**
 * Ensure the escrow factory has sufficient allowance to spend tokens
 */
async ensureTokenApproval({
  bundlerClient,
  account,
  tokenConfig,
  tokenAddress,
  spenderAddress,
  amount
}) {
  try {
    const client = createPublicClient({
      chain: this.chain,
      transport: http(this.networkConfig.rpcUrl)
    });

    const tokenContract = getContract({
      client,
      address: tokenAddress,
      abi: erc20Abi
    });

    // Check current allowance
    console.log('=== TOKEN APPROVAL DEBUG ===');
    console.log('Account:', account.address);
    console.log('Spender:', spenderAddress);
    console.log('Token:', tokenAddress);
    console.log('Amount needed:', amount.toString());

    const currentAllowance = await tokenContract.read.allowance([
      account.address,
      spenderAddress
    ]);

    console.log('Current allowance:', currentAllowance.toString());

    // If current allowance is sufficient, no need to approve
    if (BigInt(currentAllowance) >= BigInt(amount)) {
      console.log('✅ Sufficient allowance already exists');
      return { success: true, alreadyApproved: true };
    }

    console.log('❌ Insufficient allowance, granting approval...');

    // Grant approval using gasless transaction
    const approveUserOpHash = await bundlerClient.sendUserOperation({
      account,
      calls: [{
        to: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, amount],
        chain: this.chain
      }],
    });

    console.log('Approval user operation submitted:', approveUserOpHash);

    const approveReceipt = await bundlerClient.waitForUserOperationReceipt({
      hash: approveUserOpHash
    });

    console.log('Approval transaction completed');
    console.log('Transaction hash:', approveReceipt.receipt.transactionHash);

    // Wait a bit for the state to update
    console.log('Waiting for state update...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the approval was successful
    const newAllowance = await tokenContract.read.allowance([
      account.address,
      spenderAddress
    ]);

    console.log('New allowance after approval:', newAllowance.toString());
    console.log('Required amount:', amount.toString());

    if (BigInt(newAllowance) >= BigInt(amount)) {
      console.log('✅ Approval successful');
      return { 
        success: true, 
        alreadyApproved: false,
        userOpHash: approveUserOpHash,
        transactionHash: approveReceipt.receipt.transactionHash,
        newAllowance: newAllowance.toString()
      };
    } else {
      console.log('❌ Approval failed - allowance not updated correctly');
      console.log('Expected at least:', amount.toString());
      console.log('Got:', newAllowance.toString());
      
      // Try one more time with a longer delay
      console.log('Retrying allowance check with longer delay...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const finalAllowance = await tokenContract.read.allowance([
        account.address,
        spenderAddress
      ]);
      
      console.log('Final allowance check:', finalAllowance.toString());
      
      if (BigInt(finalAllowance) >= BigInt(amount)) {
        console.log('✅ Approval successful on retry');
        return { 
          success: true, 
          alreadyApproved: false,
          userOpHash: approveUserOpHash,
          transactionHash: approveReceipt.receipt.transactionHash,
          newAllowance: finalAllowance.toString()
        };
      }
      
      throw new Error(`Approval transaction completed but allowance not updated. Expected: ${amount}, Got: ${finalAllowance}`);
    }

  } catch (error) {
    console.error('Token approval failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Grant max approval to avoid multiple approval transactions
 */
async grantMaxApproval({
  bundlerClient,
  account,
  tokenAddress,
  spenderAddress
}) {
  try {
    const maxAmount = ethers.MaxUint256; // Infinite approval

    console.log('Granting max approval to:', spenderAddress);

    const approveUserOpHash = await bundlerClient.sendUserOperation({
      account,
      calls: [{
        to: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, maxAmount],
        chain: this.chain
      }],
    });

    console.log('Max approval user operation submitted:', approveUserOpHash);

    const approveReceipt = await bundlerClient.waitForUserOperationReceipt({
      hash: approveUserOpHash
    });

    console.log('Max approval completed');

    return {
      success: true,
      userOpHash: approveUserOpHash,
      transactionHash: approveReceipt.receipt.transactionHash,
      amount: maxAmount.toString()
    };

  } catch (error) {
    console.error('Max approval failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

  // Helper methods
  extractEscrowAddressFromLogs(logs, orderId) {
  console.log('=== EXTRACTING ESCROW ADDRESS ===');
  console.log('Total logs:', logs.length);
  console.log('Looking for orderId:', orderId);
  
  // Method 1: Look for the EscrowInitialized event (most reliable)
  const escrowAddress = this.extractFromEscrowInitializedEvent(logs);
  if (escrowAddress) {
    console.log('✅ Found via EscrowInitialized event:', escrowAddress);
    return escrowAddress;
  }
  
  // Method 2: Look for proxy contract creation pattern
  const proxyAddress = this.extractFromProxyCreation(logs);
  if (proxyAddress) {
    console.log('✅ Found via proxy creation pattern:', proxyAddress);
    return proxyAddress;
  }
  
  // Method 3: Look for unknown addresses that receive token transfers
  const transferAddress = this.extractFromTokenTransfers(logs, orderId);
  if (transferAddress) {
    console.log('✅ Found via token transfer pattern:', transferAddress);
    return transferAddress;
  }
  
  // Method 4: Fallback to positional logic
  const positionalAddress = this.extractFromPosition(logs);
  if (positionalAddress) {
    console.log('✅ Found via positional pattern:', positionalAddress);
    return positionalAddress;
  }
  
  console.error('❌ Failed to extract escrow address from logs');
  this.debugLogs(logs);
  throw new Error('Escrow address not found in transaction logs');
}

/**
 * Method 1: Extract from EscrowInitialized event (most reliable)
 */
extractFromEscrowInitializedEvent(logs) {
  // Look for logs with EscrowInitialized event signature
  // Event: EscrowInitialized(address buyer, address seller, address token, uint256 amount, string metadataUri)
  
  for (const log of logs) {
    // Check if this log contains escrow initialization data
    // Based on your logs, the EscrowInitialized event appears in logs from the escrow contract itself
    if (this.isEscrowInitializedLog(log)) {
      console.log('Found EscrowInitialized event at address:', log.address);
      return log.address; // The escrow contract address itself
    }
  }
  return null;
}

/**
 * Method 2: Extract from proxy creation pattern
 */
extractFromProxyCreation(logs) {
  const knownAddresses = [
    this.escrowFactoryAddress.toLowerCase(),
    this.paymasterAddress.toLowerCase(),
    // Add token addresses from your supported tokens
    ...Object.values(this.supportedTokens).map(t => t.address.toLowerCase())
  ];
  
  // Look for addresses that appear in multiple logs (indicating new contract)
  const addressCount = {};
  
  for (const log of logs) {
    const address = log.address.toLowerCase();
    addressCount[address] = (addressCount[address] || 0) + 1;
  }
  
  // Find addresses that appear multiple times and aren't known addresses
  for (const [address, count] of Object.entries(addressCount)) {
    if (count >= 2 && !knownAddresses.includes(address)) {
      console.log(`Found recurring unknown address: ${address} (appears ${count} times)`);
      return address;
    }
  }
  
  return null;
}

/**
 * Method 3: Extract from token transfer patterns
 */
extractFromTokenTransfers(logs, orderId) {
  const tokenAddresses = Object.values(this.supportedTokens).map(t => t.address.toLowerCase());
  
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    
    // Look for token transfer events (from known token addresses)
    if (tokenAddresses.includes(log.address.toLowerCase())) {
      console.log(`Found token log at index ${i}:`, log.address);
      
      // The next log might be the escrow contract receiving funds
      if (i + 1 < logs.length) {
        const nextLog = logs[i + 1];
        // Check if next log is from an unknown address (likely the escrow)
        if (!this.isKnownAddress(nextLog.address)) {
          console.log(`Found potential escrow after token transfer: ${nextLog.address}`);
          return nextLog.address;
        }
      }
    }
  }
  
  return null;
}

/**
 * Method 4: Extract from positional pattern (fallback)
 */
extractFromPosition(logs) {
  // Based on both your transactions, the escrow is consistently at index 1 or 4
  // First transaction: escrow at index 1 (0x99226f53b3501f192d1C38340Ab6C7bcAa8e53b6)
  // Second transaction: escrow at index 4 (0x1483e573b924F41629BDB81F87C2e941F4D4f705)
  
  const potentialIndices = [1, 4]; // Most common positions based on your logs
  
  for (const index of potentialIndices) {
    if (logs.length > index) {
      const address = logs[index].address;
      if (!this.isKnownAddress(address)) {
        console.log(`Found potential escrow at index ${index}: ${address}`);
        return address;
      }
    }
  }
  
  return null;
}

/**
 * Helper: Check if log contains EscrowInitialized event
 */
isEscrowInitializedLog(log) {
  // EscrowInitialized event typically has specific data pattern
  // Look for logs that contain token address, amount, and metadata URI in data
  if (!log.data || log.data === '0x') return false;
  
  // Check if data contains typical escrow initialization parameters
  // This is a heuristic based on your log patterns
  const data = log.data.toLowerCase();
  
  // Look for token address pattern in data (0x followed by 40 hex chars)
  const tokenAddressPattern = /0x[0-9a-f]{40}/;
  if (tokenAddressPattern.test(data)) {
    // Also check if this is not a known address
    if (!this.isKnownAddress(log.address)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Helper: Check if address is a known contract (not the escrow)
 */
isKnownAddress(address) {
  const knownAddresses = [
    this.escrowFactoryAddress.toLowerCase(),
    this.paymasterAddress.toLowerCase(),
    '0x036cbd53842c5426634e7929541ec2318f3dcf7e', // USDC token
    '0x31be08d380a21fc740883c0bc434fcfc88740b58', // Paymaster
    '0x0000000071727de22e5e9d8baf0edac6f37da032', // EntryPoint
    '0x0000000df7e6c9dc387cafc5ecbfa6c3a6179add', // Factory
    '0x4337021d22bcd0775a0fd1b4a6665051dc15d995', // From receipt
    '0x4337031ade3a53d10121f350369907076b6d32a4'  // From receipt
  ];
  
  return knownAddresses.includes(address.toLowerCase());
}

  getStatusString(status) {
    const statuses = ['FUNDED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'RESOLVED'];
    return statuses[Number(status)] || 'UNKNOWN';
  }
}

export default GaslessPaymentService;