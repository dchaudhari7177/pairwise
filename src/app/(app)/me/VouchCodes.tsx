"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-quiet btn-sm"
      aria-label={`Copy ${code}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked: the code is on screen anyway */
        }
      }}
    >
      {copied ? <Check className="h-4 w-4 text-sage" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
