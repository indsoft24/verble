// scripts/seedBlogPosts.js
// Idempotent seed for published Verble learning-plan blog posts.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import slugify from 'slugify';

import User from '../src/models/User.js';
import BlogPost from '../src/models/BlogPost.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const BLOG_POSTS = [
    {
        title: 'How Verble Learning Plans Help Students Speak English with Confidence',
        description:
            'Discover how Verble’s step-by-step plans—from free daily practice to the Full Course and AI Companion—help learners build real-world English skills.',
        category: 'English Learning',
        tags: ['Verble plans', 'English learning', 'student benefits', 'speaking practice'],
        featureImage:
            'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&dpr=2',
        content: `
<p>Many learners in India understand grammar on paper but freeze when they have to speak in an interview, a client call, or even a casual conversation. Verble is built for exactly that gap—not textbook English alone, but <strong>practical confidence you can use every day</strong>.</p>
<p>Here is how our learning plans are designed to support you at every stage.</p>

<h2>Start free, build a daily habit</h2>
<p>Every journey on Verble can begin with the <strong>Free Foundation</strong> plan. You get access to daily words, phrases of the week, and bite-sized practice that fits into a busy schedule. Consistency matters more than long study sessions—and our free tier is designed to help you show up every day without pressure.</p>
<p>As you maintain your learning streak, you unlock richer content tiers such as <strong>Bronze</strong> and <strong>Silver</strong>, which add structured reads, vocabulary depth, and real-life communication puzzles.</p>

<h2>Gold Membership: practice for work and real situations</h2>
<p>When you are ready to move beyond basics, <strong>Gold Membership</strong> focuses on scenarios that matter in professional and social life:</p>
<ul>
<li><strong>Explain the scene</strong> — describe situations clearly with the right vocabulary</li>
<li><strong>Professional conversations</strong> — rehearse interviews, meetings, and workplace dialogue</li>
<li><strong>AI prompts</strong> — guided speaking and writing support tailored to your level</li>
</ul>
<p>This plan is ideal if you already know some English but want structured practice before high-stakes moments.</p>

<h2>Full Course: the complete Zero to Hero path</h2>
<p>The <strong>Full Course</strong> is Verble’s flagship curriculum—modules, long-form lessons, quizzes, and a clear syllabus from introduction through grammar, tenses, modals, and beyond. If you want a single structured program instead of scattered videos, this plan gives you a guided roadmap with measurable progress.</p>
<p>Students benefit from:</p>
<ul>
<li>A visible module-by-module syllabus so you always know what comes next</li>
<li>Quizzes that reinforce what you watched</li>
<li>Content aligned with survival and professional English—not abstract theory alone</li>
</ul>

<h2>AI Learning Companion: multilingual support when you think in Hindi</h2>
<p>Not everyone thinks in English first. The <strong>AI Learning Companion</strong> offers multilingual guidance for speaking and typing—helpful when you want explanations in Hinglish or need a patient practice partner available anytime.</p>

<h2>Which plan should you choose?</h2>
<p><strong>Choose Free Foundation</strong> if you are exploring Verble or rebuilding a daily habit.<br>
<strong>Choose Gold Membership</strong> if you need scenario-based speaking practice.<br>
<strong>Choose Full Course</strong> if you want the complete structured program.<br>
<strong>Add AI Learning Companion</strong> if you want extra guided practice alongside any paid plan.</p>

<p>Ready to begin? Visit our <a href="/courses">Courses</a> page to explore the syllabus, compare plan value, and open your <a href="/dashboard">Dashboard</a> to start learning today.</p>
        `.trim(),
    },
    {
        title: 'Choosing the Right Verble Plan: Full Course vs Gold vs AI Companion',
        description:
            'Not sure which Verble subscription fits your goals? Compare Full Course, Gold Membership, and AI Learning Companion—and see how each plan benefits students.',
        category: 'English Learning',
        tags: ['subscription plans', 'Full Course', 'Gold Membership', 'AI Companion', 'Verble'],
        featureImage:
            'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&dpr=2',
        content: `
<p>Picking the right English learning plan can feel confusing—especially when every platform promises “fluency in 30 days.” At Verble, we keep it practical: <strong>different plans solve different problems</strong>. This guide helps you choose the plan that matches where you are today and where you want to be in three to six months.</p>

<h2>Quick comparison</h2>
<ul>
<li><strong>Gold Membership (₹4,999)</strong> — Best for learners who want focused practice: explain situations, professional conversations, and AI-guided prompts.</li>
<li><strong>Full Course (₹29,000)</strong> — Best for learners who want the complete Zero to Hero curriculum with modules, videos, quizzes, and a full syllabus.</li>
<li><strong>AI Learning Companion (₹2,999)</strong> — Best as a practice partner for speaking and typing, with multilingual support when you learn in English or Hinglish.</li>
</ul>

<h2>Who benefits most from Gold Membership?</h2>
<p>Choose Gold if you already understand basic English but struggle when you have to <em>perform</em>—in interviews, team meetings, customer calls, or social settings. Gold compresses practice into high-value activities instead of asking you to watch hours of generic content.</p>
<p><strong>Typical student wins:</strong> clearer answers in interviews, stronger vocabulary for explaining ideas, and regular AI-assisted rehearsal.</p>

<h2>Who benefits most from the Full Course?</h2>
<p>Choose the Full Course if your foundation needs structure. Maybe you learned English in school but never built confidence, or you want one trusted path instead of random YouTube lessons. The Full Course walks you module by module—from introduction and foundations through nouns, verbs, tenses, modals, and more.</p>
<p><strong>Typical student wins:</strong> systematic progress, quiz-backed retention, and a syllabus you can follow even with a full-time job.</p>

<h2>Who benefits most from the AI Learning Companion?</h2>
<p>Choose the AI Companion if your biggest blocker is <strong>practice time and feedback</strong>. You may know what to study but rarely speak aloud. The companion gives you a safe space to try sentences, fix mistakes, and build speed—especially helpful if you think in Hindi and translate in your head.</p>
<p><strong>Typical student wins:</strong> more speaking reps per week, less fear of making errors, and support that adapts to your pace.</p>

<h2>Can you combine plans?</h2>
<p>Yes. Many serious learners use the <strong>Full Course</strong> for structure and add <strong>Gold</strong> or the <strong>AI Companion</strong> for extra speaking practice. Start with the plan that solves your biggest pain point—you can always explore other tiers from your dashboard.</p>

<h2>Free tiers still matter</h2>
<p>Before you pay, explore <strong>Free Foundation</strong>, <strong>Bronze</strong>, and <strong>Silver</strong> content. They help you build streaks, sample Verble’s teaching style, and unlock deeper tiers as you stay consistent.</p>

<h2>Next steps</h2>
<p>Browse the <a href="/courses">course syllabus</a>, review plans on <a href="/subscription-plans">Subscription Plans</a>, and sign in to your <a href="/dashboard">Dashboard</a> to begin. If you have questions about which plan fits your goal, reach us on the <a href="/contact-us">Contact</a> page—we are happy to guide you.</p>
        `.trim(),
    },
];

const seedBlogPosts = async () => {
    try {
        const mongoURI = process.env.DOCKER_ENV
            ? (process.env.MONGODB_URI_DOCKER || process.env.MONGODB_URI)
            : (process.env.MONGODB_URI || process.env.MONGODB_URI_DOCKER);

        if (!mongoURI) {
            throw new Error('MongoDB URI not found.');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            throw new Error('No admin user found. Run createAdmin.js first.');
        }

        for (const post of BLOG_POSTS) {
            const slug = slugify(post.title, { lower: true, strict: true });
            const saved = await BlogPost.findOneAndUpdate(
                { slug },
                {
                    ...post,
                    slug,
                    author: adminUser._id,
                    isPublished: true,
                    publishedAt: new Date(),
                },
                { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
            );
            console.log(`✅ Blog post ready: ${saved.title} (/blog/${saved.slug})`);
        }

        console.log('\n🎉 Blog seed complete.');
    } catch (error) {
        console.error('❌ Blog seed failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedBlogPosts();
