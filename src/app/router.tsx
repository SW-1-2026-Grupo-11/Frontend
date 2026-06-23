import { createRouter, createRootRoute, createRoute, redirect } from "@tanstack/react-router";
import { AUTH_TOKEN_KEY } from "@/config/constants";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import UsuariosPage from "@/pages/UsuariosPage";
import PruebasPage from "@/pages/PruebasPage";
import PruebaEditorPage from "@/pages/PruebaEditorPage";
import EntrevistasPage from "@/pages/EntrevistasPage";
import ReportesPage from "@/pages/ReportesPage";
import SesionesPage from "@/pages/SesionesPage";
import SesionNuevaPage from "@/pages/SesionNuevaPage";
import JoinPage from "@/pages/JoinPage";
import SalaPage from "@/pages/SalaPage";
import SesionDetallePage from "@/pages/SesionDetallePage";

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

const pruebaNuevaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pruebas/nueva",
  beforeLoad: requireAuth,
  component: PruebaEditorPage,
});

const pruebaEditarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pruebas/$pruebaId/editar",
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => ({
    step: search.step ? Number(search.step) : undefined,
  }),
  component: PruebaEditorPage,
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

const reportesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reportes",
  beforeLoad: requireAuth,
  component: ReportesPage,
});

const sesionesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sesiones",
  beforeLoad: requireAuth,
  component: SesionesPage,
});

const sesionNuevaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sesiones/nueva",
  beforeLoad: requireAuth,
  component: SesionNuevaPage,
});

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join",
  validateSearch: (search: Record<string, unknown>) => ({
    token: String(search.token ?? ""),
  }),
  component: JoinPage,
});

const sesionSalaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sesiones/$sesionId/sala",
  beforeLoad: requireAuth,
  component: SalaPage,
});

const sesionDetalleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sesiones/$sesionId/detalle",
  beforeLoad: requireAuth,
  component: SesionDetallePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  supervisionRoute,
  usuariosRoute,
  pruebasRoute,
  pruebaNuevaRoute,
  pruebaEditarRoute,
  entrevistasRoute,
  reportesRoute,
  sesionesRoute,
  sesionNuevaRoute,
  joinRoute,
  sesionSalaRoute,
  sesionDetalleRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
