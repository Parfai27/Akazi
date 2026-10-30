export type Guide = {
  slug: string;
  title: string;
  description: string;
  lede: string;
};

export const guides: Guide[] = [
  {
    slug: "writing-a-cv-for-rwanda",
    title: "Writing a CV for the Rwanda job market",
    description: "A practical CV layout for jobs in Kigali, the public service, NGOs, and remote roles you can do from Rwanda.",
    lede: "Most adverts in Rwanda are read quickly. A two-page CV that leads with the work they asked for will do more than a long biography.",
  },
  {
    slug: "preparing-for-interviews",
    title: "Preparing for a job interview in Rwanda",
    description: "How to get to the interview on time, what to prepare, and which questions are worth asking before you accept.",
    lede: "An interview in Kigali is usually a conversation about the advert you already read. Prepare examples, leave time for traffic, and know what you want to ask.",
  },
  {
    slug: "remote-work-from-rwanda",
    title: "Finding remote work from Rwanda",
    description: "How to tell a real remote role from a country-locked one, and how to apply from Rwanda without paying a fee.",
    lede: "Remote does not always mean you can do the job from Kigali. Read the location line, then apply only where Rwanda is actually allowed.",
  },
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug) ?? null;
}
