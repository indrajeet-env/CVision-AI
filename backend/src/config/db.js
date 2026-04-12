require("dotenv").config();
const mongoose = require("mongoose");
const { mod } = require("three/tsl");

async function connectDB(){
  try{
    await mongoose.connect(process.env.MONGO_URI)
    console.log("Connected to Data Base");
  }
  catch(err){
    console.error("Error connecting to MongoDB:", err);
  }
}

module.exports = connectDB;