import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import RiskMap from "./components/RiskMap";
import RelocationSite from "./components/RelocationSite";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function App() {
  const [villages, setVillages] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [hazardZones, setHazardZones] = useState({ features: [] });
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [relocationSites, setRelocationSites] = useState([]);
  const [villagesLoading, setVillagesLoading] = useState(true);
  const [villagesError, setVillagesError] = useState("");
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState("");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`${API_URL}/api/metadata`).then((response) => response.json()),
      fetch(`${API_URL}/api/hazard-zones`).then((response) => response.json()),
    ])
      .then(([region, zones]) => {
        if (active) {
          setMetadata(region);
          setHazardZones(zones);
        }
      })
      .catch((error) => console.error("Error loading regional map context:", error));
    return () => { active = false; };
  }, []);

  const handleVillageSelect = (village) => {
    setSelectedVillage(village);
    setRelocationSites([]);
    setSitesError("");
    setSitesLoading(Boolean(village));
  };

  const fetchVillages = () =>
    fetch(`${API_URL}/api/villages`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load village assessments.");
        return response.json();
      });

  const loadVillages = () => {
    setVillagesLoading(true);
    setVillagesError("");
    fetchVillages()
      .then(setVillages)
      .catch((error) => setVillagesError(error.message))
      .finally(() => setVillagesLoading(false));
  };

  useEffect(() => {
    let active = true;
    fetchVillages()
      .then((data) => {
        if (active) setVillages(data);
      })
      .catch((error) => {
        if (active) setVillagesError(error.message);
      })
      .finally(() => {
        if (active) setVillagesLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedVillage) {
      return undefined;
    }

    const controller = new AbortController();
    fetch(`${API_URL}/api/relocation-sites?villageId=${selectedVillage.id}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load relocation options.");
        return response.json();
      })
      .then((data) => setRelocationSites(data))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSitesError(error.message);
          setRelocationSites([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSitesLoading(false);
      });

    return () => controller.abort();
  }, [selectedVillage]);

  useEffect(() => {
    if (selectedVillage) {
      document.getElementById("village-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedVillage]);

  const filteredVillages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return villages.filter((village) => {
      const matchesSearch =
        !normalizedSearch ||
        village.name.toLowerCase().includes(normalizedSearch) ||
        village.id.toLowerCase().includes(normalizedSearch);
      return (
        matchesSearch &&
        (riskFilter === "ALL" || village.riskLevel === riskFilter) &&
        (priorityFilter === "ALL" || village.relocationPriority === priorityFilter)
      );
    });
  }, [villages, search, riskFilter, priorityFilter]);

  const highRiskCount = villages.filter((village) => village.riskLevel === "HIGH").length;
  const redZoneCount = villages.filter((village) => village.redZone).length;
  const relocationCount = villages.filter(
    (village) => village.relocationPriority !== "MONITOR",
  ).length;
  const riskCounts = ["HIGH", "MEDIUM", "LOW"].map((level) => ({
    label: level,
    count: villages.filter((village) => village.riskLevel === level).length,
  }));
  const priorityCounts = ["IMMEDIATE", "SHORT-TERM", "MEDIUM-TERM", "MONITOR"].map(
    (level) => ({
      label: level,
      count: villages.filter((village) => village.relocationPriority === level).length,
    }),
  );

  const exportVillages = () => {
    const headers = ["ID", "Village", "Population", "Latitude", "Longitude", "Risk score", "Risk level", "Red zone", "Relocation priority", "Flood risk", "Landslide risk"];
    const rows = filteredVillages.map((village) => [
      village.id,
      village.name,
      village.population,
      village.latitude,
      village.longitude,
      village.riskScore,
      village.riskLevel,
      village.redZone ? "Yes" : "No",
      village.relocationPriority,
      village.floodRisk,
      village.landslideRisk,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "prana-village-assessments.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content" id="dashboard">
        <header className="page-header">
          <div>
            <p className="eyebrow">FIELD INTELLIGENCE / OVERVIEW</p>
            <h1>Disaster risk dashboard</h1>
            <p className="page-subtitle">{metadata ? `${metadata.regionName} · ${metadata.district}, ${metadata.state}` : "Regional risk, response priorities, and relocation readiness."}</p>
          </div>
          <div className="header-status"><span className="status-dot" /> Pilot dataset <strong>{metadata?.datasetStatus || "DEMO"}</strong></div>
        </header>

        <aside className="data-provenance" aria-label="Dataset warning">
          <strong>{metadata?.datasetStatus || "DEMO DATA"} · NOT FOR OPERATIONAL DECISIONS</strong>
          <span>{metadata?.provenance || "Prototype scores and locations require verification before use."}</span>
        </aside>

        {villagesError && (
          <div className="notice notice-error" role="alert">
            <span>{villagesError} Check that the PRANA API is running.</span>
            <button className="text-button" onClick={loadVillages}>Retry</button>
          </div>
        )}

        <section className="stat-grid" aria-label="Assessment summary">
          <StatCard title="Villages assessed" value={villagesLoading ? "—" : villages.length} note="Across the monitored region" tone="neutral" />
          <StatCard title="High risk" value={villagesLoading ? "—" : highRiskCount} note="Composite score above 60" tone="red" />
          <StatCard title="Red zone" value={villagesLoading ? "—" : redZoneCount} note="Score >=70 and hazard >=60" tone="amber" />
          <StatCard title="Action required" value={villagesLoading ? "—" : relocationCount} note="Priority above monitoring" tone="green" />
        </section>

        <section className="section-block" id="risk-map">
          <div className="section-heading">
            <div><p className="eyebrow">GEOSPATIAL VIEW</p><h2>Regional risk map</h2></div>
            <span className="section-meta">{villages.length} locations</span>
          </div>
          <RiskMap villages={villages} hazardZones={hazardZones} center={metadata?.center} zoom={metadata?.zoom} onVillageSelect={handleVillageSelect} />
        </section>

        <section className="section-block" id="villages">
          <div className="section-heading section-heading-wrap">
            <div><p className="eyebrow">ASSESSMENT REGISTER</p><h2>Village assessments</h2></div>
            <button className="button button-secondary" onClick={exportVillages} disabled={!filteredVillages.length}>
              <span aria-hidden="true">↓</span> Export CSV
            </button>
          </div>
          <div className="table-toolbar">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search village or ID" aria-label="Search village or ID" />
            </label>
            <label className="filter-field">Risk
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
                <option value="ALL">All levels</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
              </select>
            </label>
            <label className="filter-field">Priority
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="ALL">All priorities</option><option value="IMMEDIATE">Immediate</option><option value="SHORT-TERM">Short-term</option><option value="MEDIUM-TERM">Medium-term</option><option value="MONITOR">Monitor</option>
              </select>
            </label>
            <span className="result-count">{filteredVillages.length} shown</span>
          </div>
          <div className="table-wrap">
            <table className="village-table">
              <thead><tr><th>Village</th><th>Population</th><th>Risk score</th><th>Risk level</th><th>Priority</th><th aria-label="View details" /></tr></thead>
              <tbody>
                {villagesLoading && <tr><td colSpan="6" className="table-message">Loading village assessments…</td></tr>}
                {!villagesLoading && filteredVillages.map((village) => (
                  <tr key={village.id} className={selectedVillage?.id === village.id ? "is-selected" : ""}>
                    <td><button className="village-name" onClick={() => handleVillageSelect(village)}>{village.name}<span>{village.id}</span></button></td>
                    <td>{Number(village.population).toLocaleString()}</td>
                    <td><div className="score-cell"><span>{village.riskScore}</span><span className="score-track"><i className={`score-fill risk-${village.riskLevel.toLowerCase()}`} style={{ width: `${Math.min(village.riskScore, 100)}%` }} /></span></div></td>
                    <td><span className={`badge badge-${village.riskLevel.toLowerCase()}`}>{village.riskLevel}</span></td>
                    <td><span className={`priority-label priority-${village.relocationPriority.toLowerCase().replace("-", "")}`}>{village.relocationPriority}</span></td>
                    <td><button className="row-action" onClick={() => handleVillageSelect(village)} aria-label={`View ${village.name} details`}>View <span aria-hidden="true">→</span></button></td>
                  </tr>
                ))}
                {!villagesLoading && !villagesError && filteredVillages.length === 0 && <tr><td colSpan="6" className="table-message">No villages match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {selectedVillage && (
          <section className="section-block detail-section" id="village-details">
            <div className="section-heading section-heading-wrap">
              <div><p className="eyebrow">VILLAGE PROFILE / {selectedVillage.id}</p><h2>{selectedVillage.name}</h2></div>
              <button className="button button-quiet" onClick={() => handleVillageSelect(null)}>Close <span aria-hidden="true">×</span></button>
            </div>
            <div className="profile-summary">
              <span className={`badge badge-${selectedVillage.riskLevel.toLowerCase()}`}>{selectedVillage.riskLevel} RISK</span>
              <span>{Number(selectedVillage.population).toLocaleString()} residents</span>
              <span>{selectedVillage.redZone ? "Red-zone settlement" : "Outside red zone"}</span>
              <strong>Priority: {selectedVillage.relocationPriority}</strong>
            </div>
            {selectedVillage.redZone && <div className="red-zone-explanation"><strong>Red-zone flag</strong><span>{selectedVillage.redZoneReason}</span></div>}
            <div className="factor-grid">
              {selectedVillage.riskFactors.map((factor) => (
                <div className="factor-row" key={factor.key}><div><span>{factor.label}</span><strong>{factor.score}<small>/100 · +{factor.contribution}</small></strong></div><div className="factor-track"><i style={{ width: `${Math.min(factor.score, 100)}%` }} /></div><small className="factor-weight">Weight {factor.weight * 100}%</small></div>
              ))}
              <div className="factor-callout"><span>Overall risk score</span><strong>{selectedVillage.riskScore}<small>/100</small></strong><span>Primary driver: {selectedVillage.primaryDriver.replace("Score", "")}</span><span>Flood {selectedVillage.floodRisk} <b>·</b> Landslide {selectedVillage.landslideRisk}</span></div>
            </div>
          </section>
        )}

        <section className="section-block" id="relocation">
          <RelocationSite sites={relocationSites} village={selectedVillage} loading={sitesLoading} error={sitesError} />
        </section>

        <section className="section-block" id="analytics">
          <div className="section-heading"><div><p className="eyebrow">PORTFOLIO SNAPSHOT</p><h2>Risk & response distribution</h2></div></div>
          <div className="analytics-grid">
            <div className="analytics-panel"><h3>Risk classification</h3>{riskCounts.map((item) => <DistributionRow key={item.label} {...item} total={villages.length} tone={item.label.toLowerCase()} />)}</div>
            <div className="analytics-panel"><h3>Relocation priority</h3>{priorityCounts.map((item) => <DistributionRow key={item.label} {...item} total={villages.length} tone={item.label.toLowerCase().replace("-", "")} />)}</div>
          </div>
        </section>
        <footer className="page-footer">P.R.A.N.A. <span>Predictive Relocation & Risk Assessment Network</span></footer>
      </main>
    </div>
  );
}

function DistributionRow({ label, count, total, tone }) {
  return <div className="distribution-row"><span className={`distribution-dot tone-${tone}`} /><span className="distribution-label">{label}</span><span className="distribution-track"><i className={`tone-fill-${tone}`} style={{ width: `${total ? (count / total) * 100 : 0}%` }} /></span><strong>{count}</strong></div>;
}

export default App;