module.exports = (req, res) => {
  res.status(200).json({
    has_LLM_API_KEY: Boolean(process.env.LLM_API_KEY),
    has_OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    base_url: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || process.env.OPENROUTER_BASE_URL || null,
    model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || null,
    region: process.env.VERCEL_REGION || null
  });
};


