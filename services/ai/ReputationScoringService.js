import { Op } from 'sequelize';
import db from '../../models/index.js';

const { User, Product } = db;

/**
 * AI-Powered Reputation and Credit Scoring Service
 * Calculates dynamic reputation scores based on on-chain and off-chain data
 */
class ReputationScoringService {
  constructor() {
    this.scoringWeights = {
      // On-chain factors (40% total)
      escrowHistory: 0.15,
      disputeHistory: 0.10,
      transactionVolume: 0.10,
      blockchainActivity: 0.05,
      
      // Off-chain factors (60% total)
      socialVerification: 0.20,
      productQuality: 0.15,
      responseTime: 0.10,
      userReviews: 0.10,
      accountAge: 0.05
    };

    this.reputationTiers = {
      excellent: { min: 0.9, max: 1.0, label: 'Excellent', color: '#10B981' },
      good: { min: 0.7, max: 0.89, label: 'Good', color: '#3B82F6' },
      fair: { min: 0.5, max: 0.69, label: 'Fair', color: '#F59E0B' },
      poor: { min: 0.3, max: 0.49, label: 'Poor', color: '#EF4444' },
      veryPoor: { min: 0.0, max: 0.29, label: 'Very Poor', color: '#DC2626' }
    };
  }

  async initialize() {
    console.log('⭐ Initializing Reputation Scoring Service...');
    return { success: true, message: 'Reputation scoring service ready' };
  }

  /**
   * Calculate comprehensive reputation score for a user
   */
  async calculateUserReputation(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      console.log(`📊 Calculating reputation score for user: ${user.username}`);

      // Calculate all reputation factors in parallel
      const [
        escrowScore,
        disputeScore,
        transactionScore,
        blockchainScore,
        socialScore,
        productScore,
        responseScore,
        reviewScore,
        ageScore
      ] = await Promise.all([
        this.calculateEscrowHistoryScore(userId),
        this.calculateDisputeHistoryScore(userId),
        this.calculateTransactionVolumeScore(userId),
        this.calculateBlockchainActivityScore(userId),
        this.calculateSocialVerificationScore(userId),
        this.calculateProductQualityScore(userId),
        this.calculateResponseTimeScore(userId),
        this.calculateUserReviewScore(userId),
        this.calculateAccountAgeScore(user)
      ]);

      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore({
        escrowHistory: escrowScore,
        disputeHistory: disputeScore,
        transactionVolume: transactionScore,
        blockchainActivity: blockchainScore,
        socialVerification: socialScore,
        productQuality: productScore,
        responseTime: responseScore,
        userReviews: reviewScore,
        accountAge: ageScore
      });

      // Determine reputation tier
      const reputationTier = this.getReputationTier(overallScore);

      // Generate reputation insights
      const insights = this.generateReputationInsights({
        escrowHistory: escrowScore,
        disputeHistory: disputeScore,
        transactionVolume: transactionScore,
        blockchainActivity: blockchainScore,
        socialVerification: socialScore,
        productQuality: productScore,
        responseTime: responseScore,
        userReviews: reviewScore,
        accountAge: ageScore
      });

      // Update user's reputation score in database
      await this.updateUserReputationScore(userId, overallScore, reputationTier);

      return {
        success: true,
        userId,
        overallScore,
        reputationTier,
        breakdown: {
          escrowHistory: escrowScore,
          disputeHistory: disputeScore,
          transactionVolume: transactionScore,
          blockchainActivity: blockchainScore,
          socialVerification: socialScore,
          productQuality: productScore,
          responseTime: responseScore,
          userReviews: reviewScore,
          accountAge: ageScore
        },
        insights,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating user reputation:', error);
      throw new Error(`Reputation calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate escrow history score
   */
  async calculateEscrowHistoryScore(userId) {
    try {
      // For MVP, we'll simulate escrow data
      // In production, this would query actual blockchain escrow contracts
      
      const mockEscrowData = {
        totalEscrows: Math.floor(Math.random() * 50) + 1,
        successfulEscrows: Math.floor(Math.random() * 45) + 1,
        failedEscrows: Math.floor(Math.random() * 5),
        averageEscrowAmount: Math.random() * 1000 + 100,
        totalEscrowVolume: Math.random() * 50000 + 1000
      };

      let score = 0;

      // Success rate (40% weight)
      const successRate = mockEscrowData.successfulEscrows / mockEscrowData.totalEscrows;
      score += successRate * 0.4;

      // Volume factor (30% weight)
      const volumeScore = Math.min(mockEscrowData.totalEscrowVolume / 10000, 1.0);
      score += volumeScore * 0.3;

      // Consistency factor (30% weight)
      const consistencyScore = Math.min(mockEscrowData.totalEscrows / 20, 1.0);
      score += consistencyScore * 0.3;

      return {
        score: Math.min(score, 1.0),
        data: mockEscrowData,
        reason: successRate > 0.9 ? 'Excellent escrow history' : 'Good escrow history'
      };
    } catch (error) {
      console.error('Error calculating escrow history score:', error);
      return { score: 0.5, reason: 'Escrow history unavailable' };
    }
  }

  /**
   * Calculate dispute history score
   */
  async calculateDisputeHistoryScore(userId) {
    try {
      // For MVP, we'll simulate dispute data
      const mockDisputeData = {
        totalDisputes: Math.floor(Math.random() * 10),
        resolvedDisputes: Math.floor(Math.random() * 8),
        wonDisputes: Math.floor(Math.random() * 6),
        lostDisputes: Math.floor(Math.random() * 3),
        averageResolutionTime: Math.random() * 72 + 24 // 24-96 hours
      };

      let score = 0.8; // Start with good score

      // Dispute frequency penalty
      if (mockDisputeData.totalDisputes > 5) {
        score -= 0.3;
      } else if (mockDisputeData.totalDisputes > 2) {
        score -= 0.1;
      }

      // Win rate factor
      if (mockDisputeData.totalDisputes > 0) {
        const winRate = mockDisputeData.wonDisputes / mockDisputeData.totalDisputes;
        score += (winRate - 0.5) * 0.2; // Bonus for high win rate, penalty for low
      }

      // Resolution time factor
      if (mockDisputeData.averageResolutionTime < 48) {
        score += 0.1;
      } else if (mockDisputeData.averageResolutionTime > 72) {
        score -= 0.1;
      }

      return {
        score: Math.max(Math.min(score, 1.0), 0.0),
        data: mockDisputeData,
        reason: mockDisputeData.totalDisputes === 0 ? 'No disputes' : 'Dispute history considered'
      };
    } catch (error) {
      console.error('Error calculating dispute history score:', error);
      return { score: 0.7, reason: 'Dispute history unavailable' };
    }
  }

  /**
   * Calculate transaction volume score
   */
  async calculateTransactionVolumeScore(userId) {
    try {
      // Get user's products to estimate transaction volume
      const products = await Product.findAll({
        where: { seller_id: userId },
        attributes: ['price', 'quantity', 'status']
      });

      const totalValue = products.reduce((sum, product) => {
        if (product.status === 'active') {
          return sum + (parseFloat(product.price) * parseInt(product.quantity));
        }
        return sum;
      }, 0);

      const mockTransactionData = {
        totalTransactions: Math.floor(Math.random() * 100) + 1,
        totalVolume: totalValue + Math.random() * 10000,
        averageTransactionValue: Math.random() * 500 + 50,
        monthlyVolume: Math.random() * 5000 + 500
      };

      let score = 0;

      // Volume factor (50% weight)
      const volumeScore = Math.min(mockTransactionData.totalVolume / 20000, 1.0);
      score += volumeScore * 0.5;

      // Transaction count factor (30% weight)
      const countScore = Math.min(mockTransactionData.totalTransactions / 50, 1.0);
      score += countScore * 0.3;

      // Consistency factor (20% weight)
      const consistencyScore = Math.min(mockTransactionData.monthlyVolume / 2000, 1.0);
      score += consistencyScore * 0.2;

      return {
        score: Math.min(score, 1.0),
        data: mockTransactionData,
        reason: volumeScore > 0.7 ? 'High transaction volume' : 'Moderate transaction volume'
      };
    } catch (error) {
      console.error('Error calculating transaction volume score:', error);
      return { score: 0.5, reason: 'Transaction volume unavailable' };
    }
  }

  /**
   * Calculate blockchain activity score
   */
  async calculateBlockchainActivityScore(userId) {
    try {
      const user = await User.findByPk(userId);
      
      // For MVP, we'll simulate blockchain activity
      const mockBlockchainData = {
        walletAge: user ? (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0,
        transactionCount: Math.floor(Math.random() * 200) + 10,
        gasSpent: Math.random() * 0.1 + 0.01,
        smartContractInteractions: Math.floor(Math.random() * 50) + 5,
        hasDeFiActivity: Math.random() > 0.5
      };

      let score = 0;

      // Wallet age factor (30% weight)
      const ageScore = Math.min(mockBlockchainData.walletAge / 365, 1.0);
      score += ageScore * 0.3;

      // Transaction activity (40% weight)
      const activityScore = Math.min(mockBlockchainData.transactionCount / 100, 1.0);
      score += activityScore * 0.4;

      // Smart contract interactions (20% weight)
      const contractScore = Math.min(mockBlockchainData.smartContractInteractions / 25, 1.0);
      score += contractScore * 0.2;

      // DeFi activity bonus (10% weight)
      if (mockBlockchainData.hasDeFiActivity) {
        score += 0.1;
      }

      return {
        score: Math.min(score, 1.0),
        data: mockBlockchainData,
        reason: activityScore > 0.7 ? 'Active blockchain user' : 'Moderate blockchain activity'
      };
    } catch (error) {
      console.error('Error calculating blockchain activity score:', error);
      return { score: 0.5, reason: 'Blockchain activity unavailable' };
    }
  }

  /**
   * Calculate social verification score
   */
  async calculateSocialVerificationScore(userId) {
    try {
      // For MVP, we'll simulate social verification data
      const mockSocialData = {
        instagramVerified: Math.random() > 0.3,
        facebookVerified: Math.random() > 0.4,
        whatsappVerified: Math.random() > 0.2,
        linkedinVerified: Math.random() > 0.6,
        totalSocialConnections: Math.floor(Math.random() * 1000) + 100,
        socialEngagement: Math.random() * 0.1 + 0.02
      };

      let score = 0;

      // Platform verification (60% weight)
      const verifiedPlatforms = [
        mockSocialData.instagramVerified,
        mockSocialData.facebookVerified,
        mockSocialData.whatsappVerified,
        mockSocialData.linkedinVerified
      ].filter(Boolean).length;

      score += (verifiedPlatforms / 4) * 0.6;

      // Social connections (20% weight)
      const connectionScore = Math.min(mockSocialData.totalSocialConnections / 500, 1.0);
      score += connectionScore * 0.2;

      // Engagement rate (20% weight)
      const engagementScore = Math.min(mockSocialData.socialEngagement / 0.05, 1.0);
      score += engagementScore * 0.2;

      return {
        score: Math.min(score, 1.0),
        data: mockSocialData,
        reason: verifiedPlatforms >= 3 ? 'Well verified on social media' : 'Partial social verification'
      };
    } catch (error) {
      console.error('Error calculating social verification score:', error);
      return { score: 0.4, reason: 'Social verification unavailable' };
    }
  }

  /**
   * Calculate product quality score
   */
  async calculateProductQualityScore(userId) {
    try {
      const products = await Product.findAll({
        where: { seller_id: userId },
        attributes: ['status', 'ai_verification_score', 'price', 'quantity']
      });

      if (products.length === 0) {
        return { score: 0.3, reason: 'No products listed' };
      }

      const qualityData = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        flaggedProducts: products.filter(p => p.status === 'flagged').length,
        avgVerificationScore: 0,
        priceRange: { min: 0, max: 0 },
        totalValue: 0
      };

      // Calculate average verification score
      const verifiedProducts = products.filter(p => p.ai_verification_score !== null);
      if (verifiedProducts.length > 0) {
        qualityData.avgVerificationScore = verifiedProducts.reduce(
          (sum, p) => sum + parseFloat(p.ai_verification_score), 0
        ) / verifiedProducts.length;
      }

      // Calculate price range and total value
      const prices = products.map(p => parseFloat(p.price));
      qualityData.priceRange.min = Math.min(...prices);
      qualityData.priceRange.max = Math.max(...prices);
      qualityData.totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.quantity)), 0);

      let score = 0;

      // Active product ratio (30% weight)
      const activeRatio = qualityData.activeProducts / qualityData.totalProducts;
      score += activeRatio * 0.3;

      // Flagged product penalty (20% weight)
      const flaggedRatio = qualityData.flaggedProducts / qualityData.totalProducts;
      score += (1 - flaggedRatio) * 0.2;

      // Verification score (30% weight)
      score += qualityData.avgVerificationScore * 0.3;

      // Product diversity (20% weight)
      const priceRange = qualityData.priceRange.max - qualityData.priceRange.min;
      const diversityScore = Math.min(priceRange / 1000, 1.0);
      score += diversityScore * 0.2;

      return {
        score: Math.min(score, 1.0),
        data: qualityData,
        reason: activeRatio > 0.8 ? 'High quality products' : 'Mixed product quality'
      };
    } catch (error) {
      console.error('Error calculating product quality score:', error);
      return { score: 0.5, reason: 'Product quality analysis failed' };
    }
  }

  /**
   * Calculate response time score
   */
  async calculateResponseTimeScore(userId) {
    try {
      // For MVP, we'll simulate response time data
      const mockResponseData = {
        avgResponseTime: Math.random() * 24 + 1, // 1-24 hours
        responseRate: Math.random() * 0.3 + 0.7, // 70-100%
        totalMessages: Math.floor(Math.random() * 100) + 10,
        urgentResponseTime: Math.random() * 6 + 1 // 1-6 hours for urgent
      };

      let score = 0;

      // Average response time (40% weight)
      if (mockResponseData.avgResponseTime <= 6) {
        score += 0.4;
      } else if (mockResponseData.avgResponseTime <= 12) {
        score += 0.3;
      } else if (mockResponseData.avgResponseTime <= 24) {
        score += 0.2;
      } else {
        score += 0.1;
      }

      // Response rate (30% weight)
      score += mockResponseData.responseRate * 0.3;

      // Urgent response time (30% weight)
      if (mockResponseData.urgentResponseTime <= 2) {
        score += 0.3;
      } else if (mockResponseData.urgentResponseTime <= 4) {
        score += 0.2;
      } else {
        score += 0.1;
      }

      return {
        score: Math.min(score, 1.0),
        data: mockResponseData,
        reason: mockResponseData.avgResponseTime <= 6 ? 'Fast response time' : 'Moderate response time'
      };
    } catch (error) {
      console.error('Error calculating response time score:', error);
      return { score: 0.6, reason: 'Response time data unavailable' };
    }
  }

  /**
   * Calculate user review score
   */
  async calculateUserReviewScore(userId) {
    try {
      // For MVP, we'll simulate review data
      const mockReviewData = {
        totalReviews: Math.floor(Math.random() * 50) + 1,
        averageRating: Math.random() * 2 + 3, // 3-5 stars
        positiveReviews: Math.floor(Math.random() * 40) + 5,
        negativeReviews: Math.floor(Math.random() * 10),
        recentReviews: Math.floor(Math.random() * 20) + 1
      };

      let score = 0;

      // Average rating (50% weight)
      const ratingScore = (mockReviewData.averageRating - 1) / 4; // Convert 1-5 to 0-1
      score += ratingScore * 0.5;

      // Review volume (20% weight)
      const volumeScore = Math.min(mockReviewData.totalReviews / 30, 1.0);
      score += volumeScore * 0.2;

      // Positive ratio (20% weight)
      const positiveRatio = mockReviewData.positiveReviews / mockReviewData.totalReviews;
      score += positiveRatio * 0.2;

      // Recent activity (10% weight)
      const recentScore = Math.min(mockReviewData.recentReviews / 10, 1.0);
      score += recentScore * 0.1;

      return {
        score: Math.min(score, 1.0),
        data: mockReviewData,
        reason: ratingScore > 0.8 ? 'Excellent reviews' : 'Good reviews'
      };
    } catch (error) {
      console.error('Error calculating user review score:', error);
      return { score: 0.7, reason: 'Review data unavailable' };
    }
  }

  /**
   * Calculate account age score
   */
  async calculateAccountAgeScore(user) {
    try {
      const accountAge = Date.now() - new Date(user.createdAt).getTime();
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

      const ageData = {
        daysSinceCreation,
        monthsSinceCreation: daysSinceCreation / 30,
        yearsSinceCreation: daysSinceCreation / 365
      };

      let score = 0;

      if (daysSinceCreation >= 365) {
        score = 1.0; // 1+ years
      } else if (daysSinceCreation >= 180) {
        score = 0.8; // 6+ months
      } else if (daysSinceCreation >= 90) {
        score = 0.6; // 3+ months
      } else if (daysSinceCreation >= 30) {
        score = 0.4; // 1+ month
      } else {
        score = 0.2; // Less than 1 month
      }

      return {
        score,
        data: ageData,
        reason: daysSinceCreation >= 365 ? 'Established account' : 'New account'
      };
    } catch (error) {
      console.error('Error calculating account age score:', error);
      return { score: 0.3, reason: 'Account age calculation failed' };
    }
  }

  /**
   * Calculate weighted overall score
   */
  calculateWeightedScore(scores) {
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(this.scoringWeights).forEach(([factor, weight]) => {
      if (scores[factor] && typeof scores[factor].score === 'number') {
        totalScore += scores[factor].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * Get reputation tier based on score
   */
  getReputationTier(score) {
    for (const [tier, config] of Object.entries(this.reputationTiers)) {
      if (score >= config.min && score <= config.max) {
        return {
          tier,
          label: config.label,
          color: config.color,
          min: config.min,
          max: config.max
        };
      }
    }
    return this.reputationTiers.veryPoor;
  }

  /**
   * Generate reputation insights
   */
  generateReputationInsights(scores) {
    const insights = {
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    Object.entries(scores).forEach(([factor, data]) => {
      if (data && typeof data.score === 'number') {
        if (data.score >= 0.8) {
          insights.strengths.push(`${factor}: ${data.reason}`);
        } else if (data.score <= 0.4) {
          insights.weaknesses.push(`${factor}: ${data.reason}`);
        }
      }
    });

    // Generate recommendations based on weaknesses
    if (insights.weaknesses.length > 0) {
      insights.recommendations.push('Focus on improving areas with low scores');
      insights.recommendations.push('Consider additional verification steps');
    }

    if (insights.strengths.length > 0) {
      insights.recommendations.push('Maintain current high-performing areas');
    }

    return insights;
  }

  /**
   * Update user's reputation score in database
   */
  async updateUserReputationScore(userId, score, tier) {
    try {
      await User.update(
        {
          reputationScore: score,
          reputationTier: tier.tier,
          reputationUpdatedAt: new Date()
        },
        { where: { id: userId } }
      );
    } catch (error) {
      console.error('Error updating user reputation score:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get reputation statistics
   */
  async getStats() {
    try {
      const totalUsers = await User.count();
      const usersWithReputation = await User.count({
        where: { reputationScore: { [Op.ne]: null } }
      });

      const avgReputation = await User.findAll({
        attributes: [
          [db.Sequelize.fn('AVG', db.Sequelize.col('reputationScore')), 'avg_score']
        ],
        where: { reputationScore: { [Op.ne]: null } }
      });

      return {
        totalUsers,
        usersWithReputation,
        avgReputation: parseFloat(avgReputation[0]?.get('avg_score') || 0),
        reputationRate: totalUsers > 0 ? (usersWithReputation / totalUsers) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting reputation stats:', error);
      return { error: 'Failed to get reputation statistics' };
    }
  }

  /**
   * Batch update reputation scores for multiple users
   */
  async batchUpdateReputations(userIds) {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.calculateUserReputation(userId))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        processed: userIds.length,
        successful,
        failed,
        results: results.map((result, index) => ({
          userId: userIds[index],
          status: result.status,
          data: result.status === 'fulfilled' ? result.value : result.reason
        }))
      };
    } catch (error) {
      console.error('Error in batch reputation update:', error);
      throw new Error(`Batch reputation update failed: ${error.message}`);
    }
  }
}

export default ReputationScoringService;
