'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/error.module.scss';

export default function Error() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [promptLines, setPromptLines] = useState<string[]>([
        '',
        'Analyzing error...',
        'Checking system logs...',
        `Host status: unreachable`,
        'Please try again later.'
    ]);
    const [currentLine, setCurrentLine] = useState<number>(0);
    const [currentPrompt, setCurrentPrompt] = useState<string>(promptLines[0]);
    const [errorCode, setErrorCode] = useState<string>('00000');
    const [mounted, setMounted] = useState(false);
    const cursorRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        setMounted(true);
        // Update host name on client side only
        if (typeof window !== 'undefined') {
            setPromptLines(prev => {
                const newLines = [...prev];
                newLines[3] = `Host '${window.location.host}' status: unreachable`;
                return newLines;
            });
        }
    }, []);

    useEffect(() => {
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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
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

        const interval = setInterval(draw, 33);

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        if (mounted) {
            const randomErrorCode = Math.floor(Math.random() * 0xFFFFF).toString(16).toUpperCase().padStart(5, '0');
            setErrorCode(randomErrorCode);
        }

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, [mounted]);

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
                    }, i * 20);
                }
                return nextLine;
            });
        }, 1500);

        return () => clearInterval(promptInterval);
    }, []);

    return (
        <div className={styles.errorContainer}>
            <canvas ref={canvasRef} className={styles.matrixCanvas} />

            <div className={styles.errorContent}>
                <div className={styles.errorBox}>
                    <div className={styles.errorIcon}>
                        <span className={styles.exclamation}>!</span>
                    </div>

                    <h1 className={styles.errorTitle}>SYSTEM ERROR</h1>

                    <div className={styles.errorCode}>ERROR_CODE: 0x{errorCode}</div>

                    <p className={styles.errorMessage}>
                        Error 404: The requested resource was not found on this server.
                    </p>


                    <div className={styles.buttonGroup}>
                        <button onClick={() => window.location.reload()} className={styles.retryButton}>
                            <span className={styles.buttonPrefix}>{'>'}</span> RETRY
                        </button>
                        <button onClick={() => window.location.href = '/links'} className={styles.homeButton}>
                            <span className={styles.buttonPrefix}>{'>'}</span> LINKS
                        </button>
                    </div>

                    <div className={styles.terminal}>
                        <div className={styles.terminalLine}>
                            <span>
                                {promptLines.slice(1, currentLine).map((line, index) => (
                                    <span key={index}>
                                        <span className={styles.prompt}>$</span>{line}
                                        <span className={styles.terminalBreak}></span>
                                    </span>
                                ))}

                                <span className={styles.prompt}>$</span>
                                {currentPrompt}
                                <span ref={cursorRef}>█</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}