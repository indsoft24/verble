import asyncHandler from 'express-async-handler';
import BlogPost from '../models/BlogPost.js';
import Course from '../models/Course.js';
import ExamCategory from '../models/ExamCategory.js';

const YOUR_FRONTEND_URL = 'https://www.verble.co.in';

/**
 * @desc    Generate and serve a dynamic sitemap.xml
 * @route   GET /api/sitemap.xml
 * @access  Public
 */
export const generateSitemap = asyncHandler(async (req, res) => {
    const urls = [];

    // 1. Add your static pages
    urls.push({ loc: `${YOUR_FRONTEND_URL}/`, changefreq: 'daily', priority: '1.0' });
    urls.push({ loc: `${YOUR_FRONTEND_URL}/about`, changefreq: 'monthly', priority: '0.8' });
    urls.push({ loc: `${YOUR_FRONTEND_URL}/contact`, changefreq: 'monthly', priority: '0.8' });
    urls.push({ loc: `${YOUR_FRONTEND_URL}/subscription-plans`, changefreq: 'monthly', priority: '0.9' });
    urls.push({ loc: `${YOUR_FRONTEND_URL}/blog`, changefreq: 'weekly', priority: '0.9' });

    // 2. Add all published blog posts
    const blogPosts = await BlogPost.find({ isPublished: true }).select('slug updatedAt');
    blogPosts.forEach(post => {
        urls.push({
            loc: `${YOUR_FRONTEND_URL}/blog/${post.slug}`,
            lastmod: new Date(post.updatedAt).toISOString(),
            changefreq: 'weekly',
            priority: '0.8',
        });
    });

    // 3. Add all published exam categories
    const categories = await ExamCategory.find({ isPublished: true }).select('slug updatedAt');
    categories.forEach(category => {
        urls.push({
            loc: `${YOUR_FRONTEND_URL}/exams/${category.slug}`,
            lastmod: new Date(category.updatedAt).toISOString(),
            changefreq: 'weekly',
            priority: '0.9',
        });
    });

    // 4. Add all published courses
    const courses = await Course.find({ isPublished: true }).select('_id updatedAt');
    courses.forEach(course => {
        urls.push({
            loc: `${YOUR_FRONTEND_URL}/courses/${course._id}`,
            lastmod: new Date(course.updatedAt).toISOString(),
            changefreq: 'weekly',
            priority: '0.9',
        });
    });

    // 5. Build the XML string
    const sitemap = `
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${urls.map(url => `
                <url>
                    <loc>${url.loc}</loc>
                    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
                    <changefreq>${url.changefreq}</changefreq>
                    <priority>${url.priority}</priority>
                </url>
            `).join('')}
        </urlset>
    `;

    // 6. Send the response with the correct XML content type
    res.header('Content-Type', 'application/xml');
    res.status(200).send(sitemap.trim());
});


/**
 * @desc    Generate and serve a dynamic robots.txt
 * @route   GET /api/robots.txt
 * @access  Public
 */
export const generateRobotsTxt = asyncHandler(async (req, res) => {
    const sitemapUrl = `https://api.verble.co.in/api/sitemap.xml`;

    const content = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

    res.header('Content-Type', 'text/plain');
    res.status(200).send(content);
});
