export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text || text.trim().length < 3) {
    return res.json({ found: false });
  }

  const token = process.env.GENIUS_TOKEN;
  if (!token) {
    return res.json({ found: false, error: 'GENIUS_TOKEN not configured' });
  }

  try {
    const phrases = text.split(/[.!?,\s]+/).filter(w => w.length >= 2);
    const query = phrases.slice(0, 8).join(' ').substring(0, 80);
    const url = `https://api.genius.com/search?q=${encodeURIComponent(query)}&per_page=5`;

    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();

    if (data.response && data.response.hits && data.response.hits.length > 0) {
      const hit = data.response.hits[0].result;
      return res.json({
        found: true,
        name: hit.title || '',
        artist: hit.primary_artist ? hit.primary_artist.name : '',
        thumbnail: hit.song_art_image_thumbnail_url || '',
      });
    }
    return res.json({ found: false });
  } catch (err) {
    console.error('Genius API error:', err.message);
    return res.json({ found: false });
  }
}
