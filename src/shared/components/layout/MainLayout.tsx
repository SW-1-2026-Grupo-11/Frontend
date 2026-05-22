import { Link } from "@tanstack/react-router";
import { UI } from "@/config/constants";

type NavItem = {
  label: string;
  to: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: UI.NAV_DASHBOARD, to: "/dashboard", icon: "📊" },
  { label: UI.NAV_SUPERVISION, to: "/supervision", icon: "📡" },
  { label: UI.NAV_USUARIOS, to: "/usuarios", icon: "👥" },
  { label: UI.NAV_PRUEBAS, to: "/pruebas", icon: "📝" },
  { label: UI.NAV_ENTREVISTAS, to: "/entrevistas", icon: "🗓️" },
  { label: "Reportes IA", to: "/reportes", icon: "🤖" },
];

type MainLayoutProps = {
  children: React.ReactNode;
  userName?: string;
  onLogout?: () => void;
};

export default function MainLayout({ children, userName = "Usuario", onLogout }: MainLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          flexShrink: 0,
          backgroundColor: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-lg) 0",
        }}
      >
        <div
          style={{
            padding: "0 var(--space-lg) var(--space-lg)",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "var(--space-md)",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-lg)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-primary)",
            }}
          >
            Proctoring
          </span>
        </div>

        <nav
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm) var(--space-lg)",
                fontSize: "var(--font-size-base)",
                textDecoration: "none",
                transition: "background-color var(--transition-fast), color var(--transition-fast)",
              }}
              activeProps={{
                style: {
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-surface-hover)",
                  borderRight: "2px solid var(--color-primary)",
                },
              }}
              inactiveProps={{
                style: {
                  color: "var(--color-text-muted)",
                  backgroundColor: "transparent",
                  borderRight: "2px solid transparent",
                },
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            height: "var(--header-height)",
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 var(--space-xl)",
            gap: "var(--space-md)",
            flexShrink: 0,
          }}
        >
          <span
            style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}
          >
            {userName}
          </span>
          <button
            onClick={onLogout}
            style={{
              background: "none",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-sm)",
              padding: "var(--space-xs) var(--space-sm)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "color var(--transition-fast), border-color var(--transition-fast)",
            }}
          >
            Cerrar sesión
          </button>
        </header>

        <main
          style={{
            flex: 1,
            padding: "var(--space-xl)",
            overflow: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
