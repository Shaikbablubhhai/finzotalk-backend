require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  CACHE_DURATION: 15000,

  TWELVE_KEYS: [
    process.env.TWELVE_KEY_1,
    process.env.TWELVE_KEY_2,
    process.env.TWELVE_KEY_3
  ],

  ALPHA_KEYS: [
    process.env.ALPHA_KEY_1,
    process.env.ALPHA_KEY_2,
    process.env.ALPHA_KEY_3
  ]
};