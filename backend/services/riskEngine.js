const factorDefinitions = [
  { key: "hazardScore", label: "Hazard exposure", weight: 0.4 },
  { key: "vulnerabilityScore", label: "Population vulnerability", weight: 0.3 },
  { key: "disasterHistoryScore", label: "Disaster history", weight: 0.3 },
];

function calculateRisk(hazardScore, vulnerabilityScore, disasterHistoryScore) {
  const scores = { hazardScore, vulnerabilityScore, disasterHistoryScore };
  for (const [key, score] of Object.entries(scores)) {
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new RangeError(`${key} must be a number between 0 and 100.`);
    }
  }

  const riskFactors = factorDefinitions.map((factor) => ({
    key: factor.key,
    label: factor.label,
    score: scores[factor.key],
    weight: factor.weight,
    contribution: Number((scores[factor.key] * factor.weight).toFixed(2)),
  }));
  const riskScore = Number(
    riskFactors.reduce((total, factor) => total + factor.contribution, 0).toFixed(2),
  );
  const riskLevel = riskScore <= 30 ? "LOW" : riskScore <= 60 ? "MEDIUM" : "HIGH";
  const redZone = riskScore >= 70 && hazardScore >= 60;
  const relocationPriority =
    riskScore >= 80
      ? "IMMEDIATE"
      : riskScore >= 60
        ? "SHORT-TERM"
        : riskScore >= 40
          ? "MEDIUM-TERM"
          : "MONITOR";
  const primaryDriver = [...riskFactors].sort(
    (left, right) => right.contribution - left.contribution,
  )[0];

  return {
    riskScore,
    riskLevel,
    redZone,
    relocationPriority,
    riskFactors,
    primaryDriver: primaryDriver.key,
    redZoneReason: redZone
      ? "Composite risk is at least 70 and hazard exposure is at least 60."
      : null,
  };
}

module.exports = calculateRisk;