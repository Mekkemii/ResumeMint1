const JD_HINTS = [
  'обязанности', 'требования', 'ответственности', 'что делать',
  "responsibilities", 'requirements', "what you'll do", 'must have', 'nice to have'
];

function extractRelevantJD(input) {
  if (!input) return '';
  let t = String(input).replace(/\r/g, '').slice(0, 4000);
  t = t.replace(/пользовательское соглашение|персональных данных|политик[аи]/gi, ' ');
  const lines = t.split(/\n+/);
  const keep = [];
  for (const ln of lines) {
    const s = ln.trim();
    if (!s) continue;
    if (JD_HINTS.some(h => s.toLowerCase().includes(h))) keep.push(s);
  }
  const core = keep.join('\n');
  return core.length > 300 ? core : t;
}

module.exports = { extractRelevantJD };


