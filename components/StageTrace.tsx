"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/trace.module.scss";

type Status = "idle" | "checking" | "ok" | "error";

const GLYPH: Record<Status, string> = { idle: "·", checking: "…", ok: "✓", error: "✕" };
const LABEL: Record<Status, string> = { idle: "Waiting", checking: "Checking", ok: "Working", error: "Error" };

// Delay before each of the six steps: browser checks/passes, Cloudflare checks/passes, host checks/fails.
const DELAYS = [300, 700, 400, 700, 400, 800];

function useStep(): number {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const fast = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      timer = setTimeout(() => {
        i += 1;
        setStep(i);
        if (i < DELAYS.length) tick();
      }, fast ? 0 : DELAYS[i]);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return step;
}

/** Cloudflare's CDN location (e.g. "SJC"), when this page is actually served through Cloudflare. */
function useColo(): string {
  const [colo, setColo] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    fetch("/cdn-cgi/trace", { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.text() : ""))
      .then((text) => {
        const match = /^colo=(\w+)$/m.exec(text);
        if (match) setColo(match[1]);
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, []);

  return colo;
}

/**
 * Browser -> Cloudflare -> Host. The first two stages pass and the host always fails, because this page
 * only exists to be shown when the origin server is down.
 */
export default function StageTrace({ host }: { host: string }) {
  const step = useStep();
  const colo = useColo();

  const browser: Status = step >= 2 ? "ok" : step >= 1 ? "checking" : "idle";
  const edge: Status = step >= 4 ? "ok" : step >= 3 ? "checking" : "idle";
  const origin: Status = step >= 6 ? "error" : step >= 5 ? "checking" : "idle";

  const stage = (name: string, status: Status, meta?: string) => (
    <li className={`${styles.stage} ${styles[status]}`}>
      <span className={styles.node} aria-hidden="true">
        {GLYPH[status]}
      </span>
      <span className={styles.name} title={name}>
        {name}
      </span>
      <span className={styles.state}>{LABEL[status]}</span>
      <span className={styles.meta}>{meta}</span>
    </li>
  );

  const link = (filled: boolean) => (
    <li className={`${styles.link} ${filled ? styles.filled : ""}`} aria-hidden="true">
      <i />
    </li>
  );

  return (
    <>
      <ol className={styles.trace} data-trace aria-label="Connection status">
        {stage("Browser", browser, "You")}
        {link(step >= 2)}
        {stage("Cloudflare", edge, colo)}
        {link(step >= 4)}
        {stage(host || "Host", origin, "Host")}
      </ol>
      {/* Without JavaScript the animated trace can't run, so show the end result instead. */}
      <noscript>
        <style>{"[data-trace]{display:none}"}</style>
        <p style={{ textAlign: "center" }}>Browser: working · Cloudflare: working · Host: error</p>
      </noscript>
    </>
  );
}
