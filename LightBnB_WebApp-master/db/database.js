const { Pool } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

pool.connect();

const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * FROM users where email = $1;`, [email])
    .then((result) => {
      if (!result.rows[0]) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`SELECT * FROM users where id = $1;`, [id])
    .then((result) => {
      if (!result.rows[0]) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3)`, [
      user.name,
      user.email,
      user.password,
    ])
    .then((result) => {
      return console.log(result);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `SELECT reservations.id as id, properties.*, reservations.start_date as start_date, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN reservations ON properties.id = reservations.property_id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.*, properties.id
    ORDER BY start_date
    LIMIT $2;`,
      [guest_id, limit]
    )
    .then((result) => {
      // if (!result.rows[0]) {
      //   return null;
      // }
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
 SELECT properties.*, avg(property_reviews.rating) as average_rating
 FROM properties
 JOIN property_reviews ON properties.id = property_id
 `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    queryString += `WHERE owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    const cost_per_night_cents = options.minimum_price_per_night * 100;
    console.log(cost_per_night_cents);
    if (options.city) {
      queryParams.push(Number(cost_per_night_cents));
      queryString += `AND cost_per_night >= $${queryParams.length} `;
    } else {
      queryParams.push(Number(cost_per_night_cents));
      queryString += `WHERE cost_per_night >= $${queryParams.length} `;
    }
  }

  if (options.maximum_price_per_night) {
    const cost_per_night_cents = options.maximum_price_per_night * 100;
    if (options.city || options.minimum_price_per_night) {
      queryParams.push(Number(cost_per_night_cents));
      queryString += `AND cost_per_night <= $${queryParams.length} `;
    } else {
      queryParams.push(Number(cost_per_night_cents));
      queryString += `WHERE cost_per_night <= $${queryParams.length} `;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += `GROUP BY properties.id
                    HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
    queryParams.push(limit);
    queryString += `LIMIT $${queryParams.length};`;
  } else {
    queryParams.push(limit);
    queryString += `
   GROUP BY properties.id
   ORDER BY cost_per_night
   LIMIT $${queryParams.length};
   `;
  }

  // 6
  return pool
    .query(queryString, queryParams)
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const cost_per_night_cents = property.cost_per_night * 100;
  return pool
    .query(
      `INSERT INTO properties (owner_id, title, description, 
    thumbnail_photo_url, cover_photo_url, cost_per_night, 
    parking_spaces, number_of_bathrooms, number_of_bedrooms, 
    country, street, city, province, post_code, active) 
    VALUES ($1, $2, $3, 
            $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true) 
    RETURNING *;`,
      [
        property.owner_id,
        property.title,
        property.description,
        property.thumbnail_photo_url,
        property.cover_photo_url,
        cost_per_night_cents,
        property.parking_spaces,
        property.number_of_bathrooms,
        property.number_of_bedrooms,
        property.country,
        property.street,
        property.city,
        property.province,
        property.post_code,
      ]
    )
    .then((result) => {
      return console.log(result.rows);
    })
    .catch((err) => {
      console.log(err.message);
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
