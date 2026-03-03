const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   🔐 Load API Keys From Render
================================= */

const alphaKeys = process.env.ALPHA_KEYS
  ? process.env.ALPHA_KEYS.split(",")
  : [];

const twelveKeys = process.env.TWELVE_KEYS
  ? process.env.TWELVE_KEYS.split(",")
  : [];

console.log("Alpha keys:", alphaKeys.length);
console.log("Twelve keys:", twelveKeys.length);

/* ===============================
   🧠 Cache
================================= */

let cache = {};
let lastFetchTime = {};
const CACHE_DURATION = 30 * 1000;

/* ===============================
   🔁 Fetch From Alpha
================================= */

async function fetchFromAlpha(symbol) {
  for (let key of alphaKeys) {
    try {
      const url = https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key};
      const response = await axios.get(url);

      const price =
        response.data["Global Quote"] &&
        response.data["Global Quote"]["05. price"];

      if (price) {
        return { source: "Alpha", price };
      }
    } catch (err) {}
  }
  throw new Error("Alpha failed");
}

/* ===============================
   🔁 Fetch From Twelve
================================= */

async function fetchFromTwelve(symbol) {
  for (let key of twelveKeys) {
    try {
      const url = https://api.twelvedata.com/price?symbol=${symbol}&apikey=${key};
      const response = await axios.get(url);

      if (response.data.price) {
        return { source: "TwelveData", price: response.data.price };
      }
    } catch (err) {}
  }
  throw new Error("Twelve failed");
}

/* ===============================
   📊 Route
================================= */

app.get("/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const now = Date.now();

  if (
    cache[symbol] &&
    lastFetchTime[symbol] &&
    now - lastFetchTime[symbol] < CACHE_DURATION
  ) {
    return res.json({
      fromCache: true,
      ...cache[symbol],
    });
  }

  try {
    let data;

    try {
      data = await fetchFromAlpha(symbol);
    } catch {
      data = await fetchFromTwelve(symbol);
    }

    cache[symbol] = data;
    lastFetchTime[symbol] = now;

    res.json({
      fromCache: false,
      ...data,
    });
  } catch {
    res.status(500).json({ error: "All providers failed" });
  }
});

/* ===============================
   🚀 Start Server
================================= */

app.listen(PORT, () => {
  console.log(Server running on port ${PORT});
});