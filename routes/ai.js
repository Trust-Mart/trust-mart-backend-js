import express from 'express';
import AIService from '../services/ai/AIService.js';
import { ApiResponse } from '../utils/apiResponse.js';

const router = express.Router();
const aiService = new AIService();

// Initialize AI service
aiService.initialize().catch(console.error);

/**
 * @route POST /api/v1/ai/social/link
 * @desc Link a social media account for seller verification
 * @access Private
 */
router.post('/social/link', async (req, res) => {
  try {
    const { platform, accountData, accessToken } = req.body;
    const userId = req.user.id;

    if (!platform || !accountData) {
      return ApiResponse.badRequest(res, 'Platform and account data are required');
    }

    const result = await aiService.linkSocialAccount(userId, platform, accountData, accessToken);
    return ApiResponse.success(res, { message: 'Social account linked successfully', data: result });
  } catch (error) {
    console.error('Error linking social account:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route GET /api/v1/ai/social/accounts
 * @desc Get user's linked social accounts
 * @access Private
 */
router.get('/social/accounts', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await aiService.getUserLinkedAccounts(userId);
    return ApiResponse.success(res, { message: 'Linked accounts retrieved successfully', data: result });
  } catch (error) {
    console.error('Error getting linked accounts:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route DELETE /api/v1/ai/social/unlink/:platform
 * @desc Unlink a social media account
 * @access Private
 */
router.delete('/social/unlink/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.id;

    const result = await aiService.unlinkSocialAccount(userId, platform);
    return ApiResponse.success(res, { message: 'Social account unlinked successfully', data: result });
  } catch (error) {
    console.error('Error unlinking social account:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route POST /api/v1/ai/legitimacy/monitor
 * @desc Monitor user legitimacy
 * @access Private
 */
router.post('/legitimacy/monitor', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await aiService.monitorUserLegitimacy(userId);
    return ApiResponse.success(res, { message: 'Legitimacy monitoring completed', data: result });
  } catch (error) {
    console.error('Error monitoring legitimacy:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route POST /api/v1/ai/behavior/monitor
 * @desc Monitor user behavior
 * @access Private
 */
router.post('/behavior/monitor', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await aiService.monitorUserBehavior(userId);
    return ApiResponse.success(res, { message: 'Behavior monitoring completed', data: result });
  } catch (error) {
    console.error('Error monitoring behavior:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route POST /api/v1/ai/seller/score
 * @desc Calculate seller score
 * @access Private
 */
router.post('/seller/score', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await aiService.calculateSellerScore(userId);
    return ApiResponse.success(res, { message: 'Seller score calculated successfully', data: result });
  } catch (error) {
    console.error('Error calculating seller score:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route GET /api/v1/ai/seller/score
 * @desc Get seller score
 * @access Private
 */
router.get('/seller/score', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await aiService.getSellerScore(userId);
    return ApiResponse.success(res, { message: 'Seller score retrieved successfully', data: result });
  } catch (error) {
    console.error('Error getting seller score:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route GET /api/v1/ai/seller/top
 * @desc Get top sellers by score
 * @access Public
 */
router.get('/seller/top', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await aiService.getTopSellers(parseInt(limit));
    return ApiResponse.success(res, { message: 'Top sellers retrieved successfully', data: result });
  } catch (error) {
    console.error('Error getting top sellers:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route POST /api/v1/ai/product/verify
 * @desc Verify a product with AI
 * @access Private
 */
router.post('/product/verify', async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    const result = await aiService.processProductVerification(productId);
    return ApiResponse.success(res, { message: 'Product verification completed', data: result });
  } catch (error) {
    console.error('Error verifying product:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route POST /api/v1/ai/batch/process
 * @desc Batch process products for AI verification
 * @access Private (Admin only)
 */
router.post('/batch/process', async (req, res) => {
  try {
    const { limit = 10 } = req.body;
    const result = await aiService.batchProcessProducts(parseInt(limit));
    return ApiResponse.success(res, { message: 'Batch processing completed', data: result });
  } catch (error) {
    console.error('Error in batch processing:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route GET /api/v1/ai/insights
 * @desc Get AI insights for admin dashboard
 * @access Private (Admin only)
 */
router.get('/insights', async (req, res) => {
  try {
    const result = await aiService.getAIInsights();
    return ApiResponse.success(res, { message: 'AI insights retrieved successfully', data: result });
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route POST /api/v1/ai/reputation/update
 * @desc Update user reputation score
 * @access Private
 */
router.post('/reputation/update', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await aiService.updateUserReputation(userId);
    return ApiResponse.success(res, { message: 'Reputation updated successfully', data: result });
  } catch (error) {
    console.error('Error updating reputation:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

/**
 * @route POST /api/v1/ai/dispute/process
 * @desc Process dispute with AI assistance
 * @access Private
 */
router.post('/dispute/process', async (req, res) => {
  try {
    const disputeData = req.body;
    const result = await aiService.processDispute(disputeData);
    return ApiResponse.success(res, { message: 'Dispute processed successfully', data: result });
  } catch (error) {
    console.error('Error processing dispute:', error);
    return ApiResponse.serverError(res, error.message);
  }
});

export default router;
