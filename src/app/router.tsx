import { createRouter, createRootRoute, createRoute, redirect } from "@tanstack/react-router";
import { AUTH_TOKEN_KEY } from "@/config/constants";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import UsuariosPage from "@/pages/UsuariosPage";
import PruebasPage from "@/pages/PruebasPage";
import EntrevistasPage from "@/pages/EntrevistasPage";
import SessionPage from "@/pages/SessionPage";
import ReportesPage from "@/pages/ReportesPage";

const rootRoute = createRootRoute();

function requireAuth() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) throw redirect({ to: "/login" });
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    throw redirect({ to: token ? "/dashboard" : "/login" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: requireAuth,
  component: DashboardPage,
});

const usuariosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/usuarios",
  beforeLoad: requireAuth,
  component: UsuariosPage,
});

const pruebasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pruebas",
  beforeLoad: requireAuth,
  component: PruebasPage,
});

const entrevistasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/entrevistas",
  beforeLoad: requireAuth,
  component: EntrevistasPage,
});

const supervisionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/supervision",
  beforeLoad: requireAuth,
  component: HomePage,
});

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/session/$sessionId",
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    entrevistaId: Number(search.entrevistaId ?? 0),
    participanteId: Number(search.participanteId ?? 1),
  }),
  component: SessionPage,
});

const reportesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reportes",
  beforeLoad: requireAuth,
  component: ReportesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  supervisionRoute,
  usuariosRoute,
  pruebasRoute,
  entrevistasRoute,
  sessionRoute,
  reportesRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
