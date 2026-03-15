import Product from '../models/product.js';

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .populate('supplier', 'name contact')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching products' 
        });
    }
};

export const addProduct = async (req, res) => {
    try {
        const { name, description, category, supplier, price, stock, sku } = req.body;

        if (!name || !category || !supplier || !price) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        const product = await Product.create({
            name,
            description,
            category,
            supplier,
            price,
            stock: stock || 0,
            sku
        });

        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .populate('supplier', 'name contact');

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            data: populatedProduct
        });
    } catch (error) {
        console.error('Add product error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product with this SKU already exists' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Error adding product' 
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('category', 'name')
        .populate('supplier', 'name contact');

        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating product' 
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting product' 
        });
    }
};
