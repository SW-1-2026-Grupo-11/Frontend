import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/shared/components/layout";
import { Button, Input } from "@/shared/components/ui";
import { useCurrentUser, useLogout } from "@/features/auth";
import {
  EntrevistasTable,
  EntrevistaModal,
  EntrevistaDetailDrawer,
} from "@/features/interviews";
import type {
  Entrevista,
  EstadoEntrevista,
  EntrevistasSortField,
  SortState,
} from "@/features/interviews";
import { UI, ENTREVISTAS } from "@/config/constants";

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

export default function EntrevistasPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  const [estadoFilter, setEstadoFilter] = useState<EstadoEntrevista | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editEntrevista, setEditEntrevista] = useState<Entrevista | undefined>(undefined);
  const [detailEntrevista, setDetailEntrevista] = useState<Entrevista | undefined>(undefined);

  // Debounce: evita 1 request por tecla. Resetea a la página 1 al buscar.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleSortChange = (field: EntrevistasSortField) => {
    setSort((prev) =>
      prev?.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" },
    );
    setPage(1);
  };

  const handleOpenCreate = () => {
    // Crear convocatoria = el flujo completo (prueba + evaluador + candidatos)
    void navigate({ to: "/sesiones/nueva" });
  };

  const handleEdit = (entrevista: Entrevista) => {
    setEditEntrevista(entrevista);
    setIsFormModalOpen(true);
  };

  const handleView = (entrevista: Entrevista) => {
    setDetailEntrevista(entrevista);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setEditEntrevista(undefined);
  };

  const handleCloseDetail = () => {
    setDetailEntrevista(undefined);
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
          {UI.ENTREVISTAS_TITLE}
        </h1>

        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
          <select
            value={estadoFilter ?? "all"}
            onChange={(e) => {
              const val = e.target.value;
              setEstadoFilter(val === "all" ? null : (val as EstadoEntrevista));
              setPage(1);
            }}
            style={filterSelectStyle}
            aria-label="Filtrar por estado"
          >
            <option value="all">{ENTREVISTAS.FILTER_TODAS}</option>
            {ENTREVISTAS.ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {ENTREVISTAS.ESTADO_LABELS[estado]}
              </option>
            ))}
          </select>

          <Button variant="primary" onClick={handleOpenCreate}>
            {ENTREVISTAS.BTN_NUEVA}
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: "320px", marginBottom: "var(--space-md)" }}>
        <Input
          placeholder={ENTREVISTAS.SEARCH_PLACEHOLDER}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <EntrevistasTable
        estadoFilter={estadoFilter}
        page={page}
        onPageChange={setPage}
        search={search}
        sort={sort}
        onSortChange={handleSortChange}
        onView={handleView}
        onEdit={handleEdit}
      />

      {isFormModalOpen && (
        <EntrevistaModal onClose={handleCloseForm} entrevista={editEntrevista} />
      )}

      {detailEntrevista && (
        <EntrevistaDetailDrawer entrevista={detailEntrevista} onClose={handleCloseDetail} />
      )}
    </MainLayout>
  );
}
