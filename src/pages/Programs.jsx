import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/* =======================
   Utils
======================= */

function initials(label) {
  const t = (label ?? "").trim();
  if (!t) return "--";
  const parts = t.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? t[0] ?? "-";
  const b = parts[1]?.[0] ?? (t.length > 1 ? t[1] : "");
  return (a + b).toUpperCase();
}

/* =======================
   Page
======================= */

export default function Programs() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);

  // crear
  const [title, setTitle] = useState("");

  // editar modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

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
    if (!userId) return;

    const { error } = await supabase.from("programs").insert({
      user_id: userId,
      title: t,
    });

    if (error) return alert(error.message);

    setTitle("");
    load();
  }

  function openEdit(p) {
    setEditId(p.id);
    setEditTitle(p.title ?? "");
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditId(null);
    setEditTitle("");
  }

  async function saveEdit() {
    const t = editTitle.trim();
    if (!t) return alert("El nombre no puede quedar vacío.");

    const { error } = await supabase.from("programs").update({ title: t }).eq("id", editId);
    if (error) return alert(error.message);

    closeEdit();
    load();
  }

  async function deleteProgram(programId) {
    const ok = confirm("¿Eliminar rutina? Se borrarán también sus días y ejercicios.");
    if (!ok) return;

    const { error } = await supabase.from("programs").delete().eq("id", programId);
    if (error) return alert(error.message);

    load();
  }

  const list = useMemo(() => programs, [programs]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px 120px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950 }}>Rutinas</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Creá y administrá tus rutinas</div>
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

      {/* Crear */}
      <form
        onSubmit={createProgram}
        style={{
          marginTop: 16,
          background: "rgba(18,24,35,.65)",
          border: "1px solid var(--stroke)",
          borderRadius: 18,
          padding: 12,
          boxShadow: "var(--shadow)",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          placeholder='Nueva rutina (ej: "Full body")'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: "1 1 240px", minWidth: 220 }}
        />
        <button type="submit" style={{ fontWeight: 900 }}>
          Crear
        </button>
        <button type="button" onClick={load} style={{ fontWeight: 900 }}>
          Refrescar
        </button>
      </form>

      {/* Grid */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ color: "var(--muted)" }}>Cargando rutinas…</div>
        ) : list.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No tenés rutinas todavía.</div>
        ) : (
          <>
            <style>{`
              /* Mobile: SI O SI 2 columnas */
              .program-grid {
                display: grid;
                gap: 12px;
                grid-template-columns: repeat(1, minmax(0, 1fr));
              }
              /* Desktop: agrega columnas, no estira infinito */
              @media (min-width: 900px) {
                .program-grid {
                  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                }
              }
            `}</style>

            <div className="program-grid">
              {list.map((p) => {
                const label = p.title ?? "Sin título";
                const badge = initials(label);

                return (
                  <div
                    key={p.id}
                    style={{
                      position: "relative",
                      borderRadius: 18,
                      border: "1px solid var(--stroke)",
                      background: "rgba(18,24,35,.65)",
                      boxShadow: "var(--shadow)",
                      padding: 14,
                      minHeight: 150,
                      display: "grid",
                      gridTemplateRows: "auto 1fr auto",
                      gap: 10,
                      textAlign: "left",
                    }}
                  >
                    {/* TOP ROW: icon + contador */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {/* iconito badge (igual a Exercises) */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 14,
                          background: "rgba(255,122,24,.16)",
                          border: "1px solid rgba(255,122,24,.25)",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 950,
                          color: "rgba(255,255,255,.9)",
                        }}
                      >
                        {badge}
                      </div>

                      {/* contador arriba derecha (podés mostrar días más adelante; por ahora usamos “—”) */}
                      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>—</div>
                    </div>

                    {/* Título */}
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
                        title={label}
                      >
                        {label}
                      </div>

                    </div>

                    {/* Acciones */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => nav(`/programs/${p.id}`)}
                        style={{
                          color: "whitesmoke",
                          fontWeight: 900,
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "rgba(0, 173, 43, 0.71)",
                          border: "1px solid rgba(255,122,24,.28)",
                        }}
                      >
                        Abrir
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        style={{
                          color: "whitesmoke",
                          fontWeight: 900,
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "rgba(3, 0, 201, 0.49)",
                          border: "1px solid var(--stroke)",
                        }}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProgram(p.id)}
                        style={{                          fontWeight: 900,
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "rgba(255, 76, 76, 0.85)",
                          border: "1px solid rgba(255, 105, 105, 0.88)",
                          color: "rgba(255,255,255,.92)",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal editar */}
      {editOpen && (
        <div
          onClick={closeEdit}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(6px)",
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            padding: 14,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              borderRadius: 22,
              border: "1px solid var(--stroke)",
              background: "rgba(18,24,35,.92)",
              boxShadow: "var(--shadow)",
              padding: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 950 }}>Editar rutina</div>

              <button
                type="button"
                onClick={closeEdit}
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

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Nombre de la rutina"
                autoFocus
                style={{ width: "100%" }}
              />

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={closeEdit}
                  style={{
                    fontWeight: 900,
                    borderRadius: 14,
                    padding: "10px 14px",
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid var(--stroke)",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={!editTitle.trim()}
                  style={{
                    fontWeight: 900,
                    borderRadius: 14,
                    padding: "10px 14px",
                    background: !editTitle.trim() ? "rgba(255,122,24,.06)" : "rgba(255,122,24,.18)",
                    border: "1px solid rgba(255,122,24,.30)",
                    opacity: !editTitle.trim() ? 0.6 : 1,
                    cursor: !editTitle.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

