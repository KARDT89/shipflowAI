import type { NextConfig } from "next"

const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL

function getAllowedDevOrigins(): string[] {
  if (!publicAppUrl) return []
  try {
    return [new URL(publicAppUrl).hostname]
  } catch {
    return []
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  transpilePackages: [
    "@shipflow/api",
    "@shipflow/auth",
    "@shipflow/db",
    "@workspace/ui",
  ],
}

export default nextConfig
