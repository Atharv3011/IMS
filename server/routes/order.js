import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
    getOrders, 
    getOrderById,
    createOrder, 
    updateOrderStatus, 
    deleteOrder 
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);
router.post('/add', authMiddleware, createOrder);
router.put('/:id/status', authMiddleware, updateOrderStatus);
router.delete('/:id', authMiddleware, deleteOrder);

export default router;
