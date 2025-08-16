// pages/sitemap.xml.js (for Pages Router - since you're using pages/)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.parho.net';

function generateSiteMap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${urls
       .map((url) => {
         return `
       <url>
           <loc>${url.loc}</loc>
           <lastmod>${url.lastmod}</lastmod>
           <changefreq>${url.changefreq}</changefreq>
           <priority>${url.priority}</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

export async function getServerSideProps({ res }) {
  try {
    const urls = [];

    // Static pages
    urls.push(
      {
        loc: SITE_URL,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0',
      },
      {
        loc: `${SITE_URL}/categories`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '0.8',
      }
    );

    // Get all published articles
    const articles = await prisma.guardianArticle.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        openaiSummary: {
          slug: { not: null },
          processingStatus: 'COMPLETED',
          deletedAt: null,
        }
      },
      include: {
        openaiSummary: {
          select: {
            slug: true,
            category: true,
            updatedAt: true,
          }
        }
      },
    });

    // Add article URLs
    articles.forEach(article => {
      if (article.openaiSummary?.slug) {
        urls.push({
          loc: `${SITE_URL}/story/${article.openaiSummary.slug}`,
          lastmod: article.openaiSummary.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: '0.7',
        });
      }
    });

    // Get unique categories
    const categories = await prisma.openaiSummary.findMany({
      where: {
        processingStatus: 'COMPLETED',
        deletedAt: null,
        category: { not: '' },
        guardianArticle: {
          status: 'PUBLISHED',
          deletedAt: null,
        }
      },
      select: {
        category: true,
        updatedAt: true,
      },
      distinct: ['category'],
    });

    // Add category URLs
    categories.forEach(cat => {
      if (cat.category) {
        const categorySlug = cat.category
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');

        urls.push({
          loc: `${SITE_URL}/category/${categorySlug}`,
          lastmod: cat.updatedAt.toISOString(),
          changefreq: 'daily',
          priority: '0.6',
        });
      }
    });

    // Generate the XML sitemap
    const sitemap = generateSiteMap(urls);

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Basic fallback sitemap
    const basicSitemap = generateSiteMap([
      {
        loc: SITE_URL,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0',
      }
    ]);

    res.setHeader('Content-Type', 'text/xml');
    res.write(basicSitemap);
    res.end();

    return { props: {} };
  } finally {
    await prisma.$disconnect();
  }
}

export default function SiteMap() {
  // getServerSideProps will do the heavy lifting
}