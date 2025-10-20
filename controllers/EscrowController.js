import EscrowTransactionService from '../services/EscrowTransactionService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import db from "../models/index.js"
const { User } = db;

class EscrowController {
  constructor() {
    this.escrowService = new EscrowTransactionService();
  }

  createProductEscrow = async (req, res) => {
    try {
      const { productId, quantity = 1, tokenSymbol } = req.body;
      const buyerId = req.user.id;
      const user = await User.findByPk(buyerId);
      const userPassword = user.password;

      const result = await this.escrowService.createProductEscrow({
        buyerId,
        productId,
        quantity,
        tokenSymbol,
        userPassword
      });

      return ApiResponse.success(res, {
        message: 'Escrow created successfully',
        ...result
      }, 201);

    } catch (error) {
      console.error('Create escrow error:', error);
      return ApiResponse.serverError(res, error.message);
    }
  };

  releaseEscrow = async (req, res) => {
    try {
      const { orderId } = req.params;
      const buyerId = req.user.id;
    const user = await User.findByPk(buyerId);
      const userPassword = user.password;

      const result = await this.escrowService.releaseEscrow({
        buyerId,
        orderId,
        userPassword
      });

      return ApiResponse.success(res, {
        message: 'Funds released to seller',
        ...result
      });

    } catch (error) {
      console.error('Release escrow error:', error);
      return ApiResponse.serverError(res, error.message);
    }
  };

  raiseDispute = async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      const { reason, password } = req.body;

      const result = await this.escrowService.raiseDispute({
        userId,
        orderId,
        reason,
        userPassword: password
      });

      return ApiResponse.success(res, {
        message: 'Dispute raised successfully',
        ...result
      });

    } catch (error) {
      console.error('Raise dispute error:', error);
      return ApiResponse.serverError(res, error.message);
    }
  };

  getOrderDetails = async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const result = await this.escrowService.getOrderWithEscrow(orderId);

      // Check if user is authorized to view this order
      if (result.order.buyer.id !== userId && result.order.seller.id !== userId) {
        return ApiResponse.unauthorized(res, 'Access denied');
      }

      return ApiResponse.success(res, {
        order: result
      });

    } catch (error) {
      console.error('Get order details error:', error);
      return ApiResponse.serverError(res, error.message);
    }
  };

  getEscrowDetails = async (req, res) => {
    try {
      const { escrowAddress } = req.params;

      const details = await this.escrowService.getEscrowDetails(escrowAddress);

      return ApiResponse.success(res, {
        escrow: details
      });

    } catch (error) {
      console.error('Get escrow details error:', error);
      return ApiResponse.serverError(res, error.message);
    }
  };

  getBalances =  async (req, res) => {
    try {
      const userId = req.user.id;

      console.log(`Fetching balances for user ${userId}`);

      const balances = await this.escrowService.getUserTokenBalances(userId);

      return ApiResponse.success(res, {balances, message: "Balance Retrieved Successfully!"})

    } catch (error) {
      console.error('Get balances error:', error);
      return ApiResponse.serverError(res, error.messag || 'Failed to retrieve balances', error.response?.data);
    }
  }
}

export default EscrowController;