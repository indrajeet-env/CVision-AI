const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// MATCH THIS WITH MONGOOSE SCHEMA
const interviewReportSchema = z.object({
  matchScore: z.number(),

  technicalQuestions: z.array(z.object({
    question: z.string(),
    intention: z.string(),
    answer: z.string()
  })),

  behavioralQuestions: z.array(z.object({
    question: z.string(),
    intention: z.string(),
    answer: z.string()
  })),


  skillGap: z.array(z.object({
    skills: z.string(),
    severity: z.enum(["Low", "Medium", "High"])
  })),

  preparationPlan: z.array(z.object({
    day: z.number(),
    focus: z.string(),
    tasks: z.array(z.string())
  }))
});

async function generateInterviewReport({ resume, jobDescription, selfDescription }) {

  const prompt = `
You are an expert interviewer in all the fields.

Return ONLY valid JSON.

Generate HIGH-QUALITY, NON-GENERIC content based on the following candidate information

STRICT STRUCTURE:
{
  "matchScore": number,
  "technicalQuestions": [{ "question": "", "intention": "", "answer": "" }],
  "behavioralQuestions": [{ "question": "", "intention": "", "answer": "" }],
  "skillGap": [{ "skills": "", "severity": "Low" | "Medium" | "High" }],
  "preparationPlan": [{ "day": number, "focus": "", "tasks": [""] }]
}

STRICT REQUIREMENTS:

- At least 5 technical questions

- At least 5 behavioral questions

- Answers must NOT be generic

- Skill severity must be realistic (not all Low)

- Preparation plan MUST:

  - have 5 to 7 days

  - each day must have 2 to 4 tasks

  - tasks must be specific (e.g., "Implement JWT auth in Node.js", NOT "study auth")

INPUT:

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(interviewReportSchema),
    },
  });

  try {
    return (response.text);
  } catch (err) {
    throw new Error("AI returned invalid JSON");
  }
}

module.exports = generateInterviewReport;