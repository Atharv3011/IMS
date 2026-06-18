import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction && !process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is required in production. Refusing to start with local fallback database.');
        }

        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ims';
        const maskedMongoURI = mongoURI.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3');

        console.log(`Connecting to MongoDB at: ${maskedMongoURI}`);
        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
