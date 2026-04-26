const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blacklist.model");


async function authUser(req, res, next){
  const token = req.cookies.token;

  if(!token){
    return res.status(401).json({
      message: "User already logged out or not logged in, hence token not found",
    })
  }
  
  const isTokenBlacklisted = await tokenBlackListModel.findOne({token});
  if(isTokenBlacklisted){
    return res.status(401).json({
      message: "Token is invalid as user has logged out, please login again",
    })
  }

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user information to the request object for use in subsequent middleware or route handlers
    next(); // Call the next middleware or route handler
  }catch(err){
    console.error(err);
    return res.status(401).json({
      message: "Invalid Token",
    })
  }
}

async function optionalAuthUser(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return next();
  }

  const isTokenBlacklisted = await tokenBlackListModel.findOne({token});
  if (isTokenBlacklisted) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // If token is invalid, just proceed without setting req.user
  }
  next();
}

module.exports = { authUser, optionalAuthUser };