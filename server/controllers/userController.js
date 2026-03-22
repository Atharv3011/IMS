import bcrypt from 'bcrypt';
import User from '../models/user.js';

export const getUser = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching users' 
        });
    }
};

export const getCustomers = async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer' })
            .select('_id name email phone address company status outstandingAmount createdAt')
            .sort({ createdAt: -1 })
            .lean();

        const normalizedCustomers = customers.map((customer) => ({
            ...customer,
            outstandingAmount: Number(customer.outstandingAmount || 0)
        }));

        res.json({
            success: true,
            count: normalizedCustomers.length,
            data: normalizedCustomers
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers'
        });
    }
};

export const addUser = async (req, res) => {
    try {
        const { name, email, password, address, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            address,
            role: role || 'staff'
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User added successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding user' 
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot delete your own account' 
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting user' 
        });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching profile' 
        });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const { name, email, address, phone, password } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating profile' 
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, address, phone, role, password, status } = req.body;
        const hasOutstandingAmount = Object.prototype.hasOwnProperty.call(req.body, 'outstandingAmount');
        const outstandingAmount = hasOutstandingAmount ? Number(req.body.outstandingAmount) : undefined;

        if (id === req.user.id && role && role !== req.user.role) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role'
            });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (role) updateData.role = role;
        if (status) updateData.status = status;
        if (hasOutstandingAmount) {
            if (Number.isNaN(outstandingAmount) || outstandingAmount < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Outstanding amount must be a non-negative number'
                });
            }
            updateData.outstandingAmount = outstandingAmount;
        }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
};

export const getLoggedInUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get logged in user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching user data' 
        });
    }
};
