const test = require("node:test");
const assert = require("node:assert/strict");
const calculateSuitability = require("../services/suitabilityEngines");

const village = { population: 1000, latitude: 30, longitude: 79 };
const completeFacilities = {
  water: true,
  hospital: true,
  school: true,
  road: true,
  electricity: true,
};

test("nearby low-hazard site with service and capacity buffer ranks high", () => {
  const result = calculateSuitability(
    {
      capacity: 2000,
      latitude: 30.1,
      longitude: 79.1,
      landAvailable: true,
      hazardRisk: "LOW",
      facilities: completeFacilities,
    },
    village,
  );

  assert.equal(result.suitability, "HIGH");
  assert.equal(result.capacityBuffer, 1000);
  assert.equal(result.capacityUtilizationPct, 50);
  assert.equal(result.facilitiesAvailable, 5);
  assert.equal(result.missingFacilities.length, 0);
  assert.ok(result.distanceKm > 14 && result.distanceKm < 15);
});

test("unknown hazard status and insufficient capacity cannot rank suitable", () => {
  const unknownHazard = calculateSuitability(
    { capacity: 2000, latitude: 30.1, longitude: 79.1, landAvailable: true, facilities: completeFacilities },
    village,
  );
  const insufficientCapacity = calculateSuitability(
    { capacity: 500, latitude: 30.1, longitude: 79.1, landAvailable: true, hazardRisk: "LOW", facilities: completeFacilities },
    village,
  );

  assert.equal(unknownHazard.suitability, "LOW");
  assert.equal(unknownHazard.hazardKnown, false);
  assert.ok(unknownHazard.reasons.includes("Candidate-site hazard status is unverified"));
  assert.equal(insufficientCapacity.suitability, "LOW");
  assert.equal(insufficientCapacity.capacityOkay, false);
});

test("medium hazard or missing services reduces suitability without hiding reasons", () => {
  const result = calculateSuitability(
    {
      capacity: 2000,
      latitude: 30.1,
      longitude: 79.1,
      landAvailable: true,
      hazardRisk: "MEDIUM",
      facilities: { ...completeFacilities, hospital: false, school: false },
    },
    village,
  );

  assert.equal(result.suitability, "MEDIUM");
  assert.deepEqual(result.missingFacilities, ["Healthcare", "School"]);
});

test("site locations beyond the local search radius are not recommended", () => {
  const result = calculateSuitability(
    { capacity: 2000, latitude: 31, longitude: 80, landAvailable: true, hazardRisk: "LOW", facilities: completeFacilities },
    village,
  );
  assert.equal(result.suitability, "LOW");
  assert.ok(result.reasons.includes("More than 50 km from the habitation"));
});