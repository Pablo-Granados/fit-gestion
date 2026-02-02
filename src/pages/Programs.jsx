import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

/* ========= helpers ========= */

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function initials(label) {
  const t = (label ?? "").trim();
  if (!t) return "--";
  const parts = t.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? t[0] ?? "-";
  const b = parts[1]?.[0] ?? (t.length > 1 ? t[1] : "");
  return (a + b).toUpperCase();
}

function GlassBox({ children, style }) {
  return (
    <div
      style={{
        background: "rgba(18,24,35,.65)",
        border: "1px solid var(--stroke)",
        borderRadius: 18,
        boxShadow: "var(--shadow)",
        padding: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, variant = "ghost", ...props }) {
  const base = {
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
    border: "1px solid var(--stroke)",
    background: "rgba(255,255,255,.06)",
    color: "var(--text)",
  };

  const variants = {
    ghost: base,
    primary: {
      ...base,
      background: "rgba(255,122,24,.18)",
      border: "1px solid rgba(255,122,24,.30)",
    },
    danger: {
      ...base,
      background: "rgba(255,80,80,.12)",
      border: "1px solid rgba(255,80,80,.28)",
    },
    flat: {
      ...base,
      background: "transparent",
      border: "1px solid var(--stroke)",
    },
  };

  return (
    <button {...props} style={{ ...variants[variant], ...(props.style ?? {}) }}>
      {children}
    </button>
  );
}

/* ========= page ========= */

export default function Programs() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [title, setTitle] = useState("");

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("programs")
      .select("id,title,notes,created_at")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    setPrograms(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createProgram(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;

    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    if (!userId) return alert("No hay sesión.");

    const { error } = await supabase.from("programs").insert({
      user_id: userId,
      title: t,
    });

    if (error) return alert(error.message);

    setTitle("");
    load();
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditingTitle(p.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
  }

  async function saveEdit(programId) {
    const t = editingTitle.trim();
    if (!t) return alert("El nombre no puede quedar vacío.");

    const { error } = await supabase.from("programs").update({ title: t }).eq("id", programId);
    if (error) return alert(error.message);

    cancelEdit();
    load();
  }

  async function deleteProgram(programId) {
    const ok = confirm("¿Eliminar rutina? Se borrarán también sus días y ejercicios.");
    if (!ok) return;

    const { error } = await supabase.from("programs").delete().eq("id", programId);
    if (error) return alert(error.message);

    load();
  }

  const count = useMemo(() => programs.length, [programs]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px 120px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950 }}>Rutinas</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Tus planes guardados ({count})
          </div>
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
          title="Perfil"
        >
          👤
        </div>
      </div>

      {/* Crear rutina */}
      <div style={{ marginTop: 16 }}>
        <GlassBox>
          <form
            onSubmit={createProgram}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 10,
              alignItems: "center",
            }}
          >
            <input
              placeholder="Nueva rutina (ej: Full body 3 días)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
              }}
            />

            <Btn type="submit" variant="primary">
              Crear
            </Btn>

            <Btn type="button" onClick={load}>
              Refrescar
            </Btn>
          </form>
        </GlassBox>
      </div>

      {/* Grid */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ color: "var(--muted)" }}>Cargando rutinas…</div>
        ) : programs.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Todavía no tenés rutinas.</div>
        ) : (
          <>
            <style>{`
              /* Mobile: 2 columnas sí o sí */
              .programs-grid{
                display:grid;
                gap:12px;
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
              /* Desktop: agrega cards */
              @media (min-width: 820px){
                .programs-grid{
                  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                }
              }
            `}</style>

            <div className="programs-grid">
              {programs.map((p) => {
                const isEditing = editingId === p.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      position: "relative",
                      borderRadius: 18,
                      border: "1px solid var(--stroke)",
                      background: "rgba(18,24,35,.65)",
                      boxShadow: "var(--shadow)",
                      padding: 12,
                      overflow: "hidden",
                      minHeight: 140,

                      width: "100%",
                      // maxWidth: 520,
                      margin: "0 auto",

                      display: "grid",
                      gridTemplateColumns: "clamp(72px, 18vw, 110px) 1fr",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    {/* Badge fecha */}
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
                      title={p.created_at}
                    >
                      {fmtDate(p.created_at)}
                    </div>

                    {/* Tile izquierdo */}
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
                      <div style={{ color: "rgba(255,255,255,.85)", fontWeight: 950, fontSize: 16 }}>
                        {initials(p.title)}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div
                      style={{
                        height: "100%",
                        display: "grid",
                        gridTemplateRows: "1fr auto",
                        alignItems: "center",
                        textAlign: "center",
                        paddingRight: 18, // espacio para badge fecha
                      }}
                    >
                      {/* Título */}
                      <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
                        {isEditing ? (
                          <input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            autoFocus
                            style={{ width: "100%" }}
                          />
                        ) : (
                          <div
                            style={{
                              fontSize: "clamp(16px, 4.5vw, 24px)",
                              fontWeight: 950,
                              color: "white",
                              lineHeight: 1.05,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                            }}
                          >
                            {p.title}
                          </div>
                        )}

                        {/* CTA */}
                        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800, whiteSpace: "nowrap" }}>
                          Tocá para abrir
                        </div>
                      </div>

                      {/* Botonera */}
                      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                        <Link to={`/programs/${p.id}`} style={{ textDecoration: "none" }}>
                          <Btn type="button" variant="primary">
                            Abrir
                          </Btn>
                        </Link>

                        {isEditing ? (
                          <>
                            <Btn type="button" onClick={() => saveEdit(p.id)} variant="primary">
                              Guardar
                            </Btn>
                            <Btn type="button" onClick={cancelEdit}>
                              Cancelar
                            </Btn>
                          </>
                        ) : (
                          <>
                            <Btn type="button" onClick={() => startEdit(p)}>
                              Editar
                            </Btn>
                            <Btn type="button" onClick={() => deleteProgram(p.id)} variant="danger">
                              Eliminar
                            </Btn>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
