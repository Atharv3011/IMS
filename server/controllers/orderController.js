import Order from '../models/order.js';
import Product from '../models/product.js';
import {
    notifyOrderCreated,
    notifyOrderStatusUpdated,
    notifyLowStockForOrder,
    getLowStockThreshold
} from '../utils/notificationService.js';

export const getOrders = async (req, res) => {
    try {
        const { search = '', status = 'all' } = req.query;
        let query = {};
        
        // If user is a customer, only show their orders
        if (req.user && req.user.role === 'customer') {
            query.customerId = req.user._id;
        }

        if (status !== 'all') {
            query.status = status;
        }

        if (search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { orderNumber: searchRegex },
                { customerName: searchRegex },
                { customerEmail: searchRegex },
                { 'items.productName': searchRegex }
            ];
        }
        
        const orders = await Order.find(query)
            .select('orderNumber customerId customerName customerEmail customerPhone deliveryAddress items totalAmount status orderDate notes createdAt')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching orders' 
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .select('orderNumber customerId customerName customerEmail customerPhone deliveryAddress items totalAmount status orderDate notes createdAt')
            .lean();

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        if (req.user?.role === 'customer' && String(order.customerId) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to access this order'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching order' 
        });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { 
            customerName, 
            customerEmail, 
            customerPhone, 
            deliveryAddress, 
            items, 
            notes 
        } = req.body;

        console.log('=== Creating order ===');
        console.log('Creating order with data:', { 
            customerName, 
            customerEmail, 
            customerPhone, 
            deliveryAddress, 
            itemsCount: items?.length, 
            notes 
        });

        // Validation
        if (!customerName || !customerEmail || !customerPhone || !deliveryAddress || !items || items.length === 0) {
            console.error('Validation failed: Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields and at least one item' 
            });
        }

        // STEP 1: Validate all items and calculate total WITHOUT updating stock
        let totalAmount = 0;
        const orderItems = [];
        const products = [];
        const lowStockItems = [];
        const lowStockThreshold = getLowStockThreshold();

        console.log('STEP 1: Validating items...');
        for (const item of items) {
            console.log(`  Validating item: product=${item.product}, quantity=${item.quantity}`);
            
            const product = await Product.findById(item.product);
            
            if (!product) {
                console.error(`  ERROR: Product not found: ${item.product}`);
                return res.status(404).json({ 
                    success: false, 
                    message: `Product not found: ${item.product}` 
                });
            }

            if (product.stock < item.quantity) {
                console.error(`  ERROR: Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
                });
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                price: product.price
            });

            // Store for later stock update
            products.push({
                _id: product._id,
                quantity: item.quantity,
                name: product.name
            });

            console.log(`  ✓ Item validated: ${product.name}`);
        }

        console.log('STEP 1 Complete: All items validated');
        console.log(`Total order amount: $${totalAmount}`);

        // STEP 2: Create the order
        console.log('STEP 2: Creating order in database...');
        const order = await Order.create({
            customerId: req.user ? req.user._id : null,
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            items: orderItems,
            totalAmount,
            notes: notes || ''
        });

        console.log(`✓ Order created successfully: ${order._id}`);
        console.log(`Order number: ${order.orderNumber}`);

        // STEP 3: Update product stock AFTER order is successfully created
        console.log('STEP 3: Updating product stock...');
        for (const product of products) {
            const productToUpdate = await Product.findById(product._id);
            productToUpdate.stock -= product.quantity;
            await productToUpdate.save();
            console.log(`  ✓ Stock updated for ${product.name}: new stock = ${productToUpdate.stock}`);

            if (productToUpdate.stock <= lowStockThreshold) {
                lowStockItems.push({
                    name: product.name,
                    stock: productToUpdate.stock
                });
            }
        }

        console.log('STEP 3 Complete: All stock updated');

        // STEP 4: Return populated order
        console.log('STEP 4: Fetching populated order...');
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name price')
            .populate('customerId', 'name email phone company');

        console.log('=== Order creation successful ===');

        // Notification failures should never break order creation.
        await notifyOrderCreated(populatedOrder);
        if (lowStockItems.length) {
            await notifyLowStockForOrder(populatedOrder, lowStockItems);
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: populatedOrder
        });
    } catch (error) {
        console.error('=== Create order error ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);
        
        res.status(500).json({ 
            success: false, 
            message: 'Error creating order: ' + error.message,
            error: error.message
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status value' 
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        // If cancelling order, restore product stock
        if (status === 'cancelled' && order.status !== 'cancelled') {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        order.status = status;
        await order.save();

        const updatedOrder = await Order.findById(id)
            .select('orderNumber customerId customerName customerEmail customerPhone deliveryAddress items totalAmount status orderDate notes createdAt')
            .lean();

        await notifyOrderStatusUpdated(updatedOrder);

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating order status' 
        });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        // Restore product stock if order is not completed
        if (order.status !== 'completed' && order.status !== 'cancelled') {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        await Order.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting order' 
        });
    }
};
