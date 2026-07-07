import { Info } from "lucide-react";

/** Small, always-present reminder about what Pathlight is and isn't. */
export function DisclaimerNote({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
