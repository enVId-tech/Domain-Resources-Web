"use client";

import { useEffect, useRef } from "react";
import styles from "@/styles/shared.module.scss";

const SIZE = 14;

/** Calm, top-down binary rain behind the page. Skipped for reduced-motion users. */
export default function Rain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let drops: { y: number; v: number }[] = [];
    let last = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#070908";
      ctx.fillRect(0, 0, w, h);
      drops = Array.from({ length: Math.ceil(w / SIZE) }, () => ({
        y: Math.random() * -60,
        v: 0.25 + Math.random() * 0.5,
      }));
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || t - last < 45) return; // ~22 fps
      last = t;
      ctx.fillStyle = "rgba(7, 9, 8, 0.14)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#62e394";
      ctx.font = `${SIZE}px monospace`;
      drops.forEach((d, i) => {
        d.y += d.v;
        ctx.fillText(Math.random() < 0.5 ? "0" : "1", i * SIZE, d.y * SIZE);
        if (d.y * SIZE > h && Math.random() > 0.975) {
          d.y = 0;
          d.v = 0.25 + Math.random() * 0.5;
        }
      });
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className={styles.rain} aria-hidden="true" />;
}
