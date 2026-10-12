
// const express = require("express");
// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config();

// const app = express();
// app.use(express.json());

// app.get("/api/health", (req, res) => {
//   res.json({ status: "InsightFlow backend is running" });
// });

// const PORT = 3001;

// app.listen(PORT, () => {
//   console.log(`InsightFlow backend running at http://localhost:${PORT}`);
// });

// const express = require("express");
// require("dotenv").config();

const express = require("express");
const path = require("path");
require("dotenv").config();
const app = express();
const PORT = 3001;
const API_BASE = "https://api.prod.adaptionlabs.ai/api/v1";

app.get("/api/health", (req, res) => {
  res.json({ status: "InsightFlow backend is running" });
});

app.get("/api/adaption/datasets", async (req, res) => {
  const apiKey = process.env.ADAPTION_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "ADAPTION_API_KEY is missing from .env"
    });
  }

  try {
    const response = await fetch(`${API_BASE}/datasets?q=customer_review_analysis`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Adaption API request failed",
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Could not connect to Adaption"
    });
  }
});

// app.listen(PORT, () => {
//   console.log(`InsightFlow backend running at http://localhost:${PORT}`);
// });
app.get("/api/adaption/download", async (req, res) => {
  const apiKey = process.env.ADAPTION_API_KEY;

  const datasetId =
    "cb7e7628-5e44-44d2-96cd-b883fcc95cbd";

  if (!apiKey) {
    return res.status(500).json({
      error: "API key missing from .env"
    });
  }

  try {
    const url =
      `${API_BASE}/datasets/${datasetId}/download?fileFormat=csv`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const details = await response.text();

      return res.status(response.status).json({
        error: "CSV download failed",
        details
      });
    }

    const csv = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="customer_review_analysis.csv"'
    );

    res.send(csv);
  } catch (error) {
    res.status(500).json({
      error: "Could not download the dataset"
    });
  }
});
const fs = require("fs");
//const path = require("path");

app.get("/api/adaption/local-data", (req, res) => {
  const csvPath = path.join(
    __dirname,
    "data",
    "customer_review_analysis.csv"
  );

  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({
      error: "CSV file not found in the data folder"
    });
  }

  res.download(csvPath, "customer_review_analysis.csv");
});
app.listen(PORT, () => {
  console.log(`InsightFlow backend running at http://localhost:${PORT}`);
});




