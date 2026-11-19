"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Window from "@/components/Window";
import Terminal from "@/components/Terminal";
import { useLocation } from "@/hooks/useLocation";
import type { TermLine } from "@/hooks/useTerminal";
import shared from "@/styles/shared.module.scss";
import styles from "@/styles/error.module.scss";

const STATUS: Record<number, [string, string]> = {
  400: ["Bad Request", "The server could not understand the request."],
  401: ["Unauthorized", "Authentication is required to view this resource."],
  403: ["Forbidden", "You don't have permission to access this resource."],
  404: ["Not Found", "The requested resource does not exist on this server."],
  408: ["Request Timeout", "The server timed out waiting for the request."],
  429: ["Too Many Requests", "Slow down and try again in a moment."],
  500: ["Internal Server Error", "Something went wrong on the server."],
  502: ["Bad Gateway", "The upstream server returned an invalid response."],
  503: ["Service Unavailable", "This service is temporarily offline."],
  504: ["Gateway Timeout", "The upstream server took too long to respond."],
};

function describe(code: number): [string, string] {
  return (
    STATUS[code] ??
    (code >= 500
      ? ["Server Error", "The server failed to complete the request."]
      : ["Client Error", "The request could not be completed."])
  );
}

/**
 * Shared error screen. Prerendered as a plain 404, then personalised in the browser:
 * ?code=502 switches the status (400-599), and the host/path come from the current URL.
 */
export default function ErrorScreen() {
  const { host, path, search } = useLocation();
  const [ref, setRef] = useState("");

  const requested = parseInt(new URLSearchParams(search).get("code") ?? "", 10);
  const code = requested >= 400 && requested <= 599 ? requested : 404;
  const [title, detail] = describe(code);
  const shownPath = path === "/404.html" || path === "" ? "/" : path;

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
            { cmd: `resolve ${host}` },
            { out: "host resolved", tone: "ok" },
            { cmd: `GET ${shownPath}` },
            { out: `${code} ${title}`, tone: "err" },
            {
              out:
                code >= 500
                  ? "upstream is not responding. try again shortly."
                  : "check the address, or browse the directory.",
            },
          ]
        : null,
    [host, shownPath, code, title],
  );

  return (
    <Window title={`error @ ${host || "localhost"}`} tag="offline" tone="err" center>
      <div className={styles.head}>
        <div className={styles.code}>{code}</div>
        <h1 className={styles.headline}>{title}</h1>
        <p className={styles.detail}>{detail}</p>
        <div className={styles.ref}>{ref && `ref 0x${ref}`}</div>
      </div>

      <div className={styles.actions}>
        <button className={shared.btn} type="button" onClick={() => window.location.reload()}>
          <span aria-hidden="true">&gt;</span> Retry
        </button>
        <Link className={`${shared.btn} ${shared.ghost}`} href="/">
          <span aria-hidden="true">&gt;</span> Links
        </Link>
      </div>

      <Terminal lines={lines} className={styles.log} />
    </Window>
  );
}
