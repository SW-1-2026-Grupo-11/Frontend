import { forwardRef } from "react";
import Card from "@/shared/components/ui/Card";
import type { ProgramarInvitadoDto } from "../types";

type EmailPreviewProps = {
  candidatos: ProgramarInvitadoDto[];
  titulo: string;
  fechaProgramada: string;
  duracionMinutos: number | null;
  pruebaDuracion: number | null;
  evaluador?: { first_name: string; last_name: string };
};

const EmailPreview = forwardRef<HTMLDivElement, EmailPreviewProps>(function EmailPreview(
  { candidatos, titulo, fechaProgramada, duracionMinutos, pruebaDuracion, evaluador },
  ref,
) {
  return (
    <div ref={ref}>
      <Card title="Vista previa del email">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ fontWeight: "var(--font-weight-medium)" }}>Para: </span>
              {candidatos.length > 0 ? (
                candidatos.map((c) => c.email).join(", ")
              ) : (
                <span style={{ fontStyle: "italic" }}>candidatos por agregar...</span>
              )}
            </div>
            <div>
              <span style={{ fontWeight: "var(--font-weight-medium)" }}>De: </span>
              evalsecure@empresa.com
            </div>
            <div>
              <span style={{ fontWeight: "var(--font-weight-medium)" }}>Asunto: </span>
              Invitación a evaluación — EvalSecure
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: 0 }} />

          <div
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0 }}>Hola,</p>
            <p style={{ margin: 0 }}>
              Has sido invitado/a a participar en una evaluación a través de EvalSecure.
            </p>

            <div
              style={{
                padding: "var(--space-sm)",
                backgroundColor: "var(--color-background)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div>
                <strong>Sesión:</strong> {titulo || <em>Sin título</em>}
              </div>
              <div>
                <strong>Fecha:</strong>{" "}
                {fechaProgramada
                  ? new Date(fechaProgramada).toLocaleString("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Por definir"}
              </div>
              <div>
                <strong>Duración:</strong>{" "}
                {duracionMinutos != null
                  ? `${duracionMinutos} minutos`
                  : pruebaDuracion
                    ? `${pruebaDuracion} minutos (de la prueba)`
                    : "Tiempo de la prueba"}
              </div>
              {evaluador && (
                <div>
                  <strong>Evaluador:</strong> {evaluador.first_name} {evaluador.last_name}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "var(--space-sm) var(--space-md)",
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
                fontWeight: "var(--font-weight-medium)",
              }}
            >
              Ingresar a la evaluación →
            </div>

            <p
              style={{
                margin: 0,
                fontSize: "0.7rem",
                color: "var(--color-text-muted)",
                fontStyle: "italic",
              }}
            >
              Esta sesión está sujeta a monitoreo remoto por parte de EvalSecure.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
});

export default EmailPreview;
