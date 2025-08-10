const nextConfig = {
  // Use a different dist directory to avoid Windows file locks on .next/trace
  distDir: ".next-dist",
  // Skip ESLint during production build to prevent deployment failure on lint-only issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Suppress noisy dynamic require warning coming from @supabase/realtime-js
  webpack: (config: any) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
};

export default nextConfig;
