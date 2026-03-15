import Supplier from '../models/supplier.js';

export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching suppliers' 
        });
    }
};

export const addSupplier = async (req, res) => {
    try {
        const { name, contact, phone, email, location, address } = req.body;

        if (!name || !contact || !phone || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        const supplier = await Supplier.create({
            name,
            contact,
            phone,
            email,
            location,
            address
        });

        res.status(201).json({
            success: true,
            message: 'Supplier added successfully',
            data: supplier
        });
    } catch (error) {
        console.error('Add supplier error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding supplier' 
        });
    }
};

export const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const supplier = await Supplier.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ 
                success: false, 
                message: 'Supplier not found' 
            });
        }

        res.json({
            success: true,
            message: 'Supplier updated successfully',
            data: supplier
        });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating supplier' 
        });
    }
};

export const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const supplier = await Supplier.findByIdAndDelete(id);

        if (!supplier) {
            return res.status(404).json({ 
                success: false, 
                message: 'Supplier not found' 
            });
        }

        res.json({
            success: true,
            message: 'Supplier deleted successfully'
        });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting supplier' 
        });
    }
};
