# MANGNEX

MANGNEX is an interactive React dashboard concept for manganese mining intelligence. It brings reserve-probability mapping, production shortfall forecasting, operational recommendations, mine geology, statutory safety checks, and Indian manganese statistics into one browser experience.

The project is currently a client-side demonstration and decision-support prototype. It does not contain a deployed machine-learning service, database, authentication layer, or FastAPI server. The interface uses deterministic local calculations and bundled datasets to demonstrate the product workflow. The weather panel is the exception: it requests current conditions from the keyless Open-Meteo API and falls back to a calibrated local estimate when the request fails.

## Contents

- [What the project does](#what-the-project-does)
- [Features](#features)
- [Architecture and data flow](#architecture-and-data-flow)
- [Project structure](#project-structure)
- [Technology stack](#technology-stack)
- [Terminology](#terminology)
- [Requirements and installation](#requirements-and-installation)
- [Development, build, and preview](#development-build-and-preview)
- [Using the application](#using-the-application)
- [Data and calculation notes](#data-and-calculation-notes)
- [CSV format](#csv-format)
- [Limitations and production roadmap](#limitations-and-production-roadmap)

## What the project does

The product narrative follows one operational loop:

1. **Map**: combine satellite-style indicators and sparse borehole information to show where ore is more likely to occur.
2. **Forecast**: estimate daily production, shortfall risk, and revenue exposure from target output, rainfall, equipment downtime, blasting delay, and fleet availability.
3. **Explain**: expose the factors that contribute to risk rather than showing only one unexplained number.
4. **Advise**: translate detected conditions into ranked shift actions, such as reallocating haulage, clearing a blast window, or activating dewatering.
5. **Verify and hand over**: inspect geological strata, complete a DGMS-oriented checklist, and print a shift handover dossier.

## Features

### Narrative sections

- **Hero**: presents the platform proposition and headline reserve, accuracy, and correlation metrics.
- **The Problem**: describes the limitations of manual surveys and static production planning.
- **Approach**: three interactive pillars: Mapper, Forecaster, and Advisor.
- **Real Sites**: explores Balaghat, Jabalpur, Jhabua, and Chhindwara using bundled FY2019-20 district output.
- **How it Works**: shows the Ingest, Predict, Explain, and Dispatch workflow.
- **Why it Wins**: compares this operating model with a manual or isolated legacy workflow.

### Control Room

The Control Room is an embedded dashboard with nine views:

1. **Overview**: daily production KPIs, revenue shortfall, 72-hour risk, DGMS compliance, a 30-day planned-versus-actual chart, and Madhya Pradesh output.
2. **Reserve Heatmap**: a 28 x 28 lease grid. Selecting a cell reveals probability, estimated grade, NDVI, and thermal values. A cell can be marked as verified by dispatching a core drill.
3. **Risk and What-If**: a 30-day risk timeline, playback controls, four scenario sliders, projected output, deficit, revenue exposure, and feature-impact bars.
4. **Shift Directives**: actions are generated for the selected day, sorted by recoverable tonnes, searchable, markable as executed, and exportable as CSV.
5. **3D Geology Inspection**: combines the Strata and Shaft cross-section with the Subsurface Explorer below it. The depth slider highlights one of four geological formations; the lower rotatable grid supports click/keyboard inspection. Arrow keys move across a band; Page Up and Page Down move through depth.
6. **DGMS Safety Handover**: five statutory-style checks with a live compliance score and a print-only handover layout.
7. **Custom CSV Uploader**: loads a validated operations series into the charts, KPIs, forecast, and actions without uploading the file to a server.
8. **National Reserves**: visualizes state-level proven reserves, remaining resources, and Madhya Pradesh grade-wise output.
9. **Equipment Check Logs**: records unit condition checks, technician notes, service history, and fleet health.

### Shared interaction features

- English, Hindi, and Marathi translations.
- Responsive desktop navigation and a mobile slide-in menu.
- Mine selection for four mine profiles.
- Browser `localStorage` persistence for selected mine, active tab, scenario sliders, and action status.
- Evidence and confidence context for inspected geology, including modeled sources, freshness, and drilling priority.
- Named scenario rehearsals for monsoon stress, fleet outage, blast delay, and recovery planning.
- A local decision audit trail for scenario rehearsals, drill dispatches, and action execution.
- A visible provenance badge distinguishing live data, local simulation, and offline mode.
- Live clock and five-minute weather refresh cycle.
- Reduced-motion support through `prefers-reduced-motion` CSS.
- Generated interface sounds using the Web Audio API, with a mute control.
- Toast notifications, completion confetti, animated counters, scroll reveals, parallax backdrops, and chart animations.
- A muted looping `MiningVideo.mp4` background in the footer.

## Architecture and data flow

The application is intentionally small and currently follows a single-page component architecture:

```text
index.html
  -> src/main.jsx
	  -> src/App.jsx
		  -> global styles and design tokens
		  -> translations and shared hooks
		  -> narrative sections
		  -> EmbeddedDashboard
			  -> local mine/data state
			  -> deterministic forecast and reserve generators
			  -> charts and operational controls
		  -> footer video
```

### Runtime flow

1. Vite serves `index.html` and loads `src/main.jsx`.
2. React mounts `App` into the `#root` element under `React.StrictMode`.
3. `App` supplies the active language through `LangContext` and renders the page sections.
4. `EmbeddedDashboard` selects a mine profile and derives charts and actions from local state.
5. On dashboard load and every five minutes, the browser calls Open-Meteo with the selected mine coordinates. A ten-second abort timeout switches the panel to its offline estimate.
6. User changes are held in React state and selected settings are serialized to `localStorage`.
7. CSV import, CSV export, printing, and sample-file download happen entirely in the browser.

There is no API route in this repository. The URL shown inside the dashboard is illustrative product chrome, not a real backend endpoint.

## Project structure

```text
.
|-- index.html                 Application shell, metadata, fonts, and root element
|-- package.json               Scripts and dependency declarations
|-- package-lock.json          Locked npm dependency versions
|-- vite.config.js             Vite and React plugin configuration
|-- MiningVideo.mp4            Footer background video asset
|-- public/                    Static files served from the site root
|-- src/
|   |-- main.jsx               React entry point
|   |-- App.jsx                Page, dashboard, calculations, styles, and interactions
|   `-- data/
|       `-- realData.js        Official-data-shaped datasets and mine metadata
|-- dist/                      Generated production output after `npm run build`
`-- README.md                  This documentation
```

## Technology stack

| Technology | Role in this project |
| --- | --- |
| React 18 | Component rendering, state, effects, context, and the application UI |
| React DOM | Mounts React into the browser DOM |
| Vite 5 | Development server, dependency optimization, and production bundling |
| `@vitejs/plugin-react` | React transform support in Vite |
| Recharts | Area, line, and bar charts with responsive containers and tooltips |
| Lucide React | Consistent interface icons |
| Canvas Confetti | Visual feedback when actions are completed or drills are dispatched |
| Web Audio API | Small synthesized success and alert sounds; no audio file is required |
| Open-Meteo API | Current temperature, humidity, precipitation, wind, and weather code |
| IBM Plex Sans / Mono | UI and technical-data typography loaded from Google Fonts |
| SVG | Reserve grids, maps, geological cross-sections, and atmospheric graphics |
| Browser APIs | `localStorage`, `fetch`, `AbortController`, `FileReader`, `Blob`, downloads, print, and `IntersectionObserver` |

The visual marquee mentions technologies such as XGBoost, Random Forest, SHAP, Sentinel, MODIS, FastAPI, Google Earth Engine, and DGMS CMR 2017. They describe the intended product ecosystem or calibration context; they are not npm dependencies and are not executed by this frontend.

## Terminology

### Mining and geology

- **Manganese ore**: rock containing economically recoverable manganese, used primarily in steelmaking and alloy production.
- **Grade**: concentration of manganese in ore, shown here as a percentage of Mn.
- **High-grade / ferro grade**: the higher-value ore band used in the sample pricing model, generally above 42% Mn.
- **Gondite**: a manganese-rich metamorphic rock associated with several Indian manganese deposits.
- **Braunite**: a manganese oxide mineral represented in the sample geological model.
- **Overburden**: soil and waste material above an ore body.
- **Laterite**: weathered, iron-rich surface material represented in the overburden layer.
- **Stratigraphy**: the description and ordering of geological layers by position and age.
- **Aquitard**: a relatively low-permeability layer that restricts groundwater movement.
- **ASL**: above sea level.
- **RL**: reduced level; a surveyed elevation reference. The UI displays depth below surface as a negative RL-style value.
- **Opencast / open-pit mining**: extraction from a surface excavation using benches, excavators, and haulage equipment.
- **Underground mining**: extraction through shafts, levels, and underground workings.
- **Bench**: a stepped working level in an open pit.
- **Highwall**: the exposed wall of an open-pit excavation.
- **Shaft**: a vertical underground access and hoisting passage.
- **Borehole / drill hole**: a drilled hole used to collect geological information or samples.
- **Lease area**: the legally defined mining area; the reserve grid represents this area abstractly.

### Remote sensing and data science

- **Remote sensing**: observing land or atmosphere from a distance, commonly using satellites.
- **Spectral indicator**: a value derived from how surfaces reflect or emit electromagnetic energy.
- **NDVI**: Normalized Difference Vegetation Index. It compares red and near-infrared reflectance; the UI uses it as a sample satellite-derived indicator.
- **Thermal anomaly / LST**: an unusual land-surface temperature signal. LST means Land Surface Temperature.
- **SAR**: Synthetic Aperture Radar, a radar imaging method that can operate through clouds and at night.
- **Sentinel-1 / Sentinel-2**: European Copernicus satellite missions; Sentinel-1 is radar-oriented and Sentinel-2 is multispectral.
- **MODIS**: Moderate Resolution Imaging Spectroradiometer, a NASA Earth-observation instrument.
- **Data fusion**: combining observations from different sources, such as satellite data, assays, weather, and equipment telemetry.
- **Telemetry**: machine-generated operational measurements, for example equipment availability or downtime.
- **Reserve probability**: an estimated likelihood that a grid cell contains economically relevant ore; it is a demonstration score, not a certified reserve estimate.
- **Feature**: an input variable used by a predictive model, such as rainfall or downtime.
- **Model calibration**: adjusting a model or demonstration formula against reference data so its outputs are directionally meaningful.
- **SHAP attribution**: a model-explainability technique that estimates how much each input feature contributes to a prediction. The displayed values are fixed demonstration factors.
- **XGBoost / Random Forest**: machine-learning model families often used for tabular prediction. They are named in the product concept but are not run in this repository.

### Operations and safety

- **Shortfall**: the difference between planned tonnes and actual or projected tonnes.
- **Risk**: the UI's percentage score for the chance or severity of a production shortfall over the displayed horizon.
- **72-hour forecast horizon**: the operational planning window shown by the dashboard KPI; the current frontend simulates series values rather than calling a forecasting service.
- **Downtime**: time when equipment is unavailable for productive work.
- **Blasting delay**: lost time associated with blast clearance, scheduling, or safety procedures.
- **Fleet availability**: the number of active rigs, loaders, excavators, or related equipment units.
- **Haulage**: moving extracted material from a working area to a stockpile, crusher, or processing point.
- **Dewatering**: removing accumulated water from a pit, sump, or underground working.
- **PPV**: Peak Particle Velocity, a vibration measure used to assess blast effects.
- **DGMS**: Directorate General of Mines Safety, India's mine-safety regulator.
- **CMR 2017**: Coal and Metalliferous Mines Regulations, 2017. The checklist displays example references and is not a legal compliance certification.
- **SOP**: Standard Operating Procedure, a documented operational instruction.
- **Shift directive**: a prioritized action proposed for the current operating shift.
- **Revenue at risk**: estimated monetary exposure calculated from tonnes at risk multiplied by the blended sample price.

### Web and UI terms

- **SPA**: Single-page application. Navigation changes the visible section without full-page reloads.
- **Component**: a reusable React function that renders part of the interface.
- **Hook**: a React function such as `useState` or `useEffect` for state and lifecycle behavior.
- **Context**: React's mechanism for making shared values, such as translations, available to descendants.
- **Responsive design**: layout rules that adapt to desktop and mobile viewport sizes.
- **`localStorage`**: browser storage used here for lightweight preferences; it is not a shared database.
- **CSV**: Comma-Separated Values, a plain-text tabular data format.
- **HMR**: Hot Module Replacement, Vite's ability to update modules during development without a full reload.
- **Tree shaking**: bundler removal of unused imported code from a production build.
- **Static asset**: a file such as video or an image served without server-side generation.

## Requirements and installation

### Requirements

- Node.js 18 or newer.
- npm, installed with Node.js.
- A modern browser with JavaScript enabled.
- Internet access is optional. It enables live Open-Meteo weather and Google Fonts; the rest of the dashboard is local.

### Install dependencies

From the project directory:

```powershell
npm install
```

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`:

```powershell
npm.cmd install
```

## Development, build, and preview

### Development server

```powershell
npm run dev
```

Windows alternative:

```powershell
npm.cmd run dev
```

Vite is configured with `host: true` and port `5173`. Open `http://localhost:5173/`. The network URL printed by Vite can be used from another device on the same network when the firewall allows it.

### Production build

```powershell
npm run build
```

This creates the deployable bundle in `dist/`. It also verifies that Vite can resolve the React source, data module, dependencies, and video asset.

### Preview the production build

```powershell
npm run preview
```

The preview server serves the already-built `dist/` output. It is useful for checking production bundling but is not a replacement for a production hosting service.

### Available npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite in development mode with HMR |
| `npm run build` | Generate the optimized production bundle |
| `npm run preview` | Serve the generated production bundle locally |

There is currently no test, lint, or typecheck script in `package.json`.

## Using the application

1. Start the development server and open the local URL.
2. Use the fixed navigation or scroll through the narrative sections.
3. Select **Launch Control Room** to jump to the dashboard.
4. Choose a mine from **Active Mine Site**. Mine-specific coordinates, targets, costs, geology, and equipment details update with the selection.
5. In **Overview**, review the latest simulated output, shortfall, risk, compliance, and charts.
6. In **Reserve Heatmap**, click a grid cell, inspect its indicators, and dispatch a drill. A dispatched cell becomes drill verified for the current browser session.
7. In **Risk and What-If**, change rainfall, downtime, blasting delay, or active fleet sliders. The projected output, risk, and financial deficit recalculate immediately.
8. In **Shift Directives**, choose a day, filter actions, mark work as executed, and export the displayed actions to CSV.
9. In **3D Strata and Shaft**, move the depth slider to inspect the active formation. Use the Subsurface Explorer below it to inspect cells and review evidence/confidence context.
10. In **DGMS Safety Handover**, toggle checklist items and use **Print Shift Handover Dossier**. The print stylesheet hides the rest of the site and prints only the dossier.
11. In **Custom CSV Uploader**, download the template or provide a CSV with the exact required headers. Valid records replace the generated series until reset or until another mine is selected.
12. In **National Reserves**, compare state reserves and Madhya Pradesh grade production.
13. Use the language control to switch between English, Hindi, and Marathi. Use the speaker button to enable or mute synthesized feedback sounds.

## Data and calculation notes

### Bundled reference data

`src/data/realData.js` contains:

- Madhya Pradesh district production for Balaghat, Jabalpur, Jhabua, and Chhindwara.
- Multi-year state production and value records for 2017-18 through 2019-20.
- State reserves, remaining resources, and total resources in million tonnes.
- Madhya Pradesh grade-wise production.
- Sample manganese prices in Indian rupees per tonne.
- Four mine profiles with coordinates, targets, mining method, geology, equipment, and cost assumptions.
- Four geological strata records.
- Five DGMS-style safety criteria.
- A function that generates the downloadable sample CSV.

The file labels its source as Indian Minerals Yearbook 2020, 59th Edition, Manganese Ore, and the UI identifies the Indian Bureau of Mines as the source. These values are bundled reference data and should be independently validated before operational use.

### Generated operational series

When no custom file is loaded, `App.jsx` creates a repeatable 30-day series from a mine's daily target. It derives actual tonnes from:

- planned tonnes with a small deterministic variation,
- rainfall penalty above 20 mm,
- downtime penalty,
- blasting delay penalty, and
- active-equipment fleet bonus.

The risk score then combines the resulting shortfall percentage with downtime and blasting delay. This is a transparent demonstration formula, not a trained production forecast.

### What-if calculation

The scenario sandbox applies the selected mine's daily target and cost coefficients. Rainfall above 18 mm creates a weather penalty; downtime and blasting use mine-specific tonnes-per-hour costs; fleet availability adds or removes a bonus. The revenue deficit uses the blended sample price of INR 14,200 per tonne.

### Weather integration

The dashboard sends the selected mine latitude and longitude to Open-Meteo's `/v1/forecast` endpoint and requests current temperature, relative humidity, precipitation, wind speed, and weather code. The request is aborted after ten seconds and retried every five minutes. If it fails, the dashboard retains the local estimate and labels the panel as a simulation or offline fallback.

## CSV format

The uploader requires this exact header order:

```csv
day,planned_tonnes,actual_tonnes,rainfall_mm,downtime_hrs,blasting_delay_hrs,active_equipment
Day 1,1860,1840,2.5,0.4,0,10
Day 2,1850,1790,14.2,1.2,0,9
```

Validation rules:

- At least one data row is required.
- The seven headers must match and remain in the shown order.
- Planned tonnes must be greater than zero.
- Actual tonnes, rainfall, downtime, blasting delay, and active equipment must be zero or greater.
- Invalid rows are skipped. If no valid rows remain, the upload is rejected.
- CSV parsing supports quoted fields and escaped double quotes.

The file is read with the browser `FileReader`; it is not transmitted to a server.

## Limitations and production roadmap

This repository demonstrates the frontend experience, not a complete mine-intelligence platform. Before production deployment, the following would be required:

- Replace deterministic generators with versioned, trained, validated model services.
- Add authenticated backend APIs for telemetry, boreholes, assays, satellite products, weather, users, and audit history.
- Store data in a managed database with role-based access and retention policies.
- Add geospatial map tiles, coordinate reference handling, real raster processing, and certified reserve-estimation workflows.
- Validate all prices, reserve classifications, safety references, and mine procedures with authorized domain experts.
- Add model monitoring, drift detection, explainability validation, and human approval for recommendations.
- Add automated unit, integration, accessibility, browser, and data-contract tests.
- Add a content-security policy and production asset strategy for fonts, video, and external APIs.
- Treat the DGMS checklist as an operational aid only until it is reviewed and approved by the responsible safety authority.
- Replace browser-local audit events with authenticated, append-only server audit records before operational deployment.
- Replace scenario presets and evidence scores with validated model services, real source metadata, and calibrated uncertainty intervals.

## License and attribution

No license file is currently included. The bundled data attribution is documented in `src/data/realData.js` and in the application UI. Confirm rights and citation requirements before redistributing the project or the bundled video asset.#   M A N G N E X _ D e m o  
 #   M A N G N E X _ D e m o  
 #   M A N G N E X _ D e m o  
 