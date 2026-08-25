import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TRENDING_TOPIC_IDEAS = [
  {
    topic: 'Tri-ply Stainless Steel Cookware: Why It Outperforms Non-Stick in Indian Kitchens',
    category: 'Cookware Guides',
    keywords: ['triply steel kadai', 'non stick vs stainless steel', 'best cookware for indian cooking']
  },
  {
    topic: '10 Proven Health Benefits of Drinking Water from Pure Copper Vessels (Tamra Jal)',
    category: 'Health & Copper',
    keywords: ['copper water bottle benefits', 'tamra jal ayurveda', 'how to clean copper vessel']
  },
  {
    topic: 'How Live Metal Scrap Rates Are Calculated: Complete Doorstep Pickup Guide',
    category: 'Scrap & Recycling',
    keywords: ['scrap metal rate per kg telangana', 'copper scrap price today', 'doorstep scrap pickup']
  },
  {
    topic: 'Cast Iron vs Stainless Steel: Which Heavy Cookware is Best for Daily Cooking?',
    category: 'Cookware Guides',
    keywords: ['cast iron tawa vs steel', 'seasoning cast iron cookware', 'heavy bottom cookware']
  },
  {
    topic: 'Traditional Brass Utensils (Pital): Health Advantages, Seasoning & Maintenance',
    category: 'Kitchen Tips',
    keywords: ['brass urli benefits', 'cooking in brass utensils', 'how to polish brass vessels']
  },
  {
    topic: 'How to Choose the Right Heavy-Gauge Steel Tope Set for Large Family Cooking',
    category: 'Cookware Guides',
    keywords: ['stainless steel tope set with lid', 'heavy gauge steel vessels', 'commercial kitchen vessels']
  },
  {
    topic: 'B2B Wholesale Kitchenware Procurement Guide for Hotels, Caterers & Hostels',
    category: 'Wholesale Insights',
    keywords: ['wholesale kitchen utensils supplier', 'bulk catering vessels', 'GST invoice kitchenware']
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, topic, category } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // MODE 1: Suggest Daily Trending Topics
    if (mode === 'suggest_topics') {
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

          const prompt = `
            You are an expert SEO content strategist for "ESHwar Home Needs", a leading retail, wholesale, and scrap metal enterprise in Telangana, India.
            Generate 6 trending, high-traffic Google search blog topic ideas for Indian households, chefs, hotels, and recycling customers.

            Format your response strictly as a JSON array of objects with keys:
            - "topic": Engaging, click-worthy article title
            - "category": One of "Cookware Guides" | "Health & Copper" | "Scrap & Recycling" | "Kitchen Tips" | "Wholesale Insights"
            - "searchIntent": Short string describing user intent (e.g. "Commercial buying", "Health research")
            - "keywords": Array of 3 high-volume keywords

            Return ONLY raw JSON. No markdown code fences.
          `;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return NextResponse.json({ success: true, topics: parsed });
        } catch (err) {
          console.warn('Gemini topic suggestion fallback:', err);
        }
      }
      return NextResponse.json({ success: true, topics: TRENDING_TOPIC_IDEAS });
    }

    // MODE 2: Generate Full SEO Article
    const articleTopic = topic || 'Why Tri-ply Stainless Steel is the Safest Cookware for Daily Indian Cooking';

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

        const prompt = `
          You are a professional SEO copywriter and culinary metallurgist writing an in-depth article for "ESHwar Home Needs" (a premier kitchenware & metal recycling brand in Hanumakonda/Warangal, Telangana).

          Article Topic: "${articleTopic}"
          Category Hint: "${category || 'Cookware Guides'}"

          Write a comprehensive, engaging, and search-optimized article. Follow these strict guidelines:
          1. Length: 1,000+ words with rich Markdown formatting (H2 '##', H3 '###', bullet points, comparison tables, bold highlights).
          2. Structure:
             - Engaging intro addressing pain points of Indian home cooks / buyers.
             - Deep-dive into materials, food-grade certifications (SS 304, pure copper, food-safe brass).
             - Comparison table with traditional alternatives.
             - Step-by-step care and maintenance instructions.
             - Concluding call-to-action mentioning ESHwar Home Needs.
          3. Include 3-4 high-value FAQs with concise answers suitable for Google Search FAQ Schema.

          Return your response strictly as a JSON object with this structure:
          {
            "title": "SEO Optimized Click-Worthy Headline",
            "slug": "url-friendly-slug-with-hyphens",
            "excerpt": "Concise 150-character meta description for Google Search snippets",
            "category": "Cookware Guides" | "Health & Copper" | "Scrap & Recycling" | "Kitchen Tips" | "Wholesale Insights",
            "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
            "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
            "readTimeMinutes": 5,
            "content": "Full markdown content string with ## subheadings, comparison tables, and lists...",
            "imageCaption": "Descriptive image caption for Google Image SEO alt text",
            "faqs": [
              { "question": "Question text?", "answer": "Answer text." }
            ]
          }

          Return ONLY valid JSON. Do not wrap in markdown quotes.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // Assign appropriate image from shop assets
        let defaultImage = '/shop/IMG_1626636968308250350 (1).jpg';
        if (parsed.category === 'Health & Copper' || articleTopic.toLowerCase().includes('copper')) {
          defaultImage = '/shop/IMG_2440041935501381787.jpg';
        } else if (parsed.category === 'Scrap & Recycling' || articleTopic.toLowerCase().includes('scrap')) {
          defaultImage = '/shop/IMG_1497965090816371006 (1).jpg';
        } else if (parsed.category === 'Kitchen Tips' || articleTopic.toLowerCase().includes('brass')) {
          defaultImage = '/shop/IMG_2150997192969140622 (2).jpg';
        } else if (articleTopic.toLowerCase().includes('wooden')) {
          defaultImage = '/shop/IMG_9063892282997077299 (1).jpg';
        }

        parsed.featuredImage = defaultImage;
        parsed.id = parsed.slug || `blog_${Date.now()}`;
        parsed.author = 'Kailash Satkuri';
        parsed.published = true;
        parsed.publishedAt = new Date().toISOString();
        parsed.updatedAt = new Date().toISOString();
        parsed.views = 1;

        return NextResponse.json({ success: true, blog: parsed });
      } catch (aiErr) {
        console.error('Gemini blog generation error:', aiErr);
      }
    }

    // Fallback Offline Generator
    const slug = articleTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const fallbackBlog = {
      id: slug,
      slug: slug,
      title: articleTopic,
      excerpt: `Comprehensive guide and buying advice on ${articleTopic} by ESHwar Home Needs.`,
      category: category || 'Cookware Guides',
      tags: ['Kitchenware', 'Cookware Guide', 'Home Essentials', 'Telangana'],
      keywords: [articleTopic.toLowerCase(), 'best kitchenware warangal', 'eshwar home needs'],
      readTimeMinutes: 5,
      featuredImage: '/shop/IMG_1626636968308250350 (1).jpg',
      imageCaption: `${articleTopic} — Quality guaranteed by ESHwar Home Needs`,
      author: 'Kailash Satkuri',
      published: true,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1,
      faqs: [
        {
          question: `Why choose ESHwar Home Needs for ${articleTopic}?`,
          answer: 'We provide certified food-grade metals, honest wholesale pricing, and doorstep support across Telangana and Andhra Pradesh.'
        }
      ],
      content: `
## Overview of ${articleTopic}

Cooking with the right utensils is essential for flavor, nutritional retention, and long-term health. At **ESHwar Home Needs**, we believe every home and commercial kitchen deserves authentic, certified cookware.

---

### Key Advantages
- **Food-Grade Construction:** Non-reactive surfaces that preserve food flavor.
- **Superior Thermal Efficiency:** Heavy bottoms that prevent hotspots and burning.
- **Durability:** Built to last decades under rigorous daily use.

---

### Care and Maintenance
1. Wash with mild soap and warm water.
2. Avoid harsh steel scrubbers on polished exteriors.
3. Dry thoroughly after washing to maintain mirror shine.

Visit our showroom in Hanumakonda or order online at **ESHwar Home Needs**!
      `
    };

    return NextResponse.json({ success: true, blog: fallbackBlog });
  } catch (error) {
    console.error('Error generating blog:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
