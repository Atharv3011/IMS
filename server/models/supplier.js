import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true
    },
    contact: {
        type: String,
        required: [true, 'Contact person is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    location: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
