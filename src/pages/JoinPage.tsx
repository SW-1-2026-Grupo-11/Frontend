import { useState, useEffect, useRef, useCallback } from "react";
import { useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useJwtDecode } from "@/shared/hooks/useJwtDecode";
import { useActualizarObservaciones, useFinalizarCandidato, RendirPrueba } from "@/features/sesiones";
import type {
  Sesion,
  SesionDetalle,
  InvitadoSesion,
  PruebaCandidato,
} from "@/features/sesiones";
import env from "@/config/env";
import { ALERTAS } from "@/config/constants";
import { useProctoring } from "@/features/proctoring";
import { JitsiRoom } from "@/features/supervision";
import type { JitsiRoomHandle } from "@/features/supervision";
import Button from "@/shared/components/ui/Button";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSeconds(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fixLink(link: string): string {
  try {
    const url = new URL(link);
    return `${window.location.origin}${url.pathname}${url.search}`;
  } catch {
    return link;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function JoinPage() {
  // ── URL search params ──
  const rawSearch = useSearch({ strict: false }) as { token?: string; watch?: string };
  const token = rawSearch.token ?? "";
  const watchParam = rawSearch.watch ?? "";

  // ── JWT decode ──
  const decoded = useJwtDecode(token || null);
  const tokenError = !decoded && token !== "";
  const isInvalid = !token || tokenError;

  // ── Estado ──
  const [fase, setFase] = useState<"sala" | "ended">("sala");
  const [observaciones, setObservaciones] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [copiadoLink, setCopiadoLink] = useState<Record<number, boolean>>({});
  const [copiadoTodos, setCopiadoTodos] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [copiadoSupervisor, setCopiadoSupervisor] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [agregandoInvitado, setAgregandoInvitado] = useState(false);
  const [mensajeAgregar, setMensajeAgregar] = useState<string | null>(null);
  const [invitadosExtra, setInvitadosExtra] = useState<InvitadoSesion[]>([]);
  // Id de Jitsi (no el invitado_id) del candidato remoto, para poder expulsarlo.
  const [remoteParticipantId, setRemoteParticipantId] = useState<string | null>(null);
  // A quién supervisa el moderador. Viene del ?watch= o se elige en pantalla.
  // El supervisor SIEMPRE entra a la sala de un candidato (inv-{id}); sin esto
  // caería en una sala general sin JWT y Jitsi pediría login (ENABLE_GUESTS=0).
  const [watchLocal, setWatchLocal] = useState("");
  const watchInvitadoId = watchParam || watchLocal;

  // ── Refs ──
  const jitsiRef = useRef<JitsiRoomHandle>(null);

  // ── Fetch público con el JWT del token de invitado/supervisor ──
  const fetchWithInvitadoToken = useCallback(
    <T,>(url: string): Promise<T> =>
      fetch(`${env.API_URL}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      }),
    [token],
  );

  // ── Queries usando el token de la URL, no el de localStorage ──
  // Supervisor: consulta la sesión del candidato (puede no existir hasta que entra).
  const { data: sesionSupervisor } = useQuery<Sesion | undefined>({
    queryKey: ["sesion-publica", decoded?.entrevista_id, token],
    queryFn: async () => {
      const raw = await fetchWithInvitadoToken<Sesion[] | { results: Sesion[] }>(
        `/sesiones/?entrevista=${decoded!.entrevista_id}`,
      );
      const list = Array.isArray(raw) ? raw : (raw as { results: Sesion[] }).results ?? [];
      return list[0];
    },
    enabled: !!decoded?.entrevista_id && !!token && !!decoded?.moderator,
    retry: false,
    refetchInterval: ALERTAS.POLLING_INTERVAL_MS,
  });

  // Candidato: UNA sola llamada crea la sesión Y trae la prueba (Capa 3c).
  // POST /sesiones/rendir/ {token} -> { sesion, prueba }. Fetch plano + estado
  // local: sin React Query, sin 2 pasos acoplados, nada que se desincronice.
  const [rendir, setRendir] = useState<{ sesion: Sesion; prueba: PruebaCandidato | null } | null>(
    null,
  );
  const [rendirError, setRendirError] = useState<string | null>(null);
  const rendirFiredRef = useRef(false);

  const cargarRendir = useCallback(() => {
    if (!token) return;
    setRendirError(null);
    setRendir(null);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12000);
    fetch(`${env.API_URL}/sesiones/rendir/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          let detail = `Error ${res.status}`;
          try {
            const e = (await res.json()) as { detail?: string };
            if (e?.detail) detail = e.detail;
          } catch {
            /* sin cuerpo JSON */
          }
          throw new Error(detail);
        }
        return (await res.json()) as { sesion: Sesion; prueba: PruebaCandidato | null };
      })
      .then((data) => setRendir(data))
      .catch((err: unknown) => {
        const msg =
          err instanceof DOMException && err.name === "AbortError"
            ? "El servidor no respondió (timeout 12s). Avisa al evaluador."
            : err instanceof Error
              ? err.message
              : "No se pudo cargar tu prueba.";
        setRendirError(msg);
      })
      .finally(() => clearTimeout(timeout));
  }, [token]);

  useEffect(() => {
    if (rendirFiredRef.current || !decoded || decoded.moderator || !token) return;
    rendirFiredRef.current = true;
    cargarRendir();
  }, [decoded, token, cargarRendir]);

  // JWT de Jitsi: SOLO si el dominio es propio (la pública meet.jit.si no lo usa
  // y rechazaría un token nuestro). Candidato → su sala; supervisor → la sala
  // del candidato que mira (?watch=).
  const selfHostedJitsi = env.JITSI_DOMAIN !== "meet.jit.si";
  const [jitsiJwt, setJitsiJwt] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!selfHostedJitsi || !decoded || !token) return;
    if (decoded.moderator && !watchInvitadoId) return;
    const body: { token: string; watch?: string } = { token };
    if (decoded.moderator) body.watch = watchInvitadoId;
    fetch(`${env.API_URL}/sesiones/jitsi-token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.jwt) setJitsiJwt(d.jwt as string);
      })
      .catch(() => undefined);
  }, [selfHostedJitsi, decoded, token, watchInvitadoId]);

  // Sesión efectiva: candidato = la de /rendir/; supervisor = la consultada.
  const sesion = decoded?.moderator ? sesionSupervisor : rendir?.sesion ?? undefined;

  const { data: sesionDetalle } = useQuery<SesionDetalle>({
    queryKey: ["sesion-detalle-publica", sesion?.id, token],
    queryFn: () => fetchWithInvitadoToken<SesionDetalle>(`/sesiones/${sesion!.id}/detalle/`),
    enabled: !!sesion?.id && !!token,
    retry: false,
    refetchInterval: ALERTAS.POLLING_INTERVAL_MS,
    select: (data) => ({
      ...data,
      invitados: data.invitados.map((inv) => ({
        ...inv,
        link_invitacion: inv.link_invitacion ? fixLink(inv.link_invitacion) : inv.link_invitacion,
      })),
    }),
  });

  // ── Mutaciones ──
  const actualizarObsMutation = useActualizarObservaciones();
  const finalizarCandidato = useFinalizarCandidato();

  // ── Proctoring (solo candidatos) ──
  // Se activa MIENTRAS rinde la prueba (no depende de entrar a Jitsi): apenas la
  // sesión carga (`rendir`) y está en la sala, la IA empieza a vigilar. Así
  // funciona aunque el join de Jitsi falle, y la cámara la toma el proctoring
  // sin pelear con Jitsi.
  const proctoring = useProctoring({
    entrevistaId: decoded?.entrevista_id ?? 0,
    participanteId: decoded?.invitado_id ?? 0,
    sessionId: sesion ? String(sesion.id) : undefined,
    enabled: fase === "sala" && !!rendir && !decoded?.moderator,
  });

  // (El invitado se marca "aceptado" automáticamente dentro del endpoint `ingresar`.)

  // ── Timer de sesión ──
  // El candidato ve una CUENTA REGRESIVA hasta su deadline (auto-entrega en 0);
  // el supervisor ve el tiempo transcurrido. `nowMs` tickea cada segundo.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (fase !== "sala") return;
    const id = setInterval(() => {
      setNowMs(Date.now());
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [fase]);

  // Deadline del candidato (la sesión de /rendir/ trae `deadline`). El supervisor
  // no tiene countdown propio.
  const deadlineMs =
    !decoded?.moderator && rendir?.sesion?.deadline
      ? new Date(rendir.sesion.deadline).getTime()
      : null;
  const remainingSecs =
    deadlineMs !== null ? Math.max(0, Math.round((deadlineMs - nowMs) / 1000)) : null;
  const tiempoPorAcabarse = remainingSecs !== null && remainingSecs <= 120; // aviso ≤ 2 min

  // Proctoring desacoplado: la IA usa la cámara directa (useProctoring →
  // getUserMedia), NO screenshots de Jitsi → siempre analiza al candidato,
  // sin importar quién sea el "video grande" ni si se comparte pantalla.

  // ── Inicializar observaciones desde el detalle (solo la primera vez que llega) ──
  const obsInitRef = useRef(false);
  useEffect(() => {
    if (obsInitRef.current || !sesionDetalle) return;
    obsInitRef.current = true;
    setObservaciones(sesionDetalle.observaciones_internas ?? "");
  }, [sesionDetalle]);

  // Si el supervisor no eligió a quién mirar y hay UN solo candidato, lo elige
  // solo (caso típico: 1 candidato por convocatoria). Con varios, muestra el selector.
  useEffect(() => {
    if (!decoded?.moderator || watchInvitadoId) return;
    const invs = sesionDetalle?.invitados ?? [];
    if (invs.length === 1) setWatchLocal(String(invs[0].id));
  }, [decoded, watchInvitadoId, sesionDetalle]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSalir = () => {
    jitsiRef.current?.hangup();
    setFase("ended");
    setTimerSeconds(0);
  };

  const handleReintentarIngreso = () => {
    cargarRendir();
  };

  // ── Auto-entrega: al llegar a 0 el countdown, se entrega la prueba sola ──
  // (el server también rechaza responder pasado el deadline; esto es la comodidad
  // del front: cierra y saca al candidato sin que tenga que hacer nada).
  const autoEntregaRef = useRef(false);
  useEffect(() => {
    if (autoEntregaRef.current) return;
    if (remainingSecs === null || remainingSecs > 0) return;
    const sesionId = rendir?.sesion?.id;
    if (!sesionId || !token || fase !== "sala") return;
    autoEntregaRef.current = true;
    finalizarCandidato.mutate(
      { sesionId, token },
      { onSettled: () => handleSalir() },
    );
  }, [remainingSecs, rendir, token, fase, finalizarCandidato]);

  const handleConferenceJoined = useCallback(() => {
    // El proctoring ya no depende de entrar a Jitsi (arranca al rendir la prueba).
  }, []);

  const handleParticipantJoined = useCallback(
    (id: string) => {
      setRemoteParticipantId(id);
    },
    [],
  );

  const handleParticipantLeft = useCallback(
    (id: string) => {
      setRemoteParticipantId((prev) => (prev === id ? null : prev));
      proctoring.onParticipantLeft({ id });
    },
    [proctoring],
  );

  const handleExpulsar = () => {
    if (!remoteParticipantId) return;
    jitsiRef.current?.kickParticipant(remoteParticipantId);
  };

  const handleVideoMuteChanged = useCallback(
    (muted: boolean) => {
      proctoring.onCameraToggled("local", muted);
    },
    [proctoring],
  );

  const handleScreenShareChanged = useCallback(
    (on: boolean) => {
      proctoring.onScreenSharing("local", on);
    },
    [proctoring],
  );

  const handleReadyToClose = useCallback(() => {
    setFase("ended");
    setTimerSeconds(0);
  }, []);

  const handleGuardarObservaciones = () => {
    if (!sesion) return;
    actualizarObsMutation.mutate({ sesionId: sesion.id, dto: { observaciones } });
  };

  const handleCopiarLinkInvitado = (invId: number, link: string) => {
    void navigator.clipboard.writeText(link).then(() => {
      setCopiadoLink((prev) => ({ ...prev, [invId]: true }));
      setTimeout(() => setCopiadoLink((prev) => ({ ...prev, [invId]: false })), 2000);
    });
  };

  const handleCopiarTodos = () => {
    if (!sesionDetalle) return;
    const lines = sesionDetalle.invitados
      .filter((inv) => inv.link_invitacion)
      .map((inv) => `${inv.nombre}: ${inv.link_invitacion ?? ""}`)
      .join("\n");
    const text = `=== Links de evaluación ===\n${lines}\n==========================`;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiadoTodos(true);
      setTimeout(() => setCopiadoTodos(false), 2000);
    });
  };

  const handleAgregarInvitado = async () => {
    const nombre = nuevoNombre.trim();
    const email = nuevoEmail.trim();
    if (!nombre || !EMAIL_REGEX.test(email) || !sesion?.id) return;

    setAgregandoInvitado(true);
    setMensajeAgregar(null);

    try {
      const res = await fetch(`${env.API_URL}/sesiones/${sesion.id}/agregar-invitado/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const nuevo = (await res.json()) as InvitadoSesion;
      const nuevoFixed: InvitadoSesion = {
        ...nuevo,
        link_invitacion: nuevo.link_invitacion ? fixLink(nuevo.link_invitacion) : nuevo.link_invitacion,
      };
      setInvitadosExtra((prev) => [...prev, nuevoFixed]);
      setNuevoNombre("");
      setNuevoEmail("");
      setMensajeAgregar("✓ Invitado agregado");
      setTimeout(() => setMensajeAgregar(null), 2000);
    } catch {
      setMensajeAgregar("Error al agregar invitado");
      setTimeout(() => setMensajeAgregar(null), 3000);
    } finally {
      setAgregandoInvitado(false);
    }
  };

  const handleCopiarSupervisor = (link: string) => {
    void navigator.clipboard.writeText(link).then(() => {
      setCopiadoSupervisor(true);
      setTimeout(() => setCopiadoSupervisor(false), 2000);
    });
  };

  // ─── Pantalla de error de token ──────────────────────────────────────────

  if (isInvalid) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "var(--color-background)",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}
      >
        <span style={{ fontSize: "3rem" }}>⚠️</span>
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text)",
          }}
        >
          Link inválido o expirado
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-base)" }}>
          El enlace que usaste no es válido o ya expiró. Contacta al evaluador.
        </p>
      </div>
    );
  }

  // ─── Pantalla de carga (JWT aún siendo decodificado) ────────────────────

  if (!decoded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#0a0a0f",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}
      >
        <style>{`@keyframes jp-spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "var(--color-primary)",
            animation: "jp-spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--font-size-sm)", margin: 0 }}>
          Preparando sala...
        </p>
      </div>
    );
  }

  // ─── Pantalla de sesión finalizada ───────────────────────────────────────

  if (fase === "ended") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#0a0a0f",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}
      >
        <span style={{ fontSize: "3rem" }}>✅</span>
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Sesión finalizada
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "var(--font-size-base)" }}>
          Puedes cerrar esta ventana.
        </p>
      </div>
    );
  }

  // ─── Sala de video (full-screen) ─────────────────────────────────────────

  // 1 SALA POR CANDIDATO (regla del plan): el candidato entra a SU sala (inv-<id>),
  // nunca compartida. El supervisor entra a la sala del candidato que eligió
  // (?watch=<invitado_id>); sin elegir, cae en una sala por convocatoria (vacía).
  const roomName = decoded.moderator
    ? watchInvitadoId
      ? `inv-${watchInvitadoId}`
      : `entrevista-${decoded.entrevista_id}`
    : `inv-${decoded.invitado_id}`;

  const jitsiEl = (
    <JitsiRoom
      ref={jitsiRef}
      roomName={roomName}
      displayName={decoded.nombre}
      email={decoded.email}
      isModerator={decoded.moderator}
      jwt={jitsiJwt}
      onConferenceJoined={handleConferenceJoined}
      onParticipantJoined={handleParticipantJoined}
      onParticipantLeft={handleParticipantLeft}
      onVideoMuteChanged={handleVideoMuteChanged}
      onScreenShareChanged={handleScreenShareChanged}
      onReadyToClose={handleReadyToClose}
    />
  );

  // El supervisor entra al video SOLO de un candidato puntual (sala inv-{id}).
  // Si todavía no eligió a quién mirar, mostramos el selector en vez de meterlo
  // a una sala general sin JWT (que dispararía el login de Jitsi).
  const supervisorContent =
    decoded.moderator && !watchInvitadoId ? (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-md)",
          color: "rgba(255,255,255,0.85)",
          padding: 24,
        }}
      >
        <span style={{ fontSize: "2rem" }}>👁️</span>
        <p style={{ margin: 0, fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)" }}>
          Elegí a quién supervisar
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--font-size-sm)",
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            maxWidth: 360,
          }}
        >
          Cada candidato tiene su propia sala. Elegí uno para entrar a su video.
        </p>
        {(() => {
          const invs = sesionDetalle?.invitados ?? [];
          if (invs.length === 0) {
            return (
              <p
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "rgba(255,255,255,0.4)",
                  fontStyle: "italic",
                }}
              >
                Aún no hay candidatos en la sesión.
              </p>
            );
          }
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
                width: "100%",
                maxWidth: 360,
              }}
            >
              {invs.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setWatchLocal(String(inv.id))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-sm)",
                    padding: "var(--space-md)",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "var(--radius-md)",
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: "var(--font-size-base)",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: "var(--font-weight-bold)" }}>{inv.nombre}</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "var(--font-size-xs)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {inv.estado}
                  </span>
                </button>
              ))}
            </div>
          );
        })()}
      </div>
    ) : (
      jitsiEl
    );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      {/* ── Topbar ── */}
      <div
        style={{
          height: 48,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          paddingInline: "var(--space-lg)",
          gap: "var(--space-md)",
          flexShrink: 0,
        }}
      >
        {/* Izquierda: logo + nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flex: 1 }}>
          <span
            style={{
              fontSize: "var(--font-size-base)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-primary)",
            }}
          >
            EvalSecure
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "rgba(255,255,255,0.7)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "240px",
            }}
          >
            {sesionDetalle?.titulo_entrevista ?? "Sesión de evaluación"}
          </span>
        </div>

        {/* Centro: timer — candidato = cuenta regresiva al deadline; supervisor = transcurrido */}
        <div
          title={remainingSecs !== null ? "Tiempo restante para entregar" : "Tiempo en sala"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--font-size-base)",
            fontWeight: "var(--font-weight-bold)",
            color: tiempoPorAcabarse ? "#f87171" : "rgba(255,255,255,0.9)",
            fontVariantNumeric: "tabular-nums",
            minWidth: "60px",
            textAlign: "center",
            transition: "color 0.3s",
          }}
        >
          {remainingSecs !== null ? (
            <>
              <span>{tiempoPorAcabarse ? "⏰" : "⏱️"}</span>
              <span>{formatSeconds(remainingSecs)}</span>
            </>
          ) : (
            formatSeconds(timerSeconds)
          )}
        </div>

        {/* Derecha: badge + botones */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flex: 1, justifyContent: "flex-end" }}>
          {decoded.moderator ? (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-medium)",
                backgroundColor: "rgba(239,68,68,0.2)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.4)",
              }}
            >
              Supervisor
            </span>
          ) : (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-medium)",
                backgroundColor: "rgba(34,197,94,0.2)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.4)",
              }}
            >
              En evaluación
            </span>
          )}
          {decoded.moderator && (
            <button
              onClick={() => setShowInfoPanel((p) => !p)}
              style={{
                padding: "4px 12px",
                background: showInfoPanel ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${showInfoPanel ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: "var(--radius-md)",
                color: showInfoPanel ? "#a5b4fc" : "rgba(255,255,255,0.7)",
                cursor: "pointer",
                fontSize: "var(--font-size-sm)",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "background 0.15s, border-color 0.15s, color 0.15s",
              }}
            >
              ℹ️ Info sesión
            </button>
          )}
          {decoded.moderator && remoteParticipantId && (
            <Button variant="danger" size="sm" onClick={handleExpulsar}>
              Expulsar
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={handleSalir}>
            Salir
          </Button>
        </div>
      </div>

      {/* ── Contenido principal: Jitsi + panel lateral ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Candidato: rendir la prueba + cámara chica · Supervisor: video grande */}
        {!decoded.moderator ? (
          <>
            <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
              {rendir ? (
                <RendirPrueba
                  prueba={rendir.prueba}
                  sesionId={rendir.sesion.id}
                  token={token}
                  onFinalizar={handleSalir}
                />
              ) : rendirError ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--space-sm)",
                    height: "100%",
                    padding: 24,
                    textAlign: "center",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>⚠️</span>
                  <p style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)" }}>
                    No se pudo iniciar tu evaluación
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "rgba(255,255,255,0.5)" }}>
                    {rendirError ?? "El enlace puede haber expirado o ser inválido."}
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "rgba(255,255,255,0.35)" }}>
                    Recarga la página o contacta al evaluador.
                  </p>
                  <button
                    onClick={handleReintentarIngreso}
                    style={{
                      marginTop: 8,
                      padding: "8px 18px",
                      background: "var(--color-primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      fontSize: "var(--font-size-sm)",
                      fontFamily: "inherit",
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  Preparando tu prueba…
                </div>
              )}
            </div>
            <div
              style={{
                width: 300,
                flexShrink: 0,
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                background: "#0a0a0f",
              }}
            >
              {jitsiEl}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflow: "hidden" }}>{supervisorContent}</div>
        )}

        {/* Panel lateral — solo supervisores */}
        {decoded.moderator && (
          <div
            style={{
              width: 280,
              flexShrink: 0,
              backgroundColor: "rgba(255,255,255,0.03)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "var(--space-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-lg)",
              }}
            >
              {/* Links de invitados */}
              <section>
                {(() => {
                  const todosInvitados = [
                    ...(sesionDetalle?.invitados ?? []),
                    ...invitadosExtra,
                  ];
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-sm)" }}>
                        <h3 style={{
                          fontSize: "var(--font-size-sm)",
                          fontWeight: "var(--font-weight-bold)",
                          color: "rgba(255,255,255,0.5)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          margin: 0,
                        }}>
                          Links de invitados
                        </h3>
                        {todosInvitados.some((inv) => inv.link_invitacion) && (
                          <button
                            onClick={handleCopiarTodos}
                            style={{
                              background: "none",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: "var(--radius-sm)",
                              color: copiadoTodos ? "#22c55e" : "rgba(255,255,255,0.45)",
                              cursor: "pointer",
                              fontSize: "0.65rem",
                              padding: "2px 8px",
                              fontFamily: "inherit",
                              transition: "color 0.15s",
                            }}
                          >
                            {copiadoTodos ? "✓ Copiado" : "Copiar todos"}
                          </button>
                        )}
                      </div>

                      {todosInvitados.length === 0 ? (
                        <p style={{ fontSize: "var(--font-size-sm)", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                          Sin invitados registrados
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                          {todosInvitados.map((inv) => (
                            <div
                              key={inv.id}
                              style={{
                                backgroundColor: "rgba(255,255,255,0.04)",
                                borderRadius: "var(--radius-md)",
                                padding: "var(--space-xs) var(--space-sm)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "3px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                                <div style={{
                                  width: 22, height: 22,
                                  borderRadius: "var(--radius-full)",
                                  backgroundColor: "var(--color-primary)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "0.55rem", fontWeight: "var(--font-weight-bold)", color: "#fff",
                                  flexShrink: 0,
                                }}>
                                  {getInitials(inv.nombre)}
                                </div>
                                <span style={{
                                  flex: 1, fontSize: "var(--font-size-sm)", color: "rgba(255,255,255,0.8)",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                  {inv.nombre}
                                </span>
                              </div>

                              {inv.link_invitacion ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 9, flexShrink: 0 }}>🔗</span>
                                  <span style={{
                                    flex: 1, fontSize: "0.65rem", color: "rgba(255,255,255,0.35)",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  }}>
                                    {inv.link_invitacion.length > 30
                                      ? `${inv.link_invitacion.slice(0, 30)}...`
                                      : inv.link_invitacion}
                                  </span>
                                  <button
                                    onClick={() => handleCopiarLinkInvitado(inv.id, inv.link_invitacion!)}
                                    style={{
                                      background: "none",
                                      border: "1px solid rgba(255,255,255,0.12)",
                                      borderRadius: "var(--radius-sm)",
                                      color: copiadoLink[inv.id] ? "#22c55e" : "rgba(255,255,255,0.45)",
                                      cursor: "pointer", fontSize: "0.6rem", padding: "1px 6px",
                                      fontFamily: "inherit", flexShrink: 0, transition: "color 0.15s",
                                    }}
                                  >
                                    {copiadoLink[inv.id] ? "✓" : "Copiar"}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                                  Link no disponible
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulario agregar invitado */}
                      <div style={{
                        marginTop: "var(--space-sm)",
                        paddingTop: "var(--space-sm)",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--space-xs)",
                      }}>
                        <input
                          type="text"
                          placeholder="Nombre del invitado"
                          value={nuevoNombre}
                          onChange={(e) => setNuevoNombre(e.target.value)}
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "var(--radius-sm)",
                            color: "rgba(255,255,255,0.8)",
                            fontSize: "var(--font-size-xs)",
                            padding: "5px 8px",
                            fontFamily: "inherit",
                            outline: "none",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        />
                        <input
                          type="email"
                          placeholder="email@ejemplo.com"
                          value={nuevoEmail}
                          onChange={(e) => setNuevoEmail(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void handleAgregarInvitado(); }}
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "var(--radius-sm)",
                            color: "rgba(255,255,255,0.8)",
                            fontSize: "var(--font-size-xs)",
                            padding: "5px 8px",
                            fontFamily: "inherit",
                            outline: "none",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        />
                        <button
                          onClick={() => void handleAgregarInvitado()}
                          disabled={agregandoInvitado || !nuevoNombre.trim() || !EMAIL_REGEX.test(nuevoEmail.trim())}
                          style={{
                            backgroundColor: agregandoInvitado ? "rgba(255,255,255,0.1)" : "rgba(99,102,241,0.3)",
                            border: "1px solid rgba(99,102,241,0.4)",
                            borderRadius: "var(--radius-sm)",
                            color: agregandoInvitado ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
                            cursor: agregandoInvitado ? "not-allowed" : "pointer",
                            fontSize: "var(--font-size-xs)",
                            padding: "5px 0",
                            fontFamily: "inherit",
                            fontWeight: "var(--font-weight-medium)",
                            width: "100%",
                            transition: "background 0.15s",
                          }}
                        >
                          {agregandoInvitado ? "Agregando..." : "+ Agregar invitado"}
                        </button>
                        {mensajeAgregar && (
                          <p style={{
                            margin: 0,
                            fontSize: "var(--font-size-xs)",
                            color: mensajeAgregar.startsWith("✓") ? "#22c55e" : "#ef4444",
                            textAlign: "center",
                          }}>
                            {mensajeAgregar}
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </section>

              {/* Observaciones */}
              <section>
                <h3
                  style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  Observaciones
                </h3>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas internas de la sesión..."
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-sm)",
                    fontSize: "var(--font-size-sm)",
                    fontFamily: "inherit",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ width: "100%", marginTop: "var(--space-xs)" }}
                  loading={actualizarObsMutation.isPending}
                  onClick={handleGuardarObservaciones}
                >
                  Guardar
                </Button>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* ── Panel overlay "Info de sesión" ── */}
      {showInfoPanel && (
        <div
          onClick={() => setShowInfoPanel(false)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#12121e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              width: "100%",
              maxWidth: 560,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header del panel */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "rgba(255,255,255,0.9)" }}>
                Información de la sesión
              </h2>
              <button
                onClick={() => setShowInfoPanel(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 22, lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* — Datos de la sesión — */}
              <div>
                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: "var(--font-weight-semibold)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Datos de la sesión
                </p>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden" }}>
                  {[
                    { label: "Título", value: sesionDetalle?.titulo_entrevista ?? "—" },
                    { label: "Evaluador", value: sesionDetalle?.evaluador_nombre ?? "—" },
                    { label: "Duración", value: sesionDetalle ? `${sesionDetalle.duracion_minutos} min` : "—" },
                    { label: "Estado", value: sesion?.estado ?? "—" },
                  ].map(({ label, value }, i) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 14px",
                        borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                      }}
                    >
                      <span style={{ fontSize: "var(--font-size-sm)", color: "rgba(255,255,255,0.4)" }}>{label}</span>
                      <span style={{ fontSize: "var(--font-size-sm)", color: "rgba(255,255,255,0.85)", fontWeight: "var(--font-weight-medium)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* — Links para compartir (solo moderator) — */}
              {decoded.moderator && sesionDetalle && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: "var(--font-weight-semibold)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Links para compartir
                    </p>
                    {sesionDetalle.invitados.some((inv) => inv.link_invitacion) && (
                      <button
                        onClick={handleCopiarTodos}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6,
                          color: copiadoTodos ? "#22c55e" : "rgba(255,255,255,0.55)",
                          cursor: "pointer",
                          fontSize: "var(--font-size-xs)",
                          padding: "4px 12px",
                          fontFamily: "inherit",
                          transition: "color 0.15s",
                        }}
                      >
                        {copiadoTodos ? "✓ Copiado" : "Copiar todos los links"}
                      </button>
                    )}
                  </div>

                  {sesionDetalle.invitados.length === 0 ? (
                    <p style={{ fontSize: "var(--font-size-sm)", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                      Sin invitados en esta sesión
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {sesionDetalle.invitados.map((inv) => (
                        <div
                          key={inv.id}
                          style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%",
                              background: "var(--color-primary)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.6rem", fontWeight: "var(--font-weight-bold)", color: "#fff",
                              flexShrink: 0,
                            }}>
                              {getInitials(inv.nombre)}
                            </div>
                            <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "rgba(255,255,255,0.85)" }}>
                              {inv.nombre}
                            </span>
                          </div>
                          {inv.link_invitacion ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input
                                readOnly
                                value={inv.link_invitacion}
                                style={{
                                  flex: 1,
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: 6,
                                  color: "rgba(255,255,255,0.45)",
                                  fontSize: "0.68rem",
                                  padding: "4px 8px",
                                  fontFamily: "monospace",
                                  outline: "none",
                                }}
                              />
                              <button
                                onClick={() => handleCopiarLinkInvitado(inv.id, inv.link_invitacion!)}
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: `1px solid ${copiadoLink[inv.id] ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`,
                                  borderRadius: 6,
                                  color: copiadoLink[inv.id] ? "#22c55e" : "rgba(255,255,255,0.55)",
                                  cursor: "pointer",
                                  fontSize: "0.7rem",
                                  padding: "4px 12px",
                                  fontFamily: "inherit",
                                  flexShrink: 0,
                                  transition: "color 0.15s, border-color 0.15s",
                                }}
                              >
                                {copiadoLink[inv.id] ? "✓ Copiado" : "Copiar"}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
                              Sin link generado
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* — Tu link de supervisor — */}
              {decoded.moderator && sesionDetalle?.link_supervisor && (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: "var(--font-weight-semibold)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Tu link de supervisor
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      readOnly
                      value={sesionDetalle.link_supervisor}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 6,
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "0.68rem",
                        padding: "4px 8px",
                        fontFamily: "monospace",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => handleCopiarSupervisor(sesionDetalle.link_supervisor!)}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${copiadoSupervisor ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 6,
                        color: copiadoSupervisor ? "#22c55e" : "rgba(255,255,255,0.55)",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        padding: "4px 12px",
                        fontFamily: "inherit",
                        flexShrink: 0,
                        transition: "color 0.15s, border-color 0.15s",
                      }}
                    >
                      {copiadoSupervisor ? "✓ Copiado" : "Copiar mi link"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
