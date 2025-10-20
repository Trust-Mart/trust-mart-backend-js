import express from 'express';
import EscrowController from '../controllers/EscrowController.js';
import authenticateToken from '../middleware/AuthMiddleware.js';

const router = express.Router();
const escrowController = new EscrowController();

router.post('/purchase/product', authenticateToken, escrowController.createProductEscrow);
router.post('/:orderId/release', authenticateToken, escrowController.releaseEscrow);
router.post('/:orderId/dispute', authenticateToken, escrowController.raiseDispute);
router.get('/order/:orderId', authenticateToken, escrowController.getOrderDetails);
router.get('/:escrowAddress', authenticateToken, escrowController.getEscrowDetails);
router.get('/user/balance', authenticateToken, escrowController.getBalances);

export default router;