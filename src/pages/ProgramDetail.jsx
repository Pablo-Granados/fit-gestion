import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import FitCard from "../components/FitCard";
import { supabase } from "../lib/supabase";


function groupLabel(muscle) {
    const m = (muscle ?? "").toString().toLowerCase();

    if (m.includes("pecho")) return "Pecho";
    if (m.includes("espalda")) return "Espalda";
    if (m.includes("homb")) return "Hombros";
    if (m.includes("bíceps") || m.includes("biceps")) return "Bíceps";
    if (m.includes("tríceps") || m.includes("triceps")) return "Tríceps";
    if (m.includes("core")) return "Core";

    if (m.includes("cuádr") || m.includes("cuadr")) return "Cuádriceps";
    if (m.includes("isqu")) return "Isquios";
    if (m.includes("glút") || m.includes("glut")) return "Glúteos";
    if (m.includes("gemel")) return "Gemelos";
    if (m.includes("aductor")) return "Aductores";

    if (m.includes("pierna")) return "Piernas";

    return muscle ? muscle : "Otros";
}

const GROUP_META = {
    Pecho: { emoji: "🫁" },
    Espalda: { emoji: "🧱" },
    Hombros: { emoji: "🧩" },
    Bíceps: { emoji: "💪" },
    Tríceps: { emoji: "🔧" },
    Core: { emoji: "⚡" },
    Cuádriceps: { emoji: "🦵" },
    Isquios: { emoji: "🏃" },
    Glúteos: { emoji: "🍑" },
    Gemelos: { emoji: "🦶" },
    Aductores: { emoji: "🧲" },
    Piernas: { emoji: "🦿" },
    Otros: { emoji: "📦" },
};

function groupOrder(label) {
    const order = [
        "Pecho",
        "Espalda",
        "Hombros",
        "Bíceps",
        "Tríceps",
        "Core",
        "Cuádriceps",
        "Isquios",
        "Glúteos",
        "Gemelos",
        "Aductores",
        "Piernas",
        "Otros",
    ];
    const i = order.indexOf(label);
    return i === -1 ? 999 : i;
}

export default function ProgramDetail() {
    const { id: programId } = useParams();

    const [loading, setLoading] = useState(true);
    const [program, setProgram] = useState(null);

    const [days, setDays] = useState([]);
    const [itemsByDay, setItemsByDay] = useState({});
    const [selectedDayId, setSelectedDayId] = useState("");

    const [newDayTitle, setNewDayTitle] = useState("Día A");

    // buscador
    const [exerciseQuery, setExerciseQuery] = useState("");
    const [allExercises, setAllExercises] = useState([]);

    // panel grupos
    const [openGroup, setOpenGroup] = useState(null);

    // expand cards dentro del panel
    const [expandedId, setExpandedId] = useState(null);

    // edición prescripción (Paso 12)
    const [draftByItemId, setDraftByItemId] = useState({});
    const [savingItemId, setSavingItemId] = useState(null);

    async function loadAll() {
        setLoading(true);

        const pRes = await supabase
            .from("programs")
            .select("id,title")
            .eq("id", programId)
            .single();

        if (pRes.error) {
            console.error(pRes.error);
            setProgram(null);
            setLoading(false);
            return;
        }
        setProgram(pRes.data);

        const dRes = await supabase
            .from("program_days")
            .select("id,day_index,title")
            .eq("program_id", programId)
            .order("day_index", { ascending: true });

        const daysData = dRes.data ?? [];
        setDays(daysData);
        if (daysData.length > 0) setSelectedDayId(daysData[0].id);

        const eRes = await supabase
            .from("exercises")
            .select("id,name,primary_muscle,equipment,category,media_url,description")
            .order("name", { ascending: true });

        setAllExercises(eRes.data ?? []);

        if (daysData.length > 0) {
            const ids = daysData.map((d) => d.id);
            const iRes = await supabase
                .from("program_day_items")
                .select("id,program_day_id,exercise_id,sort_order,prescription")
                .in("program_day_id", ids)
                .order("sort_order", { ascending: true });

            const map = {};
            for (const it of iRes.data ?? []) {
                if (!map[it.program_day_id]) map[it.program_day_id] = [];
                map[it.program_day_id].push(it);
            }
            setItemsByDay(map);
        } else {
            setItemsByDay({});
        }

        setLoading(false);
    }

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [programId]);

    const exById = useMemo(() => {
        
        const map = new Map();
        for (const ex of allExercises) map.set(ex.id, ex);
        return map;
    }, [allExercises]);

    const selectedDayExerciseIds = useMemo(() => {
  const items = itemsByDay[selectedDayId] ?? [];
  return new Set(items.map((it) => it.exercise_id));
}, [itemsByDay, selectedDayId]);


    const filteredExercises = useMemo(() => {
        const s = exerciseQuery.trim().toLowerCase();
        const list = !s
            ? allExercises
            : allExercises.filter((ex) =>
                `${ex.name} ${ex.primary_muscle ?? ""} ${ex.equipment ?? ""} ${ex.category ?? ""}`
                    .toLowerCase()
                    .includes(s)
            );
        return list.slice(0, 400);
    }, [exerciseQuery, allExercises]);


    const grouped = useMemo(() => {
        const map = new Map();
        for (const ex of filteredExercises) {
            const label = groupLabel(ex.primary_muscle);
            if (!map.has(label)) map.set(label, []);
            map.get(label).push(ex);
        }
        const entries = Array.from(map.entries()).sort((a, b) => {
            return groupOrder(a[0]) - groupOrder(b[0]) || a[0].localeCompare(b[0]);
        });
        return entries;
    }, [filteredExercises]);

const openList = useMemo(() => {
  if (!openGroup) return [];
  const found = grouped.find(([label]) => label === openGroup);
  const list = found ? found[1] : [];
  // ✅ ocultar los que ya están en el día seleccionado
  return list.filter((ex) => !selectedDayExerciseIds.has(ex.id));
}, [openGroup, grouped, selectedDayExerciseIds]);


    async function createDay(e) {
        e.preventDefault();
        const title = newDayTitle.trim();
        if (!title) return;

        const nextIndex = days.length + 1;

        const { error } = await supabase.from("program_days").insert({
            program_id: programId,
            day_index: nextIndex,
            title,
        });

        if (error) return alert(error.message);

        setNewDayTitle(`Día ${String.fromCharCode(65 + nextIndex)}`);
        loadAll();
    }

async function addExerciseToDay(exerciseId) {
  if (!selectedDayId) return alert("Primero elegí un día.");

  // ✅ bloqueo extra (por si alguien intenta agregar igual)
  if (selectedDayExerciseIds.has(exerciseId)) return;

  const existing = itemsByDay[selectedDayId] ?? [];
  const nextSort = existing.length + 1;

  const { error } = await supabase.from("program_day_items").insert({
    program_day_id: selectedDayId,
    exercise_id: exerciseId,
    sort_order: nextSort,
    prescription: { sets: 3, reps: "8-12", rest: 90 },
  });

  if (error) return alert(error.message);

  // si querés, podés cerrar el modal al agregar:
  // setOpenGroup(null);

  loadAll();
}


    async function removeItem(itemId) {
        const { error } = await supabase.from("program_day_items").delete().eq("id", itemId);
        if (error) return alert(error.message);
        loadAll();
    }

    function getDraft(item) {
        const saved = item.prescription ?? {};
        const draft = draftByItemId[item.id];
        return {
            sets: draft?.sets ?? saved.sets ?? 3,
            reps: draft?.reps ?? saved.reps ?? "8-12",
            rest: draft?.rest ?? saved.rest ?? 90,
        };
    }

    function updateDraft(itemId, patch) {
        setDraftByItemId((prev) => ({
            ...prev,
            [itemId]: { ...(prev[itemId] ?? {}), ...patch },
        }));
    }

    async function savePrescription(item) {
        const draft = getDraft(item);

        const sets = Number(draft.sets);
        const rest = Number(draft.rest);
        const reps = String(draft.reps ?? "").trim();

        if (!Number.isFinite(sets) || sets <= 0) return alert("Sets inválidos");
        if (!reps) return alert("Reps inválidas");
        if (!Number.isFinite(rest) || rest < 0) return alert("Descanso inválido");

        setSavingItemId(item.id);

        const { error } = await supabase
            .from("program_day_items")
            .update({ prescription: { sets, reps, rest } })
            .eq("id", item.id);

        setSavingItemId(null);

        if (error) return alert(error.message);

        setDraftByItemId((prev) => {
            const copy = { ...prev };
            delete copy[item.id];
            return copy;
        });

        loadAll();
    }

    if (loading) {
        return (
            <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px" }}>
                <div style={{ color: "var(--muted)" }}>Cargando...</div>
            </div>
        );
    }

    if (!program) {
        return (
            <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px" }}>
                <div style={{ color: "var(--muted)" }}>No se encontró la rutina.</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 950 }}>{program.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        Armá días y agregá ejercicios
                    </div>
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
                    🗓️
                </div>
            </div>

            {/* DÍAS */}
            <div
                style={{
                    marginTop: 16,
                    background: "rgba(18,24,35,.65)",
                    border: "1px solid var(--stroke)",
                    borderRadius: 18,
                    padding: 12,
                    boxShadow: "var(--shadow)",
                }}
            >
                <div style={{ fontWeight: 950 }}>Días</div>

                <form onSubmit={createDay} style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <input
                        value={newDayTitle}
                        onChange={(e) => setNewDayTitle(e.target.value)}
                        placeholder="Título del día (ej: Día A / Piernas)"
                        style={{ width: "100%" }}
                    />
                    <button type="submit">+</button>
                </form>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {days.map((d) => (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedDayId(d.id)}
                            style={{
                                background: selectedDayId === d.id
                                    ? "linear-gradient(180deg,#ff9a3c,#ff7a18)"
                                    : "rgba(255,255,255,.06)",
                                border: "1px solid var(--stroke)",
                                color: selectedDayId === d.id ? "#111" : "var(--text)",
                                boxShadow: "none",
                                padding: "10px 12px",
                                borderRadius: 14,
                                fontWeight: 900,
                            }}
                        >
                            {d.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* AGREGAR EJERCICIOS */}
            <div style={{ marginTop: 14 }}>
                <div
                    style={{
                        background: "rgba(18,24,35,.65)",
                        border: "1px solid var(--stroke)",
                        borderRadius: 18,
                        padding: 12,
                        boxShadow: "var(--shadow)",
                    }}
                >
                    <div style={{ fontWeight: 950 }}>Agregar ejercicios</div>

                    <div style={{ marginTop: 10 }}>
                        <input
                            value={exerciseQuery}
                            onChange={(e) => setExerciseQuery(e.target.value)}
                            placeholder="Buscar ejercicio..."
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                        Día seleccionado: {days.find((d) => d.id === selectedDayId)?.title ?? "—"}
                    </div>
                </div>

                {/* Grid de grupos */}
                <div
                    style={{
                        marginTop: 12,
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 12,

                    }}
                >
                    {grouped.map(([label, list]) => {
                        const meta = GROUP_META[label] ?? { emoji: "🏷️" };

                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => {
                                    setOpenGroup(label);
                                    setExpandedId(null);
                                }}
                                style={{
                                    padding: 0,
                                    background: "transparent",
                                    boxShadow: "none",
                                    color: "white",

                                }}
                            >
                                <div
                                    style={{
                                        borderRadius: 18,
                                        border: "1px solid var(--stroke)",
                                        background: "rgba(18,24,35,.65)",
                                        boxShadow: "var(--shadow)",
                                        padding: 14,
                                        textAlign: "left",
                                        minHeight: 92,
                                        display: "grid",
                                        gap: 8,
                                        alignContent: "start",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 14,
                                                background: "rgba(255,122,24,.16)",
                                                border: "1px solid rgba(255,122,24,.25)",
                                                display: "grid",
                                                placeItems: "center",
                                                fontSize: 18,
                                            }}
                                        >
                                            {meta.emoji}
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>
                                            {list.length}
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: 950, fontSize: 15 }}>{label}</div>
                                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Tocá para ver</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* EJERCICIOS DEL DÍA (con prescripción editable) */}
            <div
                style={{
                    marginTop: 14,
                    background: "rgba(18,24,35,.65)",
                    border: "1px solid var(--stroke)",
                    borderRadius: 18,
                    padding: 12,
                    boxShadow: "var(--shadow)",
                }}
            >
                <div style={{ fontWeight: 950 }}>Ejercicios del día</div>

                {!selectedDayId ? (
                    <div style={{ marginTop: 10, color: "var(--muted)" }}>Elegí un día.</div>
                ) : (itemsByDay[selectedDayId] ?? []).length === 0 ? (
                    <div style={{ marginTop: 10, color: "var(--muted)" }}>Este día todavía no tiene ejercicios.</div>
                ) : (
                    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                        {(itemsByDay[selectedDayId] ?? []).map((it) => {
                            const ex = exById.get(it.exercise_id);
                            const d = getDraft(it);

                            return (
                                <div
                                    key={it.id}
                                    style={{
                                        borderRadius: 18,
                                        border: "1px solid var(--stroke)",
                                        background: "rgba(255,255,255,.03)",
                                        padding: 12,
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                                        <div>
                                            <div style={{ fontWeight: 950 }}>{ex?.name ?? "Ejercicio"}</div>
                                            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                                                {ex?.primary_muscle ?? "—"} • {ex?.equipment ?? "—"} • {ex?.category ?? "—"}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeItem(it.id)}
                                            style={{
                                                background: "rgba(255,255,255,.06)",
                                                border: "1px solid var(--stroke)",
                                                color: "var(--text)",
                                                boxShadow: "none",
                                                padding: "10px 12px",
                                                borderRadius: 14,
                                                fontWeight: 900,
                                            }}
                                        >
                                            Quitar
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                                        <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                                            Sets
                                            <input
                                                type="number"
                                                min={1}
                                                value={d.sets}
                                                onChange={(e) => updateDraft(it.id, { sets: e.target.value })}
                                                style={{ width: 90 }}
                                            />
                                        </label>

                                        <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                                            Reps
                                            <input
                                                value={d.reps}
                                                onChange={(e) => updateDraft(it.id, { reps: e.target.value })}
                                                placeholder="8-12"
                                                style={{ width: 120 }}
                                            />
                                        </label>

                                        <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                                            Descanso (seg)
                                            <input
                                                type="number"
                                                min={0}
                                                value={d.rest}
                                                onChange={(e) => updateDraft(it.id, { rest: e.target.value })}
                                                style={{ width: 140 }}
                                            />
                                        </label>

                                        <div style={{ display: "flex", alignItems: "end" }}>
                                            <button
                                                type="button"
                                                onClick={() => savePrescription(it)}
                                                disabled={savingItemId === it.id}
                                            >
                                                {savingItemId === it.id ? "Guardando..." : "Guardar"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* PANEL / MODAL del grupo (con + Agregar) */}
            {openGroup && (
                <div
                    onClick={() => setOpenGroup(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.55)",
                        backdropFilter: "blur(6px)",
                        zIndex: 80,
                        padding: 14,
                        display: "grid",
                        placeItems: "end center",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(520px, 100%)",
                            maxHeight: "86vh",
                            overflow: "auto",
                            borderRadius: 22,
                            border: "1px solid var(--stroke)",
                            background: "rgba(18,24,35,.92)",
                            boxShadow: "var(--shadow)",
                            padding: 14,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 950 }}>
                                    {(GROUP_META[openGroup]?.emoji ?? "🏷️")} {openGroup}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--muted)" }}>{openList.length} ejercicios</div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpenGroup(null)}
                                style={{
                                    background: "rgba(255,255,255,.06)",
                                    border: "1px solid var(--stroke)",
                                    color: "var(--text)",
                                    boxShadow: "none",
                                    padding: "10px 12px",
                                    borderRadius: 14,
                                    fontWeight: 900,
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                            Día seleccionado: {days.find((d) => d.id === selectedDayId)?.title ?? "—"}
                        </div>

                        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                            {openList.map((ex) => (
                                <div key={ex.id} style={{ position: "relative" }}>
                                    {/* Botón agregar flotante */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation(); // ✅ no cierra/abre la card
                                            addExerciseToDay(ex.id);
                                        }}
                                        style={{
                                            position: "absolute",
                                            right: 12,
                                            top: 12,
                                            zIndex: 2,
                                            padding: "10px 12px",
                                            borderRadius: 14,
                                            fontWeight: 950,
                                        }}
                                    >
                                        + Agregar
                                    </button>

                                    {/* Card del ejercicio (expandible) */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        {/* Importante: FitCard maneja su propio toggle con onToggle.
                        Para que el botón + no afecte, ya usamos stopPropagation arriba. */}
                                        <div>
                                            {/* wrapper para permitir click card sin que se cierre el modal */}
                                            <FitCard
                                                ex={ex}
                                                expanded={expandedId === ex.id}
                                                onToggle={() => setExpandedId((prev) => (prev === ex.id ? null : ex.id))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ height: 10 }} />
                    </div>
                </div>
            )}
        </div>
    );
}
