import axios from "axios";
import env from "@/config/env";

export const aiApi = axios.create({
  baseURL: env.AI_SERVICE_URL,
  headers: { "Content-Type": "application/json" },
  // Si el micro de IA no responde, cortamos a los 8s (el proctoring dispara cada 2s;
  // sin timeout las peticiones colgadas se acumularían).
  timeout: 8000,
});
