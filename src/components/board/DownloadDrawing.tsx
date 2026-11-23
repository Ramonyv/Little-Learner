import { playEffect } from '../../utils/soundEffects';
import { useState } from 'react';

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function pdf(jpeg: Uint8Array, width: number, height: number) {
  const encode = (text: string) => new TextEncoder().encode(text);
  const parts: Uint8Array[] = [encode('%PDF-1.4\n')];
  const offsets = [0];
  let length = parts[0].length;
  const pageWidth = 595;
  const pageHeight = pageWidth * height / width;
  const commands = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Image Do Q`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Image 4 0 R >> >> /Contents 5 0 R >>`,
  ];
  function append(bytes: Uint8Array) { parts.push(bytes); length += bytes.length; }
  objects.forEach((body, index) => {
    offsets.push(length);
    append(encode(`${index+1} 0 obj\n${body}\nendobj\n`));
  });
  offsets.push(length);
  append(encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`));
  append(jpeg);
  append(encode('\nendstream\nendobj\n'));
  offsets.push(length);
  append(encode(`5 0 obj\n<< /Length ${commands.length} >>\nstream\n${commands}\nendstream\nendobj\n`));
  const start = length;
  append(encode('xref\n0 6\n0000000000 65535 f \n' + offsets.slice(1).map(offset => String(offset).padStart(10,'0') + ' 00000 n \n').join('') + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`));
  return new Blob(parts, { type: 'application/pdf' });
}

export function DownloadDrawing() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function download(button: HTMLButtonElement, format: string) {
    const board = button.closest('.board-paper') as HTMLElement;
    if (!board) return;
    setBusy(true);
    setError('');
    try {
      const rect = board.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const scale = Math.min(2, 4096 / Math.max(rect.width, rect.height));
      canvas.width = Math.round(rect.width * scale);
      canvas.height = Math.round(rect.height * scale);
      const context = canvas.getContext('2d')!;
      context.scale(scale, scale);
      context.fillStyle = board.classList.contains('dark') ? '#004d3d' : '#ffffff';
      context.fillRect(0, 0, rect.width, rect.height);
      for (const layer of board.querySelectorAll('canvas, svg.board-guide, img.board-guide')) {
        if (layer.classList.contains('db2-trace-image')) continue;
        const bounds = layer.getBoundingClientRect();
        const x = bounds.left - rect.left, y = bounds.top - rect.top;
        if (layer instanceof HTMLCanvasElement) {
          if (getComputedStyle(layer).objectFit === 'contain') {
            const fit = Math.min(bounds.width / layer.width, bounds.height / layer.height);
            const width = layer.width * fit, height = layer.height * fit;
            context.drawImage(layer, x + (bounds.width - width) / 2, y + (bounds.height - height) / 2, width, height);
          } else {
            context.drawImage(layer, x, y, bounds.width, bounds.height);
          }
        } else {
          const image = new Image();
          let source: string;
          if (layer instanceof SVGElement) {
            const clone = layer.cloneNode(true) as SVGElement;
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.style.color = getComputedStyle(layer).color;
            clone.style.fontFamily = getComputedStyle(layer).fontFamily;
            source = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
          } else source = (layer as HTMLImageElement).src;
          await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = source; });
          if (layer instanceof HTMLImageElement) context.globalCompositeOperation = 'multiply';
          const fit = Math.min(bounds.width/image.width, bounds.height/image.height);
          context.drawImage(image, x+(bounds.width-image.width*fit)/2, y+(bounds.height-image.height*fit)/2, image.width*fit, image.height*fit);
          context.globalCompositeOperation = 'source-over';
          if (source.startsWith('blob:')) URL.revokeObjectURL(source);
        }
      }
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Export failed')), 'image/jpeg', .95));
      const filename = 'little-learner-drawing';
      save(format === 'pdf' ? pdf(new Uint8Array(await blob.arrayBuffer()), canvas.width, canvas.height) : blob, filename + '.' + format);
      void playEffect('work-saved');
    } catch {
      setError('Could not download. Please try again.');
    } finally { setBusy(false); }
  }
  return <details className="drawing-download"><summary>Download ↓</summary><div>
    {['jpg','pdf'].map(format => <button key={format} disabled={busy} onClick={event => download(event.currentTarget, format)}>Save {format.toUpperCase()}</button>)}
    {error && <p role="alert">{error}</p>}
  </div></details>;
}
