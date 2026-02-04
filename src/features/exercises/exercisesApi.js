import { supabase } from "../../lib/supabase";

export async function fetchExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("id,name,primary_muscle,equipment,category,media_url,description")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
