import { useMemo, useState } from "react";
import FitCard from "../../components/FitCard";
import ExerciseGroupCard from "./ExerciseGroupCard";
import { useExercises } from "./useExercises";

export default function ExercisePicker({
  onPick,                // (exercise) => void
  excludeIds = [],       // [id, id, ...]
  title = "Agregar ejercicios",
}) {
  const [q, setQ] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { grouped, loading, errorMsg } = useExercises({ query: q });

  // ✅ para ocultar ya agregados
  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  // grouped filtrado por exclude
  const groupedFiltered = useMemo(() => {
    return grouped
      .map(([label, list]) => [label, list.filter((ex) => !excludeSet.has(ex.id))])
      .filter(([_, list]) => list.length > 0);
  }, [grouped, excludeSet]);

  const openList = useMemo(() => {
    if (!openGroup) return [];
    const found = groupedFiltered.find(([label]) => label === openGroup);
    return found ? found[1] : [];
  }, [openGroup, groupedFiltered]);

  return (
    <div style={{ display: "grid", gap: 12}}>
      {/* Search */}
      <div
        style ={{
          background: "rgba(18,24,35,.65)",
          border: "1px solid var(--text)" , 
          borderRadius: 18,
          padding: 12,
          boxShadow: "var(--shadow)",
        }}
      >
        <input
          placeholder="Buscar (nombre, músculo, equipo...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ 
            width: "100%",
          }}
        />
      </div>

      {/* Grupos */}
      {loading ? (
        <div style={{ color: "var(--muted)" }}>Cargando ejercicios…</div>
      ) : errorMsg ? (
        <div style={{ color: "var(--muted)" }}>{errorMsg}</div>
      ) : groupedFiltered.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>No hay ejercicios disponibles.</div>
      ) : (
        <>
          <style>{`
            .picker-grid{
              display:grid;
              gap:12px;
              grid-template-columns: repeat(2, minmax(0, 1fr)); /* ✅ mobile 2 si o si */
            }
            @media (min-width: 900px){
              .picker-grid{
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              }
            }
          `}</style>

          <div className="picker-grid">
            {groupedFiltered.map(([label, list]) => (
              <ExerciseGroupCard
                key={label}
                label={label}
                count={list.length}
                onClick={() => {
                  setOpenGroup(label);
                  setExpandedId(null);
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* MODAL Grupo */}
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
                <div style={{ fontSize: 16, fontWeight: 950 }}>{title}: {openGroup}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{openList.length} disponibles</div>
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

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {openList.map((ex) => (
                <div key={ex.id} style={{ display: "grid", gap: 8 }}>
                  <FitCard
                    ex={ex}
                    expanded={expandedId === ex.id}
                    onToggle={() => setExpandedId((prev) => (prev === ex.id ? null : ex.id))}
                  />

                  {/* ✅ botón Agregar */}
                  <button
                    type="button"
                    onClick={() => onPick?.(ex)}
                    style={{
                      width: "100%",
                      fontWeight: 950,
                      borderRadius: 14,
                      padding: "10px 12px",
                      background: "rgba(255,122,24,.18)",
                      border: "1px solid rgba(255,122,24,.30)",
                    }}
                  >
                    + Agregar a este día
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
