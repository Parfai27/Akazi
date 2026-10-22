/** Public logos from each employer's own career page. `cover` fills the box when the file is already a square mark. */
const LOGOS: Record<string, { src: string; cover?: boolean }> = {
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
  "National Institute of Statistics of Rwanda": { src: "/logo-rwanda-nisr-transparent_0.png" },
  "NATIONAL INSTITUTE OF STATISTICS OF RWANDA": { src: "/logo-rwanda-nisr-transparent_0.png" },
  NISR: { src: "/logo-rwanda-nisr-transparent_0.png" },
};

const GOVERNMENT_LOGO = { src: "/logos/rwanda-coat.png" };

export function companyLogo(name: string) {
  return (
    LOGOS[name] ??
    (/\bnational institute of statistics\b|\bnisr\b/i.test(name)
      ? LOGOS.NISR
      : /\b(district|ministry|board|commission|agency)\b/i.test(name)
        ? GOVERNMENT_LOGO
        : null)
  );
}
