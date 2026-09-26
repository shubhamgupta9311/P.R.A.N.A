import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function RiskMap({
  villages = [],
  hazardZones = [],
  center = [30.43, 79.47],
  zoom = 9,
  onVillageSelect,
}) {
  const [showFlood, setShowFlood] = useState(true);
  const [showLandslide, setShowLandslide] = useState(true);

  // Decide marker color based on risk level
  const getRiskColor = (riskLevel) => {
    if (riskLevel === "HIGH") {
      return "red";
    }

    if (riskLevel === "MEDIUM") {
      return "orange";
    }

    return "green";
  };

  return (
    <div className="risk-map-frame">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hazardZones.features?.map((zone) => {
          const hazardType = zone.properties.hazardType;
          if ((hazardType === "FLOOD" && !showFlood) || (hazardType === "LANDSLIDE" && !showLandslide)) return null;
          const color = hazardType === "FLOOD" ? "#3983a7" : "#c68142";
          const positions = zone.geometry.coordinates[0].map(([longitude, latitude]) => [latitude, longitude]);
          return (
            <Polygon key={zone.id} positions={positions} pathOptions={{ color, fillColor: color, fillOpacity: 0.19, weight: 2 }}>
              <Popup>
                <strong>{zone.properties.name}</strong>
                <p>{hazardType} · {zone.properties.severity}</p>
                <p>Illustrative footprint only; not an official hazard boundary.</p>
              </Popup>
            </Polygon>
          );
        })}

        {villages.map((village) => {
          const riskColor = getRiskColor(village.riskLevel);

          return (
            <CircleMarker
              key={village.id}
              center={[village.latitude, village.longitude]}
              radius={10}
              pathOptions={{
                color: riskColor,
                fillColor: riskColor,
                fillOpacity: 0.8,
              }}
              eventHandlers={{ click: () => onVillageSelect(village) }}
            >
              <Popup>
                <div className="space-y-2">
                  <h3 className="text-base font-bold">
                    {village.name}
                  </h3>

                  <p>Population: {village.population}</p>
                  <p>Risk Score: {village.riskScore}</p>
                  <p>Risk Level: {village.riskLevel}</p>

                  <p>Flood Risk: {village.floodRisk}</p>
                  <p>Landslide Risk: {village.landslideRisk}</p>
                  <p>
                    Red Zone: {village.redZone ? "YES" : "NO"}
                  </p>
                  <p>
                    Priority: {village.relocationPriority}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVillageSelect(village);
                    }}
                    className="mt-3 rounded bg-slate-900 px-3 py-2 text-white"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="map-layer-control">
        <h3>MAP LAYERS</h3>
        <label><input type="checkbox" checked={showFlood} onChange={(event) => setShowFlood(event.target.checked)} /><span className="layer-swatch swatch-flood" />Flood footprint</label>
        <label><input type="checkbox" checked={showLandslide} onChange={(event) => setShowLandslide(event.target.checked)} /><span className="layer-swatch swatch-landslide" />Landslide footprint</label>
      </div>
      <div className="map-legend">
        <h3>VILLAGE RISK</h3>

        <div className="flex items-center gap-2 mb-2">
          <span className="legend-dot legend-high" />
          <span>High risk</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="legend-dot legend-medium" />
          <span>Medium risk</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="legend-dot legend-low" />
          <span>Low risk</span>
        </div>
      </div>
    </div>
  );
}

export default RiskMap;