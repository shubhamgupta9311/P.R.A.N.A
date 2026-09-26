const facilityDefinitions = [
  ["water", "Water"],
  ["hospital", "Healthcare"],
  ["school", "School"],
  ["road", "Road access"],
  ["electricity", "Electricity"],
];

function distanceBetweenKm(from, to) {
  const coordinates = [from.latitude, from.longitude, to.latitude, to.longitude];
  if (!coordinates.every(Number.isFinite)) return null;

  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function calculateSuitability(site, village) {
  if (!Number.isFinite(village.population) || village.population <= 0) {
    throw new RangeError("Village population must be a positive number.");
  }

  const distance = distanceBetweenKm(village, site);
  const distanceKm = distance === null ? null : Number(distance.toFixed(1));
  const capacityOkay = Number.isFinite(site.capacity) && site.capacity >= village.population;
  const landOkay = site.landAvailable === true;
  const hazardKnown = ["LOW", "MEDIUM", "HIGH"].includes(site.hazardRisk);
  const hazardOkay = hazardKnown && site.hazardRisk !== "HIGH";
  const facilities = site.facilities || {};
  const missingFacilities = facilityDefinitions
    .filter(([key]) => facilities[key] !== true)
    .map(([, label]) => label);
  const facilitiesAvailable = facilityDefinitions.length - missingFacilities.length;
  const capacityUtilizationPct = Number(
    ((village.population / site.capacity) * 100).toFixed(1),
  );
  const distanceOkay = distanceKm !== null && distanceKm <= 50;

  let suitability = "LOW";
  if (
    capacityOkay &&
    landOkay &&
    hazardOkay &&
    facilitiesAvailable >= 3 &&
    distanceOkay
  ) {
    suitability =
      site.hazardRisk === "LOW" &&
      facilitiesAvailable === facilityDefinitions.length &&
      distanceKm <= 25 &&
      capacityUtilizationPct <= 80
        ? "HIGH"
        : "MEDIUM";
  }

  const proximityScore = distanceKm === null ? 0 : Math.max(0, 10 * (1 - distanceKm / 50));
  const suitabilityScore = Math.round(
    (capacityOkay ? 30 : 0) +
      (landOkay ? 20 : 0) +
      (site.hazardRisk === "LOW" ? 20 : site.hazardRisk === "MEDIUM" ? 10 : 0) +
      (facilitiesAvailable / facilityDefinitions.length) * 20 +
      proximityScore,
  );
  const reasons = [];
  if (!capacityOkay) reasons.push("Insufficient population capacity");
  if (!landOkay) reasons.push("Land availability is not confirmed");
  if (!hazardKnown) reasons.push("Candidate-site hazard status is unverified");
  else if (!hazardOkay) reasons.push("Candidate site is marked high hazard");
  if (distanceKm === null) reasons.push("Location coordinates are unavailable");
  else if (!distanceOkay) reasons.push("More than 50 km from the habitation");
  if (missingFacilities.length) reasons.push(`Missing: ${missingFacilities.join(", ")}`);
  if (suitability === "HIGH") reasons.push("Meets all recorded checks with capacity buffer");

  return {
    capacityOkay,
    capacityBuffer: Number.isFinite(site.capacity)
      ? Math.max(0, site.capacity - village.population)
      : null,
    capacityUtilizationPct: Number.isFinite(capacityUtilizationPct)
      ? capacityUtilizationPct
      : null,
    landOkay,
    hazardKnown,
    hazardOkay,
    distanceKm,
    facilitiesAvailable,
    missingFacilities,
    suitabilityScore,
    suitability,
    reasons,
  };
}

calculateSuitability.distanceBetweenKm = distanceBetweenKm;
module.exports = calculateSuitability;