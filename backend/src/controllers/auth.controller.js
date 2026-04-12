const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs'); // A library to hash passwords and compare hashed passwords
const jwt = require('jsonwebtoken'); // A library to generate and verify JSON Web Tokens (JWTs)
const tokenBlackListModel = require('../models/blacklist.model');


/**
 * @route registerUserController
 * @desc Register a new user, expects name, email and password in the request body
 * @access Public
 */

async function registerUserController(req, res){
  try{
    const { username, email, password } = req.body; // name, email and password are destructured from the request body

    if(!username || !email || !password){
      return res.status(400).json({ 
        message: 'Please provide name, email and password' 
      });
    }

    const isUserExist = await userModel.findOne({
      $or: [{username}, {email}] // Check if a user with the same username or email already exists in the database 
    }); // and $or checks both conditions and returns that user exists if either of the conditions is true

    if(isUserExist){
      if(isUserExist.username === username){
        return res.status(400).json({
          message: 'Username already exists'
        })
      }
      if(isUserExist.email === email){
        return res.status(400).json({
          message: 'Email already exists'
        })
      }
    }

    // we could've also done, 
    // if(userExist){
    //   return res.status(400).json({
    //     message: 'User already exists'
    //   })
    // }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password using bcrypt with a salt rounds of 10

    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword // Store the hashed password in the database instead of the plain text password  
    })

    // next we will generate a JWT token for the newly registered user, which can be used for authentication
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username }, // Payload of the token, we can include any data we want to include in the token, here we are including the userId which is the _id of the newly created user
      process.env.JWT_SECRET, // Secret key to sign the token, it should be stored in an environment variable for security reasons
      { expiresIn: '1d' } // Token expiration time, here we are setting it to 1 day
    );

    // Set the token in a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies only in production (HTTPS); keep false in development so cookies work on localhost
      sameSite: "strict",
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    })

  }catch(err){
    console.error(err);
    return res.status(500).json({
      message: `Server Error ${err.message}`,
    });
  }
}

/**
 * @route loginUserController
 * @desc Login a user, expects email and password in the request body
 * @access Public
 */


async function loginUserController(req, res){
  try{
    const {email, password} = req.body; // email and password are destructured from the request body

    // First Check whether any account already exists with the provided email
    const user = await userModel.findOne({ email }).select("+password");

    if(!user){
      return res.status(400).json({
        message: "No user found with this email"
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
      return res.status(400).json({
        message: "Invalid password"
      })
    }
    // Agar passwrod valid hoga toh, hum agey badhjayege, aur ek token create krege
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies only in production (HTTPS); keep false in development so cookies work on localhost
      sameSite: "strict",
    });

    res.status(200).json({
      message: "User Logged in successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    })
  }catch(err){
    console.error(err);
    return res.status(500).json({
      message: `Server Error ${err.message}`,
    });
  }
}

/**
 * @route logoutUserController
 * @desc logging out the user, create the logout api, clear token from user's cookie and add token to blacklist
 * @access Public
 */

async function logoutUserController(req, res){
  try{
    const token = req.cookies.token

    if(!token){
      return res.status(400).json({
        message: "User already logged out or not logged in, hence token not found",
      })
    }

    const isBlacklisted = await tokenBlackListModel.findOne({token});

    if(isBlacklisted){
      return res.status(400).json({
        message: "User already logged out"
      })
    }

    const decoded = jwt.decode(token); // Decode the token to get the expiration time 
    const expiresAt = new Date(decoded.exp * 1000); // Convert expiration time to milliseconds and create a Date object

    await tokenBlackListModel.create({token, expiresAt}); // Add the token to the blacklist with its expiration time

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies only in production (HTTPS); keep false in development so cookies work on localhost
      sameSite: "strict",
    })

    return res.status(200).json({
      message: "User Logged Out successfully",
    })
  }catch(err){
    console.error(err);
    return res.status(500).json({
      message: `Error is : ${err}`,
    });
  }
}

/**
 * @route getMeController
 * @desc get the current logged in user details, create the get-me api, which will return the details of the currently logged in user, this will be a protected route, which means that only authenticated users can access this route, we will use the authUser middleware to protect this route
 * @access Private
 */

async function getMeController(req, res){
  try{
    const user = await userModel.findById(req.user.id); // req.user is set in the authUser middleware after verifying the token, authmiddle ware mai bana hai req.user, vaha pe decoded se jo id value jarhi hai, we are doing findById on that id 
    res.status(200).json({
      message: "User details fetched successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    })
  }catch(err){
    console.error(err);
    return res.status(500).json({
      message: `Error is : ${err}`,
    });
  }
}


module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
}