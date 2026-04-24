'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/links.module.scss';
import { DASHBOARD_LINKS, type LinkDocument } from '../config/links';
import { getLinksStatus } from '../utils/status';
export default function Links() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLSpanElement>(null);
    
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [linksActive, setLinksActive] = useState<{link: string, active: boolean}[]>([]);
    const [currentLine, setCurrentLine] = useState<number>(0);
    const [loadingCompleted, setLoadingCompleted] = useState<boolean>(false);
    
    const promptLines = [
        '',
        'Connection established.',
        'Reading local configuration...', // Updated prompt
        'Directory ready.'
    ];
    const [currentPrompt, setCurrentPrompt] = useState<string>(promptLines[0]);

    // 1. Initial Status Check
    useEffect(() => {
        const checkStatus = async () => {
            const data = await getLinksStatus();
            if (data.success) {
                setLinksActive(data.linksActive || []);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 300000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const promptInterval = setInterval(() => {
            setCurrentLine((prevLine) => {
                if (prevLine >= promptLines.length - 1) return prevLine;
                
                const nextLine = prevLine + 1;
                const text = promptLines[nextLine];
                
                for (let i = 0; i < text.length; i++) {
                    setTimeout(() => {
                        setCurrentPrompt(text.substring(0, i + 1));
                        if (i === text.length - 1 && nextLine === promptLines.length - 1) {
                            setLoadingCompleted(true);
                        }
                    }, i * 15);
                }
                return nextLine;
            });
        }, 1200);

        return () => clearInterval(promptInterval);
    }, []);

    useEffect(() => {
        setMounted(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const fontSize = 12;
        const columns = Math.floor(canvas.width / fontSize);
        const dropsTop: number[] = Array(columns).fill(1);
        // const dropsBottom: number[] = Array(columns).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < dropsTop.length; i++) {
                const text = Math.random() > 0.5 ? '0' : '1';
                ctx.fillText(text, i * fontSize, dropsTop[i] * fontSize);
                if (dropsTop[i] * fontSize > canvas.height && Math.random() > 0.995) dropsTop[i] = 0;
                dropsTop[i]++;
            }
        };

        const interval = setInterval(draw, 50);
        return () => clearInterval(interval);
    }, []);

    const handleCopyLink = (link: LinkDocument) => {
        navigator.clipboard.writeText(link.url);
        setCopiedId(link.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className={styles.linksContainer}>
            <canvas ref={canvasRef} className={styles.matrixCanvas} />

            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.titleContainer}>
                        <h1 className={styles.title}>ACCESS DIRECTORY</h1>
                        <div className={styles.subtitle}>
                            <span className={styles.prompt}>$</span> cat static_links.conf
                        </div>
                    </div>

                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>ENTRIES:</span>
                            <span className={`${styles.statValue} ${loadingCompleted ? styles.online : styles.loading}`}>
                                {loadingCompleted ? DASHBOARD_LINKS.length : '???'}
                            </span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>STATUS:</span>
                            <span className={`${styles.statValue} ${loadingCompleted ? styles.online : styles.loading}`}>
                                {loadingCompleted ? 'ONLINE' : 'LOADING'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Terminal Section */}
                <div className={styles.footer}>
                    <div className={styles.terminal}>
                        <div className={styles.terminalLine}>
                            {promptLines.slice(1, currentLine).map((line, index) => (
                                <div key={index}>
                                    <span className={styles.prompt}>$</span>{line}
                                </div>
                            ))}
                            <span className={styles.prompt}>$</span>{currentPrompt}
                            <span ref={cursorRef} className={styles.cursor}>█</span>
                        </div>
                    </div>
                </div>

                {/* Grid Section */}
                <div className={styles.linksGrid}>
                    {DASHBOARD_LINKS.map((link, index) => {
                        const statusObj = linksActive.find(la => la.link === link.url);
                        const isOffline = statusObj && !statusObj.active;

                        return (
                            <div
                                key={link.id}
                                className={`${styles.linkCard} ${!loadingCompleted ? styles.hidden : ''} ${isOffline ? styles.inactive : ''}`}
                                style={mounted ? { animationDelay: `${index * 0.05}s` } : undefined}
                            >
                                <div className={styles.linkHeader}>
                                    <div className={styles.linkIcon}>{link.icon}</div>
                                    <div className={styles.linkNumber}>[{String(link.id).padStart(2, '0')}]</div>
                                </div>

                                <h3 className={styles.linkTitle}>{link.title}</h3>
                                <p className={styles.linkDescription}>{link.description}</p>

                                <div className={styles.linkUrl}>
                                    <code>{link.url}</code>
                                </div>

                                <div className={styles.linkActions}>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.visitButton}>
                                        <span className={styles.buttonPrefix}>{'>'}</span> ACCESS
                                    </a>
                                    <button onClick={() => handleCopyLink(link)} className={styles.copyButton}>
                                        <span className={styles.buttonPrefix}>{'>'}</span>
                                        {copiedId === link.id ? 'COPIED' : 'COPY'}
                                    </button>
                                </div>
                                <div className={styles.cardScanline}></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}