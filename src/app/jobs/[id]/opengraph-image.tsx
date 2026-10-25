import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { companyLogo } from "@/lib/company-logos";
import { getJob } from "@/lib/jobs";

export const alt = "Company logo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

async function logoData(src: string) {
  if (src.startsWith("/")) {
    const ext = src.split(".").pop()?.toLowerCase() ?? "";
    const type = TYPES[ext];
    if (!type) return null;
    const file = await readFile(join(process.cwd(), "public", src.slice(1)));
    return `data:${type};base64,${file.toString("base64")}`;
  }
  const response = await fetch(src, {
    headers: { "user-agent": "AkaziBot/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return null;
  const type = (response.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!Object.values(TYPES).includes(type)) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return `data:${type};base64,${bytes.toString("base64")}`;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  const company = job?.company ?? "Akazi";
  const logo = job ? companyLogo(job.company) : null;
  const src = logo ? await logoData(logo.src).catch(() => null) : null;
  const letter = company.trim().charAt(0).toUpperCase() || "A";
  const cover = Boolean(logo?.cover);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f2f7f5",
        }}
      >
        <div
          style={{
            width: 440,
            height: 440,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: 56,
            background: src ? (cover ? "#0b2f6b" : "#ffffff") : "#1e6b58",
          }}
        >
          {src ? (
            <img src={src} width={cover ? 440 : 340} height={cover ? 440 : 340} />
          ) : (
            <div style={{ fontSize: 200, fontWeight: 700, color: "#ffffff" }}>{letter}</div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
