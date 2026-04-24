'use client';

import { useEffect, useRef, useState } from 'react';
import { FiServer, FiMonitor, FiRefreshCw, FiLink } from 'react-icons/fi';
import styles from './styles/status.module.scss';
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
    const [errorCode, setErrorCode] = useState<string>('00000');
    const [animationStage, setAnimationStage] = useState<number>(0); // 0-2 for node progression
    const [failedNode, setFailedNode] = useState<number | null>(null); // null = all pass, 0 = Cloudflare failed, 1 = Server failed, 2 = Client failed
    const [statusMessage, setStatusMessage] = useState<string>('Checking status...');
    const [statusVerified, setStatusVerified] = useState(false); // Flag to stop animation once status is verified
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const updateStatus = async () => {
        try {
            console.log('[StatusPage] Fetching /api/health-check...');
            const response = await fetch('/api/health-check', {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            console.log(`[StatusPage] Response status: ${response.status}, ok: ${response.ok}`);
            console.log(`[StatusPage] Content-Type: ${response.headers.get('Content-Type')}`);

            if (!response.ok) {
                console.error(`[StatusPage] Health check returned error status: ${response.status}`);
                setFailedNode(1);
                setStatusMessage(`Error ${response.status}: Health Check Endpoint Error\nThe server's health check endpoint is not responding correctly.\n\nNote: Make sure the Wrangler worker is running with 'wrangler dev' in development.`);
                setStatusVerified(true); // Mark status as verified
                return;
            }

            const data: HealthCheckResponse = await response.json();
            console.log('[StatusPage] Health check response:', data);

            // Check if offline (status is degraded or error code indicates failure)
            if (data.status === 'degraded' || data.code !== 200) {
                console.log(`[StatusPage] Lab Alert: ${data.diagnostic} at ${data.timestamp}`);

                // Determine which node failed based on HTTP status code
                const statusCode = data.code;
                let failureNode = 1; // Default to server failure
                let errorTitle = 'Service Error';
                let errorDescription = 'An unexpected error occurred.';

                // Gateway/Cloudflare errors (502, 504)
                if (statusCode === 502) {
                    failureNode = 0;
                    errorTitle = 'Error 502: Bad Gateway';
                    errorDescription = 'The gateway received an invalid response. Cloudflare may be experiencing issues.';
                } else if (statusCode === 504) {
                    failureNode = 0;
                    errorTitle = 'Error 504: Gateway Timeout';
                    errorDescription = 'The request timed out at the gateway. Cloudflare may be experiencing slowness.';
                }
                // Server errors (5xx)
                else if (statusCode === 500) {
                    failureNode = 1;
                    errorTitle = 'Error 500: Internal Server Error';
                    errorDescription = 'The server encountered an unexpected condition.';
                } else if (statusCode === 501) {
                    failureNode = 1;
                    errorTitle = 'Error 501: Not Implemented';
                    errorDescription = 'The server does not support the functionality required to fulfill the request.';
                } else if (statusCode === 503) {
                    failureNode = 1;
                    errorTitle = 'Error 503: Service Unavailable';
                    errorDescription = 'The server is currently unavailable or overloaded.';
                } else if (statusCode >= 500 && statusCode < 600) {
                    failureNode = 1;
                    errorTitle = `Error ${statusCode}: Server Error`;
                    errorDescription = 'The server encountered an error processing your request.';
                }
                // Client errors (4xx)
                else if (statusCode === 400) {
                    failureNode = 2;
                    errorTitle = 'Error 400: Bad Request';
                    errorDescription = 'The request is malformed or invalid.';
                } else if (statusCode === 401) {
                    failureNode = 2;
                    errorTitle = 'Error 401: Unauthorized';
                    errorDescription = 'Authentication is required to access this resource.';
                } else if (statusCode === 403) {
                    failureNode = 2;
                    errorTitle = 'Error 403: Forbidden';
                    errorDescription = 'You do not have permission to access this resource.';
                } else if (statusCode === 404) {
                    failureNode = 2;
                    errorTitle = 'Error 404: Not Found';
                    errorDescription = 'The requested resource could not be found.';
                } else if (statusCode === 408) {
                    failureNode = 2;
                    errorTitle = 'Error 408: Request Timeout';
                    errorDescription = 'The request took too long to complete.';
                } else if (statusCode === 429) {
                    failureNode = 2;
                    errorTitle = 'Error 429: Too Many Requests';
                    errorDescription = 'Too many requests have been sent in a given amount of time.';
                } else if (statusCode >= 400 && statusCode < 500) {
                    failureNode = 2;
                    errorTitle = `Error ${statusCode}: Client Error`;
                    errorDescription = 'The request is invalid or cannot be processed.';
                }

                setFailedNode(failureNode);
                setStatusMessage(`${errorTitle}\n${errorDescription}`);
            } else {
                setFailedNode(null); // All systems nominal
                setStatusMessage('All systems operational');
            }
            setStatusVerified(true); // Mark status as verified, stop animation
        } catch (error: any) {
            console.error('[StatusPage] Health check failed:', error);
            console.error('[StatusPage] Error message:', error.message);
            console.error('[StatusPage] Error type:', error.constructor.name);
            
            setFailedNode(1); // Default to server failure on fetch error
            setStatusMessage(`Error: Health Check Failed\nUnable to reach the health check endpoint.\n\nNote: Make sure the Wrangler worker is running with 'wrangler dev' in development.`);
            setStatusVerified(true); // Mark status as verified even on error
        }
    };

    useEffect(() => {
        // Initial check on mount
        updateStatus();

        // Poll every 5 seconds for frequent status updates (better for testing)
        const interval = setInterval(updateStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    // Determine node states based on animation stage and failures
    const getNodeState = (nodeIndex: number) => {
        // If there's a failed node, show the failure
        if (failedNode !== null) {
            if (nodeIndex < failedNode) return 'success'; // Nodes before failure succeeded
            return 'failed'; // The failed node and all nodes after it
        }
        
        // If status is verified and no failures, all nodes are success
        if (statusVerified) {
            return 'success'; // All nodes are green when verified and no failures
        }
        
        // While waiting for verification, show animation progression
        if (nodeIndex === 0) return 'success'; // Cloudflare always green
        if (nodeIndex === 1 && animationStage >= 1) return 'success'; // Server succeeds at stage 1
        if (nodeIndex === 2 && animationStage >= 2) return 'success'; // Client succeeds at stage 2
        return 'pending'; // All others are gray/pending
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

    // Set mounted flag on component mount
    useEffect(() => {
        setMounted(true);
        
        // Generate error code on mount
        const randomErrorCode = Math.floor(Math.random() * 0xFFFFF).toString(16).toUpperCase().padStart(5, '0');
        setErrorCode(randomErrorCode);
    }, []);

    // Smooth animation loop - runs independently from health checks
    useEffect(() => {
        // Only set up animation once on mount
        if (intervalRef.current) return;

        // Fixed delay of 225ms (middle of 150-300ms range) for consistent animation
        const ANIMATION_DELAY = 225;
        intervalRef.current = setInterval(() => {
            setAnimationStage(prev => {
                // Stop at stage 2 - don't cycle back to 0
                if (prev >= 2) return 2;
                return prev + 1;
            });
        }, ANIMATION_DELAY);

        // Don't clean up - let the animation run continuously
        // The interval will be cleared when the page unmounts
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

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, [mounted]);

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
                    <button onClick={updateStatus} className={styles.actionButton}>
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