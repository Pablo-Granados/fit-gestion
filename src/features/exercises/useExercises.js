import { useEffect, useMemo, useState } from "react";
import { fetchExercises } from "./exercisesApi";
import { groupLabel, groupOrder } from "./exerciseGroups";

export function useExercises({ query = "" } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchExercises();
        if (!alive) return;
        setRows(data);
        setErrorMsg("");
      } catch (e) {
        if (!alive) return;
        setRows([]);
        setErrorMsg(e?.message ?? "Error cargando ejercicios");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const blob = `${r.name} ${r.primary_muscle ?? ""} ${r.equipment ?? ""} ${r.category ?? ""}`.toLowerCase();
      return blob.includes(s);
    });
  }, [query, rows]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const ex of filtered) {
      const label = groupLabel(ex.primary_muscle);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(ex);
    }

    return Array.from(map.entries()).sort(
      (a, b) => groupOrder(a[0]) - groupOrder(b[0]) || a[0].localeCompare(b[0])
    );
  }, [filtered]);

  return { rows, filtered, grouped, loading, errorMsg };
}
