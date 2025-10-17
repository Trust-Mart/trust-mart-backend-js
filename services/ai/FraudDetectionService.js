import { Op } from 'sequelize';
import db from '../../models/index.js';
import { ProductStatus } from '../../utils/types.js';

const { User, Product } = db;

/**
 * AI-Powered Fraud Detection Service
 * Detects suspicious patterns and potential scams in products and users
 */
class FraudDetectionService {
  constructor() {
    this.fraudPatterns = {
      // Common scam indicators
      suspiciousKeywords: [
        'urgent', 'limited time', 'free money', 'get rich quick',
        'no questions asked', 'guaranteed profit', 'investment opportunity',
        'crypto investment', 'forex trading', 'mlm', 'pyramid scheme'
      ],
      
      // Price patterns that might indicate fraud
      suspiciousPricePatterns: {
        tooLow: 0.1, // 10% of market price
        tooHigh: 5.0  // 500% of market price
      },
      
      // User behavior patterns
      suspiciousBehavior: {
        newAccountHighValue: 1000, // New account selling items > $1000
        multipleSimilarListings: 5, // More than 5 similar listings
        rapidListing: 10 // More than 10 listings in 24 hours
      }
    };
  }

  async initialize() {
    console.log('🔍 Initializing Fraud Detection Service...');
    // In production, this would load ML models and training data
    return { success: true, message: 'Fraud detection service ready' };
  }

  /**
   * Analyze a product for fraud indicators
   */
  async analyzeProduct(product) {
    try {
      const analysis = {
        productId: product.id,
        riskScore: 0,
        indicators: [],
        recommendations: []
      };

      // Check product description for suspicious content
      const descriptionAnalysis = this.analyzeDescription(product.descrption);
      analysis.riskScore += descriptionAnalysis.riskScore;
      analysis.indicators.push(...descriptionAnalysis.indicators);

      // Check price patterns
      const priceAnalysis = await this.analyzePrice(product);
      analysis.riskScore += priceAnalysis.riskScore;
      analysis.indicators.push(...priceAnalysis.indicators);

      // Check seller behavior patterns
      const sellerAnalysis = await this.analyzeSellerBehavior(product.seller_id);
      analysis.riskScore += sellerAnalysis.riskScore;
      analysis.indicators.push(...sellerAnalysis.indicators);

      // Check for duplicate or similar listings
      const duplicateAnalysis = await this.checkForDuplicates(product);
      analysis.riskScore += duplicateAnalysis.riskScore;
      analysis.indicators.push(...duplicateAnalysis.indicators);

      // Normalize risk score to 0-1 range
      analysis.riskScore = Math.min(analysis.riskScore, 1.0);

      // Generate recommendations based on risk level
      analysis.recommendations = this.generateRecommendations(analysis.riskScore, analysis.indicators);

      return {
        score: 1 - analysis.riskScore, // Convert risk to trust score
        analysis,
        reason: this.getRiskReason(analysis.riskScore)
      };
    } catch (error) {
      console.error('Error in fraud analysis:', error);
      return { score: 0.5, reason: 'Fraud analysis failed' };
    }
  }

  /**
   * Analyze product description for fraud indicators
   */
  analyzeDescription(description) {
    const analysis = {
      riskScore: 0,
      indicators: []
    };

    if (!description) {
      analysis.riskScore += 0.2;
      analysis.indicators.push('No product description provided');
      return analysis;
    }

    const lowerDesc = description.toLowerCase();

    // Check for suspicious keywords
    const foundSuspiciousKeywords = this.fraudPatterns.suspiciousKeywords.filter(
      keyword => lowerDesc.includes(keyword.toLowerCase())
    );

    if (foundSuspiciousKeywords.length > 0) {
      analysis.riskScore += foundSuspiciousKeywords.length * 0.15;
      analysis.indicators.push(`Suspicious keywords found: ${foundSuspiciousKeywords.join(', ')}`);
    }

    // Check for excessive use of caps
    const capsRatio = (description.match(/[A-Z]/g) || []).length / description.length;
    if (capsRatio > 0.3) {
      analysis.riskScore += 0.1;
      analysis.indicators.push('Excessive use of capital letters');
    }

    // Check for multiple exclamation marks
    const exclamationCount = (description.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      analysis.riskScore += 0.1;
      analysis.indicators.push('Excessive use of exclamation marks');
    }

    // Check for contact information in description (potential scam)
    const hasContactInfo = /contact|call|whatsapp|phone|email|@/i.test(description);
    if (hasContactInfo) {
      analysis.riskScore += 0.1;
      analysis.indicators.push('Contact information in product description');
    }

    return analysis;
  }

  /**
   * Analyze product price for suspicious patterns
   */
  async analyzePrice(product) {
    const analysis = {
      riskScore: 0,
      indicators: []
    };

    try {
      // Get similar products for price comparison
      const similarProducts = await Product.findAll({
        where: {
          name: { [Op.iLike]: `%${product.name.split(' ')[0]}%` },
          id: { [Op.ne]: product.id },
          status: ProductStatus.active
        },
        attributes: ['price'],
        limit: 10
      });

      if (similarProducts.length > 0) {
        const avgPrice = similarProducts.reduce((sum, p) => sum + parseFloat(p.price), 0) / similarProducts.length;
        const priceRatio = parseFloat(product.price) / avgPrice;

        if (priceRatio < this.fraudPatterns.suspiciousPricePatterns.tooLow) {
          analysis.riskScore += 0.3;
          analysis.indicators.push('Price significantly below market average');
        } else if (priceRatio > this.fraudPatterns.suspiciousPricePatterns.tooHigh) {
          analysis.riskScore += 0.2;
          analysis.indicators.push('Price significantly above market average');
        }
      }

      // Check for round numbers (potential fake pricing)
      const price = parseFloat(product.price);
      if (price % 100 === 0 && price > 1000) {
        analysis.riskScore += 0.05;
        analysis.indicators.push('Suspicious round number pricing');
      }

    } catch (error) {
      console.error('Error analyzing price:', error);
    }

    return analysis;
  }

  /**
   * Analyze seller behavior patterns
   */
  async analyzeSellerBehavior(sellerId) {
    const analysis = {
      riskScore: 0,
      indicators: []
    };

    try {
      const seller = await User.findByPk(sellerId);
      if (!seller) {
        analysis.riskScore += 0.5;
        analysis.indicators.push('Seller account not found');
        return analysis;
      }

      // Check account age
      const accountAge = Date.now() - new Date(seller.createdAt).getTime();
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

      if (daysSinceCreation < 7) {
        analysis.riskScore += 0.2;
        analysis.indicators.push('Very new seller account');
      }

      // Check for high-value listings by new accounts
      const highValueProducts = await Product.findAll({
        where: {
          seller_id: sellerId,
          price: { [Op.gte]: this.fraudPatterns.suspiciousBehavior.newAccountHighValue }
        }
      });

      if (highValueProducts.length > 0 && daysSinceCreation < 30) {
        analysis.riskScore += 0.3;
        analysis.indicators.push('New account selling high-value items');
      }

      // Check for rapid listing behavior
      const recentProducts = await Product.findAll({
        where: {
          seller_id: sellerId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (recentProducts.length > this.fraudPatterns.suspiciousBehavior.rapidListing) {
        analysis.riskScore += 0.2;
        analysis.indicators.push('Rapid listing behavior detected');
      }

      // Check for multiple similar listings
      const allSellerProducts = await Product.findAll({
        where: { seller_id: sellerId },
        attributes: ['name']
      });

      const productNames = allSellerProducts.map(p => p.name.toLowerCase());
      const duplicateNames = productNames.filter((name, index) => 
        productNames.indexOf(name) !== index
      );

      if (duplicateNames.length > this.fraudPatterns.suspiciousBehavior.multipleSimilarListings) {
        analysis.riskScore += 0.15;
        analysis.indicators.push('Multiple similar product listings');
      }

    } catch (error) {
      console.error('Error analyzing seller behavior:', error);
    }

    return analysis;
  }

  /**
   * Check for duplicate or suspiciously similar products
   */
  async checkForDuplicates(product) {
    const analysis = {
      riskScore: 0,
      indicators: []
    };

    try {
      // Check for products with very similar names
      const similarProducts = await Product.findAll({
        where: {
          name: { [Op.iLike]: `%${product.name}%` },
          id: { [Op.ne]: product.id }
        },
        include: [{ model: User, as: 'seller', attributes: ['id'] }]
      });

      if (similarProducts.length > 0) {
        // Check if similar products are from different sellers
        const differentSellers = new Set(similarProducts.map(p => p.seller_id));
        if (differentSellers.size > 1) {
          analysis.riskScore += 0.2;
          analysis.indicators.push('Similar products from multiple sellers');
        }

        // Check for exact duplicates
        const exactDuplicates = similarProducts.filter(p => 
          p.name.toLowerCase() === product.name.toLowerCase()
        );

        if (exactDuplicates.length > 0) {
          analysis.riskScore += 0.3;
          analysis.indicators.push('Exact duplicate products found');
        }
      }

    } catch (error) {
      console.error('Error checking for duplicates:', error);
    }

    return analysis;
  }

  /**
   * Generate recommendations based on fraud analysis
   */
  generateRecommendations(riskScore, indicators) {
    const recommendations = [];

    if (riskScore > 0.7) {
      recommendations.push('HIGH RISK: Manual review required');
      recommendations.push('Consider flagging for admin review');
    } else if (riskScore > 0.4) {
      recommendations.push('MEDIUM RISK: Additional verification recommended');
      recommendations.push('Monitor seller activity closely');
    } else if (riskScore > 0.2) {
      recommendations.push('LOW RISK: Standard verification process');
    } else {
      recommendations.push('LOW RISK: Product appears legitimate');
    }

    // Specific recommendations based on indicators
    if (indicators.some(i => i.includes('Suspicious keywords'))) {
      recommendations.push('Review product description for compliance');
    }

    if (indicators.some(i => i.includes('Price significantly'))) {
      recommendations.push('Verify pricing with market research');
    }

    if (indicators.some(i => i.includes('Very new seller'))) {
      recommendations.push('Require additional seller verification');
    }

    return recommendations;
  }

  /**
   * Get risk reason based on score
   */
  getRiskReason(riskScore) {
    if (riskScore > 0.7) {
      return 'High fraud risk detected';
    } else if (riskScore > 0.4) {
      return 'Medium fraud risk detected';
    } else if (riskScore > 0.2) {
      return 'Low fraud risk detected';
    } else {
      return 'Minimal fraud risk';
    }
  }

  /**
   * Get fraud detection statistics
   */
  async getStats() {
    try {
      const totalProducts = await Product.count();
      const flaggedProducts = await Product.count({
        where: { status: ProductStatus.flagged }
      });

      const avgRiskScore = await Product.findAll({
        attributes: [
          [db.Sequelize.fn('AVG', db.Sequelize.col('ai_verification_score')), 'avg_score']
        ],
        where: { ai_verification_score: { [Op.ne]: null } }
      });

      return {
        totalProducts,
        flaggedProducts,
        avgRiskScore: parseFloat(avgRiskScore[0]?.get('avg_score') || 0),
        flagRate: totalProducts > 0 ? (flaggedProducts / totalProducts) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting fraud stats:', error);
      return { error: 'Failed to get fraud statistics' };
    }
  }

  /**
   * Monitor and detect fraud patterns across the platform
   */
  async monitorFraudPatterns() {
    try {
      const patterns = {
        newHighValueListings: 0,
        rapidListings: 0,
        suspiciousKeywords: 0,
        duplicateProducts: 0
      };

      // Check for new high-value listings
      const highValueListings = await Product.findAll({
        where: {
          price: { [Op.gte]: 1000 },
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        include: [{ model: User, as: 'seller' }]
      });

      patterns.newHighValueListings = highValueListings.length;

      // Check for rapid listings
      const rapidListings = await Product.findAll({
        attributes: [
          'seller_id',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        group: ['seller_id'],
        having: db.Sequelize.literal('COUNT(*) > 10')
      });

      patterns.rapidListings = rapidListings.length;

      return {
        success: true,
        patterns,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error monitoring fraud patterns:', error);
      throw new Error(`Fraud monitoring failed: ${error.message}`);
    }
  }
}

export default FraudDetectionService;
