import axios from 'axios';
import { Op } from 'sequelize';
import db from '../../models/index.js';
import FraudDetectionService from './FraudDetectionService.js';
import SellerVerificationService from './SellerVerificationService.js';
import ReputationScoringService from './ReputationScoringService.js';
import SocialAccountLinkingService from './SocialAccountLinkingService.js';
import LegitimacyMonitoringService from './LegitimacyMonitoringService.js';
import BehaviorMonitoringService from './BehaviorMonitoringService.js';
import SellerScoringService from './SellerScoringService.js';

const { User, Product } = db;

/**
 * Main AI Service - Orchestrates all AI operations
 * This is the central hub for all AI-powered features in TrustMart
 */
class AIService {
  constructor() {
    this.fraudDetection = new FraudDetectionService();
    this.sellerVerification = new SellerVerificationService();
    this.reputationScoring = new ReputationScoringService();
    this.socialLinking = new SocialAccountLinkingService();
    this.legitimacyMonitoring = new LegitimacyMonitoringService();
    this.behaviorMonitoring = new BehaviorMonitoringService();
    this.sellerScoring = new SellerScoringService();
  }

  /**
   * Initialize AI services and models
   */
  async initialize() {
    try {
      console.log('🤖 Initializing AI services...');
      
      // Initialize all AI sub-services
      await Promise.all([
        this.fraudDetection.initialize(),
        this.sellerVerification.initialize(),
        this.reputationScoring.initialize(),
        this.socialLinking.initialize(),
        this.legitimacyMonitoring.initialize(),
        this.behaviorMonitoring.initialize(),
        this.sellerScoring.initialize()
      ]);

      console.log('✅ AI services initialized successfully');
      return { success: true, message: 'AI services ready' };
    } catch (error) {
      console.error('❌ Failed to initialize AI services:', error);
      throw new Error(`AI initialization failed: ${error.message}`);
    }
  }

  /**
   * Process new product for AI verification
   */
  async processProductVerification(productId) {
    try {
      const product = await Product.findByPk(productId, {
        include: [{ model: User, as: 'seller' }]
      });

      if (!product) {
        throw new Error('Product not found');
      }

      console.log(`🔍 Processing AI verification for product: ${product.name}`);

      // Run multiple AI checks in parallel
      const [
        fraudScore,
        sellerTrustScore,
        imageAnalysis,
        descriptionAnalysis
      ] = await Promise.all([
        this.fraudDetection.analyzeProduct(product),
        this.sellerVerification.verifySeller(product.seller),
        this.analyzeProductImages(product.image_cid),
        this.analyzeProductDescription(product.descrption)
      ]);

      // Calculate overall AI verification score
      const aiScore = this.calculateOverallScore({
        fraudScore,
        sellerTrustScore,
        imageAnalysis,
        descriptionAnalysis
      });

      // Update product with AI verification results
      await Product.update(
        { 
          ai_verification_score: aiScore,
          status: aiScore >= 0.7 ? 'active' : 'under_review'
        },
        { where: { id: productId } }
      );

      return {
        success: true,
        productId,
        aiScore,
        breakdown: {
          fraudScore,
          sellerTrustScore,
          imageAnalysis,
          descriptionAnalysis
        },
        status: aiScore >= 0.7 ? 'approved' : 'needs_review'
      };
    } catch (error) {
      console.error('Error in product verification:', error);
      throw new Error(`Product verification failed: ${error.message}`);
    }
  }

  /**
   * Analyze product images for authenticity
   */
  async analyzeProductImages(imageCids) {
    try {
      if (!imageCids || imageCids.length === 0) {
        return { score: 0.3, reason: 'No images provided' };
      }

      // Simulate image analysis (in production, use actual CV models)
      const analysisResults = await Promise.all(
        imageCids.map(async (cid) => {
          // This would integrate with actual computer vision APIs
          // For now, we'll simulate the analysis
          return {
            cid,
            authenticity: Math.random() > 0.2, // 80% chance of authentic
            quality: Math.random() * 0.4 + 0.6, // 60-100% quality
            duplicateCheck: Math.random() > 0.1 // 90% chance not duplicate
          };
        })
      );

      const avgScore = analysisResults.reduce((sum, result) => {
        let score = 0;
        if (result.authenticity) score += 0.4;
        score += result.quality * 0.3;
        if (result.duplicateCheck) score += 0.3;
        return sum + score;
      }, 0) / analysisResults.length;

      return {
        score: avgScore,
        details: analysisResults,
        reason: avgScore > 0.7 ? 'Images appear authentic' : 'Images need review'
      };
    } catch (error) {
      console.error('Error analyzing product images:', error);
      return { score: 0.5, reason: 'Image analysis failed' };
    }
  }

  /**
   * Analyze product description for quality and authenticity
   */
  async analyzeProductDescription(description) {
    try {
      if (!description || description.trim().length < 10) {
        return { score: 0.2, reason: 'Description too short' };
      }

      // Simulate NLP analysis (in production, use actual NLP models)
      const analysis = {
        length: description.length,
        hasPrice: /\$|\d+.*naira|price|cost/i.test(description),
        hasContact: /contact|call|whatsapp|phone/i.test(description),
        suspiciousWords: /free|urgent|limited|offer|deal/i.test(description),
        quality: description.length > 50 ? 0.8 : 0.4
      };

      let score = 0;
      if (analysis.hasPrice) score += 0.3;
      if (analysis.hasContact) score += 0.2;
      if (!analysis.suspiciousWords) score += 0.2;
      score += analysis.quality * 0.3;

      return {
        score: Math.min(score, 1.0),
        analysis,
        reason: score > 0.6 ? 'Description looks legitimate' : 'Description needs improvement'
      };
    } catch (error) {
      console.error('Error analyzing product description:', error);
      return { score: 0.5, reason: 'Description analysis failed' };
    }
  }

  /**
   * Calculate overall AI verification score
   */
  calculateOverallScore(scores) {
    const weights = {
      fraudScore: 0.3,
      sellerTrustScore: 0.3,
      imageAnalysis: 0.2,
      descriptionAnalysis: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(scores).forEach(([key, value]) => {
      if (value && typeof value.score === 'number') {
        totalScore += value.score * weights[key];
        totalWeight += weights[key];
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * Link social media account for seller verification
   */
  async linkSocialAccount(userId, platform, accountData, accessToken = null) {
    try {
      return await this.socialLinking.linkSocialAccount(userId, platform, accountData, accessToken);
    } catch (error) {
      console.error('Error linking social account:', error);
      throw new Error(`Social account linking failed: ${error.message}`);
    }
  }

  /**
   * Get user's linked social accounts
   */
  async getUserLinkedAccounts(userId) {
    try {
      return await this.socialLinking.getUserLinkedAccounts(userId);
    } catch (error) {
      console.error('Error getting linked accounts:', error);
      throw new Error(`Failed to get linked accounts: ${error.message}`);
    }
  }

  /**
   * Unlink social media account
   */
  async unlinkSocialAccount(userId, platform) {
    try {
      return await this.socialLinking.unlinkSocialAccount(userId, platform);
    } catch (error) {
      console.error('Error unlinking social account:', error);
      throw new Error(`Social account unlinking failed: ${error.message}`);
    }
  }

  /**
   * Monitor user legitimacy
   */
  async monitorUserLegitimacy(userId) {
    try {
      return await this.legitimacyMonitoring.monitorUserLegitimacy(userId);
    } catch (error) {
      console.error('Error monitoring user legitimacy:', error);
      throw new Error(`Legitimacy monitoring failed: ${error.message}`);
    }
  }

  /**
   * Monitor user behavior
   */
  async monitorUserBehavior(userId) {
    try {
      return await this.behaviorMonitoring.monitorUserBehavior(userId);
    } catch (error) {
      console.error('Error monitoring user behavior:', error);
      throw new Error(`Behavior monitoring failed: ${error.message}`);
    }
  }

  /**
   * Calculate comprehensive seller score
   */
  async calculateSellerScore(userId) {
    try {
      return await this.sellerScoring.calculateSellerScore(userId);
    } catch (error) {
      console.error('Error calculating seller score:', error);
      throw new Error(`Seller score calculation failed: ${error.message}`);
    }
  }

  /**
   * Get seller score for a user
   */
  async getSellerScore(userId) {
    try {
      return await this.sellerScoring.getSellerScore(userId);
    } catch (error) {
      console.error('Error getting seller score:', error);
      throw new Error(`Failed to get seller score: ${error.message}`);
    }
  }

  /**
   * Get top sellers by score
   */
  async getTopSellers(limit = 20) {
    try {
      return await this.sellerScoring.getTopSellers(limit);
    } catch (error) {
      console.error('Error getting top sellers:', error);
      throw new Error(`Failed to get top sellers: ${error.message}`);
    }
  }

  /**
   * Process dispute with AI assistance
   */
  async processDispute(disputeData) {
    try {
      return await this.disputeAssistant.processDispute(disputeData);
    } catch (error) {
      console.error('Error processing dispute:', error);
      throw new Error(`Dispute processing failed: ${error.message}`);
    }
  }

  /**
   * Update user reputation score
   */
  async updateUserReputation(userId) {
    try {
      return await this.reputationScoring.calculateUserReputation(userId);
    } catch (error) {
      console.error('Error updating user reputation:', error);
      throw new Error(`Reputation update failed: ${error.message}`);
    }
  }

  /**
   * Get AI insights for admin dashboard
   */
  async getAIInsights() {
    try {
      const [
        fraudStats,
        verificationStats,
        reputationStats,
        socialLinkingStats,
        legitimacyStats,
        behaviorStats,
        sellerScoringStats
      ] = await Promise.all([
        this.fraudDetection.getStats(),
        this.getVerificationStats(),
        this.reputationScoring.getStats(),
        this.socialLinking.getLinkingStats(),
        this.legitimacyMonitoring.getMonitoringStats(),
        this.behaviorMonitoring.getBehaviorStats(),
        this.sellerScoring.getScoringStats()
      ]);

      return {
        success: true,
        insights: {
          fraud: fraudStats,
          verification: verificationStats,
          reputation: reputationStats,
          socialLinking: socialLinkingStats,
          legitimacy: legitimacyStats,
          behavior: behaviorStats,
          sellerScoring: sellerScoringStats,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting AI insights:', error);
      throw new Error(`Failed to get AI insights: ${error.message}`);
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats() {
    try {
      const stats = await Product.findAll({
        attributes: [
          'status',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
          [db.Sequelize.fn('AVG', db.Sequelize.col('ai_verification_score')), 'avg_score']
        ],
        group: ['status']
      });

      const totalProducts = await Product.count();
      const pendingVerification = await Product.count({
        where: { ai_verification_score: null }
      });

      return {
        totalProducts,
        pendingVerification,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: parseInt(stat.get('count')),
            avgScore: parseFloat(stat.get('avg_score') || 0)
          };
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting verification stats:', error);
      return { error: 'Failed to get verification stats' };
    }
  }

  /**
   * Batch process products for AI verification
   */
  async batchProcessProducts(limit = 10) {
    try {
      const products = await Product.findAll({
        where: {
          ai_verification_score: null,
          status: 'under_review'
        },
        limit,
        include: [{ model: User, as: 'seller' }]
      });

      const results = await Promise.allSettled(
        products.map(product => this.processProductVerification(product.id))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        processed: products.length,
        successful,
        failed,
        results: results.map((result, index) => ({
          productId: products[index].id,
          status: result.status,
          data: result.status === 'fulfilled' ? result.value : result.reason
        }))
      };
    } catch (error) {
      console.error('Error in batch processing:', error);
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  }
}

export default AIService;
