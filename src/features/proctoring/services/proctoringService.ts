import { aiApi } from "@/shared/lib/aiApi";
import type {
  FrameAnalysisResponse,
  ProctoringFrameDto,
  ProctoringJitsiEventDto,
  ProctoringWindowDto,
} from "../types";

export const proctoringService = {
  analyzeFrame: (dto: ProctoringFrameDto): Promise<FrameAnalysisResponse> =>
    aiApi.post<FrameAnalysisResponse>("/ia/proctoring/frame", dto).then((r) => r.data),

  reportWindowChange: (dto: ProctoringWindowDto): Promise<FrameAnalysisResponse> =>
    aiApi.post<FrameAnalysisResponse>("/ia/proctoring/window-change", dto).then((r) => r.data),

  reportJitsiEvent: (dto: ProctoringJitsiEventDto): Promise<FrameAnalysisResponse> =>
    aiApi.post<FrameAnalysisResponse>("/ia/proctoring/jitsi-event", dto).then((r) => r.data),
};
