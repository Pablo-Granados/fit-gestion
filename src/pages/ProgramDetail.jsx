import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";

export default function ProgramDetail() {
    const { id: programId } = useParams();

    const [loading, setLoading] = useState(true);
    const [program, setProgram] = useState(null);

    const [days, setDays] = useState([]);
    const [itemsByDay, setItemsByDay] = useState({});

    const [newDayTitle, setNewDayTitle] = useState("Día A");

    const [exerciseQuery, setExerciseQuery] = useState("");
    const [allExercises, setAllExercises] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState("");

    const [draftByItemId, setDraftByItemId] = useState({});
    const [savingItemId, setSavingItemId] = useState(null);


    /* ================== LOAD ================== */
    async function loadAll() {
        setLoading(true);

        const pRes = await supabase
            .from("programs")
            .select("id,title")
            .eq("id", programId)
            .single();

        if (pRes.error) {
            console.error(pRes.error);
            setLoading(false);
            return;
        }
        setProgram(pRes.data);

        const dRes = await supabase
            .from("program_days")
            .select("id,day_index,title")
            .eq("program_id", programId)
            .order("day_index");

        const daysData = dRes.data ?? [];
        setDays(daysData);
        if (daysData.length > 0) setSelectedDayId(daysData[0].id);

        const eRes = await supabase
            .from("exercises")
            .select("id,name,primary_muscle,equipment,category")
            .order("name");

        setAllExercises(eRes.data ?? []);

        if (daysData.length > 0) {
            const ids = daysData.map((d) => d.id);
            const iRes = await supabase
                .from("program_day_items")
                .select("id,program_day_id,exercise_id,sort_order,prescription")
                .in("program_day_id", ids)
                .order("sort_order");

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

    /* ================== HELPERS ================== */
    function groupLabel(muscle) {
        const m = (muscle ?? "").toString().toLowerCase();
        if (m.includes("pecho")) return "Pecho";
        if (m.includes("espalda")) return "Espalda";
        if (m.includes("homb")) return "Hombros";
        if (m.includes("bíceps") || m.includes("biceps")) return "Bíceps";
        if (m.includes("tríceps") || m.includes("triceps")) return "Tríceps";
        if (m.includes("cuádr") || m.includes("cuadr")) return "Cuádriceps";
        if (m.includes("isqu")) return "Isquios";
        if (m.includes("glut")) return "Glúteos";
        if (m.includes("gemel")) return "Gemelos";
        if (m.includes("core")) return "Core";
        if (m.includes("piernas")) return "Piernas";
        return "Otros";
    }

    const filteredExercises = useMemo(() => {
        const q = exerciseQuery.trim().toLowerCase();
        const list = !q
            ? allExercises
            : allExercises.filter((ex) =>
                `${ex.name} ${ex.primary_muscle ?? ""} ${ex.equipment ?? ""}`
                    .toLowerCase()
                    .includes(q)
            );
        return list.slice(0, 200);
    }, [exerciseQuery, allExercises]);

    const groupedExercises = useMemo(() => {
        const map = new Map();
        for (const ex of filteredExercises) {
            const label = groupLabel(ex.primary_muscle);
            if (!map.has(label)) map.set(label, []);
            map.get(label).push(ex);
        }
        return Array.from(map.entries());
    }, [filteredExercises]);

    const exById = useMemo(() => {
        const map = new Map();
        for (const ex of allExercises) map.set(ex.id, ex);
        return map;
    }, [allExercises]);

    /* ================== ACTIONS ================== */
    async function createDay(e) {
        e.preventDefault();
        const title = newDayTitle.trim();
        if (!title) return;

        const nextIndex = days.length + 1;

        await supabase.from("program_days").insert({
            program_id: programId,
            day_index: nextIndex,
            title,
        });

        setNewDayTitle(`Día ${String.fromCharCode(65 + nextIndex)}`);
        loadAll();
    }

    async function addExerciseToDay(exerciseId) {
        if (!selectedDayId) return alert("Elegí un día");

        const current = itemsByDay[selectedDayId] ?? [];
        const nextSort = current.length + 1;

        await supabase.from("program_day_items").insert({
            program_day_id: selectedDayId,
            exercise_id: exerciseId,
            sort_order: nextSort,
            prescription: { sets: 3, reps: "8-12", rest: 90 },
        });

        loadAll();
    }

    async function removeItem(itemId) {
        await supabase.from("program_day_items").delete().eq("id", itemId);
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

        // sanitizar
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

        // limpiamos draft de ese item
        setDraftByItemId((prev) => {
            const copy = { ...prev };
            delete copy[item.id];
            return copy;
        });

        loadAll();
    }


    /* ================== RENDER ================== */
    if (loading) {
        return (
            <Layout title="Rutina">
                <p>Cargando...</p>
            </Layout>
        );
    }

    return (
        <Layout title={`Rutina: ${program?.title ?? ""}`}>
            <div style={{ display: "grid", gap: 16 }}>
                {/* DÍAS */}
                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                    <strong>Días</strong>

                    <form onSubmit={createDay} style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <input
                            value={newDayTitle}
                            onChange={(e) => setNewDayTitle(e.target.value)}
                            style={{ padding: 10, minWidth: 240 }}
                        />
                        <button type="submit">Agregar día</button>
                    </form>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                        {days.map((d) => (
                            <button
                                key={d.id}
                                onClick={() => setSelectedDayId(d.id)}
                                style={{
                                    padding: "8px 10px",
                                    borderRadius: 10,
                                    border: "1px solid #ddd",
                                    background: selectedDayId === d.id ? "#eee" : "white",
                                }}
                            >
                                {d.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AGREGAR EJERCICIOS */}
                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                    <strong>Agregar ejercicios</strong>

                    <input
                        value={exerciseQuery}
                        onChange={(e) => setExerciseQuery(e.target.value)}
                        placeholder="Buscar ejercicio..."
                        style={{ padding: 10, minWidth: 260, marginTop: 10 }}
                    />

                    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                        {groupedExercises.map(([label, list]) => (
                            <details key={label}>
                                <summary style={{ fontWeight: 800 }}>
                                    {label} ({list.length})
                                </summary>

                                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                                    {list.map((ex) => (
                                        <div
                                            key={ex.id}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                border: "1px solid #eee",
                                                padding: 10,
                                                borderRadius: 10,
                                            }}
                                        >
                                            <div>
                                                <strong>{ex.name}</strong>
                                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                                    {ex.primary_muscle ?? "—"} • {ex.equipment ?? "—"}
                                                </div>
                                            </div>
                                            <button onClick={() => addExerciseToDay(ex.id)}>+ Agregar</button>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>

                {/* EJERCICIOS DEL DÍA */}
                <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                    <strong>Ejercicios del día</strong>

                    {(itemsByDay[selectedDayId] ?? []).map((it) => {
                        const ex = exById.get(it.exercise_id);
                        const d = getDraft(it);

                        return (
                            <div
                                key={it.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    border: "1px solid #eee",
                                    padding: 10,
                                    borderRadius: 10,
                                    marginTop: 8,
                                    gap: 12,
                                    alignItems: "flex-start",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <strong>{ex?.name ?? "Ejercicio"}</strong>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                                        {ex?.primary_muscle ?? "—"} • {ex?.equipment ?? "—"}
                                    </div>

                                    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                                        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                                            Sets
                                            <input
                                                type="number"
                                                min={1}
                                                value={d.sets}
                                                onChange={(e) => updateDraft(it.id, { sets: e.target.value })}
                                                style={{ padding: 8, width: 90 }}
                                            />
                                        </label>

                                        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                                            Reps
                                            <input
                                                value={d.reps}
                                                onChange={(e) => updateDraft(it.id, { reps: e.target.value })}
                                                placeholder="8-12"
                                                style={{ padding: 8, width: 120 }}
                                            />
                                        </label>

                                        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
                                            Descanso (seg)
                                            <input
                                                type="number"
                                                min={0}
                                                value={d.rest}
                                                onChange={(e) => updateDraft(it.id, { rest: e.target.value })}
                                                style={{ padding: 8, width: 130 }}
                                            />
                                        </label>

                                        <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                                            <button
                                                type="button"
                                                onClick={() => savePrescription(it)}
                                                disabled={savingItemId === it.id}
                                            >
                                                {savingItemId === it.id ? "Guardando..." : "Guardar"}
                                            </button>

                                            <button type="button" onClick={() => removeItem(it.id)}>
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                </div>
            </div>
        </Layout>
    );
}
