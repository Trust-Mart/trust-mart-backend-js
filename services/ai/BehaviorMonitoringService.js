import { Op } from 'sequelize';
import db from '../../models/index.js';

const { User, Product } = db;

/**
 * Behavior Monitoring Service
 * Monitors user behavior patterns to detect abnormal activities
 * Similar to fraud detection but focused on behavioral patterns
 */
class BehaviorMonitoringService {
  constructor() {
    this.behaviorPatterns = {
      // Listing behavior
      listing: {
        rapidListing: 10, // More than 10 listings in 24 hours
        duplicateListings: 5, // More than 5 similar listings
        priceManipulation: 0.5, // 50% price variation
        suspiciousKeywords: ['urgent', 'limited', 'free', 'guaranteed']
      },
      
      // Communication behavior
      communication: {
        responseTime: 24, // Hours
        messageFrequency: 50, // Messages per day
        spamPatterns: ['buy now', 'limited time', 'act fast'],
        suspiciousLanguage: ['crypto', 'investment', 'get rich']
      },
      
      // Transaction behavior
      transaction: {
        highValueThreshold: 1000, // USD
        rapidTransactions: 5, // More than 5 transactions in 24 hours
        unusualHours: [0, 1, 2, 3, 4, 5], // Midnight to 5 AM
        weekendActivity: 0.8 // 80% weekend activity is suspicious
      },
      
      // Account behavior
      account: {
        multipleAccounts: 3, // More than 3 accounts from same IP
        accountAge: 7, // Days
        verificationDelay: 24, // Hours to verify
        profileChanges: 5 // More than 5 profile changes per day
      }
    };

    this.riskLevels = {
      low: { min: 0.8, max: 1.0, action: 'monitor' },
      medium: { min: 0.5, max: 0.79, action: 'flag' },
      high: { min: 0.2, max: 0.49, action: 'restrict' },
      critical: { min: 0.0, max: 0.19, action: 'suspend' }
    };
  }

  async initialize() {
    console.log('🔍 Initializing Behavior Monitoring Service...');
    
    // Start behavior monitoring scheduler
    this.startBehaviorMonitoring();
    
    return { success: true, message: 'Behavior monitoring service ready' };
  }

  /**
   * Start behavior monitoring scheduler
   */
  startBehaviorMonitoring() {
    // Monitor behavior every hour
    setInterval(async () => {
      try {
        await this.processBehaviorMonitoring();
      } catch (error) {
        console.error('Error in behavior monitoring:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    console.log('📊 Behavior monitoring scheduler started');
  }

  /**
   * Process behavior monitoring for all users
   */
  async processBehaviorMonitoring() {
    try {
      // Get users who need behavior monitoring
      const users = await User.findAll({
        where: {
          [Op.or]: [
            { lastBehaviorCheck: null },
            { lastBehaviorCheck: { [Op.lt]: new Date(Date.now() - 6 * 60 * 60 * 1000) } } // 6 hours
          ]
        },
        limit: 100 // Process 100 users at a time
      });

      console.log(`🔍 Processing behavior monitoring for ${users.length} users`);

      for (const user of users) {
        try {
          await this.monitorUserBehavior(user.id);
        } catch (error) {
          console.error(`Error monitoring behavior for user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing behavior monitoring:', error);
    }
  }

  /**
   * Monitor behavior of a specific user
   */
  async monitorUserBehavior(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return;
      }

      console.log(`🔍 Monitoring behavior for user: ${user.username}`);

      // Analyze different behavior patterns
      const [
        listingBehavior,
        communicationBehavior,
        transactionBehavior,
        accountBehavior
      ] = await Promise.all([
        this.analyzeListingBehavior(userId),
        this.analyzeCommunicationBehavior(userId),
        this.analyzeTransactionBehavior(userId),
        this.analyzeAccountBehavior(user)
      ]);

      // Calculate overall behavior score
      const behaviorScore = this.calculateBehaviorScore({
        listing: listingBehavior,
        communication: communicationBehavior,
        transaction: transactionBehavior,
        account: accountBehavior
      });

      // Determine risk level and actions
      const riskLevel = this.determineRiskLevel(behaviorScore);
      const actions = this.determineActions(riskLevel, {
        listing: listingBehavior,
        communication: communicationBehavior,
        transaction: transactionBehavior,
        account: accountBehavior
      });

      // Update user's behavior status
      await this.updateUserBehaviorStatus(userId, behaviorScore, riskLevel, {
        listing: listingBehavior,
        communication: communicationBehavior,
        transaction: transactionBehavior,
        account: accountBehavior
      });

      // Execute actions if needed
      if (actions.length > 0) {
        await this.executeActions(userId, actions);
      }

      return {
        success: true,
        userId,
        behaviorScore,
        riskLevel,
        actions,
        analysis: {
          listing: listingBehavior,
          communication: communicationBehavior,
          transaction: transactionBehavior,
          account: accountBehavior
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error monitoring user behavior:', error);
      throw new Error(`Behavior monitoring failed: ${error.message}`);
    }
  }

  /**
   * Analyze listing behavior patterns
   */
  async analyzeListingBehavior(userId) {
    try {
      const products = await Product.findAll({
        where: { seller_id: userId },
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      if (products.length === 0) {
        return {
          score: 0.8,
          risk: 'low',
          patterns: ['No listing history'],
          details: { totalListings: 0 }
        };
      }

      const analysis = {
        totalListings: products.length,
        recentListings: 0,
        duplicateListings: 0,
        priceVariations: [],
        suspiciousKeywords: 0,
        rapidListing: false,
        details: {}
      };

      // Analyze recent listings (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      analysis.recentListings = products.filter(p => new Date(p.createdAt) > oneDayAgo).length;

      // Check for rapid listing
      if (analysis.recentListings > this.behaviorPatterns.listing.rapidListing) {
        analysis.rapidListing = true;
      }

      // Analyze for duplicate listings
      const productNames = products.map(p => p.name.toLowerCase());
      const nameCounts = {};
      productNames.forEach(name => {
        nameCounts[name] = (nameCounts[name] || 0) + 1;
      });
      analysis.duplicateListings = Object.values(nameCounts).filter(count => count > 1).length;

      // Analyze price variations
      const prices = products.map(p => parseFloat(p.price));
      if (prices.length > 1) {
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        analysis.priceVariations = prices.map(price => Math.abs(price - avgPrice) / avgPrice);
      }

      // Check for suspicious keywords
      const descriptions = products.map(p => p.descrption || '').join(' ').toLowerCase();
      analysis.suspiciousKeywords = this.behaviorPatterns.listing.suspiciousKeywords.filter(
        keyword => descriptions.includes(keyword)
      ).length;

      // Calculate risk score
      let riskScore = 1.0;

      if (analysis.rapidListing) riskScore -= 0.3;
      if (analysis.duplicateListings > this.behaviorPatterns.listing.duplicateListings) riskScore -= 0.2;
      if (analysis.suspiciousKeywords > 0) riskScore -= 0.2;
      if (analysis.priceVariations.some(variation => variation > this.behaviorPatterns.listing.priceManipulation)) {
        riskScore -= 0.1;
      }

      const risk = this.getRiskLevel(riskScore);

      return {
        score: Math.max(0, riskScore),
        risk,
        patterns: this.getListingPatterns(analysis),
        details: analysis
      };
    } catch (error) {
      console.error('Error analyzing listing behavior:', error);
      return { score: 0.5, risk: 'medium', patterns: ['Analysis failed'], details: {} };
    }
  }

  /**
   * Analyze communication behavior patterns
   */
  async analyzeCommunicationBehavior(userId) {
    try {
      // For MVP, we'll simulate communication data
      // In production, this would analyze actual message data
      
      const mockCommunicationData = {
        totalMessages: Math.floor(Math.random() * 200) + 10,
        responseTime: Math.random() * 48 + 1, // 1-48 hours
        messageFrequency: Math.random() * 100 + 5, // Messages per day
        spamKeywords: Math.floor(Math.random() * 5),
        suspiciousLanguage: Math.floor(Math.random() * 3),
        weekendActivity: Math.random(),
        unusualHours: Math.random() * 0.3 // 0-30% activity at unusual hours
      };

      let riskScore = 1.0;
      const patterns = [];

      // Check response time
      if (mockCommunicationData.responseTime > this.behaviorPatterns.communication.responseTime) {
        riskScore -= 0.2;
        patterns.push('Slow response time');
      }

      // Check message frequency
      if (mockCommunicationData.messageFrequency > this.behaviorPatterns.communication.messageFrequency) {
        riskScore -= 0.2;
        patterns.push('High message frequency');
      }

      // Check for spam patterns
      if (mockCommunicationData.spamKeywords > 0) {
        riskScore -= 0.3;
        patterns.push('Spam keywords detected');
      }

      // Check for suspicious language
      if (mockCommunicationData.suspiciousLanguage > 0) {
        riskScore -= 0.2;
        patterns.push('Suspicious language detected');
      }

      // Check weekend activity
      if (mockCommunicationData.weekendActivity > this.behaviorPatterns.transaction.weekendActivity) {
        riskScore -= 0.1;
        patterns.push('High weekend activity');
      }

      // Check unusual hours
      if (mockCommunicationData.unusualHours > 0.2) {
        riskScore -= 0.1;
        patterns.push('Activity at unusual hours');
      }

      const risk = this.getRiskLevel(riskScore);

      return {
        score: Math.max(0, riskScore),
        risk,
        patterns,
        details: mockCommunicationData
      };
    } catch (error) {
      console.error('Error analyzing communication behavior:', error);
      return { score: 0.5, risk: 'medium', patterns: ['Analysis failed'], details: {} };
    }
  }

  /**
   * Analyze transaction behavior patterns
   */
  async analyzeTransactionBehavior(userId) {
    try {
      // For MVP, we'll simulate transaction data
      // In production, this would analyze actual transaction data
      
      const mockTransactionData = {
        totalTransactions: Math.floor(Math.random() * 50) + 1,
        recentTransactions: Math.floor(Math.random() * 10),
        highValueTransactions: Math.floor(Math.random() * 5),
        averageTransactionValue: Math.random() * 500 + 50,
        weekendTransactions: Math.random(),
        unusualHourTransactions: Math.random() * 0.3,
        failedTransactions: Math.floor(Math.random() * 3),
        disputeRate: Math.random() * 0.1
      };

      let riskScore = 1.0;
      const patterns = [];

      // Check for rapid transactions
      if (mockTransactionData.recentTransactions > this.behaviorPatterns.transaction.rapidTransactions) {
        riskScore -= 0.3;
        patterns.push('Rapid transaction activity');
      }

      // Check for high-value transactions
      if (mockTransactionData.highValueTransactions > 0) {
        riskScore -= 0.1;
        patterns.push('High-value transactions');
      }

      // Check weekend activity
      if (mockTransactionData.weekendTransactions > this.behaviorPatterns.transaction.weekendActivity) {
        riskScore -= 0.1;
        patterns.push('High weekend transaction activity');
      }

      // Check unusual hours
      if (mockTransactionData.unusualHourTransactions > 0.2) {
        riskScore -= 0.1;
        patterns.push('Transactions at unusual hours');
      }

      // Check failed transactions
      if (mockTransactionData.failedTransactions > 0) {
        riskScore -= 0.2;
        patterns.push('Failed transactions detected');
      }

      // Check dispute rate
      if (mockTransactionData.disputeRate > 0.05) {
        riskScore -= 0.2;
        patterns.push('High dispute rate');
      }

      const risk = this.getRiskLevel(riskScore);

      return {
        score: Math.max(0, riskScore),
        risk,
        patterns,
        details: mockTransactionData
      };
    } catch (error) {
      console.error('Error analyzing transaction behavior:', error);
      return { score: 0.5, risk: 'medium', patterns: ['Analysis failed'], details: {} };
    }
  }

  /**
   * Analyze account behavior patterns
   */
  async analyzeAccountBehavior(user) {
    try {
      const accountAge = Date.now() - new Date(user.createdAt).getTime();
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

      const analysis = {
        accountAge: daysSinceCreation,
        isNewAccount: daysSinceCreation < this.behaviorPatterns.account.accountAge,
        hasMultipleAccounts: false, // Would check IP addresses in production
        profileChanges: Math.floor(Math.random() * 10), // Simulated
        verificationDelay: Math.random() * 48 + 1, // Hours
        lastLogin: user.lastLoginAt,
        loginFrequency: Math.random() * 10 + 1 // Logins per day
      };

      let riskScore = 1.0;
      const patterns = [];

      // Check if new account
      if (analysis.isNewAccount) {
        riskScore -= 0.2;
        patterns.push('New account');
      }

      // Check for multiple accounts
      if (analysis.hasMultipleAccounts) {
        riskScore -= 0.3;
        patterns.push('Multiple accounts detected');
      }

      // Check profile changes
      if (analysis.profileChanges > this.behaviorPatterns.account.profileChanges) {
        riskScore -= 0.1;
        patterns.push('Frequent profile changes');
      }

      // Check verification delay
      if (analysis.verificationDelay > this.behaviorPatterns.account.verificationDelay) {
        riskScore -= 0.1;
        patterns.push('Delayed verification');
      }

      // Check login frequency
      if (analysis.loginFrequency > 20) {
        riskScore -= 0.1;
        patterns.push('Unusual login frequency');
      }

      const risk = this.getRiskLevel(riskScore);

      return {
        score: Math.max(0, riskScore),
        risk,
        patterns,
        details: analysis
      };
    } catch (error) {
      console.error('Error analyzing account behavior:', error);
      return { score: 0.5, risk: 'medium', patterns: ['Analysis failed'], details: {} };
    }
  }

  /**
   * Calculate overall behavior score
   */
  calculateBehaviorScore(analyses) {
    const weights = {
      listing: 0.3,
      communication: 0.25,
      transaction: 0.25,
      account: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(analyses).forEach(([category, analysis]) => {
      if (analysis && typeof analysis.score === 'number') {
        totalScore += analysis.score * weights[category];
        totalWeight += weights[category];
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * Determine risk level based on behavior score
   */
  determineRiskLevel(score) {
    for (const [level, config] of Object.entries(this.riskLevels)) {
      if (score >= config.min && score <= config.max) {
        return level;
      }
    }
    return 'medium';
  }

  /**
   * Determine actions based on risk level and patterns
   */
  determineActions(riskLevel, analyses) {
    const actions = [];

    switch (riskLevel) {
      case 'critical':
        actions.push('suspend_account');
        actions.push('flag_for_review');
        actions.push('notify_admin');
        break;
      case 'high':
        actions.push('restrict_listing');
        actions.push('require_verification');
        actions.push('flag_for_review');
        break;
      case 'medium':
        actions.push('monitor_closely');
        actions.push('send_warning');
        break;
      case 'low':
        actions.push('continue_monitoring');
        break;
    }

    // Add specific actions based on patterns
    Object.entries(analyses).forEach(([category, analysis]) => {
      if (analysis.patterns && analysis.patterns.length > 0) {
        if (analysis.patterns.includes('Rapid listing activity')) {
          actions.push('limit_listing_frequency');
        }
        if (analysis.patterns.includes('Spam keywords detected')) {
          actions.push('content_review');
        }
        if (analysis.patterns.includes('High dispute rate')) {
          actions.push('escrow_required');
        }
      }
    });

    return [...new Set(actions)]; // Remove duplicates
  }

  /**
   * Execute actions based on behavior analysis
   */
  async executeActions(userId, actions) {
    try {
      console.log(`🔧 Executing actions for user ${userId}:`, actions);

      for (const action of actions) {
        switch (action) {
          case 'suspend_account':
            await this.suspendAccount(userId);
            break;
          case 'flag_for_review':
            await this.flagForReview(userId);
            break;
          case 'restrict_listing':
            await this.restrictListing(userId);
            break;
          case 'require_verification':
            await this.requireVerification(userId);
            break;
          case 'monitor_closely':
            await this.setCloseMonitoring(userId);
            break;
          case 'send_warning':
            await this.sendWarning(userId);
            break;
          case 'limit_listing_frequency':
            await this.limitListingFrequency(userId);
            break;
          case 'content_review':
            await this.flagContentForReview(userId);
            break;
          case 'escrow_required':
            await this.requireEscrow(userId);
            break;
        }
      }
    } catch (error) {
      console.error('Error executing actions:', error);
    }
  }

  /**
   * Update user's behavior status
   */
  async updateUserBehaviorStatus(userId, behaviorScore, riskLevel, analyses) {
    try {
      await User.update(
        {
          behaviorScore,
          behaviorRiskLevel: riskLevel,
          lastBehaviorCheck: new Date(),
          behaviorHistory: {
            score: behaviorScore,
            riskLevel,
            analyses,
            timestamp: new Date()
          }
        },
        { where: { id: userId } }
      );
    } catch (error) {
      console.error('Error updating user behavior status:', error);
    }
  }

  // Helper methods
  getRiskLevel(score) {
    if (score >= 0.8) return 'low';
    if (score >= 0.5) return 'medium';
    if (score >= 0.2) return 'high';
    return 'critical';
  }

  getListingPatterns(analysis) {
    const patterns = [];
    if (analysis.rapidListing) patterns.push('Rapid listing activity');
    if (analysis.duplicateListings > 0) patterns.push('Duplicate listings detected');
    if (analysis.suspiciousKeywords > 0) patterns.push('Suspicious keywords used');
    if (analysis.priceVariations.some(v => v > 0.5)) patterns.push('Price manipulation detected');
    return patterns;
  }

  // Action execution methods (simplified for MVP)
  async suspendAccount(userId) {
    console.log(`🚫 Suspending account for user ${userId}`);
    // Implementation would suspend user account
  }

  async flagForReview(userId) {
    console.log(`🚩 Flagging user ${userId} for review`);
    // Implementation would flag user for admin review
  }

  async restrictListing(userId) {
    console.log(`📝 Restricting listing for user ${userId}`);
    // Implementation would restrict user's listing capabilities
  }

  async requireVerification(userId) {
    console.log(`✅ Requiring verification for user ${userId}`);
    // Implementation would require additional verification
  }

  async setCloseMonitoring(userId) {
    console.log(`👁️ Setting close monitoring for user ${userId}`);
    // Implementation would set user for close monitoring
  }

  async sendWarning(userId) {
    console.log(`⚠️ Sending warning to user ${userId}`);
    // Implementation would send warning message to user
  }

  async limitListingFrequency(userId) {
    console.log(`⏰ Limiting listing frequency for user ${userId}`);
    // Implementation would limit how often user can list products
  }

  async flagContentForReview(userId) {
    console.log(`📋 Flagging content for review for user ${userId}`);
    // Implementation would flag user's content for review
  }

  async requireEscrow(userId) {
    console.log(`🔒 Requiring escrow for user ${userId}`);
    // Implementation would require escrow for user's transactions
  }

  /**
   * Get behavior monitoring statistics
   */
  async getBehaviorStats() {
    try {
      const totalUsers = await User.count();
      const monitoredUsers = await User.count({
        where: { behaviorScore: { [Op.ne]: null } }
      });

      const riskDistribution = await User.findAll({
        attributes: [
          'behaviorRiskLevel',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
        ],
        where: { behaviorRiskLevel: { [Op.ne]: null } },
        group: ['behaviorRiskLevel']
      });

      const avgScore = await User.findAll({
        attributes: [
          [db.Sequelize.fn('AVG', db.Sequelize.col('behaviorScore')), 'avg_score']
        ],
        where: { behaviorScore: { [Op.ne]: null } }
      });

      return {
        totalUsers,
        monitoredUsers,
        monitoringRate: totalUsers > 0 ? (monitoredUsers / totalUsers) * 100 : 0,
        avgBehaviorScore: parseFloat(avgScore[0]?.get('avg_score') || 0),
        riskDistribution: riskDistribution.reduce((acc, item) => {
          acc[item.behaviorRiskLevel] = parseInt(item.get('count'));
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting behavior stats:', error);
      return { error: 'Failed to get behavior statistics' };
    }
  }
}

export default BehaviorMonitoringService;
