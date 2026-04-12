const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true, // Remove whitespace from both ends of the name
    unique: true, // Ensure that the name is unique across all users
  },     
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Convert email to lowercase before saving
    trim: true, // Remove whitespace from both ends of the email
  },
  password: {
    type: String,
    required: true,
    select: false, // This will prevent the password from being returned in queries by default
    trim: true, // Remove whitespace from both ends of the password
  },
  role: {
    type: String,  
    enum: ['admin', 'user'], // Define possible roles
    default: 'user', // Default role is 'user'
  },
}, {  timestamps: true } // Automatically add createdAt and updatedAt fields;
);

const User = mongoose.model('users', userSchema);

module.exports = User;