const pdfParse = require('pdf-parse');
const mongoose = require("mongoose");
const {generateInterviewReport, generateResumePdf} = require("../services/ai.service");
const normalizeInterviewReport = require("../utils/normalizeInterviewReport");
const interviewReportModel = require("../models/interviewReport.model");

function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function buildSimpleResumePdfBuffer({ title, sections }) {
  const lines = [title, ""];
  sections.forEach((section) => {
    lines.push(section.heading);
    section.bodyLines.forEach((line) => lines.push(`- ${line}`));
    lines.push("");
  });

  const textOps = [];
  let y = 760;
  lines.forEach((line) => {
    if (y < 50) return;
    textOps.push(`1 0 0 1 50 ${y} Tm (${escapePdfText(line.slice(0, 110))}) Tj`);
    y -= 14;
  });

  const contentStream = `BT\n/F1 11 Tf\n${textOps.join("\n")}\nET`;
  const objects = [];

  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  const pageId = addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
  const streamId = addObject(`<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`);
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const objectIds = [catalogId, pagesId, pageId, streamId, fontId];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objectIds.forEach((id) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${id} 0 obj\n${objects[id - 1]}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objectIds.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objectIds.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

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

    let pdfBuffer;
    try {
      pdfBuffer = await generateResumePdf({ resume, selfDescription, jobDescription });
    } catch (resumeAiError) {
      // Fallback path for environments where headless Chromium or AI call fails.
      pdfBuffer = buildSimpleResumePdfBuffer({
        title: "Generated Resume (Fallback)",
        sections: [
          {
            heading: "Professional Summary",
            bodyLines: [
              (selfDescription || "Candidate summary is not available.").slice(0, 500),
            ],
          },
          {
            heading: "Relevant Experience / Profile Highlights",
            bodyLines: [
              (resume || "Resume content was not uploaded.").slice(0, 1200),
            ],
          },
          {
            heading: "Target Job Description",
            bodyLines: [
              (jobDescription || "Job description not available.").slice(0, 1200),
            ],
          },
        ],
      });
    }

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
