import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // static export for GitHub Pages; CI sets the repo sub-path (e.g. /FIVES-champions)
  output: "export",
  basePath: process.env.PAGES_BASE_PATH || "",
};

export default nextConfig;
