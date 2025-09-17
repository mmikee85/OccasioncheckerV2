/**
 * Vercel Serverless Function to act as a proxy and AI analysis handler.
 * This is the "AI Does Everything" version. It relies on the AI to find the license plate and generate history.
 */
module.exports = async (request, response) => {
    // Set CORS headers for all responses
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json');

    try {
        const adUrl = request.query.url;

        if (!adUrl) {
            return response.status(400).json({ error: 'Advertentielink is een verplichte parameter.' });
        }

        const adPageResponse = await fetch(adUrl, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const adHtml = adPageResponse.ok ? await adPageResponse.text() : null;

        if (!adHtml) {
            throw new Error("Kon de HTML van de advertentiepagina niet ophalen.");
        }

        const prompt = createProfessionalPrompt(adUrl, adHtml);
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: getResponseSchema()
            }
        };

        const geminiApiKey = process.env.GEMINI_API_KEY;
