# TerraPulse — Frontend Dashboard

**NASA Space Apps Challenge 2026** — *Discovering the Pulse of a Changing Planet.*
**Role:** Person 3 — Frontend & Map Developer

An interactive web dashboard for exploring global Earth system trends (Temperature and Rainfall) across 30 geographical cells from 1990 to 2024.

---

## Features

- **Global 30-Cell Grid Map:** Visualizes 30 global sample cells ($5 \text{ latitudes} \times 6 \text{ longitudes}$) dynamically computed from dataset coordinates.
- **Variable Switching:** Toggle seamlessly between **Temperature** and **Rainfall**.
- **Scientific Color Mapping:** Cell fill colors are determined strictly by `trend_map`:
  - **Red:** Increase (`trend_map = 1`)
  - **Blue:** Decrease (`trend_map = -1`)
  - **Grey:** No significant change (`trend_map = 0`)
  - **Amber Outline:** Missing / Invalid data (never classified as grey)
- **Interactive Popups & Snapping:** Click anywhere on the map to snap to the nearest cell via the spherical **Haversine formula** (with antimeridian $\pm 180^\circ$ longitude wraparound), displaying:
  - Cumulative 35-year change (`total_change`)
  - Annual trend rate (`slope`)
  - Adjusted significance (`p_fdr`)
- **35-Year Historical Time-Series Chart:** Displays all 35 annual observations (1990–2024) from `clean_yearly.csv` for the selected cell, complete with a horizontal zero reference baseline ($y = 0$).
- **Defensive Data Handling:** Safely handles negative zero (`-0.0`) without altering legitimate small decimals, and ensures no data is fabricated or smoothed.

---

## Project Structure

```text
frontend/
├── Data/                          # Original read-only CSV datasets
│   ├── trend_results.csv          # 60 spatial trend records (30 per variable)
│   └── clean_yearly.csv           # 2,100 annual anomaly records (1990–2024)
├── src/
│   ├── components/
│   │   ├── Header.jsx             # Top branding banner
│   │   ├── VariableSelector.jsx   # Temperature / Rainfall pill toggle
│   │   ├── MapView.jsx            # Leaflet map with 30 grid polygons & popups
│   │   ├── MapLegend.jsx          # Color legend and Mercator projection note
│   │   ├── KPICards.jsx           # Selected cell statistical summary cards
│   │   └── TimeSeriesChart.jsx    # Chart.js historical line chart (1990–2024)
│   ├── utils/
│   │   ├── dataLoader.js          # Ingestion validator & indexer (PapaParse)
│   │   ├── geoGrid.js             # Dynamic grid boundary calculator
│   │   ├── haversine.js           # Spherical distance with date line wraparound
│   │   ├── formatters.js          # Scientific number formatters & -0 normalizer
│   │   └── colorRules.js          # Strict trend_map to color mapping logic
│   ├── App.jsx                    # Root dashboard application state
│   ├── index.css                  # Tailwind styles and Leaflet overrides
│   └── main.jsx                   # React entry point
├── index.html                     # HTML5 shell
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite configuration and CSV static serving
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS plugins
└── .gitignore                     # Excludes node_modules, dist, logs
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (bundled with Node.js)

---

## How to Run Locally

1. **Open a terminal** in the frontend folder:
   ```bash
   cd frontend
   ```

2. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:5173/](http://localhost:5173/)

---

## Production Build

To test the production build:
```bash
npm run build
npm run preview
```
