import express from "express";
import { 
  createProduct,
  getProduct,
  getSellerProducts,
  getAllProducts,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  updateProductQuantity,
  getSellerProductStats,
  updateAIVerificationScore,
  getProductsForVerification
} from "../controllers/ProductController.js";
import authenticateToken from "../middleware/AuthMiddleware.js";
// import { requireRole } from "../middleware/RoleMiddleware.js";
import { UserRoles } from "../utils/types.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:productId", getProduct);

// Seller routes (authenticated)
router.post("/", authenticateToken, createProduct);
router.get("/seller/my-products", authenticateToken, getSellerProducts);
router.put("/:productId", authenticateToken, updateProduct);
router.patch("/:productId/status", authenticateToken, updateProductStatus);
router.patch("/:productId/quantity", authenticateToken, updateProductQuantity);
router.delete("/:productId", authenticateToken, deleteProduct);
router.get("/seller/stats", authenticateToken, getSellerProductStats);

export default router;