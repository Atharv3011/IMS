import Order from '../models/order.js';
import Product from '../models/product.js';
import User from '../models/user.js';
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
            .select('orderNumber customerId customerName customerEmail customerPhone deliveryAddress items itemTotal outstandingAmountAtTime totalBilled totalAmount paymentStatus paidAmount status orderDate billedAt notes createdAt')
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
            .select('orderNumber customerId customerName customerEmail customerPhone deliveryAddress items itemTotal outstandingAmountAtTime totalBilled totalAmount paymentStatus paidAmount status orderDate billedAt notes createdAt')
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
            customerId,
            customerName, 
            customerEmail, 
            customerPhone, 
            deliveryAddress, 
            items, 
            notes 
        } = req.body;

        console.log('=== Creating order ===');
        console.log('Creating order with data:', { 
            customerId,
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
        let itemTotal = 0;
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

            const lineTotal = product.price * item.quantity;
            itemTotal += lineTotal;

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
        console.log(`Total items amount: $${itemTotal}`);

        // STEP 1.5: Fetch customer's outstanding amount if customerId is available
        let outstandingAmountAtTime = 0;
        let resolvedCustomerId = null;

        if (customerId) {
            const customer = await User.findOne({ _id: customerId, role: 'customer' });
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Selected customer not found'
                });
            }

            resolvedCustomerId = customer._id;
            outstandingAmountAtTime = customer.outstandingAmount || 0;
            console.log(`Customer outstanding amount: $${outstandingAmountAtTime}`);
        }
        
        const totalBilled = itemTotal + outstandingAmountAtTime;
        const totalAmount = itemTotal; // totalAmount is just items, totalBilled includes outstanding
        
        console.log(`Outstanding amount at time: $${outstandingAmountAtTime}`);
        console.log(`Total amount to be billed: $${totalBilled}`);

        // STEP 2: Create the order
        console.log('STEP 2: Creating order in database...');
        const order = await Order.create({
            customerId: resolvedCustomerId,
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            items: orderItems,
            itemTotal,
            outstandingAmountAtTime,
            totalBilled,
            totalAmount,
            paymentStatus: 'unpaid',
            paidAmount: 0,
            billedAt: new Date(),
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

        // STEP 3.5: Update customer's outstanding amount
        if (resolvedCustomerId) {
            await User.findByIdAndUpdate(
                resolvedCustomerId,
                { outstandingAmount: totalBilled },
                { new: true }
            );
            console.log(`✓ Customer outstanding amount updated to: $${totalBilled}`);
        }

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
            .select('orderNumber customerId customerName customerEmail customerPhone deliveryAddress items itemTotal outstandingAmountAtTime totalBilled totalAmount paymentStatus paidAmount status orderDate notes createdAt')
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

export const updateOrderBill = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            notes,
            items
        } = req.body;

        if (!customerName || !customerEmail || !customerPhone || !deliveryAddress || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid bill details and at least one item'
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status === 'completed' || order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Completed or cancelled orders cannot be edited'
            });
        }

        const previousQuantities = new Map();
        for (const oldItem of order.items) {
            const key = String(oldItem.product);
            previousQuantities.set(key, (previousQuantities.get(key) || 0) + Number(oldItem.quantity || 0));
        }

        const requestedQuantities = new Map();
        for (const item of items) {
            if (!item.product || !item.quantity || Number(item.quantity) < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Each bill item must have a valid product and quantity'
                });
            }

            const key = String(item.product);
            requestedQuantities.set(key, (requestedQuantities.get(key) || 0) + Number(item.quantity));
        }

        const allProductIds = new Set([
            ...Array.from(previousQuantities.keys()),
            ...Array.from(requestedQuantities.keys())
        ]);

        const productDocs = await Product.find({ _id: { $in: Array.from(allProductIds) } });
        const productMap = new Map(productDocs.map((product) => [String(product._id), product]));

        for (const [productId, requestedQty] of requestedQuantities.entries()) {
            const product = productMap.get(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${productId}`
                });
            }

            const previousQty = previousQuantities.get(productId) || 0;
            const availableForThisOrder = Number(product.stock) + previousQty;
            if (requestedQty > availableForThisOrder) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${availableForThisOrder}`
                });
            }
        }

        const updatedItems = [];
        let itemTotal = 0;
        for (const item of items) {
            const product = productMap.get(String(item.product));
            const quantity = Number(item.quantity);
            const lineTotal = Number(product.price) * quantity;
            itemTotal += lineTotal;

            updatedItems.push({
                product: product._id,
                productName: product.name,
                quantity,
                price: product.price
            });
        }

        for (const productId of allProductIds) {
            const product = productMap.get(productId);
            if (!product) {
                continue;
            }
            const previousQty = previousQuantities.get(productId) || 0;
            const requestedQty = requestedQuantities.get(productId) || 0;
            product.stock = Number(product.stock) + previousQty - requestedQty;
            await product.save();
        }

        const oldTotalBilled = Number(order.totalBilled || order.totalAmount || 0);
        const outstandingAmountAtTime = Number(order.outstandingAmountAtTime || 0);
        const totalBilled = itemTotal + outstandingAmountAtTime;

        order.customerName = customerName.trim();
        order.customerEmail = customerEmail.trim().toLowerCase();
        order.customerPhone = customerPhone.trim();
        order.deliveryAddress = deliveryAddress.trim();
        order.notes = (notes || '').trim();
        order.items = updatedItems;
        order.itemTotal = itemTotal;
        order.totalAmount = itemTotal;
        order.totalBilled = totalBilled;
        order.billedAt = new Date();

        await order.save();

        if (order.customerId) {
            const delta = totalBilled - oldTotalBilled;
            if (delta !== 0) {
                await User.findByIdAndUpdate(order.customerId, {
                    $inc: { outstandingAmount: delta }
                });
            }
        }

        const updatedOrder = await Order.findById(order._id)
            .select('orderNumber customerId customerName customerEmail customerPhone deliveryAddress items itemTotal outstandingAmountAtTime totalBilled totalAmount paymentStatus paidAmount status orderDate billedAt notes createdAt')
            .lean();

        res.json({
            success: true,
            message: 'Bill updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Update order bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating bill'
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

export const getCustomersForBilling = async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer', status: 'active' })
            .select('_id name email phone outstandingAmount')
            .sort({ name: 1 })
            .lean();

        res.json({
            success: true,
            count: customers.length,
            data: customers
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching customers' 
        });
    }
};
