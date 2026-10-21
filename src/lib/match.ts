const STOP = new Set([
  "about",
  "ability",
  "across",
  "after",
  "also",
  "and",
  "are",
  "based",
  "been",
  "being",
  "both",
  "communication",
  "company",
  "during",
  "ensure",
  "excellent",
  "experience",
  "from",
  "good",
  "have",
  "high",
  "including",
  "into",
  "knowledge",
  "more",
  "other",
  "over",
  "position",
  "preferred",
  "provide",
  "qualifications",
  "requirements",
  "responsible",
  "role",
  "skills",
  "strong",
  "such",
  "support",
  "team",
  "than",
  "that",
  "their",
  "them",
  "they",
  "this",
  "through",
  "time",
  "using",
  "verbal",
  "well",
  "when",
  "where",
  "which",
  "while",
  "with",
  "within",
  "work",
  "written",
  "years",
  "your",
]);

function words(text: string) {
  return text.toLowerCase().match(/[a-z][a-z0-9+]{3,}/g) ?? [];
}

function phrases(studies: string) {
  return studies
    .split(/[,;/|]|\band\b/i)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length >= 3);
}

function stemHits(text: string, word: string) {
  const stem = word.slice(0, 4).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (stem.length < 4) return false;
  return new RegExp(`\\b${stem}`, "i").test(text);
}

export function matchesProfile(job: { title: string; description: string }, studies: string, cvText: string) {
  const haystack = `${job.title}\n${job.description}`.toLowerCase();
  const title = job.title.toLowerCase();
  const studyHit = phrases(studies).some((phrase) => {
    if (title.includes(phrase) || haystack.includes(phrase)) return true;
    return phrase.split(/\s+/).filter((word) => word.length >= 5).some((word) => stemHits(title, word));
  });
  if (studyHit) return true;

  const cvWords = [...new Set(words(cvText))].filter((word) => word.length >= 4 && !STOP.has(word));
  const inTitle = cvWords.filter((word) => title.includes(word.slice(0, Math.min(6, word.length))));
  if (inTitle.some((word) => word.length >= 5)) return true;
  const inBody = cvWords.filter((word) => haystack.includes(word.slice(0, Math.min(6, word.length))));
  return inBody.length >= 6 && inTitle.length >= 1;
}
