import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { addUser, getUser, deleteUser, getMyProfile, updateMyProfile, updateUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/add',authMiddleware, addUser); 
router.get('/',authMiddleware, getUser); 
router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.put('/:id',authMiddleware, updateUser);
router.delete('/:id',authMiddleware, deleteUser); 


export default router; 