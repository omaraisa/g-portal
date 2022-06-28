/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack5: true,
  webpack: (config)  => {
    config.resolve.fallback = {fs: false};
    return config
  },
  env: {
    BASE_URL: process.env.BASE_URL,
  },
  reactStrictMode: true,
  api: {
    limit: '50mb',
    // limit: 52428800,
    bodyParser: false, // enable POST requests
    externalResolver: true, // hide warning message
  },
}

    module.exports = nextConfig
