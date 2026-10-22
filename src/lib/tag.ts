export type WorkMode = "remote" | "hybrid" | "onsite";
export type Place = "kigali" | "rwanda" | "remote";

const RWANDA_PLACES = [
  "rwanda",
  "rwandan",
  "kigali",
  "nyarugenge",
  "gasabo",
  "kicukiro",
  "musanze",
  "ruhengeri",
  "rubavu",
  "gisenyi",
  "huye",
  "butare",
  "muhanga",
  "rusizi",
  "nyagatare",
  "rwamagana",
  "bugesera",
  "kamonyi",
  "ngoma",
  "kayonza",
  "nyamasheke",
  "karongi",
  "rutsiro",
  "nyabihu",
  "gicumbi",
  "burera",
  "gakenke",
  "rulindo",
  "nyanza",
  "gisagara",
  "nyamagabe",
  "nyaruguru",
  "ruhango",
  "kirehe",
  "gatsibo",
];

export function mentionsRwanda(text: string): boolean {
  const lower = text.toLowerCase();
  return RWANDA_PLACES.some((place) => new RegExp(`\\b${place}\\b`, "i").test(lower));
}

const HYBRID_PHRASE =
  /\b(hybrid role|hybrid position|hybrid work|work hybrid|hybrid schedule|hybrid arrangement|\(hybrid\))\b/i;
const REMOTE_PHRASE =
  /\b(fully remote|100% remote|work remotely|working remotely|remote role|remote position|remote opportunity|this (role|position) is remote|work from home|work-from-home)\b/i;

export function detectWorkMode(title: string, location: string, description: string): WorkMode {
  if (/\bhybrid\b/i.test(location) || HYBRID_PHRASE.test(title)) return "hybrid";
  if (/\bremote\b/i.test(location)) return "remote";
  const lead = `${title}\n${description.slice(0, 800)}`;
  if (HYBRID_PHRASE.test(lead)) return "hybrid";
  if (REMOTE_PHRASE.test(lead)) return "remote";
  if (/^\s*remote\b/i.test(title) && !/remote pilot/i.test(title)) return "remote";
  return "onsite";
}

export function classifyPosting(input: {
  title: string;
  location: string;
  description: string;
  hint?: WorkMode;
}): { workMode: WorkMode; place: Place; relevant: boolean } {
  const workMode = input.hint ?? detectWorkMode(input.title, input.location, input.description);
  const locationAndTitle = `${input.location}\n${input.title}`;
  const descriptionLead = input.description.slice(0, 800);
  let place: Place = "remote";
  if (/\bkigali\b|\bnyarugenge\b|\bgasabo\b|\bkicukiro\b/i.test(locationAndTitle)) {
    place = "kigali";
  } else if (mentionsRwanda(locationAndTitle)) {
    place = "rwanda";
  } else if (workMode === "remote" && /\bkigali\b/i.test(descriptionLead)) {
    place = "kigali";
  } else if (workMode === "remote" && mentionsRwanda(descriptionLead)) {
    place = "rwanda";
  }

  const relevant = mentionsRwanda(locationAndTitle) || workMode === "remote";
  return { workMode, place, relevant };
}

const AFRICA_PLACES =
  /\b(africa|kenya|nigerian?|ghana|uganda|tanzania|senegal|nairobi|lagos|accra|kampala|dakar|johannesburg|cape town|abidjan|addis|lusaka|dar es salaam|ivory coast|cote d'ivoire|côte d'ivoire|burkina|mali|cameroon|morocco|rabat|zambia|ethiopia|egypt|cairo|tunisia|benin|togo|liberia|malawi|gambia|kinshasa|ouagadougou|bamako|freetown|monrovia|abuja)\b/i;
const OPEN_REGION = /worldwide|anywhere|\bglobal\b|international|\bemea\b/i;
const CLOSED_COUNTRY =
  /\b(united states|u\.s\.a?\.?|\busa\b|us only|united kingdom|\buk\b|england|ireland|france|germany|canada|poland|india|australia|netherlands|spain|portugal|brazil|japan|mexico|singapore|israel|italy|sweden|norway|denmark|finland|belgium|switzerland|austria|korea|china|taiwan|philippines|indonesia|(?<!middle )east)\b/i;

/** A remote role a person in Rwanda can take: anywhere, EMEA, Africa, or a plain Remote with no country lock. */
export function remoteFromAnywhere(location: string, title: string): boolean {
  if (mentionsRwanda(`${location}\n${title}`)) return true;
  if (!/\bremote\b|home[ -]based|anywhere|worldwide/i.test(location)) return false;
  if (AFRICA_PLACES.test(location) || OPEN_REGION.test(location)) return true;
  const stripped = location
    .toLowerCase()
    .replace(/\bremote\b|home[ -]based|office based/g, "")
    .replace(/[^a-z]/g, "");
  if (stripped.length > 0) return false;
  return !CLOSED_COUNTRY.test(title);
}

export function workModeLabel(mode: string) {
  if (mode === "remote") return "Remote";
  if (mode === "hybrid") return "Hybrid";
  return "On-site";
}

export function placeLabel(place: string) {
  if (place === "kigali") return "Kigali";
  if (place === "rwanda") return "Rwanda";
  return "Remote";
}
