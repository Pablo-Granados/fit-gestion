import { GROUP_META, hasUrl, initials } from "./exerciseGroups";

export default function ExerciseGroupCard({ label, count, onClick }) {
    const url = GROUP_META[label]?.imgUrl;

    return (
        <button
            type="button"
            onClick={onClick}
            style={{ 
                background: "transparent", padding: 0, 
                width: "100%",
            }}
        >
            <div
                style={{
                    position: "relative",
                    borderRadius: 18,
                    border: "1px solid whitesmoke",
                    background: "rgba(18,24,35,.65)",
                    boxShadow: "var(--shadow)",
                    padding: 14,
                    minHeight: 50,
                    display: "grid",
                    gridTemplateRows: "auto 1fr",
                    gap: 8,
                    textAlign: "center",
                }}
            >
                {/* Imagen */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 14,
                            background: "rgba(255,122,24,.16)",
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
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <div style={{ fontWeight: 950, color: "rgba(255,255,255,.9)" }}>
                                {initials(label)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Título + CTA */}
                <div style={{ display: "grid", gap: 6 }}>
                    <div
                        style={{
                            color: "white",
                            fontWeight: 950,
                            fontSize: 18,
                            lineHeight: 1.1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                        title={`${label} (${count})`}
                    >
                        {label}{" "}
                        <span style={{ color: "var(--muted)", fontWeight: 800 }}>
                            ({count})
                        </span>
                    </div>

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
            </div>
        </button>
    );
}
