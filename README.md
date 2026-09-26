# P.R.A.N.A.

## Predictive Relocation & Risk Assessment Network for Disaster Mitigation

P.R.A.N.A. is a GIS-based disaster-management decision-support platform designed to help identify high-risk habitations and support data-driven relocation planning before a disaster occurs.

The system combines hazard assessment, population vulnerability, disaster history, risk classification, red-zone identification, relocation-site suitability, carrying-capacity assessment, and relocation prioritization into a single dashboard.

## Problem Statement

Disaster-prone habitations are often identified only after severe damage has already occurred.

Authorities need a system that can help answer:

- Which habitations are at high risk?
- Why are they at risk?
- Which areas may be unsafe for permanent settlement?
- Where can affected populations be relocated?
- Can a proposed relocation site accommodate the population?
- Does the site have essential facilities?
- Which habitations require relocation first?

P.R.A.N.A. addresses these requirements through an interactive GIS dashboard and a rule-based risk and relocation assessment engine.

---
## Key Features

### 1. Interactive GIS Risk Map

The platform provides an interactive map displaying:

- Assessed villages/habitations
- Risk-level markers
- Flood hazard zones
- Landslide hazard zones
- Village-level risk information

Risk markers are classified as:

- High Risk
- Medium Risk
- Low Risk

Users can select a village directly from the map to view detailed assessment information.

---

### 2. Risk Assessment

Each village is assessed using three major factors:

- Hazard Score
- Population Vulnerability Score
- Disaster History Score

The prototype calculates the risk score using:

Risk Score =  
40% Hazard + 30% Vulnerability + 30% Disaster History

The resulting risk is classified into:

- LOW
- MEDIUM
- HIGH

---

### 3. Red-Zone Identification

Villages with a high calculated risk score can be identified as red-zone areas.

The dashboard displays whether a selected village is:

- Red Zone
- Not a Red Zone

This helps identify settlements that may require relocation planning.

For this prototype, a red-zone flag requires both a composite risk score of at least 70 and a hazard score of at least 60. This is a demonstrator rule, not an official land-use or evacuation determination.

---

### 4. Village Risk Explanation

For each selected village, the dashboard displays the factors contributing to its risk assessment:

- Hazard Score
- Vulnerability Score
- Disaster History
- Flood Risk
- Landslide Risk

This makes the risk assessment easier to understand instead of displaying only a final risk score.

---

### 5. Relocation Site Finder

For a village requiring relocation, P.R.A.N.A. evaluates available relocation sites.

Each site contains information about:

- Population capacity
- Land availability
- Water
- Hospital/healthcare
- School
- Road connectivity
- Electricity

The system identifies suitable relocation sites based on these factors.

---

### 6. Carrying Capacity Assessment

The system checks whether a proposed relocation site can accommodate the affected population.

It evaluates:

- Population capacity
- Land availability
- Water availability
- Healthcare availability
- School availability
- Road connectivity
- Electricity

The system classifies relocation-site suitability as:

- HIGH
- MEDIUM
- LOW

---

### 7. Relocation Priority

Villages are assigned relocation priorities based on their calculated risk:

- IMMEDIATE
- SHORT-TERM
- MEDIUM-TERM
- MONITOR

This helps authorities understand which settlements require earlier intervention.

---

### 8. Dashboard & Analytics

The dashboard provides an overview of:

- Total villages under assessment
- High-risk villages
- Red-zone villages
- Villages requiring relocation

The Analytics section provides:

- Risk Distribution
- Relocation Priority Distribution

---

## System Workflow
Village & Hazard Data
        ↓
Hazard Assessment
        ↓
Vulnerability Assessment
        ↓
Disaster History Analysis
        ↓
Risk Score Calculation
        ↓
Risk Classification
        ↓
Red-Zone Identification
        ↓
Relocation Site Assessment
        ↓
Carrying Capacity Check
        ↓
Relocation Priority
        ↓
Government Decision-Support Dashboard

## Prototype Scope & Data

The current pilot uses a small illustrative footprint in the Upper Alaknanda area of Chamoli, Uttarakhand. It includes 12 demonstration habitations, five candidate sites, and four GeoJSON hazard overlays so the end-to-end workflow can be exercised.

All population, hazard, vulnerability, disaster-history, relocation capacity, facility, and safety values are synthetic. Map locations and hazard polygons are approximate UI examples, not validated boundaries or official assessments. Do not use this data for operational decisions. See [data/README.md](data/README.md) for provenance and requirements before substituting field data.

The risk score is a transparent weighted rule: 40% hazard, 30% vulnerability, and 30% disaster history. Risk bands are LOW through 30, MEDIUM above 30 through 60, and HIGH above 60. Relocation candidates are checked for capacity, land, recorded hazard status, five essential services, and straight-line distance; unknown hazard status is never treated as safe. These rules are prototypes, not a trained ML model.

## Run Locally

Use two PowerShell terminals from the repository root:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

The dashboard runs at `http://localhost:5173` and the API at `http://localhost:5001`. The frontend reads the API base URL from `VITE_API_URL`; it defaults to the local API above. The API exposes health, metadata, hazard GeoJSON, village assessments and filters, summary analytics, and relocation-site assessments under `/api`.
