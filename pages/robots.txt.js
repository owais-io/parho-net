// app/robots.ts (App Router) OR pages/robots.txt.js (Pages Router)

import { GetServerSideProps } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /story/*
Allow: /category/*
Allow: /categories

# Disallow admin and API routes
Disallow: /admin
Disallow: /api/
Disallow: /_next/
Disallow: /auth

# Allow crawling of important pages
Allow: /sitemap.xml

# Sitemap location
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl delay (optional - be nice to servers)
Crawl-delay: 1`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(robotsTxt);
  res.end();

  return {
    props: {},
  };
};

export default function RobotsTxt() {
  return null;
}