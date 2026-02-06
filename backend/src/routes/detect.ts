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
        console.log('[Gemini] Sending request to gemini-2.5-flash');
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

        const prompt = `You are a cadastral mapping expert. Your goal is to extract the topology of the land parcels in this image.

## TOPOLOGY STRATEGY
Instead of tracing separate polygons, you must:
1. Identify all unique **Vertices** (corners/intersections) in the entire image.
2. Define each **Parcel** as a sequence of vertex indices.

## REQUIREMENTS
- **Vertices**: A list of [x, y] coordinates for every corner. (0,0 is top-left, 1,1 is bottom-right).
- **Parcels**: A list of lists, where each inner list contains the INDICES of the vertices that form the parcel (0-indexed).
- **Precision**: Use the visible grid dots to align your vertices.
- **Completeness**: Every lot must be defined.

## EXAMPLE
Vertices: [[0.1, 0.1], [0.5, 0.1], [0.5, 0.5], [0.1, 0.5]]
Parcels:
- [[0, 1, 2, 3]] (Left Box)
- ...

## OUTPUT FORMAT
Return valid JSON only:
{
  "vertices": [[x,y], [x,y], ...],
  "parcels": [[idx1, idx2, idx3, ...], [idx1, ...], ...],
  "confidence": 0.95
}`;

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

        // Call the Gemini API using the SDK
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // More capable model for vision tasks
            contents: contents,
            config: {
                // temperature: 0.1, // Low temperature for precise indices
                maxOutputTokens: 8192,
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
            console.log('\n[JSON Parsing] Attempting to parse:', jsonStr.substring(0, Math.min(jsonStr.length, 200)) + (jsonStr.length > 200 ? '...' : ''));
            const result = JSON.parse(jsonStr);

            let polygons: number[][][] = [];

            // Handle the new "Topology" format (vertices + indices)
            if (result.vertices && result.parcels) {
                console.log('[JSON Parsing] Detected Topology format');
                const vertices = result.vertices as [number, number][];
                const parcelIndices = result.parcels as number[][];

                polygons = parcelIndices.map(indices => {
                    return indices.map(idx => {
                        const v = vertices[idx];
                        if (!v) throw new Error(`Invalid vertex index: ${idx}`);
                        return v;
                    });
                });
            }
            // Fallback to legacy "Polygons" format
            else if (result.polygons) {
                console.log('[JSON Parsing] Detected Legacy Polygon format');
                polygons = result.polygons;
            }

            console.log('[JSON Parsing] Successfully reconstructed', polygons.length, 'polygons');

            // Validate and filter polygons
            const validPolygons = polygons.filter((polygon: any) => {
                if (!Array.isArray(polygon) || polygon.length < 3) {
                    console.warn('[JSON Parsing] Skipping invalid polygon (less than 3 points)');
                    return false;
                }
                // Check coordinates
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
