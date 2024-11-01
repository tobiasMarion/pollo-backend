WITH bounding_box AS (
  SELECT
    CAST($1 AS double precision) AS lat,
    CAST($2 AS double precision) AS lon,
    1 / 111.32 AS lat_diff, -- Aproximadamente 1 km em latitude
    1 / (111.32 * cos(radians(CAST($1 AS double precision)))) AS lon_diff -- Aproximadamente 1 km em longitude ajustado pela latitude
)
SELECT *
FROM (
  SELECT *,
    (6371 * acos(
      cos(radians(CAST($1 AS double precision))) * cos(radians(latitude)) * cos(radians(longitude) - 
      radians(CAST($2 AS double precision))) + sin(radians(CAST($1 AS double precision))) * sin(radians(latitude))
    )) AS distance
  FROM events, bounding_box
  WHERE
    (status = 'OPEN' OR status = 'CLOSED') AND
    latitude BETWEEN (lat - lat_diff) AND (lat + lat_diff)
    AND longitude BETWEEN (lon - lon_diff) AND (lon + lon_diff)
) AS subquery
ORDER BY distance
LIMIT 1;
