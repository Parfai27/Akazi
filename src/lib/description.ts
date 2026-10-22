const ACRONYMS = new Set(["ALU", "HR", "IT", "CV", "NGO", "UN", "CEO", "GTM", "USA", "UK", "AI", "QA", "EMEA"]);

export type DescriptionBlock = { kind: "heading" | "subheading" | "paragraph"; text: string };

const SMALL_WORDS = new Set(["a", "an", "and", "for", "in", "of", "on", "the", "to"]);

/** Section titles shared by every source. Longer phrases come first. */
const SECTION_LABELS = [
  "key duties and responsibilities",
  "duties and responsibilities",
  "other desired competencies and skills",
  "other desired competencies & skills",
  "minimum standard qualifications",
  "required qualifications",
  "minimum qualifications",
  "key responsibilities",
  "working conditions",
  "how to apply",
  "about the role",
  "job purpose",
  "job summary",
  "responsibilities",
  "qualifications",
  "requirements",
  "about you",
];

/** Short labels that introduce one fact, shown as colored keywords. */
const FIELD_LABELS = [
  "appointment type",
  "reporting to",
  "reports to",
  "job title",
  "department",
  "location",
  "experience",
  "positions",
  "essential",
  "desired",
];

function titleCaseLabel(label: string) {
  return label
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (word === "&") return "&";
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function wordsOf(line: string) {
  return line.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word));
}

function isHeading(line: string) {
  if (line.length < 3 || line.length > 80) return false;
  if (/[.!?]$/.test(line)) return false;
  if (/^https?:/i.test(line) || /@/.test(line)) return false;
  if (/^[-•*]/.test(line)) return false;
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (upper / letters.length >= 0.85) return true;
  const words = wordsOf(line);
  return (
    words.length <= 8 &&
    !line.includes(",") &&
    words.every((word) => /^[A-Z0-9]/.test(word) || /^(and|of|the|for|to|a|in|on|&)$/i.test(word))
  );
}

function labelPattern(labels: string[]) {
  return labels
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/&/g, "(?:&|and)"))
    .join("|");
}

const SECTION_PATTERN = labelPattern(SECTION_LABELS);
const FIELD_PATTERN = labelPattern(FIELD_LABELS);

function knownLabel(line: string): { kind: "heading" | "subheading"; label: string; rest: string } | null {
  const stripped = line.replace(/^\d{1,2}\s*[\).]\s*/, "").trim();
  const section = stripped.match(new RegExp(`^(${SECTION_PATTERN})\\s*([:;]?)\\s*(.*)$`, "i"));
  if (section && (!section[3].trim() || section[2] === ":" || section[2] === ";")) {
    return {
      kind: "heading",
      label: titleCaseLabel(section[1].replace(/\s*&\s*/g, " & ")),
      rest: section[3].trim(),
    };
  }
  const field = stripped.match(new RegExp(`^(${FIELD_PATTERN})\\s*:\\s*(.*)$`, "i"));
  if (field) {
    return { kind: "subheading", label: titleCaseLabel(field[1]), rest: field[2].trim() };
  }
  if (new RegExp(`^(${FIELD_PATTERN})$`, "i").test(stripped)) {
    return { kind: "subheading", label: titleCaseLabel(stripped), rest: "" };
  }
  return null;
}

function isBlockStart(line: string) {
  if (/^[-•*]/.test(line) || /^\d{1,2}\s*[\).]\s+\S/.test(line)) return true;
  if (knownLabel(line)) return true;
  return isHeading(line);
}

function unwrapLines(text: string) {
  const merged: string[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      merged.push("");
      continue;
    }
    const previous = merged.at(-1);
    const join = previous && previous !== "" && !isBlockStart(previous) && !isBlockStart(line) && !/^[-•*]/.test(line);
    if (join) merged[merged.length - 1] = `${previous} ${line}`;
    else merged.push(line);
  }
  return merged;
}

function readableHeading(line: string) {
  const letters = line.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (!letters || upper / letters.length < 0.85) return line.replace(/[:;]\s*$/, "");
  let wordIndex = 0;
  return line
    .replace(/[:;]\s*$/, "")
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
        wordIndex > 0 && SMALL_WORDS.has(lower) ? lower : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      wordIndex += 1;
      return formatted;
    })
    .join("");
}

function looksLikeDutyList(text: string) {
  if (/(^|\n)\s*(?:[•\-*]|\d+[\).]|[a-z][\).])\s+\S/i.test(text)) return true;
  return /;\s*\d+[\).]\s+\S/.test(text);
}

/**
 * Every opening, including ones added later, is rendered from this.
 * Sources only need to store the posting text.
 */
export function descriptionBlocks(text: string): DescriptionBlock[] {
  const lines = unwrapLines(text.replace(/;\s+(?=\d+[\).]\s)/g, ";\n"));
  const blocks: DescriptionBlock[] = [];

  const pushParagraph = (value: string) => {
    const clean = value.replace(/\s+\n/g, "\n").trim();
    if (clean) blocks.push({ kind: "paragraph", text: clean });
  };

  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) pushParagraph(paragraph.join("\n"));
    paragraph = [];
  };

  for (const line of lines) {
    if (!line) {
      flush();
      continue;
    }
    const known = knownLabel(line);
    if (known) {
      flush();
      blocks.push({ kind: known.kind, text: known.label });
      if (known.rest) pushParagraph(known.rest);
      continue;
    }
    if (isHeading(line)) {
      flush();
      blocks.push({ kind: "heading", text: readableHeading(line.replace(/^\d{1,2}\s*[\).]\s*/, "")) });
      continue;
    }
    paragraph.push(line);
  }
  flush();

  if (blocks[0]?.kind === "paragraph" && blocks.every((block) => block.kind === "paragraph") && looksLikeDutyList(text)) {
    blocks.unshift({ kind: "heading", text: "Duties and responsibilities" });
  }
  return blocks;
}
