const express = require('express');
const authRouter = express.Router();
const authController = require('../controllers/auth.controller');
const authmiddleware = require('../middleware/auth.middleware')

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */

authRouter.post('/register', authController.registerUserController);


/**
 * @route POST /api/auth/login
 * @desc Logging the user
 * @access Public
 */

authRouter.post('/login', authController.loginUserController);

/**
 * @route GET /api/auth/logout
 * @desc logging out the user, create the logout api, clear token from user's cookie and add token to blacklist
 * @access Public
 */

authRouter.get("/logout", authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @desc get the current logged in user details
 * @access Private
 */

authRouter.get("/get-me", authmiddleware.authUser, authController.getMeController);

module.exports = authRouter;