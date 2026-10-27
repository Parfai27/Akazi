export type CompanyLogo = { src: string; cover?: boolean; bg?: string };

/** Public logos from each employer's own career page. `cover` fills the box when the file is already a square mark. */
const LOGOS: Record<string, CompanyLogo> = {
  "One Acre Fund": { src: "/logos/one-acre-fund.svg" },
  "One Acre Fund Rwanda": {
    src: "https://recruiting.cdn.greenhouse.io/external_greenhouse_job_boards/logos/000/011/119/original/Tubura_Logo.png?1759831322",
  },
  "ALX Africa": {
    src: "https://recruiting.cdn.greenhouse.io/external_greenhouse_job_boards/logos/000/017/157/original/ALX_Blue_Logo_(1).png?1731669501",
  },
  "African Leadership University": { src: "/logos/alu.png", cover: true },
  Zipline: { src: "https://www.zipline.com/favicon.ico" },
  "World Relief": {
    src: "https://lever-client-logos.s3.us-west-2.amazonaws.com/5f145d46-8222-4017-a459-0adfc9aac922-1676995379074.png",
  },
  Zenysis: { src: "https://cdn.join.com/69ea6b90e665f00008c43a54/zenysis-technologies-logo-m.png" },
  "Directorate General of Immigration and Emigration": { src: "/logos/dgie.jpg", cover: true },
  RwandAir: { src: "/logos/Rwandairlogo.jpg" },
  "MTN Rwanda": { src: "https://careers.mtn.co.rw/mtn-favicon.png" },
  "Airtel Rwanda": { src: "https://www.airtel.co.rw/favicon.png" },
  Irembo: {
    src: "https://s101-recruiting.cdn.greenhouse.io/external_greenhouse_job_boards/logos/400/168/610/original/blue_icon.png?1680083936",
  },
  "Rising Academies": { src: "https://www.risingacademies.com/favicon.ico", cover: true },
  "Access Bank": { src: "https://www.accessbankplc.com/favicon.ico", cover: true },
  Ampersand: { src: "https://ampersand.energy/favicon.ico", cover: true },
  "Ampersand Rwanda Ltd": { src: "https://ampersand.energy/favicon.ico", cover: true },
  Bralirwa: { src: "/logos/bralirwa.png", bg: "#000000" },
  "UR - HG Ltd": { src: "/logos/ur.png", cover: true },
  M365Consult: { src: "/logos/m365.png" },
  "Prime Insurance Ltd": { src: "/logos/prime.svg" },
  "Sabena Engineering": { src: "/logos/sabena.svg" },
  "Wildlife Conservation Society": { src: "/logos/wcs.svg", cover: true },
  Canonical: { src: "/logos/canonical.png" },
  GitLab: { src: "https://about.gitlab.com/favicon.ico", cover: true },
  PostHog: { src: "/logos/Posthog.png" },
  Supabase: { src: "/logos/supabase.png", cover: true },
  "M-KOPA": { src: "/logos/m-kopa.svg" },
  IDinsight: { src: "https://www.idinsight.org/favicon.ico", cover: true },
  LemFi: { src: "https://www.lemfi.com/favicon.ico", cover: true },
  Zapier: { src: "https://zapier.com/favicon.ico", cover: true },
  micro1: { src: "/logos/micro1logo.png", bg: "#000000" },
  "BPR Bank Rwanda PLC": { src: "/logos/bpr.jpg" },
  "Rwanda Airports Company (RAC)": { src: "/logos/rac.webp" },
  "ISHEMA HUB Limited": { src: "/logos/ishema.png", cover: true },
  "Africa Improved Foods Rwanda": { src: "/logos/africa-improved-foods.png" },
  "Trinity Musha Mines Ltd": { src: "/logos/trinity-metals.png" },
  "BRAC Rwanda": { src: "/logos/brac-rwanda.png", cover: true },
  "SOS Children's Villages Rwanda": { src: "/logos/sos.png" },
  "International Organization for Migration (IOM)": { src: "/logos/iom.png" },
  "GIZ Rwanda": { src: "/logos/giz-rwanda.png" },
  "University of Global Health Equity": { src: "/logos/ughe.png" },
  "SAFINTRA Rwanda Ltd - Member of The Safal Group": { src: "/logos/safintra-rwanda-ltd-member-of-the-safal-group.png" },
  "African Export-Import Bank (Afreximbank)": { src: "/logos/african-export-import-bank-afreximbank.png", cover: true },
  ContourGlobal: { src: "/logos/contourglobal.png" },
  "Mota-Engil": { src: "/logos/mota-engil.svg", cover: true },
  "The HEINEKEN Company": { src: "/logos/heineken.png" },
  TechnoServe: { src: "/logos/technoserve.png", cover: true },
  "Rogers Corporation": { src: "/logos/rogers-corporation.png" },
  "Marriott International": { src: "/logos/marriott.png" },
  "Kigali Marriott Hotel": { src: "/logos/marriott.png" },
  "Four Points by Sheraton": { src: "/logos/marriott.png" },
  "Radisson Hotel Group": { src: "/logos/radisson.png" },
  "Right Seat": { src: "/logos/right-seat.png" },
  "Vital Strategies": { src: "/logos/vital-strategies.png" },
  TeKnowledge: { src: "/logos/teknowledge.svg" },
  Finch: { src: "/logos/finch.png", cover: true },
  "Africa Global Logistics": { src: "/logos/africa-global-logistics.png" },
  "Ecobank Transnational Incorporated": { src: "/logos/ecobank-transnational-incorporated.png" },
  GiveDirectly: { src: "/logos/givedirectly.png", bg: "#000000" },
  "rare finds": { src: "/logos/rare-finds.jpg" },
  "Clinton Health Access Initiative, Inc.": { src: "/logos/clinton-health-access-initiative-inc.webp" },
  "Innovations for Poverty Action": { src: "/logos/ipa.png", cover: true },
  "SLR Consulting": { src: "/logos/slr-consulting.png", cover: true },
  "World Vision International Rwanda": { src: "/logos/worldvision.png" },
  "Save the Children": { src: "/logos/save-the-children.png" },
  Viamo: { src: "/logos/viamo.png" },
  "National Institute of Statistics of Rwanda": { src: "/logo-rwanda-nisr-transparent_0.png" },
  "NATIONAL INSTITUTE OF STATISTICS OF RWANDA": { src: "/logo-rwanda-nisr-transparent_0.png" },
  NISR: { src: "/logo-rwanda-nisr-transparent_0.png" },
  RSSB: { src: "/logos/rssb.png", cover: true },
  "Inzira Creative Partners": { src: "/logos/inzira-creative.png", bg: "#000000" },
  "Urunana Development Communication": { src: "/logos/urunana.jpg" },
  "Community Based Health Promoters Rwanda": { src: "/logos/cbhp.webp" },
};

const GOVERNMENT_LOGO = { src: "/logos/rwanda-coat.png" };

/** Job boards and form hosts. Their icon is not the employer's mark. */
const BOARD_HOSTS = [
  "jobinrwanda.com",
  "kigalistore.com",
  "linkedin.com",
  "ashbyhq.com",
  "greenhouse.io",
  "lever.co",
  "workable.com",
  "breezy.hr",
  "myworkdayjobs.com",
  "workday.com",
  "oraclecloud.com",
  "mifotra.gov.rw",
  "office.com",
  "office365.com",
  "microsoft.com",
  "live.com",
  "docs.google.com",
  "forms.gle",
  "google.com",
  "facebook.com",
  "whatsapp.com",
  "wa.me",
  "instagram.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "t.me",
  "smartrecruiters.com",
  "successfactors.com",
  "taleo.net",
  "icims.com",
  "recruitee.com",
  "bamboohr.com",
  "personio.com",
  "teamtailor.com",
  "qtsoftwareltd.com",
];

export function companyLogo(name: string): CompanyLogo | null {
  return (
    LOGOS[name] ??
    (/\brwandair\b/i.test(name)
      ? LOGOS.RwandAir
      : /\bimmigration and emigration\b/i.test(name)
        ? LOGOS["Directorate General of Immigration and Emigration"]
        : /\bnational institute of statistics\b|\bnisr\b/i.test(name)
          ? LOGOS.NISR
          : /\b(district|ministry|board|commission|agency|city of|teaching hospital)\b/i.test(name)
            ? GOVERNMENT_LOGO
            : null)
  );
}

/** Icon from the employer's own site, for a company that has no saved mark yet. */
export function employerIcon(applyUrl: string | null | undefined): CompanyLogo | null {
  if (!applyUrl) return null;
  let host = "";
  try {
    host = new URL(applyUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  if (!host || BOARD_HOSTS.some((name) => host === name || host.endsWith(`.${name}`))) return null;
  return { src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128` };
}
