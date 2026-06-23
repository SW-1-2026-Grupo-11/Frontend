import Card from "@/shared/components/ui/Card";
import Button from "@/shared/components/ui/Button";
import type { InvitadoProgramado } from "../types";

type LinksGeneradosProps = {
  invitados: InvitadoProgramado[];
  copiadoPorInvitado: Record<number, boolean>;
  copiadoTodos: boolean;
  onCopiarInvitado: (invitadoId: number, link: string) => void;
  onCopiarTodos: () => void;
};

export default function LinksGenerados({
  invitados,
  copiadoPorInvitado,
  copiadoTodos,
  onCopiarInvitado,
  onCopiarTodos,
}: LinksGeneradosProps) {
  return (
    <Card title="Links generados">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <Button
            variant="secondary"
            onClick={onCopiarTodos}
            style={{ fontSize: "var(--font-size-xs)", padding: "4px 12px" }}
          >
            {copiadoTodos ? "✓ Copiado" : "Copiar todos"}
          </Button>
        </div>

        {invitados.map((inv) => (
          <div
            key={inv.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "6px 0",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {inv.nombre}
            </span>
            <span
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 130,
              }}
            >
              {inv.link_invitacion ? (
                inv.link_invitacion.length > 30 ? (
                  `${inv.link_invitacion.slice(0, 30)}…`
                ) : (
                  inv.link_invitacion
                )
              ) : (
                <em>No disponible</em>
              )}
            </span>
            <button
              disabled={!inv.link_invitacion}
              onClick={() => inv.link_invitacion && onCopiarInvitado(inv.id, inv.link_invitacion)}
              style={{
                padding: "3px 10px",
                background: "transparent",
                color: inv.link_invitacion ? "var(--color-primary)" : "var(--color-text-muted)",
                border: `1px solid ${inv.link_invitacion ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-sm)",
                cursor: inv.link_invitacion ? "pointer" : "default",
                fontSize: "var(--font-size-xs)",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              {copiadoPorInvitado[inv.id] ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
