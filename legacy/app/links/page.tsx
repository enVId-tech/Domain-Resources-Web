'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/links.module.scss';

interface Link {
    id: number;
    title: string;
    url: string;
    description: string;
    icon?: string;
}

interface LinksActive {
    link: string;
    active: boolean;
}

export default function Links() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [linksActive, setLinksActive] = useState<LinksActive[]>([]);
    const [promptLines, _] = useState<string[]>([
        '',
        'Connection established.',
        'Accessing link database...',
        'Directory ready.'
    ]);
    const [currentLine, setCurrentLine] = useState<number>(0);
    const [currentPrompt, setCurrentPrompt] = useState<string>(promptLines[0]);
    const [loadingCompleted, setLoadingCompleted] = useState<boolean>(false);
    const [links, setLinks] = useState<Link[]>([
        {
            id: 1,
            title: 'GitHub',
            url: 'https://github.com/enVId-tech',
            description: 'Source code repositories',
            icon: '⌨'
        },
        {
            id: 2,
            title: 'Portfolio',
            url: 'https://etran.dev',
            description: 'My work and projects',
            icon: ''
        }
    ]);
    const cursorRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const fetchLinks = async () => {
            const response = await fetch('/api/links');
            const data = await response.json();
            if (data.success) {
                setLinks(data.links);
                setLinksActive(data.linksActive || []);
            } else {
                console.error('Failed to fetch links:', data.error);
            }
        };

        fetchLinks();
    }, []);

    useEffect(() => {
        const promptInterval = setInterval(() => {
            setCurrentLine((prevLine) => {
                if (prevLine >= promptLines.length - 1) {
                    return prevLine;
                }
                const nextLine = (prevLine + 1)
                for (let i = 0; i < promptLines[nextLine].length; i++) {
                    setTimeout(() => {
                        setCurrentPrompt(promptLines[nextLine].substring(0, i + 1));
                        if (cursorRef.current) {
                            if (i === promptLines[nextLine].length - 1) {
                                cursorRef.current.classList.add(styles.visible);
                            } else {
                                cursorRef.current.classList.remove(styles.visible);
                            }
                        }
                        if (nextLine === promptLines.length - 1) {
                            console.log('Loading completed');
                            setLoadingCompleted(true);
                        }
                    }, i * 17.5);
                }
                return nextLine;
            });
        }, 1500);

        return () => clearInterval(promptInterval);
    }, []);


    useEffect(() => {
        setMounted(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const fontSize = 12;
        const columns = Math.floor(canvas.width / fontSize);
        const dropsTop: number[] = Array(columns).fill(1);
        const dropsBottom: number[] = Array(columns).fill(1);

        const binary = '01';

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0F0';
            ctx.font = `${fontSize}px monospace`;

            // Draw from top to bottom
            for (let i = 0; i < dropsTop.length; i++) {
                const text = binary[Math.floor(Math.random() * binary.length)];
                ctx.fillText(text, i * fontSize, dropsTop[i] * fontSize);

                const probability = 0.995; // The likelihood of displaying a character (1 - probability)

                if (dropsTop[i] * fontSize > canvas.height && Math.random() > probability) {
                    dropsTop[i] = 0;
                }

                dropsTop[i]++;
            }

            const buffer: number = 10; // Small buffer to prevent flickering at the bottom                

            // Draw from bottom to top
            for (let i = 0; i < dropsBottom.length; i++) {
                const text = binary[Math.floor(Math.random() * binary.length)];
                ctx.fillText(text, i * fontSize, canvas.height - dropsBottom[i] * fontSize + buffer);
                const probability = 0.995; // The likelihood of displaying a character

                if (dropsBottom[i] * fontSize > canvas.height && Math.random() > probability) {
                    dropsBottom[i] = 0;
                }
                dropsBottom[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleCopyLink = (link: Link) => {
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
                            <span className={styles.prompt}>$</span> cat links.db
                        </div>
                    </div>

                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>ENTRIES:</span>
                            <span className={`${styles.statValue} ${currentLine === promptLines.length - 1 ? styles.online : styles.loading}`}>{currentLine === promptLines.length - 1 ? links.length : '???'}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>STATUS:</span>
                            <span className={`${styles.statValue} ${currentLine === promptLines.length - 1 ? styles.online : styles.loading}`}>{currentLine === promptLines.length - 1 ? 'ONLINE' : 'LOADING'}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.terminal}>
                        <div className={styles.terminalLine}>
                            <span>
                                {promptLines.slice(1, currentLine).map((line, index) => (
                                    <span key={`terminal-line-${index}`}>
                                        <span className={styles.prompt}>$</span>{line}
                                        <span className={styles.terminalBreak}></span>
                                    </span>
                                ))}

                                <span className={styles.prompt}>$</span>
                                {currentPrompt}
                                <span ref={cursorRef} className={styles.cursorRef}>█</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.linksGrid}>
                    {links.map((link, index) => {
                        const linkStatus = linksActive.find(la => la.link === link.url);
                        const isInactive = linkStatus && !linkStatus.active;

                        return (
                            <div
                                key={link.id}
                                className={`${styles.linkCard} ${!loadingCompleted ? styles.hidden : ''} ${isInactive ? styles.inactive : ''}`}
                                style={mounted ? { animationDelay: `${index * 0.1}s` } : undefined}
                            >
                                <div className={styles.linkHeader}>
                                    <div className={styles.linkIcon}>{link.icon}</div>
                                    <div className={styles.linkNumber}>
                                        [{String(link.id).padStart(2, '0')}]
                                    </div>
                                </div>

                                <h3 className={styles.linkTitle}>{link.title}</h3>
                                <p className={styles.linkDescription}>{link.description}</p>

                                <div className={styles.linkUrl}>
                                    <code>{link.url}</code>
                                </div>

                                <div className={styles.linkActions}>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.visitButton}
                                    >
                                        <span className={styles.buttonPrefix}>{'>'}</span> ACCESS
                                    </a>

                                    <button
                                        onClick={() => handleCopyLink(link)}
                                        className={styles.copyButton}
                                    >
                                        <span className={styles.buttonPrefix}>{'>'}</span>
                                        {copiedId === link.id ? 'COPIED' : 'COPY'}
                                    </button>
                                </div>

                                <div className={styles.cardScanline}></div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}