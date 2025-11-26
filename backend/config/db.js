require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.warn('MONGO_URI not configured. Running in API-only mode (no persistence)');
            return;
        }
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 3000,
            socketTimeoutMS: 3000,
            connectTimeoutMS: 3000
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.warn(`Warning - MongoDB connection failed: ${error.message}`);
        console.warn('Continuing with cache-only mode. Data will not persist.');
    }
};

module.exports = connectDB;

