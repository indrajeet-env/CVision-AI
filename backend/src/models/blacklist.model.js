const mongoose = require ('mongoose');

const blackListTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "Token is required to be added in the blacklist while logging out"],
    unique: true, // Ensure that the token is unique across all blacklisted tokens
  },
    expiresAt: {
    type: Date,
    required: true
  }
}, {timestamps: true})

const tokenBlacklistModel = mongoose.model('blacklistToken', blackListTokenSchema);
module.exports = tokenBlacklistModel

