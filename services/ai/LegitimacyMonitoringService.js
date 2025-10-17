import { Op } from 'sequelize';
import db from '../../models/index.js';
import axios from 'axios';

const { User } = db;

/**
 * Legitimacy Monitoring Service
 * Continuously monitors linked social media accounts for legitimacy
 * Detects fake accounts, suspicious behavior, and account changes
 */
class LegitimacyMonitoringService {
  constructor() {
    this.monitoringIntervals = {
      high_risk: 1 * 60 * 60 * 1000, // 1 hour
      medium_risk: 6 * 60 * 60 * 1000, // 6 hours
      low_risk: 24 * 60 * 60 * 1000, // 24 hours
      new_account: 12 * 60 * 60 * 1000 // 12 hours
    };

    this.legitimacyThresholds = {
      excellent: 0.9,
      good: 0.7,
      fair: 0.5,
      poor: 0.3,
      critical: 0.1
    };

    this.suspiciousPatterns = {
      // Follower patterns
      fakeFollowers: {
        suddenSpike: 0.5, // 50% increase in followers
        lowEngagement: 0.01, // Less than 1% engagement
        botPattern: 0.8 // 80% of followers are bots
      },
      
      // Content patterns
      contentQuality: {
        duplicateContent: 0.3, // 30% duplicate content
        spamKeywords: 0.2, // 20% spam keywords
        stolenImages: 0.4 // 40% stolen images
      },
      
      // Behavior patterns
      behavior: {
        rapidPosting: 10, // More than 10 posts per hour
        unusualHours: 0.3, // 30% posts at unusual hours
        deletedPosts: 0.5 // 50% posts deleted
      }
    };
  }

  async initialize() {
    console.log('👁️ Initializing Legitimacy Monitoring Service...');
    
    // Start monitoring scheduler
    this.startMonitoringScheduler();
    
    return { success: true, message: 'Legitimacy monitoring service ready' };
  }

  /**
   * Start the monitoring scheduler
   */
  startMonitoringScheduler() {
    // Check every 30 minutes for accounts that need monitoring
    setInterval(async () => {
      try {
        await this.processMonitoringQueue();
      } catch (error) {
        console.error('Error in monitoring scheduler:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    console.log('📅 Monitoring scheduler started');
  }

  /**
   * Process accounts that need monitoring
   */
  async processMonitoringQueue() {
    try {
      const users = await User.findAll({
        where: {
          socialAccounts: { [Op.ne]: null },
          [Op.or]: [
            { lastLegitimacyCheck: null },
            { lastLegitimacyCheck: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
          ]
        },
        limit: 50 // Process 50 users at a time
      });

      console.log(`🔍 Processing ${users.length} users for legitimacy monitoring`);

      for (const user of users) {
        try {
          await this.monitorUserLegitimacy(user.id);
        } catch (error) {
          console.error(`Error monitoring user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing monitoring queue:', error);
    }
  }

  /**
   * Monitor legitimacy of a specific user's social accounts
   */
  async monitorUserLegitimacy(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.socialAccounts) {
        return;
      }

      console.log(`🔍 Monitoring legitimacy for user: ${user.username}`);

      const monitoringResults = [];

      // Monitor each linked social account
      for (const account of user.socialAccounts) {
        try {
          const result = await this.monitorAccountLegitimacy(userId, account);
          monitoringResults.push(result);
        } catch (error) {
          console.error(`Error monitoring ${account.platform} account:`, error);
          monitoringResults.push({
            platform: account.platform,
            success: false,
            error: error.message
          });
        }
      }

      // Calculate overall legitimacy score
      const overallScore = this.calculateOverallLegitimacyScore(monitoringResults);

      // Update user's legitimacy status
      await this.updateUserLegitimacyStatus(userId, overallScore, monitoringResults);

      return {
        success: true,
        userId,
        overallScore,
        results: monitoringResults,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error monitoring user legitimacy:', error);
      throw new Error(`Legitimacy monitoring failed: ${error.message}`);
    }
  }

  /**
   * Monitor legitimacy of a specific social account
   */
  async monitorAccountLegitimacy(userId, account) {
    try {
      const platform = account.platform;
      console.log(`🔍 Monitoring ${platform} account legitimacy`);

      // Get current account data
      const currentData = await this.fetchCurrentAccountData(platform, account);
      
      // Compare with stored data
      const changes = this.detectAccountChanges(account, currentData);
      
      // Analyze for suspicious patterns
      const suspiciousPatterns = await this.detectSuspiciousPatterns(platform, currentData);
      
      // Calculate legitimacy score
      const legitimacyScore = this.calculateAccountLegitimacyScore(
        currentData, 
        changes, 
        suspiciousPatterns
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(legitimacyScore);

      return {
        platform,
        success: true,
        legitimacyScore,
        riskLevel,
        changes,
        suspiciousPatterns,
        currentData,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Error monitoring ${account.platform} account:`, error);
      return {
        platform: account.platform,
        success: false,
        error: error.message,
        legitimacyScore: 0.3, // Default low score on error
        riskLevel: 'high'
      };
    }
  }

  /**
   * Fetch current account data from social media platform
   */
  async fetchCurrentAccountData(platform, account) {
    try {
      switch (platform) {
        case 'facebook':
          return await this.fetchFacebookData(account);
        case 'instagram':
          return await this.fetchInstagramData(account);
        case 'whatsapp':
          return await this.fetchWhatsAppData(account);
        case 'contact':
          return await this.fetchContactData(account);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error fetching ${platform} data:`, error);
      throw error;
    }
  }

  /**
   * Fetch Facebook account data
   */
  async fetchFacebookData(account) {
    try {
      // In production, this would make actual API calls to Facebook Graph API
      // For MVP, we'll simulate the data with some variations
      
      const baseData = account.data || {};
      const variation = 0.1; // 10% variation

      return {
        id: baseData.id,
        name: baseData.name,
        friends: Math.floor(baseData.friends * (1 + (Math.random() - 0.5) * variation)),
        posts: Math.floor(baseData.posts * (1 + (Math.random() - 0.5) * variation)),
        engagementRate: Math.max(0, baseData.engagementRate + (Math.random() - 0.5) * 0.02),
        verified: baseData.verified,
        lastPostTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
        profilePicture: baseData.profilePicture || null,
        accountAge: baseData.accountAge + Math.floor(Math.random() * 7) // Add some days
      };
    } catch (error) {
      throw new Error(`Facebook data fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch Instagram account data
   */
  async fetchInstagramData(account) {
    try {
      // In production, this would make actual API calls to Instagram Graph API
      const baseData = account.data || {};
      const variation = 0.1;

      return {
        id: baseData.id,
        username: baseData.username,
        followers_count: Math.floor(baseData.followers_count * (1 + (Math.random() - 0.5) * variation)),
        follows_count: Math.floor(baseData.follows_count * (1 + (Math.random() - 0.5) * variation)),
        media_count: Math.floor(baseData.media_count * (1 + (Math.random() - 0.5) * variation)),
        engagementRate: Math.max(0, baseData.engagementRate + (Math.random() - 0.5) * 0.02),
        account_type: baseData.account_type,
        isVerified: baseData.isVerified,
        lastPostTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Last 3 days
        profilePicture: baseData.profilePicture || null,
        accountAge: baseData.accountAge + Math.floor(Math.random() * 3)
      };
    } catch (error) {
      throw new Error(`Instagram data fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch WhatsApp account data
   */
  async fetchWhatsAppData(account) {
    try {
      const baseData = account.data || {};
      const variation = 0.1;

      return {
        phone_number: baseData.phone_number,
        display_name: baseData.display_name,
        isBusiness: baseData.isBusiness,
        responseTime: Math.max(1, baseData.responseTime + (Math.random() - 0.5) * 2),
        messageCount: Math.floor(baseData.messageCount * (1 + (Math.random() - 0.5) * variation)),
        lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
        profilePicture: baseData.profilePicture || null,
        accountAge: baseData.accountAge + Math.floor(Math.random() * 2)
      };
    } catch (error) {
      throw new Error(`WhatsApp data fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch contact data
   */
  async fetchContactData(account) {
    try {
      const baseData = account.data || {};

      return {
        phone_number: baseData.phone_number,
        country_code: baseData.country_code,
        verified: baseData.verified,
        carrier: baseData.carrier,
        location: baseData.location,
        lastVerified: baseData.lastVerified || new Date(),
        verificationMethod: baseData.verificationMethod
      };
    } catch (error) {
      throw new Error(`Contact data fetch failed: ${error.message}`);
    }
  }

  /**
   * Detect changes in account data
   */
  detectAccountChanges(originalAccount, currentData) {
    const changes = {
      followers: 0,
      posts: 0,
      engagement: 0,
      profile: false,
      verification: false,
      suspicious: []
    };

    const originalData = originalAccount.data || {};

    // Check follower changes
    if (originalData.followers_count && currentData.followers_count) {
      const followerChange = (currentData.followers_count - originalData.followers_count) / originalData.followers_count;
      changes.followers = followerChange;
      
      if (Math.abs(followerChange) > this.suspiciousPatterns.fakeFollowers.suddenSpike) {
        changes.suspicious.push('Sudden follower change');
      }
    }

    // Check post changes
    if (originalData.media_count && currentData.media_count) {
      const postChange = currentData.media_count - originalData.media_count;
      changes.posts = postChange;
      
      if (postChange > this.suspiciousPatterns.behavior.rapidPosting) {
        changes.suspicious.push('Rapid posting detected');
      }
    }

    // Check engagement changes
    if (originalData.engagementRate && currentData.engagementRate) {
      const engagementChange = currentData.engagementRate - originalData.engagementRate;
      changes.engagement = engagementChange;
      
      if (currentData.engagementRate < this.suspiciousPatterns.fakeFollowers.lowEngagement) {
        changes.suspicious.push('Low engagement rate');
      }
    }

    // Check profile changes
    if (originalData.name !== currentData.name || 
        originalData.username !== currentData.username ||
        originalData.display_name !== currentData.display_name) {
      changes.profile = true;
      changes.suspicious.push('Profile information changed');
    }

    // Check verification changes
    if (originalData.verified !== currentData.verified ||
        originalData.isVerified !== currentData.isVerified) {
      changes.verification = true;
      changes.suspicious.push('Verification status changed');
    }

    return changes;
  }

  /**
   * Detect suspicious patterns in account data
   */
  async detectSuspiciousPatterns(platform, accountData) {
    const patterns = {
      fakeFollowers: false,
      botActivity: false,
      spamContent: false,
      stolenContent: false,
      unusualBehavior: false,
      details: []
    };

    // Check for fake followers
    if (accountData.followers_count && accountData.engagementRate) {
      const followerEngagementRatio = accountData.engagementRate / (accountData.followers_count / 1000);
      if (followerEngagementRatio < 0.1) {
        patterns.fakeFollowers = true;
        patterns.details.push('Low engagement relative to followers');
      }
    }

    // Check for bot activity
    if (accountData.followers_count && accountData.follows_count) {
      const followRatio = accountData.follows_count / accountData.followers_count;
      if (followRatio > 2) {
        patterns.botActivity = true;
        patterns.details.push('Unusual follow ratio');
      }
    }

    // Check for unusual posting behavior
    if (accountData.lastPostTime) {
      const hoursSinceLastPost = (Date.now() - new Date(accountData.lastPostTime).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastPost > 168) { // More than a week
        patterns.unusualBehavior = true;
        patterns.details.push('Inactive for extended period');
      }
    }

    // Check for rapid changes (simulated)
    if (Math.random() < 0.1) { // 10% chance of detecting spam
      patterns.spamContent = true;
      patterns.details.push('Potential spam content detected');
    }

    return patterns;
  }

  /**
   * Calculate account legitimacy score
   */
  calculateAccountLegitimacyScore(currentData, changes, suspiciousPatterns) {
    let score = 1.0; // Start with perfect score

    // Deduct points for suspicious patterns
    if (suspiciousPatterns.fakeFollowers) score -= 0.3;
    if (suspiciousPatterns.botActivity) score -= 0.2;
    if (suspiciousPatterns.spamContent) score -= 0.2;
    if (suspiciousPatterns.stolenContent) score -= 0.3;
    if (suspiciousPatterns.unusualBehavior) score -= 0.1;

    // Deduct points for suspicious changes
    if (changes.suspicious.length > 0) {
      score -= changes.suspicious.length * 0.1;
    }

    // Deduct points for sudden changes
    if (Math.abs(changes.followers) > 0.5) score -= 0.2;
    if (changes.posts > 10) score -= 0.1;

    // Bonus points for verification
    if (currentData.verified || currentData.isVerified) {
      score += 0.1;
    }

    // Bonus points for business accounts
    if (currentData.account_type === 'BUSINESS' || currentData.isBusiness) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine risk level based on legitimacy score
   */
  determineRiskLevel(score) {
    if (score >= this.legitimacyThresholds.excellent) return 'low';
    if (score >= this.legitimacyThresholds.good) return 'medium';
    if (score >= this.legitimacyThresholds.fair) return 'medium';
    if (score >= this.legitimacyThresholds.poor) return 'high';
    return 'critical';
  }

  /**
   * Calculate overall legitimacy score for user
   */
  calculateOverallLegitimacyScore(monitoringResults) {
    if (monitoringResults.length === 0) return 0.5;

    const validResults = monitoringResults.filter(r => r.success && r.legitimacyScore !== undefined);
    if (validResults.length === 0) return 0.3;

    const totalScore = validResults.reduce((sum, result) => sum + result.legitimacyScore, 0);
    return totalScore / validResults.length;
  }

  /**
   * Update user's legitimacy status
   */
  async updateUserLegitimacyStatus(userId, overallScore, monitoringResults) {
    try {
      const riskLevel = this.determineRiskLevel(overallScore);
      
      await User.update(
        {
          legitimacyScore: overallScore,
          legitimacyRiskLevel: riskLevel,
          lastLegitimacyCheck: new Date(),
          legitimacyHistory: {
            score: overallScore,
            riskLevel,
            results: monitoringResults,
            timestamp: new Date()
          }
        },
        { where: { id: userId } }
      );

      // Log critical issues
      if (riskLevel === 'critical' || riskLevel === 'high') {
        console.warn(`⚠️ High risk legitimacy score for user ${userId}: ${overallScore}`);
      }
    } catch (error) {
      console.error('Error updating user legitimacy status:', error);
    }
  }

  /**
   * Get legitimacy monitoring statistics
   */
  async getMonitoringStats() {
    try {
      const totalUsers = await User.count();
      const monitoredUsers = await User.count({
        where: { legitimacyScore: { [Op.ne]: null } }
      });

      const riskDistribution = await User.findAll({
        attributes: [
          'legitimacyRiskLevel',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
        ],
        where: { legitimacyRiskLevel: { [Op.ne]: null } },
        group: ['legitimacyRiskLevel']
      });

      const avgScore = await User.findAll({
        attributes: [
          [db.Sequelize.fn('AVG', db.Sequelize.col('legitimacyScore')), 'avg_score']
        ],
        where: { legitimacyScore: { [Op.ne]: null } }
      });

      return {
        totalUsers,
        monitoredUsers,
        monitoringRate: totalUsers > 0 ? (monitoredUsers / totalUsers) * 100 : 0,
        avgLegitimacyScore: parseFloat(avgScore[0]?.get('avg_score') || 0),
        riskDistribution: riskDistribution.reduce((acc, item) => {
          acc[item.legitimacyRiskLevel] = parseInt(item.get('count'));
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting monitoring stats:', error);
      return { error: 'Failed to get monitoring statistics' };
    }
  }

  /**
   * Get users with high risk legitimacy scores
   */
  async getHighRiskUsers(limit = 20) {
    try {
      const highRiskUsers = await User.findAll({
        where: {
          legitimacyRiskLevel: { [Op.in]: ['high', 'critical'] }
        },
        attributes: ['id', 'username', 'email', 'legitimacyScore', 'legitimacyRiskLevel', 'lastLegitimacyCheck'],
        order: [['legitimacyScore', 'ASC']],
        limit
      });

      return {
        success: true,
        users: highRiskUsers,
        count: highRiskUsers.length
      };
    } catch (error) {
      console.error('Error getting high risk users:', error);
      throw new Error(`Failed to get high risk users: ${error.message}`);
    }
  }
}

export default LegitimacyMonitoringService;
