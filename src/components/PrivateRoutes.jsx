import { Outlet } from "react-router-dom";
import RequireAuth from "./RequireAuth";

export default function PrivateRoutes() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}
