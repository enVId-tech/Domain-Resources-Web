"use client";

import { useEffect, useState } from "react";

export type TermLine = { cmd: string } | { out: string; tone?: "ok" | "err" };
export type TermRow = { kind: "cmd" | "out"; text: string; tone?: "ok" | "err" };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Plays a list of lines like a terminal: `cmd` lines are typed out, `out` lines appear at once.
 * Pass a memoized array (or null to wait). Users with reduced-motion get the finished text immediately.
 */
export function useTerminal(lines: TermLine[] | null, speed = 16, gap = 360) {
  const [rows, setRows] = useState<TermRow[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!lines) return;
    let cancelled = false;

    (async () => {
      await sleep(0);
      if (cancelled) return;
      const fast = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const acc: TermRow[] = [];
      setRows([]);
      setDone(false);

      for (const line of lines) {
        if ("cmd" in line) {
          acc.push({ kind: "cmd", text: fast ? line.cmd : "" });
          if (!fast) {
            for (let c = 1; c <= line.cmd.length; c++) {
              if (cancelled) return;
              acc[acc.length - 1] = { kind: "cmd", text: line.cmd.slice(0, c) };
              setRows([...acc]);
              await sleep(speed);
            }
          }
        } else {
          acc.push({ kind: "out", text: line.out, tone: line.tone });
        }
        setRows([...acc]);
        if (!fast) await sleep(gap);
        if (cancelled) return;
      }
      setDone(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [lines, speed, gap]);

  return { rows, done };
}
