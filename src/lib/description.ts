import { stripAdSnippets } from "./html-text";

const ACRONYMS = new Set(["ALU", "HR", "IT", "CV", "NGO", "UN", "CEO", "GTM", "USA", "UK", "AI", "QA", "EMEA"]);

export type DescriptionBlock =
  | { kind: "heading" | "paragraph"; text: string }
  | { kind: "field"; label: string; value: string };

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
  "openings",
];

/** A label and its value belong on one line, wherever a posting uses them. */
const FIELD_LABELS = [
  "appointment type",
  "reporting to",
  "reports to",
  "job title",
  "role title",
  "role type",
  "job type",
  "department",
  "location",
  "experience",
  "positions",
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

function unmatchedClose(line: string) {
  let depth = 0;
  for (const character of line) {
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
  }
  return depth < 0;
}

function isHeading(line: string) {
  const value = withoutMarker(line);
  if (value.length < 3 || value.length > 80) return false;
  if (/[.!?]$/.test(value) || unmatchedClose(value)) return false;
  if (/^https?:/i.test(value) || /@/.test(value) || value.includes(":") || value.includes(";") || isBullet(value)) return false;
  if (looksLikeName(value)) return false;
  const letters = value.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (upper / letters.length >= 0.85) return true;
  const words = wordsOf(value);
  return (
    words.length <= 8 &&
    !value.includes(",") &&
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

function withoutMarker(line: string) {
  return line.replace(/^\s*(?:[IVXLC]{1,6}\.\s+|\d{1,2}\s*[\).]\s+)/i, "").trim();
}

/** A copied posting sometimes glues a label to its value, or adds a board's own prompt. */
export function cleanPostingText(text: string) {
  const labels = [...FIELD_LABELS].sort((left, right) => right.length - left.length);
  let cleaned = stripAdSnippets(text).replace(/\r\n/g, "\n");
  for (const label of labels) {
    cleaned = cleaned.replace(new RegExp(`(^|\\n)(${label})(?=[A-Z])`, "gi"), "$1$2: ");
  }
  cleaned = cleaned.replace(/(^|\n)(?!https?:)([A-Za-z][A-Za-z .]{1,40}):(?=\S)/gi, "$1$2: ");
  return cleaned
    .split("\n")
    .filter((line) => {
      const value = line.trim();
      if (!value) return true;
      if (/^[-_]{3,}$/.test(value)) return false;
      if (/^(?:please\s+)?click here(?:\s+to\s+(?:read more(?:\s+and apply)?|apply|view|download))?[.!]?\s*$/i.test(value)) return false;
      if (/^read more(?:\s+and apply)?[.!]?\s*$/i.test(value)) return false;
      if (/^apply (?:here|now)[.!]?\s*$/i.test(value)) return false;
      if (/^minimum gpa:\s*mid\.?\s*$/i.test(value)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** One board page can list several titled roles. Each published opening keeps its own part. */
export function splitTitledRoles(text: string): { title: string; body: string }[] | null {
  const pattern = /(?:^|\n)\s*((?:[IVXLC]+\.\s*)?(?:Job\s+)?Title\s*:\s*[^\n]+)/gi;
  const marks = [...text.matchAll(pattern)];
  if (marks.length < 2) return null;
  const roles = marks.map((mark, index) => {
    const start = (mark.index ?? 0) + (matchStartsAfterBreak(mark[0]) ? 1 : 0);
    const end = index + 1 < marks.length ? (marks[index + 1].index ?? text.length) : text.length;
    const title = mark[1].replace(/^(?:[IVXLC]+\.\s*)?(?:Job\s+)?Title\s*:\s*/i, "").trim();
    const body = text
      .slice(start, end)
      .trim()
      .replace(/^(?:[IVXLC]+\.\s*)?(?:Job\s+)?Title\s*:\s*[^\n]+\s*/i, "")
      .trim();
    return { title, body };
  });
  if (roles.some((role) => role.title.length < 3 || role.body.length < 40)) return null;
  return roles;
}

function matchStartsAfterBreak(value: string) {
  return value.startsWith("\n");
}

function looksLikeName(line: string) {
  if (/[-&/]/.test(line)) return false;
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  const surname = words.filter((word) => word.length >= 4 && word === word.toUpperCase() && /^[A-Z]+$/.test(word));
  const given = words.filter((word) => /^[A-Z][a-z.'’]+$/.test(word));
  return surname.length === 1 && given.length >= 1 && surname.length + given.length === words.length;
}

function knownLabel(line: string): { kind: "heading" | "field"; label: string; rest: string } | null {
  const stripped = withoutMarker(line);
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
    return { kind: "field", label: titleCaseLabel(field[1]), rest: field[2].trim() };
  }
  if (new RegExp(`^(${FIELD_PATTERN})$`, "i").test(stripped)) {
    return { kind: "field", label: titleCaseLabel(stripped), rest: "" };
  }
  const loose = stripped.match(new RegExp(`^(${FIELD_PATTERN})\\s+(\\S.{0,48})$`, "i"));
  if (loose && !/[.!?]/.test(loose[2])) {
    return { kind: "field", label: titleCaseLabel(loose[1]), rest: loose[2].trim() };
  }
  return null;
}

function isBullet(line: string) {
  return /^[-•*]/.test(line) || /^[\u00B7\u2022\u2023\u2043\u2219\u25AA\u25CF\u25E6\uF0B7]/.test(line);
}

function isBlockStart(line: string) {
  if (isBullet(line) || /^\d{1,2}\s*[\).]\s+\S/.test(line)) return true;
  if (knownLabel(line)) return true;
  return isHeading(line);
}

function continuesPrevious(previous: string, line: string) {
  if (isBullet(line) || knownLabel(line) || isHeading(line)) return false;
  return unmatchedClose(line);
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
    const join =
      previous &&
      previous !== "" &&
      ((!isBlockStart(previous) && !isBlockStart(line)) || continuesPrevious(previous, line));
    if (join) merged[merged.length - 1] = `${previous} ${line}`;
    else merged.push(line);
  }
  return merged;
}

/** Wingdings and other drawn marks become a normal dot. */
function normalizeBullets(text: string) {
  return text
    .replace(/[\u00B7\u2023\u2043\u2219\u25AA\u25A0\u25CF\u25E6\uF076\uF0A7\uF0B7\uF0D8\uF0FC]/g, "•")
    .replace(/(^|\n)•(?=\S)/g, "$1• ");
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

function isSectionHeading(text: string) {
  return new RegExp(`^(${SECTION_PATTERN})$`, "i").test(text.trim());
}

function isShortListLine(text: string) {
  return text.split("\n").every((line) => line.length > 0 && line.length <= 80 && !/[.!?]$/.test(line) && !isBullet(line));
}

function titleRunLength(blocks: DescriptionBlock[], start: number) {
  let count = 0;
  for (let index = start; index < blocks.length; index += 1) {
    const item = blocks[index];
    if (item.kind !== "heading" || isSectionHeading(item.text)) break;
    count += 1;
  }
  return count;
}

function takeTitleRun(blocks: DescriptionBlock[], start: number) {
  const lines: string[] = [];
  let index = start;
  while (index < blocks.length) {
    const item = blocks[index];
    if (item.kind !== "heading" || isSectionHeading(item.text)) break;
    lines.push(item.text);
    index += 1;
  }
  return { lines, index };
}

/**
 * A long run of role titles is one normal list.
 * A heading that introduces its own line, such as Job Location, stays a heading.
 */
function softenTitleLists(blocks: DescriptionBlock[]): DescriptionBlock[] {
  const result: DescriptionBlock[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    if (block.kind !== "heading" || isSectionHeading(block.text) || titleRunLength(blocks, index) < 4) {
      result.push(block);
      index += 1;
      continue;
    }
    const taken = takeTitleRun(blocks, index);
    let text = taken.lines.join("\n");
    const last = result.at(-1);
    if (last?.kind === "paragraph" && isShortListLine(last.text) && !last.text.includes("\n")) {
      result.pop();
      text = `${last.text}\n${text}`;
    }
    while (result.length) {
      const previous = result.at(-1);
      if (!previous) break;
      if (previous.kind === "heading" && !isSectionHeading(previous.text)) {
        result.pop();
        text = `${previous.text}\n${text}`;
        continue;
      }
      if (previous.kind === "paragraph" && isShortListLine(previous.text) && !previous.text.includes("\n")) {
        result.pop();
        text = `${previous.text}\n${text}`;
        continue;
      }
      break;
    }
    result.push({ kind: "paragraph", text });
    index = taken.index;
  }
  return result;
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
  const lines = unwrapLines(normalizeBullets(cleanPostingText(text)).replace(/;\s+(?=\d+[\).]\s)/g, ";\n"));
  const blocks: DescriptionBlock[] = [];

  const pushParagraph = (value: string) => {
    const clean = value.replace(/\s+\n/g, "\n").trim();
    if (clean) blocks.push({ kind: "paragraph", text: clean });
  };

  let paragraph: string[] = [];
  let afterName = false;
  let closing = false;
  const flush = () => {
    if (paragraph.length) pushParagraph(paragraph.join("\n"));
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      flush();
      continue;
    }
    if (/^(?:[IVXLC]+\.\s*)?(?:job\s+)?title\s*:/i.test(line)) continue;
    if (/^done (?:at|in)\b/i.test(line)) closing = true;
    if (closing && !knownLabel(line)) {
      paragraph.push(line);
      continue;
    }
    if (afterName && !knownLabel(line) && wordsOf(line).length <= 6 && !/[.!?]$/.test(line)) {
      paragraph.push(line);
      afterName = false;
      continue;
    }
    afterName = looksLikeName(line) || (/;/.test(line) && line.length <= 40 && !/[.!?]$/.test(line));
    const known = knownLabel(line);
    if (known?.kind === "field") {
      flush();
      let value = known.rest;
      const upcoming = lines[index + 1];
      if (!value && upcoming && !knownLabel(upcoming) && !isHeading(upcoming)) {
        value = upcoming;
        index += 1;
      }
      blocks.push({ kind: "field", label: known.label, value });
      continue;
    }
    if (known) {
      flush();
      blocks.push({ kind: "heading", text: known.label });
      if (known.rest) pushParagraph(known.rest);
      continue;
    }
    if (isHeading(line)) {
      flush();
      blocks.push({ kind: "heading", text: readableHeading(withoutMarker(line)) });
      continue;
    }
    paragraph.push(line);
  }
  flush();

  const shaped = softenTitleLists(blocks);
  if (shaped[0]?.kind === "paragraph" && shaped.every((block) => block.kind === "paragraph") && looksLikeDutyList(text)) {
    shaped.unshift({ kind: "heading", text: "Duties and responsibilities" });
  }
  return shaped;
}
