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

function wrapText(text, maxCharsPerLine) {
  const cleanedText = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleanedText) return [];

  const words = cleanedText.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      return;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

function buildStyledResumePdfBuffer({ title, subtitle, sections }) {
  const marginX = 52;
  const topY = 760;
  const bottomY = 52;

  const pages = [[]];
  let currentPageIndex = 0;
  let y = topY;

  const ensurePageSpace = (requiredHeight = 16) => {
    if (y - requiredHeight >= bottomY) return;
    pages.push([]);
    currentPageIndex += 1;
    y = topY;
  };

  const addLine = ({ text, size = 11, font = "F1", color = "0 0 0", indent = 0, lineHeight = size + 4 }) => {
    ensurePageSpace(lineHeight);
    pages[currentPageIndex].push(`BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${marginX + indent} ${y} Tm (${escapePdfText(text)}) Tj ET`);
    y -= lineHeight;
  };

  const addSpacer = (height = 10) => {
    ensurePageSpace(height);
    y -= height;
  };

  const addWrappedParagraph = ({ text, size = 11, color = "0 0 0", font = "F1", indent = 0 }) => {
    const maxChars = Math.max(25, Math.floor((100 - indent / 2) * (11 / size)));
    const lines = wrapText(text, maxChars);
    lines.forEach((line) => addLine({ text: line, size, color, font, indent, lineHeight: size + 4 }));
  };

  addLine({ text: title || "Generated Resume", size: 22, font: "F2", color: "0.12 0.20 0.39", lineHeight: 28 });
  if (subtitle) {
    addWrappedParagraph({ text: subtitle, size: 10, color: "0.34 0.38 0.46" });
  }
  addSpacer(10);
  addLine({ text: "Professional Resume", size: 13, font: "F2", color: "0.20 0.30 0.56", lineHeight: 20 });
  addLine({ text: " ", size: 11, color: "0.85 0.87 0.92", lineHeight: 3 });
  addSpacer(6);

  sections.forEach((section) => {
    if (!section?.heading) return;
    addLine({ text: section.heading.toUpperCase(), size: 12, font: "F2", color: "0.16 0.24 0.44", lineHeight: 18 });
    addSpacer(4);

    (section.bodyLines || [])
      .filter(Boolean)
      .forEach((line) => {
        const bulletLines = wrapText(line, 85);
        bulletLines.forEach((bulletLine, idx) => {
          addLine({
            text: idx === 0 ? `- ${bulletLine}` : `  ${bulletLine}`,
            size: 10.5,
            color: "0.11 0.11 0.11",
            indent: 4,
            lineHeight: 15,
          });
        });
      });

    addSpacer(10);
  });

  const objects = [];

  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };
  const setObject = (id, body) => {
    objects[id - 1] = body;
  };

  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];

  pages.forEach((pageOps) => {
    const contentStream = pageOps.join("\n");
    const streamId = addObject(`<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> >>`);
    pageIds.push(pageId);
  });

  setObject(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  setObject(pagesId, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);

  const objectIds = objects.map((_, idx) => idx + 1);
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
      console.error("AI/Chromium resume generation failed, using styled fallback:", resumeAiError.message);
      pdfBuffer = buildStyledResumePdfBuffer({
        title: interviewReport.title || "Generated Resume",
        subtitle: `Prepared from interview insights • Match Score: ${Math.round(interviewReport.matchScore || 0)}%`,
        sections: [
          {
            heading: "Professional Summary",
            bodyLines: [
              (selfDescription || "Candidate summary is not available.").slice(0, 700),
            ],
          },
          {
            heading: "Relevant Experience / Profile Highlights",
            bodyLines: [
              ...(resume
                ? resume
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .slice(0, 12)
                : ["Resume content was not uploaded."]),
            ],
          },
          {
            heading: "Technical Interview Focus Areas",
            bodyLines: [
              ...((interviewReport.technicalQuestions || []).slice(0, 5).map((q) => q.question)),
            ],
          },
          {
            heading: "Behavioral Interview Focus Areas",
            bodyLines: [
              ...((interviewReport.behavioralQuestions || []).slice(0, 4).map((q) => q.question)),
            ],
          },
          {
            heading: "Skill Gaps to Address",
            bodyLines: [
              ...((interviewReport.skillGap || []).slice(0, 6).map((item) => `${item.skills} (${item.severity})`)),
            ],
          },
          {
            heading: "Target Job Description",
            bodyLines: [
              (jobDescription || "Job description not available.").slice(0, 900),
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
