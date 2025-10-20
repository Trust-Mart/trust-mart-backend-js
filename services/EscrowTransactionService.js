import GaslessPaymentService from './GasslessPaymentService.js';
import IPFSService from './IPFSService.js';
import db from '../models/index.js';
import { Op } from 'sequelize';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { OrderStatus, PaymentStatus } from '../utils/types.js';
import SmartAccountService from './SmartAccountService.js';

const { User, Transaction, Product, Order, sequelize } = db;

class EscrowTransactionService {
  constructor() {
    this.paymentService = new GaslessPaymentService();
    this.ipfsService = new IPFSService();
  }

async createProductEscrow({
    buyerId,
    productId,
    quantity = 1,
    tokenSymbol,
    userPassword
  }) {
    const transaction = await sequelize.transaction();
    let order = null;
    let dbTransaction = null;
    
    try {
      // Step 1: Validate inputs and get data within DB transaction
      const buyer = await User.findByPk(buyerId, { transaction });

      if (!buyer) {
        throw new Error('Buyer not found');
      }

      const product = await Product.findByPk(productId, {
        include: [{
          model: User,
          as: 'seller',
          attributes: ['id', 'username', 'smartAccountAddress']
        }],
        transaction
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.status !== 'active') {
        throw new Error('Product is not available for purchase');
      }

      if (product.quantity < quantity) {
        throw new Error('Insufficient product quantity');
      }

      // Step 2: Calculate total amount and generate IDs
      const totalAmount = parseFloat(product.price) * quantity;
      const orderId = this.generateOrderId();
      
      // Step 3: Create order metadata for IPFS
      const orderMetadata = {
        orderId,
        buyer: {
          id: buyer.id,
          username: buyer.username,
          address: buyer.smartAccountAddress
        },
        seller: {
          id: product.seller.id,
          username: product.seller.username,
          address: product.seller.smartAccountAddress
        },
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          quantity: quantity
        },
        totalAmount,
        tokenSymbol,
        createdAt: new Date().toISOString(),
        platform: 'TrustMart',
        version: '1.0.0'
      };

      // Step 4: Upload to IPFS (outside DB transaction since it's external)
      const metadataUri = await this.ipfsService.uploadJSON(orderMetadata);

        // const metadataUri = "bafkreifarn46s6v6jscedwa6pvwstssyrhq5n44gjebeg3syhtqx7mt7vu";


      console.log("order", {
                order_id: orderId,
        buyer_id: buyer.id,
        seller_id: product.seller.id,
        product_id: product.id,
        amount: totalAmount,
        token_symbol: tokenSymbol,
        quantity: quantity,
        status: OrderStatus.pending,
        metadata_uri: metadataUri,
        metadata: orderMetadata
      })


      // Step 5: Create ORDER first (this is the main entity)
      order = await Order.create({
        order_id: orderId,
        buyer_id: buyer.id,
        seller_id: product.seller.id,
        product_id: product.id,
        amount: totalAmount,
        token_symbol: tokenSymbol,
        quantity: quantity,
        status: OrderStatus.pending,
        metadata_uri: metadataUri,
        metadata: orderMetadata
      }, { transaction });

      console.log("Order Created =================================================>")

      // Step 6: Create transaction record (child of order)
      dbTransaction = await Transaction.create({
        transaction_id: this.generateTransactionId(),
        sender_id: buyer.id,
        recipient_id: product.seller.id,
        product_id: product.id,
        order_id: orderId, // Reference to order
        token_address: this.paymentService.supportedTokens[tokenSymbol].address,
        token_symbol: tokenSymbol,
        amount: totalAmount.toString(),
        amount_usd: totalAmount,
        transaction_type: 'escrow_create',
        status: 'pending',
        metadata_uri: metadataUri,
        metadata: {
          quantity,
          productName: product.name,
          sellerUsername: product.seller.username,
          releaseAfter: 7 * 24 * 60 * 60
        }
      }, { transaction });

        console.log("Transaction Created =================================================>")

        console.log("QTY bEFORE",product.quantity)
      // Step 7: Update product quantity
      await product.decrement('quantity', { 
        by: quantity,
        transaction 
      });

      console.log("QTY AFTER",product.quantity)


      // Step 9: Execute blockchain transaction (outside DB transaction since it's external)
      const executionResult = await this.paymentService.createEscrowPurchase({
        encryptedPrivateKey: buyer.privateKey,
        userId: buyer.id.toString(),
        userPassword,
        sellerAddress: product.seller.smartAccountAddress,
        tokenSymbol,
        amount: totalAmount,
        orderId,
        metadataUri,
        releaseAfter: 7 * 24 * 60 * 60
      });

      if (!executionResult.success) {
        // If blockchain fails, we need to rollback the order
        await this.rollbackOrder(orderId, executionResult.error);
        throw new Error(`Escrow creation failed: ${executionResult.error}`);
      }

    await transaction.commit();

      const updateTransaction = await sequelize.transaction();
      try {
        await dbTransaction.update({
          status: PaymentStatus.submitted,
          escrow_address: executionResult.escrowAddress,
          blockchain_tx_hash: executionResult.transactionHash,
          user_op_hash: executionResult.userOpHash,
          block_number: executionResult.blockNumber,
          gas_used: executionResult.gasUsed,
          submitted_at: new Date(),
          metadata: {
            ...dbTransaction.metadata,
            escrowAddress: executionResult.escrowAddress
          }
        }, { transaction: updateTransaction });

        await order.update({
          escrow_address: executionResult.escrowAddress,
          status: OrderStatus.paid,
          paid_at: new Date()
        }, { transaction: updateTransaction });

        await updateTransaction.commit();

        return {
          success: true,
          orderId,
          transactionId: dbTransaction.transaction_id,
          escrowAddress: executionResult.escrowAddress,
          amount: totalAmount,
          tokenSymbol,
          status: OrderStatus.paid
        };

      } catch (updateError) {
        await updateTransaction.rollback();
        // Even if update fails, the blockchain transaction succeeded
        // We can handle this gracefully or trigger a recovery process
        console.log('Failed to update order after blockchain success:', updateError);
        return {
          success: true,
          orderId,
          transactionId: dbTransaction.transaction_id,
          escrowAddress: executionResult.escrowAddress,
          amount: totalAmount,
          tokenSymbol,
          status: 'paid_but_update_failed',
          warning: 'Order created but status update failed'
        };
      }

    } catch (error) {
      // Rollback the database transaction if anything fails
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      console.error('Escrow creation failed:', error);
      throw new Error(`Purchase failed: ${error.message}`);
    }
  }

  /**
   * Release escrow funds to seller with proper transaction
   */
  async releaseEscrow({
    buyerId,
    orderId,
    userPassword
  }) {
    const dbTransaction = await sequelize.transaction();
    let transactionRecord = null;
    
    try {
      const order = await Order.findOne({ 
        where: { order_id: orderId },
        include: [{
          model: User,
          as: 'buyer',
          attributes: ['id', 'privateKey']
        }],
        transaction: dbTransaction
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.buyer_id !== buyerId) {
        throw new Error('Only buyer can release funds');
      }

      if (!order.escrow_address) {
        throw new Error('No escrow associated with this order');
      }

      if (order.status !== 'paid') {
        throw new Error('Order is not in paid status');
      }

      // Create release transaction record
      transactionRecord = await Transaction.create({
        transaction_id: this.generateTransactionId(),
        sender_id: buyerId,
        recipient_id: order.seller_id,
        product_id: order.product_id,
        order_id: orderId,
        escrow_address: order.escrow_address,
        token_address: this.paymentService.supportedTokens[order.token_symbol].address,
        token_symbol: order.token_symbol,
        amount: order.amount.toString(),
        transaction_type: 'escrow_release',
        status: 'pending'
      }, { transaction: dbTransaction });

      // Update order status to indicate release in progress
      await order.update({
        status: 'release_pending'
      }, { transaction: dbTransaction });

      // Commit the initial DB state
      await dbTransaction.commit();

      // Execute blockchain release (external call)
      const executionResult = await this.paymentService.releaseEscrow({
        encryptedPrivateKey: order.buyer.privateKey,
        userId: buyerId.toString(),
        userPassword,
        escrowAddress: order.escrow_address
      });

      if (!executionResult.success) {
        // Rollback order status if blockchain fails
        await this.rollbackOrderStatus(orderId, 'paid');
        throw new Error(`Escrow release failed: ${executionResult.error}`);
      }

      // Update with successful blockchain result
      const updateTransaction = await sequelize.transaction();
      try {
        await transactionRecord.update({
          status: 'released',
          blockchain_tx_hash: executionResult.transactionHash,
          user_op_hash: executionResult.userOpHash,
          block_number: executionResult.blockNumber,
          gas_used: executionResult.gasUsed,
          submitted_at: new Date(),
          confirmed_at: new Date()
        }, { transaction: updateTransaction });

        await order.update({
          status: 'completed',
          completed_at: new Date()
        }, { transaction: updateTransaction });

        await updateTransaction.commit();

        return {
          success: true,
          transactionId: transactionRecord.transaction_id,
          orderId,
          action: 'released',
          amount: order.amount
        };

      } catch (updateError) {
        await updateTransaction.rollback();
        console.error('Failed to update after release:', updateError);
        throw new Error('Release completed but status update failed');
      }

    } catch (error) {
      if (dbTransaction && !dbTransaction.finished) {
        await dbTransaction.rollback();
      }
      console.error('Escrow release failed:', error);
      throw new Error(`Release failed: ${error.message}`);
    }
  }

  /**
   * Raise dispute with proper transaction handling
   */
  async raiseDispute({
    userId,
    orderId,
    reason,
    userPassword
  }) {
    const dbTransaction = await sequelize.transaction();
    let transactionRecord = null;
    
    try {
      const order = await Order.findOne({ 
        where: { order_id: orderId },
        include: [{
          model: User,
          as: 'buyer',
          attributes: ['id', 'privateKey']
        }, {
          model: User,
          as: 'seller',
          attributes: ['id', 'privateKey']
        }],
        transaction: dbTransaction
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.buyer_id !== userId && order.seller_id !== userId) {
        throw new Error('Only buyer or seller can raise dispute');
      }

      const user = order.buyer_id === userId ? order.buyer : order.seller;

      // Create dispute transaction record
      transactionRecord = await Transaction.create({
        transaction_id: this.generateTransactionId(),
        sender_id: userId,
        recipient_id: userId === order.buyer_id ? order.seller_id : order.buyer_id,
        product_id: order.product_id,
        order_id: orderId,
        escrow_address: order.escrow_address,
        token_address: this.paymentService.supportedTokens[order.token_symbol].address,
        token_symbol: order.token_symbol,
        amount: order.amount.toString(),
        transaction_type: 'escrow_dispute',
        status: 'pending',
        metadata: { dispute_reason: reason }
      }, { transaction: dbTransaction });

      // Update order status
      await order.update({ 
        status: 'dispute_pending' 
      }, { transaction: dbTransaction });

      await dbTransaction.commit();

      // Execute blockchain dispute
      const executionResult = await this.paymentService.raiseDispute({
        encryptedPrivateKey: user.privateKey,
        userId: userId.toString(),
        userPassword,
        escrowAddress: order.escrow_address,
        reason
      });

      if (!executionResult.success) {
        await this.rollbackOrderStatus(orderId, 'paid');
        throw new Error(`Dispute raise failed: ${executionResult.error}`);
      }

      // Update with successful result
      const updateTransaction = await sequelize.transaction();
      try {
        await transactionRecord.update({
          status: 'disputed',
          blockchain_tx_hash: executionResult.transactionHash,
          user_op_hash: executionResult.userOpHash,
          block_number: executionResult.blockNumber,
          gas_used: executionResult.gasUsed,
          submitted_at: new Date()
        }, { transaction: updateTransaction });

        await order.update({ 
          status: 'disputed' 
        }, { transaction: updateTransaction });

        await updateTransaction.commit();

        return {
          success: true,
          transactionId: transactionRecord.transaction_id,
          orderId,
          action: 'dispute_raised',
          reason
        };

      } catch (updateError) {
        await updateTransaction.rollback();
        console.error('Failed to update after dispute:', updateError);
        throw new Error('Dispute raised but status update failed');
      }

    } catch (error) {
      if (dbTransaction && !dbTransaction.finished) {
        await dbTransaction.rollback();
      }
      console.error('Dispute raise failed:', error);
      throw new Error(`Dispute failed: ${error.message}`);
    }
  }

  // Helper methods for rollback operations
  async rollbackOrder(orderId, error) {
    const transaction = await sequelize.transaction();
    try {
      // Delete the transaction record
      await Transaction.destroy({
        where: { order_id: orderId },
        transaction
      });

      // Delete the order
      await Order.destroy({
        where: { order_id: orderId },
        transaction
      });

      // Note: We don't rollback product quantity here since it's already committed
      // In production, you might want a more sophisticated recovery mechanism

      await transaction.commit();
      console.log(`Rolled back order ${orderId} due to: ${error}`);
    } catch (rollbackError) {
      await transaction.rollback();
      console.error(`Failed to rollback order ${orderId}:`, rollbackError);
    }
  }

  async rollbackOrderStatus(orderId, previousStatus) {
    const transaction = await sequelize.transaction();
    try {
      await Order.update(
        { status: previousStatus },
        { where: { order_id: orderId }, transaction }
      );

      // Also mark any pending transactions as failed
      await Transaction.update(
        { status: 'failed' },
        { 
          where: { 
            order_id: orderId, 
            status: 'pending' 
          },
          transaction 
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(`Failed to rollback order status for ${orderId}:`, error);
    }
  }


  /**
   * Get escrow details
   */
  async getEscrowDetails(escrowAddress) {
    try {
      return await this.paymentService.getEscrowDetails(escrowAddress);
    } catch (error) {
      throw new Error(`Failed to get escrow details: ${error.message}`);
    }
  }

  /**
   * Get order with escrow details
   */
  async getOrderWithEscrow(orderId) {
    try {
      const order = await Order.findOne({
        where: { order_id: orderId },
        include: [
          {
            model: User,
            as: 'buyer',
            attributes: ['id', 'username', 'smartAccountAddress']
          },
          {
            model: User,
            as: 'seller',
            attributes: ['id', 'username', 'smartAccountAddress']
          },
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'currency']
          },
          {
            model: Transaction,
            as: 'transaction',
            where: { transaction_type: 'escrow_create' },
            required: false
          }
        ]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      let escrowDetails = null;
      if (order.escrow_address) {
        escrowDetails = await this.getEscrowDetails(order.escrow_address);
      }

      return {
        order: {
          id: order.order_id,
          amount: order.amount,
          tokenSymbol: order.token_symbol,
          quantity: order.quantity,
          status: order.status,
          createdAt: order.createdAt,
          paidAt: order.paid_at,
          escrowAddress: order.escrow_address,
          metadataUri: order.metadata_uri
        },
        buyer: order.buyer,
        seller: order.seller,
        product: order.product,
        escrow: escrowDetails,
        transaction: order.transaction
      };

    } catch (error) {
      throw new Error(`Failed to get order details: ${error.message}`);
    }
  }

  // Helper methods
  generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(6).toString('hex');
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }

async getUserTokenBalances(userId) {
    try {
      const user = await User.findByPk(userId);

      console.log(user, userId);
      if (!user || !user.smartAccountAddress) {
        throw new Error('User or smart account not found');
      }

      const balances = await this.paymentService.getAllTokenBalances(user.smartAccountAddress);
      
      const totalUSD = balances.reduce((sum, balance) => {
        const usdValue = parseFloat(balance.formatted) * (balance.symbol === 'USDC' ? 1 : 1); // Mock USD rate
        return sum + usdValue;
      }, 0);

      return {
        totalUSD: totalUSD.toFixed(2),
        balances: balances.map(balance => ({
          ...balance,
          usdValue: (parseFloat(balance.formatted) * (balance.symbol === 'USDC' ? 1 : 1)).toFixed(2)
        })),
        smartAccountAddress: user.smartAccountAddress,
        networkInfo: this.paymentService.getNetworkInfo()
      };
    } catch (error) {
      throw new Error(`Balance retrieval failed: ${error.message}`);
    }
  }

}

export default EscrowTransactionService;