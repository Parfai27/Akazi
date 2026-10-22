type Pair = { label: string; people: number; visits: number };

function ColumnChart({
  title,
  caption,
  points,
  series,
}: {
  title: string;
  caption: string;
  points: { label: string; primary: number; secondary?: number }[];
  series: { primary: string; secondary?: string };
}) {
  const max = Math.max(1, ...points.map((point) => Math.max(point.primary, point.secondary ?? 0)));
  const width = 640;
  const height = 248;
  const left = 36;
  const right = 8;
  const top = 16;
  const bottom = 44;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const slot = plotWidth / Math.max(points.length, 1);
  const bar = Math.min(16, slot * (series.secondary ? 0.28 : 0.46));

  function y(value: number) {
    return top + plotHeight - (value / max) * plotHeight;
  }

  const ticks = [...new Set([0, Math.round(max / 2), max])];

  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{caption}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-auto w-full" role="img" aria-label={title}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="#e3ebe7" strokeWidth="1" />
            <text x={left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="#6b7280">
              {tick}
            </text>
          </g>
        ))}
        {points.map((point, index) => {
          const center = left + slot * index + slot / 2;
          const primaryHeight = (point.primary / max) * plotHeight;
          const secondaryHeight = ((point.secondary ?? 0) / max) * plotHeight;
          return (
            <g key={`${point.label}-${index}`}>
              {series.secondary ? (
                <rect
                  x={center - bar - 2}
                  y={y(point.secondary ?? 0)}
                  width={bar}
                  height={Math.max(secondaryHeight, point.secondary ? 2 : 0)}
                  rx="4"
                  fill="#8ec9b8"
                />
              ) : null}
              <rect
                x={series.secondary ? center + 2 : center - bar / 2}
                y={y(point.primary)}
                width={bar}
                height={Math.max(primaryHeight, point.primary ? 2 : 0)}
                rx="4"
                fill="#1e6b58"
              />
              <text x={center} y={height - 16} textAnchor="middle" fontSize="11" fill="#6b7280">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs font-semibold text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-forest" />
          {series.primary}
        </span>
        {series.secondary ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-[#8ec9b8]" />
            {series.secondary}
          </span>
        ) : null}
      </div>
      <ul className="sr-only">
        {points.map((point) => (
          <li key={`${point.label}-text`}>
            {point.label}: {point.primary} {series.primary.toLowerCase()}
            {series.secondary ? `, ${point.secondary ?? 0} ${series.secondary.toLowerCase()}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VisitColumns({ title, caption, points }: { title: string; caption: string; points: Pair[] }) {
  return (
    <ColumnChart
      title={title}
      caption={caption}
      series={{ primary: "People", secondary: "Visits" }}
      points={points.map((point) => ({ label: point.label, primary: point.people, secondary: point.visits }))}
    />
  );
}

export function SignupColumns({
  title,
  caption,
  points,
}: {
  title: string;
  caption: string;
  points: { label: string; count: number }[];
}) {
  return (
    <ColumnChart
      title={title}
      caption={caption}
      series={{ primary: "Signups" }}
      points={points.map((point) => ({ label: point.label, primary: point.count }))}
    />
  );
}

export function FunctionBars({
  rows,
}: {
  rows: { id: string; label: string; visits: number; share: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.visits));
  const total = rows.reduce((sum, row) => sum + row.visits, 0);

  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
      <h2 className="text-lg font-extrabold tracking-tight">Job types this month</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Opens of a job page, counted once per person each day. The longer bar is the type people open more.
      </p>
      {total === 0 ? (
        <p className="mt-6 text-sm text-muted">No job page has been opened yet this month.</p>
      ) : (
        <ul className="mt-5 grid gap-4">
          {rows.map((row) => (
            <li key={row.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold">{row.label}</span>
                <span className="text-muted">
                  {row.visits} · {row.share}%
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-wash">
                <div
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${Math.max((row.visits / max) * 100, row.visits ? 4 : 0)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
