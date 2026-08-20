import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StructuredFilters {
  searchTerm?: string;
  material?: string;
  categoryName?: string;
  maxPrice?: number;
  capacity?: number; // Liters
  inductionCompatible?: boolean;
  lidIncluded?: boolean;
}

/**
 * Translates a natural language search query into structured filters.
 * Uses Gemini 1.5 Flash if API key is present; otherwise runs a local regex-based NLP parser.
 */
export async function parseNaturalLanguageSearch(query: string): Promise<StructuredFilters> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      console.log(`Calling Gemini API to parse query: "${query}"`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        You are an e-commerce database query translation assistant.
        Translate this user search query into a structured JSON filter object: "${query}"

        Allowed JSON fields (omit fields not specified in the query):
        - "searchTerm" (string: search term like "kadai", "bottle", "spoon")
        - "material" (string: exact material matching: "steel" | "stainless_steel" | "triply" | "copper" | "brass" | "plastic" | "wooden")
        - "categoryName" (string: e.g. "Steel Vessels" | "Triply Cookware" | "Brass" | "Copper" | "Plastic" | "Wooden")
        - "maxPrice" (number: maximum price under or equal to, in INR)
        - "capacity" (number: capacity in Liters if mentioned, e.g. "3 litre" -> 3)
        - "inductionCompatible" (boolean: true if user asks for induction compatible, or induction base/bottom)
        - "lidIncluded" (boolean: true if user asks for lid, cover, or glass lid)

        Format the response ONLY as a valid JSON object. No markdown wrappers or explanation.
        Example response for: "induction copper bottles under 1200"
        {
          "searchTerm": "bottle",
          "material": "copper",
          "maxPrice": 1200,
          "inductionCompatible": true
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      console.log('Gemini AI Search response:', responseText);

      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJsonStr) as StructuredFilters;
    } catch (error) {
      console.error('Gemini AI Search failed, falling back to local regex NLP:', error);
    }
  }

  // Local Regex NLP Fallback
  console.log(`Running local regex NLP parser for: "${query}"`);
  const lowerQuery = query.toLowerCase();
  const filters: StructuredFilters = {};

  // Parse Material
  if (lowerQuery.includes('copper')) filters.material = 'copper';
  else if (lowerQuery.includes('brass')) filters.material = 'brass';
  else if (lowerQuery.includes('stainless steel') || lowerQuery.includes('ss')) filters.material = 'stainless_steel';
  else if (lowerQuery.includes('steel')) filters.material = 'steel';
  else if (lowerQuery.includes('triply') || lowerQuery.includes('tri-ply')) filters.material = 'triply';
  else if (lowerQuery.includes('plastic')) filters.material = 'plastic';
  else if (lowerQuery.includes('wood')) filters.material = 'wooden';

  // Parse Category Name
  if (lowerQuery.includes('vessel') || lowerQuery.includes('container') || lowerQuery.includes('dabba')) {
    filters.categoryName = 'Steel Vessels';
  } else if (lowerQuery.includes('kadai') || lowerQuery.includes('pan') || lowerQuery.includes('cookware')) {
    if (filters.material === 'triply') {
      filters.categoryName = 'Triply Cookware';
    }
  }

  // Parse Max Price (e.g. "under 1000", "below 500", "under rs.1500")
  const underRegex = /(?:under|below|less than|rs\.?|₹)\s*(\d+)/i;
  const priceMatch = lowerQuery.match(underRegex);
  if (priceMatch && priceMatch[1]) {
    filters.maxPrice = parseInt(priceMatch[1], 10);
  } else {
    // Try general numbers near price words
    const numRegex = /\b(\d{3,5})\b/;
    const numMatch = lowerQuery.match(numRegex);
    if (numMatch && numMatch[1]) {
      filters.maxPrice = parseInt(numMatch[1], 10);
    }
  }

  // Parse Capacity (e.g. "3 litre", "5 L", "1.5 ltr", "3l")
  const capacityRegex = /(\d+(?:\.\d+)?)\s*(?:litre|liter|ltr|l)\b/i;
  const capacityMatch = lowerQuery.match(capacityRegex);
  if (capacityMatch && capacityMatch[1]) {
    filters.capacity = parseFloat(capacityMatch[1]);
  }

  // Parse Induction compatibility
  if (lowerQuery.includes('induction') || lowerQuery.includes('induction base') || lowerQuery.includes('induction bottom')) {
    filters.inductionCompatible = true;
  }

  // Parse Lid compatibility
  if (lowerQuery.includes('lid') || lowerQuery.includes('cover') || lowerQuery.includes('glass lid')) {
    filters.lidIncluded = true;
  }

  // Parse Search term (anything remaining that looks like a noun)
  const nouns = ['kadai', 'bottle', 'glass', 'pan', 'jug', 'vessel', 'spoon', 'container', 'plate', 'box', 'bucket', 'urli', 'tawa', 'cooker'];
  for (const noun of nouns) {
    if (lowerQuery.includes(noun)) {
      filters.searchTerm = noun;
      break;
    }
  }

  if (!filters.searchTerm && !filters.material && !filters.categoryName && !filters.maxPrice) {
    // If nothing parsed, use query as search term
    filters.searchTerm = query;
  }

  return filters;
}
