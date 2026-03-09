import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    devIndicators: false,
    experimental: {
        serverActions: {
            allowedOrigins: [
                "localhost:3000",
                "*.github.dev",
                "*.app.github.dev"
            ]
        }
    }
};

export default nextConfig;
