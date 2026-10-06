// Генератор DXF файлов для термометрии
// Порт логики из thermo2cad.html (эталон)
// Этап 7: Экспорт в AutoCAD

import { Borehole, ThermoSession } from '../core/dataStore';

const LAYER_NAME = 'ИИ_Термометрия';
const STYLE_NAME = 'THERMO';

export type ScaleMode = '100' | '200' | 'both';
export type DateFormat = 'dmy4' | 'dmy2' | 'mdy';

// Интерфейс для передачи данных в генератор
export interface ThermoExportEntry {
  name: string; // № скважины
  date: string; // дата в выбранном формате
  grid: Array<{ d: number; t: number | null }>; // замеры
}

// Кодировка CP1251 для кириллицы в AutoCAD
function toCp1251(s: string): Uint8Array {
  const out: number[] = [];
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    let b: number;
    if (c < 0x80) b = c;
    else if (c >= 0x0410 && c <= 0x042F) b = 0xC0 + (c - 0x0410);
    else if (c >= 0x0430 && c <= 0x044F) b = 0xE0 + (c - 0x0430);
    else if (c === 0x0401) b = 0xA8;
    else if (c === 0x0451) b = 0xB8;
    else if (c === 0x2116) b = 0xB9;
    else if (c === 0x00B0) b = 0xB0;
    else if (c === 0x2013) b = 0x96;
    else if (c === 0x2014) b = 0x97;
    else if (c === 0x00AB) b = 0xAB;
    else if (c === 0x00BB) b = 0xBB;
    else b = 0x3F;
    out.push(b);
  }
  return new Uint8Array(out);
}

// Форматирование даты
export function formatDate(dateStr: string, mode: DateFormat): string {
  if (!dateStr) return '';
  
  // Парсинг даты из разных форматов
  let dateObj: Date | null = null;
  
  // ISO формат YYYY-MM-DD
  let m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    dateObj = new Date(+m[1], +m[2] - 1, +m[3]);
  }
  
  // Формат ДД.ММ.ГГГГ
  if (!dateObj) {
    m = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
    if (m) {
      let y = +m[3];
      if (y < 100) y += (y > 50 ? 1900 : 2000);
      dateObj = new Date(y, +m[2] - 1, +m[1]);
    }
  }
  
  // Формат M/D/YY
  if (!dateObj) {
    m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      let y = +m[3];
      if (y < 100) y += (y > 50 ? 1900 : 2000);
      dateObj = new Date(y, +m[1] - 1, +m[2]);
    }
  }
  
  if (!dateObj) return dateStr;
  
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yy = String(dateObj.getFullYear()).slice(2);
  const yyyy = dateObj.getFullYear();
  
  if (mode === 'dmy4') return `${dd}.${mm}.${yyyy}`;
  if (mode === 'dmy2') return `${dd}.${mm}.${yy}`;
  return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${yy}`;
}

// Подготовка данных для экспорта
export function prepareExportData(
  boreholes: Borehole[],
  sessions: ThermoSession[],
  dateFormat: DateFormat
): ThermoExportEntry[] {
  return sessions.map(session => {
    const borehole = boreholes.find(b => b.id === session.boreholeId);
    const name = borehole ? borehole.number : 'Неизвестная';
    const date = formatDate(session.date, dateFormat);
    
    // Сортируем замеры по глубине
    const sortedMeasurements = [...session.measurements].sort((a, b) => a.depth - b.depth);
    
    // Создаём grid с null для пустых значений
    const grid = sortedMeasurements.map(m => ({
      d: m.depth,
      t: m.temperature
    }));
    
    return { name, date, grid };
  });
}

// DXF TEXT примитив
function T(x: number, y: number, h: number, s: string, color: number, ah?: number, av?: number, ax?: number): string {
  ah = ah === undefined ? 0 : ah;
  av = av === undefined ? 2 : av;
  let e = `0\nTEXT\n8\n${LAYER_NAME}\n7\n${STYLE_NAME}\n62\n${color}\n`;
  e += `10\n${x.toFixed(2)}\n20\n${y.toFixed(2)}\n30\n0.0\n`;
  e += `40\n${h.toFixed(2)}\n1\n${s}\n`;
  e += `72\n${ah}\n73\n${av}\n`;
  e += `11\n${(ax !== undefined ? ax : x).toFixed(2)}\n21\n${y.toFixed(2)}\n31\n0.0\n`;
  return e;
}

// DXF LINE примитив
function L(x1: number, y1: number, x2: number, y2: number, color: number): string {
  return `0\nLINE\n8\n${LAYER_NAME}\n62\n${color}\n` +
    `10\n${x1.toFixed(2)}\n20\n${y1.toFixed(2)}\n30\n0.0\n` +
    `11\n${x2.toFixed(2)}\n21\n${y2.toFixed(2)}\n31\n0.0\n`;
}

// Форматирование значения температуры
function fmtVal(t: number): string {
  return t < 0 ? t.toFixed(2) : (' ' + t.toFixed(2));
}

// Генерация табличного графика для одной сессии
function tableDXF(e: ThermoExportEntry, ox: number, oy: number, u: number): string {
  const TH = Math.min(2.5, 0.5 * u * 0.7);
  const TTH = TH * 1.4;
  const charW = TH * 0.62;
  const k = TH / 2.5;
  
  let s = '';
  
  // Заголовок
  s += T(ox, oy, TTH, 'Результаты замеров термометрии', 7, 1, 2, ox);
  
  // Подзаголовок
  const p1 = '\u2116 скважины ';
  const p2 = `${e.name}  ${e.date}`;
  const p3 = 'Дата замера';
  const y2 = oy - 4 * k;
  const cx = ox;
  const G = p2.length * charW / 2 + TH;
  
  s += T(cx - G, y2, TH, p1, 7, 2, 2, cx - G);
  s += T(cx, y2, TH, p2, 1, 1, 2, cx);
  s += T(cx + G, y2, TH, p3, 7, 0, 2, cx + G);
  
  // Заголовки колонок
  const yH = oy - 8 * k;
  s += T(ox - 3 * k, yH, TH, 'Глубина замера, м', 7, 2, 2, ox - 3 * k);
  s += T(ox + 3 * k, yH, TH, 'Результаты замеров, \u00B0C', 7, 0, 2, ox + 3 * k);
  
  // Данные
  const y0 = oy - 13 * k;
  const yOf = (d: number) => y0 - d * u;
  
  const data = e.grid.filter(r => r.t !== null);
  if (!data.length) return s;
  
  const firstD = data[0].d;
  const lastD = data[data.length - 1].d;
  
  // Вертикальная ось
  s += L(ox, yOf(firstD) + 0.5 * u, ox, yOf(lastD), 1);
  
  // Засечки и подписи
  data.forEach(r => {
    const y = yOf(r.d);
    s += L(ox - 1.5 * k, y, ox + 1.5 * k, y, 1);
    s += T(ox + 2 * k, y, TH, fmtVal(r.t!), 1, 0, 0, ox + 2 * k);
    s += T(ox - 2 * k, y, TH, r.d.toFixed(1), 1, 2, 0, ox - 2 * k);
  });
  
  return s;
}

// Высота табличного графика
function tableHeight(e: ThermoExportEntry, u: number): number {
  const data = e.grid.filter(r => r.t !== null);
  return (data.length ? data[data.length - 1].d : 0) * u + 40;
}

// Секция TABLES (LAYER и STYLE)
function tablesSection(): string {
  return '0\nSECTION\n2\nTABLES\n' +
    '0\nTABLE\n2\nLAYER\n70\n2\n' +
    '0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n' +
    `0\nLAYER\n2\n${LAYER_NAME}\n70\n0\n62\n7\n6\nCONTINUOUS\n` +
    '0\nENDTAB\n' +
    '0\nTABLE\n2\nSTYLE\n70\n1\n' +
    `0\nSTYLE\n2\n${STYLE_NAME}\n70\n0\n40\n0\n41\n1\n50\n0\n71\n0\n42\n2.5\n3\narial.ttf\n` +
    '0\nENDTAB\n' +
    '0\nENDSEC\n';
}

// Сборка полного DXF файла
export function buildDXF(list: ThermoExportEntry[], mode: ScaleMode): string {
  console.log('🔨 buildDXF вызвана с', list.length, 'записями, режим:', mode);
  
  let ent = '';
  let nx = 0;
  let nyBot = 0;
  
  if (mode === 'both') {
    console.log('📐 Режим "оба": 1:100 слева + 1:200 справа');
    // Режим "оба": 1:100 слева + 1:200 справа
    const GAP = 165;
    const VGAP = 25;
    let y = 0;
    
    list.forEach((e, idx) => {
      console.log(`  Обработка записи ${idx + 1}:`, e.name, e.date);
      const h100 = tableHeight(e, 10);
      const h5 = tableHeight(e, 5);
      console.log(`    Высота 1:100: ${h100}, 1:200: ${h5}`);
      ent += tableDXF(e, 0, y, 10);
      ent += tableDXF(e, GAP, y, 5);
      y -= (Math.max(h100, h5) + VGAP);
    });
    
    nx = GAP + 60;
    nyBot = y;
  } else {
    console.log(`📐 Одиночный масштаб 1:${mode}`);
    // Одиночный масштаб: сетка 4 колонки
    const u = mode === '200' ? 5 : 10;
    const COLS = 4;
    const SLOT_W = 110;
    
    const slots = Math.ceil(list.length / COLS);
    console.log(`  Сетка: ${slots} рядов × ${COLS} колонок`);
    
    const slotH: Record<number, number> = {};
    list.forEach((e, i) => {
      const sl = Math.floor(i / COLS);
      slotH[sl] = Math.max(slotH[sl] || 0, tableHeight(e, u));
    });
    
    const slotY: Record<number, number> = {};
    let acc = 0;
    for (let sl = 0; sl < slots; sl++) {
      slotY[sl] = -acc;
      acc += slotH[sl] + 20;
    }
    
    list.forEach((e, i) => {
      ent += tableDXF(e, (i % COLS) * SLOT_W, slotY[Math.floor(i / COLS)], u);
    });
    
    nx = (Math.min(list.length, COLS) - 1) * SLOT_W + 90;
    nyBot = -acc;
  }
  
  console.log('📊 Габариты: nx =', nx, ', nyBot =', nyBot);
  console.log('📝 Entities длина:', ent.length);
  
  // HEADER секция
  const header = '0\nSECTION\n2\nHEADER\n' +
    '9\n$ACADVER\n1\nAC1009\n' +
    '9\n$DWGCODEPAGE\n3\nANSI_1251\n' +
    `9\n$EXTMIN\n10\n-40.0\n20\n${nyBot.toFixed(1)}\n30\n0.0\n` +
    `9\n$EXTMAX\n10\n${nx.toFixed(1)}\n20\n20.0\n30\n0.0\n` +
    '0\nENDSEC\n';
  
  // ENTITIES секция
  const entities = '0\nSECTION\n2\nENTITIES\n' + ent + '0\nENDSEC\n';
  
  // Комментарий в начале файла
  const comment = '999\nОткройте в AutoCAD и выполните ZE+Enter\n';
  
  const result = comment + header + tablesSection() + entities + '0\nEOF\n';
  console.log('✅ DXF файл собран, общая длина:', result.length);
  
  return result;
}

// Скачивание DXF файла
export function downloadDXF(dxf: string, fileName: string): void {
  console.log('📥 downloadDXF вызвана с файлом:', fileName);
  console.log('📏 Длина DXF строки:', dxf.length);
  
  try {
    const encoded = toCp1251(dxf);
    console.log('🔤 Кодирование CP1251 завершено, размер:', encoded.length, 'байт');
    
    // Используем slice() для создания копии и получаем её buffer
    const arrayBuffer = encoded.slice().buffer;
    const blob = new Blob([arrayBuffer], { type: 'application/dxf' });
    console.log('📦 Blob создан, размер:', blob.size, 'байт');
    
    const url = URL.createObjectURL(blob);
    console.log('🔗 URL создан:', url);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    console.log('🖱️ Клик по ссылке...');
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Скачивание инициировано');
  } catch (error) {
    console.error('❌ Ошибка при скачивании DXF:', error);
    alert('Ошибка при создании файла DXF: ' + (error as Error).message);
  }
}
