import { ApiBibleProvider } from "@/lib/bible/ApiBibleProvider";
import type { BibleProvider } from "@/lib/bible/BibleProvider";
import { MockBibleProvider } from "@/lib/bible/MockBibleProvider";

export type { BibleProvider, PassageQuery } from "@/lib/bible/BibleProvider";

/**
 * Select the Bible text provider by env. Defaults to the mock provider so the
 * app runs with zero external configuration. Set BIBLE_PROVIDER=apibible (plus
 * BIBLE_API_KEY) to use API.Bible.
 */
export function getBibleProvider(): BibleProvider {
  const provider = (process.env.BIBLE_PROVIDER ?? "mock").toLowerCase();
  switch (provider) {
    case "apibible":
    case "api.bible":
      return new ApiBibleProvider();
    case "mock":
    default:
      return new MockBibleProvider();
  }
}
