import { useEffect, useMemo, useState } from "react";
import FitCard from "../components/FitCard";
import { supabase } from "../lib/supabase";

/* =======================
   Utils
======================= */

function groupLabel(muscle) {
  const m = (muscle ?? "").toLowerCase();
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

const GROUP_ORDER = [
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

function hasUrl(u) {
  return typeof u === "string" && u.trim().length > 0;
}

function initials(label) {
  return label
    .split(" ")
    .map((l) => l[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* =======================
   Imágenes por grupo
======================= */

const GROUP_META = {
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

/* =======================
   Page
======================= */

export default function Exercises() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    supabase
      .from("exercises")
      .select("id,name,primary_muscle")
      .order("name")
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    rows.forEach((ex) => {
      const label = groupLabel(ex.primary_muscle);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(ex);
    });

    return Array.from(map.entries()).sort(
      (a, b) =>
        GROUP_ORDER.indexOf(a[0]) - GROUP_ORDER.indexOf(b[0]) ||
        a[0].localeCompare(b[0])
    );
  }, [rows]);

  const openList = grouped.find(([l]) => l === openGroup)?.[1] ?? [];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 120px" }}>
      {/* HEADER */}
      <h2>Ejercicios</h2>

      {/* SEARCH */}
      <input
        placeholder="Buscar ejercicio..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: "100%", marginBottom: 16 }}
      />

      {/* GRID */}
      <style>{`
        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (min-width: 900px) {
          .grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }
      `}</style>

      <div className="grid">
        {grouped.map(([label, list]) => {
          const url = GROUP_META[label]?.imgUrl;
          return (
            <button
              key={label}
              onClick={() => setOpenGroup(label)}
              style={{ background: "transparent", padding: 0 }}
            >
              <div
                style={{
                  position: "relative",
                  borderRadius: 18,
                  border: "1px solid var(--stroke)",
                  background: "rgba(18,24,35,.65)",
                  padding: 14,
                  minHeight: 170,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* COUNT */}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 10,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "whitesmoke"
                  }}
                >
                  {list.length}
                </div>

                {/* IMAGE */}
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 18,
                    overflow: "hidden",
                    background: "rgba(255,122,24,.15)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {hasUrl(url) ? (
                    <img
                      src={url}
                      alt={label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{initials(label)}</span>
                  )}
                </div>

                {/* NAME */}
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 18,
                    color: "whitesmoke",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {label}
                </div>

                {/* CTA */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    fontWeight: 800,
                  }}
                >
                  Tocá para ver
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* MODAL */}
      {openGroup && (
        <div
          onClick={() => setOpenGroup(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 100%)",
              maxHeight: "80vh",
              overflow: "auto",
              background: "#111",
              padding: 16,
              borderRadius: 20,
            }}
          >
            <h3>{openGroup}</h3>

            {openList.map((ex) => (
              <FitCard
                key={ex.id}
                ex={ex}
                expanded={expandedId === ex.id}
                onToggle={() =>
                  setExpandedId((p) => (p === ex.id ? null : ex.id))
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
