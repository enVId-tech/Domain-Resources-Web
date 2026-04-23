'use client';

import { useEffect, useRef, useState } from 'react';
import { FiGlobe, FiServer, FiMonitor } from 'react-icons/fi';
import styles from './styles/status.module.scss';

export default function StatusPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted] = useState(false);
    const [hostName, setHostName] = useState<string>('loading...');
    const [errorCode, setErrorCode] = useState<string>('00000');
    const [activeNode, setActiveNode] = useState<number>(1);

    useEffect(() => {
        setMounted(true);
        // Update host name on client side only
        if (typeof window !== 'undefined') {
            setHostName(window.location.host);
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
        const dropsTop: number[] = Array(columns).fill(0).map(() => Math.floor(Math.random() * canvas.height * 3 / fontSize));
        const dropsBottom: number[] = Array(columns).fill(0).map(() => Math.floor(Math.random() * canvas.height * 3 / fontSize));

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

                const probability = 0.995;

                if (dropsTop[i] * fontSize > canvas.height && Math.random() > probability) {
                    dropsTop[i] = 0;
                }

                dropsTop[i]++;
            }

            const buffer: number = 10;

            // Draw from bottom to top
            for (let i = 0; i < dropsBottom.length; i++) {
                const text = binary[Math.floor(Math.random() * binary.length)];
                ctx.fillText(text, i * fontSize, canvas.height - dropsBottom[i] * fontSize + buffer);
                const probability = 0.995;

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

    // Rotate active node for visual feedback
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveNode(prev => (prev + 1) % 3);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.errorContainer}>
            <canvas ref={canvasRef} className={styles.matrixCanvas} />

            <div className={styles.errorContent}>
                <h1 className={styles.statusTitle}>NETWORK STATUS</h1>

                <div className={styles.networkDiagram}>
                    {/* Internet Node */}
                    <div className={`${styles.networkNode} ${activeNode === 0 ? styles.active : ''}`}>
                        <div className={styles.nodeIcon}>
                            <FiGlobe className={styles.icon} />
                        </div>
                        <div className={styles.nodeLabel}>Internet</div>
                        <div className={styles.nodeStatus}>Connected</div>
                    </div>

                    {/* Connection Line */}
                    <div className={`${styles.connectionLine} ${styles.horizontal}`}>
                        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className={styles.arrowLine}>
                            <line x1="0" y1="5" x2="85" y2="5" stroke="#0f0" strokeWidth="2" />
                            <polygon points="100,5 90,0 90,10" fill="#0f0" />
                        </svg>
                    </div>

                    {/* Server Node */}
                    <div className={`${styles.networkNode} ${activeNode === 1 ? styles.active : ''}`}>
                        <div className={styles.nodeIcon}>
                            <FiServer className={styles.icon} />
                        </div>
                        <div className={styles.nodeLabel}>Server</div>
                        <div className={styles.nodeStatus}>Unreachable</div>
                    </div>

                    {/* Connection Line */}
                    <div className={`${styles.connectionLine} ${styles.horizontal}`}>
                        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className={styles.arrowLine}>
                            <line x1="0" y1="5" x2="85" y2="5" stroke="#0f0" strokeWidth="2" />
                            <polygon points="100,5 90,0 90,10" fill="#0f0" />
                        </svg>
                    </div>

                    {/* Client Node */}
                    <div className={`${styles.networkNode} ${activeNode === 2 ? styles.active : ''}`}>
                        <div className={styles.nodeIcon}>
                            <FiMonitor className={styles.icon} />
                        </div>
                        <div className={styles.nodeLabel}>Client</div>
                        <div className={styles.nodeStatus}>Connected</div>
                    </div>
                </div>

                <div className={styles.statusMessage}>
                    Error 503: Service Unavailable
                    <br />
                    The host '{hostName}' is currently unreachable. The server may be offline or experiencing network issues.
                </div>

                <div className={styles.statusCode}>CODE: 0x{errorCode}</div>

                <div className={styles.actionButtons}>
                    <button onClick={() => window.location.reload()} className={styles.actionButton}>
                        🔄 RETRY
                    </button>
                    <button onClick={() => window.location.href = '/links'} className={styles.actionButton}>
                        🔗 LINKS
                    </button>
                </div>
            </div>
        </div>
    );
}