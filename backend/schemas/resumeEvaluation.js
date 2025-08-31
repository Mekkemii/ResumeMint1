/**
 * JSON-схема для оценки резюме
 * Используется с OpenAI Structured Outputs для гарантированного формата ответа
 */

const resumeEvaluationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    grade: {
      type: "object",
      additionalProperties: false,
      properties: {
        level: {
          type: "string",
          enum: ["Junior", "Middle", "Senior", "Lead"]
        },
        reason: {
          type: "string",
          maxLength: 500
        }
      },
      required: ["level", "reason"]
    },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        text: {
          type: "integer",
          minimum: 0,
          maximum: 100
        },
        structure: {
          type: "integer",
          minimum: 0,
          maximum: 100
        },
        overall: {
          type: "integer",
          minimum: 0,
          maximum: 100
        }
      },
      required: ["text", "structure", "overall"]
    },
    strengths: {
      type: "array",
      items: {
        type: "string",
        maxLength: 200
      },
      maxItems: 7
    },
    gaps: {
      type: "array",
      items: {
        type: "string",
        maxLength: 200
      },
      maxItems: 7
    },
    add: {
      type: "array",
      items: {
        type: "string",
        maxLength: 200
      },
      maxItems: 7
    },

    questions: {
      type: "array",
      items: {
        type: "string",
        maxLength: 200
      },
      maxItems: 6
    }
  },
  required: ["grade", "scores", "strengths", "gaps", "add", "questions"]
};

module.exports = { resumeEvaluationSchema };
