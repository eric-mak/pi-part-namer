export type FieldType = "text" | "select" | "checkbox";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  options?: string[];
  suggestions?: (v: Record<string, string | boolean>) => string[];
  defaultValue?: string | boolean;
  optional?: boolean;
  advanced?: boolean;
  width?: "full" | "half" | "third";
}

export interface Category {
  id: string;
  group: string;
  label: string;
  description: string;
  series: string;
  fields: Field[];
  format: (v: Record<string, string | boolean>) => string;
  derive?: (
    v: Record<string, string | boolean>,
  ) => Record<string, string | boolean>;
  examples: string[];
}

const METRIC_PITCH: Record<string, string> = {
  "M1.6": "0.35",
  M2: "0.4",
  "M2.5": "0.45",
  M3: "0.5",
  "M3.5": "0.6",
  M4: "0.7",
  M5: "0.8",
  M6: "1.0",
  M8: "1.25",
  M10: "1.5",
  M12: "1.75",
  M14: "2.0",
  M16: "2.0",
};

const SHCS_HEX: Record<string, string> = {
  "M1.6": "H1.5",
  M2: "H1.5",
  "M2.5": "H2.0",
  M3: "H2.5",
  M4: "H3.0",
  M5: "H4.0",
  M6: "H5.0",
  M8: "H6.0",
  M10: "H8.0",
  M12: "H10.0",
};

const BHCS_HEX: Record<string, string> = {
  M3: "H2.0",
  M4: "H2.5",
  M5: "H3.0",
  M6: "H4.0",
  M8: "H5.0",
  M10: "H6.0",
};

const FHCS_TORX: Record<string, string> = {
  M3: "T10",
  M4: "T20",
  M5: "T25",
  M6: "T30",
  M8: "T40",
};

const MATERIAL_FINISH: Record<string, string> = {
  "8.8 STL": "ZINC",
  "10.9 STL": "BLK OX",
  "12.9 STL": "BLK OX",
  "1018 STL": "ZINC",
  "CARBON STL": "ZINC",
  "18-8 SS": "",
  "316 SS": "",
  "A2 SS": "",
  "A4 SS": "",
  BRASS: "",
  NYL: "",
  TI: "",
};

const NUT_PITCH: Record<string, string> = METRIC_PITCH;

const METRIC_THREADS = [
  "M1.6",
  "M2",
  "M2.5",
  "M3",
  "M3.5",
  "M4",
  "M5",
  "M6",
  "M8",
  "M10",
  "M12",
  "M14",
  "M16",
];

const IMPERIAL_THREADS = [
  "0-80",
  "2-56",
  "4-40",
  "6-32",
  "8-32",
  "10-24",
  "10-32",
  "1/4-20",
  "1/4-28",
  "5/16-18",
  "3/8-16",
  "1/2-13",
];

const METRIC_LENGTHS = [
  "3",
  "4",
  "5",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
  "60",
  "70",
  "80",
  "100",
];

const IMPERIAL_LENGTHS = [
  "1/4",
  "3/8",
  "1/2",
  "5/8",
  "3/4",
  "7/8",
  "1.0",
  "1.25",
  "1.5",
  "1.75",
  "2.0",
  "2.5",
  "3.0",
];

const COMMON_DIAMETERS_MM = [
  "3",
  "4",
  "5",
  "6",
  "8",
  "10",
  "12",
  "15",
  "16",
  "20",
  "22",
  "25",
  "28",
  "30",
  "32",
  "35",
  "40",
  "50",
];

const sanitize = (s: string | boolean | undefined) =>
  typeof s === "string" ? s.trim().toUpperCase() : "";

const joinParts = (parts: (string | undefined | null | false)[]) =>
  parts.filter((p): p is string => Boolean(p && p.trim())).join(", ");

const MATERIALS = [
  "",
  "8.8 STL",
  "10.9 STL",
  "12.9 STL",
  "18-8 SS",
  "316 SS",
  "A2 SS",
  "A4 SS",
  "CARBON STL",
  "1018 STL",
  "BRASS",
  "NYL",
  "TI",
];

const FINISHES = ["", "ZINC", "BLK OX", "ANOD", "CLEAR ANOD", "NICKEL", "PTFE"];

const HEAD_TYPES = [
  "SHCS",
  "BHCS",
  "FHCS",
  "HHCS",
  "PHCS",
  "LHCS",
  "SSS",
];

const DRIVE_OPTIONS = [
  "",
  "H1.5",
  "H2.0",
  "H2.5",
  "H3.0",
  "H4.0",
  "H5.0",
  "H6.0",
  "H5/32IN",
  "H3/16IN",
  "T6",
  "T8",
  "T10",
  "T15",
  "T20",
  "T25",
  "T30",
  "PH",
  "PH1",
  "PH2",
];

export const CATEGORIES: Category[] = [
  {
    id: "screw",
    group: "FASTENERS",
    label: "SCREW / BOLT",
    description:
      "[HEAD], [THREAD]X[PITCH]X[LENGTH], [DRIVE], [MATERIAL], [FINISH]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "head",
        label: "HEAD TYPE",
        type: "select",
        options: HEAD_TYPES,
        defaultValue: "SHCS",
        width: "half",
      },
      {
        key: "units",
        label: "UNITS",
        type: "select",
        options: ["METRIC", "IMPERIAL"],
        defaultValue: "METRIC",
        width: "half",
      },
      {
        key: "thread",
        label: "THREAD",
        type: "text",
        placeholder: "M3  or  1/4-20",
        suggestions: (v) =>
          v.units === "IMPERIAL" ? IMPERIAL_THREADS : METRIC_THREADS,
        width: "third",
      },
      {
        key: "length",
        label: "LENGTH",
        type: "text",
        placeholder: "12  or  1.0",
        suggestions: (v) =>
          v.units === "IMPERIAL" ? IMPERIAL_LENGTHS : METRIC_LENGTHS,
        width: "third",
      },
      {
        key: "pitch",
        label: "PITCH",
        type: "text",
        placeholder: "0.5",
        hint: "auto-filled from thread",
        optional: true,
        advanced: true,
        width: "third",
      },
      {
        key: "threadForming",
        label: "THREAD FORMING (TF)",
        type: "checkbox",
        advanced: true,
        width: "full",
      },
      {
        key: "drive",
        label: "DRIVE",
        type: "select",
        options: DRIVE_OPTIONS,
        defaultValue: "H2.0",
        advanced: true,
        width: "third",
      },
      {
        key: "material",
        label: "MATERIAL",
        type: "select",
        options: MATERIALS,
        defaultValue: "8.8 STL",
        advanced: true,
        width: "third",
      },
      {
        key: "finish",
        label: "FINISH",
        type: "select",
        options: FINISHES,
        defaultValue: "ZINC",
        advanced: true,
        width: "third",
      },
    ],
    format: (v) => {
      const head = sanitize(v.head);
      const thread = sanitize(v.thread);
      const pitch = sanitize(v.pitch);
      const length = sanitize(v.length);
      const drive = sanitize(v.drive);
      const material = sanitize(v.material);
      const finish = sanitize(v.finish);
      const tf = v.threadForming === true;
      const imperial = v.units === "IMPERIAL";

      let dims = "";
      if (imperial) {
        const len = length && !/IN$/.test(length) ? `${length}IN` : length;
        dims = tf
          ? `${thread} TF X ${len}`
          : [thread, len].filter(Boolean).join("X");
      } else {
        dims = tf
          ? `${thread} TF X ${length}`
          : [thread, pitch, length].filter(Boolean).join("X");
      }
      return joinParts([head, dims, drive, material, finish]);
    },
    derive: (v) => {
      const out: Record<string, string | boolean> = {};
      const thread = sanitize(v.thread);
      const head = typeof v.head === "string" ? v.head : "";
      const mat = typeof v.material === "string" ? v.material : "";
      const metric = v.units !== "IMPERIAL";
      if (metric && thread in METRIC_PITCH) out.pitch = METRIC_PITCH[thread];
      if (!metric) out.pitch = "";
      if (head === "SHCS" && thread in SHCS_HEX) out.drive = SHCS_HEX[thread];
      else if (head === "BHCS" && thread in BHCS_HEX)
        out.drive = BHCS_HEX[thread];
      else if (head === "FHCS" && thread in FHCS_TORX)
        out.drive = FHCS_TORX[thread];
      else if (head === "PHCS") out.drive = "PH2";
      else if (head === "HHCS") out.drive = "";
      else if (head === "SSS" && thread in SHCS_HEX)
        out.drive = SHCS_HEX[thread];
      if (mat in MATERIAL_FINISH) out.finish = MATERIAL_FINISH[mat];
      return out;
    },
    examples: [
      "SHCS, M3X0.5X12, H2.0, 8.8 STL, ZINC",
      "FHCS, M3X0.5X6, T10, 8.8 STL, ZINC",
      "BHCS, 1/4-20X1.0IN, H5/32IN, 18-8 SS",
      "BHCS, M2 TF X 20, PH, 18-8 SS",
    ],
  },
  {
    id: "nut",
    group: "FASTENERS",
    label: "NUT",
    description: "NUT, [TYPE], [THREAD]X[PITCH], [MATERIAL/FINISH]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "type",
        label: "TYPE",
        type: "select",
        options: ["HEX", "NYLOC", "FLANGE", "JAM", "WING", "ACORN", "CASTLE"],
        defaultValue: "NYLOC",
        width: "half",
      },
      {
        key: "thread",
        label: "THREAD",
        type: "text",
        placeholder: "M4",
        suggestions: () => METRIC_THREADS.concat(IMPERIAL_THREADS),
        width: "half",
      },
      {
        key: "pitch",
        label: "PITCH",
        type: "text",
        placeholder: "0.7",
        hint: "auto-filled from thread",
        optional: true,
        advanced: true,
        width: "half",
      },
      {
        key: "material",
        label: "MATERIAL / FINISH",
        type: "text",
        placeholder: "12.9 STL, ZINC",
        defaultValue: "12.9 STL, ZINC",
        advanced: true,
        width: "half",
      },
    ],
    format: (v) => {
      const type = sanitize(v.type);
      const thread = sanitize(v.thread);
      const pitch = sanitize(v.pitch);
      const mat = sanitize(v.material);
      const dims = [thread, pitch].filter(Boolean).join("X");
      return joinParts(["NUT", type, dims, mat]);
    },
    derive: (v) => {
      const out: Record<string, string | boolean> = {};
      const thread = sanitize(v.thread);
      if (thread in NUT_PITCH) out.pitch = NUT_PITCH[thread];
      return out;
    },
    examples: ["NUT, NYLOC, M4X0.7, 12.9 STL, ZINC"],
  },
  {
    id: "washer",
    group: "FASTENERS",
    label: "WASHER",
    description: "WASHER, [TYPE], [NOMINAL SIZE], [MATERIAL/FINISH]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "type",
        label: "TYPE",
        type: "select",
        options: ["FLAT", "SPLIT LOCK", "FENDER", "TOOTH LOCK", "BELLEVILLE"],
        defaultValue: "FLAT",
        width: "third",
      },
      {
        key: "size",
        label: "NOMINAL SIZE",
        type: "text",
        placeholder: "M3 or 1/4IN",
        suggestions: () => METRIC_THREADS.concat(["1/4IN", "3/8IN", "1/2IN"]),
        width: "third",
      },
      {
        key: "material",
        label: "MATERIAL / FINISH",
        type: "text",
        placeholder: "316 SS",
        width: "third",
      },
    ],
    format: (v) =>
      joinParts([
        "WASHER",
        sanitize(v.type),
        sanitize(v.size),
        sanitize(v.material),
      ]),
    examples: [
      "WASHER, FLAT, M3, 316 SS",
      "WASHER, SPLIT LOCK, 1/4IN, ZINC",
    ],
  },
  {
    id: "dowel",
    group: "FASTENERS",
    label: "DOWEL / PIN",
    description: "DOWEL, [DIA][UNIT] D X [LEN][UNIT] L, [MATERIAL/FINISH]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "units",
        label: "UNITS",
        type: "select",
        options: ["MM", "IN"],
        defaultValue: "MM",
        width: "third",
      },
      {
        key: "diameter",
        label: "DIAMETER",
        type: "text",
        placeholder: "3",
        suggestions: () => ["1.5", "2", "2.5", "3", "4", "5", "6", "8", "10"],
        width: "third",
      },
      {
        key: "length",
        label: "LENGTH",
        type: "text",
        placeholder: "20",
        suggestions: () => ["6", "8", "10", "12", "16", "20", "25", "30", "40"],
        width: "third",
      },
      {
        key: "material",
        label: "MATERIAL / FINISH",
        type: "text",
        placeholder: "18-8 SS",
        defaultValue: "18-8 SS",
        width: "full",
      },
    ],
    format: (v) => {
      const unit = sanitize(v.units) || "MM";
      const d = sanitize(v.diameter);
      const l = sanitize(v.length);
      const dims =
        d && l
          ? `${d}${unit} D X ${l}${unit} L`
          : d
            ? `${d}${unit} D`
            : l
              ? `${l}${unit} L`
              : "";
      return joinParts(["DOWEL", dims, sanitize(v.material)]);
    },
    examples: [
      "DOWEL, 3MM D X 20MM L, 18-8 SS",
      "DOWEL, 0.25IN D X 1.0IN L, 18-8 SS",
    ],
  },
  {
    id: "bearing",
    group: "BEARINGS",
    label: "BEARING",
    description: "BEARING, [TYPE], [OD]X[ID]X[WIDTH][UNIT], [SEALS], [MATERIAL]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "type",
        label: "TYPE",
        type: "select",
        options: ["BALL", "NEEDLE", "ROLLER", "THRUST", "ANGULAR CONTACT"],
        defaultValue: "BALL",
        width: "half",
      },
      {
        key: "units",
        label: "UNITS",
        type: "select",
        options: ["MM", "IN"],
        defaultValue: "MM",
        width: "half",
      },
      {
        key: "od",
        label: "OD",
        type: "text",
        placeholder: "22",
        suggestions: () => COMMON_DIAMETERS_MM,
        width: "third",
      },
      {
        key: "id",
        label: "ID",
        type: "text",
        placeholder: "8",
        suggestions: () => COMMON_DIAMETERS_MM,
        width: "third",
      },
      {
        key: "width",
        label: "WIDTH",
        type: "text",
        placeholder: "7",
        suggestions: () => ["2", "3", "4", "5", "6", "7", "8", "10", "12", "15"],
        width: "third",
      },
      {
        key: "seals",
        label: "SEALS / SHIELDS",
        type: "select",
        options: ["", "2RS", "2Z", "OPEN", "1RS", "1Z"],
        defaultValue: "2RS",
        advanced: true,
        width: "half",
      },
      {
        key: "material",
        label: "MATERIAL",
        type: "text",
        placeholder: "52100 STL",
        defaultValue: "52100 STL",
        optional: true,
        advanced: true,
        width: "half",
      },
    ],
    format: (v) => {
      const od = sanitize(v.od);
      const id = sanitize(v.id);
      const w = sanitize(v.width);
      const unit = sanitize(v.units) || "MM";
      const core = [od, id, w].filter(Boolean).join("X");
      const dims = core ? `${core}${unit}` : "";
      return joinParts([
        "BEARING",
        sanitize(v.type),
        dims,
        sanitize(v.seals),
        sanitize(v.material),
      ]);
    },
    examples: [
      "BEARING, BALL, 22X8X7MM, 2RS, 52100 STL",
      "BEARING, BALL, 0.5X0.25X0.19IN, 2RS, 52100 STL",
    ],
  },
  {
    id: "bushing",
    group: "BEARINGS",
    label: "BUSHING",
    description: "BUSHING, [TYPE], [OD] X [ID] X [WIDTH] [UNIT]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "type",
        label: "TYPE",
        type: "select",
        options: ["FLANGED", "SLEEVE", "THRUST"],
        defaultValue: "FLANGED",
        width: "half",
      },
      {
        key: "units",
        label: "UNITS",
        type: "select",
        options: ["MM", "IN"],
        defaultValue: "IN",
        width: "half",
      },
      {
        key: "od",
        label: "OD",
        type: "text",
        placeholder: "0.375",
        width: "third",
      },
      {
        key: "id",
        label: "ID",
        type: "text",
        placeholder: "0.25",
        width: "third",
      },
      {
        key: "width",
        label: "WIDTH",
        type: "text",
        placeholder: "0.5",
        width: "third",
      },
    ],
    format: (v) => {
      const parts = [sanitize(v.od), sanitize(v.id), sanitize(v.width)].filter(
        Boolean,
      );
      const unit = sanitize(v.units) || "IN";
      const dims = parts.length ? `${parts.join(" X ")} ${unit}` : "";
      return joinParts(["BUSHING", sanitize(v.type), dims]);
    },
    examples: [
      "BUSHING, FLANGED, 0.25 X 0.375 X 0.5 IN",
      "BUSHING, SLEEVE, 6 X 8 X 10 MM",
    ],
  },
  {
    id: "raw",
    group: "RAW MATERIAL",
    label: "STOCK / EXTRUSION / SHEET",
    description: "[SHAPE], [PRIMARY DIMENSIONS], [MATERIAL]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "shape",
        label: "SHAPE",
        type: "select",
        options: [
          "TUBE",
          "ROD",
          "BAR",
          "SHEET",
          "PLATE",
          "EXTRUSION",
          "ANGLE",
          "CHANNEL",
        ],
        defaultValue: "TUBE",
        width: "half",
      },
      {
        key: "subtype",
        label: "SUB-TYPE",
        type: "text",
        placeholder: "ROUND / SQUARE / T-SLOT / 2020",
        optional: true,
        advanced: true,
        width: "half",
      },
      {
        key: "dims",
        label: "PRIMARY DIMENSIONS",
        type: "text",
        placeholder: "1.0IN OD X 0.120IN T",
        width: "full",
      },
      {
        key: "material",
        label: "MATERIAL",
        type: "text",
        placeholder: "6061-T6 AL",
        width: "half",
      },
      {
        key: "finish",
        label: "FINISH",
        type: "text",
        placeholder: "CLEAR ANOD",
        optional: true,
        advanced: true,
        width: "half",
      },
    ],
    format: (v) =>
      joinParts([
        sanitize(v.shape),
        sanitize(v.subtype),
        sanitize(v.dims),
        sanitize(v.material),
        sanitize(v.finish),
      ]),
    examples: [
      "TUBE, ROUND, 1.0IN OD X 0.120IN T, 6061-T6 AL",
      "EXTRUSION, T-SLOT, 2020, AL, CLEAR ANOD",
      "SHEET, 3 T, 304 SS",
    ],
  },
  {
    id: "electromech",
    group: "ELECTROMECHANICAL",
    label: "ELECTROMECH COMPONENT",
    description: "[NOUN], [TYPE], [KEY SPECS], [MFG] [MFG PN]",
    series: "2XXXXXX / 5XXXXXX / 6XXXXXX",
    fields: [
      {
        key: "noun",
        label: "NOUN",
        type: "select",
        options: [
          "SENSOR",
          "ACTUATOR",
          "MOTOR",
          "GEARMOTOR",
          "CONTROLLER",
          "PSU",
          "COUPLER",
          "CONNECTOR",
          "WIRE",
          "BATTERY",
          "FUSE",
          "PCBA",
          "HARNESS",
          "FAN",
          "HUB",
          "SOC",
        ],
        defaultValue: "SENSOR",
        width: "half",
      },
      {
        key: "type",
        label: "TYPE / SUB-TYPE",
        type: "text",
        placeholder: "PROXIMITY, INDUCTIVE, PNP",
        optional: true,
        advanced: true,
        width: "half",
      },
      {
        key: "specs",
        label: "KEY SPECS",
        type: "text",
        placeholder: "40 D X 20 T, 12.36CFM, 12VDC",
        optional: true,
        advanced: true,
        width: "full",
      },
      {
        key: "mfg",
        label: "MFG + PART NUMBER",
        type: "text",
        placeholder: "OMRON E2E-X4MD1",
        optional: true,
        width: "full",
      },
    ],
    format: (v) =>
      joinParts([
        sanitize(v.noun),
        sanitize(v.type),
        sanitize(v.specs),
        sanitize(v.mfg),
      ]),
    examples: [
      "SENSOR, PROXIMITY, INDUCTIVE, PNP, OMRON E2E-X4MD1",
      "ACTUATOR, DYNAMIXEL XC330-T288",
      "MOTOR, STEPPER, NEMA 17, MYACTUATOR 123456",
      "FAN, AXIAL, 40 D X 20 T, 12.36CFM, 12VDC, NMB 04020VE-12Q-CT",
    ],
  },
  {
    id: "misc",
    group: "MISC",
    label: "SPRING / O-RING / MISC",
    description: "[NOUN], [TYPE], [KEY DIMS], [MATERIAL]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "noun",
        label: "NOUN",
        type: "text",
        placeholder: "SPRING / ORING",
        width: "half",
      },
      {
        key: "type",
        label: "TYPE",
        type: "text",
        placeholder: "COMPRESSION",
        optional: true,
        advanced: true,
        width: "half",
      },
      {
        key: "dims",
        label: "DIMENSIONS",
        type: "text",
        placeholder: "3 OD X 10 L X 0.5, 8 TURN",
        width: "full",
      },
      {
        key: "material",
        label: "MATERIAL",
        type: "text",
        placeholder: "316 SS",
        optional: true,
        advanced: true,
        width: "full",
      },
    ],
    format: (v) =>
      joinParts([
        sanitize(v.noun),
        sanitize(v.type),
        sanitize(v.dims),
        sanitize(v.material),
      ]),
    examples: [
      "SPRING, COMPRESSION, 3 OD X 10 L X 0.5, 8 TURN, 316 SS",
      "ORING, 48 ID X 1 T, BUNA",
    ],
  },
  {
    id: "custom",
    group: "CUSTOM",
    label: "CUSTOM PART / ASSEMBLY",
    description: "(ASM), (PROJECT), [NOUN], [FUNCTIONAL MODIFIER], [HAND]",
    series: "1XXXXXX (ASM) / 2XXXXXX (PART)",
    fields: [
      {
        key: "isAssembly",
        label: "IS ASSEMBLY (ADD 'ASSEM' PREFIX)",
        type: "checkbox",
        advanced: true,
        width: "full",
      },
      {
        key: "project",
        label: "PROJECT / ASSEMBLY",
        type: "text",
        placeholder: "T6 2.0   (optional — skip if reusable)",
        hint: "use name from go/name",
        optional: true,
        advanced: true,
        width: "half",
      },
      {
        key: "noun",
        label: "NOUN",
        type: "text",
        placeholder: "BRACKET / HOUSING / LINK",
        width: "half",
      },
      {
        key: "modifier",
        label: "FUNCTIONAL MODIFIER",
        type: "text",
        placeholder: "MOTOR MOUNT",
        width: "full",
      },
      {
        key: "hand",
        label: "HAND (FROM ROBOT POV)",
        type: "select",
        options: ["", "L", "R"],
        defaultValue: "",
        optional: true,
        advanced: true,
        width: "third",
      },
    ],
    format: (v) => {
      const asm = v.isAssembly === true ? "ASSEM" : "";
      return joinParts([
        asm,
        sanitize(v.project),
        sanitize(v.noun),
        sanitize(v.modifier),
        sanitize(v.hand),
      ]);
    },
    examples: [
      "T6 2.0, BRACKET, MOTOR MOUNT",
      "ASSEM, S1, BASE LINK, R",
      "BRACKET, MOTOR MOUNT",
    ],
  },
];

export const GROUPS = Array.from(new Set(CATEGORIES.map((c) => c.group)));

export interface PPNInput {
  series: string;
  number: string;
  dash: string;
  revision: string;
}

export const SERIES_OPTIONS = [
  { value: "1", label: "1XXXXXX — ASSEMBLY" },
  { value: "2", label: "2XXXXXX — PART" },
  { value: "3", label: "3XXXXXX — STANDARD (AVOID)" },
  { value: "4", label: "4XXXXXX — ITEM (NON-GEOMETRIC)" },
  { value: "5", label: "5XXXXXX — ELECTRICAL" },
  { value: "6", label: "6XXXXXX — ELECTRICAL" },
  { value: "9", label: "9XXXXXX — FILE / SPEC / WI" },
];

export function formatPPN(ppn: PPNInput): string {
  const series = ppn.series || "";
  const raw = (ppn.number || "").replace(/\D/g, "").slice(0, 6);
  if (!series && !raw) return "";
  const padded = raw ? raw.padStart(6, "0") : "XXXXXX";
  let result = `${series}${padded}`;
  const dashDigits = (ppn.dash || "").replace(/\D/g, "").slice(0, 3);
  if (dashDigits) result += `-${dashDigits.padStart(3, "0")}`;
  return result;
}

export function formatFileName(
  ppn: string,
  revision: string,
  name: string,
): string {
  if (!ppn && !revision && !name) return "";
  const rev = revision ? `_${revision.trim().toUpperCase()}` : "";
  const nm = name ? ` ${name}` : "";
  return `${ppn || "XXXXXXX"}${rev}${nm}`;
}
