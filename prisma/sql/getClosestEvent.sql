WITH bounding_box AS (
  SELECT
    CAST($1 AS double precision) AS lat,
    CAST($2 AS double precision) AS lon,
    1 / 111.32 AS lat_diff, -- Aproximadamente 1 km em latitude
    CASE 
      WHEN abs(CAST($1 AS double precision)) < 89 THEN 1 / (111.32 * cos(radians(CAST($1 AS double precision))))
      ELSE NULL
    END AS lon_diff -- Ajuste para evitar problemas próximos aos polos
)
SELECT *
FROM (
  SELECT e.*, 
    (6371 * acos(
      cos(radians(bb.lat)) * cos(radians(e.latitude)) * cos(radians(e.longitude) - radians(bb.lon)) + 
      sin(radians(bb.lat)) * sin(radians(e.latitude))
    )) AS distance
  FROM events e
  CROSS JOIN bounding_box bb
  WHERE 
    e.status = 'OPEN' AND
    e.latitude BETWEEN (bb.lat - bb.lat_diff) AND (bb.lat + bb.lat_diff) AND
    (bb.lon_diff IS NULL OR e.longitude BETWEEN (bb.lon - bb.lon_diff) AND (bb.lon + bb.lon_diff))
) AS subquery
ORDER BY distance
LIMIT 1;
