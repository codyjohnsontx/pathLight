import { LifeBuoy, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CrisisResponse } from "@/types/guidance";

/**
 * Shown instead of passages when a crisis is detected. Warm, non-clinical, and
 * pointed toward reaching a real person right now.
 */
export function CrisisNotice({ data }: { data: CrisisResponse }) {
  return (
    <Card className="border-primary/30 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-xl">
          <LifeBuoy className="size-5 text-primary" aria-hidden />
          You don&rsquo;t have to carry this alone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[0.95rem] leading-relaxed text-foreground/85">
          {data.message}
        </p>

        <ul className="space-y-3">
          {data.resources.map((r) => (
            <li
              key={r.name}
              className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3"
            >
              <p className="text-sm font-semibold text-foreground">{r.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{r.detail}</p>
              {r.contact && (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Phone className="size-3.5" aria-hidden />
                  {r.contact}
                </p>
              )}
            </li>
          ))}
        </ul>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {data.disclaimer}
        </p>
      </CardContent>
    </Card>
  );
}
