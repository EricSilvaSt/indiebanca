ALTER TABLE indiebanca.songs ADD COLUMN IF NOT EXISTS audio_url text;

WITH numbered AS (
  SELECT id, (row_number() OVER (ORDER BY created_at, id) - 1) % 12 AS n
  FROM indiebanca.songs
)
UPDATE indiebanca.songs s
SET audio_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-' || (numbered.n + 1) || '.mp3'
FROM numbered
WHERE numbered.id = s.id AND s.audio_url IS NULL;