import * as cheerio from "cheerio";

function unescapeHtml(value: string) {
  if (!value.includes("&lt;") && !value.includes("&gt;") && !value.includes("&amp;")) return value;
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function htmlToText(html: string): string {
  const $ = cheerio.load(unescapeHtml(html));
  $("script, style, noscript").remove();
  $("br").replaceWith("\n");
  $("p, li, h1, h2, h3, h4, tr").each((_, element) => {
    $(element).append("\n");
  });
  return $("body")
    .text()
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
