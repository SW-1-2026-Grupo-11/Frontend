import axios from "axios";
import env from "@/config/env";

export const aiApi = axios.create({
  baseURL: env.AI_SERVICE_URL,
  headers: { "Content-Type": "application/json" },
});
