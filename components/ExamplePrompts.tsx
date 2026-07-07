"use client";

const EXAMPLES = [
  "I feel anxious about the future.",
  "I'm discouraged in my job search.",
  "I'm struggling to forgive someone.",
  "I feel burned out.",
  "I need wisdom for a decision.",
  "I feel lonely.",
];

type ExamplePromptsProps = {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

/** Tappable starter prompts to lower the blank-page barrier. */
export function ExamplePrompts({ onSelect, disabled }: ExamplePromptsProps) {
  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Or start with an example
      </p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt)}
            className="rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-sm text-foreground/80 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
