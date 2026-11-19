"use client";

import { useEffect, useRef } from "react";
import styles from "@/styles/shared.module.scss";

const SIZE = 14;

/** Binary rain falling from both edges behind the page. Skipped for reduced-motion users. */
export default function Rain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let top: { y: number; v: number }[] = [];
    let bottom: { y: number; v: number }[] = [];
    let last = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      const make = () =>
        Array.from({ length: Math.ceil(w / SIZE) }, () => ({ y: Math.random() * -60, v: 0.3 + Math.random() * 0.6 }));
      top = make();
      bottom = make();
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || t - last < 33) return; // ~30 fps
      last = t;
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#00ff41";
      ctx.font = `${SIZE}px monospace`;
      const step = (drops: typeof top, fromBottom: boolean) =>
        drops.forEach((d, i) => {
          d.y += d.v;
          const y = fromBottom ? h - d.y * SIZE : d.y * SIZE;
          ctx.fillText(Math.random() < 0.5 ? "0" : "1", i * SIZE, y);
          if (d.y * SIZE > h && Math.random() > 0.975) {
            d.y = 0;
            d.v = 0.3 + Math.random() * 0.6;
          }
        });
      step(top, false);
      step(bottom, true);
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
