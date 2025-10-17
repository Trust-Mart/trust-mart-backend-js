import { Op } from 'sequelize';
import db from '../../models/index.js';
import SocialAccountLinkingService from './SocialAccountLinkingService.js';
import LegitimacyMonitoringService from './LegitimacyMonitoringService.js';
import BehaviorMonitoringService from './BehaviorMonitoringService.js';
import FraudDetectionService from './FraudDetectionService.js';

const { User, Product } = db;

/**
 * Comprehensive Seller Scoring Service
 * Similar to Talent Protocol's builder score but for sellers
 * Combines all AI analysis to generate a comprehensive seller score
 */
class SellerScoringService {
  constructor() {
    this.scoringWeights = {
      // Social Verification (25%)
      socialVerification: 0.25,
      
      // Legitimacy Monitoring (20%)
      legitimacyScore: 0.20,
      
      // Behavior Analysis (20%)
      behaviorScore: 0.20,
      
      // Fraud Detection (15%)
      fraudScore: 0.15,
      
      // Transaction History (10%)
      transactionHistory: 0.10,
      
      // Product Quality (10%)
      productQuality: 0.10
    };

    this.scoreTiers = {
      excellent: { min: 0.9, max: 1.0, label: 'Excellent', color: '#10B981', badge: '🏆' },
      veryGood: { min: 0.8, max: 0.89, label: 'Very Good', color: '#3B82F6', badge: '⭐' },
      good: { min: 0.7, max: 0.79, label: 'Good', color: '#8B5CF6', badge: '👍' },
      fair: { min: 0.6, max: 0.69, label: 'Fair', color: '#F59E0B', badge: '👌' },
      poor: { min: 0.4, max: 0.59, label: 'Poor', color: '#EF4444', badge: '⚠️' },
      veryPoor: { min: 0.0, max: 0.39, label: 'Very Poor', color: '#DC2626', badge: '🚫' }
    };

    // Initialize sub-services
    this.socialLinking = new SocialAccountLinkingService();
    this.legitimacyMonitoring = new LegitimacyMonitoringService();
    this.behaviorMonitoring = new BehaviorMonitoringService();
    this.fraudDetection = new FraudDetectionService();
  }

  async initialize() {
    console.log('📊 Initializing Seller Scoring Service...');
    
    // Initialize sub-services
    await Promise.all([
      this.socialLinking.initialize(),
      this.legitimacyMonitoring.initialize(),
      this.behaviorMonitoring.initialize(),
      this.fraudDetection.initialize()
    ]);

    // Start scoring scheduler
    this.startScoringScheduler();
    
    return { success: true, message: 'Seller scoring service ready' };
  }

  /**
   * Start the scoring scheduler
   */
  startScoringScheduler() {
    // Update scores every 6 hours
    setInterval(async () => {
      try {
        await this.processScoringQueue();
      } catch (error) {
        console.error('Error in scoring scheduler:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('📈 Seller scoring scheduler started');
  }

  /**
   * Process scoring queue for all sellers
   */
  async processScoringQueue() {
    try {
      const sellers = await User.findAll({
        where: {
          roles: { [Op.contains]: ['seller'] },
          [Op.or]: [
            { lastScoreUpdate: null },
            { lastScoreUpdate: { [Op.lt]: new Date(Date.now() - 6 * 60 * 60 * 1000) } } // 6 hours
          ]
        },
        limit: 50 // Process 50 sellers at a time
      });

      console.log(`📊 Processing seller scores for ${sellers.length} sellers`);

      for (const seller of sellers) {
        try {
          await this.calculateSellerScore(seller.id);
        } catch (error) {
          console.error(`Error calculating score for seller ${seller.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing scoring queue:', error);
    }
  }

  /**
   * Calculate comprehensive seller score
   */
  async calculateSellerScore(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      console.log(`📊 Calculating seller score for: ${user.username}`);

      // Calculate all score components in parallel
      const [
        socialVerificationScore,
        legitimacyScore,
        behaviorScore,
        fraudScore,
        transactionScore,
        productQualityScore
      ] = await Promise.all([
        this.calculateSocialVerificationScore(userId),
        this.calculateLegitimacyScore(userId),
        this.calculateBehaviorScore(userId),
        this.calculateFraudScore(userId),
        this.calculateTransactionScore(userId),
        this.calculateProductQualityScore(userId)
      ]);

      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore({
        socialVerification: socialVerificationScore,
        legitimacyScore: legitimacyScore,
        behaviorScore: behaviorScore,
        fraudScore: fraudScore,
        transactionHistory: transactionScore,
        productQuality: productQualityScore
      });

      // Determine score tier
      const scoreTier = this.getScoreTier(overallScore);

      // Generate insights and recommendations
      const insights = this.generateInsights({
        socialVerification: socialVerificationScore,
        legitimacyScore: legitimacyScore,
        behaviorScore: behaviorScore,
        fraudScore: fraudScore,
        transactionHistory: transactionScore,
        productQuality: productQualityScore
      });

      // Update user's seller score
      await this.updateSellerScore(userId, overallScore, scoreTier, {
        socialVerification: socialVerificationScore,
        legitimacyScore: legitimacyScore,
        behaviorScore: behaviorScore,
        fraudScore: fraudScore,
        transactionHistory: transactionScore,
        productQuality: productQualityScore
      });

      return {
        success: true,
        userId,
        overallScore,
        scoreTier,
        breakdown: {
          socialVerification: socialVerificationScore,
          legitimacyScore: legitimacyScore,
          behaviorScore: behaviorScore,
          fraudScore: fraudScore,
          transactionHistory: transactionScore,
          productQuality: productQualityScore
        },
        insights,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating seller score:', error);
      throw new Error(`Seller score calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate social verification score
   */
  async calculateSocialVerificationScore(userId) {
    try {
      const linkedAccounts = await this.socialLinking.getUserLinkedAccounts(userId);
      
      if (!linkedAccounts.success || linkedAccounts.accounts.length === 0) {
        return {
          score: 0.2,
          reason: 'No social accounts linked',
          details: { linkedAccounts: 0 }
        };
      }

      const accounts = linkedAccounts.accounts;
      let totalScore = 0;
      let verifiedAccounts = 0;

      // Calculate score for each linked account
      accounts.forEach(account => {
        if (account.verificationScore && account.verificationScore > 0.5) {
          totalScore += account.verificationScore;
          verifiedAccounts++;
        }
      });

      const avgScore = verifiedAccounts > 0 ? totalScore / verifiedAccounts : 0;
      const platformBonus = this.calculatePlatformBonus(accounts);

      const finalScore = Math.min(avgScore + platformBonus, 1.0);

      return {
        score: finalScore,
        reason: verifiedAccounts > 0 ? `${verifiedAccounts} verified accounts` : 'No verified accounts',
        details: {
          linkedAccounts: accounts.length,
          verifiedAccounts,
          avgScore,
          platformBonus,
          platforms: accounts.map(a => a.platform)
        }
      };
    } catch (error) {
      console.error('Error calculating social verification score:', error);
      return { score: 0.3, reason: 'Social verification analysis failed', details: {} };
    }
  }

  /**
   * Calculate legitimacy score
   */
  async calculateLegitimacyScore(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['legitimacyScore', 'legitimacyRiskLevel', 'lastLegitimacyCheck']
      });

      if (!user || !user.legitimacyScore) {
        return {
          score: 0.5,
          reason: 'Legitimacy not assessed',
          details: { assessed: false }
        };
      }

      const legitimacyScore = parseFloat(user.legitimacyScore);
      const riskLevel = user.legitimacyRiskLevel;

      return {
        score: legitimacyScore,
        reason: `Legitimacy: ${riskLevel} risk`,
        details: {
          assessed: true,
          riskLevel,
          lastCheck: user.lastLegitimacyCheck
        }
      };
    } catch (error) {
      console.error('Error calculating legitimacy score:', error);
      return { score: 0.5, reason: 'Legitimacy analysis failed', details: {} };
    }
  }

  /**
   * Calculate behavior score
   */
  async calculateBehaviorScore(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['behaviorScore', 'behaviorRiskLevel', 'lastBehaviorCheck']
      });

      if (!user || !user.behaviorScore) {
        return {
          score: 0.5,
          reason: 'Behavior not assessed',
          details: { assessed: false }
        };
      }

      const behaviorScore = parseFloat(user.behaviorScore);
      const riskLevel = user.behaviorRiskLevel;

      return {
        score: behaviorScore,
        reason: `Behavior: ${riskLevel} risk`,
        details: {
          assessed: true,
          riskLevel,
          lastCheck: user.lastBehaviorCheck
        }
      };
    } catch (error) {
      console.error('Error calculating behavior score:', error);
      return { score: 0.5, reason: 'Behavior analysis failed', details: {} };
    }
  }

  /**
   * Calculate fraud score
   */
  async calculateFraudScore(userId) {
    try {
      // Get user's products for fraud analysis
      const products = await Product.findAll({
        where: { seller_id: userId },
        limit: 10 // Analyze recent products
      });

      if (products.length === 0) {
        return {
          score: 0.7,
          reason: 'No products to analyze',
          details: { productsAnalyzed: 0 }
        };
      }

      // Analyze each product for fraud
      const fraudAnalyses = await Promise.all(
        products.map(product => this.fraudDetection.analyzeProduct(product))
      );

      // Calculate average fraud score
      const avgFraudScore = fraudAnalyses.reduce((sum, analysis) => sum + analysis.score, 0) / fraudAnalyses.length;

      return {
        score: avgFraudScore,
        reason: avgFraudScore > 0.7 ? 'Low fraud risk' : 'Fraud risk detected',
        details: {
          productsAnalyzed: products.length,
          avgScore: avgFraudScore,
          highRiskProducts: fraudAnalyses.filter(a => a.score < 0.5).length
        }
      };
    } catch (error) {
      console.error('Error calculating fraud score:', error);
      return { score: 0.5, reason: 'Fraud analysis failed', details: {} };
    }
  }

  /**
   * Calculate transaction history score
   */
  async calculateTransactionScore(userId) {
    try {
      // For MVP, we'll simulate transaction data
      // In production, this would analyze actual transaction history
      
      const mockTransactionData = {
        totalTransactions: Math.floor(Math.random() * 100) + 1,
        successfulTransactions: Math.floor(Math.random() * 95) + 1,
        failedTransactions: Math.floor(Math.random() * 5),
        totalVolume: Math.random() * 50000 + 1000,
        averageTransactionValue: Math.random() * 500 + 50,
        disputeRate: Math.random() * 0.05, // 0-5%
        refundRate: Math.random() * 0.02, // 0-2%
        averageRating: Math.random() * 2 + 3 // 3-5 stars
      };

      let score = 0.8; // Start with good score

      // Success rate factor (40% weight)
      const successRate = mockTransactionData.successfulTransactions / mockTransactionData.totalTransactions;
      score += (successRate - 0.8) * 0.4;

      // Volume factor (20% weight)
      const volumeScore = Math.min(mockTransactionData.totalVolume / 20000, 1.0);
      score += volumeScore * 0.2;

      // Dispute rate penalty (20% weight)
      if (mockTransactionData.disputeRate > 0.02) {
        score -= (mockTransactionData.disputeRate - 0.02) * 10;
      }

      // Rating factor (20% weight)
      const ratingScore = (mockTransactionData.averageRating - 1) / 4; // Convert 1-5 to 0-1
      score += ratingScore * 0.2;

      return {
        score: Math.max(0, Math.min(score, 1.0)),
        reason: successRate > 0.9 ? 'Excellent transaction history' : 'Good transaction history',
        details: mockTransactionData
      };
    } catch (error) {
      console.error('Error calculating transaction score:', error);
      return { score: 0.5, reason: 'Transaction analysis failed', details: {} };
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
        return {
          score: 0.3,
          reason: 'No products listed',
          details: { totalProducts: 0 }
        };
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
        reason: activeRatio > 0.8 ? 'High quality products' : 'Mixed product quality',
        details: qualityData
      };
    } catch (error) {
      console.error('Error calculating product quality score:', error);
      return { score: 0.5, reason: 'Product quality analysis failed', details: {} };
    }
  }

  /**
   * Calculate platform bonus for social verification
   */
  calculatePlatformBonus(accounts) {
    const platformWeights = {
      facebook: 0.1,
      instagram: 0.15,
      whatsapp: 0.1,
      contact: 0.05
    };

    let bonus = 0;
    const linkedPlatforms = new Set(accounts.map(a => a.platform));

    linkedPlatforms.forEach(platform => {
      if (platformWeights[platform]) {
        bonus += platformWeights[platform];
      }
    });

    return Math.min(bonus, 0.2); // Max 20% bonus
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
   * Get score tier based on overall score
   */
  getScoreTier(score) {
    for (const [tier, config] of Object.entries(this.scoreTiers)) {
      if (score >= config.min && score <= config.max) {
        return {
          tier,
          label: config.label,
          color: config.color,
          badge: config.badge,
          min: config.min,
          max: config.max
        };
      }
    }
    return this.scoreTiers.veryPoor;
  }

  /**
   * Generate insights and recommendations
   */
  generateInsights(scores) {
    const insights = {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      riskFactors: []
    };

    Object.entries(scores).forEach(([factor, data]) => {
      if (data && typeof data.score === 'number') {
        if (data.score >= 0.8) {
          insights.strengths.push(`${factor}: ${data.reason}`);
        } else if (data.score <= 0.4) {
          insights.weaknesses.push(`${factor}: ${data.reason}`);
          insights.riskFactors.push(factor);
        }
      }
    });

    // Generate recommendations based on weaknesses
    if (insights.weaknesses.length > 0) {
      insights.recommendations.push('Focus on improving areas with low scores');
      
      if (insights.riskFactors.includes('socialVerification')) {
        insights.recommendations.push('Link and verify more social media accounts');
      }
      if (insights.riskFactors.includes('legitimacyScore')) {
        insights.recommendations.push('Improve account legitimacy and authenticity');
      }
      if (insights.riskFactors.includes('behaviorScore')) {
        insights.recommendations.push('Review and improve account behavior patterns');
      }
      if (insights.riskFactors.includes('fraudScore')) {
        insights.recommendations.push('Review product listings for compliance');
      }
      if (insights.riskFactors.includes('transactionHistory')) {
        insights.recommendations.push('Focus on successful transaction completion');
      }
      if (insights.riskFactors.includes('productQuality')) {
        insights.recommendations.push('Improve product quality and descriptions');
      }
    }

    if (insights.strengths.length > 0) {
      insights.recommendations.push('Maintain current high-performing areas');
    }

    return insights;
  }

  /**
   * Update seller score in database
   */
  async updateSellerScore(userId, overallScore, scoreTier, breakdown) {
    try {
      await User.update(
        {
          sellerScore: overallScore,
          sellerScoreTier: scoreTier.tier,
          sellerScoreLabel: scoreTier.label,
          sellerScoreColor: scoreTier.color,
          sellerScoreBadge: scoreTier.badge,
          lastScoreUpdate: new Date(),
          scoreBreakdown: breakdown
        },
        { where: { id: userId } }
      );

      console.log(`📊 Updated seller score for user ${userId}: ${overallScore.toFixed(3)} (${scoreTier.label})`);
    } catch (error) {
      console.error('Error updating seller score:', error);
    }
  }

  /**
   * Get seller score for a specific user
   */
  async getSellerScore(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: [
          'id', 'username', 'email', 'sellerScore', 'sellerScoreTier', 
          'sellerScoreLabel', 'sellerScoreColor', 'sellerScoreBadge',
          'lastScoreUpdate', 'scoreBreakdown'
        ]
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.sellerScore) {
        return {
          success: false,
          message: 'Seller score not calculated yet',
          userId
        };
      }

      return {
        success: true,
        userId,
        score: parseFloat(user.sellerScore),
        tier: {
          name: user.sellerScoreTier,
          label: user.sellerScoreLabel,
          color: user.sellerScoreColor,
          badge: user.sellerScoreBadge
        },
        breakdown: user.scoreBreakdown || {},
        lastUpdated: user.lastScoreUpdate
      };
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
      const topSellers = await User.findAll({
        where: {
          sellerScore: { [Op.ne]: null },
          roles: { [Op.contains]: ['seller'] }
        },
        attributes: [
          'id', 'username', 'email', 'sellerScore', 'sellerScoreTier',
          'sellerScoreLabel', 'sellerScoreColor', 'sellerScoreBadge'
        ],
        order: [['sellerScore', 'DESC']],
        limit
      });

      return {
        success: true,
        sellers: topSellers.map(seller => ({
          id: seller.id,
          username: seller.username,
          email: seller.email,
          score: parseFloat(seller.sellerScore),
          tier: {
            name: seller.sellerScoreTier,
            label: seller.sellerScoreLabel,
            color: seller.sellerScoreColor,
            badge: seller.sellerScoreBadge
          }
        })),
        count: topSellers.length
      };
    } catch (error) {
      console.error('Error getting top sellers:', error);
      throw new Error(`Failed to get top sellers: ${error.message}`);
    }
  }

  /**
   * Get seller scoring statistics
   */
  async getScoringStats() {
    try {
      const totalSellers = await User.count({
        where: { roles: { [Op.contains]: ['seller'] } }
      });

      const scoredSellers = await User.count({
        where: {
          sellerScore: { [Op.ne]: null },
          roles: { [Op.contains]: ['seller'] }
        }
      });

      const avgScore = await User.findAll({
        attributes: [
          [db.Sequelize.fn('AVG', db.Sequelize.col('sellerScore')), 'avg_score']
        ],
        where: {
          sellerScore: { [Op.ne]: null },
          roles: { [Op.contains]: ['seller'] }
        }
      });

      const tierDistribution = await User.findAll({
        attributes: [
          'sellerScoreTier',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
        ],
        where: {
          sellerScoreTier: { [Op.ne]: null },
          roles: { [Op.contains]: ['seller'] }
        },
        group: ['sellerScoreTier']
      });

      return {
        totalSellers,
        scoredSellers,
        scoringRate: totalSellers > 0 ? (scoredSellers / totalSellers) * 100 : 0,
        avgScore: parseFloat(avgScore[0]?.get('avg_score') || 0),
        tierDistribution: tierDistribution.reduce((acc, item) => {
          acc[item.sellerScoreTier] = parseInt(item.get('count'));
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting scoring stats:', error);
      return { error: 'Failed to get scoring statistics' };
    }
  }

  /**
   * Batch calculate scores for multiple sellers
   */
  async batchCalculateScores(userIds) {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.calculateSellerScore(userId))
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
      console.error('Error in batch score calculation:', error);
      throw new Error(`Batch score calculation failed: ${error.message}`);
    }
  }
}

export default SellerScoringService;
