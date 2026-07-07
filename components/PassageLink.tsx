"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { PassageModal } from "@/components/PassageModal";

/**
 * A clickable passage reference that opens the passage in a modal. State is
 * controlled here so the modal only fetches when actually opened.
 */
export function PassageLink({ reference }: { reference: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        {reference}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <PassageModal reference={reference} open={open} />
      </Dialog>
    </>
  );
}
