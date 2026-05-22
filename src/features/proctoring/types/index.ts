export type FrameAnalysisResponse = {
  success: boolean;
  alerta: boolean;
  mensaje?: string;
  tipo_alerta?: string;
  severidad?: string;
};

/** El servicio de IA espera IDs como string en el body JSON. */
export type ProctoringFrameDto = {
  entrevista_id: string;
  participante_id: string;
  frame: string;
  timestamp: string;
  session_id?: string;
};

export type ProctoringWindowDto = {
  entrevista_id: string;
  participante_id: string;
  evento: string;
  timestamp: string;
  session_id?: string;
};

export type ProctoringJitsiEventDto = {
  entrevista_id: string;
  participante_id: string;
  tipo_evento: string;
  valor: string;
  timestamp: string;
  session_id?: string;
};
