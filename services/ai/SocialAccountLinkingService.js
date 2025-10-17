import { Op } from 'sequelize';
import db from '../../models/index.js';
import axios from 'axios';

const { User } = db;

/**
 * Social Account Linking Service
 * Handles linking and verification of social media accounts for sellers
 * MVP: Facebook, Instagram, WhatsApp, Contact Number
 */
class SocialAccountLinkingService {
  constructor() {
    this.supportedPlatforms = {
      facebook: {
        name: 'Facebook',
        apiUrl: 'https://graph.facebook.com/v18.0',
        requiredScopes: ['public_profile', 'email'],
        verificationFields: ['id', 'name', 'email', 'verified']
      },
      instagram: {
        name: 'Instagram',
        apiUrl: 'https://graph.instagram.com/v18.0',
        requiredScopes: ['user_profile', 'user_media'],
        verificationFields: ['id', 'username', 'account_type', 'media_count']
      },
      whatsapp: {
        name: 'WhatsApp',
        apiUrl: 'https://graph.facebook.com/v18.0',
        requiredScopes: ['whatsapp_business_messaging'],
        verificationFields: ['phone_number', 'display_name', 'profile_picture_url']
      },
      contact: {
        name: 'Contact Number',
        verificationFields: ['phone_number', 'country_code', 'verified']
      }
    };

    this.verificationCriteria = {
      minFollowers: 100,
      minPosts: 10,
      minAccountAge: 30, // days
      engagementThreshold: 0.02, // 2%
      responseTimeThreshold: 24 // hours
    };
  }

  async initialize() {
    console.log('🔗 Initializing Social Account Linking Service...');
    return { success: true, message: 'Social account linking service ready' };
  }

  /**
   * Link a social media account to a user
   */
  async linkSocialAccount(userId, platform, accountData, accessToken = null) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!this.supportedPlatforms[platform]) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      console.log(`🔗 Linking ${platform} account for user: ${user.username}`);

      // Verify the account data
      const verificationResult = await this.verifyAccountData(platform, accountData, accessToken);

      if (!verificationResult.success) {
        throw new Error(`Account verification failed: ${verificationResult.reason}`);
      }

      // Store the linked account
      const linkedAccount = await this.storeLinkedAccount(userId, platform, {
        ...accountData,
        ...verificationResult.data,
        linkedAt: new Date(),
        lastVerifiedAt: new Date(),
        verificationScore: verificationResult.score
      });

      // Update user's social accounts array
      await this.updateUserSocialAccounts(userId, platform, linkedAccount);

      // Trigger initial legitimacy check
      await this.performLegitimacyCheck(userId, platform, linkedAccount);

      return {
        success: true,
        platform,
        accountId: linkedAccount.id,
        verificationScore: verificationResult.score,
        message: `${platform} account linked successfully`
      };
    } catch (error) {
      console.error('Error linking social account:', error);
      throw new Error(`Failed to link ${platform} account: ${error.message}`);
    }
  }

  /**
   * Verify account data from social media platform
   */
  async verifyAccountData(platform, accountData, accessToken) {
    try {
      switch (platform) {
        case 'facebook':
          return await this.verifyFacebookAccount(accountData, accessToken);
        case 'instagram':
          return await this.verifyInstagramAccount(accountData, accessToken);
        case 'whatsapp':
          return await this.verifyWhatsAppAccount(accountData, accessToken);
        case 'contact':
          return await this.verifyContactNumber(accountData);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error verifying ${platform} account:`, error);
      return {
        success: false,
        reason: error.message,
        score: 0
      };
    }
  }

  /**
   * Verify Facebook account
   */
  async verifyFacebookAccount(accountData, accessToken) {
    try {
      if (!accessToken) {
        throw new Error('Facebook access token required');
      }

      // In production, make actual API call to Facebook Graph API
      const apiUrl = `${this.supportedPlatforms.facebook.apiUrl}/me`;
      const params = {
        access_token: accessToken,
        fields: this.supportedPlatforms.facebook.verificationFields.join(',')
      };

      // For MVP, simulate the API response
      const mockResponse = {
        id: accountData.id || `fb_${Date.now()}`,
        name: accountData.name || 'John Doe',
        email: accountData.email || 'john@example.com',
        verified: Math.random() > 0.3, // 70% chance of being verified
        friends: Math.floor(Math.random() * 1000) + 100,
        posts: Math.floor(Math.random() * 500) + 10,
        accountAge: Math.floor(Math.random() * 365) + 30,
        engagementRate: Math.random() * 0.1 + 0.01
      };

      // Calculate verification score
      let score = 0;
      const issues = [];

      // Check if account is verified
      if (mockResponse.verified) {
        score += 0.3;
      } else {
        issues.push('Account not verified');
      }

      // Check friend count
      if (mockResponse.friends >= this.verificationCriteria.minFollowers) {
        score += 0.2;
      } else {
        issues.push('Low friend count');
      }

      // Check post count
      if (mockResponse.posts >= this.verificationCriteria.minPosts) {
        score += 0.2;
      } else {
        issues.push('Insufficient post history');
      }

      // Check account age
      if (mockResponse.accountAge >= this.verificationCriteria.minAccountAge) {
        score += 0.2;
      } else {
        issues.push('New account');
      }

      // Check engagement rate
      if (mockResponse.engagementRate >= this.verificationCriteria.engagementThreshold) {
        score += 0.1;
      } else {
        issues.push('Low engagement rate');
      }

      return {
        success: score >= 0.5,
        score: Math.min(score, 1.0),
        data: mockResponse,
        issues,
        reason: score >= 0.7 ? 'Facebook account verified' : 'Facebook account needs improvement'
      };
    } catch (error) {
      return {
        success: false,
        reason: `Facebook verification failed: ${error.message}`,
        score: 0
      };
    }
  }

  /**
   * Verify Instagram account
   */
  async verifyInstagramAccount(accountData, accessToken) {
    try {
      if (!accessToken) {
        throw new Error('Instagram access token required');
      }

      // In production, make actual API call to Instagram Graph API
      const apiUrl = `${this.supportedPlatforms.instagram.apiUrl}/me`;
      const params = {
        access_token: accessToken,
        fields: this.supportedPlatforms.instagram.verificationFields.join(',')
      };

      // For MVP, simulate the API response
      const mockResponse = {
        id: accountData.id || `ig_${Date.now()}`,
        username: accountData.username || 'johndoe',
        account_type: Math.random() > 0.4 ? 'BUSINESS' : 'PERSONAL',
        media_count: Math.floor(Math.random() * 1000) + 10,
        followers_count: Math.floor(Math.random() * 10000) + 100,
        follows_count: Math.floor(Math.random() * 1000) + 50,
        accountAge: Math.floor(Math.random() * 365) + 30,
        engagementRate: Math.random() * 0.15 + 0.02,
        isVerified: Math.random() > 0.8 // 20% chance of being verified
      };

      // Calculate verification score
      let score = 0;
      const issues = [];

      // Check if account is verified
      if (mockResponse.isVerified) {
        score += 0.3;
      }

      // Check if business account
      if (mockResponse.account_type === 'BUSINESS') {
        score += 0.2;
      } else {
        issues.push('Personal account (business preferred)');
      }

      // Check follower count
      if (mockResponse.followers_count >= this.verificationCriteria.minFollowers) {
        score += 0.2;
      } else {
        issues.push('Low follower count');
      }

      // Check media count
      if (mockResponse.media_count >= this.verificationCriteria.minPosts) {
        score += 0.15;
      } else {
        issues.push('Insufficient post history');
      }

      // Check account age
      if (mockResponse.accountAge >= this.verificationCriteria.minAccountAge) {
        score += 0.1;
      } else {
        issues.push('New account');
      }

      // Check engagement rate
      if (mockResponse.engagementRate >= this.verificationCriteria.engagementThreshold) {
        score += 0.05;
      } else {
        issues.push('Low engagement rate');
      }

      return {
        success: score >= 0.5,
        score: Math.min(score, 1.0),
        data: mockResponse,
        issues,
        reason: score >= 0.7 ? 'Instagram account verified' : 'Instagram account needs improvement'
      };
    } catch (error) {
      return {
        success: false,
        reason: `Instagram verification failed: ${error.message}`,
        score: 0
      };
    }
  }

  /**
   * Verify WhatsApp account
   */
  async verifyWhatsAppAccount(accountData, accessToken) {
    try {
      // For MVP, we'll simulate WhatsApp verification
      // In production, this would use WhatsApp Business API
      
      const mockResponse = {
        phone_number: accountData.phone_number,
        display_name: accountData.display_name || 'WhatsApp User',
        profile_picture_url: accountData.profile_picture_url || null,
        isBusiness: Math.random() > 0.4, // 60% chance of being business
        responseTime: Math.random() * 12 + 1, // 1-12 hours
        messageCount: Math.floor(Math.random() * 100) + 10,
        accountAge: Math.floor(Math.random() * 365) + 30
      };

      // Calculate verification score
      let score = 0;
      const issues = [];

      // Check if business account
      if (mockResponse.isBusiness) {
        score += 0.4;
      } else {
        issues.push('Personal WhatsApp account');
      }

      // Check response time
      if (mockResponse.responseTime <= 6) {
        score += 0.3;
      } else {
        issues.push('Slow response time');
      }

      // Check message activity
      if (mockResponse.messageCount >= 20) {
        score += 0.2;
      } else {
        issues.push('Low message activity');
      }

      // Check account age
      if (mockResponse.accountAge >= 30) {
        score += 0.1;
      } else {
        issues.push('New account');
      }

      return {
        success: score >= 0.5,
        score: Math.min(score, 1.0),
        data: mockResponse,
        issues,
        reason: score >= 0.7 ? 'WhatsApp account verified' : 'WhatsApp account needs improvement'
      };
    } catch (error) {
      return {
        success: false,
        reason: `WhatsApp verification failed: ${error.message}`,
        score: 0
      };
    }
  }

  /**
   * Verify contact number
   */
  async verifyContactNumber(accountData) {
    try {
      const phoneNumber = accountData.phone_number;
      const countryCode = accountData.country_code || '+234'; // Default to Nigeria

      // Basic phone number validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
        throw new Error('Invalid phone number format');
      }

      // For MVP, simulate phone verification
      const mockResponse = {
        phone_number: phoneNumber,
        country_code: countryCode,
        verified: Math.random() > 0.2, // 80% chance of being verified
        carrier: this.getRandomCarrier(countryCode),
        location: this.getLocationFromCountryCode(countryCode),
        verificationMethod: 'SMS'
      };

      // Calculate verification score
      let score = 0;
      const issues = [];

      // Check if verified
      if (mockResponse.verified) {
        score += 0.6;
      } else {
        issues.push('Phone number not verified');
      }

      // Check carrier (some carriers are more trusted)
      if (this.isTrustedCarrier(mockResponse.carrier)) {
        score += 0.2;
      }

      // Check location (local numbers preferred)
      if (mockResponse.location === 'Nigeria') {
        score += 0.2;
      } else {
        issues.push('Non-local phone number');
      }

      return {
        success: score >= 0.5,
        score: Math.min(score, 1.0),
        data: mockResponse,
        issues,
        reason: score >= 0.7 ? 'Contact number verified' : 'Contact number needs verification'
      };
    } catch (error) {
      return {
        success: false,
        reason: `Contact verification failed: ${error.message}`,
        score: 0
      };
    }
  }

  /**
   * Store linked account in database
   */
  async storeLinkedAccount(userId, platform, accountData) {
    try {
      // In production, this would store in a separate linked_accounts table
      // For MVP, we'll store in the user's socialAccounts field
      const linkedAccount = {
        id: `${platform}_${Date.now()}`,
        platform,
        ...accountData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return linkedAccount;
    } catch (error) {
      console.error('Error storing linked account:', error);
      throw new Error('Failed to store linked account');
    }
  }

  /**
   * Update user's social accounts array
   */
  async updateUserSocialAccounts(userId, platform, linkedAccount) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get existing social accounts or initialize empty array
      const existingAccounts = user.socialAccounts || [];
      
      // Remove existing account for this platform if it exists
      const filteredAccounts = existingAccounts.filter(account => account.platform !== platform);
      
      // Add new account
      filteredAccounts.push(linkedAccount);

      // Update user record
      await user.update({
        socialAccounts: filteredAccounts,
        lastSocialUpdate: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error updating user social accounts:', error);
      throw new Error('Failed to update social accounts');
    }
  }

  /**
   * Perform initial legitimacy check on linked account
   */
  async performLegitimacyCheck(userId, platform, linkedAccount) {
    try {
      console.log(`🔍 Performing legitimacy check for ${platform} account`);

      // This would trigger the continuous monitoring system
      // For now, we'll just log the check
      const checkResult = {
        userId,
        platform,
        accountId: linkedAccount.id,
        timestamp: new Date(),
        status: 'checked',
        score: linkedAccount.verificationScore
      };

      // In production, this would store the check result and trigger monitoring
      console.log('Legitimacy check completed:', checkResult);

      return checkResult;
    } catch (error) {
      console.error('Error performing legitimacy check:', error);
      // Don't throw error as this is not critical for linking
    }
  }

  /**
   * Get user's linked social accounts
   */
  async getUserLinkedAccounts(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'socialAccounts', 'lastSocialUpdate']
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        accounts: user.socialAccounts || [],
        lastUpdated: user.lastSocialUpdate,
        totalAccounts: (user.socialAccounts || []).length
      };
    } catch (error) {
      console.error('Error getting user linked accounts:', error);
      throw new Error('Failed to get linked accounts');
    }
  }

  /**
   * Unlink a social account
   */
  async unlinkSocialAccount(userId, platform) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const existingAccounts = user.socialAccounts || [];
      const accountExists = existingAccounts.some(account => account.platform === platform);

      if (!accountExists) {
        throw new Error(`${platform} account not linked`);
      }

      // Remove the account
      const filteredAccounts = existingAccounts.filter(account => account.platform !== platform);

      await user.update({
        socialAccounts: filteredAccounts,
        lastSocialUpdate: new Date()
      });

      return {
        success: true,
        message: `${platform} account unlinked successfully`,
        remainingAccounts: filteredAccounts.length
      };
    } catch (error) {
      console.error('Error unlinking social account:', error);
      throw new Error(`Failed to unlink ${platform} account: ${error.message}`);
    }
  }

  // Helper methods
  getRandomCarrier(countryCode) {
    const carriers = {
      '+234': ['MTN', 'Airtel', 'Glo', '9mobile'],
      '+1': ['Verizon', 'AT&T', 'T-Mobile', 'Sprint'],
      '+44': ['Vodafone', 'EE', 'O2', 'Three']
    };
    
    const carrierList = carriers[countryCode] || ['Unknown'];
    return carrierList[Math.floor(Math.random() * carrierList.length)];
  }

  getLocationFromCountryCode(countryCode) {
    const locations = {
      '+234': 'Nigeria',
      '+1': 'United States',
      '+44': 'United Kingdom'
    };
    
    return locations[countryCode] || 'Unknown';
  }

  isTrustedCarrier(carrier) {
    const trustedCarriers = ['MTN', 'Airtel', 'Verizon', 'AT&T', 'Vodafone', 'EE'];
    return trustedCarriers.includes(carrier);
  }

  /**
   * Get linking statistics
   */
  async getLinkingStats() {
    try {
      const totalUsers = await User.count();
      const usersWithSocialAccounts = await User.count({
        where: {
          socialAccounts: { [Op.ne]: null }
        }
      });

      // Count accounts by platform
      const platformStats = {};
      const users = await User.findAll({
        where: {
          socialAccounts: { [Op.ne]: null }
        },
        attributes: ['socialAccounts']
      });

      users.forEach(user => {
        if (user.socialAccounts) {
          user.socialAccounts.forEach(account => {
            platformStats[account.platform] = (platformStats[account.platform] || 0) + 1;
          });
        }
      });

      return {
        totalUsers,
        usersWithSocialAccounts,
        linkingRate: totalUsers > 0 ? (usersWithSocialAccounts / totalUsers) * 100 : 0,
        platformStats
      };
    } catch (error) {
      console.error('Error getting linking stats:', error);
      return { error: 'Failed to get linking statistics' };
    }
  }
}

export default SocialAccountLinkingService;
