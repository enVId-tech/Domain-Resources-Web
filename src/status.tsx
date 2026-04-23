'use client';

import { useEffect, useRef, useState } from 'react';
import { FiGlobe, FiServer, FiMonitor, FiRefreshCw, FiLink, FiCloud } from 'react-icons/fi';
import styles from './styles/status.module.scss';
import { FaCloudflare } from 'react-icons/fa';
import { TbBrandCloudflare } from 'react-icons/tb';

interface HealthCheckResponse {
    status: 'online' | 'degraded';
    code: number;
    diagnostic: 'nominal' | 'service_issue' | 'connection_failure';
    timestamp: string;
}

export default function StatusPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted] = useState(false);
    const [hostName, setHostName] = useState<string>('loading...');
    const [errorCode, setErrorCode] = useState<string>('00000');
    const [processingLink, setProcessingLink] = useState<number>(0); // 0: Internet->Server, 1: Server->Client
    const [failedNode, setFailedNode] = useState<number | null>(null); // null = all pass, 0 = Cloudflare failed, 1 = Server failed, 2 = Client failed
    const [statusMessage, setStatusMessage] = useState<string>('Checking status...');

    useEffect(() => {
        const getStatus = async () => {
            try {
                const response = await fetch('/api/health-check');
                const data: HealthCheckResponse = await response.json();

                // Check if offline (status is degraded or error code indicates failure)
                if (data.status === 'degraded' || data.code !== 200) {
                    console.log(`Lab Alert: ${data.diagnostic} at ${data.timestamp}`);

                    // Determine which node failed based on diagnostic and code
                    if (data.code === 503) {
                        setFailedNode(1); // Server connection failure
                        setStatusMessage(`Error 503: Service Unavailable\nThe host '${hostName}' is currently unreachable due to a server connection issue.`);
                    } else if (data.code === 504) {
                        setFailedNode(0); // Cloudflare/Gateway timeout
                        setStatusMessage(`Error 504: Gateway Timeout\nThe request took too long to process. Gateway may be experiencing issues.`);
                    } else if (data.diagnostic === 'connection_failure') {
                        setFailedNode(1); // Assume server-side connection issue
                        setStatusMessage(`Error ${data.code}: Connection Failure\nUnable to establish a connection to the server.`);
                    } else if (data.diagnostic === 'service_issue') {
                        setFailedNode(1); // Server is degraded
                        setStatusMessage(`Error ${data.code}: Service Degraded\nThe server is experiencing issues but may still be partially operational.`);
                    }
                } else {
                    setFailedNode(null); // All systems nominal
                    setStatusMessage('All systems operational');
                }
            } catch (error: any) {
                console.error('Health check failed:', error);
                setFailedNode(1); // Default to server failure on fetch error
                setStatusMessage('Error 503: Service Unavailable\nUnable to perform health check. The server may be offline.');
            }
        };

        getStatus();

        // Poll every 30 seconds for continuous status updates
        const interval = setInterval(getStatus, 30000);
        return () => clearInterval(interval);
    }, [hostName]);

    // Determine node states based on progression and failures
    const getNodeState = (nodeIndex: number) => {
        // If there's a failed node
        if (failedNode !== null) {
            if (nodeIndex < failedNode) return 'success'; // Nodes before failure succeeded
            return 'failed'; // The failed node and all nodes after it
        }
        // All succeed
        if (nodeIndex === 0) return 'success'; // Internet always succeeds
        if (nodeIndex === 1 && processingLink >= 1) return 'success';
        if (nodeIndex === 2 && processingLink >= 1) return 'success';
        return 'pending';
    };

    // Determine if a node failed due to cascade (failed but not the primary failure)
    const isCascadeFailed = (nodeIndex: number) => {
        return failedNode !== null && nodeIndex > failedNode;
    };

    const getConnectionState = (connectionIndex: number) => {
        // If the source node is failed or cascade-failed, dots are inactive
        if (failedNode !== null && connectionIndex >= failedNode) {
            return 'inactive';
        }
        // Otherwise inherit the state of the SOURCE node
        return getNodeState(connectionIndex);
    };

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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
            ctx.font = `${fontSize}px monospace`;

            // Draw from top to bottom
            for (let i = 0; i < dropsTop.length; i++) {
                const text = binary[Math.floor(Math.random() * binary.length)];
                ctx.fillText(text, i * fontSize, dropsTop[i] * fontSize);

                const probability = 0.997;

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
                const probability = 0.997;

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

    // Animate dots between nodes
    useEffect(() => {
        const timer = setInterval(() => {
            setProcessingLink(prev => (prev + 1) % 2);
        }, Math.random() * 50 + 100); // Random between 100-150ms
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.errorContainer}>
            <canvas ref={canvasRef} className={styles.matrixCanvas} />

            <div className={styles.errorContent}>
                <h1 className={styles.statusTitle}>NETWORK STATUS</h1>

                <div className={styles.networkDiagram}>
                    {/* Cloudflare Node */}
                    <div className={`${styles.networkNode} ${styles[getNodeState(0)]} ${isCascadeFailed(0) ? styles.cascadeFailed : ''}`}>
                        <div className={styles.nodeIcon}>
                            <TbBrandCloudflare className={styles.icon} />
                        </div>
                        <div className={styles.nodeLabel}>Cloudflare</div>
                        <div className={styles.nodeStatus}>
                            {getNodeState(0) === 'failed' ? 'Failed' : 'Connected'}
                        </div>
                    </div>

                    {/* Connection Dots 1 */}
                    <div className={`${styles.connectionLine} ${styles.horizontal} ${styles[getConnectionState(0)]}`}>
                        <div className={styles.dotsContainer}>
                            <div className={`${styles.dot} ${styles.dot1}`}></div>
                            <div className={`${styles.dot} ${styles.dot2}`}></div>
                            <div className={`${styles.dot} ${styles.dot3}`}></div>
                            <div className={`${styles.dot} ${styles.dot4}`}></div>
                            <div className={`${styles.dot} ${styles.dot5}`}></div>
                            <div className={`${styles.dot} ${styles.dot6}`}></div>
                            <div className={`${styles.dot} ${styles.dot7}`}></div>
                            <div className={`${styles.dot} ${styles.dot8}`}></div>
                            <div className={`${styles.dot} ${styles.dot9}`}></div>
                            <div className={`${styles.dot} ${styles.dot10}`}></div>
                            <div className={`${styles.dot} ${styles.dot11}`}></div>
                            <div className={`${styles.dot} ${styles.dot12}`}></div>
                            <div className={`${styles.dot} ${styles.dot13}`}></div>
                            <div className={`${styles.dot} ${styles.dot14}`}></div>
                            <div className={`${styles.dot} ${styles.dot15}`}></div>
                            <div className={`${styles.dot} ${styles.dot16}`}></div>
                        </div>
                    </div>

                    {/* Server Node */}
                    <div className={`${styles.networkNode} ${styles[getNodeState(1)]} ${isCascadeFailed(1) ? styles.cascadeFailed : ''}`}>
                        <div className={styles.nodeIcon}>
                            <FiServer className={styles.icon} />
                        </div>
                        <div className={styles.nodeLabel}>Server</div>
                        <div className={styles.nodeStatus}>
                            {getNodeState(1) === 'failed' ? 'Failed' : 'Connected'}
                        </div>
                    </div>

                    {/* Connection Dots 2 */}
                    <div className={`${styles.connectionLine} ${styles.horizontal} ${styles[getConnectionState(1)]}`}>
                        <div className={styles.dotsContainer}>
                            <div className={`${styles.dot} ${styles.dot1}`}></div>
                            <div className={`${styles.dot} ${styles.dot2}`}></div>
                            <div className={`${styles.dot} ${styles.dot3}`}></div>
                            <div className={`${styles.dot} ${styles.dot4}`}></div>
                            <div className={`${styles.dot} ${styles.dot5}`}></div>
                            <div className={`${styles.dot} ${styles.dot6}`}></div>
                            <div className={`${styles.dot} ${styles.dot7}`}></div>
                            <div className={`${styles.dot} ${styles.dot8}`}></div>
                            <div className={`${styles.dot} ${styles.dot9}`}></div>
                            <div className={`${styles.dot} ${styles.dot10}`}></div>
                            <div className={`${styles.dot} ${styles.dot11}`}></div>
                            <div className={`${styles.dot} ${styles.dot12}`}></div>
                            <div className={`${styles.dot} ${styles.dot13}`}></div>
                            <div className={`${styles.dot} ${styles.dot14}`}></div>
                            <div className={`${styles.dot} ${styles.dot15}`}></div>
                            <div className={`${styles.dot} ${styles.dot16}`}></div>
                        </div>
                    </div>

                    {/* Client Node */}
                    <div className={`${styles.networkNode} ${styles[getNodeState(2)]} ${isCascadeFailed(2) ? styles.cascadeFailed : ''}`}>
                        <div className={styles.nodeIcon}>
                            <FiMonitor className={styles.icon} />
                        </div>
                        <div className={styles.nodeLabel}>Client</div>
                        <div className={styles.nodeStatus}>{
                            getNodeState(1) === 'failed' ? 'Failed' : getNodeState(2) === 'failed' ? 'Failed' : 'Connected'
                        }
                        </div>
                    </div>
                </div>

                <div className={styles.statusMessage}>
                    {statusMessage.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>

                <div className={styles.statusCode}>CODE: 0x{errorCode}</div>

                <div className={styles.actionButtons}>
                    <button onClick={() => window.location.reload()} className={styles.actionButton}>
                        <FiRefreshCw className={styles.buttonIcon} />
                        RETRY
                    </button>
                    <button onClick={() => window.location.href = '/links'} className={`${styles.actionButton} ${getNodeState(1) === 'failed' ? styles.disabledButton : getNodeState(0) === 'failed' ? styles.disabledButton : ''}`} disabled={getNodeState(1) === 'failed' || getNodeState(0) === 'failed'}>
                        <FiLink className={styles.buttonIcon} />
                        LINKS
                    </button>
                </div>
            </div>
        </div>
    );
}