export interface RecordingSession {
  stop: () => void;
}

export function isRecordingSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype
  );
}

export function startStageRecording(
  canvas: HTMLCanvasElement,
  durationMs = 6000,
  onTickSeconds: (remaining: number) => void,
  onComplete: (blob: Blob | null, ext: string, error?: string) => void,
): RecordingSession | null {
  if (!isRecordingSupported()) {
    onComplete(null, 'webm', 'Video recording is not supported in this browser.');
    return null;
  }

  const mimeCandidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

  try {
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    let stopped = false;
    const endTime = Date.now() + durationMs;
    const interval = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      onTickSeconds(rem);
    }, 250);

    const stopTimeout = window.setTimeout(() => {
      if (!stopped && recorder.state !== 'inactive') {
        stopped = true;
        recorder.stop();
      }
    }, durationMs);

    recorder.onstop = () => {
      window.clearInterval(interval);
      window.clearTimeout(stopTimeout);
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      onComplete(blob, ext);
    };

    recorder.onerror = () => {
      window.clearInterval(interval);
      window.clearTimeout(stopTimeout);
      stream.getTracks().forEach((t) => t.stop());
      onComplete(null, ext, 'Could not record video on this device.');
    };

    onTickSeconds(Math.ceil(durationMs / 1000));
    recorder.start(250);

    return {
      stop: () => {
        if (!stopped && recorder.state !== 'inactive') {
          stopped = true;
          recorder.stop();
        }
      },
    };
  } catch {
    onComplete(null, ext, 'Video recording is not available on this browser.');
    return null;
  }
}

export function downloadVideoBlob(blob: Blob, ext: string, filename = 'jugnu-animation'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
