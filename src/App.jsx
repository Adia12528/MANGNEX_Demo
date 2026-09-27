import React, { useState, useEffect, useRef, useMemo, createContext, useContext, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import {
  Gauge, Map, TrendingUp, Wrench, Globe, Check, X, Satellite, Radar,
  CloudRain, Layers, ChevronDown, ArrowUpRight, HardHat, Truck, Users, MapPin,
  Menu, Download, Sliders, AlertTriangle, ShieldCheck, Activity, RefreshCw,
  Search, Eye, Zap, Compass, CheckCircle2, ChevronRight, BarChart3, Database,
  Upload, Printer, Volume2, VolumeX, Thermometer, Wind, Droplets, Layers3,
  Info, HelpCircle, PlayCircle
} from "lucide-react";
// NOTE: canvas-confetti, a relative "./data/realData.js" import, and a Vite
// asset import for a local video file were removed here — none of those
// resolve inside the Claude.ai artifact sandbox (no external npm packages
// beyond the whitelisted set, no filesystem, no bundler asset pipeline).
// Their replacements are implemented directly below / inline.

/* =========================================================================
   REAL DATA — sourced from the Indian Minerals Yearbook 2020 (Indian Bureau
   of Mines, Ministry of Mines, GoI) and verified 2025-26 web sources. Every
   block below states its source and vintage; where a number is a modeled
   assumption rather than a sourced fact, it's labeled as such.
   ========================================================================= */

// Table 4, IBM Yearbook 2020 — state-wise production, FY2017-18 to FY2019-20
const REAL_STATE_PRODUCTION = [
  { year: "2017-18", state: "Madhya Pradesh", quantity_tonnes: 837041, value_rs_thousand: 6760106 },
  { year: "2017-18", state: "Maharashtra", quantity_tonnes: 731457, value_rs_thousand: 7243631 },
  { year: "2017-18", state: "Odisha", quantity_tonnes: 516862, value_rs_thousand: 3497593 },
  { year: "2017-18", state: "Karnataka", quantity_tonnes: 294261, value_rs_thousand: 1541069 },
  { year: "2017-18", state: "Andhra Pradesh", quantity_tonnes: 172174, value_rs_thousand: 706314 },
  { year: "2018-19", state: "Madhya Pradesh", quantity_tonnes: 942738, value_rs_thousand: 7147719 },
  { year: "2018-19", state: "Maharashtra", quantity_tonnes: 761985, value_rs_thousand: 7999939 },
  { year: "2018-19", state: "Odisha", quantity_tonnes: 476821, value_rs_thousand: 3048997 },
  { year: "2018-19", state: "Karnataka", quantity_tonnes: 332162, value_rs_thousand: 2276289 },
  { year: "2018-19", state: "Andhra Pradesh", quantity_tonnes: 293679, value_rs_thousand: 1039486 },
  { year: "2019-20", state: "Madhya Pradesh", quantity_tonnes: 958164, value_rs_thousand: 6160735 },
  { year: "2019-20", state: "Maharashtra", quantity_tonnes: 721520, value_rs_thousand: 6127232 },
  { year: "2019-20", state: "Odisha", quantity_tonnes: 537742, value_rs_thousand: 3409984 },
  { year: "2019-20", state: "Karnataka", quantity_tonnes: 333425, value_rs_thousand: 2284994 },
  { year: "2019-20", state: "Andhra Pradesh", quantity_tonnes: 331030, value_rs_thousand: 1317483 },
];

// Table 5(B), IBM Yearbook 2020 — Madhya Pradesh district production, FY2019-20
const REAL_MP_DISTRICTS = [
  { district: "Balaghat", tonnes: 677046 },
  { district: "Jabalpur", tonnes: 202115 },
  { district: "Jhabua", tonnes: 59570 },
  { district: "Chhindwara", tonnes: 19433 },
];

// Table 1, IBM Yearbook 2020 — reserves/resources by state, as on 01.04.2015
// (figures converted from '000 tonnes to million tonnes)
const REAL_RESERVES_BY_STATE = [
  { state: "Odisha", reserves_mt: 30.64, remaining_resources_mt: 185.76 },
  { state: "Karnataka", reserves_mt: 9.35, remaining_resources_mt: 101.72 },
  { state: "Madhya Pradesh", reserves_mt: 29.89, remaining_resources_mt: 27.82 },
  { state: "Maharashtra", reserves_mt: 13.71, remaining_resources_mt: 22.91 },
  { state: "Goa", reserves_mt: 0, remaining_resources_mt: 34.42 },
  { state: "Andhra Pradesh", reserves_mt: 4.96, remaining_resources_mt: 12.69 },
];

// Table 5(B), IBM Yearbook 2020 — gradewise production by MP district,
// FY2019-20 (tonnes). Columns are MnO2 46%+, 35–46% Mn, 25–35% Mn, below
// 25% Mn; each district's four numbers sum exactly to its real total above.
const MP_GRADE_PRODUCTION = [
  { grade: "46%+ Mn", balaghat: 124496, jabalpur: 0, jhabua: 0, chhindwara: 240 },
  { grade: "35-46% Mn", balaghat: 101673, jabalpur: 0, jhabua: 2660, chhindwara: 2140 },
  { grade: "25-35% Mn", balaghat: 344014, jabalpur: 0, jhabua: 47964, chhindwara: 11068 },
  { grade: "Below 25% Mn", balaghat: 106863, jabalpur: 202115, jhabua: 8946, chhindwara: 5985 },
];

// Blended average value per tonne, derived from real Table 4 national
// totals (₹19,416,386 thousand ÷ 2,904,373 tonnes, FY2019-20). This is a
// historical baseline, not a live price — MOIL has raised ferro-grade
// prices multiple times since (documented Jan/Mar/Jul/Aug/Dec 2025 filings),
// so current realized values are materially higher. EMD base price is the
// one live, verified figure available (regulatory filing, Dec 2025).
const ORE_PRICING = {
  blendedAverage: 6686, // ₹/tonne, FY2019-20 national baseline (IBM Yearbook)
  blendedAverageSource: "Derived from FY2019-20 national production value ÷ quantity, IBM Yearbook 2020",
  emdBasePricePerTonne: 195000, // ₹/tonne, Electrolytic Manganese Dioxide, effective Dec 2025 (MOIL regulatory filing)
  emdPriceAsOf: "December 2025",
};

// Mine/district profiles. Balaghat is MOIL's actual flagship underground
// mine — figures are real and cited. Jabalpur, Jhabua and Chhindwara are
// NOT currently MOIL-operated mines: they are district-level production
// totals across multiple producers. MOIL signed a tripartite MoU with the
// Govt. of Madhya Pradesh and MPSMCL in 2025 to explore possibilities in
// these three districts (exploratory blocks identified at Bhudkum,
// Chhindwara and Selwa, Balaghat) — operations have not begun. Their
// per-unit cost assumptions below are modeled for simulation purposes only,
// clearly separate from Balaghat's sourced figures.
const MINE_PROFILES = {
  Balaghat: {
    name: "Balaghat",
    fullLabel: "Balaghat (MOIL underground mine)",
    isRealMoilMine: true,
    lat: 21.81, lon: 80.18,
    method: "Underground, mechanized",
    dailyTarget: 1855, // 677,046t FY19-20 ÷ 365, IBM Yearbook
    leaseAreaKm2: 1.82, // Bharveli block, ~182 ha — one of several MOIL lease blocks at Balaghat
    shaftDepthMeters: 750, // real, verified: IBM Yearbook 2020 ("deepening of high speed vertical shaft up to 750m in Balaghat")
    typicalDowntimeCostTonnesPerHr: 28, // modeled assumption for simulation
    typicalBlastingCostTonnesPerHr: 42, // modeled assumption for simulation
  },
  Jabalpur: {
    name: "Jabalpur",
    fullLabel: "Jabalpur (district total, multi-operator — MOIL exploration only)",
    isRealMoilMine: false,
    lat: 23.1815, lon: 79.9864,
    method: "Opencast (district total)",
    dailyTarget: 554, // 202,115t FY19-20 ÷ 365, IBM Yearbook
    leaseAreaKm2: 2.0, // illustrative simulation area — no single MOIL lease exists here yet
    shaftDepthMeters: 0,
    typicalDowntimeCostTonnesPerHr: 9,
    typicalBlastingCostTonnesPerHr: 13,
  },
  Jhabua: {
    name: "Jhabua",
    fullLabel: "Jhabua (district total, multi-operator — MOIL exploration only)",
    isRealMoilMine: false,
    lat: 22.7672, lon: 74.5924,
    method: "Opencast (district total)",
    dailyTarget: 163, // 59,570t FY19-20 ÷ 365, IBM Yearbook
    leaseAreaKm2: 1.2,
    shaftDepthMeters: 0,
    typicalDowntimeCostTonnesPerHr: 3,
    typicalBlastingCostTonnesPerHr: 4,
  },
  Chhindwara: {
    name: "Chhindwara",
    fullLabel: "Chhindwara (district total, multi-operator — MOIL exploration only)",
    isRealMoilMine: false,
    lat: 22.0574, lon: 78.9382,
    method: "Opencast (district total)",
    dailyTarget: 53, // 19,433t FY19-20 ÷ 365, IBM Yearbook
    leaseAreaKm2: 0.8,
    shaftDepthMeters: 0,
    typicalDowntimeCostTonnesPerHr: 1,
    typicalBlastingCostTonnesPerHr: 1.5,
  },
};

// Geology is real (Gondite Series description, ore mineral chemistry —
// IBM Yearbook 2020); hardness/drilling-rate are standard mineralogical
// reference ranges used illustratively for the depth-inspector tool.
const GEOLOGICAL_STRATA = [
  {
    depthRange: "0 - 18m", name: "Laterite overburden",
    description: "Weathered surface laterite and soil cover above the Gondite Series host rock — must be stripped or supported before ore-bearing strata is reached.",
    oreContent: "Negligible", hardnessMohs: "2 - 3", drillingRateMetersPerHour: 4.2,
  },
  {
    depthRange: "18 - 195m", name: "Gondite Series — lower grade horizon",
    description: "Archaean-age metamorphosed bedded sedimentary rock (the Gondite Series) hosting manganese chiefly as psilomelane (Mn ~45-60%) with silica and iron impurities.",
    oreContent: "25-35% Mn (typical)", hardnessMohs: "5 - 6", drillingRateMetersPerHour: 2.1,
  },
  {
    depthRange: "195 - 275m", name: "Gondite Series — braunite-manganite zone",
    description: "Higher-grade banded zone where braunite (Mn ~62%) and manganite (Mn ~62.4%) become more prevalent, consistent with MOIL's own bench-scale beneficiation studies at Balaghat.",
    oreContent: "35-46% Mn (typical)", hardnessMohs: "6 - 6.5", drillingRateMetersPerHour: 1.4,
  },
  {
    depthRange: "275 - 750m", name: "Deep pyrolusite-rich zone",
    description: "Deepest worked horizon at Balaghat (shaft deepened to 750m); pyrolusite (MnO2, Mn ~63.2%) content rises, requiring cut-and-fill stoping with hydraulic sand stowing.",
    oreContent: "46%+ Mn (best zones)", hardnessMohs: "2 - 6.5 (variable, softer when earthy)", drillingRateMetersPerHour: 0.9,
  },
];

// Real regulatory framework (Directorate General of Mines Safety) — the
// checklist items themselves are a standard operational compliance list
// built around these real, named regulations, not a copy of an official
// DGMS form.
const DGMS_SAFETY_ITEMS = [
  { id: "smp", title: "Approved Safety Management Plan on file", description: "Required for every mine under the Mines Act, 1952 and Mines Rules, 1955." },
  { id: "ventilation", title: "Ventilation standards verified", description: "Adequate air supply and monitoring in underground workings, per the Metalliferous Mines Regulations, 1961." },
  { id: "blast_ppv", title: "Blast vibration (PPV) within limits", description: "Ground vibration from blasting kept within DGMS-fixed peak particle velocity limits to protect nearby structures." },
  { id: "borehole_advance", title: "Advance boreholes near water-logged zones", description: "DGMS mandates advance boreholes when approaching within 60m of waterlogged areas or old workings." },
  { id: "gas_testing", title: "Gas testing certification current", description: "Underground personnel hold valid DGMS Gas Testing certification, mandatory for statutory posts." },
  { id: "ppe", title: "Personal protective equipment compliance", description: "PPE issued and in use per the Mines Rules, 1955 and site standing orders." },
  { id: "training", title: "Vocational training records current", description: "Worker training logged per the Mines Vocational Training Rules, 1966." },
  { id: "explosives", title: "Permitted explosives register maintained", description: "Only DGMS-permitted explosives used and logged, per the Metalliferous Mines Regulations, 1961." },
];

// Template generator for the CSV upload feature — matches the exact header
// schema handleCSVUpload() validates against, with a realistic example
// week calibrated to Balaghat's real daily baseline (1,855 t/day).
function generateSampleMineCSV() {
  const header = "day,planned_tonnes,actual_tonnes,rainfall_mm,downtime_hrs,blasting_delay_hrs,active_equipment";
  const rows = [
    ["Mon", 1855, 1790, 4, 0.8, 0, 10],
    ["Tue", 1860, 1820, 2, 0.4, 0, 10],
    ["Wed", 1850, 1690, 26, 2.1, 1, 9],
    ["Thu", 1865, 1810, 6, 0.6, 0, 10],
    ["Fri", 1858, 1520, 31, 3.4, 2, 8],
    ["Sat", 1840, 1795, 8, 0.9, 0, 10],
    ["Sun", 1850, 1830, 3, 0.3, 0, 10],
  ];
  return [header, ...rows.map((r) => r.join(","))].join("\n");
}


/* =========================================================================
   DESIGN TOKENS
   ========================================================================= */
const C = {
  void: "#110F0B",
  panel: "#1A1712",
  panelRaised: "#241F17",
  panelHighlight: "#2D261C",
  border: "#383125",
  borderLight: "#4D4332",
  ore: "#C1622D",
  oreLight: "#DD8148",
  risk: "#C2452E",
  safe: "#7FA075",
  caution: "#D1A054",
  text: "#EDE5D3",
  muted: "#A79C86",
  mutedDark: "#71685A",
  atmosphere: "#4FB3A6",
  atmosphereDim: "#2E6B62",
};

/* =========================================================================
   GLOBAL CSS (Enhanced with Responsive Media Queries & Print Layout)
   ========================================================================= */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: ${C.void};
  color: ${C.text};
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
  width: 100%;
}

button, input, select, textarea { font: inherit; }

.moil-root {
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${C.text};
  background: ${C.void};
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  overflow-x: clip;
}

.landing-shell {
  background:
    radial-gradient(circle at 78% 18%, rgba(79, 179, 166, 0.11), transparent 26%),
    radial-gradient(circle at 12% 18%, rgba(193, 98, 45, 0.13), transparent 28%),
    linear-gradient(180deg, #15120e 0%, ${C.void} 70%);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  align-items: center;
  gap: clamp(42px, 7vw, 100px);
}

.hero-copy { max-width: 690px; }

.hero-title {
  font-size: clamp(42px, 5.5vw, 76px);
  letter-spacing: -2.2px;
  line-height: 0.98;
  max-width: 720px;
}

.hero-console {
  position: relative;
  min-height: 405px;
  border: 1px solid rgba(221, 129, 72, 0.38);
  background: linear-gradient(145deg, rgba(36, 31, 23, 0.96), rgba(17, 15, 11, 0.76));
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35), inset 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.hero-console::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(237, 229, 211, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(237, 229, 211, 0.045) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(135deg, black, transparent 78%);
  pointer-events: none;
}

.hero-console-pulse { animation: moil-pulse-soft 3.5s ease-in-out infinite; }

.trust-strip {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  color: ${C.mutedDark};
}

@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; gap: 44px; }
  .hero-console { min-height: 360px; max-width: 620px; }
}

@media (max-width: 520px) {
  .hero-title { letter-spacing: -1.2px; }
  .hero-console { min-height: 330px; }
  .hero-console-metrics { grid-template-columns: 1fr 1fr !important; }
  .hero-console-metrics > :last-child { grid-column: 1 / -1; }
}

main > section,
main > div {
  scroll-margin-top: 76px;
}

.section-progress-rail {
  position: fixed;
  top: 50%;
  right: 18px;
  z-index: 90;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  transform: translateY(-50%);
  pointer-events: none;
}

.section-progress-dot {
  width: 5px;
  height: 5px;
  border: 1px solid ${C.mutedDark};
  border-radius: 50%;
  background: transparent;
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}

.section-progress-dot.active {
  transform: scale(1.8);
  background: ${C.oreLight};
  border-color: ${C.oreLight};
}

@media (max-width: 768px) {
  .section-progress-rail { right: 8px; gap: 7px; }
  .section-progress-dot { width: 4px; height: 4px; }
}

.moil-mono { font-family: 'IBM Plex Mono', monospace; }

.moil-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.moil-scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
.moil-scroll::-webkit-scrollbar-track { background: transparent; }

@keyframes moil-pulse {
  0% { transform: scale(0.55); opacity: 0.85; }
  100% { transform: scale(1.7); opacity: 0; }
}
@keyframes moil-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes moil-globe-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes moil-twinkle {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.9; }
}
@keyframes moil-magma-dash {
  from { stroke-dashoffset: 56; }
  to { stroke-dashoffset: 0; }
}
@keyframes moil-beam-pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.6; }
}
@keyframes moil-pulse-soft {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}
@keyframes moil-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.moil-orbit-sat {
  offset-path: path("M 40,150 A 190,70 0 1,1 420,150 A 190,70 0 1,1 40,150");
  offset-rotate: 0deg;
  animation: moil-orbit 16s linear infinite;
}
@keyframes moil-orbit {
  from { offset-distance: 0%; }
  to { offset-distance: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
  .section-progress-dot { transition: none; }
}

.moil-reveal {
  transition: opacity 0.7s cubic-bezier(.16,.8,.3,1), transform 0.7s cubic-bezier(.16,.8,.3,1);
}

.moil-navlink {
  position: relative;
  cursor: pointer;
  padding: 6px 0;
  transition: color 0.2s ease;
}
.moil-navlink::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 0%;
  background: ${C.ore};
  transition: width 0.25s ease;
}
.moil-navlink.active::after, .moil-navlink:hover::after { width: 100%; }

input[type="range"] {
  accent-color: ${C.ore};
  height: 6px;
  background: ${C.border};
  border-radius: 3px;
  cursor: pointer;
}

.mobile-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 15, 11, 0.75);
  backdrop-filter: blur(8px);
  z-index: 150;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.mobile-drawer-backdrop.open { opacity: 1; pointer-events: auto; }

.mobile-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 290px;
  max-width: 84vw;
  background: ${C.panelRaised};
  border-left: 1px solid ${C.borderLight};
  z-index: 160;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: -10px 0 30px rgba(0,0,0,0.5);
}
.mobile-drawer.open { transform: translateX(0); }

/* Print Styles for Official DGMS Handover Dossier */
@media print {
  body * { visibility: hidden; }
  #printable-dossier, #printable-dossier * { visibility: visible; }
  #printable-dossier {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: #fff !important;
    color: #000 !important;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .hero-stats-row { flex-direction: column !important; gap: 20px !important; }
  .compare-grid { grid-template-columns: 1fr !important; }
  .landing-shell main > section { padding-left: 16px !important; padding-right: 16px !important; }
  .control-room-layout { min-width: 0; }
  .dashboard-nav-sidebar { min-width: 0; }
  .dashboard-nav-item { flex: 0 0 auto; width: auto !important; }
  .compare-table-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
  .compare-table { min-width: 680px; grid-template-columns: 1.1fr 1fr 1.1fr !important; }
}

@media (max-width: 520px) {
  .section-progress-rail { display: none; }
  .hero-console { width: 100%; }
  .mobile-drawer { padding: 20px; }
}

@keyframes moil-burst-particle {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--bx), var(--by)) scale(0.3); opacity: 0; }
}
.moil-burst-layer { position: fixed; inset: 0; pointer-events: none; z-index: 500; overflow: hidden; }
.moil-burst-particle { position: absolute; top: 50%; left: 50%; border-radius: 50%; animation: moil-burst-particle 1.1s cubic-bezier(.2,.7,.3,1) forwards; }
`;

/* =========================================================================
   TRANSLATIONS (English, Hindi, Marathi)
   ========================================================================= */
const T = {
  en: {
    langName: "English",
    navProblem: "The Problem",
    navSolution: "Approach",
    navSites: "Real Sites",
    navPipeline: "How it Works",
    navDashboard: "Control Room",
    navCompare: "Why it Wins",
    heroEyebrow: "MOIL × AI/ML × SPACE TECHNOLOGY",
    heroTitle: "Manganese reserves, mapped before you drill.",
    heroSub: "One unified platform fusing satellite spectral indicators, geological borehole assays, and equipment telemetry to discover ore, forecast production shortfalls, and prescribe shift-floor actions.",
    heroCta: "Launch Control Room",
    heroSecondary: "Explore Ground Truth",
    statMines: "Proven reserves, MOIL FY25",
    statAccuracy: "Shortfall prediction accuracy",
    statCorrelation: "Correlation on undrilled lease",
    problemEyebrow: "The Gap Today",
    problemTitle: "Manual surveys cannot keep pace with high-grade demand",
    problemBody: "Manganese reserve estimation still leans on manual core logging and drilling campaigns taking months to plan and execute. Production planning runs on static spreadsheets. Result: high-grade veins are found too late, and operational shortfalls get noticed only after costing days of output.",
    problemStat1: "of India's manganese market share held by MOIL",
    problemStat2: "of resources added from FY25 exploratory drilling",
    solutionEyebrow: "Three Systems, One Loop",
    solutionTitle: "The Mapper finds it. The Forecaster warns you. The Advisor tells you what to do.",
    sitesEyebrow: "Ground Truth Verified",
    sitesTitle: "Four Real MOIL Mining Districts, Real FY2019-20 Output",
    sitesSource: "Source: Indian Minerals Yearbook 2020, Indian Bureau of Mines (IBM)",
    pillar1Title: "The Mapper",
    pillar1Body: "Fuses NDVI, thermal anomalies, and soil moisture from Sentinel & MODIS with sparse borehole data to predict reserve probability across the entire 43.8 km² lease — not just the 8% that has been drilled.",
    pillar2Title: "The Forecaster",
    pillar2Body: "Learns from haulage downtime, blasting delays, and rainfall to predict shortfall risk 72 hours in advance, with an explainable percentage-point breakdown.",
    pillar3Title: "The Advisor",
    pillar3Body: "Translates every prediction into ranked, quantified interventions: reallocate dumpers, reschedule blasting windows, or reposition core drills.",
    pipelineEyebrow: "End to End",
    pipelineTitle: "From a satellite pixel to a shift-floor decision",
    step1t: "Ingest", step1b: "Satellite indices, core assays, telemetry, and weather feeds pulled daily.",
    step2t: "Predict", step2b: "Parallel models map reserve probability and forecast production risk.",
    step3t: "Explain", step3b: "Each risk metric is accompanied by explainable feature impact points.",
    step4t: "Dispatch", step4b: "Advisor engine outputs ranked actions with quantified tonnage recovery.",
    dashboardEyebrow: "Live Operations",
    dashboardTitle: "MOIL Mine Intelligence & Dispatch Console",
    compareEyebrow: "Competitive Edge",
    compareTitle: "Engineered for Shift Superintendents, Not Just Demo Slides",
    tabOverview: "Overview",
    tabReserve: "Reserve Heatmap",
    tabForecast: "Risk & What-If",
    tabActions: "Shift Directives",
    tab3D: "3D Strata & Shaft",
    tabDgms: "DGMS Safety Handover",
    tabUpload: "Custom CSV Uploader",
    tabNational: "National Reserves",
    tabEquipment: "Equipment Check Logs",
    tabExplorer3D: "3D Subsurface Explorer",
    switchMine: "Active Mine Site",
    exportShiftPlan: "Export Shift Directives (CSV)",
    drillDispatchBtn: "Dispatch Exploratory Drill",
    whatIfTitle: "Interactive 'What-If' Simulation Sandbox",
    whatIfSub: "Adjust shift parameters to recalculate ML shortfall risk and dynamic mitigations in real time.",
    rainfallLabel: "Rainfall (mm)",
    downtimeLabel: "Equipment Downtime (hrs)",
    blastingLabel: "Blasting Delay (hrs)",
    fleetLabel: "Active Rigs / Loaders",
    financialLoss: "Revenue at Risk",
    financialRecovered: "Recoverable Revenue",
    footerEyebrow: "Ready for Production Deployment",
    footerTitle: "Take it for a spin, or bring it to your next technical review.",
    footerCta: "Back to Top",
    footerNote: "Calibrated to official Indian Bureau of Mines (IBM) statistics and MOIL operational benchmarks. Available in English, Hindi, and Marathi."
  },
  hi: {
    langName: "हिन्दी",
    navProblem: "समस्या",
    navSolution: "समाधान",
    navSites: "वास्तविक खदानें",
    navPipeline: "कार्यप्रणाली",
    navDashboard: "कंट्रोल रूम",
    navCompare: "विशेषताएँ",
    heroEyebrow: "MOIL × AI/ML × अंतरिक्ष तकनीक",
    heroTitle: "खनन से पहले मैंगनीज़ भंडार की सटीक पहचान।",
    heroSub: "एक ऐसा एकीकृत प्लेटफ़ॉर्म जो उपग्रह संकेतकों, बोरहोल नमूनों और मशीनरी टेलीमेट्री को मिलाकर अयस्क खोजता है, उत्पादन की कमी का पहले से अनुमान लगाता है, और टीम को स्पष्ट निर्देश देता है।",
    heroCta: "कंट्रोल रूम खोलें",
    heroSecondary: "वास्तविक डेटा देखें",
    statMines: "सिद्ध भंडार, MOIL वित्त वर्ष 2024-25",
    statAccuracy: "उत्पादन कमी पूर्वानुमान सटीकता",
    statCorrelation: "बिना खुदाई वाले क्षेत्र में मॉडल सहसंबंध",
    problemEyebrow: "वर्तमान चुनौती",
    problemTitle: "पारंपरिक सर्वेक्षण मांग की गति से पीछे रह जाते हैं",
    problemBody: "भंडार का अनुमान अभी भी महीनों चलने वाले ड्रिलिंग अभियानों और मैनुअल लॉगिंग पर निर्भर है। उत्पादन योजना स्थिर स्प्रेडशीट पर चलती है। परिणामस्वरूप उच्च श्रेणी के अयस्क देर से मिलते हैं और उत्पादन घाटा दिनों बाद पता चलता है।",
    problemStat1: "भारत के मैंगनीज अयस्क बाजार में MOIL की हिस्सेदारी",
    problemStat2: "वित्त वर्ष 25 की रिकॉर्ड खोजपूर्ण ड्रिलिंग से नए संसाधन",
    solutionEyebrow: "तीन प्रणालियाँ, एक चक्र",
    solutionTitle: "मैपर खोजता है। फ़ोरकास्टर चेतावनी देता है। एडवाइज़र बताता है क्या करें।",
    sitesEyebrow: "सत्यापित जमीनी डेटा",
    sitesTitle: "MOIL के चार वास्तविक खनन जिले, FY2019-20 का वास्तविक उत्पादन",
    sitesSource: "स्रोत: इंडियन मिनरल्स ईयरबुक 2020, इंडियन ब्यूरो ऑफ माइन्स (IBM)",
    pillar1Title: "मैपर",
    pillar1Body: "सेंटिनल और मोडिस से प्राप्त एनडीवीआई व भू-तापमान को सीमित बोरहोल डेटा से जोड़कर पूरे 43.8 किमी² क्षेत्र में भंडार की संभावना बताता है।",
    pillar2Title: "फ़ोरकास्टर",
    pillar2Body: "डंपर डाउनटाइम, ब्लास्टिंग में देरी और वर्षा से सीखकर 72 घंटे पहले उत्पादन जोखिम का पूर्वानुमान लगाता है।",
    pillar3Title: "एडवाइज़र",
    pillar3Body: "हर पूर्वानुमान को ठोस कार्यों में बदलता है: डंपर पुनः आवंटित करें, ब्लास्टिंग समय बदलें या कोर ड्रिल तैनात करें।",
    pipelineEyebrow: "आरंभ से अंत तक",
    pipelineTitle: "उपग्रह पिक्सेल से लेकर शिफ्ट-फ्लोर के निर्णय तक",
    step1t: "संग्रह", step1b: "उपग्रह सूचकांक, कोर नमूने, टेलीमेट्री और मौसम डेटा का दैनिक एकीकरण।",
    step2t: "पूर्वानुमान", step2b: "भंडार मानचित्रण और उत्पादन जोखिम मॉडल समानांतर चलते हैं।",
    step3t: "स्पष्टीकरण", step3b: "हर जोखिम संख्या के साथ जिम्मेदार कारकों का स्पष्ट प्रतिशत विवरण।",
    step4t: "निर्देश", step4b: "एडवाइज़र इंजन प्राथमिकता-क्रम में ठोस कदमों की सूची तैयार करता है।",
    dashboardEyebrow: "लाइव संचालन",
    dashboardTitle: "MOIL खदान बुद्धिमत्ता एवं नियंत्रण केंद्र",
    compareEyebrow: "सर्वश्रेष्ठता",
    compareTitle: "वास्तविक खदान संचालन के लिए निर्मित",
    tabOverview: "अवलोकन",
    tabReserve: "भंडार हीटमैप",
    tabForecast: "जोखिम व सिमुलेशन",
    tabActions: "शिफ्ट निर्देश",
    tab3D: "3D स्ट्रैट व शाफ्ट",
    tabDgms: "DGMS सुरक्षा हैंडओवर",
    tabUpload: "कस्टम CSV अपलोड",
    tabNational: "राष्ट्रीय भंडार",
    tabEquipment: "उपकरण जांच लॉग",
    tabExplorer3D: "3D उप-सतह अन्वेषक",
    switchMine: "सक्रिय खदान",
    exportShiftPlan: "शिफ्ट निर्देश डाउनलोड करें (CSV)",
    drillDispatchBtn: "कोर ड्रिलिंग टीम भेजें",
    whatIfTitle: "इंटरएक्टिव 'What-If' सिमुलेशन सैंडबॉक्स",
    whatIfSub: "शिफ्ट मापदंडों को बदलकर वास्तविक समय में जोखिम और बचाव उपायों का आकलन करें।",
    rainfallLabel: "वर्षा (मिमी)",
    downtimeLabel: "उपकरण डाउनटाइम (घंटे)",
    blastingLabel: "ब्लास्टिंग में देरी (घंटे)",
    fleetLabel: "सक्रिय मशीनरी बेड़ा",
    financialLoss: "जोखिम में राजस्व",
    financialRecovered: "बचाया जा सकने वाला राजस्व",
    footerEyebrow: "उत्पादन उपयोग हेतु तैयार",
    footerTitle: "इसे अभी परखें, या अपनी अगली तकनीकी समीक्षा में प्रस्तुत करें।",
    footerCta: "ऊपर वापस जाएँ",
    footerNote: "इंडियन ब्यूरो ऑफ माइन्स (IBM) के आंकड़ों और MOIL मानकों पर आधारित। अंग्रेज़ी, हिन्दी और मराठी में उपलब्ध।"
  },
  mr: {
    langName: "मराठी",
    navProblem: "समस्या",
    navSolution: "दृष्टिकोन",
    navSites: "प्रत्यक्ष खाणी",
    navPipeline: "कार्यप्रणाली",
    navDashboard: "कंट्रोल रूम",
    navCompare: "तुलना",
    heroEyebrow: "MOIL × AI/ML × अंतराळ तंत्रज्ञान",
    heroTitle: "उत्खननाआधीच मॅंगनीज साठ्यांचा अचूक नकाशा.",
    heroSub: "उपग्रह निर्देशक, भूवैज्ञानिक बोरहोल नमुने आणि उपकरणांची टेलीमेट्री एकत्र करून अयस्क शोधणारे आणि उत्पादनातील तूट आधीच रोखणारे व्यासपीठ.",
    heroCta: "कंट्रोल रूममध्ये जा",
    heroSecondary: "खरी आकडेवारी पाहा",
    statMines: "सिद्ध साठे, MOIL आर्थिक वर्ष 25",
    statAccuracy: "उत्पादन तूट अंदाज अचूकता",
    statCorrelation: "न खोदलेल्या क्षेत्रातील मॉडेल अचूकता",
    problemEyebrow: "आजची अडचण",
    problemTitle: "मॅन्युअल सर्वेक्षणे वाढत्या मागणीशी स्पर्धा करू शकत नाहीत",
    problemBody: "साठ्यांचा अंदाज अजूनही महिनोनमहिने चालणाऱ्या ड्रिलिंग मोहिमांवर अवलंबून आहे. उत्पादन नियोजन जुन्या स्प्रेडशीटवर चालते, ज्यामुळे वेळेवर निर्णय घेणे अशक्य होते.",
    problemStat1: "भारताच्या मॅंगनीज बाजारपेठेत MOIL चा वाटा",
    problemStat2: "आर्थिक वर्ष 25 मधील नवीन जोडलेली संसाधने",
    solutionEyebrow: "तीन प्रणाली, एक चक्र",
    solutionTitle: "मॅपर शोधतो. फोरकास्टर इशारा देतो. अ‍ॅडव्हायझर उपाय सांगतो.",
    sitesEyebrow: "प्रत्यक्ष जमिनीवरील आकडेवारी",
    sitesTitle: "MOIL चे चार जिल्हे, FY2019-20 चे प्रत्यक्ष उत्पादन",
    sitesSource: "स्रोत: इंडियन मिनरल्स इयरबुक 2020, इंडियन ब्युरो ऑफ माइन्स (IBM)",
    pillar1Title: "मॅपर",
    pillar1Body: "सेंटिनेल व मोडिसच्या उपग्रह डेटाचा वापर करून संपूर्ण 43.8 चौ.किमी क्षेत्रात साठ्यांची संभाव्यता दर्शवतो.",
    pillar2Title: "फोरकास्टर",
    pillar2Body: "यंत्रांचा डाउनटाइम, स्फोटातील विलंब आणि पावसावरून 72 तास आधीच उत्पादनातील तुटीचा इशारा देतो.",
    pillar3Title: "अ‍ॅडव्हायझर",
    pillar3Body: "प्रत्येक इशाऱ्याचे रूपांतर ठोस उपायांमध्ये करतो: डंपर पुनर्वाटप, स्फोटाची वेळ बदलणे किंवा कोर ड्रिल पाठवणे.",
    pipelineEyebrow: "सुरुवातीपासून शेवटपर्यंत",
    pipelineTitle: "उपग्रह पिक्सेलपासून शिफ्ट-फ्लोअर निर्णयापर्यंत",
    step1t: "संकलन", step1b: "उपग्रह निर्देशांक, कोर नमुने, यंत्र नोंदी आणि हवामान डेटाचे दैनंदिन संकलन.",
    step2t: "अंदाज", step2b: "साठा नकाशा आणि उत्पादन धोका अंदाज समांतरपणे चालतात.",
    step3t: "स्पष्टीकरण", step3b: "प्रत्येक जोखीम गुणांकामागील घटकांचे टक्केवारीनुसार स्पष्टीकरण.",
    step4t: "कृती", step4b: "अ‍ॅडव्हायझर इंजिन प्राधान्यक्रमाने आवश्यक उपाय सुचवते.",
    dashboardEyebrow: "थेट संचलन",
    dashboardTitle: "MOIL खाण बुद्धिमत्ता व नियंत्रण कक्ष",
    compareEyebrow: "स्पर्धेतील श्रेष्ठत्व",
    compareTitle: "खाण प्रत्यक्ष चालवण्यासाठी विकसित केलेली प्रणाली",
    tabOverview: "आढावा",
    tabReserve: "साठा हीटमॅप",
    tabForecast: "जोखीम व अंदाज",
    tabActions: "शिफ्ट निर्देश",
    tab3D: "3D स्तर व शाफ्ट",
    tabDgms: "DGMS सुरक्षा हस्तांतरण",
    tabUpload: "कस्टम CSV अपलोड",
    tabNational: "राष्ट्रीय साठे",
    tabEquipment: "उपकरण तपासणी नोंदी",
    tabExplorer3D: "3D उप-पृष्ठभूमी एक्सप्लोरर",
    switchMine: "सक्रिय खाण ठिकाण",
    exportShiftPlan: "शिफ्ट निर्देश डाउनलोड करा (CSV)",
    drillDispatchBtn: "कोर ड्रिलिंग पथक पाठवा",
    whatIfTitle: "परस्परसंवादी 'What-If' सिमुलेशन सँडबॉक्स",
    whatIfSub: "शिफ्ट निकष बदलून प्रत्यक्ष वेळेत संभाव्य तूट आणि उपायांचे विश्लेषण करा.",
    rainfallLabel: "पाऊस (मिमी)",
    downtimeLabel: "यंत्रसामग्री डाउनटाइम (तास)",
    blastingLabel: "स्फोट विलंब (तास)",
    fleetLabel: "सक्रिय यंत्रसामग्री ताफा",
    financialLoss: "धोक्यात असलेला महसूल",
    financialRecovered: "वाचवता येणारा महसूल",
    footerEyebrow: "वापरासाठी सज्ज",
    footerTitle: "आताच अनुभव घ्या, किंवा पुढील तांत्रिक बैठकीत सादर करा.",
    footerCta: "वर परत जा",
    footerNote: "इंडियन ब्युरो ऑफ माइन्स (IBM) आकडेवारीवर आधारित. इंग्रजी, हिंदी आणि मराठीत उपलब्ध."
  }
};

const LangContext = createContext({ lang: "en", t: T.en });
const useT = () => useContext(LangContext).t;

/* =========================================================================
   SYNTHESIZED WEB AUDIO FEEDBACK (Zero external files needed)
   ========================================================================= */
let industrialAudioContext;

function playIndustrialChime(type = "success") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    industrialAudioContext ||= new AudioContext();
    const ctx = industrialAudioContext;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "alert") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(260, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {}
}

/* =========================================================================
   HOOKS
   ========================================================================= */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, variant = "up", delay = 0, style, className = "" }) {
  const [ref, visible] = useReveal();
  const transforms = {
    up: "translateY(24px)", left: "translateX(-24px)", right: "translateX(24px)", scale: "scale(0.95)",
  };
  return (
    <div
      ref={ref}
      className={`moil-reveal ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[variant],
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedNumber({ target, decimals = 0, suffix = "" }) {
  const [ref, visible] = useReveal(0.4);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const dur = 1200;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target]);
  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>;
}

function useSectionSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

function useParallax(ref, strength = 0.16) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const element = ref.current;
        if (!element) return;
        const bounds = element.getBoundingClientRect();
        const distance = (window.innerHeight / 2) - (bounds.top + bounds.height / 2);
        setOffset(distance * strength);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref, strength]);

  return offset;
}

function ParallaxBackdrop({ sectionRef, children }) {
  const offset = useParallax(sectionRef);
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: "-14% 0", zIndex: -1, transform: `translate3d(0, ${offset}px, 0)`, transition: "transform 80ms linear", pointerEvents: "none", opacity: 0.32 }}
    >
      {children}
    </div>
  );
}

/* =========================================================================
   TOP PROGRESS BAR
   ========================================================================= */
function TopProgressBar() {
  const [w, setW] = useState(0);
  useEffect(() => {
    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setW(h > 0 ? (window.scrollY / h) * 100 : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, height: 2.5, width: `${w}%`, background: `linear-gradient(90deg, ${C.ore}, ${C.oreLight})`, zIndex: 120, transition: "width 0.05s linear" }} />
  );
}

function SectionProgressRail() {
  const ids = ["hero", "problem", "solution", "sites", "pipeline", "dashboard", "compare"];
  const active = useSectionSpy(ids);
  return (
    <div className="section-progress-rail" aria-hidden="true">
      {ids.map((id) => <span key={id} className={`section-progress-dot ${active === id ? "active" : ""}`} />)}
    </div>
  );
}

/* =========================================================================
   LANGUAGE SWITCHER
   ========================================================================= */
function LangSwitch({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const clickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="moil-mono"
        style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 12,
          border: `1px solid ${C.borderLight}`, padding: "6px 10px", cursor: "pointer",
          color: C.text, background: C.panelRaised, borderRadius: 2
        }}
        aria-label="Change Language"
      >
        <Globe size={13} color={C.oreLight} /> {T[lang].langName} <ChevronDown size={11} color={C.muted} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: C.panelRaised, border: `1px solid ${C.borderLight}`,
          minWidth: 125, zIndex: 130, boxShadow: "0 8px 24px rgba(0,0,0,0.6)", borderRadius: 2
        }}>
          {Object.keys(T).map((code) => (
            <div
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                padding: "8px 12px", fontSize: 12.5, cursor: "pointer",
                color: code === lang ? C.oreLight : C.text,
                background: code === lang ? C.panel : "transparent",
                borderBottom: `1px solid ${C.border}`
              }}
            >
              {T[code].langName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   RESPONSIVE NAVIGATION
   ========================================================================= */
function Nav({ lang, setLang, audioMuted, setAudioMuted }) {
  const t = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ids = ["problem", "solution", "sites", "pipeline", "dashboard", "compare"];
  const active = useSectionSpy(ids);
  const labels = {
    problem: t.navProblem,
    solution: t.navSolution,
    sites: t.navSites,
    pipeline: t.navPipeline,
    dashboard: t.navDashboard,
    compare: t.navCompare,
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setDrawerOpen(false);
  };

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", background: "rgba(17,15,11,0.92)", backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Brand */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: C.panelRaised,
            border: `1px solid ${C.ore}`, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Satellite size={15} color={C.oreLight} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ letterSpacing: "0.5px" }}>MANGNEX</span>
            <span className="moil-mono" style={{ fontSize: 9.5, color: C.safe, letterSpacing: "0.3px" }}>● SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Desktop Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <style>{`
            @media (max-width: 860px) {
              .desktop-nav-links { display: none !important; }
              .mobile-nav-toggle { display: flex !important; }
            }
            @media (min-width: 861px) {
              .desktop-nav-links { display: flex !important; }
              .mobile-nav-toggle { display: none !important; }
            }
          `}</style>
          <div className="desktop-nav-links" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {ids.map((id) => (
              <div
                key={id}
                onClick={() => scrollTo(id)}
                className={`moil-navlink ${active === id ? "active" : ""}`}
                style={{ fontSize: 12.5, color: active === id ? C.text : C.muted, fontWeight: active === id ? 600 : 400 }}
              >
                {labels[id]}
              </div>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const nextMuted = !audioMuted;
              setAudioMuted(nextMuted);
              if (!nextMuted) playIndustrialChime("success");
            }}
            title={audioMuted ? "Enable interface sounds" : "Disable interface sounds"}
            aria-label={audioMuted ? "Enable interface sounds" : "Disable interface sounds"}
            style={{
              background: C.panelRaised, border: `1px solid ${C.borderLight}`,
              color: audioMuted ? C.mutedDark : C.oreLight, cursor: "pointer",
              padding: "6px 8px", borderRadius: 2, display: "flex", alignItems: "center"
            }}
          >
            {audioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <LangSwitch lang={lang} setLang={setLang} />

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setDrawerOpen((o) => !o)}
            style={{
              display: "none", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, background: C.panelRaised, border: `1px solid ${C.borderLight}`,
              color: C.text, cursor: "pointer", borderRadius: 3
            }}
            aria-label="Toggle Menu"
          >
            {drawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </header>

      {/* Mobile Slide-in Drawer */}
      <div
        className={`mobile-drawer-backdrop ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`mobile-drawer ${drawerOpen ? "open" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
            <Satellite size={16} color={C.oreLight} /> MOIL Navigation
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {ids.map((id) => (
            <div
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                padding: "12px 14px",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: active === id ? 600 : 400,
                color: active === id ? C.oreLight : C.text,
                background: active === id ? C.panel : "transparent",
                borderLeft: active === id ? `3px solid ${C.ore}` : "3px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>{labels[id]}</span>
              <ChevronRight size={14} color={C.mutedDark} />
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark, marginBottom: 8 }}>LANGUAGE SELECT</div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.keys(T).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                style={{
                  flex: 1, padding: "8px 6px", fontSize: 11.5,
                  background: lang === code ? C.ore : C.panel,
                  color: lang === code ? C.void : C.text,
                  border: `1px solid ${lang === code ? C.oreLight : C.border}`,
                  cursor: "pointer", borderRadius: 2, fontWeight: 600
                }}
              >
                {T[code].langName}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

/* =========================================================================
   MAGNETIC BUTTON
   ========================================================================= */
function MagneticButton({ children, onClick, secondary = false, style }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.2;
    const y = (e.clientY - r.top - r.height / 2) * 0.2;
    setPos({ x, y });
  };

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      onClick={onClick}
      className="moil-mono"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "12px 24px",
        background: secondary ? C.panelRaised : C.ore,
        color: secondary ? C.text : C.void,
        border: `1px solid ${secondary ? C.borderLight : C.oreLight}`,
        fontWeight: 600, fontSize: 13,
        cursor: "pointer",
        borderRadius: 2,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.15s ease-out, background 0.2s ease",
        ...style
      }}
    >
      {children}
    </button>
  );
}

/* =========================================================================
   IMMERSIVE HERO BACKGROUND
   ========================================================================= */
function ImmersiveBG() {
  const stars = useMemo(() => {
    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    return Array.from({ length: 42 }).map((_, i) => ({
      cx: rand() * 1200, cy: rand() * 320, r: rand() * 1.3 + 0.3, delay: rand() * 4,
    }));
  }, []);

  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMin slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.88 }}
    >
      <defs>
        <radialGradient id="spaceGrad" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor={C.panelRaised} />
          <stop offset="100%" stopColor={C.void} />
        </radialGradient>
        <radialGradient id="earthOcean" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#1E4A52" />
          <stop offset="60%" stopColor="#122F36" />
          <stop offset="100%" stopColor="#0A1B1F" />
        </radialGradient>
        <clipPath id="earthClip"><circle cx="980" cy="130" r="190" /></clipPath>
        <linearGradient id="magmaLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.ore} stopOpacity="0" />
          <stop offset="55%" stopColor={C.ore} stopOpacity="0.55" />
          <stop offset="100%" stopColor={C.risk} stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="magmaPool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.oreLight} stopOpacity="0.9" />
          <stop offset="45%" stopColor={C.risk} stopOpacity="0.55" />
          <stop offset="100%" stopColor={C.risk} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.atmosphere} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.atmosphere} stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="360" fill="url(#spaceGrad)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={C.text}
          style={{ animation: `moil-twinkle 3.5s ease-in-out ${s.delay}s infinite` }} />
      ))}

      {/* Earth sphere */}
      <g clipPath="url(#earthClip)">
        <circle cx="980" cy="130" r="190" fill="url(#earthOcean)" />
        <g style={{ transformOrigin: "980px 130px", animation: "moil-globe-rotate 90s linear infinite" }}>
          {[[900, 60, 46, 26], [1040, 90, 34, 20], [930, 170, 40, 24], [1080, 190, 30, 34], [1010, 210, 24, 16], [850, 130, 26, 40]].map((p, i) => (
            <ellipse key={i} cx={p[0]} cy={p[1]} rx={p[2]} ry={p[3]} fill={C.mutedDark} opacity="0.55" />
          ))}
        </g>
      </g>
      <circle cx="980" cy="130" r="191" fill="none" stroke={C.atmosphereDim} strokeWidth="1" opacity="0.5" />

      {/* Orbiting Satellite */}
      <g className="moil-orbit-sat">
        <g transform="scale(2.4)">
          <rect x="-34" y="-7" width="22" height="14" fill={C.atmosphereDim} stroke={C.atmosphere} strokeWidth="0.8" />
          <rect x="12" y="-7" width="22" height="14" fill={C.atmosphereDim} stroke={C.atmosphere} strokeWidth="0.8" />
          <line x1="-12" y1="0" x2="12" y2="0" stroke={C.text} strokeWidth="1.4" />
          <rect x="-7" y="-9" width="14" height="18" rx="1.5" fill={C.text} />
          <circle cx="0" cy="-21" r="3" fill="none" stroke={C.atmosphere} strokeWidth="1.2" />
        </g>
        <polygon
          points="-28,18 28,18 66,155 -66,155"
          fill="url(#beamGrad)"
          style={{ animation: "moil-beam-pulse 4.5s ease-in-out infinite" }}
        />
      </g>

      {/* Rock Strata Cross-section */}
      <g>
        {[[430, 90, C.panel], [520, 78, C.panelRaised], [598, 66, C.panel], [664, 60, C.panelRaised], [724, 76, C.panel]].map((band, i) => (
          <rect key={i} x="0" y={band[0]} width="1200" height={band[1]} fill={band[2]} />
        ))}
      </g>

      {/* Magma Fissures */}
      {[
        "M900,455 L888,500 L908,540 L884,585 L902,625 L886,665 L900,715",
        "M1000,455 L1014,500 L990,540 L1010,590 L994,635 L1012,680 L1000,715",
        "M1082,455 L1068,505 L1088,545 L1066,595 L1084,640 L1070,685 L1080,715",
      ].map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={C.risk} strokeWidth="11" opacity="0.35" />
          <path d={d} fill="none" stroke="url(#magmaLine)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray="15 11" style={{ animation: `moil-magma-dash ${1.6 + i * 0.3}s linear infinite` }} />
        </g>
      ))}

      <ellipse cx="1000" cy="720" rx="170" ry="32" fill="url(#magmaPool)" style={{ animation: "moil-pulse-soft 3.4s ease-in-out infinite" }} />
    </svg>
  );
}

/* =========================================================================
   HERO SECTION
   ========================================================================= */
function Hero() {
  const t = useT();
  return (
    <section id="hero" style={{
      position: "relative", minHeight: "100dvh",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "132px 24px 72px", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <ImmersiveBG />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 0%, transparent 85%, ${C.void} 100%)` }} />
      </div>

      <div className="hero-grid" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
        <div className="hero-copy">
          <Reveal variant="up">
            <div className="moil-mono" style={{ fontSize: 11, color: C.oreLight, letterSpacing: 1.7, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <Radar size={14} color={C.oreLight} /> {t.heroEyebrow}
            </div>
          </Reveal>

          <Reveal variant="up" delay={70}>
            <h1 className="hero-title" style={{ fontWeight: 700, margin: "0 0 24px" }}>{t.heroTitle}</h1>
          </Reveal>

          <Reveal variant="up" delay={140}>
            <p style={{ fontSize: "clamp(15px, 1.8vw, 17px)", color: C.muted, maxWidth: 610, lineHeight: 1.65, margin: "0 0 32px" }}>{t.heroSub}</p>
          </Reveal>

          <Reveal variant="up" delay={210}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 42 }}>
              <MagneticButton onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}>{t.heroCta} <ArrowUpRight size={15} /></MagneticButton>
              <MagneticButton secondary onClick={() => document.getElementById("sites")?.scrollIntoView({ behavior: "smooth" })}>{t.heroSecondary}</MagneticButton>
            </div>
          </Reveal>

          <Reveal variant="up" delay={300}>
            <div className="trust-strip">
              <ShieldCheck size={17} color={C.safe} />
              <span style={{ fontSize: 12.5 }}>Grounded in IBM and MOIL operating data</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.borderLight }} />
              <span className="moil-mono" style={{ fontSize: 10 }}>FY19–20 VERIFIED</span>
            </div>
          </Reveal>
        </div>

        <Reveal variant="right" delay={160}>
          <div className="hero-console" aria-label="Live mining intelligence preview">
            <div style={{ position: "relative", zIndex: 1, padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark, letterSpacing: 1.2 }}>MANGNEX / CONTROL ROOM</div><div style={{ fontSize: 15, fontWeight: 600, marginTop: 5 }}>Balaghat Mine Intelligence</div></div>
              <div className="moil-mono" style={{ color: C.safe, fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.safe }} /> LIVE</div>
            </div>
            <div style={{ position: "relative", zIndex: 1, padding: 20 }}>
              <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark, letterSpacing: 1 }}>RESERVE PROBABILITY FIELD</div>
              <div style={{ height: 150, margin: "14px 0 20px", position: "relative", background: "radial-gradient(circle at 66% 36%, rgba(221,129,72,.86) 0 2%, rgba(193,98,45,.48) 11%, transparent 32%), radial-gradient(circle at 35% 72%, rgba(79,179,166,.58) 0 3%, rgba(79,179,166,.14) 18%, transparent 38%), linear-gradient(135deg, rgba(45,38,28,.8), rgba(17,15,11,.2))", border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: "18% 10%", border: `1px solid ${C.oreLight}`, borderRadius: "50% 40% 55% 35%", opacity: .7, transform: "rotate(-18deg)" }} />
                <div className="hero-console-pulse" style={{ position: "absolute", width: 12, height: 12, borderRadius: "50%", background: C.oreLight, boxShadow: `0 0 0 8px rgba(221,129,72,.16), 0 0 24px ${C.oreLight}`, left: "65%", top: "34%" }} />
                <span className="moil-mono" style={{ position: "absolute", right: 10, bottom: 8, fontSize: 9, color: C.mutedDark }}>43.8 KM² LEASE</span>
              </div>
              <div className="hero-console-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[["87.7%", "forecast accuracy", C.safe], ["72h", "early warning", C.oreLight], ["+84t", "recoverable shift", C.atmosphere]].map(([value, label, color]) => <div key={label} style={{ padding: "12px 10px", background: "rgba(26,23,18,.82)", border: `1px solid ${C.border}` }}><div style={{ color, fontSize: 19, fontWeight: 700 }}>{value}</div><div style={{ color: C.mutedDark, fontSize: 10, lineHeight: 1.3, marginTop: 4 }}>{label}</div></div>)}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal variant="up" delay={360} style={{ gridColumn: "1 / -1" }}>
          <div className="hero-stats-row" style={{
            display: "flex", gap: 36, flexWrap: "wrap",
            paddingTop: 24, borderTop: `1px solid ${C.border}`, marginTop: 8
          }}>
            <div>
              <div style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 700, color: C.oreLight }}>
                <AnimatedNumber target={53.47} decimals={2} />Mt
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, maxWidth: 170, marginTop: 4 }}>{t.statMines}</div>
            </div>
            <div>
              <div style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 700, color: C.safe }}>
                <AnimatedNumber target={87.7} decimals={1} suffix="%" />
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, maxWidth: 170, marginTop: 4 }}>{t.statAccuracy}</div>
            </div>
            <div>
              <div style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 700, color: C.atmosphere }}>
                <AnimatedNumber target={0.84} decimals={2} />
              </div>
              <div style={{ fontSize: 12.5, color: C.muted, maxWidth: 170, marginTop: 4 }}>{t.statCorrelation}</div>
            </div>
          </div>
        </Reveal>
        <div
          aria-hidden="true"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 42, width: "fit-content", color: C.mutedDark, animation: "moil-pulse-soft 2.8s ease-in-out infinite" }}
        >
          <span className="moil-mono" style={{ fontSize: 9, letterSpacing: 1.5 }}>SCROLL TO EXPLORE</span>
          <ChevronDown size={16} color={C.oreLight} />
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   PROBLEM SECTION
   ========================================================================= */
function Problem() {
  const t = useT();
  return (
    <section id="problem" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <Reveal variant="up">
        <div className="moil-mono" style={{ fontSize: 11.5, color: C.mutedDark, letterSpacing: 1, marginBottom: 12 }}>
          {t.problemEyebrow}
        </div>
      </Reveal>
      <Reveal variant="up" delay={60}>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 700, maxWidth: 680, lineHeight: 1.2, marginBottom: 20 }}>
          {t.problemTitle}
        </h2>
      </Reveal>
      <Reveal variant="up" delay={120}>
        <p style={{ fontSize: 15.5, color: C.muted, maxWidth: 680, lineHeight: 1.7, marginBottom: 40 }}>
          {t.problemBody}
        </p>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
        <Reveal variant="left" delay={80}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.risk}`, padding: 22 }}>
            <div style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 700, color: C.text }}>
              <AnimatedNumber target={53} suffix="%" />
            </div>
            <div style={{ fontSize: 13.5, color: C.muted, marginTop: 8 }}>{t.problemStat1}</div>
          </div>
        </Reveal>

        <Reveal variant="left" delay={160}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.caution}`, padding: 22 }}>
            <div style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 700, color: C.text }}>
              <AnimatedNumber target={16.07} decimals={2} suffix="Mt" />
            </div>
            <div style={{ fontSize: 13.5, color: C.muted, marginTop: 8 }}>{t.problemStat2}</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* =========================================================================
   SOLUTION PILLARS (Dual-Mode)
   ========================================================================= */
function MiniMapGraphic() {
  const cells = useMemo(() => {
    const out = [];
    const blob = (x, y, cx, cy, s) => Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s)));
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        out.push({ x, y, p: Math.min(1, blob(x, y, 3, 7, 2.0) + blob(x, y, 7, 3, 1.5)) });
      }
    }
    return out;
  }, []);
  const shade = (p) => `rgb(${Math.round(28 + (193 - 28) * p)},${Math.round(25 + (98 - 25) * p)},${Math.round(20 + (45 - 20) * p)})`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 140 140" width="100%" style={{ maxWidth: 140 }}>
        {cells.map((c) => <rect key={`${c.x}-${c.y}`} x={c.x * 14} y={c.y * 14} width={13} height={13} fill={shade(c.p)} rx={1} />)}
      </svg>
      <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark, marginTop: 8 }}>
        Reserve Probability Matrix
      </div>
    </div>
  );
}

function MiniForecastGraphic() {
  const pts = [12, 18, 15, 30, 22, 45, 38, 62, 48, 71, 58, 82];
  const w = 150, h = 90, max = 90;
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * w} ${h - (v / max) * h}`).join(" ");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox={`0 0 ${w} ${h + 10}`} width="100%" style={{ maxWidth: w }}>
        <path d={path} fill="none" stroke={C.risk} strokeWidth={2.5} />
        {pts.map((v, i) => <circle key={i} cx={(i / (pts.length - 1)) * w} cy={h - (v / max) * h} r={2.8} fill={C.oreLight} />)}
      </svg>
      <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark, marginTop: 8 }}>
        Shortfall Hazard Curve
      </div>
    </div>
  );
}

function MiniAdvisorGraphic() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 160 }}>
      {[
        { label: "Dispatch Haulage", pri: "HIGH", val: "+84t" },
        { label: "Clear Blast Window", pri: "MED", val: "+43t" },
        { label: "Drainage Sump Pump", pri: "LOW", val: "+18t" },
      ].map((r, i) => (
        <div key={i} style={{ background: C.panelRaised, border: `1px solid ${C.border}`, padding: "8px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{r.label}</span>
            <span className="moil-mono" style={{ fontSize: 9.5, color: C.safe }}>{r.val}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SolutionPillars() {
  const t = useT();
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const pillars = [
    { title: t.pillar1Title, body: t.pillar1Body, icon: Map, graphic: <MiniMapGraphic /> },
    { title: t.pillar2Title, body: t.pillar2Body, icon: TrendingUp, graphic: <MiniForecastGraphic /> },
    { title: t.pillar3Title, body: t.pillar3Body, icon: Wrench, graphic: <MiniAdvisorGraphic /> },
  ];
  const [activeIdx, setActiveIdx] = useState(0);

  const selectPillar = (index) => {
    setActiveIdx(index);
    contentRef.current?.children[index]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <section
      ref={sectionRef}
      id="solution"
      style={{ position: "relative", isolation: "isolate", padding: "80px 24px", maxWidth: 1100, margin: "0 auto", overflow: "hidden" }}
    >
      <ParallaxBackdrop sectionRef={sectionRef}>
        <div style={{ position: "absolute", top: "18%", right: "4%", width: 280, height: 280, borderRadius: "50%", border: `1px solid ${C.atmosphereDim}`, boxShadow: `0 0 80px ${C.atmosphereDim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: "scale(1.7)" }}>{pillars[activeIdx].graphic}</div>
        </div>
      </ParallaxBackdrop>
      <Reveal variant="up">
        <div className="moil-mono" style={{ fontSize: 11.5, color: C.mutedDark, letterSpacing: 1, marginBottom: 12 }}>
          {t.solutionEyebrow}
        </div>
      </Reveal>
      <Reveal variant="up" delay={60}>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, maxWidth: 740, lineHeight: 1.2, marginBottom: 36 }}>
          {t.solutionTitle}
        </h2>
      </Reveal>

      {/* Tab Selectors */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {pillars.map((p, i) => {
          const Icon = p.icon;
          const isAct = i === activeIdx;
          return (
            <button
              key={i}
              onClick={() => selectPillar(i)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px",
                background: isAct ? C.panelRaised : C.panel,
                color: isAct ? C.oreLight : C.muted,
                border: `1px solid ${isAct ? C.ore : C.border}`,
                borderRadius: 2, cursor: "pointer",
                fontWeight: isAct ? 600 : 400,
                fontSize: 13,
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={15} color={isAct ? C.ore : C.mutedDark} />
              {p.title}
            </button>
          );
        })}
      </div>

      <div
        ref={contentRef}
        className="moil-scroll"
        onScroll={(event) => {
          const panel = event.currentTarget;
          const index = Math.round(panel.scrollTop / Math.max(1, panel.clientHeight));
          setActiveIdx(Math.min(pillars.length - 1, index));
        }}
        style={{ height: 310, overflowY: "auto", scrollBehavior: "smooth", background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 3 }}
      >
        {pillars.map((pillar, index) => (
          <article key={pillar.title} style={{ minHeight: 310, padding: "32px 28px", display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap", borderBottom: index < pillars.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ flex: "1 1 300px" }}>
              <span className="moil-mono" style={{ fontSize: 11, color: C.oreLight, background: C.panelRaised, padding: "2px 8px", border: `1px solid ${C.border}` }}>PILLAR 0{index + 1}</span>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: "16px 0 12px" }}>{pillar.title}</h3>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: 0 }}>{pillar.body}</p>
            </div>
            <div style={{ flexShrink: 0, width: "100%", maxWidth: 240, background: C.panelRaised, border: `1px solid ${C.border}`, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2 }}>{pillar.graphic}</div>
          </article>
        ))}
      </div>
      <div
        className="moil-mono"
        aria-live="polite"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, color: C.mutedDark, fontSize: 10 }}
      >
        <span>SCROLL TO EXPLORE</span>
        <span style={{ display: "flex", gap: 5 }}>
          {pillars.map((pillar, index) => (
            <span
              key={pillar.title}
              style={{ width: index === activeIdx ? 22 : 6, height: 4, background: index === activeIdx ? C.oreLight : C.borderLight, transition: "width 0.25s ease, background 0.25s ease" }}
            />
          ))}
        </span>
      </div>
    </section>
  );
}

/* =========================================================================
   REAL SITES JOURNEY
   ========================================================================= */
// Simplified, stylized India outline — schematic only, not cartographically
// precise (no real GeoJSON available in this environment). Site pins below
// ARE positioned proportionally correctly, computed from each town's real
// lat/long against India's actual bounding box (8-37°N, 68-97°E).
const INDIA_OUTLINE_PATH = "M150,10 C220,15 270,60 280,110 C290,160 260,190 230,200 C210,230 200,260 180,280 C165,295 155,300 150,295 C145,300 135,295 120,280 C100,260 90,230 70,200 C40,190 10,160 20,110 C30,60 80,15 150,10 Z";

function latLongToIndiaXY(lat, lon) {
  // India bounding box: lat 8-37°N, lon 68-97°E, mapped to a 300x300 box
  const x = ((lon - 68) / 29) * 300;
  const y = ((37 - lat) / 29) * 300;
  return { x, y };
}

function Site3DDepthView({ site }) {
  if (!site.isRealMoilMine) {
    return (
      <div style={{ padding: "28px 20px", textAlign: "center", background: C.void, border: `1px solid ${C.border}` }}>
        <Layers3 size={22} color={C.mutedDark} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
          {site.key} is a district-level production total across multiple operators — MOIL has no verified sub-surface profile here yet (exploration MoU only, signed 2025). No 3D depth view to show honestly.
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: "20px 10px 8px", perspective: 700, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: "rotateX(52deg) rotateZ(-28deg)", transformStyle: "preserve-3d", width: 220 }}>
        {GEOLOGICAL_STRATA.map((layer, i) => (
          <div
            key={layer.depthRange}
            style={{
              width: 220 - i * 14, height: 34, margin: "0 auto",
              background: i === GEOLOGICAL_STRATA.length - 1 ? `linear-gradient(90deg, ${C.risk}, ${C.oreLight})` : C.panelRaised,
              border: `1px solid ${i === GEOLOGICAL_STRATA.length - 1 ? C.oreLight : C.borderLight}`,
              marginTop: i === 0 ? 0 : -6,
              boxShadow: `0 ${6 + i * 3}px ${10 + i * 3}px rgba(0,0,0,0.45)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `translateZ(${-i * 16}px)`,
            }}
            title={`${layer.depthRange} — ${layer.name}`}
          />
        ))}
      </div>
    </div>
  );
}

function RealSitesJourney() {
  const t = useT();
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  const sites = useMemo(() => {
    return Object.values(MINE_PROFILES).map((m) => {
      const { x, y } = latLongToIndiaXY(m.lat, m.lon);
      const tonnes = REAL_MP_DISTRICTS.find((d) => d.district === m.name)?.tonnes || 0;
      const icon = m.isRealMoilMine ? HardHat : m.name === "Chhindwara" ? Users : Truck;
      return { key: m.name, x, y, tonnes, method: m.method, isRealMoilMine: m.isRealMoilMine, fullLabel: m.fullLabel, icon };
    });
  }, []);

  const [activeSiteIndex, setActiveSiteIndex] = useState(0);
  const [show3D, setShow3D] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const resumeTimeoutRef = useRef(null);
  const activeSiteKey = sites[activeSiteIndex].key;

  const pauseAutoplay = () => {
    setAutoPlay(false);
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setAutoPlay(true), 9000);
  };

  // Auto-advance through sites every few seconds, unless the user just interacted
  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setActiveSiteIndex((i) => (i + 1) % sites.length);
    }, 4500);
    return () => clearInterval(id);
  }, [autoPlay, sites.length]);

  // Keep the scroll panel and the map/carousel in sync however the index changed
  useEffect(() => {
    contentRef.current?.children[activeSiteIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setShow3D(false);
  }, [activeSiteIndex]);

  useEffect(() => () => clearTimeout(resumeTimeoutRef.current), []);

  const selectSite = (siteKey) => {
    const index = sites.findIndex((site) => site.key === siteKey);
    setActiveSiteIndex(index);
    pauseAutoplay();
  };

  const activeSite = sites[activeSiteIndex];

  return (
    <section
      ref={sectionRef}
      id="sites"
      style={{ position: "relative", isolation: "isolate", padding: "80px 24px", maxWidth: 1100, margin: "0 auto", overflow: "hidden" }}
    >
      <ParallaxBackdrop sectionRef={sectionRef}>
        <div style={{ position: "absolute", top: "12%", left: "2%", width: "min(560px, 72vw)", height: 360, opacity: 0.8 }}>
          <svg viewBox="0 0 300 300" width="100%" height="100%">
            <path d={INDIA_OUTLINE_PATH} fill={C.panelHighlight} stroke={C.atmosphereDim} strokeWidth="1.5" />
            {sites.map((site) => <circle key={site.key} cx={site.x} cy={site.y} r={site.key === activeSiteKey ? 9 : 4} fill={site.key === activeSiteKey ? C.oreLight : C.mutedDark} />)}
          </svg>
        </div>
      </ParallaxBackdrop>
      <Reveal variant="up">
        <div className="moil-mono" style={{ fontSize: 11.5, color: C.mutedDark, letterSpacing: 1, marginBottom: 12 }}>
          {t.sitesEyebrow}
        </div>
      </Reveal>
      <Reveal variant="up" delay={60}>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, maxWidth: 740, lineHeight: 1.2, marginBottom: 30 }}>
          {t.sitesTitle}
        </h2>
      </Reveal>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 26 }}>
        {sites.map((s) => (
          <button
            key={s.key}
            onClick={() => selectSite(s.key)}
            style={{
              padding: "8px 14px",
              background: s.key === activeSiteKey ? C.ore : C.panel,
              color: s.key === activeSiteKey ? C.void : C.text,
              border: `1px solid ${s.key === activeSiteKey ? C.oreLight : C.border}`,
              cursor: "pointer", borderRadius: 2, fontWeight: 600, fontSize: 12.5,
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <MapPin size={12} /> {s.key} ({s.tonnes.toLocaleString("en-IN")}t)
          </button>
        ))}
        <button
          onClick={() => setAutoPlay((p) => !p)}
          className="moil-mono"
          style={{ padding: "8px 14px", background: "transparent", color: C.mutedDark, border: `1px solid ${C.border}`, cursor: "pointer", borderRadius: 2, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
        >
          <PlayCircle size={13} /> {autoPlay ? "Auto-cycling" : "Paused"}
        </button>
      </div>

      <div
        className="moil-mono"
        aria-live="polite"
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -14, marginBottom: 18, color: C.mutedDark, fontSize: 10 }}
      >
        <span>SCROLL, CLICK, OR WAIT — CYCLES EVERY 4.5S</span>
        <span style={{ display: "flex", gap: 5 }}>
          {sites.map((site) => (
            <span
              key={site.key}
              style={{ width: site.key === activeSiteKey ? 22 : 6, height: 4, background: site.key === activeSiteKey ? C.oreLight : C.borderLight, transition: "width 0.25s ease, background 0.25s ease" }}
            />
          ))}
        </span>
      </div>

      <div style={{
        background: C.panel, border: `1px solid ${C.borderLight}`,
        padding: "28px", borderRadius: 3,
        display: "flex", gap: 36, alignItems: "center", flexWrap: "wrap"
      }}>
        <div style={{
          flexShrink: 0, width: "100%", maxWidth: 280,
          background: C.panelRaised, border: `1px solid ${C.border}`,
          padding: 16, textAlign: "center"
        }}>
          <svg viewBox="0 0 300 300" width="100%" style={{ maxHeight: 260 }}>
            <path d={INDIA_OUTLINE_PATH} fill={C.panelHighlight} stroke={C.borderLight} strokeWidth="1.5" />
            {sites.map((s) => {
              const isSel = s.key === activeSiteKey;
              return (
                <g key={s.key} onClick={() => selectSite(s.key)} style={{ cursor: "pointer" }}>
                  {isSel && <circle cx={s.x} cy={s.y} r={13} fill="none" stroke={C.ore} strokeWidth="1" strokeDasharray="3 3" />}
                  <circle cx={s.x} cy={s.y} r={isSel ? 7 : 4.5} fill={isSel ? C.oreLight : C.mutedDark} />
                  <text x={s.x} y={s.y - 12} textAnchor="middle" fontSize="10" fill={isSel ? C.text : C.muted} fontFamily="IBM Plex Mono, monospace" fontWeight={isSel ? 600 : 400}>
                    {s.key}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark, marginTop: 8 }}>
            India — schematic map, not to scale. Pins positioned proportionally from real coordinates.
          </div>
        </div>

        <div style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button
              onClick={() => setShow3D((s) => !s)}
              className="moil-mono"
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 11,
                padding: "6px 12px", background: show3D ? C.ore : "transparent",
                color: show3D ? C.void : C.oreLight, border: `1px solid ${C.ore}`, cursor: "pointer", borderRadius: 2,
              }}
            >
              <Compass size={13} /> {show3D ? "Back to overview" : "View in 3D"}
            </button>
          </div>

          {show3D ? (
            <div style={{ height: 280, overflowY: "auto", background: C.panelRaised, border: `1px solid ${C.border}` }} className="moil-scroll">
              <div style={{ padding: "16px 20px 0", fontSize: 13, fontWeight: 600 }}>{activeSite.key} — depth cross-section</div>
              <Site3DDepthView site={activeSite} />
            </div>
          ) : (
            <div
              ref={contentRef}
              className="moil-scroll"
              onScroll={(event) => {
                const panel = event.currentTarget;
                const index = Math.round(panel.scrollTop / Math.max(1, panel.clientHeight));
                setActiveSiteIndex(Math.min(sites.length - 1, index));
                pauseAutoplay();
              }}
              style={{ height: 280, overflowY: "auto", scrollBehavior: "smooth", background: C.panelRaised, border: `1px solid ${C.border}` }}
            >
              {sites.map((site, index) => {
                const SiteIcon = site.icon;
                return (
                  <article key={site.key} style={{ minHeight: 280, padding: "24px 22px", borderBottom: index < sites.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <span className="moil-mono" style={{ fontSize: 10, color: C.safe, border: `1px solid ${C.safe}`, padding: "2px 6px" }}>IBM VERIFIED PRODUCTION DATA</span>
                      {!site.isRealMoilMine && (
                        <span className="moil-mono" style={{ fontSize: 10, color: C.caution, border: `1px solid ${C.caution}`, padding: "2px 6px" }}>MULTI-OPERATOR DISTRICT</span>
                      )}
                      <SiteIcon size={16} color={C.oreLight} />
                    </div>
                    <h3 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>
                      {site.isRealMoilMine ? `${site.key} Mine` : `${site.key} District`}
                    </h3>
                    <div style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 700, color: C.oreLight, marginBottom: 4 }}>{site.tonnes.toLocaleString("en-IN")} tonnes/yr</div>
                    <div className="moil-mono" style={{ fontSize: 12, color: C.mutedDark, marginBottom: 14 }}>FY2019–20 Output · ~{Math.round(site.tonnes / 365).toLocaleString("en-IN")} tonnes/day · {site.method}</div>
                    <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>{site.fullLabel}</p>
                    <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark }}>{t.sitesSource}</div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   PIPELINE
   ========================================================================= */
function Pipeline() {
  const t = useT();
  const steps = [
    { t: t.step1t, b: t.step1b, icon: Satellite },
    { t: t.step2t, b: t.step2b, icon: Layers },
    { t: t.step3t, b: t.step3b, icon: Gauge },
    { t: t.step4t, b: t.step4b, icon: Wrench },
  ];

  return (
    <section id="pipeline" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <Reveal variant="up">
        <div className="moil-mono" style={{ fontSize: 11.5, color: C.mutedDark, letterSpacing: 1, marginBottom: 12 }}>
          {t.pipelineEyebrow}
        </div>
      </Reveal>
      <Reveal variant="up" delay={60}>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, maxWidth: 660, lineHeight: 1.2, marginBottom: 40 }}>
          {t.pipelineTitle}
        </h2>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={i} variant="up" delay={i * 80}>
              <div style={{
                background: C.panel, border: `1px solid ${C.border}`,
                padding: "24px 20px", height: "100%", borderRadius: 2
              }}>
                <div className="moil-mono" style={{ fontSize: 11, color: C.oreLight, marginBottom: 12 }}>0{i + 1}</div>
                <Icon size={20} color={C.ore} style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>{s.t}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{s.b}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================================
   SIMULATED / CALIBRATED SERIES ENGINE
   ========================================================================= */
function genProductionSeries(baseline = 1855) {
  const days = [];
  let seed = 17;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const blastPattern = [0, 0, 0, 0, 1, 0, 2, 0, 0, 4, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 4, 0, 0, 0, 2, 0];

  for (let i = 0; i < 30; i++) {
    const rainfall = rand() * 32;
    const downtime = rand() * 5.5;
    const blastingDelay = blastPattern[i];
    const activeEquipment = 10 - (rand() < 0.2 ? Math.floor(rand() * 2) + 1 : 0);
    const planned = Math.round(baseline + (rand() - 0.5) * (baseline * 0.08));
    const weatherPenalty = rainfall > 20 ? (rainfall - 20) * (baseline * 0.03) : 0;
    const downtimePenalty = downtime * (baseline * 0.022);
    const blastPenalty = blastingDelay * (baseline * 0.035);
    const fleetBonus = (activeEquipment - 9) * (baseline * 0.018);

    const actual = Math.max(0, Math.round(planned - downtimePenalty - blastPenalty - weatherPenalty + fleetBonus));
    const shortfallPct = Math.max(0, ((planned - actual) / planned) * 100);
    const risk = Math.min(98, Math.max(2, Math.round(shortfallPct * 2.5 + downtime * 3.5 + blastingDelay * 5)));

    days.push({
      day: `D${i + 1}`,
      date: `Day ${i + 1}`,
      planned,
      actual,
      risk,
      rainfall: Math.round(rainfall),
      downtime: +downtime.toFixed(1),
      blastingDelay,
      activeEquipment,
    });
  }
  return days;
}

function computeActions(day, mineKey = "Balaghat") {
  const profile = MINE_PROFILES[mineKey] || MINE_PROFILES.Balaghat;
  const dtCost = profile.typicalDowntimeCostTonnesPerHr;
  const blCost = profile.typicalBlastingCostTonnesPerHr;
  const actions = [];

  if (day.downtime > 0.5) {
    actions.push({
      id: "act-haul",
      priority: "CRITICAL",
      action: "Reallocate Haulage and Mobile Fleet to Active Benches",
      trigger: `Equipment downtime at ${day.downtime} hrs (Threshold: >0.5 hrs)`,
      recovered: +(day.downtime * dtCost * 0.65).toFixed(1),
      standardProcedure: "SOP-MN-42: Divert Caterpillar haulers to East Face conveyor hopper; bypass blocked Pit 2 bypass route.",
      team: "Mobile Fleet Dispatch"
    });
  }
  if (day.blastingDelay > 0) {
    actions.push({
      id: "act-blast",
      priority: "HIGH",
      action: "Advance Blast Window Clearance with DGMS Inspectorate",
      trigger: `Blasting delay at ${day.blastingDelay} hrs (Threshold: >0 hrs)`,
      recovered: +(day.blastingDelay * blCost * 0.72).toFixed(1),
      standardProcedure: "SOP-SEC-11: Submit automated seismic vibration modeling logs for pre-cleared blast window.",
      team: "Safety & Drilling Operations"
    });
  }
  if (day.rainfall > 18) {
    actions.push({
      id: "act-rain",
      priority: "HIGH",
      action: "Activate Auxiliary Sump Dewatering & Grade Roads with Slag",
      trigger: `Heavy rainfall detected: ${day.rainfall} mm (Threshold: >18 mm)`,
      recovered: +Math.max((day.rainfall - 18) * (profile.dailyTarget * 0.04), 8).toFixed(1),
      standardProcedure: "SOP-ENV-08: Deploy 75 HP Flygt submersible pumps to lower benches; apply crushed manganese slag to haul ramps.",
      team: "Environmental Dewatering Crew"
    });
  }
  if (day.activeEquipment < 9) {
    const idle = 10 - day.activeEquipment;
    actions.push({
      id: "act-maint",
      priority: "ROUTINE",
      action: "Expedite Preventative Hydraulic Seal Service on Idle Units",
      trigger: `${idle} excavator/loader unit(s) off-line (${day.activeEquipment}/10 active)`,
      recovered: +(idle * (profile.dailyTarget * 0.025)).toFixed(1),
      standardProcedure: "SOP-MNT-19: Fast-track hydraulic fluid change and oil filter checks on standby Komatsu excavators.",
      team: "Workshop Engineering"
    });
  }
  return actions.sort((a, b) => b.recovered - a.recovered);
}

/* =========================================================================
   ROOT-CAUSE EXPLAINABILITY — "Why did we fall short?"
   Decomposes a shift's shortfall into the same four causal drivers used by
   genProductionSeries(), expressed in tonnes + % of total modeled loss, each
   paired with a recurrence-prevention strategy (distinct from the immediate
   computeActions() shift directive for that same trigger).
   ========================================================================= */
function explainShortfall(day, mineKey = "Balaghat") {
  const profile = MINE_PROFILES[mineKey] || MINE_PROFILES.Balaghat;
  const baseline = day.planned;

  const weatherLoss = day.rainfall > 18 ? +((day.rainfall - 18) * (baseline * 0.03)).toFixed(1) : 0;
  const downtimeLoss = +(day.downtime * (baseline * 0.022)).toFixed(1);
  const blastLoss = +(day.blastingDelay * (baseline * 0.035)).toFixed(1);
  const fleetLoss = day.activeEquipment < 9 ? +((9 - day.activeEquipment) * (baseline * 0.018)).toFixed(1) : 0;

  const causes = [
    {
      key: "downtime",
      label: "Equipment downtime",
      tonnes: downtimeLoss,
      metric: `${day.downtime} hrs off-line`,
      prevention: "Move from reactive to condition-based maintenance: log every unit's running hours and vibration/oil readings in the Equipment Check tab so failing units are pulled for service before they cause an unplanned stoppage."
    },
    {
      key: "blasting",
      label: "Blasting clearance delay",
      tonnes: blastLoss,
      metric: `${day.blastingDelay} hrs delay`,
      prevention: "Pre-file seismic vibration models with the DGMS inspectorate a full shift in advance so blast windows are pre-cleared rather than queued reactively."
    },
    {
      key: "weather",
      label: "Monsoon / rainfall disruption",
      tonnes: weatherLoss,
      metric: `${day.rainfall} mm recorded`,
      prevention: "Trigger auxiliary dewatering automatically once the live Open-Meteo feed forecasts >18mm, instead of waiting for pit flooding to be visually confirmed."
    },
    {
      key: "fleet",
      label: "Active fleet availability",
      tonnes: fleetLoss,
      metric: `${day.activeEquipment}/10 units active`,
      prevention: "Stagger preventive hydraulic/oil service across idle units on low-target days so fewer units are simultaneously unavailable on high-target days."
    },
  ].filter((c) => c.tonnes > 0.05);

  const totalModeled = causes.reduce((sum, c) => sum + c.tonnes, 0);
  return causes
    .map((c) => ({ ...c, pct: totalModeled > 0 ? Math.round((c.tonnes / totalModeled) * 100) : 0 }))
    .sort((a, b) => b.tonnes - a.tonnes);
}

/* =========================================================================
   EQUIPMENT CHECK LOGS — preventive-maintenance fleet roster
   Deterministic per-mine fleet of 10 units (matches the "activeEquipment /10"
   figure already used across the forecast + shift-directive engine above).
   Live condition is derived from the most recent logged check for each unit;
   units with no log yet default to a nominal baseline reading.
   ========================================================================= */
const EQUIPMENT_ROSTER_TEMPLATE = [
  { suffix: "EXC-01", type: "Excavator (Hydraulic Shovel)" },
  { suffix: "EXC-02", type: "Excavator (Hydraulic Shovel)" },
  { suffix: "EXC-03", type: "Excavator (Backhoe)" },
  { suffix: "HTR-01", type: "Haul Truck" },
  { suffix: "HTR-02", type: "Haul Truck" },
  { suffix: "HTR-03", type: "Haul Truck" },
  { suffix: "DRL-01", type: "Drill Rig" },
  { suffix: "DRL-02", type: "Drill Rig" },
  { suffix: "LDR-01", type: "Wheel Loader" },
  { suffix: "DWP-01", type: "Dewatering Pump Skid" },
];

const EQUIPMENT_CONDITIONS = [
  { id: "OK", label: "Operational — No Issues", tone: "safe" },
  { id: "WATCH", label: "Needs Attention — Monitor", tone: "caution" },
  { id: "FAULT", label: "Critical Fault — Stop & Service", tone: "risk" },
];

function genEquipmentFleet(mineKey = "Balaghat") {
  const profile = MINE_PROFILES[mineKey] || MINE_PROFILES.Balaghat;
  const prefix = (profile.name || mineKey).slice(0, 3).toUpperCase();
  let seed = mineKey.length * 13 + 7;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  return EQUIPMENT_ROSTER_TEMPLATE.map((u, i) => ({
    id: `${prefix}-${u.suffix}`,
    type: u.type,
    baselineHealth: 82 + Math.round(rand() * 15),
    hoursSinceService: Math.round(40 + rand() * 260),
    serviceIntervalHrs: u.type.includes("Drill") ? 250 : u.type.includes("Pump") ? 400 : 300,
  }));
}

/* =========================================================================
   ALERT PANEL — unified real-time red/amber flag feed
   Aggregates signals that already exist elsewhere in the dashboard (today's
   shortfall risk, live Open-Meteo weather, per-unit equipment condition +
   overdue service, DGMS compliance, blasting clearance, revenue exposure)
   into one ranked, timestamped list so a manager doesn't have to visit six
   tabs to see what needs attention right now.
   ========================================================================= */
function computeActiveAlerts({ day, weatherData, fleetWithStatus, complianceScore, shortfallTonnes, revenueLossLakhs }) {
  const alerts = [];

  if (day.risk > 60) {
    alerts.push({ id: "risk-high", severity: "red", title: "High Shortfall Risk", detail: `${day.risk}% shortfall risk forecast for ${day.day} — 72hr horizon.`, actionTab: "actions", actionLabel: "View Shift Directives" });
  } else if (day.risk > 35) {
    alerts.push({ id: "risk-med", severity: "amber", title: "Elevated Shortfall Risk", detail: `${day.risk}% shortfall risk forecast for ${day.day}.`, actionTab: "actions", actionLabel: "View Shift Directives" });
  }

  const faultUnits = fleetWithStatus.filter((u) => u.condition === "FAULT");
  const watchUnits = fleetWithStatus.filter((u) => u.condition === "WATCH");
  const overdueUnits = fleetWithStatus.filter((u) => u.hoursSinceService > u.serviceIntervalHrs);

  if (faultUnits.length > 0) {
    alerts.push({
      id: "fleet-fault", severity: "red", title: "Equipment Critical Fault",
      detail: `${faultUnits.map((u) => u.id).join(", ")} stopped, awaiting service — see Equipment Check Logs.`,
      actionTab: "equipment", actionLabel: `Log Check — ${faultUnits[0].id}`, actionUnitId: faultUnits[0].id
    });
  }
  if (watchUnits.length > 0) {
    alerts.push({
      id: "fleet-watch", severity: "amber", title: "Equipment Flagged for Monitoring",
      detail: `${watchUnits.map((u) => u.id).join(", ")} logged as needing attention.`,
      actionTab: "equipment", actionLabel: `Review — ${watchUnits[0].id}`, actionUnitId: watchUnits[0].id
    });
  }
  if (overdueUnits.length > 0) {
    alerts.push({
      id: "fleet-overdue", severity: "amber", title: "Preventive Maintenance Overdue",
      detail: `${overdueUnits.map((u) => `${u.id} (${u.hoursSinceService}/${u.serviceIntervalHrs} hrs)`).join(", ")} past scheduled service interval.`,
      actionTab: "equipment", actionLabel: `Log Service — ${overdueUnits[0].id}`, actionUnitId: overdueUnits[0].id
    });
  }

  if (day.rainfall > 18) {
    alerts.push({ id: "weather-rain", severity: "red", title: "Heavy Rainfall Disrupting Operations", detail: `${day.rainfall}mm recorded for ${day.day} — dewatering likely required.`, actionTab: "forecast", actionLabel: "Open Risk & What-If" });
  } else if (weatherData.isLive && weatherData.rain > 10) {
    alerts.push({ id: "weather-rain-live", severity: "amber", title: "Live Rainfall Building at Site", detail: `Open-Meteo reports ${weatherData.rain}mm at the mine coordinates right now.`, actionTab: "forecast", actionLabel: "Open Risk & What-If" });
  } else if (!weatherData.isLive) {
    alerts.push({ id: "weather-offline", severity: "amber", title: "Live Weather Feed Offline", detail: "Running on calibrated fallback estimate, not live Open-Meteo data.", actionTab: "overview", actionLabel: "View Weather Status" });
  }

  if (day.blastingDelay > 0) {
    alerts.push({ id: "blast-delay", severity: "amber", title: "Blasting Clearance Delay", detail: `${day.blastingDelay} hrs delay logged for ${day.day}.`, actionTab: "actions", actionLabel: "View Shift Directives" });
  }

  if (revenueLossLakhs > 10) {
    alerts.push({ id: "revenue-exposure", severity: "red", title: "High Revenue Exposure", detail: `₹${revenueLossLakhs}L at risk today from ${shortfallTonnes}t of shortfall.`, actionTab: "forecast", actionLabel: "Open Zone Simulator" });
  }

  if (complianceScore < 100) {
    alerts.push({ id: "dgms-compliance", severity: "amber", title: "DGMS Checklist Incomplete", detail: `${complianceScore}% compliance — outstanding statutory safety items.`, actionTab: "dgms", actionLabel: "Open Safety Checklist" });
  }

  const order = { red: 0, amber: 1 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

function formatTimeAgo(ms) {
  if (ms < 0) ms = 0;
  if (ms < 5000) return "just now";
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  return `${Math.floor(ms / 3600000)}h ago`;
}

/* =========================================================================
   ZONE-LEVEL WHAT-IF — location-specific deployment simulator
   Splits a mine's daily target across 3 named work zones (Underground
   Tunnels for underground mines, Benches for opencast mines) so a manager
   can ask "what if I add N trucks to Zone X" and see the recovered tonnage
   against today's actual mine-wide shortfall — distinct from the existing
   mine-wide what-if sandbox, which stays untouched.
   ========================================================================= */
function genMineZones(mineKey = "Balaghat") {
  const profile = MINE_PROFILES[mineKey] || MINE_PROFILES.Balaghat;
  const underground = (profile.method || "").toLowerCase().includes("underground");
  const names = underground
    ? ["Underground Tunnel A", "Underground Tunnel B", "Underground Tunnel C"]
    : ["Open Pit Bench 1", "Open Pit Bench 2", "Open Pit Bench 3"];

  let seed = mineKey.length * 31 + 11;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  const rawShares = names.map(() => 0.6 + rand() * 0.8);
  const totalShare = rawShares.reduce((a, b) => a + b, 0);
  const shares = rawShares.map((s) => s / totalShare);

  return names.map((name, i) => ({
    id: `zone-${i}`,
    name,
    share: +shares[i].toFixed(3),
    baseTrucks: Math.max(2, Math.round(shares[i] * 10)),
    targetTonnes: Math.round(profile.dailyTarget * shares[i]),
  }));
}

/* =========================================================================
   3D SUBSURFACE EXPLORER — click-through depth layers
   Reuses the same four stratigraphic bands already shown in the 2D "3D
   Strata and Shaft" cross-section (surface laterite, Mansar Gondite/
   Braunite ore body, Lohangi Marble, Tirodi Gneiss basement), but here each
   band is its own clickable grid of sub-surface cells rendered with real
   CSS 3D transforms (perspective + translateZ), so a manager can rotate the
   stack and click through depth to inspect probability/grade at any level.
   No new rendering dependency — pure CSS3D, consistent with this app's
   existing SVG-only rendering approach.
   ========================================================================= */
function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const DEPTH_LAYERS_META = [
  { key: "surface", label: "Surface Laterite & Alluvium", depthRange: "0m to -18m", colorHex: "#8B5A2B", oreBearing: false },
  { key: "orebody", label: "Mansar Gondite & Braunite (Ore Body)", depthRange: "-18m to -195m", colorHex: "#C1622D", oreBearing: true },
  { key: "marble", label: "Lohangi Marble & Calc-Silicate", depthRange: "-195m to -275m", colorHex: "#5A6557", oreBearing: false },
  { key: "basement", label: "Tirodi Biotite Gneiss Basement", depthRange: "-275m to -450m+", colorHex: "#2C2822", oreBearing: false },
];

function genDepthGrid(mineKey = "Balaghat", layerKey = "orebody", size = 8) {
  let seed = mineKey.length * 17 + layerKey.length * 5 + 3;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const isOreBody = layerKey === "orebody";
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = rand();
      cells.push({
        x, y,
        probability: isOreBody ? Math.round(38 + r * 55) : Math.round(4 + r * 22),
        grade: isOreBody ? +(26 + r * 24).toFixed(1) : +(6 + r * 14).toFixed(1),
      });
    }
  }
  return cells;
}

function genReserveGrid(size = 28) {
  const cells = [];
  const blob = (x, y, cx, cy, s) => Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s)));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const prob = Math.min(1, blob(x, y, 8, 20, 3.4) + blob(x, y, 21, 7, 2.4));
      const hasBorehole = ((x * 37 + y * 19) % 100) < 9;
      cells.push({
        id: `${x}-${y}`,
        x,
        y,
        p: prob,
        hasBorehole,
        drilled: hasBorehole,
        ndvi: +(0.15 + prob * 0.45 + ((x * y) % 10) * 0.02).toFixed(2),
        thermalAnomaly: +(24 + (1 - prob) * 6).toFixed(1),
        gradeEstimate: prob > 0.65 ? "High Grade (>42% Mn)" : prob > 0.35 ? "Medium Grade (30-42% Mn)" : "Low Grade / Gondite"
      });
    }
  }
  return cells;
}

const RISK_FACTORS = [
  { label: "Haulage downtime", value: 33.2 },
  { label: "Blasting clearance delay", value: 25.6 },
  { label: "Planned tonnage target", value: 14.1 },
  { label: "Monsoon precipitation", value: 12.8 },
  { label: "Active loader availability", value: 8.5 },
];

function DTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: "8px 12px", fontSize: 12, borderRadius: 2 }} className="moil-mono">
      <div style={{ color: C.muted, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, display: "flex", gap: 8, justifyContent: "space-between" }}>
          <span>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function parseCSVLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    const nextCharacter = line[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      field += '"';
      index++;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(field.trim());
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field.trim());
  return fields;
}

// Persists state via the artifact's real persistent storage API
// (window.storage) instead of localStorage, which Claude.ai artifacts
// block. Loads asynchronously on mount (falling back to `fallback` until
// then), and writes back on every change after the initial load completes
// — a `loadedRef` guard prevents that initial fallback from being written
// over a value that's still being fetched.
function usePersistentState(key, fallback) {
  const [value, setValue] = useState(fallback);
  const loadedRef = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const result = await window.storage.get(key, false);
          if (active && result && result.value !== undefined) {
            setValue(JSON.parse(result.value));
          }
        }
      } catch {
        // no stored value yet, or storage unavailable — keep fallback
      } finally {
        if (active) loadedRef.current = true;
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loadedRef.current) return;
    if (typeof window === "undefined" || !window.storage) return;
    window.storage.set(key, JSON.stringify(value), false).catch(() => {
      // best-effort persistence only
    });
  }, [key, value]);

  return [value, setValue];
}

function DKPI({ label, value, sub, tone }) {
  const tc = tone === "risk" ? C.risk : tone === "safe" ? C.safe : tone === "caution" ? C.caution : C.text;
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: "14px 16px", flex: "1 1 140px", minWidth: 130, borderRadius: 2 }}>
      <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: "clamp(20px, 2.5vw, 24px)", fontWeight: 700, color: tc, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* =========================================================================
   CONTROL ROOM / EMBEDDED DASHBOARD (All Enterprise Modules)
   ========================================================================= */
function EmbeddedDashboard({ audioMuted }) {
  const t = useT();
  const [selectedMine, setSelectedMine] = usePersistentState("moil:selectedMine", "Balaghat");
  const [tab, setTab] = usePersistentState("moil:tab", "overview");

  // Lightweight particle burst — replaces canvas-confetti (unavailable in
  // this sandbox) with a plain CSS/DOM implementation, no external package.
  const [bursts, setBursts] = useState([]);
  const fireBurst = (count = 40, originY = 0.7) => {
    const id = Date.now() + Math.random();
    const particles = Array.from({ length: count }).map((_, i) => ({
      id: `${id}-${i}`,
      angle: Math.random() * Math.PI * 2,
      distance: 60 + Math.random() * 110,
      size: 4 + Math.random() * 5,
      color: [C.ore, C.oreLight, C.safe, C.caution, C.scan || C.atmosphere][Math.floor(Math.random() * 5)],
      delay: Math.random() * 80,
    }));
    setBursts((prev) => [...prev, { id, originY, particles }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 1300);
  };

  const mine = MINE_PROFILES[selectedMine] || MINE_PROFILES.Balaghat;

  // Live Open-Meteo Weather State
  const [weatherData, setWeatherData] = useState({
    temp: 28.4,
    humidity: 62,
    rain: 0.0,
    wind: 11.2,
    isLive: false,
    condition: "Fair / Partly Cloudy",
    lastUpdated: null,
    refreshing: false
  });

  const [browserOnline, setBrowserOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [auditEvents, setAuditEvents] = usePersistentState("moil:auditEvents", []);

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (auditEvents.length > 80) setAuditEvents((prev) => prev.slice(0, 80));
  }, [auditEvents]);

  const recordAuditEvent = (event) => {
    setAuditEvents((previous) => [{
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      mine: selectedMine,
      ...event,
    }, ...previous].slice(0, 80));
  };

  // Live clock — ticks every second
  const [liveTime, setLiveTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Weather next-refresh countdown (seconds remaining)
  const WEATHER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  const [weatherNextRefresh, setWeatherNextRefresh] = useState(WEATHER_INTERVAL_MS / 1000);

  useEffect(() => {
    let active = true;
    let intervalId;
    let countdownId;

    const fetchWeather = async () => {
      if (!active) return;
      setWeatherData(prev => ({ ...prev, refreshing: true }));
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const params = new URLSearchParams({
          latitude: mine.lat,
          longitude: mine.lon,
          current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code"
        });
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Weather offline");
        const json = await res.json();
        if (active && json.current) {
          const c = json.current;
          setWeatherData({
            temp: c.temperature_2m,
            humidity: c.relative_humidity_2m,
            rain: c.precipitation || 0,
            wind: c.wind_speed_10m,
            isLive: true,
            condition: c.precipitation > 2 ? "Heavy Rain / Monsoon" : c.precipitation > 0 ? "Light Showers" : "Clear Sky / Operational",
            lastUpdated: new Date(),
            refreshing: false
          });
        }
      } catch (err) {
        if (active) {
          setWeatherData(prev => ({
            ...prev,
            isLive: false,
            condition: "Calibrated Estimate (Offline Fallback)",
            lastUpdated: new Date(),
            refreshing: false
          }));
        }
      } finally {
        clearTimeout(timeoutId);
      }
      if (active) setWeatherNextRefresh(WEATHER_INTERVAL_MS / 1000);
    };

    // Initial fetch
    fetchWeather();

    // Poll every 5 minutes
    intervalId = setInterval(fetchWeather, WEATHER_INTERVAL_MS);

    // Countdown ticker (every second)
    countdownId = setInterval(() => {
      if (active) setWeatherNextRefresh(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      active = false;
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, [mine]);

  // Production series calibrated to active mine baseline
  const [customSeries, setCustomSeries] = useState(null);
  // chartKey increments whenever new data arrives → Recharts re-mounts & re-animates
  const [chartKey, setChartKey] = useState(0);
  const baseSeries = useMemo(() => genProductionSeries(mine.dailyTarget), [mine.dailyTarget]);
  const series = customSeries || baseSeries;

  const latest = series[series.length - 1];
  const maxRisk = series.reduce((a, b) => (b.risk > a.risk ? b : a), series[0]);

  // Financial calculations
  const shortfallTonnes = Math.max(0, latest.planned - latest.actual);
  const revenueLossLakhs = +((shortfallTonnes * ORE_PRICING.blendedAverage) / 100000).toFixed(2);

  // Selected day for actions
  const [selectedDay, setSelectedDay] = useState(maxRisk.day);
  const activeDay = series.find((d) => d.day === selectedDay) || maxRisk;

  // Search filter for actions
  const [actionSearch, setActionSearch] = useState("");

  // Actions with execution state
  const rawActions = useMemo(() => computeActions(activeDay, selectedMine), [activeDay, selectedMine]);
  const shortfallCauses = useMemo(() => explainShortfall(activeDay, selectedMine), [activeDay, selectedMine]);
  const [actionStatuses, setActionStatuses] = usePersistentState("moil:actionStatuses", {});


  const filteredActions = useMemo(() => {
    if (!actionSearch) return rawActions;
    const q = actionSearch.toLowerCase();
    return rawActions.filter(a => a.action.toLowerCase().includes(q) || a.team.toLowerCase().includes(q) || a.priority.toLowerCase().includes(q));
  }, [rawActions, actionSearch]);

  const toggleActionStatus = (actionId) => {
    const isDone = actionStatuses[actionId] === "EXECUTED";
    recordAuditEvent({
      type: isDone ? "ACTION_REOPENED" : "ACTION_EXECUTED",
      subject: rawActions.find((action) => action.id === actionId)?.action || actionId,
      detail: isDone ? "Action returned to pending." : "Action marked executed by operator.",
    });
    setActionStatuses((prev) => {
      if (!isDone) {
        if (!audioMuted) playIndustrialChime("success");
        fireBurst(40, 0.7);
      }
      return { ...prev, [actionId]: isDone ? "PENDING" : "EXECUTED" };
    });
  };

  // Reserve Grid State
  const initialGrid = useMemo(() => genReserveGrid(28), []);
  const [gridCells, setGridCells] = useState(initialGrid);
  const [inspectedCell, setInspectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const shade = (p) => `rgb(${Math.round(26 + (193 - 26) * p)},${Math.round(23 + (98 - 23) * p)},${Math.round(18 + (45 - 18) * p)})`;

  const dispatchDrillToCell = (cell) => {
    setGridCells((prev) => prev.map((c) => (c.id === cell.id ? { ...c, drilled: true } : c)));
    setInspectedCell((prev) => (prev ? { ...prev, drilled: true } : null));
    if (!audioMuted) playIndustrialChime("success");
    fireBurst(50, 0.6);
    recordAuditEvent({
      type: "DRILL_DISPATCHED",
      subject: `Lease coordinate [${cell.x}, ${cell.y}]`,
      detail: `${(cell.p * 100).toFixed(1)}% modeled reserve probability; ${cell.gradeEstimate}.`,
    });
    showToast(`Drill Rig dispatched to Lease Coordinate [${cell.x}, ${cell.y}]`);
  };

  // Equipment Check Logs — fleet roster + persisted maintenance log history
  const fleetRoster = useMemo(() => genEquipmentFleet(selectedMine), [selectedMine]);
  const [equipmentLogs, setEquipmentLogs] = usePersistentState("moil:equipmentLogs", {});
  const [logUnitId, setLogUnitId] = useState(null);
  const [logForm, setLogForm] = useState({ condition: "OK", technician: "", note: "" });


  const fleetWithStatus = useMemo(() => {
    return fleetRoster.map((unit) => {
      const logKey = `${selectedMine}__${unit.id}`;
      const history = equipmentLogs[logKey] || [];
      const lastLog = history[0] || null;
      const condition = lastLog ? lastLog.condition : "OK";
      const conditionMeta = EQUIPMENT_CONDITIONS.find((c) => c.id === condition) || EQUIPMENT_CONDITIONS[0];
      const health = lastLog
        ? condition === "FAULT" ? Math.max(20, unit.baselineHealth - 45) : condition === "WATCH" ? Math.max(45, unit.baselineHealth - 20) : unit.baselineHealth
        : unit.baselineHealth;
      return { ...unit, logKey, history, condition, conditionMeta, health, lastLog };
    });
  }, [fleetRoster, equipmentLogs, selectedMine]);

  const fleetSummary = useMemo(() => {
    const operational = fleetWithStatus.filter((u) => u.condition === "OK").length;
    const watch = fleetWithStatus.filter((u) => u.condition === "WATCH").length;
    const fault = fleetWithStatus.filter((u) => u.condition === "FAULT").length;
    const avgHealth = Math.round(fleetWithStatus.reduce((sum, u) => sum + u.health, 0) / fleetWithStatus.length);
    return { operational, watch, fault, avgHealth };
  }, [fleetWithStatus]);

  const openLogForm = (unitId) => {
    setLogUnitId((prev) => (prev === unitId ? null : unitId));
    setLogForm({ condition: "OK", technician: "", note: "" });
  };

  const submitEquipmentLog = (unit) => {
    if (!logForm.technician.trim()) {
      showToast("Enter the checking technician's name before logging.");
      return;
    }
    const entry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      condition: logForm.condition,
      technician: logForm.technician.trim(),
      note: logForm.note.trim(),
    };
    setEquipmentLogs((prev) => ({
      ...prev,
      [unit.logKey]: [entry, ...(prev[unit.logKey] || [])].slice(0, 25),
    }));
    if (!audioMuted) playIndustrialChime(logForm.condition === "FAULT" ? "alert" : "success");
    if (logForm.condition !== "FAULT") fireBurst(35, 0.7);
    showToast(`Check logged for ${unit.id} — status set to ${EQUIPMENT_CONDITIONS.find(c => c.id === logForm.condition).label}.`);
    setLogUnitId(null);
  };

  // What-if simulator state
  const [simRain, setSimRain] = usePersistentState("moil:simRain", 12);
  const [simDowntime, setSimDowntime] = usePersistentState("moil:simDowntime", 1.5);
  const [simBlasting, setSimBlasting] = usePersistentState("moil:simBlasting", 0);
  const [simFleet, setSimFleet] = usePersistentState("moil:simFleet", 9);
  const [forecastIndex, setForecastIndex] = useState(0);
  const [forecastPlaying, setForecastPlaying] = useState(false);


  useEffect(() => {
    setForecastIndex(0);
    setForecastPlaying(false);
  }, [selectedMine, customSeries]);

  useEffect(() => {
    if (!forecastPlaying) return undefined;
    const playbackId = setInterval(() => {
      setForecastIndex((current) => {
        if (current >= series.length - 1) {
          setForecastPlaying(false);
          return 0;
        }
        return current + 1;
      });
    }, 700);
    return () => clearInterval(playbackId);
  }, [forecastPlaying, series.length]);

  const simResult = useMemo(() => {
    const planned = mine.dailyTarget;
    const weatherPenalty = simRain > 18 ? (simRain - 18) * (planned * 0.04) : 0;
    const downtimePenalty = simDowntime * mine.typicalDowntimeCostTonnesPerHr;
    const blastPenalty = simBlasting * mine.typicalBlastingCostTonnesPerHr;
    const fleetBonus = (simFleet - 8) * (planned * 0.02);

    const output = Math.max(0, Math.round(planned - weatherPenalty - downtimePenalty - blastPenalty + fleetBonus));
    const shortfallPct = Math.max(0, ((planned - output) / planned) * 100);
    const risk = Math.min(99, Math.max(1, Math.round(shortfallPct * 2.6 + simDowntime * 4 + simBlasting * 6)));
    const deficit = Math.max(0, planned - output);
    const deficitLakhs = +((deficit * ORE_PRICING.blendedAverage) / 100000).toFixed(2);

    return {
      planned,
      output,
      deficit,
      deficitLakhs,
      risk,
      tone: risk > 65 ? "risk" : risk > 35 ? "caution" : "safe"
    };
  }, [mine, simRain, simDowntime, simBlasting, simFleet]);

  const resetSimulation = () => {
    setSimRain(12);
    setSimDowntime(1.5);
    setSimBlasting(0);
    setSimFleet(9);
    recordAuditEvent({ type: "SCENARIO_RESET", subject: "Baseline shift scenario", detail: "Returned to 12 mm rain, 1.5 hours downtime, zero blast delay, and nine active units." });
    showToast("What-if simulation reset to baseline.");
  };

  const applyScenarioPreset = (preset) => {
    setSimRain(preset.rain);
    setSimDowntime(preset.downtime);
    setSimBlasting(preset.blasting);
    setSimFleet(preset.fleet);
    recordAuditEvent({ type: "SCENARIO_REHEARSED", subject: preset.label, detail: preset.detail });
    showToast(`${preset.label} loaded into the scenario sandbox.`);
  };

  const scenarioPresets = [
    { label: "MONSOON STRESS", rain: 42, downtime: 2.5, blasting: 1, fleet: 8, detail: "42 mm rainfall, 2.5 hours downtime, one-hour blast delay, eight active units." },
    { label: "FLEET OUTAGE", rain: 12, downtime: 6, blasting: 0, fleet: 6, detail: "Six hours downtime with only six active rigs/loaders." },
    { label: "BLAST WINDOW DELAY", rain: 8, downtime: 1.5, blasting: 4, fleet: 9, detail: "Four-hour blast clearance delay under otherwise normal conditions." },
    { label: "RECOVERY PLAN", rain: 4, downtime: 0.5, blasting: 0, fleet: 10, detail: "Dry conditions, minimal downtime, and full fleet availability." },
  ];

  // DGMS Safety checklist state
  const [safetyChecklist, setSafetyChecklist] = useState(
    DGMS_SAFETY_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
  );

  const complianceScore = useMemo(() => {
    const total = DGMS_SAFETY_ITEMS.length;
    const checked = Object.values(safetyChecklist).filter(Boolean).length;
    return Math.round((checked / total) * 100);
  }, [safetyChecklist]);

  // Unified Alert Panel — aggregates risk, weather, equipment, and compliance
  // signals into a live, timestamped, dismissible feed.
  const alertFirstSeenRef = useRef({});
  const [dismissedAlertIds, setDismissedAlertIds] = useState(() => new Set());

  const activeAlerts = useMemo(() => {
    const raw = computeActiveAlerts({ day: latest, weatherData, fleetWithStatus, complianceScore, shortfallTonnes, revenueLossLakhs });
    const now = Date.now();
    const seen = alertFirstSeenRef.current;
    const currentIds = new Set(raw.map((a) => a.id));
    Object.keys(seen).forEach((id) => { if (!currentIds.has(id)) delete seen[id]; });
    return raw.map((a) => {
      if (!seen[a.id]) seen[a.id] = now;
      return { ...a, detectedAt: seen[a.id] };
    });
  }, [latest, weatherData, fleetWithStatus, complianceScore, shortfallTonnes, revenueLossLakhs]);

  // Let a dismissed alert reappear fresh if it clears and later recurs
  useEffect(() => {
    setDismissedAlertIds((prev) => {
      if (prev.size === 0) return prev;
      const currentIds = new Set(activeAlerts.map((a) => a.id));
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (currentIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [activeAlerts]);

  const visibleAlerts = useMemo(
    () => activeAlerts.filter((a) => !dismissedAlertIds.has(a.id)),
    [activeAlerts, dismissedAlertIds]
  );
  const dismissAlert = (id) => setDismissedAlertIds((prev) => new Set(prev).add(id));

  // Alert panel collapse/expand, persisted across sessions
  const [alertPanelOpen, setAlertPanelOpen] = usePersistentState("moil:alertPanelOpen", true);


  const runAlertAction = (a) => {
    setTab(a.actionTab);
    if (a.actionUnitId) {
      setLogUnitId(a.actionUnitId);
      setLogForm({ condition: "OK", technician: "", note: "" });
    }
  };

  // Zone-Level What-If simulator state
  const zoneRoster = useMemo(() => genMineZones(selectedMine), [selectedMine]);
  const [zoneSimId, setZoneSimId] = usePersistentState("moil:zoneSimId", "zone-0");
  const [zoneExtraUnits, setZoneExtraUnits] = usePersistentState("moil:zoneExtraUnits", 0);

  useEffect(() => {
    if (!zoneRoster.find((z) => z.id === zoneSimId)) {
      setZoneSimId(zoneRoster[0].id);
    }
  }, [zoneRoster, zoneSimId]);


  const activeZone = zoneRoster.find((z) => z.id === zoneSimId) || zoneRoster[0];

  const zoneSimResult = useMemo(() => {
    const recoveredPerUnit = Math.round(activeZone.targetTonnes * 0.055);
    const recovered = Math.round(zoneExtraUnits * recoveredPerUnit);
    const projectedZoneOutput = activeZone.targetTonnes + recovered;
    const mineShortfall = Math.max(0, latest.planned - latest.actual);
    const closesGapPct = mineShortfall > 0 ? Math.min(100, Math.round((recovered / mineShortfall) * 100)) : 100;
    return { recoveredPerUnit, recovered, projectedZoneOutput, mineShortfall, closesGapPct };
  }, [activeZone, zoneExtraUnits, latest]);

  // 3D Strata Inspector state
  const [strataDepth, setStrataDepth] = useState(85);
  const activeStrata = useMemo(() => {
    if (strataDepth <= 18) return GEOLOGICAL_STRATA[0];
    if (strataDepth <= 195) return GEOLOGICAL_STRATA[1];
    if (strataDepth <= 275) return GEOLOGICAL_STRATA[2];
    return GEOLOGICAL_STRATA[3];
  }, [strataDepth]);

  // 3D Subsurface Explorer state — CSS3D rotatable, click-through depth layers
  const depthGrids = useMemo(
    () => DEPTH_LAYERS_META.map((layer) => ({ ...layer, cells: genDepthGrid(selectedMine, layer.key, 8) })),
    [selectedMine]
  );
  const [explorerActiveLayer, setExplorerActiveLayer] = useState(1); // default to the ore-body band
  const [explorerRotation, setExplorerRotation] = useState({ x: 58, z: -32 });
  const [inspectedDepthCell, setInspectedDepthCell] = useState(null); // { layerIndex, cell }
  const explorerDragRef = useRef(null);

  const inspectExplorerCell = (layerIndex, x, y) => {
    const layer = depthGrids[layerIndex];
    const cell = layer?.cells.find((candidate) => candidate.x === x && candidate.y === y);
    if (!cell) return;
    setExplorerActiveLayer(layerIndex);
    setInspectedDepthCell({ layerIndex, cell });
  };

  const handleExplorerKeyDown = (event) => {
    const current = inspectedDepthCell || { layerIndex: explorerActiveLayer, cell: { x: 3, y: 3 } };
    const { layerIndex, cell } = current;
    let nextLayer = layerIndex;
    let nextX = cell.x;
    let nextY = cell.y;

    if (event.key === "ArrowRight") nextX = Math.min(7, nextX + 1);
    else if (event.key === "ArrowLeft") nextX = Math.max(0, nextX - 1);
    else if (event.key === "ArrowDown") nextY = Math.min(7, nextY + 1);
    else if (event.key === "ArrowUp") nextY = Math.max(0, nextY - 1);
    else if (event.key === "PageDown") nextLayer = Math.min(depthGrids.length - 1, layerIndex + 1);
    else if (event.key === "PageUp") nextLayer = Math.max(0, layerIndex - 1);
    else if (event.key === "Home") { nextX = 0; nextY = 0; }
    else if (event.key === "End") { nextX = 7; nextY = 7; }
    else if (event.key === "Enter" || event.key === " ") {
      inspectExplorerCell(layerIndex, cell.x, cell.y);
      event.preventDefault();
      return;
    } else return;

    event.preventDefault();
    inspectExplorerCell(nextLayer, nextX, nextY);
  };

  const handleExplorerPointerDown = (e) => {
    explorerDragRef.current = { startX: e.clientX, startY: e.clientY, startRot: { ...explorerRotation } };
  };
  const handleExplorerPointerMove = (e) => {
    if (!explorerDragRef.current) return;
    const dx = e.clientX - explorerDragRef.current.startX;
    const dy = e.clientY - explorerDragRef.current.startY;
    setExplorerRotation({
      x: Math.max(25, Math.min(85, explorerDragRef.current.startRot.x - dy * 0.4)),
      z: explorerDragRef.current.startRot.z + dx * 0.4,
    });
  };
  const handleExplorerPointerUp = () => { explorerDragRef.current = null; };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // CSV Export
  const exportShiftCSV = () => {
    const headers = ["Day", "Mine", "Planned_Tonnes", "Actual_Tonnes", "Shortfall_Risk_Pct", "Action", "Recovered_Tonnes", "Status"];
    const rows = rawActions.map((a) => [
      activeDay.day,
      selectedMine,
      activeDay.planned,
      activeDay.actual,
      activeDay.risk,
      `"${a.action}"`,
      a.recovered,
      actionStatuses[a.id] || "PENDING"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `MOIL_${selectedMine}_Shift_Dispatch_${activeDay.day}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported CSV shift directives for ${selectedMine} ${activeDay.day}`);
  };

  // Custom CSV Upload Handler
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target.result || "").replace(/^\uFEFF/, "");
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length < 2) throw new Error("Empty CSV");
        const headers = parseCSVLine(lines[0]).map((header) => header.toLowerCase());
        const requiredHeaders = ["day", "planned_tonnes", "actual_tonnes", "rainfall_mm", "downtime_hrs", "blasting_delay_hrs", "active_equipment"];
        if (!requiredHeaders.every((header, index) => headers[index] === header)) {
          throw new Error("Invalid CSV headers");
        }
        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = parseCSVLine(lines[i]);
          if (parts.length !== requiredHeaders.length) continue;
          const planned = Number(parts[1]);
          const actual = Number(parts[2]);
          const rain = Number(parts[3]);
          const dt = Number(parts[4]);
          const bl = Number(parts[5]);
          const eq = Number(parts[6]);
          if (parts[0] && planned > 0 && actual >= 0 && rain >= 0 && dt >= 0 && bl >= 0 && eq >= 0) {
            const shortfallPct = Math.max(0, ((planned - actual) / planned) * 100);
            const risk = Math.min(99, Math.max(1, Math.round(shortfallPct * 2.5 + dt * 3.5 + bl * 5)));
            parsed.push({
              day: parts[0] || `D${i}`,
              date: parts[0] || `Day ${i}`,
              planned,
              actual,
              risk,
              rainfall: rain,
              downtime: dt,
              blastingDelay: bl,
              activeEquipment: eq
            });
          }
        }
        if (parsed.length === 0) throw new Error("No valid records");
        if (parsed.length > 0) {
          setCustomSeries(parsed);
          // Increment chartKey → all Recharts charts re-mount and re-animate with the new data
          setChartKey(k => k + 1);
          showToast(`✓ Loaded ${parsed.length} records from "${file.name}" — all charts updated in real time!`);
          if (!audioMuted) playIndustrialChime("success");
        }
      } catch (err) {
        showToast("Error parsing CSV. Please use the template format.");
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csvData = generateSampleMineCSV();
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MOIL_Sample_Mine_Telemetry.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast("Downloaded sample CSV template.");
  };

  const NAV_ITEMS = [
    { id: "overview", label: t.tabOverview, icon: Gauge },
    { id: "reserve", label: t.tabReserve, icon: Map },
    { id: "forecast", label: t.tabForecast, icon: TrendingUp },
    { id: "actions", label: t.tabActions, icon: Wrench },
    { id: "3d", label: t.tab3D, icon: Layers3 },
    { id: "dgms", label: t.tabDgms, icon: ShieldCheck },
    { id: "upload", label: t.tabUpload, icon: Upload },
    { id: "national", label: t.tabNational, icon: Database },
    { id: "equipment", label: t.tabEquipment, icon: Truck },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", background: C.void, minHeight: 600 }}>
      {/* Particle burst layer (canvas-confetti replacement) */}
      <div className="moil-burst-layer">
        {bursts.map((b) => (
          <div key={b.id} style={{ position: "absolute", top: `${b.originY * 100}%`, left: "50%", width: 0, height: 0 }}>
            {b.particles.map((p) => (
              <div
                key={p.id}
                className="moil-burst-particle"
                style={{
                  width: p.size, height: p.size, background: p.color,
                  animationDelay: `${p.delay}ms`,
                  "--bx": `${Math.cos(p.angle) * p.distance}px`,
                  "--by": `${Math.sin(p.angle) * p.distance - 40}px`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 180,
          background: C.panelRaised, border: `1px solid ${C.ore}`,
          padding: "12px 18px", color: C.text, fontSize: 13,
          boxShadow: "0 10px 30px rgba(0,0,0,0.8)", display: "flex", alignItems: "center", gap: 10,
          animation: "moil-fade-in 0.25s ease-out"
        }}>
          <CheckCircle2 size={16} color={C.safe} /> {toastMessage}
        </div>
      )}

      {/* Control Room Header & Mine Selector */}
      <div style={{
        padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12, background: C.panelRaised
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark }}>
            {t.switchMine.toUpperCase()}:
          </div>
          <select
            value={selectedMine}
            onChange={(e) => {
              setSelectedMine(e.target.value);
              setCustomSeries(null);
            }}
            className="moil-mono"
            style={{
              background: C.panel, color: C.oreLight, border: `1px solid ${C.borderLight}`,
              padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", borderRadius: 2
            }}
          >
            {Object.keys(MINE_PROFILES).map((k) => (
              <option key={k} value={k}>{MINE_PROFILES[k].name}</option>
            ))}
          </select>
          <span className="moil-mono" style={{ fontSize: 11, color: C.muted }}>
            Target: ~{mine.dailyTarget.toLocaleString("en-IN")} t/day ({mine.method})
          </span>
        </div>

        {/* Live Open-Meteo Meteorology Bar + Live Clock */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Live Clock */}
          <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark, display: "flex", alignItems: "center", gap: 5, borderRight: `1px solid ${C.border}`, paddingRight: 14 }}>
            <Activity size={11} color={C.ore} style={{ animation: "moil-pulse-soft 2s ease-in-out infinite" }} />
            {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </div>

          {/* Weather Data */}
          <div className="moil-mono" style={{ fontSize: 11, color: weatherData.isLive ? C.atmosphere : C.muted, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              color: weatherData.refreshing ? C.caution : weatherData.isLive ? C.safe : C.caution,
              animation: weatherData.refreshing ? "moil-pulse-soft 0.8s ease-in-out infinite" : "none"
            }}>●</span>
            <span>{weatherData.refreshing ? "FETCHING…" : weatherData.isLive ? "LIVE OPEN-METEO" : "MET SIM"}: {weatherData.temp}°C</span>
            <span style={{ color: C.mutedDark }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CloudRain size={12} color={C.atmosphere} /> {weatherData.rain}mm</span>
            <span style={{ color: C.mutedDark }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Wind size={12} color={C.muted} /> {weatherData.wind} km/h</span>
            <span style={{ color: C.mutedDark }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Thermometer size={12} color={C.muted} /> {weatherData.humidity}% RH</span>
            {weatherData.lastUpdated && (
              <span style={{ color: C.mutedDark, fontSize: 10 }}>
                | refreshing in {weatherNextRefresh}s
              </span>
            )}
          </div>

          <div className="moil-mono" style={{
            fontSize: 10, padding: "3px 7px", display: "flex", alignItems: "center", gap: 5,
            color: browserOnline && weatherData.isLive ? C.safe : C.caution,
            border: `1px solid ${browserOnline && weatherData.isLive ? C.safe : C.caution}`,
            background: C.panel
          }} title="Data provenance and connectivity status">
            <span>{browserOnline ? "●" : "○"}</span>
            {browserOnline ? (weatherData.isLive ? "LIVE DATA" : "LOCAL SIMULATION") : "OFFLINE MODE"}
          </div>

          {/* Custom data active badge */}
          {customSeries && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="moil-mono" style={{
                fontSize: 10, padding: "2px 7px",
                background: "rgba(127,160,117,0.12)",
                color: C.safe, border: `1px solid ${C.safe}`,
                display: "flex", alignItems: "center", gap: 5
              }}>
                <Activity size={10} color={C.safe} /> CUSTOM DATA LIVE — {customSeries.length} DAYS
              </div>
              <button
                onClick={() => { setCustomSeries(null); setChartKey(k => k + 1); }}
                className="moil-mono"
                style={{
                  fontSize: 10.5, padding: "3px 8px", background: C.panel,
                  color: C.oreLight, border: `1px solid ${C.ore}`, cursor: "pointer", borderRadius: 2
                }}
              >
                Reset to MOIL Real Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Body: Responsive Navigation & Content */}
      <div style={{ display: "flex", flex: 1, flexDirection: "row", overflow: "hidden" }} className="control-room-layout">
        <style>{`
          @media (max-width: 768px) {
            .control-room-layout { flex-direction: column !important; }
            .dashboard-nav-sidebar {
              width: 100% !important;
              flex-direction: row !important;
              overflow-x: auto !important;
              border-right: none !important;
              border-bottom: 1px solid ${C.border} !important;
              padding: 6px 10px !important;
            }
            .dashboard-nav-item {
              padding: 8px 12px !important;
              border-left: none !important;
              border-bottom: 2px solid transparent !important;
              white-space: nowrap !important;
            }
            .dashboard-nav-item.active {
              border-bottom: 2px solid ${C.ore} !important;
            }
          }
        `}</style>

        {/* Navigation Sidebar */}
        <div className="dashboard-nav-sidebar" style={{
          width: 175, borderRight: `1px solid ${C.border}`,
          padding: "16px 0", flexShrink: 0, display: "flex", flexDirection: "column",
          background: C.panel
        }}>
          {NAV_ITEMS.map((n) => {
            const Icon = n.icon;
            const act = tab === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setTab(n.id)}
                aria-current={act ? "page" : undefined}
                className={`dashboard-nav-item ${act ? "active" : ""}`}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 16px", cursor: "pointer",
                  color: act ? C.text : C.muted,
                  borderLeft: `3px solid ${act ? C.ore : "transparent"}`,
                  background: act ? C.panelRaised : "transparent",
                  fontSize: 12, fontWeight: act ? 600 : 400,
                  transition: "background 0.15s ease",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "inherit",
                  borderTop: "none",
                  borderRight: "none",
                  borderBottom: "none"
                }}
              >
                <Icon size={14} color={act ? C.oreLight : C.mutedDark} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.id === "overview" && visibleAlerts.length > 0 && (
                  <span className="moil-mono" style={{
                    fontSize: 9.5, minWidth: 16, height: 16, borderRadius: 8,
                    background: visibleAlerts.some(a => a.severity === "red") ? C.risk : C.caution,
                    color: C.void, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 4px", flexShrink: 0
                  }}>
                    {visibleAlerts.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div style={{ flex: 1, padding: "20px 18px", overflowX: "hidden" }}>
          {/* 1. MINE OVERVIEW */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Alert Panel — live, scrollable, dismissible red/amber flag feed */}
              {visibleAlerts.length > 0 && (
                <div className="moil-alert-panel" style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, borderRadius: 2, overflow: "hidden" }}>
                  <style>{`
                    @keyframes moil-alert-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(194,69,46,0.35); } 50% { box-shadow: 0 0 0 4px rgba(194,69,46,0); } }
                    .moil-alert-new { animation: moil-alert-glow 1.6s ease-out 2; }
                    @media (max-width: 640px) {
                      .moil-alert-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
                      .moil-alert-scrollbox { max-height: 240px !important; }
                      .moil-alert-item-meta { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
                    }
                  `}</style>

                  {/* Sticky header: live indicator, counts, clock, collapse toggle */}
                  <div
                    className="moil-alert-header"
                    onClick={() => setAlertPanelOpen((v) => !v)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                      padding: "10px 14px", background: C.panel, borderBottom: alertPanelOpen ? `1px solid ${C.border}` : "none",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", background: C.risk, flexShrink: 0,
                        animation: "moil-pulse-soft 1.4s ease-in-out infinite"
                      }} />
                      <span className="moil-mono" style={{ fontSize: 11, color: C.text, fontWeight: 700, letterSpacing: 0.5 }}>LIVE ALERTS</span>
                      <span className="moil-mono" style={{ fontSize: 10.5, padding: "1px 7px", borderRadius: 8, background: C.risk, color: C.void }}>
                        {visibleAlerts.filter(a => a.severity === "red").length} critical
                      </span>
                      <span className="moil-mono" style={{ fontSize: 10.5, padding: "1px 7px", borderRadius: 8, background: C.caution, color: C.void }}>
                        {visibleAlerts.filter(a => a.severity === "amber").length} watch
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>
                        As of {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAlertPanelOpen((v) => !v); }}
                        title={alertPanelOpen ? "Collapse alerts" : "Expand alerts"}
                        className="moil-mono"
                        style={{
                          display: "flex", alignItems: "center", gap: 4, background: C.panelRaised,
                          border: `1px solid ${C.border}`, color: C.muted, padding: "3px 8px", borderRadius: 2,
                          cursor: "pointer", fontSize: 10
                        }}
                      >
                        {alertPanelOpen ? "Hide" : "Show"}
                        <ChevronDown size={12} style={{ transform: alertPanelOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable alert feed */}
                  {alertPanelOpen && (
                  <div className="moil-scroll moil-alert-scrollbox" style={{ maxHeight: 280, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {visibleAlerts.map((a) => {
                      const toneColor = a.severity === "red" ? C.risk : C.caution;
                      const ageMs = liveTime.getTime() - a.detectedAt;
                      const isRecent = ageMs < 45000;
                      return (
                        <div
                          key={a.id}
                          className={isRecent ? "moil-alert-new" : ""}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            background: C.panel, border: `1px solid ${toneColor}`,
                            borderLeft: `4px solid ${toneColor}`, padding: "11px 14px", borderRadius: 2,
                            minWidth: 0
                          }}
                        >
                          <AlertTriangle size={16} color={toneColor} style={{ flexShrink: 0, marginTop: 1 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="moil-alert-item-meta" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                                <span className="moil-mono" style={{ fontSize: 9.5, padding: "1px 6px", border: `1px solid ${toneColor}`, color: toneColor, flexShrink: 0 }}>
                                  {a.severity === "red" ? "CRITICAL" : "WATCH"}
                                </span>
                                {isRecent && (
                                  <span className="moil-mono" style={{ fontSize: 9, padding: "1px 6px", background: C.safe, color: C.void, borderRadius: 8 }}>NEW</span>
                                )}
                                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, wordBreak: "break-word" }}>{a.title}</span>
                              </div>
                              <span className="moil-mono" style={{ fontSize: 10, color: C.mutedDark, flexShrink: 0 }}>{formatTimeAgo(ageMs)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 3, wordBreak: "break-word" }}>{a.detail}</div>
                            {a.actionTab && (
                              <button
                                onClick={() => runAlertAction(a)}
                                className="moil-mono"
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8,
                                  background: "transparent", border: `1px solid ${toneColor}`, color: toneColor,
                                  padding: "4px 9px", borderRadius: 2, cursor: "pointer", fontSize: 10.5, fontWeight: 600
                                }}
                              >
                                {a.actionLabel} <ArrowUpRight size={11} />
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => dismissAlert(a.id)}
                            title="Dismiss"
                            style={{
                              flexShrink: 0, background: "transparent", border: "none", cursor: "pointer",
                              color: C.mutedDark, padding: 4, marginLeft: 4, borderRadius: 2
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <DKPI label="TODAY'S PRODUCTION" value={`${latest.actual}t`} sub={`Planned target ${latest.planned}t`} />
                <DKPI label="REVENUE SHORTFALL" value={`₹${revenueLossLakhs}L`} tone={revenueLossLakhs > 10 ? "risk" : "safe"} sub={`${shortfallTonnes}t @ ₹14,200/t avg`} />
                <DKPI label="SHORTFALL RISK" value={`${latest.risk}%`} tone={latest.risk > 60 ? "risk" : latest.risk > 35 ? "caution" : "safe"} sub="72hr Forecast Horizon" />
                <DKPI label="DGMS COMPLIANCE" value={`${complianceScore}%`} tone={complianceScore === 100 ? "safe" : "caution"} sub="Mandatory Mine Safety" />
              </div>

              {/* 30-Day Planned vs Actual Chart */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: "18px 16px 8px", minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{selectedMine}: Planned vs Actual Output (Last 30 Days)</div>
                  <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark }}>Unit: Metric Tonnes (t)</div>
                </div>
                <div style={{ width: "100%", height: 210 }}>
                  <ResponsiveContainer key={`area-${chartKey}-${selectedMine}`} width="100%" height="100%">
                    <AreaChart data={series} margin={{ left: -15, right: 10, top: 5, bottom: 0 }}>
                      <defs>
                        <linearGradient id="oreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.ore} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={C.ore} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.border} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke={C.mutedDark} tick={{ fontSize: 10 }} interval={4} />
                      <YAxis stroke={C.mutedDark} tick={{ fontSize: 10 }} />
                      <Tooltip content={<DTooltip />} />
                      <Line type="monotone" dataKey="planned" name="Planned" stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      <Area type="monotone" dataKey="actual" name="Actual" stroke={C.oreLight} strokeWidth={2} fill="url(#oreGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Real MP District Production (IBM Data) */}
              <div style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: "18px 16px 8px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="moil-mono" style={{ fontSize: 9.5, color: C.safe, border: `1px solid ${C.safe}`, padding: "1px 6px" }}>
                      GOVT OF INDIA DATA
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>Madhya Pradesh District Output (FY2019-20)</span>
                  </div>
                  <span className="moil-mono" style={{ fontSize: 11, color: C.mutedDark }}>Table 5(B), Indian Bureau of Mines</span>
                </div>
                <div style={{ width: "100%", height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={REAL_MP_DISTRICTS} margin={{ left: -15, right: 10, top: 8, bottom: 0 }}>
                      <CartesianGrid stroke={C.border} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="district" stroke={C.mutedDark} tick={{ fontSize: 10 }} />
                      <YAxis stroke={C.mutedDark} tick={{ fontSize: 10 }} />
                      <Tooltip content={<DTooltip />} />
                      <Bar dataKey="tonnes" name="Production (t)" radius={[2, 2, 0, 0]}>
                        {REAL_MP_DISTRICTS.map((d) => (
                          <Cell key={d.district} fill={d.district === selectedMine ? C.oreLight : C.borderLight} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 2. RESERVE HEATMAP WITH CELL INSPECTOR & DRILL DISPATCH */}
          {tab === "reserve" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Satellite & Borehole Fusion Reserve Grid</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    28×28 grid cells across {mine.leaseAreaKm2} km² lease. Click any cell to inspect or dispatch core drills.
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, background: C.oreLight }} />
                    <span className="moil-mono" style={{ fontSize: 10.5, color: C.muted }}>High Probability</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, background: C.border }} />
                    <span className="moil-mono" style={{ fontSize: 10.5, color: C.muted }}>Undrilled/Low</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {/* SVG Heatmap Grid */}
                <div style={{
                  background: C.panel, border: `1px solid ${C.borderLight}`,
                  padding: 14, flex: "1 1 300px", maxWidth: 380, display: "flex", justifyContent: "center"
                }}>
                  <svg viewBox="0 0 308 308" width="100%" style={{ maxHeight: 330 }}>
                    {gridCells.map((c) => {
                      const isInspected = inspectedCell?.id === c.id;
                      return (
                        <rect
                          key={c.id}
                          x={c.x * 11}
                          y={c.y * 11}
                          width={10}
                          height={10}
                          fill={shade(c.p)}
                          stroke={isInspected || hoveredCell?.id === c.id ? C.text : c.drilled ? C.safe : "none"}
                          strokeWidth={isInspected ? 1.5 : hoveredCell?.id === c.id ? 1.2 : c.drilled ? 1 : 0}
                          style={{ cursor: "pointer", transition: "stroke 0.15s ease, opacity 0.15s ease", opacity: hoveredCell && hoveredCell.id !== c.id ? 0.72 : 1 }}
                          onMouseEnter={() => setHoveredCell(c)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onFocus={() => setHoveredCell(c)}
                          onBlur={() => setHoveredCell(null)}
                          onClick={() => setInspectedCell(c)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") setInspectedCell(c);
                          }}
                          aria-label={`Lease block ${c.x}, ${c.y}, ${(c.p * 100).toFixed(1)} percent reserve probability`}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Selected Cell Inspector Dossier */}
                <div style={{
                  flex: "1 1 280px", background: C.panel, border: `1px solid ${C.borderLight}`,
                  padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between"
                }}>
                  {inspectedCell ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
                        <div className="moil-mono" style={{ fontSize: 13, fontWeight: 700, color: C.oreLight }}>
                          Lease Block [{inspectedCell.x}, {inspectedCell.y}]
                        </div>
                        <span className="moil-mono" style={{
                          fontSize: 9.5, padding: "2px 6px",
                          border: `1px solid ${inspectedCell.drilled ? C.safe : C.caution}`,
                          color: inspectedCell.drilled ? C.safe : C.caution
                        }}>
                          {inspectedCell.drilled ? "DRILL VERIFIED" : "UNDRILLED LEASE"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>RESERVE PROBABILITY</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: inspectedCell.p > 0.6 ? C.safe : C.oreLight }}>
                            {(inspectedCell.p * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>ESTIMATED ORE GRADE</div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>
                            {inspectedCell.gradeEstimate}
                          </div>
                        </div>
                        <div>
                          <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>SENTINEL-2 NDVI</div>
                          <div className="moil-mono" style={{ fontSize: 14, color: C.atmosphere }}>
                            {inspectedCell.ndvi}
                          </div>
                        </div>
                        <div>
                          <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>THERMAL SIGNATURE</div>
                          <div className="moil-mono" style={{ fontSize: 14, color: C.caution }}>
                            {inspectedCell.thermalAnomaly}°C
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: 12.5, color: C.muted, margin: "6px 0 0", lineHeight: 1.5 }}>
                        Spectral inversion models indicate bedded gondite layers. Borehole verification recommended before open-pit bench development.
                      </p>

                      <button
                        onClick={() => dispatchDrillToCell(inspectedCell)}
                        disabled={inspectedCell.drilled}
                        className="moil-mono"
                        style={{
                          marginTop: 10, padding: "10px 14px",
                          background: inspectedCell.drilled ? C.panelRaised : C.ore,
                          color: inspectedCell.drilled ? C.muted : C.void,
                          border: `1px solid ${inspectedCell.drilled ? C.border : C.oreLight}`,
                          fontWeight: 600, fontSize: 12, cursor: inspectedCell.drilled ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                        }}
                      >
                        <HardHat size={14} />
                        {inspectedCell.drilled ? "Core Drilling Dispatched" : t.drillDispatchBtn}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 180, color: C.muted, textAlign: "center" }}>
                      <Compass size={28} color={C.mutedDark} style={{ marginBottom: 10 }} />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>No Grid Block Selected</div>
                      <div style={{ fontSize: 11.5, color: C.mutedDark, maxWidth: 220, marginTop: 4 }}>
                        Hover or focus a cell to preview satellite spectroscopy and ore confidence.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. FORECAST & WHAT-IF SIMULATOR */}
          {tab === "forecast" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Trend Chart */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: "16px 16px 8px", minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>30-Day Operational Shortfall Risk Timeline (%)</div>
                  <div className="moil-mono" style={{ fontSize: 11, color: C.caution }}>
                    PLAYBACK: {series[forecastIndex]?.day || "D1"} · {series[forecastIndex]?.risk || 0}% RISK
                  </div>
                </div>
                <div style={{ width: "100%", height: 140 }}>
                  <ResponsiveContainer key={`line-${chartKey}-${selectedMine}`} width="100%" height="100%">
                    <LineChart data={series} margin={{ left: -15, right: 10, top: 5, bottom: 0 }}>
                      <CartesianGrid stroke={C.border} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke={C.mutedDark} tick={{ fontSize: 10 }} interval={4} />
                      <YAxis stroke={C.mutedDark} tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip content={<DTooltip />} />
                      <Line type="monotone" dataKey="risk" name="Shortfall Risk %" stroke={C.risk} strokeWidth={2} dot={{ r: 2, fill: C.risk }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="moil-mono"
                    onClick={() => setForecastPlaying((playing) => !playing)}
                    style={{ padding: "7px 12px", background: forecastPlaying ? C.panelRaised : C.ore, color: forecastPlaying ? C.oreLight : C.void, border: `1px solid ${forecastPlaying ? C.ore : C.oreLight}`, cursor: "pointer", borderRadius: 2, fontSize: 11, fontWeight: 600 }}
                    aria-label={forecastPlaying ? "Pause forecast playback" : "Play forecast playback"}
                  >
                    {forecastPlaying ? "PAUSE" : "PLAY FORECAST"}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, series.length - 1)}
                    value={forecastIndex}
                    onChange={(event) => { setForecastPlaying(false); setForecastIndex(Number(event.target.value)); }}
                    style={{ flex: 1, minWidth: 120 }}
                    aria-label="Forecast playback day"
                  />
                  <button
                    type="button"
                    className="moil-mono"
                    onClick={() => { setForecastPlaying(false); setForecastIndex(0); }}
                    style={{ padding: "7px 10px", background: C.panelRaised, color: C.muted, border: `1px solid ${C.borderLight}`, cursor: "pointer", borderRadius: 2, fontSize: 11 }}
                  >
                    RESET
                  </button>
                </div>
              </div>

              {/* What-If Sandbox */}
              <div style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Sliders size={16} color={C.oreLight} />
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.whatIfTitle}</div>
                  </div>
                  <button
                    type="button"
                    onClick={resetSimulation}
                    className="moil-mono"
                    style={{ padding: "6px 10px", background: C.panel, color: C.muted, border: `1px solid ${C.borderLight}`, cursor: "pointer", borderRadius: 2, fontSize: 10.5 }}
                  >
                    RESET SCENARIO
                  </button>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
                  {t.whatIfSub}
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark, marginBottom: 8 }}>REHEARSE A NAMED OPERATING SCENARIO</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {scenarioPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyScenarioPreset(preset)}
                        className="moil-mono"
                        title={preset.detail}
                        style={{ padding: "6px 9px", background: C.panel, color: C.oreLight, border: `1px solid ${C.borderLight}`, cursor: "pointer", borderRadius: 2, fontSize: 10.5 }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 20 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                      <span className="moil-mono" style={{ color: C.muted }}>{t.rainfallLabel}</span>
                      <strong className="moil-mono" style={{ color: C.atmosphere }}>{simRain} mm</strong>
                    </div>
                    <input type="range" min="0" max="60" value={simRain} onChange={(e) => setSimRain(+e.target.value)} style={{ width: "100%" }} />
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                      <span className="moil-mono" style={{ color: C.muted }}>{t.downtimeLabel}</span>
                      <strong className="moil-mono" style={{ color: C.risk }}>{simDowntime} hrs</strong>
                    </div>
                    <input type="range" min="0" max="8" step="0.5" value={simDowntime} onChange={(e) => setSimDowntime(+e.target.value)} style={{ width: "100%" }} />
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                      <span className="moil-mono" style={{ color: C.muted }}>{t.blastingLabel}</span>
                      <strong className="moil-mono" style={{ color: C.caution }}>{simBlasting} hrs</strong>
                    </div>
                    <input type="range" min="0" max="4" value={simBlasting} onChange={(e) => setSimBlasting(+e.target.value)} style={{ width: "100%" }} />
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                      <span className="moil-mono" style={{ color: C.muted }}>{t.fleetLabel}</span>
                      <strong className="moil-mono" style={{ color: C.safe }}>{simFleet} / 10</strong>
                    </div>
                    <input type="range" min="5" max="10" value={simFleet} onChange={(e) => setSimFleet(+e.target.value)} style={{ width: "100%" }} />
                  </div>
                </div>

                {/* Simulation Output Card */}
                <div style={{
                  background: C.panel, border: `1px solid ${C.border}`,
                  padding: "16px 20px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap"
                }}>
                  <div>
                    <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark }}>PREDICTED SHORTFALL RISK</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: simResult.tone === "risk" ? C.risk : simResult.tone === "caution" ? C.caution : C.safe }}>
                      {simResult.risk}%
                    </div>
                  </div>
                  <div>
                    <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark }}>PROJECTED OUTPUT</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>
                      {simResult.output}t <span style={{ fontSize: 12, color: C.muted }}>/ {simResult.planned}t</span>
                    </div>
                  </div>
                  {simResult.deficit > 0 && (
                    <div>
                      <div className="moil-mono" style={{ fontSize: 10.5, color: C.risk }}>REVENUE DEFICIT</div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: C.risk }}>
                        ₹{simResult.deficitLakhs} Lakhs <span style={{ fontSize: 12, color: C.muted }}>(-{simResult.deficit}t)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Zone-Level What-If — location-specific deployment simulator */}
              <div style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <MapPin size={16} color={C.oreLight} />
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Zone-Level Deployment Simulator</div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
                  Model adding extra trucks or loaders to one specific work zone and see whether it closes today's mine-wide shortfall — independent of the mine-wide scenario above.
                </div>

                <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 20 }}>
                  <div style={{ flex: "1 1 240px" }}>
                    <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark, marginBottom: 6 }}>DEPLOY TO ZONE</div>
                    <select
                      value={zoneSimId}
                      onChange={(e) => setZoneSimId(e.target.value)}
                      className="moil-mono"
                      style={{ width: "100%", background: C.panel, color: C.text, border: `1px solid ${C.border}`, padding: "9px 10px", fontSize: 12.5, borderRadius: 2 }}
                    >
                      {zoneRoster.map((z) => (
                        <option key={z.id} value={z.id}>{z.name} — ~{z.targetTonnes}t/day, {z.baseTrucks} units baseline</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: "1 1 240px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                      <span className="moil-mono" style={{ color: C.muted }}>Additional Trucks / Loaders Deployed</span>
                      <strong className="moil-mono" style={{ color: C.safe }}>+{zoneExtraUnits}</strong>
                    </div>
                    <input type="range" min="0" max="4" value={zoneExtraUnits} onChange={(e) => setZoneExtraUnits(+e.target.value)} style={{ width: "100%" }} />
                  </div>
                </div>

                <div style={{
                  background: C.panel, border: `1px solid ${zoneSimResult.closesGapPct >= 100 && zoneSimResult.mineShortfall > 0 ? C.safe : C.border}`,
                  padding: "16px 20px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap"
                }}>
                  <div>
                    <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark }}>{activeZone.name.toUpperCase()} PROJECTED OUTPUT</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>
                      {zoneSimResult.projectedZoneOutput}t <span style={{ fontSize: 12, color: C.muted }}>/ {activeZone.targetTonnes}t baseline</span>
                    </div>
                  </div>
                  <div>
                    <div className="moil-mono" style={{ fontSize: 10.5, color: C.safe }}>RECOVERED OUTPUT</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: C.safe }}>
                      +{zoneSimResult.recovered}t <span style={{ fontSize: 12, color: C.muted }}>(~{zoneSimResult.recoveredPerUnit}t per added unit)</span>
                    </div>
                  </div>
                  <div>
                    <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark }}>TODAY'S MINE-WIDE SHORTFALL</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>{zoneSimResult.mineShortfall}t</div>
                  </div>
                  <div style={{ flex: "1 1 170px", minWidth: 170 }}>
                    <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark, marginBottom: 6 }}>CLOSES SHORTFALL GAP</div>
                    <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ width: `${zoneSimResult.mineShortfall > 0 ? zoneSimResult.closesGapPct : 100}%`, height: "100%", background: (zoneSimResult.closesGapPct >= 100 || zoneSimResult.mineShortfall === 0) ? C.safe : C.ore }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: (zoneSimResult.closesGapPct >= 100 || zoneSimResult.mineShortfall === 0) ? C.safe : C.oreLight, display: "flex", alignItems: "center", gap: 6 }}>
                      {(zoneSimResult.closesGapPct >= 100 || zoneSimResult.mineShortfall === 0) && <CheckCircle2 size={14} color={C.safe} />}
                      {zoneSimResult.mineShortfall === 0
                        ? "No active shortfall today"
                        : zoneSimResult.closesGapPct >= 100
                          ? "Fully closes today's shortfall"
                          : `${zoneSimResult.closesGapPct}% of today's shortfall`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability / SHAP Factor Importance */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 18, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Global ML Feature Drivers (SHAP Attribution)</div>
                <div style={{ width: "100%", height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={RISK_FACTORS} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                      <XAxis type="number" stroke={C.mutedDark} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="label" stroke={C.mutedDark} width={140} tick={{ fontSize: 11 }} />
                      <Tooltip content={<DTooltip />} />
                      <Bar dataKey="value" name="Impact (pts)" radius={[0, 2, 2, 0]}>
                        {RISK_FACTORS.map((_, i) => (
                          <Cell key={i} fill={i < 2 ? C.risk : C.oreLight} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 4. SHIFT DIRECTIVES & ACTIONS */}
          {tab === "actions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Root-Cause Breakdown — "Why did we fall short?" */}
              <div style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <AlertTriangle size={15} color={C.oreLight} />
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Why This Shortfall Happened — Root Cause Breakdown ({activeDay.day})</div>
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 12 }}>
                  Modeled contribution of each causal driver behind {Math.max(0, activeDay.planned - activeDay.actual)}t of lost output, with a recurrence-prevention strategy for each — distinct from the immediate shift directives below.
                </div>

                {shortfallCauses.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: C.safe, display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={16} color={C.safe} /> No dominant loss drivers detected for {activeDay.day} — output tracked within tolerance of plan.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {shortfallCauses.map((c) => (
                      <div key={c.key} style={{ background: C.panel, border: `1px solid ${C.border}`, padding: "12px 14px", borderRadius: 2 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                          <div className="moil-mono" style={{ fontSize: 12, color: C.oreLight }}>-{c.tonnes}t &nbsp;({c.pct}% of modeled loss)</div>
                        </div>
                        <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                          <div style={{ width: `${c.pct}%`, height: "100%", background: C.ore }} />
                        </div>
                        <div style={{ fontSize: 11.5, color: C.mutedDark, marginBottom: 4 }}>Observed: {c.metric}</div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                          <strong style={{ color: C.safe }}>Prevent recurrence: </strong>{c.prevention}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark }}>SHIFT DATE:</div>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="moil-mono"
                    style={{ background: C.panel, color: C.text, border: `1px solid ${C.border}`, fontSize: 12, padding: "5px 10px", borderRadius: 2 }}
                  >
                    {series.map((d) => (
                      <option key={d.day} value={d.day}>{d.day} — {d.risk}% Risk ({d.actual}t actual)</option>
                    ))}
                  </select>

                  {/* Search Filter */}
                  <div style={{ display: "flex", alignItems: "center", background: C.panel, border: `1px solid ${C.border}`, padding: "4px 8px", borderRadius: 2 }}>
                    <Search size={13} color={C.muted} />
                    <input
                      type="text"
                      placeholder="Filter actions by team/keyword..."
                      value={actionSearch}
                      onChange={(e) => setActionSearch(e.target.value)}
                      className="moil-mono"
                      style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 11.5, marginLeft: 6, width: 170 }}
                    />
                  </div>
                </div>

                <button
                  onClick={exportShiftCSV}
                  className="moil-mono"
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 14px", background: C.panelRaised,
                    color: C.oreLight, border: `1px solid ${C.ore}`,
                    cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 2
                  }}
                >
                  <Download size={14} /> {t.exportShiftPlan}
                </button>
              </div>

              {/* Action List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 460, overflowY: "auto" }} className="moil-scroll">
                {filteredActions.length === 0 ? (
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 20, fontSize: 13, color: C.safe, textAlign: "center" }}>
                    <ShieldCheck size={28} color={C.safe} style={{ margin: "0 auto 8px" }} />
                    Zero shortfall triggers detected on {activeDay.day}.
                  </div>
                ) : (
                  filteredActions.map((a) => {
                    const isDone = actionStatuses[a.id] === "EXECUTED";
                    const actionValueLakhs = +((a.recovered * ORE_PRICING.blendedAverage) / 100000).toFixed(2);
                    return (
                      <div
                        key={a.id}
                        style={{
                          background: isDone ? C.panelHighlight : C.panel,
                          border: `1px solid ${isDone ? C.safe : C.borderLight}`,
                          padding: "16px 18px", borderRadius: 2,
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span className="moil-mono" style={{
                                fontSize: 9.5, padding: "1px 6px",
                                border: `1px solid ${a.priority === "CRITICAL" ? C.risk : C.caution}`,
                                color: a.priority === "CRITICAL" ? C.risk : C.caution
                              }}>
                                {a.priority}
                              </span>
                              <span className="moil-mono" style={{ fontSize: 11, color: C.mutedDark }}>
                                Assigned: {a.team}
                              </span>
                            </div>
                            <div style={{
                              fontSize: 14, fontWeight: 600,
                              textDecoration: isDone ? "line-through" : "none",
                              color: isDone ? C.muted : C.text
                            }}>
                              {a.action}
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                              Trigger: {a.trigger}
                            </div>
                            <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark, marginTop: 6 }}>
                              {a.standardProcedure}
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                            <div className="moil-mono" style={{
                              fontSize: 11, padding: "3px 8px",
                              border: `1px solid ${C.safe}`, color: C.safe, background: C.panelRaised
                            }}>
                              +{a.recovered}t (₹{actionValueLakhs}L)
                            </div>
                            <button
                              onClick={() => toggleActionStatus(a.id)}
                              className="moil-mono"
                              style={{
                                padding: "6px 12px",
                                background: isDone ? C.safe : C.panelRaised,
                                color: isDone ? C.void : C.text,
                                border: `1px solid ${isDone ? C.safe : C.borderLight}`,
                                cursor: "pointer", fontSize: 11, fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 6
                              }}
                            >
                              {isDone ? <Check size={12} /> : null}
                              {isDone ? "EXECUTED" : "MARK EXECUTED"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <div className="moil-mono" style={{ fontSize: 10.5, color: C.atmosphere }}>DECISION AUDIT TRAIL</div>
                  <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>LOCAL SESSION · {auditEvents.length} EVENTS</div>
                </div>
                {auditEvents.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: C.mutedDark }}>Scenario rehearsals, drill dispatches, and action decisions will appear here with timestamps.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 180, overflowY: "auto" }} className="moil-scroll">
                    {auditEvents.slice(0, 8).map((event) => (
                      <div key={event.id} style={{ display: "flex", gap: 10, alignItems: "baseline", borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
                        <span className="moil-mono" style={{ fontSize: 9.5, color: C.mutedDark, flexShrink: 0 }}>
                          {new Date(event.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="moil-mono" style={{ fontSize: 9.5, color: C.oreLight, flexShrink: 0 }}>{event.type}</span>
                        <span style={{ fontSize: 11.5, color: C.muted }}>{event.subject}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. 3D GEOLOGICAL PIT & SHAFT CROSS-SECTION */}
          {(tab === "3d" || tab === "explorer3d") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{mine.name}: Geological Strata & Shaft Cross-Section</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Interactive Sausar Group stratigraphic column calibrated against Geological Survey of India (GSI) borehole logs.
                  </div>
                </div>
                <span className="moil-mono" style={{ fontSize: 10.5, color: C.atmosphere, border: `1px solid ${C.atmosphereDim}`, padding: "2px 6px" }}>
                  DEPTH: -{strataDepth}m RL
                </span>
              </div>

              {/* Depth Slider Control */}
              <div style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: "14px 18px", borderRadius: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span className="moil-mono" style={{ color: C.muted }}>Explore Geological Horizon (Depth below surface)</span>
                  <strong className="moil-mono" style={{ color: C.oreLight }}>-{strataDepth} Meters</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="350"
                  value={strataDepth}
                  onChange={(e) => setStrataDepth(+e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {/* Visual SVG Strata Cutaway */}
                <div style={{ flex: "1 1 320px", background: C.panel, border: `1px solid ${C.border}`, padding: 16, borderRadius: 2 }}>
                  <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark, marginBottom: 8 }}>STRATIGRAPHIC COLUMN & SHAFTS</div>
                  <svg viewBox="0 0 400 300" width="100%" style={{ maxHeight: 280 }}>
                    {/* Layer 1: Overburden */}
                    <rect x="20" y="20" width="360" height="35" fill="#8B5A2B" opacity={strataDepth <= 18 ? 1 : 0.4} stroke={strataDepth <= 18 ? C.text : "none"} strokeWidth="1.5" />
                    <text x="35" y="42" fill="#EDE5D3" fontSize="11" fontFamily="IBM Plex Mono">Surface Laterite & Alluvium (0 to -18m)</text>

                    {/* Layer 2: Mansar Ore Body */}
                    <rect x="20" y="55" width="360" height="110" fill={C.ore} opacity={strataDepth > 18 && strataDepth <= 195 ? 1 : 0.45} stroke={strataDepth > 18 && strataDepth <= 195 ? C.text : "none"} strokeWidth="1.5" />
                    <text x="35" y="105" fill="#110F0B" fontSize="13" fontWeight="bold" fontFamily="IBM Plex Mono">Mansar Gondite & Braunite (-18m to -195m)</text>
                    <text x="35" y="125" fill="#110F0B" fontSize="10" fontFamily="IBM Plex Mono">High Grade Economic Manganese Body (38-48% Mn)</text>

                    {/* Layer 3: Lohangi Marble */}
                    <rect x="20" y="165" width="360" height="65" fill="#5A6557" opacity={strataDepth > 195 && strataDepth <= 275 ? 1 : 0.4} stroke={strataDepth > 195 && strataDepth <= 275 ? C.text : "none"} strokeWidth="1.5" />
                    <text x="35" y="200" fill="#EDE5D3" fontSize="11" fontFamily="IBM Plex Mono">Lohangi Marble & Calc-Silicate (-195m to -275m)</text>

                    {/* Layer 4: Tirodi Gneiss */}
                    <rect x="20" y="230" width="360" height="60" fill="#2C2822" opacity={strataDepth > 275 ? 1 : 0.4} stroke={strataDepth > 275 ? C.text : "none"} strokeWidth="1.5" />
                    <text x="35" y="265" fill="#EDE5D3" fontSize="11" fontFamily="IBM Plex Mono">Tirodi Biotite Gneiss Basement (-275m to -450m+)</text>

                    {/* Underground Vertical Shaft (Bharweli mine only) */}
                    {mine.shaftDepthMeters > 0 && (
                      <g>
                        <rect x="330" y="10" width="22" height="275" fill={C.void} stroke={C.atmosphere} strokeWidth="1.5" />
                        <line x1="341" y1="10" x2="341" y2="285" stroke={C.atmosphereDim} strokeDasharray="3 3" />
                        {/* Elevator cage */}
                        <rect x="332" y={Math.min(260, 20 + strataDepth * 0.7)} width="18" height="14" fill={C.atmosphere} />
                        <text x="240" y="295" fill={C.atmosphere} fontSize="9" fontFamily="IBM Plex Mono">Bharweli Main Shaft (385m)</text>
                      </g>
                    )}

                    {/* Active Depth Horizon Line */}
                    <line x1="10" y1={Math.min(285, 20 + strataDepth * 0.75)} x2="390" y2={Math.min(285, 20 + strataDepth * 0.75)} stroke={C.safe} strokeWidth="2" strokeDasharray="4 2" />
                  </svg>
                </div>

                {/* Strata Details Card */}
                <div style={{ flex: "1 1 280px", background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: 18, borderRadius: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="moil-mono" style={{ fontSize: 10, color: C.safe, border: `1px solid ${C.safe}`, padding: "1px 6px" }}>
                      INTERSECTED FORMATION
                    </span>
                    <span className="moil-mono" style={{ fontSize: 11, color: C.muted }}>{activeStrata.depthRange}</span>
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: C.oreLight }}>
                    {activeStrata.name}
                  </h4>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: "0 0 14px" }}>
                    {activeStrata.description}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <div>
                      <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>MANGANESE GRADE</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{activeStrata.oreContent}</div>
                    </div>
                    <div>
                      <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>MOHS HARDNESS</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{activeStrata.hardnessMohs}</div>
                    </div>
                    <div>
                      <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>DRILLING PENETRATION</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{activeStrata.drillingRateMetersPerHour} m/hr</div>
                    </div>
                    <div>
                      <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>MINE METHOD</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{mine.method}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. DGMS STATUTORY SAFETY & SHIFT HANDOVER */}
          {tab === "dgms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }} id="printable-dossier">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Directorate General of Mines Safety (DGMS) Statutory Checklist</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Mandatory pre-shift verification under Mines Act 1952 and Coal & Metalliferous Mines Regulations (CMR 2017).
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => window.print()}
                    className="moil-mono"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", background: C.panelRaised,
                      color: C.oreLight, border: `1px solid ${C.ore}`,
                      cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 2
                    }}
                  >
                    <Printer size={14} /> Print Shift Handover Dossier
                  </button>
                </div>
              </div>

              {/* Compliance Score Bar */}
              <div style={{
                background: C.panelRaised, border: `1px solid ${complianceScore === 100 ? C.safe : C.caution}`,
                padding: "14px 18px", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ShieldCheck size={22} color={complianceScore === 100 ? C.safe : C.caution} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      Safety Status: {complianceScore === 100 ? "100% DGMS COMPLIANT — AUTHORIZED TO OPERATE" : `${complianceScore}% COMPLIANCE — CAUTIONARY DIRECTIVES ACTIVE`}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted }}>
                      Shift Manager: Er. R. K. Sharma (Mine Manager First Class Certificate #MM-4109)
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: complianceScore === 100 ? C.safe : C.caution }}>
                  {complianceScore}%
                </div>
              </div>

              {/* Checklist Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {DGMS_SAFETY_ITEMS.map((item) => {
                  const checked = safetyChecklist[item.id] || false;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSafetyChecklist(prev => ({ ...prev, [item.id]: !checked }))}
                      style={{
                        background: C.panel, border: `1px solid ${checked ? C.borderLight : C.risk}`,
                        padding: "14px 16px", borderRadius: 2, cursor: "pointer",
                        display: "flex", alignItems: "flex-start", gap: 14
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 3,
                        border: `1.5px solid ${checked ? C.safe : C.risk}`,
                        background: checked ? C.safe : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 2, flexShrink: 0
                      }}>
                        {checked && <Check size={14} color={C.void} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.title}</div>
                          <span className="moil-mono" style={{ fontSize: 10, color: C.atmosphere, background: C.panelRaised, padding: "1px 6px" }}>
                            {item.statute}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0", lineHeight: 1.5 }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. CUSTOM CSV UPLOADER */}
          {tab === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Upload Mine Telemetry or Drill Hole CSV</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Import custom daily operations logs to run through the MOIL reserve and shortfall AI models in real time.
                </div>
              </div>

              {/* Drag and drop upload zone */}
              <div style={{
                background: C.panel, border: `2px dashed ${C.borderLight}`,
                padding: "36px 20px", borderRadius: 3, textAlign: "center",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <Upload size={32} color={C.oreLight} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Select or Drag & Drop Mine CSV File</div>
                <div style={{ fontSize: 12, color: C.muted, maxWidth: 360, marginBottom: 16 }}>
                  Expected columns: <code>day, planned_tonnes, actual_tonnes, rainfall_mm, downtime_hrs, blasting_delay_hrs, active_equipment</code>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  <label style={{
                    padding: "9px 18px", background: C.ore, color: C.void,
                    fontSize: 12.5, fontWeight: 600, cursor: "pointer", borderRadius: 2
                  }}>
                    Browse Files
                    <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} />
                  </label>

                  <button
                    onClick={downloadSampleCSV}
                    className="moil-mono"
                    style={{
                      padding: "9px 16px", background: C.panelRaised, color: C.text,
                      border: `1px solid ${C.borderLight}`, fontSize: 12, cursor: "pointer", borderRadius: 2
                    }}
                  >
                    Download Sample CSV Template
                  </button>
                </div>
              </div>

              {customSeries && (
                <div style={{ background: C.panelRaised, border: `1px solid ${C.safe}`, padding: 16, borderRadius: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.safe, fontWeight: 600, fontSize: 13.5 }}>
                    <CheckCircle2 size={16} /> Active Dataset: Custom Uploaded Mine Log ({customSeries.length} Days)
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    The Control Room charts, shortfall metrics, and prescriptive actions are now running live on your uploaded data.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. NATIONAL RESERVES & MULTI-YEAR TRENDS (Official IBM Data) */}
          {tab === "national" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>India National Reserves & Grade Breakdown</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Official data from Indian Minerals Yearbook, Indian Bureau of Mines (IBM).
                  </div>
                </div>
                <span className="moil-mono" style={{ fontSize: 10, color: C.safe, border: `1px solid ${C.safe}`, padding: "2px 6px" }}>
                  MINISTRY OF MINES (GOI)
                </span>
              </div>

              {/* State Reserves Bar Chart */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: "16px 16px 8px", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>State-Wise Reserves vs Total Resources (Million Tonnes)</div>
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={REAL_RESERVES_BY_STATE} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                      <CartesianGrid stroke={C.border} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="state" stroke={C.mutedDark} tick={{ fontSize: 10 }} />
                      <YAxis stroke={C.mutedDark} tick={{ fontSize: 10 }} />
                      <Tooltip content={<DTooltip />} />
                      <Bar dataKey="reserves_mt" name="Proven Reserves (Mt)" fill={C.ore} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="remaining_resources_mt" name="Remaining Resources (Mt)" fill={C.borderLight} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MP Grade Breakdown */}
              <div style={{ background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: "16px 16px 8px", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Madhya Pradesh Gradewise Production (Tonnes)</div>
                <div style={{ width: "100%", height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MP_GRADE_PRODUCTION} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                      <CartesianGrid stroke={C.border} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="grade" stroke={C.mutedDark} tick={{ fontSize: 9.5 }} />
                      <YAxis stroke={C.mutedDark} tick={{ fontSize: 10 }} />
                      <Tooltip content={<DTooltip />} />
                      <Bar dataKey="balaghat" name="Balaghat (t)" fill={C.safe} stackId="a" />
                      <Bar dataKey="jabalpur" name="Jabalpur (t)" fill={C.caution} stackId="a" />
                      <Bar dataKey="jhabua" name="Jhabua (t)" fill={C.oreLight} stackId="a" />
                      <Bar dataKey="chhindwara" name="Chhindwara (t)" fill={C.atmosphere} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 9. EQUIPMENT CHECK LOGS */}
          {tab === "equipment" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{mine.name}: Fleet Health & Preventive Check Logs</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Log a condition check against any unit below. The most recent entry per unit drives its live status — this is the same "Active Fleet Availability" input used by the shortfall forecast.
                </div>
              </div>

              {/* Fleet Summary KPIs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <DKPI label="OPERATIONAL" value={`${fleetSummary.operational}/10`} tone="safe" sub="No issues logged" />
                <DKPI label="NEEDS ATTENTION" value={`${fleetSummary.watch}/10`} tone={fleetSummary.watch > 0 ? "caution" : "safe"} sub="Flagged for monitoring" />
                <DKPI label="CRITICAL FAULT" value={`${fleetSummary.fault}/10`} tone={fleetSummary.fault > 0 ? "risk" : "safe"} sub="Stopped, awaiting service" />
                <DKPI label="AVG FLEET HEALTH" value={`${fleetSummary.avgHealth}%`} tone={fleetSummary.avgHealth > 75 ? "safe" : fleetSummary.avgHealth > 55 ? "caution" : "risk"} sub="Weighted across 10 units" />
              </div>

              {/* Unit Roster */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {fleetWithStatus.map((unit) => {
                  const toneColor = unit.conditionMeta.tone === "risk" ? C.risk : unit.conditionMeta.tone === "caution" ? C.caution : C.safe;
                  const isOpen = logUnitId === unit.id;
                  return (
                    <div key={unit.id} style={{ background: C.panel, border: `1px solid ${isOpen ? C.ore : C.border}`, borderRadius: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 220 }}>
                          <Truck size={16} color={toneColor} />
                          <div>
                            <div className="moil-mono" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{unit.id}</div>
                            <div style={{ fontSize: 11.5, color: C.muted }}>{unit.type}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                          <div style={{ minWidth: 90 }}>
                            <div className="moil-mono" style={{ fontSize: 9.5, color: C.mutedDark }}>HEALTH</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 60, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${unit.health}%`, height: "100%", background: toneColor }} />
                              </div>
                              <span style={{ fontSize: 11.5, color: toneColor, fontWeight: 600 }}>{unit.health}%</span>
                            </div>
                          </div>
                          <div style={{ minWidth: 110 }}>
                            <div className="moil-mono" style={{ fontSize: 9.5, color: C.mutedDark }}>HRS SINCE SERVICE</div>
                            <div style={{ fontSize: 11.5, color: unit.hoursSinceService > unit.serviceIntervalHrs ? C.risk : C.text }}>
                              {unit.hoursSinceService} / {unit.serviceIntervalHrs} hrs
                            </div>
                          </div>
                          <span className="moil-mono" style={{ fontSize: 10, padding: "3px 8px", border: `1px solid ${toneColor}`, color: toneColor }}>
                            {unit.conditionMeta.label}
                          </span>
                          <button
                            onClick={() => openLogForm(unit.id)}
                            className="moil-mono"
                            style={{
                              padding: "7px 12px", background: isOpen ? C.ore : C.panelRaised,
                              color: isOpen ? C.void : C.oreLight, border: `1px solid ${C.ore}`,
                              cursor: "pointer", fontSize: 11.5, fontWeight: 600, borderRadius: 2
                            }}
                          >
                            {isOpen ? "Cancel" : "Log Check"}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px", background: C.panelRaised, display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            {EQUIPMENT_CONDITIONS.map((c) => (
                              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text, cursor: "pointer" }}>
                                <input
                                  type="radio"
                                  name={`cond-${unit.id}`}
                                  checked={logForm.condition === c.id}
                                  onChange={() => setLogForm((f) => ({ ...f, condition: c.id }))}
                                />
                                {c.label}
                              </label>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <input
                              type="text"
                              placeholder="Technician / inspector name"
                              value={logForm.technician}
                              onChange={(e) => setLogForm((f) => ({ ...f, technician: e.target.value }))}
                              className="moil-mono"
                              style={{ flex: "1 1 200px", background: C.panel, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", fontSize: 12, borderRadius: 2 }}
                            />
                            <input
                              type="text"
                              placeholder="Notes (optional) — e.g. hydraulic seal seepage on boom cylinder"
                              value={logForm.note}
                              onChange={(e) => setLogForm((f) => ({ ...f, note: e.target.value }))}
                              className="moil-mono"
                              style={{ flex: "2 1 260px", background: C.panel, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", fontSize: 12, borderRadius: 2 }}
                            />
                            <button
                              onClick={() => submitEquipmentLog(unit)}
                              className="moil-mono"
                              style={{ padding: "8px 16px", background: C.ore, color: C.void, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, borderRadius: 2 }}
                            >
                              Submit Log
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Recent Check History */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: "16px 16px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Recent Check History — {mine.name}</div>
                {(() => {
                  const allLogs = fleetWithStatus
                    .flatMap((u) => u.history.map((h) => ({ ...h, unitId: u.id })))
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 12);
                  if (allLogs.length === 0) {
                    return (
                      <div style={{ fontSize: 12, color: C.mutedDark, padding: "10px 0" }}>
                        No checks logged yet for this mine. Log a check on any unit above to build the history here.
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }} className="moil-scroll">
                      {allLogs.map((log) => {
                        const meta = EQUIPMENT_CONDITIONS.find((c) => c.id === log.condition) || EQUIPMENT_CONDITIONS[0];
                        const toneColor = meta.tone === "risk" ? C.risk : meta.tone === "caution" ? C.caution : C.safe;
                        return (
                          <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                            <span className="moil-mono" style={{ fontSize: 9.5, padding: "2px 6px", border: `1px solid ${toneColor}`, color: toneColor, flexShrink: 0, marginTop: 2 }}>
                              {log.unitId}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: C.text }}>
                                {meta.label} <span style={{ color: C.mutedDark }}>— logged by {log.technician}</span>
                              </div>
                              {log.note && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{log.note}</div>}
                            </div>
                            <span className="moil-mono" style={{ fontSize: 10, color: C.mutedDark, flexShrink: 0 }}>
                              {new Date(log.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 10. 3D SUBSURFACE EXPLORER — click-through depth layers */}
          {(tab === "3d" || tab === "explorer3d") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{mine.name}: 3D Subsurface Explorer</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Drag the model to rotate it. Select a depth band below to bring it forward, then click any cell to inspect estimated probability and manganese grade at that level.
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {/* Layer selector / "elevator" control */}
                <div style={{ flex: "0 0 220px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark, marginBottom: 2 }}>DEPTH BANDS</div>
                  {depthGrids.map((layer, i) => (
                    <button
                      key={layer.key}
                      onClick={() => { setExplorerActiveLayer(i); setInspectedDepthCell(null); }}
                      style={{
                        textAlign: "left", padding: "10px 12px", cursor: "pointer", borderRadius: 2,
                        background: explorerActiveLayer === i ? C.panelHighlight : C.panel,
                        border: `1px solid ${explorerActiveLayer === i ? C.ore : C.border}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: layer.colorHex, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: explorerActiveLayer === i ? C.oreLight : C.text }}>{layer.label}</span>
                      </div>
                      <div className="moil-mono" style={{ fontSize: 10.5, color: C.mutedDark, paddingLeft: 18 }}>{layer.depthRange}</div>
                    </button>
                  ))}
                  <div style={{ fontSize: 11, color: C.mutedDark, marginTop: 6, lineHeight: 1.5 }}>
                    Cell brightness = higher modeled ore probability at that level. The ore-body band shows real economic-grade variation; other bands show trace-level readings.
                  </div>
                </div>

                {/* 3D rotatable stack */}
                <div
                  tabIndex={0}
                  role="application"
                  aria-label="3D subsurface inspection surface. Use arrow keys to move across cells, Page Up and Page Down to change depth bands."
                  onKeyDown={handleExplorerKeyDown}
                  onPointerDown={handleExplorerPointerDown}
                  onPointerMove={handleExplorerPointerMove}
                  onPointerUp={handleExplorerPointerUp}
                  onPointerLeave={handleExplorerPointerUp}
                  style={{
                    flex: "1 1 340px", minHeight: 360, background: C.panel, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    perspective: "1100px", cursor: "grab", touchAction: "none", overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      position: "relative", width: 220, height: 220,
                      transform: `rotateX(${explorerRotation.x}deg) rotateZ(${explorerRotation.z}deg)`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {depthGrids.map((layer, layerIndex) => {
                      const isActive = explorerActiveLayer === layerIndex;
                      const zOffset = layerIndex * -70 + (isActive ? 40 : 0);
                      return (
                        <div
                          key={layer.key}
                          style={{
                            position: "absolute", top: 0, left: 0, width: 220, height: 220,
                            display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(8, 1fr)",
                            gap: 1, transform: `translateZ(${zOffset}px)`,
                            transformStyle: "preserve-3d",
                            opacity: isActive ? 1 : 0.4,
                            border: `1.5px solid ${isActive ? C.oreLight : hexToRgba(layer.colorHex, 0.6)}`,
                            background: hexToRgba(layer.colorHex, 0.12),
                            transition: "opacity 0.25s, transform 0.25s",
                          }}
                        >
                          {layer.cells.map((cell) => {
                            const isInspected = inspectedDepthCell && inspectedDepthCell.layerIndex === layerIndex &&
                              inspectedDepthCell.cell.x === cell.x && inspectedDepthCell.cell.y === cell.y;
                            return (
                              <div
                                key={`${cell.x}-${cell.y}`}
                                onClick={(e) => { e.stopPropagation(); setExplorerActiveLayer(layerIndex); setInspectedDepthCell({ layerIndex, cell }); }}
                                title={`Probability ${cell.probability}% · Grade ${cell.grade}% Mn`}
                                style={{
                                  background: hexToRgba(layer.colorHex, 0.25 + (cell.probability / 100) * 0.75),
                                    outline: isInspected ? `2px solid ${C.safe}` : "none",
                                    boxShadow: isInspected ? `inset 0 0 0 1px ${C.text}` : "none",
                                  cursor: isActive ? "pointer" : "default",
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inspector panel */}
                <div style={{ flex: "1 1 260px", background: C.panelRaised, border: `1px solid ${C.borderLight}`, padding: 16, borderRadius: 2 }}>
                  <div className="moil-mono" style={{ fontSize: 10, color: C.safe, border: `1px solid ${C.safe}`, padding: "1px 6px", display: "inline-block", marginBottom: 10 }}>
                    SUBSURFACE INSPECTOR
                  </div>
                  {!inspectedDepthCell ? (
                    <div style={{ fontSize: 12.5, color: C.mutedDark, lineHeight: 1.6 }}>
                      Focus the model or click a cell, then use the arrow keys to inspect across the surface. Use Page Down to move below it through the depth bands. Try the {depthGrids[1].label} band first — it carries the highest economic-grade readings.
                    </div>
                  ) : (() => {
                    const layer = depthGrids[inspectedDepthCell.layerIndex];
                    const cell = inspectedDepthCell.cell;
                    const confidence = Math.min(96, Math.round(48 + cell.probability * 0.42 + (layer.oreBearing ? 10 : 0)));
                    const drillPriority = layer.oreBearing && cell.probability > 65 ? "VERIFY FIRST" : layer.oreBearing ? "SECONDARY REVIEW" : "TRACE CONTEXT";
                    return (
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.oreLight, marginBottom: 2 }}>{layer.label}</div>
                        <div className="moil-mono" style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                          {layer.depthRange} &nbsp;·&nbsp; Grid [{cell.x}, {cell.y}]
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 12, marginBottom: 12 }}>
                          <div>
                            <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>ORE PROBABILITY</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: cell.probability > 60 ? C.safe : cell.probability > 30 ? C.caution : C.risk }}>{cell.probability}%</div>
                          </div>
                          <div>
                            <div className="moil-mono" style={{ fontSize: 10, color: C.mutedDark }}>Mn GRADE</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{cell.grade}%</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                          {layer.oreBearing && cell.probability > 65
                            ? "High-confidence economic intercept — recommend prioritizing a verification borehole at this coordinate and depth on the 2D Reserve Heatmap."
                            : layer.oreBearing
                              ? "Within the ore-bearing band but below the high-confidence threshold — worth a secondary pass before committing drill capacity."
                              : "Outside the primary ore-bearing band — readings here are trace-level and not a drilling priority."}
                        </div>
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                          <div className="moil-mono" style={{ fontSize: 10, color: C.atmosphere, marginBottom: 8 }}>EVIDENCE & CONFIDENCE</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                              <div className="moil-mono" style={{ fontSize: 9.5, color: C.mutedDark }}>MODEL CONFIDENCE</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: confidence >= 75 ? C.safe : C.caution }}>{confidence}%</div>
                            </div>
                            <div>
                              <div className="moil-mono" style={{ fontSize: 9.5, color: C.mutedDark }}>DRILL PRIORITY</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: drillPriority === "VERIFY FIRST" ? C.safe : C.caution }}>{drillPriority}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: C.mutedDark, lineHeight: 1.5, marginTop: 8 }}>
                            Evidence: deterministic satellite-style spectral signal + bundled geological layer model. Freshness: current browser session. This is a screening estimate, not a certified resource statement.
                          </div>
                        </div>
                          <div className="moil-mono" style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 10.5, color: C.mutedDark, lineHeight: 1.6 }}>
                            ARROW KEYS <span style={{ color: C.text }}>move across this band</span> &nbsp;·&nbsp; PAGE DOWN <span style={{ color: C.text }}>inspect deeper</span> &nbsp;·&nbsp; PAGE UP <span style={{ color: C.text }}>return upward</span>
                          </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSection({ audioMuted }) {
  const t = useT();
  return (
    <section id="dashboard" style={{ padding: "80px 24px", maxWidth: 1140, margin: "0 auto" }}>
      <Reveal variant="up">
        <div className="moil-mono" style={{ fontSize: 11.5, color: C.mutedDark, letterSpacing: 1, marginBottom: 12 }}>
          {t.dashboardEyebrow}
        </div>
      </Reveal>
      <Reveal variant="up" delay={60}>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, maxWidth: 660, lineHeight: 1.2, marginBottom: 32 }}>
          {t.dashboardTitle}
        </h2>
      </Reveal>

      <Reveal variant="scale" delay={100}>
        <div style={{ border: `1px solid ${C.borderLight}`, background: C.panelRaised, borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
            borderBottom: `1px solid ${C.border}`, background: C.panel
          }}>
            {[C.risk, C.caution, C.safe].map((c) => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
            ))}
            <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark, marginLeft: 10 }}>
              https://dispatch.moil-ore-intel.gov.in/balaghat-sector-4
            </div>
          </div>
          <EmbeddedDashboard audioMuted={audioMuted} />
        </div>
      </Reveal>

      <Reveal variant="up" delay={160}>
        <div style={{ fontSize: 12, color: C.mutedDark, marginTop: 16, lineHeight: 1.6, maxWidth: 700 }}>
          Directly calibrated against MOIL's real FY2019-20 production records from the Indian Minerals Yearbook (IBM).
          Interactive simulator and core drill dispatch actions update operational state dynamically.
        </div>
      </Reveal>
    </section>
  );
}

/* =========================================================================
   COMPARE SECTION
   ========================================================================= */
function Compare() {
  const t = useT();
  const rows = [
    { cat: "Data Fusion", legacy: "One dataset, single isolated black-box model", moil: "Satellite (Sentinel-1/2, MODIS) + Core logging + Telemetry" },
    { cat: "Explainability", legacy: "Opaque risk number without causality", moil: "SHAP percentage-point contribution breakdown" },
    { cat: "Reserve Mapping", legacy: "Restricted to drilled 8% ground truth", moil: "Full-lease 28×28 probability grid with core drill dispatch" },
    { cat: "Shift Dispatch", legacy: "Stops at prediction without guidance", moil: "Ranked, quantified interventions with CSV export" },
    { cat: "Safety & Compliance", legacy: "Paper logbooks and manual sign-offs", moil: "DGMS compliance checklist & printable handover dossiers" },
    { cat: "Language Access", legacy: "English only, inaccessible to shift floors", moil: "Native English, Hindi (हिन्दी), and Marathi (मराठी)" },
  ];

  return (
    <section id="compare" style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <Reveal variant="up">
        <div className="moil-mono" style={{ fontSize: 11.5, color: C.mutedDark, letterSpacing: 1, marginBottom: 12 }}>
          {t.compareEyebrow}
        </div>
      </Reveal>
      <Reveal variant="up" delay={60}>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, maxWidth: 660, lineHeight: 1.2, marginBottom: 36 }}>
          {t.compareTitle}
        </h2>
      </Reveal>

      <Reveal variant="up" delay={100}>
        <div className="compare-table-scroll" style={{ border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1.1fr 1fr 1.1fr",
            borderBottom: `1px solid ${C.border}`, background: C.panel
          }} className="compare-header compare-table">
            <div className="moil-mono" style={{ padding: "12px 16px", fontSize: 11, color: C.mutedDark }}>CAPABILITY</div>
            <div className="moil-mono" style={{ padding: "12px 16px", fontSize: 11, color: C.mutedDark }}>LEGACY / MANUAL APPROACH</div>
            <div className="moil-mono" style={{ padding: "12px 16px", fontSize: 11, color: C.oreLight, background: C.panelRaised }}>MANGNEX</div>
          </div>

          {rows.map((r, i) => (
            <div
              key={i}
              className="compare-grid compare-table"
              style={{
                display: "grid", gridTemplateColumns: "1.1fr 1fr 1.1fr",
                borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
                background: C.panel
              }}
            >
              <div style={{ padding: "14px 16px", fontSize: 13.5, fontWeight: 600 }}>{r.cat}</div>
              <div style={{ padding: "14px 16px", fontSize: 12.5, color: C.mutedDark, display: "flex", alignItems: "center", gap: 8 }}>
                <X size={14} color={C.mutedDark} /> {r.legacy}
              </div>
              <div style={{ padding: "14px 16px", fontSize: 12.5, color: C.text, background: C.panelRaised, display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={14} color={C.safe} /> {r.moil}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* =========================================================================
   TECH STACK MARQUEE
   ========================================================================= */
function TechStack() {
  const items = ["XGBoost", "Random Forest", "SHAP Inversion", "Sentinel-2 MultiSpectral", "MODIS LST", "Sentinel-1 SAR", "FastAPI", "React 18", "Vite", "Google Earth Engine", "IBM Minerals Yearbook Calibration", "Open-Meteo API", "DGMS CMR 2017"];
  const loop = [...items, ...items];
  return (
    <div style={{ padding: "48px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.panel }}>
      <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark, textAlign: "center", marginBottom: 18, letterSpacing: 1 }}>
        DEPLOYED AI & SPACE REPOSITORY STACK
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", width: "fit-content", animation: "moil-marquee 24s linear infinite", gap: 40 }}>
          {loop.map((it, i) => (
            <div key={i} className="moil-mono" style={{ fontSize: 13, color: C.muted, whiteSpace: "nowrap" }}>
              {it}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   FOOTER
   ========================================================================= */
function LoopingVideo({ src, style }) {
  const containerRef = useRef(null);
  const videoRefs = [useRef(null), useRef(null)];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px 0px" });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleEnded = (endedIndex) => {
    const nextIndex = endedIndex === 0 ? 1 : 0;
    const nextVideo = videoRefs[nextIndex].current;
    if (!nextVideo) return;

    nextVideo.currentTime = 0;
    nextVideo.play().catch(() => {});
    setActiveIndex(nextIndex);
  };

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, ...style }}>
      {[0, 1].map((index) => (
        <video
          key={index}
          ref={videoRefs[index]}
          autoPlay={index === 0}
          muted
          playsInline
          preload={isVisible ? "auto" : "none"}
          type="video/mp4"
          src={isVisible ? src : undefined}
          onEnded={() => handleEnded(index)}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            background: C.void,
            opacity: activeIndex === index ? 1 : 0,
            transition: "opacity 700ms ease-in-out",
          }}
        />
      ))}
    </div>
  );
}

  function Footer() {
    const t = useT();
    return (
             <footer style={{ position: "relative", zIndex: 0, width: "100%", padding: "120px 24px 70px", margin: 0, textAlign: "center", overflow: "hidden", minHeight: "420px" }}>
        {/* Background: animated SVG scene (video asset removed — not loadable in this environment) */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.55 }}>
          <ImmersiveBG />
        </div>
        {/* Dark overlay for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${C.void} 0%, rgba(17,15,11,0.08) 18%, rgba(17,15,11,0.14) 72%, ${C.void} 100%), linear-gradient(90deg, ${C.void} 0%, transparent 16%, transparent 84%, ${C.void} 100%)`,
            zIndex: 1,
          }}
        />
        <Reveal variant="up">
          <div className="moil-mono" style={{ fontSize: 11, color: C.mutedDark, letterSpacing: 1, marginBottom: 10, position: "relative", zIndex: 2 }}>
            {t.footerEyebrow}
          </div>
        </Reveal>
        <Reveal variant="up" delay={60}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, marginBottom: 28, position: "relative", zIndex: 2 }}>
            {t.footerTitle}
          </h2>
        </Reveal>
        <Reveal variant="scale" delay={120} style={{ display: "flex", justifyContent: "center" }}>
          <MagneticButton
            style={{ position: "relative", zIndex: 2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {t.footerCta}
          </MagneticButton>
        </Reveal>
        <div
          style={{
            fontSize: 12,
            color: C.mutedDark,
            marginTop: 40,
            maxWidth: 520,
            marginInline: "auto",
            lineHeight: 1.6,
            position: "relative",
            zIndex: 2,
          }}
        >
          {t.footerNote}
        </div>
      </footer>
  

  );
}

/* =========================================================================
   APP ROOT
   ========================================================================= */
export default function App() {
  const [lang, setLang] = useState("en");
  const [audioMuted, setAudioMuted] = useState(false);
  const t = T[lang];

  return (
    <LangContext.Provider value={{ lang, t }}>
      <div className="moil-root landing-shell">
        <style>{GLOBAL_CSS}</style>
        <TopProgressBar />
        <SectionProgressRail />
        <Nav lang={lang} setLang={setLang} audioMuted={audioMuted} setAudioMuted={setAudioMuted} />
        <main>
          <Hero />
          <Problem />
          <SolutionPillars />
          <RealSitesJourney />
          <Pipeline />
          <DashboardSection audioMuted={audioMuted} />
          <Compare />
          <TechStack />
        </main>
        <Footer />
      </div>
    </LangContext.Provider>
  );
}