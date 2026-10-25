/** Public logos from each employer's own career page. `cover` fills the box when the file is already a square mark. */
const LOGOS: Record<string, { src: string; cover?: boolean; bg?: string }> = {
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
  Canonical: { src: "https://canonical.com/favicon.ico", cover: true },
  GitLab: { src: "https://about.gitlab.com/favicon.ico", cover: true },
  PostHog: { src: "https://posthog.com/favicon.ico", cover: true },
  Supabase: { src: "https://supabase.com/favicon.ico", cover: true },
  "M-KOPA": { src: "https://www.m-kopa.com/favicon.ico", cover: true },
  IDinsight: { src: "https://www.idinsight.org/favicon.ico", cover: true },
  LemFi: { src: "https://www.lemfi.com/favicon.ico", cover: true },
  Zapier: { src: "https://zapier.com/favicon.ico", cover: true },
  micro1: { src: "/logos/micro1logo.png", bg: "#000000" },
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
};

const GOVERNMENT_LOGO = { src: "/logos/rwanda-coat.png" };

export function companyLogo(name: string) {
  return (
    LOGOS[name] ??
    (/\brwandair\b/i.test(name)
      ? LOGOS.RwandAir
      : /\bimmigration and emigration\b/i.test(name)
        ? LOGOS["Directorate General of Immigration and Emigration"]
        : /\bnational institute of statistics\b|\bnisr\b/i.test(name)
          ? LOGOS.NISR
          : /\b(district|ministry|board|commission|agency)\b/i.test(name)
            ? GOVERNMENT_LOGO
            : null)
  );
}
