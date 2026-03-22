import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const authMiddleware = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: JWT secret is not set.'
            });
        }

        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided. Authorization denied.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found. Authorization denied.' 
            });
        }

        if (user.status === 'inactive') {
            return res.status(401).json({ 
                success: false, 
                message: 'User account is inactive.' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token. Authorization denied.' 
        });
    }
};

export default authMiddleware;
