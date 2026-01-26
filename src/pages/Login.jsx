import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState("login"); // login | signup
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        setMsg("Cuenta creada. Revisá tu email si te pide confirmación.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        nav("/programs");
      }
    } catch (err) {
      setMsg(err.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>{mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <input
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          required
        />
        <button disabled={loading} type="submit">
          {loading ? "..." : mode === "signup" ? "Crear" : "Entrar"}
        </button>
      </form>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            setMsg("");
            setMode(mode === "signup" ? "login" : "signup");
          }}
        >
          {mode === "signup" ? "Ya tengo cuenta" : "Crear cuenta"}
        </button>

        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            setMsg("Sesión cerrada.");
          }}
        >
          Logout
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
