const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const generateInterviewReport = require("../services/ai.service");
const interviewReportController = require("../controllers/interview.controller");
const fileMiddleware = require('../middleware/file.middleware'); 

const interviewRouter = express.Router();

/**
 * @route POST /api/interview
 * @description Generate interview report for a candidate based on their resume, job description and self description using AI
 * @access public (no authentication required for now)
 */
interviewRouter.post("/", fileMiddleware.upload.single('resume'), authMiddleware.optionalAuthUser, interviewReportController.generateInterviewReportController)

/**
 * @GET /api/interview/report/:interviewId
 * @description Get interview report by interviewID
 * @access public
 */
interviewRouter.get("/report/:interviewId", authMiddleware.optionalAuthUser, interviewReportController.getInterviewReportByIdController)

/**
 * @GET /api/interview
 * @description Get all interview reports for the logged in user (or all if not logged in)
 * @access public
 */
interviewRouter.get("/", authMiddleware.optionalAuthUser, interviewReportController.getAllUserInterviewReportsController)

module.exports = interviewRouter