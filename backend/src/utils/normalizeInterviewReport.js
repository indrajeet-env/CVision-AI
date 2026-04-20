function safeJSONParse(raw) {
  // If already object → return directly
  if (typeof raw === "object") return raw;

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("AI did not return valid JSON");
  }
}
// Ensure value is always an array
function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

// Normalize severity casing
function normalizeSeverity(sev) {
  if (!sev) return "Low";

  const s = sev.toString().toLowerCase();

  if (s === "low") return "Low";
  if (s === "medium") return "Medium";
  if (s === "high") return "High";

  return "Low"; // fallback
}

// Clean string safely
function cleanString(val) {
  if (!val) return "";
  return String(val).trim();
}

// Normalize technical / behavioral questions
function normalizeQuestions(arr) {
  arr = ensureArray(arr);

  return arr.map((q, index) => {
    if (typeof q === "string") {
      // If AI gave string instead of object → fix
      return {
        question: cleanString(q),
        intention: "Understand candidate knowledge",
        answer: "Provide a structured explanation"
      };
    }

    return {
      question: cleanString(q.question || `Question ${index + 1}`),
      intention: cleanString(q.intention || "Understand candidate thinking"),
      answer: cleanString(q.answer || "Explain clearly with examples")
    };
  });
}

// Normalize skill gaps
function normalizeSkillGap(arr) {
  arr = ensureArray(arr);

  return arr.map((s) => {
    if (typeof s === "string") {
      return {
        skills: cleanString(s),
        severity: "Low"
      };
    }

    return {
      skills: cleanString(s.skills || "Unknown Skill"),
      severity: normalizeSeverity(s.severity)
    };
  });
}

// Normalize preparation plan
function normalizePreparationPlan(arr) {
  arr = ensureArray(arr);

  return arr.map((p, index) => {
    return {
      day: Number(p.day) || index + 1,
      focus: cleanString(p.focus || "General Preparation"),
      tasks: ensureArray(p.tasks).map((t) => cleanString(t)).filter(Boolean)
    };
  });
}

// Clamp match score
function normalizeMatchScore(score) {
  let num = Number(score);

  if (isNaN(num)) return 50;

  if (num < 0) return 0;
  if (num > 100) return 100;

  return num;
}

// MAIN FUNCTION
function normalizeInterviewReport(rawAIResponse) {
  const parsed = safeJSONParse(rawAIResponse);

  const normalized = {
    matchScore: normalizeMatchScore(parsed.matchScore),

    technicalQuestions: normalizeQuestions(parsed.technicalQuestions),

    behavioralQuestions: normalizeQuestions(parsed.behavioralQuestions),

    skillGap: normalizeSkillGap(parsed.skillGap),

    preparationPlan: normalizePreparationPlan(parsed.preparationPlan),
  };

  return normalized;
}

module.exports = normalizeInterviewReport;