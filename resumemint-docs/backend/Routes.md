# Роуты API

## POST /api/resume/ats
Вход: `{ resumeText }` → Выход: `{ ats_score, issues[], usage }`  
Промпт: `sysAts` + `userAts()`.

## POST /api/resume/grade
Вход: `{ resumeText }` → Выход: `{ grade, usage }`  
Промпт: `sysGrade` + `userGrade()`.

## POST /api/resume/analyze
Вход: `{ resumeText }` → Выход: `resume_summary, hard_skills[], soft_skills[], grade, ats_score, issues[], usage`  
Промпт: `sysResumeAnalyze` + `userResumeAnalyze()`.

## POST /api/job/analyze
Вход: `{ jobText }` → Выход: `job_grade, requirements[], nice_to_have[], job_summary, usage`  
Промпт: `sysJobAnalyze` + `userJobAnalyze()`.

## POST /api/match
Вход: `{ resume_summary, hard_skills[], job_summary, requirements[] }` → Выход: `{ match_percent, gaps[], highlights[], explanation, usage }`  
Промпт: `sysMatch` + `userMatch()`.

## POST /api/cover-letter
Вход: `{ resume_summary, job_summary, tone? }` → Выход: `{ cover_letter, usage }`  
Промпт: `sysCover` + `userCover()`.

## POST /api/premium/oneshot`  **[PREMIUM]**
Вход: `{ resumeText, jobText }` → Выход: комбинированный JSON + `usage`  
Промпт: `sysPremium` + `userPremium()`.

## POST /api/combo/summary-match
Вход: `{ resumeText, jobText }` → Выход:
```
{
  resume: { resume_summary, hard_skills[] },
  job:    { requirements[], job_summary },
  match:  { match_percent, highlights[], gaps[], explanation },
  usage
}
```
Промпт: `sysCombo` + `userCombo()`.
