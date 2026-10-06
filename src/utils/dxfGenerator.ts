// GeoLog 7.4 dxfGenerator.ts rev.3 | экспорт термометрии в AutoCAD (DXF R12, CP1251)
export interface DxPoint { depth: number; t: number; }
export interface DxRow { name: string; date: string; points: DxPoint[]; }
export type ScaleMode = '1:100' | '1:200' | 'both';
export type DateMode = 'dmy4' | 'dmy2' | 'mdy2';

const LAYER = 'ИИ_Термометрия';
const STYLE = 'THERMO';
const MM_PER_C = 2;
const W = 40;
const STEP = 80;
const GAP = 165;
const VGAP = 25;
const X0 = 10;

export function toCp1251(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    let b = 0x3f;
    if (c < 128) b = c;
    else if (c === 0x0401) b = 0xa8;
    else if (c === 0x0451) b = 0xb8;
    else if (c >= 0x0410 && c <= 0x044f) b = c - 0x0350;
    out[i] = b;
  }
  return out;
}

const p2 = (n: number) => String(n).padStart(2, '0');
export function fmtDate(iso: string, m: DateMode): string {
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(2);
  if (m === 'dmy4') return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear();
  if (m === 'dmy2') return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + yy;
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + yy;
}

export function buildDXF(rows: DxRow[], scale: ScaleMode, dateMode: DateMode): string {
  const ent: string[] = [];
  const push = (c: number, v: string | number) => { ent.push(String(c), String(v)); };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    push(0, 'LINE'); push(8, LAYER); push(62, 7);
    push(10, x1.toFixed(2)); push(20, y1.toFixed(2)); push(30, '0.00');
    push(11, x2.toFixed(2)); push(21, y2.toFixed(2)); push(31, '0.00');
  };
  const text = (x: number, y: number, h: number, s: string, ah: number, av: number) => {
    push(0, 'TEXT'); push(8, LAYER); push(7, STYLE); push(62, 7);
    push(10, x.toFixed(2)); push(20, y.toFixed(2)); push(30, '0.00');
    push(40, h.toFixed(2)); push(1, s); push(72, ah); push(73, av);
    push(11, x.toFixed(2)); push(21, y.toFixed(2)); push(31, '0.00');
  };
  const poly = (pts: Array<[number, number]>) => {
    if (pts.length < 2) { return; }
    push(0, 'POLYLINE'); push(8, LAYER); push(62, 7); push(66, 1); push(70, 0);
    for (const pt of pts) { push(0, 'VERTEX'); push(8, LAYER); push(10, pt[0].toFixed(2)); push(20, pt[1].toFixed(2)); push(30, '0.00'); }
    push(0, 'SEQEND'); push(8, LAYER);
  };
  let maxX = 0;
  let minY = 0;
  const graph = (row: DxRow, x0: number, yTop: number, mmPerM: number) => {
    const pts = row.points.filter(p => Number.isFinite(p.t));
    if (pts.length === 0) { return; }
    const H = Math.max(...pts.map(p => p.depth)) * mmPerM;
    line(x0, yTop, x0, yTop - H);
    for (const p of pts) {
      const y = yTop - p.depth * mmPerM;
      line(x0 - 2, y, x0, y);
      text(x0 - 3, y, 2.5, p.depth.toFixed(1), 2, 1);
    }
    const pl: Array<[number, number]> = pts.map(p => [x0 + p.t * MM_PER_C, yTop - p.depth * mmPerM]);
    poly(pl);
    text(x0, yTop + 8, 3, row.name, 0, 0);
    text(x0, yTop + 4, 3, fmtDate(row.date, dateMode), 0, 0);
    if (x0 + W > maxX) { maxX = x0 + W; }
    if (yTop - H - 5 < minY) { minY = yTop - H - 5; }
  };
  const maxDepth = rows.length ? Math.max(0, ...rows.flatMap(r => r.points.map(p => p.depth))) : 0;
  if (scale === 'both') {
    const rowH = maxDepth * 10 + VGAP;
    rows.forEach((r, i) => { const y = -i * rowH; graph(r, X0, y, 10); graph(r, X0 + GAP, y, 5); });
  } else {
    const mm = scale === '1:100' ? 10 : 5;
    rows.forEach((r, i) => { graph(r, X0 + i * STEP, 0, mm); });
  }
  const out: string[] = [];
  const h = (c: number, v: string | number) => { out.push(String(c), String(v)); };
  h(999, 'Откройте в AutoCAD и выполните ZE+Enter');
  h(0, 'SECTION'); h(2, 'HEADER');
  h(9, '$ACADVER'); h(1, 'AC1009');
  h(9, '$DWGCODEPAGE'); h(3, 'ANSI_1251');
  h(9, '$EXTMIN'); h(10, '0.00'); h(20, (minY - 10).toFixed(2)); h(30, '0.00');
  h(9, '$EXTMAX'); h(10, (maxX + 10).toFixed(2)); h(20, '10.00'); h(30, '0.00');
  h(9, '$LIMMIN'); h(10, '0.00'); h(20, '0.00');
  h(9, '$LIMMAX'); h(10, '420.00'); h(20, '297.00');
  h(0, 'ENDSEC');
  h(0, 'SECTION'); h(2, 'TABLES');
  h(0, 'TABLE'); h(2, 'LAYER'); h(70, 1);
  h(0, 'LAYER'); h(2, LAYER); h(70, 0); h(62, 7); h(6, 'CONTINUOUS');
  h(0, 'ENDTAB');
  h(0, 'TABLE'); h(2, 'STYLE'); h(70, 1);
  h(0, 'STYLE'); h(2, STYLE); h(70, 0); h(40, '0.00'); h(41, '1.00'); h(50, '0.00'); h(71, 0); h(42, '2.50'); h(3, 'arial.ttf'); h(4, '');
  h(0, 'ENDTAB');
  h(0, 'ENDSEC');
  h(0, 'SECTION'); h(2, 'ENTITIES');
  for (const s of ent) { out.push(s); }
  h(0, 'ENDSEC');
  h(0, 'EOF');
  return out.join('\n') + '\n';
}

export function downloadDXF(content: string, filename: string): boolean {
  try {
    const bytes = toCp1251(content);
    const blob = new Blob([bytes as any], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch (e) {
    console.error('[DXF] ошибка blob-скачивания:', e);
    return false;
  }
}

export function downloadDXFDataUrl(content: string, filename: string): void {
  const bytes = toCp1251(content);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) { bin += String.fromCharCode(bytes[i]); }
  const a = document.createElement('a');
  a.href = 'data:application/dxf;base64,' + btoa(bin);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
// Конец файла
