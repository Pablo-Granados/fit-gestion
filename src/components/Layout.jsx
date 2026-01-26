import { Link, useLocation } from "react-router-dom";

export default function Layout({ title, children }) {
  const { pathname } = useLocation();

  const Item = ({ to, label }) => (
    <Link
      to={to}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        textDecoration: "none",
        border: "1px solid #ddd",
        background: pathname === to ? "#eee" : "white",
        color: "black",
        fontWeight: pathname === to ? 700 : 500,
      }}
    >
      {label}
    </Link>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Item to="/exercises" label="Ejercicios" />
          <Item to="/programs" label="Rutinas" />
          <Item to="/workouts" label="Entrenos" />
          <Item to="/progress" label="Progreso" />
        </nav>
      </div>

      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}
