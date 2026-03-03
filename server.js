const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

/* ===============================
   🔐 API KEYS (REPLACE HERE)
================================= */

const alphaKeys = [
  "07LKK2GARM56G8L3",
  "WXM9125OEBO4HMLS",
  "D85C96R6KVB9DA8J"
];

const twelveKeys = [
  "29a5b2dccd5947dea4fdb058286b60d7",
  "ca1c62b293ca4b10a64db4edf66bf1ad",
  "bc1729013a6c4658ab5022ec64a62737"
];

/* ===============================
   🧠 In-Memory Cache
================================= */

let cache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds

/* ===============================
   🔁 Fetch From Alpha Vantage
================================= */

async function fetchFromAlpha(symbol) {
  for (let key of alphaKeys) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`;
      const response = await axios.get(url);
      const price = response.data["Global Quote"]["05. price"];

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
      const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${key}`;
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

  // Serve from cache
  if (cache[symbol] && now - lastFetchTime < CACHE_DURATION) {
    return res.json({
      fromCache: true,
      ...cache[symbol]
    });
  }

  try {
    console.log("Fetching fresh stock data...");

    let data;

    try {
      data = await fetchFromAlpha(symbol);
    } catch {
      data = await fetchFromTwelve(symbol);
    }

    cache[symbol] = data;
    lastFetchTime = now;

    res.json({
      fromCache: false,
      ...data
    });

  } catch (error) {
    res.status(500).json({ error: "All providers failed" });
  }
});

/* ===============================
   🚀 Start Server
================================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});