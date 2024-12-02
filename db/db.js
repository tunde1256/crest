require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../logger/logger');

const connection = async () => {
    try {
        await mongoose.connect(process.env.DATABASE, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info('MongoDB Connected...');
    } catch (error) {
        logger.info('MongoDB connection error:', error.message);
        process.exit(1); // Exit the process on failure
    }
};

module.exports = connection;
