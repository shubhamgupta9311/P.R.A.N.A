const facilityLabels = [
  ["water", "Water"],
  ["hospital", "Healthcare"],
  ["school", "School"],
  ["road", "Road access"],
  ["electricity", "Electricity"],
];

function RelocationSites({ sites = [], village, loading, error }) {
  return (
    <div className="relocation-panel">
      <div className="relocation-heading">
        <div><p className="eyebrow">CAPACITY & FACILITIES</p><h3>Relocation options</h3></div>
        {village ? <span className="monitor-note">{village.name} · {village.relocationPriority}</span> : <span className="monitor-note">Select a habitation to assess sites</span>}
      </div>
      {!village && !loading && <p className="relocation-empty">Candidate sites are ranked against the selected population, travel distance, hazard status, land availability, and essential services.</p>}
      {loading && <p className="inline-state">Checking site capacity and facilities…</p>}
      {error && <p className="inline-state state-error" role="alert">{error}</p>}
      {!loading && !error && village && village.relocationPriority !== "MONITOR" && sites.some((site) => site.suitability === "HIGH") && (
        <p className="recommendation-line"><span className="recommendation-dot" /> Recommended: {sites.filter((site) => site.suitability === "HIGH").map((site) => site.name).join(", ")}</p>
      )}
      {!loading && !error && village && village.relocationPriority !== "MONITOR" && sites.length === 0 && <p className="inline-state">No relocation sites were returned for this village.</p>}
      {sites.length > 0 && (
        <div className="site-grid">
          {sites.map((site) => (
            <article key={site.id} className="site-card">
              <div className="site-card-heading"><div><h4>{site.name}</h4><span>{site.id} · {site.hazardRisk || "HAZARD UNKNOWN"} HAZARD</span></div>{village && <span className={`badge badge-${(site.suitability || "low").toLowerCase()}`}>{site.suitability || "N/A"}</span>}</div>
              <div className="site-capacity"><span>Population capacity</span><strong>{Number(site.capacity).toLocaleString()}</strong></div>
              {village && <p className={`capacity-status ${site.capacityOkay === false || site.capacity < village.population ? "capacity-warning" : "capacity-ready"}`}>
                {site.capacityOkay === false || site.capacity < village.population ? "Insufficient for this population" : "Capacity sufficient"}
                <span>{Number(village.population).toLocaleString()} people · {site.capacityUtilizationPct}% utilized</span>
              </p>}
              {village && <div className="site-assessment-line"><span>{site.distanceKm === null ? "Distance unavailable" : `${site.distanceKm} km away`}</span><strong>Suitability {site.suitabilityScore}/100</strong></div>}
              <div className="facility-list">
                <div className={`facility-item ${(site.landOkay ?? site.landAvailable) ? "available" : "unavailable"}`}><span>Land available</span><strong>{(site.landOkay ?? site.landAvailable) ? "Yes" : "No"}</strong></div>
                {facilityLabels.map(([key, label]) => <div key={key} className={`facility-item ${site.facilities?.[key] ? "available" : "unavailable"}`}><span>{label}</span><strong>{site.facilities?.[key] ? "Yes" : "No"}</strong></div>)}
              </div>
              {village && site.reasons?.length > 0 && <ul className="site-reasons">{site.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default RelocationSites;