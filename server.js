const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   🔐 API KEYS FROM RENDER ENV
================================= */

const alphaKeys = process.env.ALPHA_KEYS
  ? process.env.ALPHA_KEYS.split(",")
  : [];

const twelveKeys = process.env.TWELVE_KEYS
  ? process.env.TWELVE_KEYS.split(",")
  : [];

/* ===============================
   🧠 In-Memory Cache
================================= */

let cache = {};
let lastFetchTime = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds

/* ===============================
   🔁 Fetch From Alpha Vantage
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
    } catch (err) {
      continue;
    }
  }
  throw new Error("Alpha failed");
}

/* ===============================
   🔁 Fetch From Twelve Data
================================= */

async function fetchFromTwelve(symbol) {
  for (let key of twelveKeys) {
    try {
      const url = https://api.twelvedata.com/price?symbol=${symbol}&apikey=${key};
      const response = await axios.get(url);

      if (response.data.price) {
        return { source: "TwelveData", price: response.data.price };
      }
    } catch (err) {
      continue;
    }
  }
  throw new Error("Twelve failed");
}

/* ===============================
   📊 Main Route
================================= */

app.get("/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const now = Date.now();

  // Serve from cache per symbol
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
    console.log("Fetching fresh stock data for:", symbol);

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
  } catch (error) {
    res.status(500).json({ error: "All providers failed" });
  }
});

/* ===============================
   🚀 Start Server
================================= */

app.listen(PORT, () => {
  console.log(Server running on port ${PORT});
});