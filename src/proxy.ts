import { NextResponse, type NextRequest } from "next/server";
import { CANONICAL_HOST } from "@/lib/site";

/**
 * Send the public Render hostname to akazi.co.rw.
 * Local dev stays put. Render's HTTP health probe sends `Render-Health-Check: 1`
 * and must get this instance's own response, not a redirect to the live site.
 */
export function proxy(request: NextRequest) {
  const hostname = hostnameOf(request.headers.get("host"));
  if (!hostname || isLocalHost(hostname) || hostname === CANONICAL_HOST) return NextResponse.next();
  if (request.headers.get("render-health-check") === "1") return NextResponse.next();
  if (hostname === `www.${CANONICAL_HOST}` || hostname.endsWith(".onrender.com")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

function hostnameOf(host: string | null) {
  return (host ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^\[|\]$/g, "");
}

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost")
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
