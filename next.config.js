/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname;
try {
  if (supabaseUrl) supabaseHostname = new URL(supabaseUrl).hostname;
} catch (e) {
  supabaseHostname = undefined;
}

const nextConfig = {
  images: {
    /*domains: ['via.placeholder.com'],*/
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: 'https',
              hostname: supabaseHostname,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
};

module.exports = nextConfig;
