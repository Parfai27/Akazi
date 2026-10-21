import { descriptionBlocks } from "@/lib/description";

export function JobDescription({ text }: { text: string }) {
  const blocks = descriptionBlocks(text);
  return (
    <div className="max-w-2xl">
      {blocks.map((block, index) =>
        block.kind === "heading" ? (
          <h2
            key={index}
            className="mt-10 mb-3 text-2xl font-extrabold tracking-tight text-ink first:mt-2"
          >
            {block.text}
          </h2>
        ) : (
          <p key={index} className="mb-4 text-base leading-8 whitespace-pre-line text-muted">
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}
