import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import ExercisePicker from "../features/exercises/ExercisePicker";

/* =======================
   Helpers
======================= */

function safeNum(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function patchItemInState(setItemsByDay, dayId, itemId, patch) {
  setItemsByDay((prev) => {
    const next = { ...prev };
    const list = [...(next[dayId] ?? [])];
    const idx = list.findIndex((x) => x.id === itemId);
    if (idx === -1) return prev;
    list[idx] = { ...list[idx], ...patch };
    next[dayId] = list;
    return next;
  });
}

function removeItemFromState(setItemsByDay, dayId, itemId) {
  setItemsByDay((prev) => {
    const next = { ...prev };
    next[dayId] = (next[dayId] ?? []).filter((x) => x.id !== itemId);
    next[dayId] = (next[dayId] ?? []).map((x, i) => ({ ...x, sort_order: i + 1 }));
    return next;
  });
}

/* =======================
   Confirm Modal
======================= */

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          borderRadius: 18,
          border: "1px solid var(--stroke)",
          background: "rgba(18,24,35,.95)",
          boxShadow: "var(--shadow)",
          padding: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 950, fontSize: 16, color: "white" }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.35 }}>{message}</div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid var(--stroke)",
              color: "white",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 900,
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: "rgba(255,122,24,.18)",
              border: "1px solid rgba(255,122,24,.35)",
              color: "white",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 950,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   Page
======================= */

export default function ProgramDetail() {
  const { id: programId } = useParams();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);

  const [days, setDays] = useState([]);
  const [itemsByDay, setItemsByDay] = useState({});

  const [newDayTitle, setNewDayTitle] = useState("Día A");
  const [selectedDayId, setSelectedDayId] = useState("");

  // ✅ modal confirm (ACÁ adentro del componente)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);

  // inline edit
  const [editingItemId, setEditingItemId] = useState(null);
  const [draft, setDraft] = useState({
    series: 3,
    repeticiones: "8-12",
    descanso: 90,
    kg: "",
    notes: "",
  });

  async function loadAll() {
    setLoading(true);

    // 1) programa
    const pRes = await supabase.from("programs").select("id,title,notes").eq("id", programId).single();
    if (pRes.error) {
      console.error(pRes.error);
      setProgram(null);
      setLoading(false);
      return;
    }
    setProgram(pRes.data);

    // 2) días
    const dRes = await supabase
      .from("program_days")
      .select("id,day_index,title,notes,program_id")
      .eq("program_id", programId)
      .order("day_index", { ascending: true });

    if (dRes.error) {
      console.error(dRes.error);
      setDays([]);
      setItemsByDay({});
      setLoading(false);
      return;
    }

    const d = dRes.data ?? [];
    setDays(d);
    if (d.length > 0) setSelectedDayId((prev) => prev || d[0].id);

    // 3) items con JOIN
    const dayIds = d.map((x) => x.id);
    if (dayIds.length === 0) {
      setItemsByDay({});
      setLoading(false);
      return;
    }

    const iRes = await supabase
      .from("program_day_items")
      .select(
        `
        id,
        program_day_id,
        exercise_id,
        sort_order,
        prescription,
        kg,
        notes,
        done,
        done_at,
        exercises:exercise_id (
          id,
          name,
          media_url,
          description,
          primary_muscle,
          equipment,
          category
        )
      `
      )
      .in("program_day_id", dayIds)
      .order("sort_order", { ascending: true });

    if (iRes.error) {
      console.error(iRes.error);
      setItemsByDay({});
      setLoading(false);
      return;
    }

    const map = {};
    for (const it of iRes.data ?? []) {
      if (!map[it.program_day_id]) map[it.program_day_id] = [];
      map[it.program_day_id].push(it);
    }
    setItemsByDay(map);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  async function createDay(e) {
    e.preventDefault();
    const title = newDayTitle.trim();
    if (!title) return;

    const nextIndex = (days?.length ?? 0) + 1;

    const { data, error } = await supabase
      .from("program_days")
      .insert({
        program_id: programId,
        day_index: nextIndex,
        title,
      })
      .select("id,day_index,title,notes,program_id")
      .single();

    if (error) return alert(error.message);

    setDays((prev) => [...prev, data]);
    setSelectedDayId(data.id);
    setNewDayTitle(`Día ${String.fromCharCode(65 + nextIndex)}`);
  }

  // ✅ Agregar ejercicio sin reload total
  async function addExerciseToDay(exOrId) {
    if (!selectedDayId) return alert("Primero elegí un día.");

    const exerciseId = typeof exOrId === "object" ? exOrId.id : exOrId;
    if (!exerciseId) return alert("No pude obtener el ID del ejercicio.");

    const existing = itemsByDay[selectedDayId] ?? [];
    const nextSort = existing.length + 1;

    const { data, error } = await supabase
      .from("program_day_items")
      .insert({
        program_day_id: selectedDayId,
        exercise_id: exerciseId,
        sort_order: nextSort,
        prescription: { series: 3, repeticiones: "8-12", descanso: 90 },
        kg: null,
        notes: null,
        done: false,
        done_at: null,
      })
      .select(
        `
        id,
        program_day_id,
        exercise_id,
        sort_order,
        prescription,
        kg,
        notes,
        done,
        done_at,
        exercises:exercise_id (
          id,
          name,
          media_url,
          description,
          primary_muscle,
          equipment,
          category
        )
      `
      )
      .single();

    if (error) return alert(error.message);

    setItemsByDay((prev) => ({
      ...prev,
      [selectedDayId]: [...(prev[selectedDayId] ?? []), data],
    }));
  }

  // ✅ modal quitar
  function requestRemove(itemId) {
    setPendingRemoveId(itemId);
    setConfirmOpen(true);
  }

  async function confirmRemove() {
    if (!selectedDayId || !pendingRemoveId) return;

    const itemId = pendingRemoveId;
    const backup = itemsByDay[selectedDayId] ?? [];

    // optimista
    removeItemFromState(setItemsByDay, selectedDayId, itemId);

    setConfirmOpen(false);
    setPendingRemoveId(null);

    const { error } = await supabase.from("program_day_items").delete().eq("id", itemId);
    if (error) {
      setItemsByDay((prev) => ({ ...prev, [selectedDayId]: backup }));
      return alert(error.message);
    }
  }

  function startEdit(it) {
    setEditingItemId(it.id);
    const p = it.prescription ?? {};
    setDraft({
      series: p.series ?? 3,
      repeticiones: p.repeticiones ?? "8-12",
      descanso: p.descanso ?? 90,
      kg: it.kg ?? "",
      notes: it.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditingItemId(null);
  }

  async function saveEdit(it) {
    const nextPrescription = {
      series: safeNum(draft.series) ?? 0,
      repeticiones: String(draft.repeticiones ?? ""),
      descanso: safeNum(draft.descanso) ?? 0,
    };

    const patch = {
      prescription: nextPrescription,
      kg: safeNum(draft.kg),
      notes: (draft.notes ?? "").trim() || null,
    };

    // optimista
    patchItemInState(setItemsByDay, it.program_day_id, it.id, patch);
    setEditingItemId(null);

    const { error } = await supabase.from("program_day_items").update(patch).eq("id", it.id);

    if (error) {
      alert(error.message);
      await loadAll();
    }
  }

  async function toggleDone(it) {
    const nextDone = !it.done;
    const nextDoneAt = nextDone ? new Date().toISOString() : null;

    patchItemInState(setItemsByDay, it.program_day_id, it.id, { done: nextDone, done_at: nextDoneAt });

    const { error } = await supabase.from("program_day_items").update({ done: nextDone, done_at: nextDoneAt }).eq("id", it.id);

    if (error) {
      alert(error.message);
      patchItemInState(setItemsByDay, it.program_day_id, it.id, { done: it.done, done_at: it.done_at ?? null });
    }
  }

  // ✅ excluir ejercicios ya agregados
  const excludeIds = useMemo(() => {
    if (!selectedDayId) return [];
    return (itemsByDay[selectedDayId] ?? []).map((it) => it.exercise_id);
  }, [itemsByDay, selectedDayId]);

  if (loading) {
    return (
      <Layout title="Rutina">
        <p>Cargando...</p>
      </Layout>
    );
  }

  if (!program) {
    return (
      <Layout title="Rutina">
        <p>No se encontró la rutina.</p>
      </Layout>
    );
  }

  const dayItems = itemsByDay[selectedDayId] ?? [];

  return (
    <Layout title={`Rutina: ${program.title}`}>
      {/* ✅ Responsive mobile-first rápido */}
      <style>{`
        .pd-items { display: grid; gap: 10px; margin-top: 12px; }
        .pd-item {
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 12px;
          display: grid;
          gap: 12px;
          position: relative;
        }
        .pd-media {
          width: 100%;
          height: 170px;
          border-radius: 12px;
          overflow: hidden;
          background: #f5f5f5;
        }
        .pd-media img { width: 100%; height: 100%; object-fit: cover; }

        @media (min-width: 640px) {
          .pd-item { grid-template-columns: 110px 1fr; align-items: start; }
          .pd-media { width: 110px; height: 90px; border-radius: 10px; }
        }

        .pd-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
        .pd-grid2 { display:grid; gap:10px; grid-template-columns:1fr; }
        @media (min-width: 640px) { .pd-grid2 { grid-template-columns: repeat(2, minmax(0,1fr)); } }
      `}</style>

      <div style={{ display: "grid", gap: 16 }}>
        {/* Días */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <strong>Días</strong>

          <form onSubmit={createDay} style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <input
              value={newDayTitle}
              onChange={(e) => setNewDayTitle(e.target.value)}
              placeholder="Título del día (ej: Día A / Piernas)"
              style={{ padding: 10, minWidth: 260 }}
            />
            <button type="submit">Agregar día</button>
          </form>

          {days.length === 0 ? (
            <p style={{ marginTop: 12 }}>Todavía no hay días. Creá el primero.</p>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDayId(d.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: selectedDayId === d.id ? "#eee" : "white",
                    cursor: "pointer",
                  }}
                >
                  {d.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Picker */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <strong>Agregar ejercicios al día</strong>
          <div style={{ marginTop: 12 }}>
            <ExercisePicker title="Agregar ejercicios" excludeIds={excludeIds} onPick={addExerciseToDay} />
          </div>
        </div>

        {/* Lista del día */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <strong>Ejercicios del día</strong>

          {!selectedDayId ? (
            <p style={{ marginTop: 12 }}>Elegí un día.</p>
          ) : dayItems.length === 0 ? (
            <p style={{ marginTop: 12 }}>Este día todavía no tiene ejercicios.</p>
          ) : (
            <div className="pd-items">
              {dayItems.map((it) => {
                const ex = it.exercises;
                const p = it.prescription ?? {};
                const isEditing = editingItemId === it.id;

return (
  <div key={it.id} className="pd-item" style={{ opacity: it.done ? 0.7 : 1 }}>
    {/* media */}
    <div className="pd-media">
      {ex?.media_url ? (
        <img src={ex.media_url} alt={ex?.name ?? "Ejercicio"} />
      ) : (
        <div style={{ padding: 8, fontSize: 12, opacity: 0.7 }}>Sin media</div>
      )}
    </div>

    {/* info */}
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 950,
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ opacity: 0.7 }}>#{it.sort_order}</span>

            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
              title={ex?.name ?? `Ejercicio ${it.exercise_id}`}
            >
              {ex?.name ?? `Ejercicio ${it.exercise_id}`}
            </span>

            {/* ✅ Badge finalizado (solo si done) */}
            {it.done && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  padding: "4px 8px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid var(--stroke)",
                  color: "rgba(255,255,255,.85)",
                }}
              >
                ✅ Ejercicio finalizado
              </span>
            )}
          </div>

          {/* ✅ Solo mostramos metadata si NO está finalizado */}
          {!it.done && (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {ex?.primary_muscle ?? "—"} • {ex?.equipment ?? "—"} • {ex?.category ?? "—"}
            </div>
          )}
        </div>

        {/* ✅ Acciones */}
        <div className="pd-actions">
          {/* Si está finalizado: "Editar" revierte el estado */}
          <button type="button" onClick={() => toggleDone(it)}>
            {it.done ? "Editar" : "Finalizado"}
          </button>

          <button type="button" onClick={() => requestRemove(it.id)}>
            Quitar
          </button>
        </div>
      </div>

      {/* ✅ Si está finalizado: ocultamos TODO el resto */}
      {it.done ? null : (
        <>
          {ex?.description ? (
            <div style={{ fontSize: 13, opacity: 0.9 }}>{ex.description}</div>
          ) : null}

          {/* Inline edit panel */}
          {isEditing ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div className="pd-grid2">
                <label style={{ display: "grid", gap: 6, fontSize: 12, opacity: 0.85 }}>
                  Series
                  <input
                    value={draft.series}
                    onChange={(e) => setDraft((d) => ({ ...d, series: e.target.value }))}
                    style={{ padding: 10 }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6, fontSize: 12, opacity: 0.85 }}>
                  Repeticiones
                  <input
                    value={draft.repeticiones}
                    onChange={(e) => setDraft((d) => ({ ...d, repeticiones: e.target.value }))}
                    style={{ padding: 10 }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6, fontSize: 12, opacity: 0.85 }}>
                  Descanso (seg)
                  <input
                    value={draft.descanso}
                    onChange={(e) => setDraft((d) => ({ ...d, descanso: e.target.value }))}
                    style={{ padding: 10 }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6, fontSize: 12, opacity: 0.85 }}>
                  KG
                  <input
                    value={draft.kg}
                    onChange={(e) => setDraft((d) => ({ ...d, kg: e.target.value }))}
                    style={{ padding: 10 }}
                  />
                </label>
              </div>

              <label style={{ display: "grid", gap: 6, fontSize: 12, opacity: 0.85 }}>
                Notas
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  style={{ padding: 10, minHeight: 70, resize: "vertical" }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={cancelEdit}>
                  Cancelar
                </button>
                <button type="button" onClick={() => saveEdit(it)} style={{ fontWeight: 900 }}>
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                <strong>Series:</strong> {p.series ?? "—"} •{" "}
                <strong>Repeticiones:</strong> {p.repeticiones ?? "—"} •{" "}
                <strong>Descanso:</strong> {p.descanso ?? "—"}s •{" "}
                <strong>KG:</strong> {it.kg ?? "—"}
              </div>

              {it.notes ? (
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  <strong>Notas:</strong> {it.notes}
                </div>
              ) : null}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => startEdit(it)}>
                  Editar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
              })}
            </div>
          )}
        </div>
      </div>

      {/* ✅ El modal va acá, al final del return */}
      <ConfirmModal
        open={confirmOpen}
        title="Quitar ejercicio"
        message="¿Estás seguro que desea quitar el ejercicio de la rutina?"
        confirmText="Sí, quitar"
        cancelText="Cancelar"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingRemoveId(null);
        }}
        onConfirm={confirmRemove}
      />
    </Layout>
  );
}
