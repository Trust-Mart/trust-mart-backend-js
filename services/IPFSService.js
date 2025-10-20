import axios from "axios";

export default class IPFSService {
  constructor() {
    this.jwt = process.env.PINATA_JWT;
    this.endpoint = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
  }

  /**
   * Upload a JSON object to Pinata using JWT
   * @param {Object} obj - JSON to pin
   * @returns {Promise<string>} IPFS CID
   */
  async uploadJSON(obj) {
    try {
      if (!this.jwt) {
        throw new Error("Missing PINATA_JWT in environment variables");
      }

      const res = await axios.post(
        this.endpoint,
        {
          pinataContent: obj,
          pinataMetadata: {
            name: obj.domain ? `${obj.orderId}-record` : "escrow-order-json",
          },
          pinataOptions: { cidVersion: 1 },
        },
        {
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data.IpfsHash;
    } catch (error) {
      console.error("Pinata uploadJSON error:", error.response?.data || error.message);
      throw new Error("Failed to upload to Pinata");
    }
  }
}
