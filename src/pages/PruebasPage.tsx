import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { useCurrentUser, useLogout } from "@/features/auth";
import { PruebasTable, PruebaDetailModal } from "@/features/exams";
import type { Prueba, TipoPrueba } from "@/features/exams";
import { UI, PRUEBAS } from "@/config/constants";

const filterSelectStyle: React.CSSProperties = {
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-sm) var(--space-md)",
  fontSize: "var(--font-size-sm)",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
};

export default function PruebasPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  const [tipoFilter, setTipoFilter] = useState<TipoPrueba | null>(null);
  const [detailPrueba, setDetailPrueba] = useState<Prueba | undefined>(undefined);

  const handleOpenCreate = () => {
    void navigate({ to: "/pruebas/nueva" as never });
  };

  const handleEdit = (prueba: Prueba) => {
    void navigate({ to: `/pruebas/${prueba.id}/editar` as never });
  };

  const handleView = (prueba: Prueba) => {
    setDetailPrueba(prueba);
  };

  const handleCloseDetail = () => {
    setDetailPrueba(undefined);
  };

  const displayName = user?.username;

  return (
    <MainLayout userName={displayName} onLogout={logout}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-lg)",
          gap: "var(--space-md)",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text)",
          }}
        >
          {UI.PRUEBAS_TITLE}
        </h1>

        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
          <select
            value={tipoFilter ?? "all"}
            onChange={(e) => {
              const val = e.target.value;
              setTipoFilter(val === "all" ? null : (val as TipoPrueba));
            }}
            style={filterSelectStyle}
            aria-label="Filtrar por tipo"
          >
            <option value="all">{PRUEBAS.FILTER_TODOS}</option>
            {PRUEBAS.TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {PRUEBAS.TIPO_LABELS[tipo]}
              </option>
            ))}
          </select>

          <Button variant="primary" onClick={handleOpenCreate}>
            {PRUEBAS.BTN_NUEVA}
          </Button>
        </div>
      </div>

      <PruebasTable
        tipoFilter={tipoFilter}
        onView={handleView}
        onEdit={handleEdit}
      />

      {detailPrueba && (
        <PruebaDetailModal prueba={detailPrueba} onClose={handleCloseDetail} />
      )}
    </MainLayout>
  );
}
