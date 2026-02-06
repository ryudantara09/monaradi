import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

/**
 * Extract JSON from various response formats that the model might return.
 * Handles markdown code blocks, reasoning text, and plain JSON.
 */
function extractJSON(content: string): string {
    // Log the raw content for debugging
    console.log('\n========== RAW MODEL RESPONSE ==========');
    console.log(content);
    console.log('========================================\n');

    // Try to find JSON in various formats
    let jsonStr = content.trim();

    // 1. Check for markdown JSON code block: ```json ... ```
    const jsonCodeBlockMatch = content.match(/```json\s*([\s\S]*?)```/i);
    if (jsonCodeBlockMatch) {
        console.log('[JSON Extraction] Found JSON code block');
        return jsonCodeBlockMatch[1]!.trim();
    }

    // 2. Check for generic code block: ``` ... ```
    const genericCodeBlockMatch = content.match(/```\s*([\s\S]*?)```/);
    if (genericCodeBlockMatch) {
        const potentialJson = genericCodeBlockMatch[1]!.trim();
        // Check if it looks like JSON
        if (potentialJson.startsWith('{') || potentialJson.startsWith('[')) {
            console.log('[JSON Extraction] Found generic code block with JSON');
            return potentialJson;
        }
    }

    // 3. Look for JSON object pattern anywhere in the response
    // This handles cases where model outputs reasoning text before/after JSON
    const jsonObjectMatch = content.match(/\{[\s\S]*"polygons"[\s\S]*\}/);
    if (jsonObjectMatch) {
        console.log('[JSON Extraction] Found JSON object pattern in text');
        return jsonObjectMatch[0];
    }

    // 4. Try to find any JSON-like structure { ... }
    const anyJsonMatch = content.match(/\{[\s\S]*\}/);
    if (anyJsonMatch) {
        console.log('[JSON Extraction] Found generic JSON structure');
        return anyJsonMatch[0];
    }

    // 5. Return original content as fallback
    console.log('[JSON Extraction] No JSON pattern found, returning raw content');
    return jsonStr;
}

// POST /api/detect - AI boundary detection via Google Gemini
router.post('/', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        const apiKey = process.env.GOOGLE_AI_API;

        if (!apiKey) {
            return res.status(400).json({
                error: 'Google AI API key not configured',
                message: 'Please set GOOGLE_AI_API in your .env file',
            });
        }

        if (!imageBase64) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        console.log('\n========== GOOGLE GEMINI API REQUEST ==========');
        console.log('[Gemini] Sending request to gemini-2.0-flash');
        console.log('[Gemini] Image data length:', imageBase64.length);

        // Extract the base64 data and mime type from the data URL
        let mimeType = 'image/jpeg';
        let base64Data = imageBase64;

        if (imageBase64.startsWith('data:')) {
            const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1]!;
                base64Data = matches[2]!;
            }
        }

        // Initialize the Google GenAI client
        const ai = new GoogleGenAI({ apiKey });

        // Improved prompt with step-by-step analysis and example
        const prompt = `You are a computer vision expert specializing in geometric shape detection and cadastral mapping.

## TASK
Analyze this image and extract the coordinates of ALL distinct land parcels/lots. The image may be:
- A cadastral/survey map with boundary lines
- A satellite image with visible property boundaries  
- A hand-drawn map of land divisions

## ANALYSIS STEPS
1. First, identify the overall bounding region of the parcels in the image
2. Count how many distinct enclosed regions (parcels) exist
3. For each parcel, identify all corner/vertex points
4. Trace each parcel boundary clockwise, starting from the top-left corner of that parcel
5. Convert each vertex to normalized coordinates where (0,0)=top-left and (1,1)=bottom-right

## COORDINATE SYSTEM
- X increases from left (0.0) to right (1.0)
- Y increases from top (0.0) to bottom (1.0)
- Be precise - estimate coordinates to 2 decimal places
- Vertices on the image edges should be close to 0.0 or 1.0
- Central vertices should be around 0.4-0.6

## EXAMPLE
For an image with 2 triangular parcels side by side:
{"polygons": [[[0.1, 0.2], [0.3, 0.2], [0.2, 0.6]], [[0.3, 0.2], [0.5, 0.2], [0.4, 0.6]]], "confidence": 0.9}

## OUTPUT FORMAT
Return ONLY valid JSON, no markdown, no explanation:
{"polygons": [[[x,y], [x,y], ...], ...], "confidence": <0.0-1.0>}

## IMPORTANT
- Each polygon MUST be a closed shape (at least 3 vertices)
- Include ALL parcels visible in the image
- Shared edges between adjacent parcels should have matching coordinates
- If parcels share a vertex, that vertex should have the same coordinates in both polygons`;

        // Create the content with image and text
        const contents = [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                },
            },
            { text: prompt }
        ];

        // Call the Gemini API using the SDK with better settings
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // More capable model for vision tasks
            contents: contents,
            config: {
                temperature: 0.1, // Low temperature for consistent, precise output
                maxOutputTokens: 8192, // Allow longer output for complex images
            }
        });

        console.log('[Gemini] Response received');

        // Get the text content from the response
        const content = response.text;

        if (!content) {
            console.error('[Gemini] No content in response');
            console.error('[Gemini] Full response:', JSON.stringify(response, null, 2));
            return res.status(500).json({ error: 'No response from AI model' });
        }

        console.log('\n========== GOOGLE GEMINI API RESPONSE ==========');
        console.log('[Gemini] Response text:', content);

        // Parse the JSON response
        try {
            const jsonStr = extractJSON(content);
            console.log('\n[JSON Parsing] Attempting to parse:', jsonStr.substring(0, 200) + '...');

            const result = JSON.parse(jsonStr);

            console.log('[JSON Parsing] Successfully parsed!');
            console.log('[JSON Parsing] Found', result.polygons?.length || 0, 'polygons');
            console.log('[JSON Parsing] Confidence:', result.confidence);

            // Validate the response structure
            if (!result.polygons || !Array.isArray(result.polygons)) {
                console.warn('[JSON Parsing] Warning: Missing or invalid polygons array, returning empty');
                return res.json({ polygons: [], confidence: 0 });
            }

            // Validate and filter polygons
            const validPolygons = result.polygons.filter((polygon: any) => {
                if (!Array.isArray(polygon) || polygon.length < 3) {
                    console.warn('[JSON Parsing] Skipping invalid polygon (less than 3 points)');
                    return false;
                }
                // Check that all points are valid [x, y] pairs with values between 0 and 1
                for (const point of polygon) {
                    if (!Array.isArray(point) || point.length < 2) {
                        console.warn('[JSON Parsing] Skipping polygon with invalid point format');
                        return false;
                    }
                    const [x, y] = point;
                    if (typeof x !== 'number' || typeof y !== 'number' ||
                        x < 0 || x > 1 || y < 0 || y > 1) {
                        console.warn('[JSON Parsing] Skipping polygon with out-of-range coordinates:', x, y);
                        return false;
                    }
                }
                return true;
            });

            console.log('[JSON Parsing] Valid polygons after filtering:', validPolygons.length);

            res.json({
                polygons: validPolygons,
                confidence: result.confidence || 0
            });
        } catch (parseError) {
            console.error('\n========== JSON PARSE ERROR ==========');
            console.error('[JSON Parsing] Failed to parse AI response');
            console.error('[JSON Parsing] Error:', parseError);
            console.error('[JSON Parsing] Content was:', content);
            console.error('=======================================\n');

            res.status(500).json({
                error: 'Failed to parse AI response',
                rawResponse: content,
            });
        }
    } catch (error) {
        console.error('[Gemini] Error in boundary detection:', error);
        res.status(500).json({ error: 'Boundary detection failed' });
    }
});

export default router;
