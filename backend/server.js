const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const calculateRisk = require("./services/riskEngine");
const calculateSuitability = require("./services/suitabilityEngines");

const app = express();
const PORT = process.env.PORT || 5001;
const dataDirectory = path.join(__dirname, "../data");
const allowedOrigins = new Set(
  ["http://localhost:5173", "http://127.0.0.1:5173", process.env.FRONTEND_URL].filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      const localDevelopmentOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
      if (!origin || allowedOrigins.has(origin) || localDevelopmentOrigin) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: "32kb" }));

async function readDataset(fileName) {
  const contents = await fs.readFile(path.join(dataDirectory, fileName), "utf8");
  return JSON.parse(contents);
}

function assessVillage(village) {
  return {
    ...village,
    ...calculateRisk(
      village.hazardScore,
      village.vulnerabilityScore,
      village.disasterHistoryScore,
    ),
  };
}

function sendDataError(response, error, subject) {
  console.error(`Unable to load ${subject}:`, error);
  response.status(500).json({ error: `Unable to load ${subject}.` });
}

app.get("/", (request, response) => {
  response.json({ name: "PRANA", message: "Disaster risk decision-support API" });
});

app.get("/api/health", async (request, response) => {
  try {
    const region = await readDataset("region.json");
    response.json({ status: "ok", region: region.regionName, datasetStatus: region.datasetStatus });
  } catch (error) {
    sendDataError(response, error, "API health metadata");
  }
});

app.get("/api/metadata", async (request, response) => {
  try {
    response.json(await readDataset("region.json"));
  } catch (error) {
    sendDataError(response, error, "region metadata");
  }
});

app.get("/api/hazard-zones", async (request, response) => {
  try {
    response.json(await readDataset("hazardZones.json"));
  } catch (error) {
    sendDataError(response, error, "hazard zone data");
  }
});

app.get("/api/villages", async (request, response) => {
  try {
    const villages = (await readDataset("villages.json")).map(assessVillage);
    const { riskLevel, priority, search, redZone } = request.query;
    const validRiskLevels = ["LOW", "MEDIUM", "HIGH"];
    const validPriorities = ["IMMEDIATE", "SHORT-TERM", "MEDIUM-TERM", "MONITOR"];
    if (riskLevel && !validRiskLevels.includes(riskLevel)) {
      return response.status(400).json({ error: "Invalid riskLevel filter." });
    }
    if (priority && !validPriorities.includes(priority)) {
      return response.status(400).json({ error: "Invalid priority filter." });
    }
    if (redZone !== undefined && !["true", "false"].includes(redZone)) {
      return response.status(400).json({ error: "redZone must be true or false." });
    }

    const filtered = villages
      .filter((village) => !riskLevel || village.riskLevel === riskLevel)
      .filter((village) => !priority || village.relocationPriority === priority)
      .filter((village) => redZone === undefined || village.redZone === (redZone === "true"))
      .filter((village) => {
        const term = String(search || "").trim().toLowerCase();
        return !term || village.name.toLowerCase().includes(term) || village.id.toLowerCase().includes(term);
      })
      .sort((left, right) => right.riskScore - left.riskScore);
    response.json(filtered);
  } catch (error) {
    sendDataError(response, error, "village assessments");
  }
});

app.get("/api/villages/:villageId", async (request, response) => {
  try {
    const villages = await readDataset("villages.json");
    const village = villages.find((item) => item.id === request.params.villageId);
    if (!village) return response.status(404).json({ error: "Village not found." });
    response.json(assessVillage(village));
  } catch (error) {
    sendDataError(response, error, "village assessment");
  }
});

app.get("/api/summary", async (request, response) => {
  try {
    const [metadata, records] = await Promise.all([
      readDataset("region.json"),
      readDataset("villages.json"),
    ]);
    const villages = records.map(assessVillage);
    response.json({
      region: metadata.regionName,
      datasetStatus: metadata.datasetStatus,
      totalVillages: villages.length,
      totalPopulation: villages.reduce((total, village) => total + village.population, 0),
      highRisk: villages.filter((village) => village.riskLevel === "HIGH").length,
      redZone: villages.filter((village) => village.redZone).length,
      relocationAction: villages.filter((village) => village.relocationPriority !== "MONITOR").length,
      riskDistribution: Object.fromEntries(
        ["HIGH", "MEDIUM", "LOW"].map((level) => [
          level,
          villages.filter((village) => village.riskLevel === level).length,
        ]),
      ),
      priorityDistribution: Object.fromEntries(
        ["IMMEDIATE", "SHORT-TERM", "MEDIUM-TERM", "MONITOR"].map((level) => [
          level,
          villages.filter((village) => village.relocationPriority === level).length,
        ]),
      ),
    });
  } catch (error) {
    sendDataError(response, error, "dashboard summary");
  }
});

app.get("/api/relocation-sites", async (request, response) => {
  try {
    const [sites, villages] = await Promise.all([
      readDataset("RelocationSites.json"),
      readDataset("villages.json"),
    ]);
    const villageId = request.query.villageId;
    if (!villageId) return response.json(sites);

    const village = villages.find((item) => item.id === villageId);
    if (!village) return response.status(404).json({ error: "Village not found." });
    const evaluated = sites
      .map((site) => ({ ...site, ...calculateSuitability(site, village) }))
      .sort((left, right) => {
        const suitabilityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (
          suitabilityOrder[left.suitability] - suitabilityOrder[right.suitability] ||
          right.suitabilityScore - left.suitabilityScore ||
          (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity)
        );
      });
    response.json(evaluated);
  } catch (error) {
    sendDataError(response, error, "relocation site assessments");
  }
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error.message === "Not allowed by CORS") {
    return response.status(403).json({ error: "Origin is not allowed." });
  }
  console.error("Unhandled API error:", error);
  return response.status(500).json({ error: "Unexpected server error." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PRANA API listening on port ${PORT}`);
  });
}

module.exports = app;