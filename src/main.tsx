import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/sync"; // Jalankan mesin sinkronisasi
import { registerSW } from "virtual:pwa-register";

// Mendaftarkan service worker untuk mengaktifkan PWA secara otomatis
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);
