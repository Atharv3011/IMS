import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    address: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'staff', 'customer'],
        default: 'staff'
    },
    phone: {
        type: String,
        default: ''
    },
    company: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    outstandingAmount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
