import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import FitCard from "../components/FitCard";
import { supabase } from "../lib/supabase";

// function groupLabel(muscle) {
//   const m = (muscle ?? "").toString().toLowerCase();
//   if (m.includes("pecho")) return "Pecho";
//   if (m.includes("espalda")) return "Espalda";
//   if (m.includes("homb")) return "Hombros";
//   if (m.includes("bíceps") || m.includes("biceps")) return "Bíceps";
//   if (m.includes("tríceps") || m.includes("triceps")) return "Tríceps";
//   if (m.includes("cuádr") || m.includes("cuadr")) return "Cuádriceps";
//   if (m.includes("isqu")) return "Isquios";
//   if (m.includes("glút") || m.includes("glut")) return "Glúteos";
//   if (m.includes("gemel")) return "Gemelos";
//   if (m.includes("core")) return "Core";
//   if (m.includes("piernas")) return "Piernas";
//   return muscle ? muscle : "Otros";
// }

function groupLabel(muscle) {
  const m = (muscle ?? "").toString().toLowerCase();

  if (m.includes("pecho")) return "Pecho";
  if (m.includes("espalda")) return "Espalda";
  if (m.includes("homb")) return "Hombros";
  if (m.includes("bíceps") || m.includes("biceps")) return "Bíceps";
  if (m.includes("tríceps") || m.includes("triceps")) return "Tríceps";
  if (m.includes("core")) return "Core";

  // ✅ Piernas (subgrupos)
  if (m.includes("cuádr") || m.includes("cuadr")) return "Cuádriceps";
  if (m.includes("isqu")) return "Isquios";
  if (m.includes("glút") || m.includes("glut")) return "Glúteos";
  if (m.includes("gemel")) return "Gemelos";
  if (m.includes("aductor")) return "Aductores";

  // genérico piernas
  if (m.includes("pierna")) return "Piernas";

  return muscle ? muscle : "Otros";
}


export default function Exercises() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
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
    return () => (mounted = false);
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
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <AppShell title="Ejercicios" subtitle="Biblioteca por grupo muscular">
      <div
        style={{
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

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div style={{ color: "var(--muted)" }}>Cargando ejercicios...</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {grouped.map(([label, list]) => (
              // ✅ cerrados por defecto (sin open)
              <details key={label} style={{ borderRadius: 18, overflow: "hidden" }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 950,
                    padding: "12px 12px",
                    borderRadius: 18,
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid var(--stroke)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {label}{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 800 }}>
                    ({list.length})
                  </span>
                </summary>

                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {list.map((ex) => (
                    <FitCard
                      key={ex.id}
                      ex={ex}
                      expanded={expandedId === ex.id}
                      onToggle={() => setExpandedId((prev) => (prev === ex.id ? null : ex.id))}
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

