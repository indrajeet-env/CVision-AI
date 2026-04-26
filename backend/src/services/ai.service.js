const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// MATCH THIS WITH MONGOOSE SCHEMA
const interviewReportSchema = z.object({
  matchScore: z.number().describe("A realistic match score (0-100) comparing the resume/self-description to the job description."),

  technicalQuestions: z.array(z.object({
    question: z.string().describe("A specific technical question related to the job description and candidate's skills."),
    intention: z.string().describe("The specific reason this question is being asked, e.g., 'To evaluate the candidate's understanding of React hooks and state management.'"),
    answer: z.string().describe("A detailed, ideal answer tailored to the candidate's experience level.")
  })).describe("List of at least 5 technical interview questions."),

  behavioralQuestions: z.array(z.object({
    question: z.string().describe("A behavioral question based on the candidate's resume and job requirements."),
    intention: z.string().describe("The specific reason for this question, e.g., 'To assess conflict resolution skills in a team setting.'"),
    answer: z.string().describe("A detailed, ideal response utilizing the STAR method.")
  })).describe("List of at least 5 behavioral interview questions."),

  skillGap: z.array(z.object({
    skills: z.string().describe("A specific skill missing from the candidate's profile but required by the job description."),
    severity: z.enum(["Low", "Medium", "High"]).describe("Severity of the skill gap.")
  })).describe("List of identified skill gaps."),

  preparationPlan: z.array(z.object({
    day: z.number().describe("Day number (1 to 7)."),
    focus: z.string().describe("The main focus for the day, e.g., 'Advanced React Patterns'."),
    tasks: z.array(z.string()).describe("List of at least 2 highly specific, actionable tasks to prepare for the interview.")
  })).describe("A 7-day preparation roadmap tailored to close skill gaps and prepare for the specific questions."),

  title: z.string().describe("Title of the job for which the interview report is generated."),
});

async function generateInterviewReport({ resume, jobDescription, selfDescription }) {

  const prompt = `
You are an expert technical interviewer and career coach.

Return ONLY valid JSON.

Generate HIGH-QUALITY, NON-GENERIC content based on the following candidate information.

STRICT STRUCTURE:
{
  "matchScore": number,
  "technicalQuestions": [{ "question": "specific question string", "intention": "specific intention string", "answer": "specific answer string" }],
  "behavioralQuestions": [{ "question": "specific question string", "intention": "specific intention string", "answer": "specific answer string" }],
  "skillGap": [{ "skills": "specific skill name", "severity": "Low" | "Medium" | "High" }],
  "preparationPlan": [{ "day": number, "focus": "specific focus topic", "tasks": ["specific actionable task 1", "specific actionable task 2"] }]
}

STRICT REQUIREMENTS:

1. \`matchScore\`: A realistic integer from 0 to 100 representing how well the candidate fits the job. Be highly critical. Do not give a high score unless they perfectly match.
2. \`technicalQuestions\`: Array of exactly 5 OBJECTS.
   - \`question\`: A highly specific technical question tailored to the intersection of the candidate's resume and the job description.
   - \`intention\`: A very specific reason this question is being asked. DO NOT USE generic phrases like "Understand candidate knowledge". State exactly what technical concept is being tested.
   - \`answer\`: A detailed, ideal technical answer. DO NOT USE generic phrases like "Provide a structured explanation". Give the actual technical answer.
3. \`behavioralQuestions\`: Array of exactly 5 OBJECTS.
   - \`question\`: A behavioral question based on the candidate's specific past projects.
   - \`intention\`: Specific reason for this question.
   - \`answer\`: A realistic STAR method answer.
4. \`skillGap\`: Array of missing skills. \`severity\` must be exactly one of: "Low", "Medium", "High". Ensure realistic severities.
5. \`preparationPlan\`: Array of exactly 7 OBJECTS (one for each day, 1 to 7).
   - \`day\`: The day number (1 to 7).
   - \`focus\`: A highly specific topic for the day (e.g., "Advanced System Design").
   - \`tasks\`: An array of at least 2 highly specific, actionable string tasks (e.g., "Implement a rate limiter in Node.js", not "Study Node.js").

INPUT:

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      matchScore: {
        type: "INTEGER",
        description: "A realistic match score (0-100) comparing the resume to the job description."
      },
      technicalQuestions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            intention: { type: "STRING" },
            answer: { type: "STRING" }
          },
          required: ["question", "intention", "answer"]
        }
      },
      behavioralQuestions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            intention: { type: "STRING" },
            answer: { type: "STRING" }
          },
          required: ["question", "intention", "answer"]
        }
      },
      skillGap: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            skills: { type: "STRING" },
            severity: { 
              type: "STRING",
              enum: ["Low", "Medium", "High"]
            }
          },
          required: ["skills", "severity"]
        }
      },
      preparationPlan: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            day: { type: "INTEGER" },
            focus: { type: "STRING" },
            tasks: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["day", "focus", "tasks"]
        }
      }
    },
    required: ["matchScore", "technicalQuestions", "behavioralQuestions", "skillGap", "preparationPlan"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  try {
    return (response.text);
  } catch (err) {
    throw new Error("AI returned invalid JSON");
  }
}


async function generatePdfFromHtml(htmlContent){
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent), {waitUntil: 'networkidle0'};

  const pdfBuffer = await page.pdf({ format: 'A4', 
                                     margin: { 
                                      top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' 
                                    } 
                                  });
  await browser.close();
  return pdfBuffer;
}

// Basically LLM se html generate krwa ke usko puppeteer se pdf me convert krwa denge. And then ye pdf ko humare server se bhejdege client side mai
async function generateResumePdf({resume, selfDescription, jobDescription}){

  const resumePdfSchema = z.object({
    html: z.string().describe("The HTML content for the resume PDF, formatted professionally and tailored to the job description.")
  })

  const prompt = `
  GENERATE RESUME FOR A CANDIDATE WITH FOLLOWING DETAILS:
    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}

    The response should be a JSON object with a single key "html" which contains the HTML string for the resume. 

    The HTML should be well-structured and styled professionally, suitable for conversion to PDF. 

    The content should be tailored to highlight the candidate's strengths in relation to the job description.

    The content of resume should not look generic and AI generated, but should look like a real resume created by a human based on the provided information.

    You can highlight relevant skills, experience and achievements that match the job description, and format the resume in a clear and visually appealing way.

    The content should be ATS friendly, i.e should be parseable by Applicant Tracking Systems, so avoid using complex tables or graphics for important information.

    The resume should ideally be one page long, but can extend to two pages, but not more than that, Reduce the font size if necessary, make sure the resume is optimized for getting hired.
  `

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumePdfSchema),
    },
  });

  const jsonContent = JSON.parse(response.text).html;

  const pdfBuffer = await generatePdfFromHtml(jsonContent);

  return pdfBuffer;

}

module.exports = { generateInterviewReport, generateResumePdf };