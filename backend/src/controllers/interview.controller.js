const pdfParse = require('pdf-parse');
const generateInterviewReport = require("../services/ai.service");
const normalizeInterviewReport = require("../utils/normalizeInterviewReport");
const interviewReportModel = require("../models/interviewReport.model");

async function generateInterviewReportController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
    const { selfDescription, jobDescription } = req.body;

    // 1. Call AI
    const aiRawResponse = await generateInterviewReport({
      resume: resumeContent.text,
      selfDescription,
      jobDescription
    });

    // 2. Normalize (CRITICAL)
    const cleanedData = normalizeInterviewReport(aiRawResponse);

    // 3. Save safely
    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeContent.text,
      jobDescription,
      selfDescription,
      ...cleanedData
    });

    return res.status(201).json({
      message: "Interview report generated successfully",
      data: interviewReport
    });

  } catch (error) {
    console.error("Interview Controller Error:", error);

    return res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
}

module.exports = {
  generateInterviewReportController
};