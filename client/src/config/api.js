/**
 * centralized API Configuration
 * 
 * This helper allows the API URL to be overridden at runtime via localStorage.
 * This is crucial for using Cloudflare Tunnels where the URL changes on every restart,
 * without needing to redeploy the Vercel frontend.
 */

export const getBaseUrl = () => {
    // 1. Check for manual override (set via Debug Popup)
    const customUrl = localStorage.getItem('custom_api_url');
    if (customUrl) {
        // Ensure it doesn't end with a slash for consistency
        return customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl;
    }

    // 2. Check for Vercel Environment Variable
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.endsWith('/')
            ? import.meta.env.VITE_API_URL.slice(0, -1)
            : import.meta.env.VITE_API_URL;
    }

    // 3. Fallback to Localhost (Development)
    return 'http://localhost:3000/api';
};

// Helper to check if we are using a custom URL
export const isCustomUrl = () => {
    return !!localStorage.getItem('custom_api_url');
};

// Helper to set the custom URL
export const setBaseUrl = (url) => {
    if (!url) {
        localStorage.removeItem('custom_api_url');
        return;
    }
    // Clean up URL: remove trailing slash and ensure protocol
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

    // Ensure the path ends in /api if the user just pasted the domain
    // Most users will paste "https://foo.trycloudflare.com", but we need "/api" if that's how the backend is structured.
    // However, looking at the code, some endpoints might be /api/foo and others just /foo.
    // The current env var convention is likely just the host or host/api. 
    // Let's assume the user pastes the ROOT domain (e.g. from the terminal output).
    // The existing VITE_API_URL likely includes /api or the code adds it. 
    // Let's look at Dashboard.jsx: const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    // So the BASE URL should include /api.

    if (!cleanUrl.endsWith('/api')) {
        cleanUrl = `${cleanUrl}/api`;
    }

    localStorage.setItem('custom_api_url', cleanUrl);
};
