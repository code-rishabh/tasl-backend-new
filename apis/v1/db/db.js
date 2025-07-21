const mongoose = require('mongoose');
require('dotenv').config();

const DATABASE_NAME = 'defense'; // Constant database name

const connectToMongoose = async () => {
  try {
    // Establish connection to MongoDB using environment variable for URI
    await mongoose.connect("mongodb+srv://NearbyKart_production:vgDxWwhHwhdWkSO0@cluster0.nkwn8jm.mongodb.net", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: DATABASE_NAME
    });
    console.log("Connected to Database:", DATABASE_NAME);
  } catch (error) {
    console.error("Error connecting to Database:", DATABASE_NAME, error);
    throw error;
  }
};

module.exports = connectToMongoose;