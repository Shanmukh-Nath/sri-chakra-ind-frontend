import { Navigate } from "react-router-dom";

/** Legacy route: create coils moved to Direct Stock In; /coils is view-only. */
export default function Coils() {
  return <Navigate to="/coils" replace />;
}
