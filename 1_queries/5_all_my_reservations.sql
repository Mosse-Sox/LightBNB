SELECT reservations.id as id, properties.title as title, reservations.start_date as start_date, properties.cost_per_night as cost_per_night, avg(property_reviews.rating) as average_rating
FROM properties
JOIN reservations ON properties.id = reservations.property_id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 4
GROUP BY reservations.id, title, start_date, cost_per_night
ORDER BY start_date
LIMIT 10;
