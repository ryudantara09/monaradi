import { Router } from 'express';

const router = Router();

// POST /api/detect - AI boundary detection via OpenRouter
router.post('/', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey || apiKey === 'your-api-key-here') {
            return res.status(400).json({
                error: 'OpenRouter API key not configured',
                message: 'Please set OPENROUTER_API_KEY in your .env file',
            });
        }

        if (!imageBase64) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // Call OpenRouter Vision API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Land Parcel Manager',
            },
            body: JSON.stringify({
                model: 'nvidia/nemotron-nano-12b-v2-vl:free',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this land survey or satellite image. Identify all closed geometric shapes that represent land parcels or lots.

For each detected parcel, return the polygon coordinates as normalized values between 0.0 and 1.0 (where 0,0 is top-left and 1,1 is bottom-right).

Return ONLY a valid JSON object in this exact format, with no additional text:
{
  "polygons": [
    [[x1, y1], [x2, y2], [x3, y3], ...],
    [[x1, y1], [x2, y2], [x3, y3], ...]
  ],
  "confidence": 0.85
}

Rules:
- Each polygon must have at least 3 points
- Points should be in clockwise or counter-clockwise order
- All coordinates must be between 0.0 and 1.0
- Ignore text labels, just detect the boundary shapes
- If no parcels are detected, return {"polygons": [], "confidence": 0}`,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageBase64.startsWith('data:')
                                        ? imageBase64
                                        : `data:image/jpeg;base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API error:', errorData);
            return res.status(response.status).json({
                error: 'AI detection failed',
                details: errorData,
            });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: 'No response from AI model' });
        }

        // Parse the JSON response
        try {
            // Extract JSON from potential markdown code blocks
            let jsonStr = content;
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }

            const result = JSON.parse(jsonStr.trim());
            res.json(result);
        } catch (parseError) {
            console.error('Failed to parse AI response:', content);
            res.status(500).json({
                error: 'Failed to parse AI response',
                rawResponse: content,
            });
        }
    } catch (error) {
        console.error('Error in boundary detection:', error);
        res.status(500).json({ error: 'Boundary detection failed' });
    }
});

export default router;
