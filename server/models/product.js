import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Supplier is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    stock: {
        type: Number,
        required: [true, 'Stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'discontinued', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;
