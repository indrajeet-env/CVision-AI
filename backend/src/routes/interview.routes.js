const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const generateInterviewReport = require("../services/ai.service");
const interviewReportController = require("../controllers/interview.controller");
const fileMiddleware = require('../middleware/file.middleware'); 

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description Generate interview report for a candidate based on their resume, job description and self description using AI
 * @access private (we can add authentication middleware and make it accessible only to logged in users)
 */

interviewRouter.post("/", authMiddleware.authUser, fileMiddleware.upload.single('resume'), interviewReportController.generateInterviewReportController)


module.exports = interviewRouter