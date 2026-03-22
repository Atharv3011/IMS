import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
    getOrders, 
    getOrderById,
    createOrder, 
    updateOrderStatus, 
    updateOrderBill,
    deleteOrder,
    getCustomersForBilling
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', authMiddleware, getOrders);
router.get('/customers/billing', authMiddleware, getCustomersForBilling);
router.get('/:id', authMiddleware, getOrderById);
router.post('/add', authMiddleware, createOrder);
router.put('/:id/status', authMiddleware, updateOrderStatus);
router.put('/:id/bill', authMiddleware, updateOrderBill);
router.delete('/:id', authMiddleware, deleteOrder);

export default router;
