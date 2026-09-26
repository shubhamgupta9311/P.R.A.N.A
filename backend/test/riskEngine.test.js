const test = require("node:test");
const assert = require("node:assert/strict");
const calculateRisk = require("../services/riskEngine");

test("risk scores expose weighted drivers and classify the upper risk boundary", () => {
  const assessment = calculateRisk(90, 70, 80);

  assert.equal(assessment.riskScore, 81);
  assert.equal(assessment.riskLevel, "HIGH");
  assert.equal(assessment.redZone, true);
  assert.equal(assessment.relocationPriority, "IMMEDIATE");
  assert.equal(assessment.primaryDriver, "hazardScore");
  assert.deepEqual(
    assessment.riskFactors.map(({ contribution }) => contribution),
    [36, 21, 24],
  );
});

test("risk bands and relocation priorities respect their threshold boundaries", () => {
  assert.deepEqual(
    [calculateRisk(30, 30, 30), calculateRisk(60, 60, 60), calculateRisk(70, 70, 70)].map(
      ({ riskLevel, redZone, relocationPriority }) => ({ riskLevel, redZone, relocationPriority }),
    ),
    [
      { riskLevel: "LOW", redZone: false, relocationPriority: "MONITOR" },
      { riskLevel: "MEDIUM", redZone: false, relocationPriority: "SHORT-TERM" },
      { riskLevel: "HIGH", redZone: true, relocationPriority: "SHORT-TERM" },
    ],
  );
  assert.equal(calculateRisk(100, 0, 0).redZone, false);
});

test("risk engine rejects non-numeric and out-of-range assessment values", () => {
  assert.throws(() => calculateRisk(-1, 50, 50), RangeError);
  assert.throws(() => calculateRisk(50, 101, 50), RangeError);
  assert.throws(() => calculateRisk("50", 50, 50), RangeError);
});