export type FieldType = "text" | "select" | "checkbox";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  options?: string[];
  defaultValue?: string | boolean;
  optional?: boolean;
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
  examples: string[];
}

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
        width: "third",
      },
      {
        key: "pitch",
        label: "PITCH",
        type: "text",
        placeholder: "0.5",
        hint: "blank for imperial",
        optional: true,
        width: "third",
      },
      {
        key: "length",
        label: "LENGTH",
        type: "text",
        placeholder: "12  or  1.0",
        width: "third",
      },
      {
        key: "threadForming",
        label: "THREAD FORMING (TF)",
        type: "checkbox",
        width: "full",
      },
      {
        key: "drive",
        label: "DRIVE",
        type: "select",
        options: DRIVE_OPTIONS,
        defaultValue: "H2.0",
        width: "third",
      },
      {
        key: "material",
        label: "MATERIAL",
        type: "select",
        options: MATERIALS,
        defaultValue: "8.8 STL",
        width: "third",
      },
      {
        key: "finish",
        label: "FINISH",
        type: "select",
        options: FINISHES,
        defaultValue: "ZINC",
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
        width: "half",
      },
      {
        key: "pitch",
        label: "PITCH",
        type: "text",
        placeholder: "0.7",
        optional: true,
        width: "half",
      },
      {
        key: "material",
        label: "MATERIAL / FINISH",
        type: "text",
        placeholder: "12.9 STL, ZINC",
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
    description: "DOWEL, [NOMINAL SIZE], [MATERIAL/FINISH]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "size",
        label: "NOMINAL SIZE",
        type: "text",
        placeholder: "3MM X 10",
        width: "half",
      },
      {
        key: "material",
        label: "MATERIAL / FINISH",
        type: "text",
        placeholder: "18-8 SS",
        width: "half",
      },
    ],
    format: (v) =>
      joinParts(["DOWEL", sanitize(v.size), sanitize(v.material)]),
    examples: ["DOWEL, 3 D X 20 L, 18-8 SS"],
  },
  {
    id: "bearing",
    group: "BEARINGS",
    label: "BEARING",
    description: "BEARING, [TYPE], [OD]X[ID]X[WIDTH], [SEALS], [MATERIAL]",
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
        key: "seals",
        label: "SEALS / SHIELDS",
        type: "select",
        options: ["", "2RS", "2Z", "OPEN", "1RS", "1Z"],
        defaultValue: "2RS",
        width: "half",
      },
      {
        key: "od",
        label: "OD",
        type: "text",
        placeholder: "22",
        width: "third",
      },
      {
        key: "id",
        label: "ID",
        type: "text",
        placeholder: "8",
        width: "third",
      },
      {
        key: "width",
        label: "WIDTH",
        type: "text",
        placeholder: "7",
        width: "third",
      },
      {
        key: "material",
        label: "MATERIAL",
        type: "text",
        placeholder: "52100 STL",
        optional: true,
        width: "full",
      },
    ],
    format: (v) => {
      const od = sanitize(v.od);
      const id = sanitize(v.id);
      const w = sanitize(v.width);
      const dims = [od, id, w].filter(Boolean).join("X");
      return joinParts([
        "BEARING",
        sanitize(v.type),
        dims,
        sanitize(v.seals),
        sanitize(v.material),
      ]);
    },
    examples: ["BEARING, BALL, 22X8X7, 2RS, 52100 STL"],
  },
  {
    id: "bushing",
    group: "BEARINGS",
    label: "BUSHING",
    description: "BUSHING, [TYPE], [OD] X [ID] X [WIDTH]",
    series: "2XXXXXX (OTS PART)",
    fields: [
      {
        key: "type",
        label: "TYPE",
        type: "select",
        options: ["FLANGED", "SLEEVE", "THRUST"],
        defaultValue: "FLANGED",
        width: "full",
      },
      {
        key: "od",
        label: "OD",
        type: "text",
        placeholder: "0.375IN",
        width: "third",
      },
      {
        key: "id",
        label: "ID",
        type: "text",
        placeholder: "0.25IN",
        width: "third",
      },
      {
        key: "width",
        label: "WIDTH",
        type: "text",
        placeholder: "0.5IN",
        width: "third",
      },
    ],
    format: (v) => {
      const parts = [sanitize(v.od), sanitize(v.id), sanitize(v.width)].filter(
        Boolean,
      );
      const dims = parts.join(" X ");
      return joinParts(["BUSHING", sanitize(v.type), dims]);
    },
    examples: ["BUSHING, FLANGED, 0.25IN X 0.375IN X 0.5IN"],
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
        width: "half",
      },
      {
        key: "specs",
        label: "KEY SPECS",
        type: "text",
        placeholder: "40 D X 20 T, 12.36CFM, 12VDC",
        optional: true,
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
        width: "full",
      },
      {
        key: "project",
        label: "PROJECT / ASSEMBLY",
        type: "text",
        placeholder: "T6 2.0   (optional — skip if reusable)",
        hint: "use name from go/name",
        optional: true,
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
