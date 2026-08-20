import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScrapMaterialType } from '@/types';

export interface ScrapPredictionResult {
  material: ScrapMaterialType;
  confidence: number;
  weightRange: string;
  estimatedValueRange: string;
  isMock: boolean;
}

// Approximate scrap rates per kg in INR (India context)
const ESTIMATED_RATES: Record<ScrapMaterialType, number> = {
  steel: 18,
  stainless_steel: 45,
  copper: 620,
  brass: 410,
  aluminium: 130,
  plastic: 12,
  mixed_metal: 35,
  other: 15,
};

/**
 * Predicts scrap material type, weight, and valuation range from an image.
 * Uses Gemini 1.5 Flash if API key is set; otherwise falls back to a smart local estimator.
 */
export async function predictScrapMaterial(
  imageBase64: string, // Base64 representation of the image
  mimeType: string,
  userSelectedMaterial?: string,
  userEstimatedWeight?: number,
  userCondition?: string
): Promise<ScrapPredictionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      console.log('Calling live Gemini API for scrap prediction...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Build context for AI about pricing and parameters
      const prompt = `
        You are ESHwar Home Needs AI Scrap Assistant. Analyze this image of scrap material.
        
        Inputs from the user (use as hints but trust what you see in the image):
        - User stated material: ${userSelectedMaterial || 'Unknown'}
        - User estimated weight: ${userEstimatedWeight ? `${userEstimatedWeight} kg` : 'Unknown'}
        - User stated condition: ${userCondition || 'Unknown'}
        
        Reference scrap rates (per kg) for value estimation:
        - Steel: ₹${ESTIMATED_RATES.steel}
        - Stainless Steel: ₹${ESTIMATED_RATES.stainless_steel}
        - Copper: ₹${ESTIMATED_RATES.copper}
        - Brass: ₹${ESTIMATED_RATES.brass}
        - Aluminium: ₹${ESTIMATED_RATES.aluminium}
        - Plastic: ₹${ESTIMATED_RATES.plastic}
        - Mixed Metal: ₹${ESTIMATED_RATES.mixed_metal}
        - Other: ₹${ESTIMATED_RATES.other}

        Task:
        1. Classify the material shown in the image. It MUST be one of the following exact keys: "steel", "stainless_steel", "copper", "brass", "aluminium", "mixed_metal", "plastic", "other".
        2. Assign a confidence score between 0.0 and 1.0.
        3. Estimate a realistic weight range based on the objects visual size and count (e.g., "3-4 kg"). If the user provided a reasonable weight, use that as the mid-point.
        4. Calculate the estimated value range (INR) by multiplying estimated weight range with the reference rate. Format as "₹Min - ₹Max" (e.g., "₹1800 - ₹2400").

        Format your final response ONLY as a JSON object, with no markdown wrappers or additional text, matching this structure:
        {
          "material": "copper",
          "confidence": 0.92,
          "weightRange": "3.5 - 4.5 kg",
          "estimatedValueRange": "₹2170 - ₹2790"
        }
      `;

      // Format image data for Gemini API
      const imagePart = {
        inlineData: {
          data: imageBase64.split(',')[1] || imageBase64, // strip data:image/jpeg;base64, if present
          mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      console.log('Gemini raw response:', responseText);

      // Clean JSON formatting if Gemini included backticks
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);

      return {
        material: parsed.material as ScrapMaterialType,
        confidence: parsed.confidence,
        weightRange: parsed.weightRange,
        estimatedValueRange: parsed.estimatedValueRange,
        isMock: false,
      };
    } catch (error) {
      console.error('Gemini API call failed, falling back to local simulation:', error);
    }
  }

  // Local Simulation Fallback
  console.log('Running local scrap prediction fallback...');
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Determine material type
  const material = (userSelectedMaterial || 'stainless_steel') as ScrapMaterialType;
  
  // Set mock confidence
  const confidence = userSelectedMaterial ? 0.94 : 0.82;

  // Determine weight range
  const baseWeight = userEstimatedWeight || 5;
  const minWeight = Math.max(0.1, baseWeight * 0.8);
  const maxWeight = baseWeight * 1.2;
  const weightRange = `${minWeight.toFixed(1)} - ${maxWeight.toFixed(1)} kg`;

  // Calculate value range based on static rates
  const rate = ESTIMATED_RATES[material] || 15;
  const minValue = Math.round(minWeight * rate);
  const maxValue = Math.round(maxWeight * rate);
  const estimatedValueRange = `₹${minValue} - ₹${maxValue}`;

  return {
    material,
    confidence,
    weightRange,
    estimatedValueRange,
    isMock: true,
  };
}
