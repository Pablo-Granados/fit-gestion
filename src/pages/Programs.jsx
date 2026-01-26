import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";

export default function Programs() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [title, setTitle] = useState("");

  // edición inline
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
    if (!userId) return;

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

    const { error } = await supabase
      .from("programs")
      .update({ title: t })
      .eq("id", programId);

    if (error) return alert(error.message);

    cancelEdit();
    load();
  }

  async function deleteProgram(programId) {
    const ok = confirm(
      "¿Eliminar rutina? Se borrarán también sus días y ejercicios."
    );
    if (!ok) return;

    const { error } = await supabase.from("programs").delete().eq("id", programId);
    if (error) return alert(error.message);

    load();
  }

  return (
    <Layout title="Rutinas">
      <form
        onSubmit={createProgram}
        style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
      >
        <input
          placeholder="Nueva rutina (ej: Full body 3 días)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 10, minWidth: 280 }}
        />
        <button type="submit">Crear</button>
        <button type="button" onClick={load}>Refrescar</button>
      </form>

      {loading ? (
        <p>Cargando...</p>
      ) : programs.length === 0 ? (
        <p style={{ marginTop: 16 }}>No tenés rutinas todavía.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {programs.map((p) => (
            <div
              key={p.id}
              style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  {editingId === p.id ? (
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      style={{ padding: 8, width: "100%", maxWidth: 420 }}
                      autoFocus
                    />
                  ) : (
                    <strong>{p.title}</strong>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Link to={`/programs/${p.id}`} style={{ textDecoration: "underline", padding: "6px 8px" }}>
                    Abrir
                  </Link>

                  {editingId === p.id ? (
                    <>
                      <button onClick={() => saveEdit(p.id)}>Guardar</button>
                      <button type="button" onClick={cancelEdit}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEdit(p)}>Editar</button>
                      <button type="button" onClick={() => deleteProgram(p.id)}>Eliminar</button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                {new Date(p.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
