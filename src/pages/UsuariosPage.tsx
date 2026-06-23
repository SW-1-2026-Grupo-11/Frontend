import { useEffect, useState } from "react";
import { MainLayout } from "@/shared/components/layout";
import { Button, Input } from "@/shared/components/ui";
import { useCurrentUser, useLogout } from "@/features/auth";
import { UsuariosTable, UsuarioModal } from "@/features/usuarios";
import type { Usuario, UsuariosSortField, SortState } from "@/features/usuarios";
import { UI, USUARIOS } from "@/config/constants";

export default function UsuariosPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  // Debounce: evita 1 request por tecla. Resetea a la página 1 al buscar.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleSortChange = (field: UsuariosSortField) => {
    setSort((prev) =>
      prev?.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" },
    );
    setPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedUsuario(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUsuario(undefined);
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
        }}
      >
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text)",
          }}
        >
          {UI.USUARIOS_TITLE}
        </h1>
        <Button variant="primary" onClick={handleOpenCreate}>
          {USUARIOS.BTN_NUEVO}
        </Button>
      </div>

      <div style={{ maxWidth: "320px", marginBottom: "var(--space-md)" }}>
        <Input
          placeholder={USUARIOS.SEARCH_PLACEHOLDER}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <UsuariosTable
        page={page}
        onPageChange={setPage}
        search={search}
        sort={sort}
        onSortChange={handleSortChange}
        onEdit={handleEdit}
      />

      {isModalOpen && (
        <UsuarioModal onClose={handleCloseModal} usuario={selectedUsuario} />
      )}
    </MainLayout>
  );
}
