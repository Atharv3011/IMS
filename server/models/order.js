import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        lowercase: true
    },
    customerPhone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true
    },
    deliveryAddress: {
        type: String,
        required: [true, 'Delivery address is required']
    },
    items: [orderItemSchema],
    itemTotal: {
        type: Number,
        required: true,
        min: 0
    },
    outstandingAmountAtTime: {
        type: Number,
        default: 0,
        min: 0
    },
    totalBilled: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'partial'],
        default: 'unpaid'
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    billedAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1, createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function() {
    if (this.isNew && !this.orderNumber) {
        try {
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            const day = String(new Date().getDate()).padStart(2, '0');
            const timestamp = Date.now() % 100000; // Last 5 digits of timestamp
            this.orderNumber = `ORD-${year}${month}${day}-${timestamp}`;
            console.log(`Generated order number: ${this.orderNumber}`);
        } catch (error) {
            console.error('Error generating order number:', error);
            throw error;
        }
    }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
