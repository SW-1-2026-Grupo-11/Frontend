import { PROCTORING } from "@/config/constants";

export function captureFrameFromVideo(video: HTMLVideoElement): string | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  const scale = Math.min(
    PROCTORING.CAPTURE_WIDTH / video.videoWidth,
    PROCTORING.CAPTURE_HEIGHT / video.videoHeight,
    1,
  );
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", PROCTORING.JPEG_QUALITY);
  const base64 = dataUrl.split(",")[1];
  return base64 ?? null;
}
