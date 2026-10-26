type ViewerDetail = { path: string; viewers: number };

const latest = new Map<string, number>();

export function publishViewers(path: string, viewers: number) {
  latest.set(path, viewers);
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ViewerDetail>("akazi-viewers", { detail: { path, viewers } }));
}

export function latestViewers(path: string) {
  return latest.get(path);
}
