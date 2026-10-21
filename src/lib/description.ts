const ACRONYMS = new Set(["ALU", "HR", "IT", "CV", "NGO", "UN", "CEO", "GTM", "USA", "UK", "AI", "QA", "EMEA"]);

export type DescriptionBlock = { kind: "heading" | "paragraph"; text: string };

function isHeading(line: string) {
  if (line.length < 3 || line.length > 72) return false;
  if (/[.!?]$/.test(line)) return false;
  if (/^https?:/i.test(line) || /@/.test(line)) return false;
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (upper / letters.length >= 0.85) return true;
  const words = line.split(/\s+/);
  return (
    words.length <= 6 &&
    !line.includes(",") &&
    words.every((word) => /^[A-Z0-9]/.test(word) || /^(and|of|the|for|to|a|in|on|&)$/i.test(word))
  );
}

const SMALL_WORDS = new Set(["a", "an", "and", "for", "in", "of", "on", "the", "to"]);
const SECTION_LABELS = [
  "duties and responsibilities",
  "key responsibilities",
  "minimum qualifications",
  "required qualifications",
  "job purpose",
];

function titleCaseLabel(label: string) {
  return label
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function liftSectionLabels(text: string) {
  const names = SECTION_LABELS.join("|");
  return text.replace(new RegExp(`(?:^|[\\n.;])\\s*(${names})\\s*:`, "gi"), (match, label: string) => {
    const lead = /^[.;]/.test(match) ? match.charAt(0) : "";
    return `${lead}\n\n${titleCaseLabel(label)}\n\n`;
  });
}

function looksLikeDutyList(text: string) {
  if (/(^|\n)\s*(?:[•\-*]|\d+[\).]|[a-z][\).])\s+\S/i.test(text)) return true;
  return /;\s*\d+[\).]\s+\S/.test(text);
}

function readableHeading(line: string) {
  const letters = line.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (!letters || upper / letters.length < 0.85) return line;
  let wordIndex = 0;
  return line
    .split(/(\s+)/)
    .map((part) => {
      const word = part.replace(/[^A-Za-z]/g, "");
      if (!word) return part;
      if (ACRONYMS.has(word)) {
        wordIndex += 1;
        return part;
      }
      const lower = word.toLowerCase();
      const formatted =
        wordIndex > 0 && SMALL_WORDS.has(lower)
          ? lower
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      wordIndex += 1;
      return formatted;
    })
    .join("");
}

export function descriptionBlocks(text: string): DescriptionBlock[] {
  const prepared = liftSectionLabels(text).replace(/;\s+(?=\d+[\).]\s)/g, ";\n");
  const blocks: DescriptionBlock[] = [];
  for (const chunk of prepared.split(/\n{2,}/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    if (isHeading(lines[0])) {
      blocks.push({ kind: "heading", text: readableHeading(lines[0]) });
      if (lines.length > 1) blocks.push({ kind: "paragraph", text: lines.slice(1).join("\n") });
      continue;
    }
    blocks.push({ kind: "paragraph", text: lines.join("\n") });
  }
  if (blocks[0]?.kind !== "heading" && looksLikeDutyList(text)) {
    blocks.unshift({ kind: "heading", text: "Duties and responsibilities" });
  }
  return blocks;
}
