/**
 * Official Indian Bureau of Mines (IBM) & Ministry of Mines Data
 * Source: Indian Minerals Yearbook 2020 (59th Edition), Manganese Ore
 */

export const REAL_MP_DISTRICTS = [
  { district: "Balaghat", tonnes: 677046, share: "70.7%", method: "Underground & Mechanized", dailyAvg: 1855, lat: 21.81, lon: 80.18 },
  { district: "Jabalpur", tonnes: 202115, share: "21.1%", method: "Opencast (Mechanized)", dailyAvg: 554, lat: 23.18, lon: 79.98 },
  { district: "Jhabua", tonnes: 59570, share: "6.2%", method: "Opencast (Semi-mechanized)", dailyAvg: 163, lat: 22.77, lon: 74.60 },
  { district: "Chhindwara", tonnes: 19433, share: "2.0%", method: "Opencast & Manual", dailyAvg: 53, lat: 22.06, lon: 78.94 },
];

export const REAL_STATE_PRODUCTION = [
  { year: "2017-18", state: "Madhya Pradesh", quantity_tonnes: 837041, value_rs_crore: 676.01 },
  { year: "2017-18", state: "Maharashtra", quantity_tonnes: 731457, value_rs_crore: 724.36 },
  { year: "2017-18", state: "Odisha", quantity_tonnes: 516862, value_rs_crore: 349.76 },
  { year: "2017-18", state: "Karnataka", quantity_tonnes: 294261, value_rs_crore: 154.11 },
  { year: "2017-18", state: "Andhra Pradesh", quantity_tonnes: 172174, value_rs_crore: 70.63 },
  { year: "2018-19", state: "Madhya Pradesh", quantity_tonnes: 942738, value_rs_crore: 714.77 },
  { year: "2018-19", state: "Maharashtra", quantity_tonnes: 761985, value_rs_crore: 799.99 },
  { year: "2018-19", state: "Odisha", quantity_tonnes: 476821, value_rs_crore: 304.90 },
  { year: "2018-19", state: "Karnataka", quantity_tonnes: 332162, value_rs_crore: 227.63 },
  { year: "2018-19", state: "Andhra Pradesh", quantity_tonnes: 293679, value_rs_crore: 103.95 },
  { year: "2019-20", state: "Madhya Pradesh", quantity_tonnes: 958164, value_rs_crore: 616.07 },
  { year: "2019-20", state: "Maharashtra", quantity_tonnes: 721520, value_rs_crore: 612.72 },
  { year: "2019-20", state: "Odisha", quantity_tonnes: 537742, value_rs_crore: 341.00 },
  { year: "2019-20", state: "Karnataka", quantity_tonnes: 333425, value_rs_crore: 228.50 },
  { year: "2019-20", state: "Andhra Pradesh", quantity_tonnes: 331030, value_rs_crore: 131.75 },
];

export const REAL_RESERVES_BY_STATE = [
  { state: "Odisha", reserves_mt: 30.64, remaining_resources_mt: 185.76, total_mt: 216.40, share: "43.7%" },
  { state: "Karnataka", reserves_mt: 9.35, remaining_resources_mt: 101.72, total_mt: 111.06, share: "22.4%" },
  { state: "Madhya Pradesh", reserves_mt: 29.89, remaining_resources_mt: 27.82, total_mt: 57.71, share: "11.7%" },
  { state: "Maharashtra", reserves_mt: 13.71, remaining_resources_mt: 22.91, total_mt: 36.62, share: "7.4%" },
  { state: "Goa", reserves_mt: 0.00, remaining_resources_mt: 34.42, total_mt: 34.42, share: "6.9%" },
  { state: "Andhra Pradesh", reserves_mt: 4.96, remaining_resources_mt: 12.69, total_mt: 17.65, share: "3.6%" },
];

export const MP_GRADE_PRODUCTION = [
  { grade: "35%–46% Mn (Ferro)", balaghat: 124496, jabalpur: 0, jhabua: 2660, chhindwara: 240, total: 127396 },
  { grade: "25%–35% Mn (Medium)", balaghat: 101673, jabalpur: 0, jhabua: 0, chhindwara: 2140, total: 103813 },
  { grade: "<25% Mn (Low)", balaghat: 344014, jabalpur: 0, jhabua: 47964, chhindwara: 11068, total: 403046 },
  { grade: "Siliceous / Low Grade", balaghat: 106863, jabalpur: 202115, jhabua: 8946, chhindwara: 5985, total: 323909 },
];

// Domestic Manganese Ore Benchmark Pricing (₹/tonne)
export const ORE_PRICING = {
  highGradeFerro: 16800,   // >42% Mn (Bharweli lump)
  mediumGrade: 12400,      // 30-42% Mn
  siliceousLowGrade: 7200, // <30% Mn
  blendedAverage: 14200,   // standard valuation metric
};

export const MINE_PROFILES = {
  Balaghat: {
    name: "Balaghat Mine (Bharweli)",
    district: "Balaghat, MP",
    annualTonnes: 677046,
    dailyTarget: 1855,
    method: "Deep Underground & Mechanized",
    elevation: "320m ASL",
    lat: 21.81,
    lon: 80.18,
    leaseAreaKm2: 43.8,
    activeEquipment: "10 Heavy Rigs & Loaders",
    geology: "Sausar Group (Mansar Formation gondites & braunite)",
    drillHolesLogged: 142,
    unmappedLeasePct: 78.4,
    description: "MOIL's flagship and largest single mine in India. Continuous operations since 1903 with high-grade manganese oxide deposits.",
    typicalDowntimeCostTonnesPerHr: 38.6,
    typicalBlastingCostTonnesPerHr: 61.8,
    shaftDepthMeters: 385,
    undergroundLevels: 6,
  },
  Jabalpur: {
    name: "Jabalpur Opencast Cluster",
    district: "Jabalpur, MP",
    annualTonnes: 202115,
    dailyTarget: 554,
    method: "Opencast Mechanized",
    elevation: "411m ASL",
    lat: 23.18,
    lon: 79.98,
    leaseAreaKm2: 18.5,
    activeEquipment: "6 Excavators & 12 Dumpers",
    geology: "Mahakoshal Group phyllites and banded manganiferous iron ores",
    drillHolesLogged: 58,
    unmappedLeasePct: 86.2,
    description: "The second-largest MP contributor, worked predominantly by opencast benching with wet-season drainage constraints.",
    typicalDowntimeCostTonnesPerHr: 14.5,
    typicalBlastingCostTonnesPerHr: 22.0,
    shaftDepthMeters: 0,
    undergroundLevels: 0,
  },
  Jhabua: {
    name: "Jhabua Western Lease",
    district: "Jhabua, MP",
    annualTonnes: 59570,
    dailyTarget: 163,
    method: "Opencast Semi-Mechanized",
    elevation: "318m ASL",
    lat: 22.77,
    lon: 74.60,
    leaseAreaKm2: 9.2,
    activeEquipment: "3 Backhoes & 6 Haulers",
    geology: "Aravalli Supergroup metasediments with rhodonite and cryptomelane",
    drillHolesLogged: 24,
    unmappedLeasePct: 91.5,
    description: "Strategic operation near the Gujarat border producing medium-grade ores with high logistics dependency.",
    typicalDowntimeCostTonnesPerHr: 5.2,
    typicalBlastingCostTonnesPerHr: 8.4,
    shaftDepthMeters: 0,
    undergroundLevels: 0,
  },
  Chhindwara: {
    name: "Chhindwara Border Block",
    district: "Chhindwara, MP",
    annualTonnes: 19433,
    dailyTarget: 53,
    method: "Opencast & Trenching",
    elevation: "675m ASL",
    lat: 22.06,
    lon: 78.94,
    leaseAreaKm2: 6.4,
    activeEquipment: "2 Excavators & 4 Tippers",
    geology: "Bichua and Mansar marble-calc silicate complexes",
    drillHolesLogged: 12,
    unmappedLeasePct: 94.0,
    description: "High terrain operation bordering Nagpur district, requiring precision blasting near ecological reserve buffers.",
    typicalDowntimeCostTonnesPerHr: 2.1,
    typicalBlastingCostTonnesPerHr: 3.5,
    shaftDepthMeters: 0,
    undergroundLevels: 0,
  }
};

// Geological Strata Layers for 3D Pit & Shaft Viewer
export const GEOLOGICAL_STRATA = [
  {
    id: "overburden",
    name: "Alluvial Topsoil & Laterite",
    depthRange: "0m to -18m",
    color: "#8B5A2B",
    textColor: "#EDE5D3",
    description: "Weathered red gravels and lateritic caps. Low bearing capacity; requires 45° slope bench stabilization.",
    oreContent: "0% Mn (Waste rock)",
    hardnessMohs: "2.5 - 3.5",
    drillingRateMetersPerHour: 14.5
  },
  {
    id: "mansar_ore",
    name: "Mansar Formation (Gondite & Braunite)",
    depthRange: "-18m to -195m",
    color: "#C1622D",
    textColor: "#110F0B",
    description: "High-grade manganiferous quartzite ore horizon with bedded braunite, pyrolusite, and rhodonite. Primary economic pay-zone.",
    oreContent: "38% - 48.5% Mn (Primary Pay Zone)",
    hardnessMohs: "6.0 - 6.5",
    drillingRateMetersPerHour: 4.8
  },
  {
    id: "lohangi_marble",
    name: "Lohangi Marble & Calc-Silicates",
    depthRange: "-195m to -275m",
    color: "#5A6557",
    textColor: "#EDE5D3",
    description: "Pink and white dolomitic marbles intercalated with banded epidote-diopside rocks. Acts as natural aquitard.",
    oreContent: "5% - 12% Mn (Sub-economic)",
    hardnessMohs: "4.0 - 4.5",
    drillingRateMetersPerHour: 7.2
  },
  {
    id: "tirodi_gneiss",
    name: "Tirodi Biotite Gneiss Basement",
    depthRange: "-275m to -450m+",
    color: "#2C2822",
    textColor: "#EDE5D3",
    description: "Archaean basement complex of granitic and biotite gneiss. Excellent ground stability for vertical shaft hoisting.",
    oreContent: "Traces (<1% Mn)",
    hardnessMohs: "6.5 - 7.0",
    drillingRateMetersPerHour: 3.5
  }
];

// DGMS Statutory Safety Criteria (Mines Act 1952 / CMR 2017)
export const DGMS_SAFETY_ITEMS = [
  {
    id: "dgms-sump",
    title: "Mine Sump Dewatering & Auxiliary Pump Redundancy",
    category: "HYDROLOGY & DRAINAGE",
    statute: "CMR 2017 Reg. 149",
    description: "Primary sump capacity checked with standby 75 HP Flygt submersible pumps tested and fuel-primed for monsoon surge.",
    mandatory: true,
  },
  {
    id: "dgms-vent",
    title: "Underground Airflow Velocity & Multi-Gas Telemetry",
    category: "VENTILATION & OCCUPATIONAL HEALTH",
    statute: "CMR 2017 Reg. 153",
    description: "Return airway airflow maintained > 0.5 m/s; telemetry verifies CO < 25 ppm, CH4 0.0%, and wet-bulb temperature < 30.5°C.",
    mandatory: true,
  },
  {
    id: "dgms-slope",
    title: "Open-Pit Bench Slope & Catchment Berm Verification",
    category: "STRATA STABILITY",
    statute: "DGMS Tech Circular 02/2019",
    description: "Highwall bench angle verified within 45° limit; berm width > 4.5 meters; zero tension cracks detected by radar survey.",
    mandatory: true,
  },
  {
    id: "dgms-blast",
    title: "Pre-Blast Vibration Seismograph & Danger Zone Buffer",
    category: "BLASTING PROTOCOL",
    statute: "CMR 2017 Reg. 164",
    description: "Instantaneous Peak Particle Velocity (PPV) within 10 mm/s limit; 300m danger radius evacuated with audible hooter warning.",
    mandatory: true,
  },
  {
    id: "dgms-haul",
    title: "Haul Road Dust Suppression & Mobile Brake Interlocks",
    category: "HAULAGE SAFETY",
    statute: "CMR 2017 Reg. 87",
    description: "Continuous water tanker misting; dumper dynamic retarder brakes tested at 10% gradient; edge berms height > tire diameter.",
    mandatory: true,
  }
];

// Generate sample CSV for test upload
export function generateSampleMineCSV() {
  const headers = ["day", "planned_tonnes", "actual_tonnes", "rainfall_mm", "downtime_hrs", "blasting_delay_hrs", "active_equipment"];
  const rows = [
    ["Day 1", "1860", "1840", "2.5", "0.4", "0", "10"],
    ["Day 2", "1850", "1790", "14.2", "1.2", "0", "9"],
    ["Day 3", "1870", "1680", "28.5", "2.8", "1", "9"],
    ["Day 4", "1855", "1540", "36.0", "4.5", "2", "8"],
    ["Day 5", "1865", "1720", "18.0", "1.5", "0", "9"],
    ["Day 6", "1850", "1820", "4.0", "0.8", "0", "10"],
    ["Day 7", "1860", "1610", "22.5", "3.2", "1", "8"],
  ];
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
