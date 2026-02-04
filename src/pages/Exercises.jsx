import { useMemo, useState } from "react";
import FitCard from "../components/FitCard";
import ExerciseGroupCard from "../features/exercises/ExerciseGroupCard";
import { useExercises } from "../features/exercises/useExercises";

export default function Exercises() {
  const [q, setQ] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { grouped, loading, errorMsg } = useExercises({ query: q });

  const openList = useMemo(() => {
    if (!openGroup) return [];
    const found = grouped.find(([label]) => label === openGroup);
    return found ? found[1] : [];
  }, [openGroup, grouped]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px 120px" }}>
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

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ color: "var(--muted)" }}>Cargando ejercicios…</div>
        ) : errorMsg ? (
          <div style={{ color: "var(--muted)" }}>{errorMsg}</div>
        ) : (
          <>
            <style>{`
              .muscle-grid {
                display: grid;
                gap: 12px;
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
              @media (min-width: 900px) {
                .muscle-grid {
                  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                }
              }
            `}</style>

            <div className="muscle-grid">
              {grouped.map(([label, list]) => (
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

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
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
