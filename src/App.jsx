import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Exercises from "./pages/Exercises";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Workouts from "./pages/Workouts";
import Progress from "./pages/Progress";
import RequireAuth from "./components/RequireAuth";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:id" element={<ProgramDetail />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/progress" element={<Progress />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/exercises" replace />} />
    </Routes>
  );
}
