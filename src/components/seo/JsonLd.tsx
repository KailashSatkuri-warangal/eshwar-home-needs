import React from 'react';

interface LocalBusinessJsonLdProps {
  name?: string;
  description?: string;
  url?: string;
  telephone?: string;
  image?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
}

export function LocalBusinessJsonLd({
  name = 'ESHwar Home Needs',
  description = 'Premium kitchenware, steel vessels, brass, copper, wholesale distribution, and doorstep scrap collection in Hanumakonda, Warangal, Telangana.',
  url = 'https://www.eshwarhomeneeds.shop',
  telephone = '+919949408061',
  image = 'https://www.eshwarhomeneeds.shop/shop/IMG_1497965090816371006 (1).jpg',
  address = {
    streetAddress: 'Main Road, Near Bus Station',
    addressLocality: 'Hanumakonda',
    addressRegion: 'Telangana',
    postalCode: '506001',
    addressCountry: 'IN',
  },
}: LocalBusinessJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HomeGoodsStore',
    name,
    description,
    url,
    telephone,
    image,
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, Credit Card, UPI, Net Banking, Razorpay',
    openingHours: 'Mo-Su 09:00-21:00',
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '17.9784',
      longitude: '79.5941',
    },
    sameAs: [
      'https://wa.me/919949408061',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductJsonLd({ product }: { product: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.originalImage ? `https://www.eshwarhomeneeds.shop${product.originalImage}` : undefined,
    description: product.description,
    sku: product.sku,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: 'ESHwar Home Needs',
    },
    offers: {
      '@type': 'Offer',
      url: `https://www.eshwarhomeneeds.shop/shop/${product.id}`,
      priceCurrency: 'INR',
      price: product.discountPrice || product.retailPrice,
      priceValidUntil: '2027-12-31',
      availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'ESHwar Home Needs',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '24',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleJsonLd({ post }: { post: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage ? (post.featuredImage.startsWith('http') ? post.featuredImage : `https://www.eshwarhomeneeds.shop${post.featuredImage}`) : undefined,
    author: {
      '@type': 'Person',
      name: post.author || 'Kailash Satkuri',
      url: 'https://www.eshwarhomeneeds.shop',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ESHwar Home Needs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.eshwarhomeneeds.shop/favicon.ico',
      },
    },
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.eshwarhomeneeds.shop/blog/${post.slug}`,
    },
    keywords: post.keywords?.join(', ') || post.tags?.join(', '),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FaqJsonLd({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
