function hasValidMedia(url) {
  if (!url) return false;
  if (!url.startsWith("http")) return false;
  if (url.includes("tu-proyecto")) return false;
  return true;
}

export default function FitCard({ ex, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
      style={{
        borderRadius: 18,
        border: "1px solid var(--stroke)",
        background: expanded ? "linear-gradient(180deg, rgba(255,122,24,.10), rgba(18,24,35,.95))" : "rgba(18,24,35,.65)",
        boxShadow: "var(--shadow)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 120ms ease, background 120ms ease",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: expanded ? "1fr" : "110px 1fr", gap: 12, padding: 12 }}>
        <div
          style={{
            height: expanded ? 220 : 90,
            borderRadius: 16,
            overflow: "hidden",
            background: "rgba(255,255,255,.04)",
            border: "1px solid var(--stroke)",
          }}
        >
          {hasValidMedia(ex.media_url) ? (
            <img
              src={ex.media_url}
              alt={ex.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
            />
          ) : (
            <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 12 }}>
              Sin media
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 950, fontSize: expanded ? 18 : 15 }}>{ex.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{expanded ? "Cerrar" : "Ver"}</div>
          </div>

          {expanded && (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip>{ex.primary_muscle ?? "—"}</Chip>
                <Chip>{ex.equipment ?? "—"}</Chip>
                <Chip>{ex.category ?? "—"}</Chip>
              </div>

              {ex.description ? (
                <div style={{ fontSize: 13, color: "rgba(232,238,247,.85)", lineHeight: 1.35 }}>
                  {ex.description}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: "rgba(232,238,247,.9)",
        border: "1px solid var(--stroke)",
        background: "rgba(255,255,255,.04)",
        padding: "6px 10px",
        borderRadius: 999,
      }}
    >
      {children}
    </div>
  );
}

