import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/exercises", label: "Ejercicios", icon: "🏋️" },
  { to: "/programs", label: "Rutinas", icon: "📅" },
  { to: "/workouts", label: "Registros", icon: "⏱️" },
  { to: "/progress", label: "Progreso", icon: "📈" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <nav
        style={{
          pointerEvents: "auto",
          display: "flex",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 20,
          background: "rgba(20,24,35,.9)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,.08)",
          boxShadow: "0 10px 30px rgba(0,0,0,.4)",
          maxWidth: 420,
          width: "calc(100% - 32px)",
          justifyContent: "space-between",
        }}
      >
        {items.map((item) => {
          const active = pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                flex: 1,
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 6px",
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 700,
                color: active ? "#111" : "rgba(255,255,255,.75)",
                background: active
                  ? "linear-gradient(180deg,#ff9a3c,#ff7a18)"
                  : "transparent",
                transition: "all .15s ease",
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
