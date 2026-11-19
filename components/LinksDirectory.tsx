"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Window from "@/components/Window";
import { useLocation } from "@/hooks/useLocation";
import shared from "@/styles/shared.module.scss";
import styles from "@/styles/links.module.scss";

interface LinkItem {
  title: string;
  url: string;
  description?: string;
  icon?: string;
  /** Set to false to skip the online/offline check for this link. */
  check?: boolean;
}

type State = "checking" | "online" | "offline" | "none";

const isImage = (s?: string) => !!s && /^(\/|https?:\/\/)/.test(s);

export default function LinksDirectory() {
  const { host } = useLocation();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, State>>({});
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // links.json is fetched at runtime, so it can be edited without rebuilding (e.g. a Docker volume).
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/data/links.json", { cache: "no-cache", signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) throw new Error("links.json must be an array");
        const valid = (data as LinkItem[]).filter((l) => l && l.title && l.url);
        setLinks(valid);
        setStatus(Object.fromEntries(valid.map((l) => [l.url, l.check === false ? "none" : "checking"])));
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setLoadError(err.message);
      });
    return () => ctrl.abort();
  }, []);

  /*
   * A static page can't read another site's HTTP status, so this only detects "unreachable"
   * (DNS, refused connection, TLS error, timeout). Any response at all counts as online.
   */
  useEffect(() => {
    const ctrls: AbortController[] = [];
    links
      .filter((l) => l.check !== false)
      .forEach((l) => {
        const ctrl = new AbortController();
        ctrls.push(ctrl);
        const timer = setTimeout(() => ctrl.abort(), 7000);
        fetch(l.url, { mode: "no-cors", cache: "no-store", signal: ctrl.signal })
          .then(() => "online" as State, () => "offline" as State)
          .then((state) => {
            clearTimeout(timer);
            if (!ctrl.signal.aborted || state === "offline") setStatus((s) => ({ ...s, [l.url]: state }));
          });
      });
    return () => ctrls.forEach((c) => c.abort());
  }, [links]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName ?? "");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter((l) => `${l.title} ${l.description ?? ""} ${l.url}`.toLowerCase().includes(q));
  }, [links, query]);

  const counts = useMemo(() => {
    const values = Object.values(status);
    return { on: values.filter((s) => s === "online").length, off: values.filter((s) => s === "offline").length };
  }, [status]);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard unavailable (e.g. insecure context): nothing to do */
    }
  };

  return (
    <Window title={`${host || "localhost"}:~/links`} tag="online">
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Access Directory</h1>
          <p className={styles.sub}>
            <span className={shared.prompt}>$</span>cat links.json
          </p>
        </div>
        <div className={styles.stats} aria-live="polite">
          <span>
            entries <b>{links.length}</b>
          </span>
          <span className={styles.statOn}>
            online <b>{counts.on}</b>
          </span>
          <span className={styles.statOff}>
            offline <b>{counts.off}</b>
          </span>
        </div>
      </header>

      <label className={styles.filter}>
        <span className={shared.prompt} aria-hidden="true">
          grep
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter links…"
          autoComplete="off"
          spellCheck={false}
          aria-label="Filter links"
        />
        <kbd aria-hidden="true">/</kbd>
      </label>

      <section className={styles.grid} aria-label="Links">
        {visible.map((link, i) => {
          const state = status[link.url] ?? "checking";
          return (
            <article
              key={link.url}
              className={`${styles.card} ${state === "offline" ? styles.offline : ""}`}
              style={{ "--i": i } as CSSProperties}
            >
              <div className={styles.cardTop}>
                <div className={styles.icon}>
                  {isImage(link.icon) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={link.icon} alt="" loading="lazy" />
                  ) : (
                    (link.icon ?? link.title.charAt(0).toUpperCase())
                  )}
                </div>
                <span className={styles.status} data-state={state}>
                  <i />
                  {state !== "none" && state}
                </span>
              </div>

              <h2>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title}
                </a>
              </h2>
              <p>{link.description}</p>

              <div className={styles.foot}>
                <code title={link.url}>{link.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</code>
                <button
                  type="button"
                  className={`${styles.copy} ${copied === link.url ? styles.copied : ""}`}
                  onClick={() => copy(link.url)}
                >
                  {copied === link.url ? "copied" : "copy"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {loadError && <p className={styles.empty}>failed to load links: {loadError}</p>}
      {!loadError && links.length > 0 && visible.length === 0 && <p className={styles.empty}>no matches.</p>}
    </Window>
  );
}
