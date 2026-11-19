"use client";

import styles from "@/styles/shared.module.scss";
import { type TermLine, useTerminal } from "@/hooks/useTerminal";

export default function Terminal({ lines, className }: { lines: TermLine[] | null; className?: string }) {
  const { rows, done } = useTerminal(lines);
  const last = rows[rows.length - 1];
  const cursorInline = !done && last?.kind === "cmd";

  const cursor = <span className={styles.cursor} aria-hidden="true" />;

  return (
    <div className={className} aria-hidden="true">
      {rows.map((row, i) =>
        row.kind === "cmd" ? (
          <div key={i} className={styles.line}>
            <span className={styles.prompt}>$</span>
            {row.text}
            {cursorInline && i === rows.length - 1 && cursor}
          </div>
        ) : (
          <div key={i} className={`${styles.line} ${styles.out} ${row.tone ? styles[row.tone] : ""}`}>
            {row.text}
          </div>
        ),
      )}
      {!cursorInline && (
        <div className={styles.line}>
          <span className={styles.prompt}>$</span>
          {cursor}
        </div>
      )}
    </div>
  );
}
