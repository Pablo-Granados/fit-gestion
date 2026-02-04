export const GROUP_ORDER = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Core",
  "Cuádriceps",
  "Isquios",
  "Glúteos",
  "Gemelos",
  "Aductores",
  "Piernas",
  "Otros",
];

export const GROUP_META = {
  Pecho: {
    imgUrl:
      "https://thumbs.dreamstime.com/b/el-pecho-muscles-m%C3%BAsculo-pectoral-mayor-y-menor-la-iso-de-los-m%C3%BAsculos-de-la-anatom%C3%ADa-71503436.jpg",
  },
  Espalda: {
    imgUrl:
      "https://img.freepik.com/fotos-premium/hombre-espalda-que-dice-vuelta-espalda_1105043-157893.jpg",
  },
  Hombros: {
    imgUrl:
      "https://thumbs.dreamstime.com/z/hombros-deltoideo-m%C3%BAsculos-de-la-anatom%C3%ADa-32284054.jpg",
  },
  Bíceps: {
    imgUrl:
      "https://thumbs.dreamstime.com/z/el-b%C3%ADceps-muscles-los-m%C3%BAsculos-de-la-anatom%C3%ADa-aislados-en-blanco-el-illustra-d-71503288.jpg",
  },
  Tríceps: {
    imgUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCEHTB2p7M7y_TvbmwQMN6ZRhSOM4UyswiAw",
  },
  Core: {
    imgUrl:
      "https://thumbs.dreamstime.com/z/m%C3%BAsculo-recto-abdominis-m%C3%BAsculos-abdominales-m%C3%BAsculos-de-la-anatom%C3%ADa-aislados-71503700.jpg",
  },
};

export function groupLabel(primaryMuscle) {
  const m = (primaryMuscle ?? "").toString().toLowerCase();

  if (m.includes("pecho")) return "Pecho";
  if (m.includes("espalda")) return "Espalda";
  if (m.includes("homb")) return "Hombros";
  if (m.includes("bíceps") || m.includes("biceps")) return "Bíceps";
  if (m.includes("tríceps") || m.includes("triceps")) return "Tríceps";
  if (m.includes("core")) return "Core";

  if (m.includes("cuádr") || m.includes("cuadr")) return "Cuádriceps";
  if (m.includes("isqu")) return "Isquios";
  if (m.includes("glút") || m.includes("glut")) return "Glúteos";
  if (m.includes("gemel")) return "Gemelos";
  if (m.includes("aductor")) return "Aductores";
  if (m.includes("pierna")) return "Piernas";

  return "Otros";
}

export function groupOrder(label) {
  const idx = GROUP_ORDER.indexOf(label);
  return idx === -1 ? 999 : idx;
}

export function hasUrl(u) {
  return typeof u === "string" && u.trim().length > 0;
}

export function initials(text) {
  const t = (text ?? "").trim();
  if (!t) return "--";
  const parts = t.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? t[0] ?? "-";
  const b = parts[1]?.[0] ?? (t.length > 1 ? t[1] : "");
  return (a + b).toUpperCase();
}
