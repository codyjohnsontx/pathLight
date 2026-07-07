import { Compass, Heart } from "lucide-react";

type ReflectionPromptProps = {
  reflectionQuestion: string;
  prayerPrompt?: string;
};

/** The reflection question (and optional prayer prompt) for a theme card. */
export function ReflectionPrompt({
  reflectionQuestion,
  prayerPrompt,
}: ReflectionPromptProps) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2.5">
        <Compass
          className="mt-0.5 size-4 shrink-0 text-primary/70"
          aria-hidden
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reflect
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">
            {reflectionQuestion}
          </p>
        </div>
      </div>

      {prayerPrompt && (
        <div className="flex gap-2.5">
          <Heart className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              A prayer to start with
            </p>
            <p className="text-sm italic leading-relaxed text-foreground/80">
              &ldquo;{prayerPrompt}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
