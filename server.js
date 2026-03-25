const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── 곡 검색 API (Genius) ──
app.post('/api/search-song', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 3) {
    return res.json({ found: false });
  }

  const token = process.env.GENIUS_TOKEN;
  if (!token) {
    return res.json({ found: false, error: 'GENIUS_TOKEN not configured' });
  }

  try {
    // 인식된 가사 텍스트에서 핵심 구절 추출 (가장 긴 문장 우선)
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
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`차란 노래자랑 서버 실행 중: http://localhost:${PORT}`);
});
