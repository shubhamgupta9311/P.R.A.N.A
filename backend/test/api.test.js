const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const app = require("../server");

let server;
let baseUrl;

test("API publishes pilot provenance, filters assessments, and checks relocation candidates", async (t) => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const metadataResponse = await fetch(`${baseUrl}/api/metadata`);
  const metadata = await metadataResponse.json();
  assert.equal(metadataResponse.status, 200);
  assert.equal(metadata.datasetStatus, "SYNTHETIC DEMO");
  assert.ok(metadata.provenance.includes("synthetic"));

  const localOriginResponse = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "http://localhost:5174" },
  });
  assert.equal(localOriginResponse.headers.get("access-control-allow-origin"), "http://localhost:5174");
  assert.equal(
    (await fetch(`${baseUrl}/api/health`, { headers: { Origin: "https://untrusted.example" } })).status,
    403,
  );

  const villagesResponse = await fetch(`${baseUrl}/api/villages`);
  const villages = await villagesResponse.json();
  assert.equal(villages.length, 12);
  assert.ok(villages[0].riskScore >= villages.at(-1).riskScore);
  assert.equal(villages[0].riskFactors.length, 3);

  const redZones = await fetch(`${baseUrl}/api/villages?redZone=true`);
  assert.ok((await redZones.json()).every((village) => village.redZone));
  assert.equal((await fetch(`${baseUrl}/api/villages?riskLevel=INVALID`)).status, 400);
  assert.equal((await fetch(`${baseUrl}/api/villages/D999`)).status, 404);

  const zonesResponse = await fetch(`${baseUrl}/api/hazard-zones`);
  const zones = await zonesResponse.json();
  assert.equal(zones.features.length, 4);
  assert.ok(zones.features.every((feature) => feature.properties.status === "ILLUSTRATIVE"));

  const siteResponse = await fetch(`${baseUrl}/api/relocation-sites?villageId=D001`);
  const sites = await siteResponse.json();
  assert.equal(siteResponse.status, 200);
  assert.ok(sites.every((site) => Number.isFinite(site.distanceKm)));
  assert.ok(sites[0].suitabilityScore >= sites.at(-1).suitabilityScore);
  assert.ok(Array.isArray(sites[0].missingFacilities));
  assert.equal((await fetch(`${baseUrl}/api/relocation-sites?villageId=D999`)).status, 404);

  const summary = await (await fetch(`${baseUrl}/api/summary`)).json();
  assert.equal(summary.totalVillages, 12);
  assert.equal(summary.riskDistribution.HIGH + summary.riskDistribution.MEDIUM + summary.riskDistribution.LOW, 12);
});