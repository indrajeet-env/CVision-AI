const mongoose = require('mongoose');

/**
 * - Job description schema: String
 * - Resume text: String
 * - self description: String
 * - matchScore : Number
 * 
 * Things we'll get From AI i.e (jo sab kuch AI generate krke dega)
 * 
 * - Technical questions => [{ // will be an array of objects
 *    "question": String,
 *    "intention": String,
 *    "answer": String
 *  }] 
 * 
 * - Behavioral questions => [{}] will be same as technical questions
 * 
 * - Skill gaps => [{
 *   "skill": String,
 *  "severity": {
 *    "type": String, 
 *    "enum": ["low", "medium", "high"]
 *   }
 * }] 
 * 
 * - preparation plan => [{
 *    day: Number,
 *    focus: String,
 *    tasks: [String]
 * }] 
 * 
 */

const technicalQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Technical questions are required"],
  },
  intention: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  }
}, {
  _id: false // This will prevent Mongoose from creating an _id field for each technical question because they are subdocuments of the interview report and we don't need separate IDs for them.
})

const behavioralQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Behavioral questions are required"],
  },
  intention: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  }
}, {
  _id: false 
})

const skillGapSchema = new mongoose.Schema({
  skills: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High"],
    required: true,
  },  
}, {
  _id: false,
})

const preparationPlanSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
  },
  focus: {
    type: String,
    required: true,
  },
  tasks: [{
    type: String,
    required: true,
  }]
}, {
  _id: false,
})

const interviewReportSchema = new mongoose.Schema({
  jobDescription: {
    type: String,
    required: true
  },
  resume: { // we would either need the resume text of the user or his self description to generate
    type: String,
  },
  selfDescription: {
    type: String,
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  technicalQuestions: [technicalQuestionSchema],
  behavioralQuestions: [behavioralQuestionSchema],
  skillGap: [skillGapSchema],
  preparationPlan: [preparationPlanSchema],

  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  title:{
    type: String,
    default: "Interview Plan",
  }

}, { timestamps: true });



const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);
module.exports = InterviewReport; 