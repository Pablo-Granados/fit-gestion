import { Link, useLocation } from "react-router-dom";

function NavItem({ to, label, icon }) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        display: "grid",
        placeItems: "center",
        gap: 4,
        padding: "10px 12px",
        borderRadius: 16,
        color: active ? "#111" : "rgba(232,238,247,.8)",
        background: active ? "linear-gradient(180deg, var(--accent2), var(--accent))" : "transparent",
        border: active ? "0" : "1px solid transparent",
        minWidth: 72,
      }}
    >
      <div style={{ fontSize: 18, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 800 }}>{label}</div>
    </Link>
  );
}

export default function AppShell({ title, subtitle, children }) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100%",
        padding: "18px 16px 92px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div> : null}
        </div>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: "rgba(255,255,255,.04)",
            border: "1px solid var(--stroke)",
            display: "grid",
            placeItems: "center",
            boxShadow: "var(--shadow)",
          }}
          title="Perfil"
        >
          👤
        </div>
      </div>

      <div style={{ marginTop: 16 }}>{children}</div>

      {/* Bottom Nav */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 12,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "min(480px, calc(100% - 24px))",
            background: "rgba(18,24,35,.82)",
            border: "1px solid var(--stroke)",
            borderRadius: 22,
            padding: 10,
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            boxShadow: "var(--shadow)",
            backdropFilter: "blur(10px)",
          }}
        >
          <NavItem to="/exercises" label="Ejercicios" icon="🏋️" />
          <NavItem to="/programs" label="Rutinas" icon="🗓️" />
          <NavItem to="/workouts" label="Entrenos" icon="⏱️" />
          <NavItem to="/progress" label="Progreso" icon="📈" />
        </div>
      </div>
    </div>
  );
}
