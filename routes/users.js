import express from "express";
import { userDetails, usersAndProducts } from "../controllers/UserController.js";

const router = express.Router();

router.get('/user', userDetails)
router.get('/all/products', usersAndProducts)


export default router;