const mammoth = require('mammoth');

// Optional: pdf-parse could be added later if needed; current repo didn't include it
// const pdf = require('pdf-parse');

const EXPERIENCE_ALIASES = [
  'опыт', 'деятельность', 'employment', 'work history', 'career', 'карьерный путь'
];

async function toPlainText(file, rawText) {
  if (rawText && String(rawText).trim().length > 0) return String(rawText);
  if (!file) return '';

  const name = (file.originalname || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();

  if (mimetype.includes('word') || name.endsWith('.docx')) {
    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
    return value || '';
  }
  // if (mimetype.includes('pdf') || name.endsWith('.pdf')) {
  //   const parsed = await pdf(file.buffer);
  //   return parsed.text || '';
  // }
  return Buffer.from(file.buffer).toString('utf8');
}

function normalizeExperience(text) {
  let t = String(text || '').replace(/\r/g, '');
  t = t.replace(/[ \t]{2,}/g, ' ');
  const pattern = new RegExp(`^\n?\s*(${EXPERIENCE_ALIASES.join('|')})\s*$`, 'gmi');
  t = t.replace(pattern, 'Experience');
  return t.trim();
}

module.exports = { toPlainText, normalizeExperience };


