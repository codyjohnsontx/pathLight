import { PassageLink } from "@/components/PassageLink";
import { ReflectionPrompt } from "@/components/ReflectionPrompt";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GuidanceTheme } from "@/types/guidance";

/** One themed suggestion card: title, explanation, passages, reflection. */
export function ThemeCard({ theme }: { theme: GuidanceTheme }) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-xl leading-snug text-foreground">
          {theme.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[0.95rem] leading-relaxed text-foreground/80">
          {theme.explanation}
        </p>

        <ul className="mt-4 space-y-2.5">
          {theme.passages.map((p) => (
            <li key={p.reference} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <PassageLink reference={p.reference} />
              <span className="text-sm text-muted-foreground">{p.reason}</span>
            </li>
          ))}
        </ul>

        <ReflectionPrompt
          reflectionQuestion={theme.reflectionQuestion}
          prayerPrompt={theme.prayerPrompt}
        />
      </CardContent>
    </Card>
  );
}
