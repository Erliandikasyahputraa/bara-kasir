import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/sync"; // Jalankan mesin sinkronisasi

createRoot(document.getElementById("root")!).render(<App />);
