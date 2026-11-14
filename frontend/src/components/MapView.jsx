import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTrendColor } from '../utils/colorRules';
import { extractUniqueCoordinates, buildDynamicGridBounds } from '../utils/geoGrid';
import { findNearestGridCell } from '../utils/haversine';
import { formatMetric, formatPValue, formatCoordinate } from '../utils/formatters';

export default function MapView({
  cells,
  selectedVariable,
  selectedCell,
  onSelectCell
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const popupRef = useRef(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [15, 0],
      zoom: 1.8,
      minZoom: 1.5,
      maxZoom: 7,
      zoomControl: false,
      worldCopyJump: true,
      maxBounds: [
        [-85, -210],
        [85, 210]
      ],
      maxBoundsViscosity: 0.9
    });

    // Add zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark Matter tiles for clean NASA Space Apps visualization
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update grid polygons and markers whenever cells or selectedVariable change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !cells || cells.length === 0) return;

    layerGroup.clearLayers();

    // Safeguard 1 & 2: Derive dynamic grid boundaries from actual dataset coordinates
    const { sortedLats, sortedLons } = extractUniqueCoordinates(cells);
    const boundsMap = buildDynamicGridBounds(sortedLats, sortedLons);

    // Render each of the 30 cells
    cells.forEach((cell) => {
      const coordKey = `${cell.lat}_${cell.lon}`;
      const gridBox = boundsMap.get(coordKey);
      if (!gridBox) return;

      const isSelected =
        selectedCell &&
        Number(selectedCell.lat) === Number(cell.lat) &&
        Number(selectedCell.lon) === Number(cell.lon);

      // Color based strictly on trend_map
      const trendColor = getTrendColor(cell.trend_map);

      // 1. Grid Cell Rectangle Polygon
      const rectangle = L.rectangle(gridBox.bounds, {
        color: isSelected ? '#38bdf8' : trendColor.strokeColor,
        weight: isSelected ? 3 : 1.5,
        fillColor: trendColor.fillColor,
        fillOpacity: isSelected ? 0.65 : 0.38,
        dashArray: isSelected ? null : trendColor.dashArray || null
      });

      // 2. Centroid Circle Marker (guarantees visibility even at extreme latitudes)
      const centroidMarker = L.circleMarker([cell.lat, cell.lon], {
        radius: isSelected ? 7 : 4.5,
        color: isSelected ? '#38bdf8' : '#ffffff',
        weight: isSelected ? 2.5 : 1.5,
        fillColor: trendColor.fillColor,
        fillOpacity: 1.0
      });

      // Create popup content as required: total_change, slope, p_fdr
      const popupContent = `
        <div style="font-family: inherit; min-width: 190px; color: #f1f5f9; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 4px;">
            <strong style="font-size: 13px; color: #38bdf8;">${selectedVariable}</strong>
            <span style="font-size: 11px; background: #1e293b; padding: 2px 6px; border-radius: 6px; color: #94a3b8;">
              ${formatCoordinate(cell.lat, cell.lon)}
            </span>
          </div>
          <div style="font-size: 12px; line-height: 1.6;">
            <div><span style="color: #94a3b8;">Total Change:</span> <strong style="font-family: monospace; color: #ffffff;">${formatMetric(cell.total_change, 4)}</strong></div>
            <div><span style="color: #94a3b8;">Annual Slope:</span> <strong style="font-family: monospace; color: #ffffff;">${formatMetric(cell.slope, 5)}</strong></div>
            <div><span style="color: #94a3b8;">FDR p-value:</span> <strong style="font-family: monospace; color: #ffffff;">${formatPValue(cell.p_fdr)}</strong></div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #334155; font-size: 11px; color: ${trendColor.fillColor}; font-weight: 600;">
              trend_map: ${cell.trend_map} (${trendColor.shortLabel})
            </div>
          </div>
        </div>
      `;

      rectangle.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        closeButton: false
      });
      centroidMarker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        closeButton: false
      });

      // Hover feedback
      rectangle.on('mouseover', () => {
        if (!isSelected) {
          rectangle.setStyle({ fillOpacity: 0.55, weight: 2.2 });
        }
      });
      rectangle.on('mouseout', () => {
        if (!isSelected) {
          rectangle.setStyle({ fillOpacity: 0.38, weight: 1.5 });
        }
      });

      // Click handler
      const handleCellClick = (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectCell(cell);
        rectangle.openPopup();
      };

      rectangle.on('click', handleCellClick);
      centroidMarker.on('click', handleCellClick);

      layerGroup.addLayer(rectangle);
      layerGroup.addLayer(centroidMarker);

      // Keep popup open for selected cell
      if (isSelected) {
        popupRef.current = rectangle;
      }
    });

    // Safeguard 3: Map Click Snapping using Haversine with Longitude Wraparound
    const handleMapBackgroundClick = (e) => {
      const clickLat = e.latlng.lat;
      const clickLon = e.latlng.lng;
      const result = findNearestGridCell(clickLat, clickLon, cells);

      if (result && result.cell) {
        onSelectCell(result.cell);
        // Open popup at the selected cell center
        L.popup({ className: 'custom-leaflet-popup' })
          .setLatLng([result.cell.lat, result.cell.lon])
          .setContent(`
            <div style="font-family: inherit; min-width: 190px; color: #f1f5f9; padding: 2px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 4px;">
                <strong style="font-size: 13px; color: #38bdf8;">${selectedVariable}</strong>
                <span style="font-size: 11px; background: #1e293b; padding: 2px 6px; border-radius: 6px; color: #94a3b8;">
                  ${formatCoordinate(result.cell.lat, result.cell.lon)}
                </span>
              </div>
              <div style="font-size: 12px; line-height: 1.6;">
                <div><span style="color: #94a3b8;">Total Change:</span> <strong style="font-family: monospace; color: #ffffff;">${formatMetric(result.cell.total_change, 4)}</strong></div>
                <div><span style="color: #94a3b8;">Annual Slope:</span> <strong style="font-family: monospace; color: #ffffff;">${formatMetric(result.cell.slope, 5)}</strong></div>
                <div><span style="color: #94a3b8;">FDR p-value:</span> <strong style="font-family: monospace; color: #ffffff;">${formatPValue(result.cell.p_fdr)}</strong></div>
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #334155; font-size: 11px; color: ${getTrendColor(result.cell.trend_map).fillColor}; font-weight: 600;">
                  trend_map: ${result.cell.trend_map} (${getTrendColor(result.cell.trend_map).shortLabel})
                </div>
              </div>
            </div>
          `)
          .openOn(map);
      }
    };

    map.on('click', handleMapBackgroundClick);

    return () => {
      map.off('click', handleMapBackgroundClick);
    };
  }, [cells, selectedVariable, selectedCell, onSelectCell]);

  return (
    <div className="relative w-full h-[450px] lg:h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0b0f19]">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Helper badge */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-lg text-xs text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Click anywhere to snap to nearest cell</span>
        </div>
      </div>
    </div>
  );
}
