const PUBLISHER = "ca-pub-5649671721567993";

export function adConfig() {
  const fromEnv = process.env.ADSENSE_CLIENT?.trim() ?? "";
  const client = /^ca-pub-\d{10,}$/.test(fromEnv) ? fromEnv : PUBLISHER;
  const slot = process.env.ADSENSE_SLOT?.trim() ?? "";
  return { client, slot: /^\d{6,}$/.test(slot) ? slot : "" };
}
