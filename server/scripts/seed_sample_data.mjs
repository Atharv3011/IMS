import connectDB from '../db/connection.js';
import Category from '../models/category.js';
import Supplier from '../models/supplier.js';
import Product from '../models/product.js';
import Order from '../models/order.js';
import User from '../models/user.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env like other scripts
try {
    const envPath = resolve('.env');
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                const value = line.substring(equalIndex + 1).trim();
                if (key && value) process.env[key] = value;
            }
        }
    });
    console.log('Loaded .env');
} catch (err) {
    console.error('Failed to load .env', err.message);
}

const run = async () => {
    try {
        await connectDB();

        // Find an existing customer created by seed.js
        const customer = await User.findOne({ email: 'john@example.com' });
        if (!customer) {
            console.error('Customer john@example.com not found. Run seed.js first.');
            process.exit(1);
        }

        // Create category
        let category = await Category.findOne({ name: 'Sample Category' });
        if (!category) {
            category = await Category.create({ name: 'Sample Category', description: 'Auto-created category' });
            console.log('Created category:', category._id.toString());
        }

        // Create supplier
        let supplier = await Supplier.findOne({ email: 'supplier@example.com' });
        if (!supplier) {
            supplier = await Supplier.create({
                name: 'Sample Supplier',
                contact: 'Supplier Contact',
                phone: '+1 555 000 0000',
                email: 'supplier@example.com',
                location: 'Unknown',
                address: 'Supplier Address'
            });
            console.log('Created supplier:', supplier._id.toString());
        }

        // Create product
        let product = await Product.findOne({ sku: 'SAMPLE-SKU-001' });
        if (!product) {
            product = await Product.create({
                name: 'Sample Product',
                description: 'Auto-created sample product',
                category: category._id,
                supplier: supplier._id,
                price: 19.99,
                stock: 100,
                sku: 'SAMPLE-SKU-001'
            });
            console.log('Created product:', product._id.toString());
        }

        // Create an order referencing the product and customer
        const orderPayload = {
            customerId: customer._id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone || '+1 000 000 0000',
            deliveryAddress: customer.address || 'Customer Address',
            items: [
                {
                    product: product._id,
                    productName: product.name,
                    quantity: 2,
                    price: product.price
                }
            ],
            itemTotal: product.price * 2,
            totalBilled: product.price * 2,
            totalAmount: product.price * 2
        };

        const order = await Order.create(orderPayload);
        console.log('Created order:', order._id.toString(), 'orderNumber:', order.orderNumber);

        console.log('Sample data seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding sample data:', error);
        process.exit(1);
    }
};

run();
