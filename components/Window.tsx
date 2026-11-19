import type { ReactNode } from "react";
import Rain from "@/components/Rain";
import styles from "@/styles/shared.module.scss";

interface WindowProps {
  title: ReactNode;
  tag: string;
  tone?: "ok" | "err";
  center?: boolean;
  children: ReactNode;
}

/** Page frame: background rain + a terminal-style window with a title bar. */
export default function Window({ title, tag, tone = "ok", center = false, children }: WindowProps) {
  return (
    <div className={`${styles.page} ${center ? styles.pageCenter : ""}`}>
      <Rain />
      <div className={styles.fx} aria-hidden="true" />
      <main className={`${styles.shell} ${center ? styles.shellNarrow : ""}`}>
        <div className={styles.window}>
          <div className={styles.titlebar}>
            <div className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className={styles.path}>{title}</div>
            <div className={tone === "err" ? styles.tagErr : styles.tag}>● {tag}</div>
          </div>
          <div className={styles.body}>{children}</div>
        </div>
      </main>
    </div>
  );
}
