"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StageTrace from "@/components/StageTrace";
import Terminal from "@/components/Terminal";
import Window from "@/components/Window";
import { useLocation } from "@/hooks/useLocation";
import type { TermLine } from "@/hooks/useTerminal";
import { DEFAULT_CODE, describe } from "@/lib/status";
import shared from "@/styles/shared.module.scss";
import styles from "@/styles/error.module.scss";

/**
 * Shared error screen, shown at /, /error and for every missing path (404.html).
 * Prerendered once, then personalised in the browser: ?code=502 switches the status (400-599),
 * and the host comes from the current URL.
 */
export default function ErrorScreen() {
  const { host, search } = useLocation();
  const [ref, setRef] = useState("00000");

  const requested = parseInt(new URLSearchParams(search).get("code") ?? "", 10);
  const code = requested >= 400 && requested <= 599 ? requested : DEFAULT_CODE;
  const [title, detail] = describe(code);

  useEffect(() => {
    let stale = false;
    Promise.resolve().then(() => {
      if (!stale) setRef(Math.floor(Math.random() * 0xfffff).toString(16).toUpperCase().padStart(5, "0"));
    });
    return () => {
      stale = true;
    };
  }, []);

  // Next re-applies its metadata title right after hydration, so set ours a tick later.
  useEffect(() => {
    if (!host) return;
    const t = setTimeout(() => {
      document.title = `${code} ${title} · ${host}`;
    }, 50);
    return () => clearTimeout(t);
  }, [code, title, host]);

  const lines = useMemo<TermLine[] | null>(
    () =>
      host
        ? [
            { cmd: "Analyzing error..." },
            { cmd: "Checking system logs..." },
            { cmd: `Host '${host}' status: unreachable` },
            { cmd: "Please try again later." },
          ]
        : null,
    [host],
  );

  return (
    <Window title={`error @ ${host || "localhost"}`} tag="offline" tone="err" center>
      <div className={styles.hero}>
        <div className={styles.icon} aria-hidden="true">
          !
        </div>
        <h1 className={styles.title}>SYSTEM ERROR</h1>
        <div className={styles.code}>ERROR_CODE: 0x{ref}</div>
      </div>

      <StageTrace host={host} />

      <div className={styles.message}>
        <strong>
          Error {code}: {title}
        </strong>
        <p>{detail}</p>
      </div>

      <div className={styles.actions}>
        <button className={`${shared.btn} ${shared.btnWide}`} type="button" onClick={() => window.location.reload()}>
          <span aria-hidden="true">&gt;</span> Retry
        </button>
        <Link className={`${shared.btn} ${shared.btnWide}`} href="/links">
          <span aria-hidden="true">&gt;</span> Links
        </Link>
      </div>

      <Terminal lines={lines} className={styles.log} />
    </Window>
  );
}
