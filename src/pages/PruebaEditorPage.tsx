import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { MainLayout } from "@/shared/components/layout";
import { Button, Card } from "@/shared/components/ui";
import { useCurrentUser, useLogout } from "@/features/auth";
import { PruebaEditor } from "@/features/exams";
import type { Prueba } from "@/features/exams";

export default function PruebaEditorPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  const { pruebaId: pruebaIdStr } = useParams({ strict: false }) as { pruebaId?: string };
  const search = useSearch({ strict: false }) as { step?: number };
  const pruebaId = pruebaIdStr ? Number(pruebaIdStr) : undefined;

  const handlePruebaCreated = (prueba: Prueba) => {
    void navigate({
      to: `/pruebas/${prueba.id}/editar` as never,
      search: { step: 2 } as never,
    });
  };

  return (
    <MainLayout userName={user?.username} onLogout={logout}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-lg)",
        }}
      >
        <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
          {pruebaId ? "Editar prueba" : "Nueva prueba"}
        </h1>
        <Button variant="secondary" onClick={() => void navigate({ to: "/pruebas" as never })}>
          Volver
        </Button>
      </div>

      <Card>
        <PruebaEditor pruebaId={pruebaId} initialStep={search.step} onPruebaCreated={handlePruebaCreated} />
      </Card>
    </MainLayout>
  );
}
