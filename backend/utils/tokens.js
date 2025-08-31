// Быстрая оценка: ~4 символа на токен — этого достаточно для принятия решения
function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}

// Бюджеты на вход — подгони под свою модель
const LIMITS = {
  resume: {
    condenseIfOver: 2000,  // > ~2000 токенов — ужимаем
    hardCap:       6000    // режем жёстко, чтобы не уронить запрос
  },
  jd: {
    condenseIfOver: 1500,
    hardCap:        5000
  }
};

module.exports = { estimateTokens, LIMITS };
