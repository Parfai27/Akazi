import { descriptionBlocks } from "@/lib/description";

export function JobDescription({ text }: { text: string }) {
  const blocks = descriptionBlocks(text);
  return (
    <div className="max-w-2xl">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <h2 key={index} className="mt-10 mb-3 text-2xl font-extrabold tracking-tight text-ink first:mt-2">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "field") {
          const grouped = index > 0 && blocks[index - 1]?.kind === "field";
          return (
            <p key={index} className={`text-base leading-8 ${grouped ? "mb-1" : "mt-4 mb-1"}`}>
              <span className="font-extrabold text-forest">{block.label} :</span>
              {block.value ? <span className="text-muted"> {block.value}</span> : null}
            </p>
          );
        }
        return (
          <p key={index} className="mb-4 text-base leading-8 whitespace-pre-line text-muted">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
