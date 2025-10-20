import db from "../models/index.js";
import { SocialMediaProviders } from "../utils/types.js";

const { LinkedAccount } = db;

class LinkedAccountController {
    constructor() {
        this.linkAccount = this.linkAccount.bind(this);
    }

  async linkAccount(req, res) {
    try {
      const { provider, response } = req.body;
      const user_id = req.user.id;

      if (!provider || !response) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required parameters" });
      }

      const accountData = this.normalizeProviderData(provider, response);

      const [linkedAccount, created] = await LinkedAccount.upsert(
        {
          user_id,
          provider,
          ...accountData,
        },
        {
          returning: true,
        //   conflictFields: ["user_id", "provider"],
        }
      );

      return res.status(200).json({
        success: true,
        message: created
          ? `${provider} account linked successfully`
          : `${provider} account updated successfully`,
        data: linkedAccount,
      });
    } catch (error) {
      console.error("❌ Error linking account:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  normalizeProviderData(provider, response) {
    switch (provider) {
      case SocialMediaProviders.twitter:
        return {
          providerUserId: response.user.id,
          username: response.user.username,
          displayName: response.user.name,
          profileImageUrl: response.user.profile_image_url,
          accessToken: response.tokens.accessToken,
          tokenType: response.tokens.tokenType,
          expiresIn: response.tokens.expiresIn,
          scope: response.tokens.scope,
          metadata: response,
        };

      case SocialMediaProviders.facebook:
        return {
          providerUserId: response.userID,
          accessToken: response.accessToken,
          expiresIn: response.expiresIn,
          signedRequest: response.signedRequest,
          metadata: response,
        };

      case SocialMediaProviders.instagram:
        return {
          providerUserId: response.id,
          username: response.username,
          displayName: response.name || null,
          profileImageUrl: response.profile_picture_url || null,
          accessToken: response.access_token,
          expiresIn: response.expires_in,
          metadata: response,
        };

      case SocialMediaProviders.email:
        return {
          providerUserId: response.email,
          username: response.email,
          displayName: response.name || response.email,
          metadata: response,
        };

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}

export default new LinkedAccountController();
