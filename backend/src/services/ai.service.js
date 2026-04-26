const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

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

- The match score MUST be highly critical and realistic. Do not give a high score unless the candidate perfectly matches the job description.

- All questions should have a strong intention of why they are asked to the candidate and not something like "Understand candidate knowledge"

- Answers to these questions should be realistic and tailored to the candidate's resume and self description and not like "Provide a structured explanation"

- At least 5 behavioral questions

- Answers must NOT be generic and should be realistic and tailored to the candidate's resume and self description.

- Skill severity must be realistic (not all Low)

- Preparation Roadmap MUST be array of objects with keys: day(number), focus(string), tasks(array of strings):

  - Preparation Plan MUST BE for 7 days.

  - each day must have 2 tasks that makes sense and are not generic at all.

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
    model: "gemini-2.5-flash",
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