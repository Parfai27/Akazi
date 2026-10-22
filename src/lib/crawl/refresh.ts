let started = false;
let running = false;

const SIX_HOURS = 6 * 60 * 60 * 1000;

/** Read career pages again after the server is up, without sending the same alert twice. */
export function startJobRefresh() {
  if (started) return;
  started = true;

  const run = () => {
    if (running) return;
    running = true;
    void import("./run")
      .then(({ crawlAll }) => crawlAll({ notify: false }))
      .catch(() => undefined)
      .finally(() => {
        running = false;
      });
  };

  setTimeout(run, 15_000);
  setInterval(run, SIX_HOURS);
}
