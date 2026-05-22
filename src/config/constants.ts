export const QUERY_STALE_TIME = 1000 * 60 * 5;

export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_REFRESH_KEY = "auth_refresh";

export const PROCTORING = {
  FRAME_INTERVAL_MS: 2000,
  CAPTURE_WIDTH: 640,
  CAPTURE_HEIGHT: 480,
  JPEG_QUALITY: 0.72,
  DETECTION_LABELS: {
    uso_de_celular: "Teléfono detectado",
    sin_rostro: "Sin rostro en cámara",
    multiples_rostros: "Más de una persona",
    mirada_fuera_pantalla: "Mirada desviada",
    posible_celular_o_lectura: "Cabeza agachada / posible lectura",
  },
} as const;

export const JITSI = {
  TOOLBAR_BUTTONS: [
    "microphone",
    "camera",
    "desktop",
    "chat",
    "raisehand",
    "tileview",
    "hangup",
  ],
  DEFAULT_ROOM_PREFIX: "supervision-session",
  IFRAME_CONTAINER_ID: "jitsi-container",
} as const;

export const PRUEBAS = {
  TIPOS: ["teorica", "tecnica", "mixta"] as const,
  TIPO_LABELS: {
    teorica: "Teórica",
    tecnica: "Técnica",
    mixta: "Mixta",
  } as const,
  TIPO_BADGE: {
    teorica: "info",
    tecnica: "warning",
    mixta: "success",
  } as const,

  AREAS: ["programacion", "negocio", "juridica"] as const,
  AREA_LABELS: {
    programacion: "Programación",
    negocio: "Negocio",
    juridica: "Jurídica",
  } as const,
  AREA_BADGE: {
    programacion: "info",
    negocio: "warning",
    juridica: "danger",
  } as const,

  NIVELES: ["basico", "intermedio", "avanzado"] as const,
  NIVEL_LABELS: {
    basico: "Básico",
    intermedio: "Intermedio",
    avanzado: "Avanzado",
  } as const,

  ESTADOS: ["borrador", "activa", "inactiva", "archivada"] as const,
  ESTADO_LABELS: {
    borrador: "Borrador",
    activa: "Activa",
    inactiva: "Inactiva",
    archivada: "Archivada",
  } as const,
  ESTADO_BADGE: {
    borrador: "neutral",
    activa: "success",
    inactiva: "danger",
    archivada: "neutral",
  } as const,

  // Tabla
  COL_TITULO: "Título",
  COL_TIPO: "Tipo",
  COL_AREA: "Área",
  COL_NIVEL: "Nivel",
  COL_DURACION: "Duración",
  COL_PUNTAJE: "Puntaje máx.",
  COL_ESTADO: "Estado",
  COL_ACCIONES: "Acciones",
  EMPTY: "No hay pruebas registradas",
  ERROR: "Error al cargar las pruebas",
  // Acciones
  BTN_NUEVA: "Nueva prueba",
  BTN_VER: "Ver",
  BTN_EDITAR: "Editar",
  BTN_ELIMINAR: "Eliminar",
  BTN_CREAR: "Crear prueba",
  BTN_GUARDAR: "Guardar cambios",
  BTN_CANCELAR: "Cancelar",
  BTN_CERRAR: "Cerrar",
  // Modal
  MODAL_CREAR_TITLE: "Nueva prueba",
  MODAL_EDITAR_TITLE: "Editar prueba",
  MODAL_DETALLE_TITLE: "Detalle de prueba",
  // Formulario
  LABEL_TITULO: "Título",
  LABEL_TIPO: "Tipo de prueba",
  LABEL_AREA: "Área",
  LABEL_NIVEL: "Nivel",
  LABEL_DESCRIPCION: "Descripción",
  LABEL_PUNTAJE: "Puntaje máximo",
  LABEL_DURACION: "Duración (minutos)",
  LABEL_ESTADO: "Estado",
  // Detalle
  DETAIL_MINUTOS: "min",
  DETAIL_PUNTOS: "pts",
  // Filtro
  FILTER_TODOS: "Todos los tipos",
  // Confirmación
  CONFIRM_DELETE: "¿Estás seguro de que deseas eliminar esta prueba?",
  // Validación
  VALIDATION_REQUIRED: "Este campo es requerido",
  VALIDATION_POSITIVE: "El valor debe ser mayor a 0",
} as const;

export const USUARIOS = {
  ROLES: ["admin", "reclutador", "entrevistador", "evaluador"] as const,
  ROL_LABELS: {
    admin: "Administrador",
    reclutador: "Reclutador",
    entrevistador: "Entrevistador",
    evaluador: "Evaluador",
  } as const,
  ROL_BADGE: {
    admin: "danger",
    reclutador: "info",
    entrevistador: "warning",
    evaluador: "success",
  } as const,

  ESTADOS: ["activo", "inactivo"] as const,
  ESTADO_LABELS: {
    activo: "Activo",
    inactivo: "Inactivo",
  } as const,
  ESTADO_BADGE: {
    activo: "success",
    inactivo: "danger",
  } as const,

  // Tabla
  COL_NOMBRE: "Nombre completo",
  COL_EMAIL: "Email",
  COL_ROL: "Rol",
  COL_ESTADO: "Estado",
  COL_ACCIONES: "Acciones",
  EMPTY: "No hay usuarios registrados",
  ERROR: "Error al cargar los usuarios",
  // Acciones
  BTN_NUEVO: "Nuevo usuario",
  BTN_EDITAR: "Editar",
  BTN_ELIMINAR: "Eliminar",
  BTN_CREAR: "Crear usuario",
  BTN_GUARDAR: "Guardar cambios",
  BTN_CANCELAR: "Cancelar",
  // Modal
  MODAL_CREAR_TITLE: "Nuevo usuario",
  MODAL_EDITAR_TITLE: "Editar usuario",
  // Formulario
  LABEL_NOMBRE: "Nombre",
  LABEL_APELLIDO: "Apellido",
  LABEL_EMAIL: "Email",
  LABEL_TELEFONO: "Teléfono",
  LABEL_PASSWORD: "Contraseña",
  LABEL_ROL: "Rol",
  LABEL_ESTADO: "Estado",
  // Confirmación
  CONFIRM_DELETE: "¿Estás seguro de que deseas eliminar a este usuario?",
  // Validación
  VALIDATION_REQUIRED: "Este campo es requerido",
  VALIDATION_EMAIL: "Ingresa un email válido",
} as const;

export const DASHBOARD = {
  GREETING: "Bienvenido",
  GREETING_SUBTITLE: "Selecciona una sección para comenzar",
  ACCESOS_TITLE: "Accesos rápidos",
  ACCESO_USUARIOS: "Gestionar usuarios",
  ACCESO_PRUEBAS: "Gestionar pruebas",
  ACCESO_ENTREVISTAS: "Gestionar entrevistas",
  ACTIVIDAD_TITLE: "Actividad reciente",
  ACTIVIDAD_ERROR: "Error al cargar la actividad reciente",
  ACTIVIDAD_EMPTY: "No hay actividad registrada",
} as const;

export const ENTREVISTAS = {
  ESTADOS: ["borrador", "programada", "en_proceso", "finalizada", "cancelada"] as const,
  ESTADO_LABELS: {
    borrador: "Borrador",
    programada: "Programada",
    en_proceso: "En proceso",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
  } as const,
  ESTADO_BADGE: {
    borrador: "neutral",
    programada: "info",
    en_proceso: "warning",
    finalizada: "success",
    cancelada: "danger",
  } as const,

  ESTADOS_ASIGNACION: ["asignada", "inactiva", "cancelada"] as const,
  ESTADO_ASIGNACION_LABELS: {
    asignada: "Asignada",
    inactiva: "Inactiva",
    cancelada: "Cancelada",
  } as const,
  ESTADO_ASIGNACION_BADGE: {
    asignada: "success",
    inactiva: "neutral",
    cancelada: "danger",
  } as const,

  // Tabla
  COL_TITULO: "Título",
  COL_DESCRIPCION: "Descripción",
  COL_ESTADO: "Estado",
  COL_FECHA: "Fecha programada",
  COL_ACCIONES: "Acciones",
  EMPTY: "No hay entrevistas registradas",
  ERROR: "Error al cargar las entrevistas",
  // Acciones
  BTN_NUEVA: "Nueva entrevista",
  BTN_VER: "Ver",
  BTN_EDITAR: "Editar",
  BTN_ELIMINAR: "Eliminar",
  BTN_CREAR: "Crear entrevista",
  BTN_GUARDAR: "Guardar cambios",
  BTN_CANCELAR: "Cancelar",
  BTN_CERRAR: "Cerrar",
  BTN_ASIGNAR_PRUEBA: "Asignar prueba",
  BTN_REMOVER: "Remover",
  // Modales
  MODAL_CREAR_TITLE: "Nueva entrevista",
  MODAL_EDITAR_TITLE: "Editar entrevista",
  MODAL_DETALLE_TITLE: "Detalle de entrevista",
  MODAL_ASIGNAR_TITLE: "Asignar prueba",
  // Formulario
  LABEL_TITULO: "Título",
  LABEL_DESCRIPCION: "Descripción",
  LABEL_ESTADO: "Estado",
  LABEL_FECHA_PROGRAMADA: "Fecha programada",
  LABEL_PRUEBA: "Prueba",
  LABEL_OBSERVACIONES: "Observaciones",
  // Detalle
  DETAIL_PRUEBAS_TITLE: "Pruebas asignadas",
  DETAIL_NO_PRUEBAS: "Sin pruebas asignadas aún",
  DETAIL_ESTADO_ASIGNACION: "Estado",
  DETAIL_OBSERVACIONES: "Observaciones",
  // Filtro
  FILTER_TODAS: "Todos los estados",
  // Confirmación
  CONFIRM_DELETE: "¿Estás seguro de que deseas eliminar esta entrevista?",
  CONFIRM_REMOVER_PRUEBA: "¿Remover esta prueba de la entrevista?",
  // Validación
  VALIDATION_REQUIRED: "Este campo es requerido",
} as const;

export const UI = {
  APP_NAME: "Supervisión App",
  HOME_TITLE: "Supervisión Remota de Exámenes",
  HOME_SUBTITLE: "Crea una sesión para iniciar la videollamada de supervisión",
  CREATE_SESSION_BUTTON: "Crear nueva sesión",
  SESSION_TITLE: "Sesión en curso",
  LEAVE_BUTTON: "Salir de la sesión",
  LOADING_JITSI: "Conectando a la videollamada...",
  // Auth
  LOGIN_TITLE: "Iniciar Sesión",
  LOGIN_SUBTITLE: "Ingresa tus credenciales para continuar",
  LOGIN_USERNAME_LABEL: "Usuario",
  LOGIN_USERNAME_PLACEHOLDER: "Tu nombre de usuario",
  LOGIN_PASSWORD_LABEL: "Contraseña",
  LOGIN_PASSWORD_PLACEHOLDER: "••••••••",
  LOGIN_BUTTON: "Ingresar",
  LOGIN_ERROR_DEFAULT: "Credenciales incorrectas. Intenta de nuevo.",
  // Navegación sidebar
  NAV_DASHBOARD: "Dashboard",
  NAV_SUPERVISION: "Supervisión",
  NAV_USUARIOS: "Usuarios",
  NAV_PRUEBAS: "Pruebas",
  NAV_ENTREVISTAS: "Entrevistas",
  // Páginas
  DASHBOARD_TITLE: "Dashboard",
  USUARIOS_TITLE: "Gestionar Usuarios",
  PRUEBAS_TITLE: "Gestionar Pruebas",
  ENTREVISTAS_TITLE: "Gestionar Entrevistas",
} as const;
