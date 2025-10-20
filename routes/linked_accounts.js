import express from "express";
import LinkedAccountController from "../controllers/LinkedAccountController.js";

const router = express.Router();

router.post("/", LinkedAccountController.linkAccount);

export default router;