import { DASHBOARD_LINKS } from '../config/links';

interface HealthCheckResponse {
    status: 'online' | 'degraded';
    code: number;
    diagnostic: 'nominal' | 'service_issue' | 'connection_failure';
    timestamp: string;
}

interface LinksStatusResult {
    success: boolean;
    linksActive: { link: string; active: boolean }[];
    healthStatus?: HealthCheckResponse;
    error?: string;
}

/**
 * Fetches the health check status and determines which links should be active
 * Links are active when the server is online and operational
 */
export const getLinksStatus = async (): Promise<LinksStatusResult> => {
    try {
        console.log('[getLinksStatus] Fetching health check status...');
        
        const response = await fetch('/api/health-check', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            console.warn(`[getLinksStatus] Health check returned ${response.status}`);
            return {
                success: true,
                linksActive: DASHBOARD_LINKS.map(link => ({
                    link: link.url,
                    active: false
                })),
                error: `Health check endpoint returned ${response.status}`
            };
        }

        const data: HealthCheckResponse = await response.json();
        console.log('[getLinksStatus] Health check response:', data);

        // Determine if links should be active based on system status
        const isSystemHealthy = data.status === 'online' && data.code === 200;

        return {
            success: true,
            linksActive: DASHBOARD_LINKS.map(link => ({
                link: link.url,
                active: isSystemHealthy
            })),
            healthStatus: data
        };
    } catch (error: any) {
        console.error('[getLinksStatus] Error fetching health status:', error);

        return {
            success: true,
            linksActive: DASHBOARD_LINKS.map(link => ({
                link: link.url,
                active: true
            })),
            error: `Error checking health status: ${error.message}`
        };
    }
};
