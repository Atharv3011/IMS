import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
	getProducts,
	addProduct,
	deleteProduct,
	updateProduct,
	archiveProduct,
	unarchiveProduct
} from '../controllers/productController.js';
import uploadProductImage from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/',authMiddleware, getProducts); 
router.post('/add',authMiddleware, uploadProductImage.single('image'), addProduct); 
router.put('/:id',authMiddleware, uploadProductImage.single('image'), updateProduct); 
router.patch('/:id/archive',authMiddleware, archiveProduct);
router.patch('/:id/unarchive',authMiddleware, unarchiveProduct);
router.delete('/:id',authMiddleware, deleteProduct); 

export default router; 