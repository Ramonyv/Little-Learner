export function exportTransparentPng(canvas: HTMLCanvasElement, filename = 'jugnu-drawing.png'): void {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
