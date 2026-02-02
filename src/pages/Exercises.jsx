import { useEffect, useMemo, useState } from "react";
import FitCard from "../components/FitCard";
import { supabase } from "../lib/supabase";

/* =======================
   Utils
======================= */

function groupLabel(muscle) {
  const m = (muscle ?? "").toString().toLowerCase();

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

function groupOrder(label) {
  const i = GROUP_ORDER.indexOf(label);
  return i === -1 ? 999 : i;
}

function hasUrl(u) {
  return typeof u === "string" && u.trim().length > 0;
}

/* =======================
   Imágenes por grupo
   (reemplazá por las tuyas cuando quieras)
======================= */

const GROUP_META = {
  Pecho: {
    imgUrl: "https://thumbs.dreamstime.com/b/el-pecho-muscles-m%C3%BAsculo-pectoral-mayor-y-menor-la-iso-de-los-m%C3%BAsculos-de-la-anatom%C3%ADa-71503436.jpg",
  },
  Espalda: {
    imgUrl: "https://img.freepik.com/fotos-premium/hombre-espalda-que-dice-vuelta-espalda_1105043-157893.jpg?semt=ais_hybrid&w=740&q=80",
  },
  Hombros: {
    imgUrl: "https://thumbs.dreamstime.com/z/hombros-deltoideo-m%C3%BAsculos-de-la-anatom%C3%ADa-32284054.jpg",
  },
  Bíceps: {
    imgUrl: "https://thumbs.dreamstime.com/z/el-b%C3%ADceps-muscles-los-m%C3%BAsculos-de-la-anatom%C3%ADa-aislados-en-blanco-el-illustra-d-71503288.jpg",
  },
  Tríceps: {
    imgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCEHTB2p7M7y_TvbmwQMN6ZRhSOM4UyswiAw&s",
  },
  Core: {
    imgUrl: "https://thumbs.dreamstime.com/z/m%C3%BAsculo-recto-abdominis-m%C3%BAsculos-abdominales-m%C3%BAsculos-de-la-anatom%C3%ADa-aislados-71503700.jpg",
  },
};

function initials(label) {
  const t = (label ?? "").trim();
  if (!t) return "--";
  const parts = t.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? t[0] ?? "-";
  const b = parts[1]?.[0] ?? (t.length > 1 ? t[1] : "");
  return (a + b).toUpperCase();
}

/* =======================
   Page
======================= */

export default function Exercises() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [openGroup, setOpenGroup] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("exercises")
        .select("id,name,primary_muscle,equipment,category,media_url,description")
        .order("name", { ascending: true });

      if (!mounted) return;
      if (error) console.error(error);

      setRows(data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      const blob = `${r.name} ${r.primary_muscle ?? ""} ${r.equipment ?? ""} ${r.category ?? ""}`.toLowerCase();
      return blob.includes(s);
    });
  }, [q, rows]);

  const grouped = useMemo(() => {
    const map = new Map();

    for (const ex of filtered) {
      const label = groupLabel(ex.primary_muscle);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(ex);
    }

    return Array.from(map.entries()).sort(
      (a, b) => groupOrder(a[0]) - groupOrder(b[0]) || a[0].localeCompare(b[0])
    );
  }, [filtered]);

  const openList = useMemo(() => {
    if (!openGroup) return [];
    const found = grouped.find(([label]) => label === openGroup);
    return found ? found[1] : [];
  }, [openGroup, grouped]);

  return (
    // ✅ IMPORTANTE: maxWidth grande, no 480
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "18px 16px 120px", // espacio para bottom nav
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950 }}>Ejercicios</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Elegí un grupo muscular</div>
        </div>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: "rgba(255,255,255,.05)",
            border: "1px solid var(--stroke)",
            display: "grid",
            placeItems: "center",
          }}
        >
          👤
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          marginTop: 16,
          background: "rgba(18,24,35,.65)",
          border: "1px solid var(--stroke)",
          borderRadius: 18,
          padding: 12,
          boxShadow: "var(--shadow)",
        }}
      >
        <input
          placeholder="Buscar (nombre, músculo, equipo...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {/* GRID */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ color: "var(--muted)" }}>Cargando ejercicios…</div>
        ) : grouped.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No hay resultados.</div>
        ) : (
          <>
            <style>{`
              /* ✅ Mobile: SI O SI 2 columnas */
              .muscle-grid {
                display: grid;
                gap: 12px;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                padding: 12;
              }

              /* ✅ Desktop: se agregan cards (no se agrandan infinito) */
              @media (min-width: 820px) {
                .muscle-grid {
                  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                }
              }

              /* ✅ Pantallas muy grandes: mínimo un poco más grande */
              @media (min-width: 1200px) {
                .muscle-grid {
                  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                }
              }
            `}</style>

            <div className="muscle-grid">
              {grouped.map(([label, list]) => {
                const url = GROUP_META[label]?.imgUrl;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setOpenGroup(label);
                      setExpandedId(null);
                    }}
                    style={{
                      padding: 0,
                      background: "transparent",
                      boxShadow: "none",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    {/* CARD */}
                    <div
                      style={{
                        position: "relative",
                        borderRadius: 18,
                        border: "1px solid var(--stroke)",
                        background: "rgba(18,24,35,.65)",
                        boxShadow: "var(--shadow)",
                        padding: 12,
                        overflow: "hidden",

                        // ✅ card no se estira infinito
                        width: "100%",
                        maxWidth: 520,
                        margin: "0 auto",

                        // ✅ layout de tu diseño
                        minHeight: 120,
                        display: "grid",
                        gridTemplateColumns: "clamp(72px, 18vw, 110px) 1fr",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      {/* contador en esquina */}
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 10,
                          fontSize: 11,
                          fontWeight: 900,
                          color: "rgba(255,255,255,.7)",
                          background: "rgba(255,255,255,.06)",
                          border: "1px solid var(--stroke)",
                          padding: "4px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {list.length}
                      </div>

                      {/* imagen/fallback */}
                      <div
                        style={{
                          width: "clamp(72px, 18vw, 110px)",
                          height: "clamp(72px, 18vw, 110px)",
                          borderRadius: 18,
                          background: "rgba(255,122,24,.15)",
                          border: "1px solid rgba(255,122,24,.25)",
                          display: "grid",
                          placeItems: "center",
                          overflow: "hidden",
                        }}
                      >
                        {hasUrl(url) ? (
                          <img
                            src={url}
                            alt={label}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            onError={(e) => {
                              // si falla, ocultamos y dejamos el fallback visual
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "grid",
                              placeItems: "center",
                              color: "rgba(255,255,255,.7)",
                              fontWeight: 950,
                              fontSize: 16,
                              letterSpacing: 0.6,
                            }}
                          >
                            {initials(label)}
                          </div>
                        )}
                      </div>

                      {/* textos */}
                      <div
                        style={{
                          height: "100%",
                          display: "grid",
                          gridTemplateRows: "1fr auto",
                          alignItems: "center",
                          textAlign: "center",
                          paddingRight: 18, // margen para que no toque el contador
                        }}
                      >
                        <div
                          style={{
                            fontSize: "clamp(10px, 4.5vw, 24px)",
                            fontWeight: 950,
                            color: "white",
                            lineHeight: 1.05,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {label}
                        </div>

                        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800, whiteSpace: "nowrap" }}>
                          Tocá para ver
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {openGroup && (
        <div
          onClick={() => setOpenGroup(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(6px)",
            zIndex: 80,
            display: "grid",
            placeItems: "end center",
            padding: 14,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 100%)",
              maxHeight: "86vh",
              overflow: "auto",
              borderRadius: 22,
              border: "1px solid var(--stroke)",
              background: "rgba(18,24,35,.92)",
              boxShadow: "var(--shadow)",
              padding: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 950 }}>{openGroup}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{openList.length} ejercicios</div>
              </div>

              <button
                type="button"
                onClick={() => setOpenGroup(null)}
                style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid var(--stroke)",
                  color: "var(--text)",
                  padding: "10px 12px",
                  borderRadius: 14,
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 12}}>
              {openList.map((ex) => (
                <FitCard
                  key={ex.id}
                  ex={ex}
                  expanded={expandedId === ex.id}
                  onToggle={() => setExpandedId((prev) => (prev === ex.id ? null : ex.id))}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
