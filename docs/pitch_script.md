# 3-Minute Hackathon Pitch Script — TerraPulse

**NASA Space Apps Challenge 2026** — *Discovering the Pulse of a Changing Planet.*
**Presenter:** Person 4 — Backend & Pitch Lead
**Team:** Crescent Coder Girls
**Target Duration:** Exactly 3 Minutes (~420 Spoken Words)

---

## Pitch Structure & Timing Overview

| Time Window | Section | Key Message | Visual / Slide |
|---|---|---|---|
| **0:00 – 0:30** | The Hook & Problem | Climate noise vs long-term signals | Global map showing mixed warming/cooling |
| **0:30 – 1:05** | The NASA Data & Engineering | 35 years of NASA POWER observations | Data pipeline from NASA to cleaned anomalies |
| **1:05 – 1:40** | The Scientific Rigor | Non-parametric stats & FDR correction | Statistical methodology & Theil-Sen slope |
| **1:40 – 2:20** | Full-Stack Solution Demo | Live FastAPI backend + Leaflet dashboard | Interactive demo: clicking cells, time-series |
| **2:20 – 2:45** | Key Insights & Divergence | Opposing regional climate trends | Divergence cards (Southern Ocean vs Asia) |
| **2:45 – 3:00** | Impact & Conclusion | Empowering evidence-based action | Closing logo & GitHub repository link |

---

## Word-for-Word Presentation Script

### [0:00 – 0:30] 1. The Hook & The Problem
> *"Good morning, judges!*
> *When we look outside, weather changes every single day. A freezing winter or a record rainstorm can make it hard to see the bigger picture. In fact, natural seasonal noise often blinds us to multi-decadal climate trends.*
> *Global climate change does not happen uniformly everywhere. While some regions are experiencing severe warming, others show unexpected localized patterns. How can scientists, students, and community leaders separate real long-term environmental signals from temporary noise without bias?"*

---

### [0:30 – 1:05] 2. The Solution & NASA Data
> *"Our answer is **TerraPulse**—an interactive, full-stack scientific platform built for the NASA Space Apps Challenge.*
> *Our Data Engineer, Person 1, acquired 35 continuous years of monthly satellite and assimilation data—from 1990 to 2024—directly from the **NASA Langley POWER API**.*
> *Covering 30 global grid cells, we tracked two critical variables: Surface Temperature and Corrected Precipitation. We removed seasonal baselines to isolate true monthly anomalies, replaced missing flags with time-interpolated values, and generated clean annual indices without fabricating a single data point."*

---

### [1:05 – 1:40] 3. Rigorous Non-Parametric Data Science
> *"Next, our Data Scientist, Person 2, applied rigorous mathematics rather than arbitrary assumptions.*
> *Instead of simple linear regression, we used the robust **Theil-Sen slope estimator** to calculate annual trend rates resistant to outliers. We confirmed monotonic trend significance using the **Mann-Kendall rank test**.*
> *And crucially, to prevent false positives across multiple geographic comparisons, we applied **Benjamini-Hochberg False Discovery Rate (FDR) correction**.*
> *Every cell on our map is classified strictly by true statistical significance: Red for significant increase, Blue for significant decrease, and Grey when no significant change is detected."*

---

### [1:40 – 2:20] 4. Full-Stack Integration & Interactive Demo
> *"As Backend Lead, I brought all four teammates' work into a cohesive system.*
> *I engineered a high-performance **FastAPI backend** running on Uvicorn that serves real-time REST endpoints with in-memory caching in under two milliseconds.*
> *On the frontend, Person 3 created a modern React and Leaflet dashboard.*
> *When you click anywhere on the globe, our spherical **Haversine formula** snaps to the nearest cell—even across the antimeridian dateline.*
> *Selecting a cell instantly updates our KPI cards and renders a 35-year historical anomaly curve with a calibrated zero baseline. And if the backend is ever offline, our app automatically switches to static CSV fallback with zero downtime."*

---

### [2:20 – 2:45] 5. Scientific Findings: Regional Divergence
> *"Our detective work revealed compelling scientific insights.*
> *For example, in Equatorial Asia (Latitude 0°, Longitude 90°), we confirmed strong, statistically significant warming of plus 0.75 degrees ($p < 0.001$). Yet in the Southern Ocean (Latitude -60°, Longitude 30°), we verified a significant cooling anomaly of minus 1.17 degrees.*
> *TerraPulse proves that climate impacts are intensely regional."*

---

### [2:45 – 3:00] 6. Conclusion & Call to Action
> *"TerraPulse bridges the gap between raw NASA satellite data and actionable public understanding.*
> *We are Crescent Coder Girls, and we invite you to explore the data for yourself.*
> *Thank you, and we welcome your questions!"*

---

## Speaker Delivery Tips for Person 4

1. **Pacing:** Aim for a steady, conversational pace of about 140 words per minute. Practice pausing for 1 second after saying *"TerraPulse"* and after stating key numbers.
2. **Tone:** Confident, enthusiastic, and grounded in technical honesty. Emphasize that the data is *real NASA data* and the statistics are *FDR-corrected*.
3. **If Demoing Live:**
   - **At 1:45:** Click on Equatorial Asia on the map to show the red cell and rising curve.
   - **At 2:25:** Click on the Southern Ocean to show the blue cooling cell and downward curve.
   - **At 2:35:** Toggle the variable switch from Temperature to Rainfall to demonstrate seamless responsiveness.
4. **Backup Plan:** If the projector or screen share glitches, continue speaking smoothly—the script is self-contained and clear even without visuals.
