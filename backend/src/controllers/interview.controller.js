const pdfParse = require('pdf-parse');
const mongoose = require("mongoose");
const {generateInterviewReport, generateResumePdf} = require("../services/ai.service");
const normalizeInterviewReport = require("../utils/normalizeInterviewReport");
const interviewReportModel = require("../models/interviewReport.model");

async function generateInterviewReportController(req, res) {
  try {
    const { selfDescription, jobDescription } = req.body;
    
    // Validate required fields
    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ message: "Job description is required" });
    }

    // Resume and selfDescription validation
    let resumeContent = "";
    
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: "Only PDF files are supported" });
      }

      try {
        const pdfData = await pdfParse(req.file.buffer);
        resumeContent = pdfData.text;
      } catch (pdfError) {
        console.error("PDF Parsing Error:", pdfError);
        return res.status(400).json({ message: "Failed to parse PDF file" });
      }
    } else if (!selfDescription || selfDescription.trim().length === 0) {
      return res.status(400).json({ message: "Either resume file or self-description is required" });
    }

    // 1. Call AI
    const aiRawResponse = await generateInterviewReport({
      resume: resumeContent,
      selfDescription: selfDescription || "",
      jobDescription
    });

    // 2. Normalize (CRITICAL)
    const cleanedData = normalizeInterviewReport(aiRawResponse);

    // 3. Save safely
    const interviewReport = await interviewReportModel.create({
      user: req.user?.id || null,
      resume: resumeContent,
      jobDescription,
      selfDescription: selfDescription || "",
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

async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user?.id || null
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    return res.status(200).json({
      message: "Interview report fetched successfully",
      data: interviewReport
    });
  } catch (error) {
    console.error("Get Report Error:", error);
    return res.status(500).json({
      message: "Failed to fetch report",
      error: error.message
    });
  }
}

async function getAllUserInterviewReportsController(req, res){
  try {
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        message: "Unauthenticated users have no saved reports",
        data: []
      });
    }

    const interviewReports = await interviewReportModel.find({
      user: req.user.id
    }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v");

    return res.status(200).json({
      message: "User interview reports fetched successfully",
      data: interviewReports
    });
  } catch (error) {
    console.error("Get All Reports Error:", error);
    return res.status(500).json({
      message: "Failed to fetch reports",
      error: error.message
    });
  }
}

async function generateResumePdfController(req, res){
  try{
    const { interviewReportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(interviewReportId)) {
      return res.status(400).json({
        message: "Invalid interview report id",
      });
    }

    const interviewReport = await interviewReportModel.findById(interviewReportId);

    if(!interviewReport){
      return res.status(404).json({
        message: "Interview report not found"
      })
    }
    const { resume, selfDescription, jobDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({ resume, selfDescription, jobDescription });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=resume_${interviewReportId}.pdf`,
      'Content-Length': pdfBuffer.length
    })
    res.send(pdfBuffer);
    
  }catch(err){
    console.error("Generate Resume PDF Error:", err);
    return res.status(500).json({
      message: "Failed to generate resume PDF",
      error: err.message
    })
 }
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllUserInterviewReportsController,
  generateResumePdfController
}
