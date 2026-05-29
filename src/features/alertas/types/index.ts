export type Severidad = "alta" | "media" | "baja";

export type TipoAlerta =
  | "sin_rostro"
  | "multiples_rostros"
  | "mirada_fuera_pantalla"
  | "uso_de_celular"
  | "posible_celular_o_lectura"
  | "cambio_ventana"
  | "camara_apagada"
  | "pantalla_compartida"
  | "participante_salio";

export type EvidenciaJSON = {
  modo: string;
  confianza: number;
  modelo: string;
  session_id: string | null;
};

export type AlertasFilter = {
  entrevista?: number;
  participante?: number;
};

export type Alerta = {
  id: number;
  entrevista: number;
  participante: number;
  tipo_alerta: TipoAlerta | string;
  severidad: Severidad;
  origen: string;
  descripcion: string;
  evidencia_json?: EvidenciaJSON | Record<string, unknown>;
  timestamp_alerta: string;
  fecha_creacion: string;
};
