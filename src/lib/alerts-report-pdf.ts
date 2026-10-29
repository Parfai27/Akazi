import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { reportGeneratedAt } from "@/lib/report-range";

const FOREST = rgb(30 / 255, 107 / 255, 88 / 255);
const INK = rgb(23 / 255, 26 / 255, 33 / 255);
const WHITE = rgb(1, 1, 1);
const RULE = rgb(227 / 255, 235 / 255, 231 / 255);
const AMBER = rgb(245 / 255, 185 / 255, 66 / 255);
const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 32;

export type SignupSheetRow = {
  name: string;
  email: string;
  studies: string;
  hasCv: boolean;
  createdAt: string;
};

function winAnsi(value: string, font: PDFFont, size: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  try {
    font.widthOfTextAtSize(cleaned || " ", size);
    return cleaned;
  } catch {
    const plain = cleaned.replace(/[^\x20-\x7E]/g, "?");
    return plain;
  }
}

function pieces(word: string, font: PDFFont, size: number, width: number) {
  if (font.widthOfTextAtSize(word, size) <= width) return [word];
  const parts: string[] = [];
  let part = "";
  for (const char of word) {
    const next = part + char;
    if (font.widthOfTextAtSize(next, size) <= width) {
      part = next;
      continue;
    }
    if (part) parts.push(part);
    part = char;
  }
  if (part) parts.push(part);
  return parts;
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const source = winAnsi(text, font, size) || "-";
  const words = source.split(" ").flatMap((word) => pieces(word, font, size, width));
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function slashDate(iso: string) {
  const day = iso.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "-";
}

function coveredDays(rows: SignupSheetRow[]) {
  const days = rows.map((row) => row.createdAt.slice(0, 10)).filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)).sort();
  if (days.length === 0) return null;
  return { from: days[0], to: days[days.length - 1] };
}

function drawMark(page: PDFPage, x: number, y: number) {
  page.drawRectangle({ x, y, width: 36, height: 36, color: FOREST });
  page.drawRectangle({ x: x + 7, y: y + 6, width: 5, height: 10, color: WHITE });
  page.drawRectangle({ x: x + 15, y: y + 6, width: 5, height: 16, color: WHITE });
  page.drawRectangle({ x: x + 23, y: y + 8, width: 5, height: 18, color: WHITE });
  page.drawRectangle({ x: x + 23, y: y + 22, width: 5, height: 7, color: AMBER });
}

const COLUMNS = [
  { title: "#", width: 28 },
  { title: "Name", width: 145 },
  { title: "Email", width: 175 },
  { title: "Studies", width: 230 },
  { title: "Signed up", width: 78 },
  { title: "CV", width: 42 },
];

export async function alertsReportPdf(rows: SignupSheetRow[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const period = coveredDays(rows);
  const generated = reportGeneratedAt();
  const withCv = rows.filter((row) => row.hasCv).length;
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function rule() {
    page.drawRectangle({ x: MARGIN, y: y - 2, width: PAGE_WIDTH - MARGIN * 2, height: 1.5, color: FOREST });
  }

  function letterhead() {
    drawMark(page, MARGIN, y - 36);
    const center = PAGE_WIDTH / 2;
    page.drawText("AKAZI", { x: center - bold.widthOfTextAtSize("AKAZI", 11) / 2, y: y - 12, size: 11, font: bold, color: INK });
    const title = "ALERT SIGNUPS";
    page.drawText(title, {
      x: center - bold.widthOfTextAtSize(title, 16) / 2,
      y: y - 30,
      size: 16,
      font: bold,
      color: FOREST,
    });
    const subtitle = "People who agreed to email alerts within the dates below.";
    page.drawText(subtitle, {
      x: center - font.widthOfTextAtSize(subtitle, 9) / 2,
      y: y - 44,
      size: 9,
      font,
      color: INK,
    });
    const periodLine = period
      ? `Period: ${period.from} to ${period.to} - Generated: ${generated}`
      : `Period: no signups - Generated: ${generated}`;
    page.drawText(periodLine, {
      x: center - font.widthOfTextAtSize(periodLine, 9) / 2,
      y: y - 56,
      size: 9,
      font,
      color: INK,
    });
    y -= 70;
    rule();
    y -= 18;
    const filters = period
      ? `Period: ${period.from} to ${period.to}    Signups: ${rows.length}    CV saved: ${withCv}`
      : `Period: no signups    Signups: 0    CV saved: 0`;
    page.drawText(filters, { x: MARGIN, y, size: 10, font, color: INK });
    y -= 16;
    rule();
    y -= 16;
    page.drawText("SIGNUP RECORDS", { x: MARGIN, y, size: 11, font: bold, color: FOREST });
    y -= 14;
  }

  function tableHeader() {
    const height = 18;
    page.drawRectangle({ x: MARGIN, y: y - 4, width: PAGE_WIDTH - MARGIN * 2, height, color: FOREST });
    let x = MARGIN + 6;
    for (const column of COLUMNS) {
      page.drawText(column.title.toUpperCase(), { x, y: y, size: 8, font: bold, color: WHITE });
      x += column.width;
    }
    y -= 20;
  }

  function nextPage() {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    tableHeader();
  }

  letterhead();
  tableHeader();

  if (rows.length === 0) {
    page.drawText("No one has signed up yet.", { x: MARGIN + 6, y, size: 9, font, color: INK });
    y -= 24;
  }

  rows.forEach((row, index) => {
    const cells = [
      String(index + 1),
      row.name || "-",
      row.email || "-",
      row.studies || "Not given",
      slashDate(row.createdAt),
      row.hasCv ? "Yes" : "No",
    ];
    const wrapped = cells.map((cell, cellIndex) => wrap(cell, cellIndex === 4 || cellIndex === 5 ? bold : font, 8, COLUMNS[cellIndex].width - 8));
    const lines = Math.max(...wrapped.map((item) => item.length));
    const height = lines * 11 + 6;
    if (y - height < 48) nextPage();
    let x = MARGIN + 6;
    wrapped.forEach((item, cellIndex) => {
      item.forEach((line, lineIndex) => {
        page.drawText(line, {
          x,
          y: y - lineIndex * 11,
          size: 8,
          font: cellIndex === 5 ? bold : font,
          color: INK,
        });
      });
      x += COLUMNS[cellIndex].width;
    });
    y -= height;
    page.drawRectangle({ x: MARGIN, y: y + 4, width: PAGE_WIDTH - MARGIN * 2, height: 0.4, color: RULE });
  });

  if (y < 56) nextPage();
  y -= 16;
  page.drawRectangle({ x: MARGIN, y: y - 8, width: PAGE_WIDTH - MARGIN * 2, height: 26, color: FOREST });
  const left = winAnsi(`${rows.length} ${rows.length === 1 ? "signup" : "signups"} - ${withCv} with a CV`, bold, 10);
  page.drawText(left, { x: MARGIN + 12, y: y, size: 10, font: bold, color: WHITE });
  const right = period ? `Period: ${period.from} to ${period.to}` : "Period: no signups";
  page.drawText(right, {
    x: PAGE_WIDTH - MARGIN - 12 - bold.widthOfTextAtSize(right, 10),
    y,
    size: 10,
    font: bold,
    color: WHITE,
  });

  return pdf.save();
}
