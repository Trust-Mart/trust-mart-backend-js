import express from "express";
import { 
  createDelivery,
  getDelivery,
  getDeliveryByProduct,
  getSellerDeliveries,
  updateDelivery,
  updateDeliveryStatus,
  checkDeliveryExists
} from "../controllers/ProductDeliveryController.js";
import authenticateToken from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, createDelivery);
router.get("/seller/my-deliveries", authenticateToken, getSellerDeliveries);
router.get("/product/:productId", authenticateToken, getDeliveryByProduct);
router.get("/check/:productId", authenticateToken, checkDeliveryExists);
router.put("/:deliveryId", authenticateToken, updateDelivery);
router.patch("/:deliveryId/status", authenticateToken, updateDeliveryStatus);

router.get("/:deliveryId", getDelivery);

export default router;