/* ============================================================
   GATE CE – Topic Taxonomy & Classification Engine
   ============================================================ */
window.GATE_TOPICS = {

  /* ── ordered list of topics shown in the UI ── */
  list: [
    { id: "general-aptitude",     name: "General Aptitude",          icon: "🧠", color: "#7c3aed" },
    { id: "engineering-math",     name: "Engineering Mathematics",   icon: "📐", color: "#0891b2" },
    { id: "structural-analysis",  name: "Structural Analysis",       icon: "🏗️", color: "#0369a1" },
    { id: "solid-mechanics",      name: "Solid Mechanics & Design",  icon: "🔩", color: "#b45309" },
    { id: "concrete-structures",  name: "Concrete Structures (RCC)", icon: "🧱", color: "#6b7280" },
    { id: "steel-structures",     name: "Steel Structures",          icon: "⚙️", color: "#374151" },
    { id: "construction-mgmt",    name: "Construction & Management", icon: "🏛️", color: "#065f46" },
    { id: "geotechnical",         name: "Geotechnical Engineering",  icon: "🌍", color: "#92400e" },
    { id: "fluid-mechanics",      name: "Fluid Mechanics",           icon: "💧", color: "#1d4ed8" },
    { id: "hydraulics",           name: "Hydraulics & Open Channel", icon: "🌊", color: "#0e7490" },
    { id: "hydrology",            name: "Hydrology",                 icon: "🌧️", color: "#1e40af" },
    { id: "irrigation",           name: "Irrigation Engineering",    icon: "🚿", color: "#15803d" },
    { id: "environmental",        name: "Environmental Engineering", icon: "🌿", color: "#166534" },
    { id: "transportation",       name: "Transportation Engineering", icon: "🛣️", color: "#be185d" },
    { id: "surveying",            name: "Surveying & Geomatics",     icon: "📏", color: "#7c2d12" },
  ],

  /* ── keyword banks for auto-classification ── */
  _keywords: {
    "general-aptitude": [
      "passage", "paragraph", "poem", "analogy", "sentence", "word", "grammar",
      "vocabulary", "fill in the blank", "aptitude", "logical", "reasoning", "series",
      "profit", "loss", "investment", "ratio", "proportion", "percentage", "age",
      "clock", "calendar", "dice", "ranking", "puzzle", "direction", "blood relation",
      "venn diagram", "coding", "decoding", "mirror image", "paper folding"
    ],
    "engineering-math": [
      "matrix", "determinant", "eigenvalue", "eigenvector", "linear algebra",
      "differential equation", "partial differential", "laplace", "fourier",
      "integral", "calculus", "gradient", "divergence", "curl", "vector",
      "probability", "statistics", "random variable", "standard deviation",
      "mean", "median", "mode", "normal distribution", "poisson", "binomial",
      "numerical method", "newton", "gauss", "runge-kutta", "iteration",
      "convergence", "limit", "continuity", "derivative", "complex number",
      "taylor", "maclaurin", "beta", "gamma", "stokes", "green", "divergence theorem"
    ],
    "structural-analysis": [
      "truss", "beam", "frame", "arch", "deflection", "slope", "stiffness matrix",
      "flexibility", "moment distribution", "carry-over", "portal", "influence line",
      "redundant", "degree of indeterminacy", "virtual work", "unit load",
      "bending moment diagram", "shear force diagram", "cable", "three-hinged",
      "two-hinged", "fixed beam", "propped cantilever", "conjugate beam",
      "castigliano", "muller-breslau", "rolling load", "sway"
    ],
    "solid-mechanics": [
      "stress", "strain", "young's modulus", "modulus of elasticity", "shear stress",
      "shear strain", "bending moment", "moment of inertia", "section modulus",
      "torsion", "mohr's circle", "principal stress", "principal strain",
      "elastic", "plastic", "yield", "ultimate", "factor of safety",
      "hoop stress", "thin cylinder", "thick cylinder", "pressure vessel",
      "spring", "columns", "euler", "slenderness", "buckling", "fatigue", "creep"
    ],
    "concrete-structures": [
      "reinforced concrete", "rcc", "beam design", "slab design", "column design",
      "footing", "limit state", "working stress", "modular ratio", "cover",
      "reinforcement", "rebar", "stirrup", "shear reinforcement", "one-way slab",
      "two-way slab", "flat slab", "continuous beam", "retaining wall rcc",
      "water tank", "prestressed", "pre-tensioned", "post-tensioned", "creep concrete",
      "shrinkage", "m20", "m25", "fe415", "fe500", "ductility"
    ],
    "steel-structures": [
      "steel structure", "angle section", "I-section", "connection", "weld", "bolt",
      "rivet", "gusset", "purlin", "rafter", "plate girder", "laced column",
      "battened", "tension member", "compression member", "slender", "built-up",
      "fillet weld", "butt weld", "block shear", "net area", "gross area",
      "plastic moment", "plastic section", "compact section", "fe250", "is800"
    ],
    "construction-mgmt": [
      "project management", "network", "critical path", "pert", "cpm",
      "float", "slack", "crashing", "resource", "bar chart", "gantt",
      "construction material", "cement", "concrete mix", "aggregate", "admixture",
      "workability", "slump", "compressive strength", "water cement ratio",
      "fly ash", "pozzolanic", "curing", "segregation", "bleeding",
      "bitumen", "binder", "asphalt", "macadam", "brick", "mortar", "timber",
      "paint", "varnish", "cost estimation", "tender", "contract"
    ],
    "geotechnical": [
      "soil", "clay", "sand", "silt", "gravel", "consolidation", "settlement",
      "permeability", "seepage", "bearing capacity", "pile", "retaining wall",
      "earth pressure", "rankine", "coulomb", "atterberg", "liquid limit",
      "plastic limit", "shrinkage limit", "compaction", "proctor", "spt",
      "triaxial", "direct shear", "vane shear", "mohr-coulomb", "cohesion",
      "angle of friction", "effective stress", "total stress", "pore pressure",
      "void ratio", "porosity", "degree of saturation", "specific gravity soil",
      "particle size", "sieve analysis", "hydrometer", "coefficient of consolidation",
      "time factor", "terzaghi", "immediate settlement", "sand drain", "geosynthetic"
    ],
    "fluid-mechanics": [
      "fluid", "viscosity", "density fluid", "pressure fluid", "bernoulli",
      "continuity equation", "pipe flow", "laminar", "turbulent", "reynolds",
      "friction factor", "moody", "darcy", "hagen-poiseuille", "velocity profile",
      "boundary layer", "displacement thickness", "drag", "lift", "buoyancy",
      "metacentre", "archimedes", "surface tension", "capillarity",
      "orifice", "mouthpiece", "notch", "venturimeter", "pitot", "current meter"
    ],
    "hydraulics": [
      "open channel", "manning", "chezy", "hydraulic radius", "froude",
      "specific energy", "critical depth", "critical flow", "subcritical", "supercritical",
      "hydraulic jump", "sequent depth", "gradually varied flow", "gvf",
      "water surface profile", "m1", "m2", "m3", "s1", "s2", "s3",
      "weir", "spillway", "ogee", "sluice gate", "turbine", "pump",
      "specific speed", "cavitation", "water hammer", "surge tank", "penstock"
    ],
    "hydrology": [
      "hydrograph", "unit hydrograph", "rainfall", "runoff", "infiltration",
      "evaporation", "evapotranspiration", "idf", "intensity duration frequency",
      "flood", "flood routing", "storage routing", "muskingum", "return period",
      "recurrence interval", "rational formula", "snyder", "time of concentration",
      "base flow", "direct runoff", "groundwater", "aquifer", "well hydraulics",
      "theis", "jacob", "confined", "unconfined", "recharge", "water table"
    ],
    "irrigation": [
      "irrigation", "canal", "duty", "delta", "field capacity", "consumptive use",
      "kor watering", "kor period", "paleo", "crop water requirement",
      "command area", "gross commanded area", "net commanded area",
      "head works", "diversion", "barrage", "weir irrigation",
      "canal lining", "seepage irrigation", "sprinkler", "drip"
    ],
    "environmental": [
      "water treatment", "sewage", "wastewater", "bod", "cod", "do",
      "dissolved oxygen", "sag curve", "reaeration", "deoxygenation",
      "sedimentation", "filtration", "chlorination", "coagulation",
      "flocculation", "softening", "hardness", "alkalinity", "turbidity",
      "mld", "per capita", "eff", "activated sludge", "trickling filter",
      "septic tank", "imhoff", "solid waste", "sanitary landfill",
      "air pollution", "noise", "electrodialysis", "reverse osmosis"
    ],
    "transportation": [
      "highway", "road", "pavement", "bituminous", "flexible pavement",
      "rigid pavement", "cbr", "california bearing ratio", "IRC",
      "design speed", "sight distance", "stopping", "overtaking",
      "superelevation", "camber", "grade", "horizontal curve", "vertical curve",
      "traffic", "volume", "pcU", "los", "level of service", "intersection",
      "signal", "cycle time", "flow", "speed", "density", "greenshields",
      "railway", "rail", "locomotive", "sleeper", "ballast", "gauge",
      "airport", "runway", "taxiway", "pcn"
    ],
    "surveying": [
      "leveling", "theodolite", "traverse", "bearing", "azimuth",
      "gps", "remote sensing", "contour", "plane table", "tacheometry",
      "EDM", "total station", "photogrammetry", "triangulation",
      "closing error", "latitude", "departure", "omitted measurement",
      "prismatic compass", "magnetic bearing", "true bearing",
      "reduced level", "HI method", "rise fall", "benchmark"
    ]
  },

  /* ── classify a question by keyword matching ── */
  classify: function (question) {
    if (question.section === "GA") return "general-aptitude";

    var text = "";
    if (question.statement) text += " " + question.statement.toLowerCase().replace(/<[^>]+>/g, " ");
    if (question.options) {
      question.options.forEach(function (o) {
        if (o.text) text += " " + o.text.toLowerCase();
      });
    }

    var scores = {};
    var topics = window.GATE_TOPICS;
    topics.list.forEach(function (t) {
      if (t.id === "general-aptitude") return;
      var keys = topics._keywords[t.id] || [];
      var score = 0;
      keys.forEach(function (kw) {
        if (text.indexOf(kw.toLowerCase()) !== -1) score++;
      });
      scores[t.id] = score;
    });

    var best = null, bestScore = 0;
    Object.keys(scores).forEach(function (k) {
      if (scores[k] > bestScore) { bestScore = scores[k]; best = k; }
    });

    /* fallback buckets based on question image path hint */
    if (!best || bestScore === 0) {
      if (question.image) {
        /* image-only questions (2017) – section is CE, topic unknown */
        best = "engineering-math"; /* safest default; UI will mark as guessed */
      } else {
        best = "engineering-math";
      }
    }
    return best;
  },

  /* ── Get topic meta by id ── */
  get: function (id) {
    return window.GATE_TOPICS.list.find(function (t) { return t.id === id; }) ||
           { id: id, name: id, icon: "❓", color: "#6b7280" };
  }
};
