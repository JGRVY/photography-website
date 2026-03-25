// api/photos.js — Vercel serverless function
// Proxies requests to Cloudinary so credentials stay server-side

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const API_KEY    = process.env.CLOUDINARY_API_KEY;
    const API_SECRET = process.env.CLOUDINARY_API_SECRET;

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
        return res.status(500).json({
            error: 'Missing environment variables',
            debug: { hasCloudName: !!CLOUD_NAME, hasApiKey: !!API_KEY, hasApiSecret: !!API_SECRET }
        });
    }

    const { folder } = req.query;
    if (!folder) {
        return res.status(400).json({ error: 'Missing folder parameter' });
    }

    try {
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/by_asset_folder`
                  + `?asset_folder=${encodeURIComponent(folder)}&max_results=500`;

        const response = await fetch(url, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')
            }
        });

        const text = await response.text();
        let data = {};
        try { data = JSON.parse(text); } catch(e) {}

        const publicIds = (data.resources || [])
            .sort((a, b) => a.public_id.localeCompare(b.public_id))
            .map(r => r.public_id);

        return res.status(200).json({
            photos: publicIds,
            debug: {
                status: response.status,
                url,
                folder,
                resourceCount: publicIds.length,
                rawResponse: text.substring(0, 1000)
            }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
