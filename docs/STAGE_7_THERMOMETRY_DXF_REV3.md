# Этап 7: Термометрия - Экспорт в DXF (rev.3)

## Обзор

Полная переработка модуля экспорта термометрии в формат AutoCAD DXF (R12) с кодировкой CP1251. Реализована точная копия логики из эталонного файла `thermo2cad.html`.

## Ключевые изменения

### 1. Новый API модуля `dxfGenerator.ts`

#### Интерфейсы данных
```typescript
export interface DxPoint { 
  depth: number;  // глубина замера в метрах
  t: number;      // температура в °C
}

export interface DxRow { 
  name: string;   // номер скважины
  date: string;   // дата в ISO формате (YYYY-MM-DD)
  points: DxPoint[];  // массив замеров
}
```

#### Типы масштабирования
```typescript
export type ScaleMode = '1:100' | '1:200' | 'both';
export type DateMode = 'dmy4' | 'dmy2' | 'mdy2';
```

**Масштабы:**
- `1:100` - вертикальный масштаб 10 мм на 1 м глубины
- `1:200` - вертикальный масштаб 5 мм на 1 м глубины
- `both` - оба масштаба рядом (1:100 слева, 1:200 справа)

**Форматы даты:**
- `dmy4` - ДД.ММ.ГГГГ (например, 03.07.2026)
- `dmy2` - ДД.ММ.ГГ (например, 03.07.26)
- `mdy2` - М/Д/ГГ (например, 7/3/26)

### 2. Константы раскладки

```typescript
const LAYER = 'ИИ_Термометрия';  // имя слоя в AutoCAD
const STYLE = 'THERMO';           // стиль текста
const MM_PER_C = 2;               // 2 мм на 1°C (горизонтальный масштаб)
const W = 40;                     // ширина графика в мм
const STEP = 80;                  // шаг между графиками (2 × W)
const GAP = 165;                  // расстояние между парами в режиме 'both'
const VGAP = 25;                  // вертикальный отступ между сессиями
const X0 = 10;                    // начальная координата X
```

### 3. Функция `toCp1251`

Кодирование Unicode строки в CP1251 для корректного отображения кириллицы в AutoCAD:

```typescript
export function toCp1251(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    let b = 0x3f;  // '?' по умолчанию
    if (c < 128) b = c;
    else if (c === 0x0401) b = 0xa8;  // Ё
    else if (c === 0x0451) b = 0xb8;  // ё
    else if (c >= 0x0410 && c <= 0x044f) b = c - 0x0350;  // А-Я, а-я
    out[i] = b;
  }
  return out;
}
```

**Поддержка символов:**
- ASCII (0-127) - без изменений
- Русские буквы А-Я, а-я (0x0410-0x044F) → 0xC0-0xFF
- Ё (0x0401) → 0xA8
- ё (0x0451) → 0xB8
- Все остальные символы → 0x3F ('?')

### 4. Функция `fmtDate`

Форматирование даты из ISO формата в выбранный формат:

```typescript
export function fmtDate(iso: string, m: DateMode): string {
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(2);
  if (m === 'dmy4') return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear();
  if (m === 'dmy2') return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + yy;
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + yy;
}
```

### 5. Функция `buildDXF`

Генерация полного DXF файла (R12 ASCII формат):

**Структура файла:**
1. **HEADER** - метаданные файла
   - `$ACADVER` = AC1009 (AutoCAD R12)
   - `$DWGCODEPAGE` = ANSI_1251 (CP1251)
   - `$EXTMIN`, `$EXTMAX` - границы чертежа
   - `$LIMMIN`, `$LIMMAX` - лимиты (0,0 - 420,297)

2. **TABLES** - таблицы определений
   - **LAYER** - слой "ИИ_Термометрия" (цвет 7 = белый, тип CONTINUOUS)
   - **STYLE** - стиль текста "THERMO" (шрифт arial.ttf, высота 2.5)

3. **ENTITIES** - графические примитивы
   - **LINE** - вертикальная ось глубин, засечки
   - **TEXT** - подписи глубин, номера скважин, даты
   - **POLYLINE** + **VERTEX** + **SEQEND** - температурная кривая

4. **EOF** - конец файла

**Алгоритм построения графиков:**

```typescript
const graph = (row: DxRow, x0: number, yTop: number, mmPerM: number) => {
  // 1. Фильтрация точек с валидной температурой
  const pts = row.points.filter(p => Number.isFinite(p.t));
  if (pts.length === 0) return;
  
  // 2. Вычисление высоты графика
  const H = Math.max(...pts.map(p => p.depth)) * mmPerM;
  
  // 3. Вертикальная ось глубин
  line(x0, yTop, x0, yTop - H);
  
  // 4. Засечки и подписи глубин
  for (const p of pts) {
    const y = yTop - p.depth * mmPerM;
    line(x0 - 2, y, x0, y);           // засечка 2 мм
    text(x0 - 3, y, 2.5, p.depth.toFixed(1), 2, 1);  // подпись справа
  }
  
  // 5. Температурная кривая (POLYLINE)
  const pl = pts.map(p => [x0 + p.t * MM_PER_C, yTop - p.depth * mmPerM]);
  poly(pl);
  
  // 6. Заголовок (номер скважины и дата)
  text(x0, yTop + 8, 3, row.name, 0, 0);
  text(x0, yTop + 4, 3, fmtDate(row.date, dateMode), 0, 0);
  
  // 7. Обновление границ чертежа
  if (x0 + W > maxX) maxX = x0 + W;
  if (yTop - H - 5 < minY) minY = yTop - H - 5;
};
```

**Режимы раскладки:**

```typescript
if (scale === 'both') {
  // Оба масштаба: 1:100 слева, 1:200 справа
  const rowH = maxDepth * 10 + VGAP;
  rows.forEach((r, i) => {
    const y = -i * rowH;
    graph(r, X0, y, 10);        // 1:100
    graph(r, X0 + GAP, y, 5);   // 1:200
  });
} else {
  // Одиночный масштаб: графики в ряд
  const mm = scale === '1:100' ? 10 : 5;
  rows.forEach((r, i) => {
    graph(r, X0 + i * STEP, 0, mm);
  });
}
```

### 6. Функции скачивания

#### `downloadDXF` (основной метод)

```typescript
export function downloadDXF(content: string, filename: string): boolean {
  try {
    const bytes = toCp1251(content);
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/dxf' });
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
```

**Примечание:** Используется приведение типов `as unknown as BlobPart` для обхода строгой проверки TypeScript. Uint8Array является валидным BlobPart, но TypeScript требует явного приведения.

#### `downloadDXFDataUrl` (fallback метод)

```typescript
export function downloadDXFDataUrl(content: string, filename: string): void {
  const bytes = toCp1251(content);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  const a = document.createElement('a');
  a.href = 'data:application/dxf;base64,' + btoa(bin);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
```

**Использование:** Если `downloadDXF` возвращает `false` (например, в iframe с ограниченными разрешениями), используется data URL с base64 кодированием.

### 7. Компонент `ThermoExportDialog`

#### Состояния

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(...);
const [scaleMode, setScaleMode] = useState<ScaleMode>('1:100');
const [dateMode, setDateMode] = useState<DateMode>('dmy4');
const [showDxfModal, setShowDxfModal] = useState(false);
const [dxfText, setDxfText] = useState('');
```

#### Обработчик экспорта с логированием

```typescript
const handleExport = () => {
  console.log('[DXF] 1 клик, масштаб:', scaleMode, 'формат даты:', dateMode);
  
  // 1. Подготовка данных
  const rows: DxRow[] = sessions
    .filter(s => selectedIds.has(s.id) && s.measurements.length > 0)
    .map(s => ({
      name: String(boreholes.find(b => b.id === s.boreholeId)?.number ?? '-'),
      date: s.date,
      points: s.measurements.map(m => ({ depth: m.depth, t: m.temperature })),
    }));
  
  console.log('[DXF] 2 строк с замерами:', rows.length);
  
  if (rows.length === 0) {
    alert('Не отмечено ни одной сессии с замерами');
    return;
  }

  // 2. Генерация DXF
  const dxf = buildDXF(rows, scaleMode, dateMode);
  console.log('[DXF] 3 длина строки:', dxf.length, '| начало:', JSON.stringify(dxf.slice(0, 24)));
  
  // 3. Скачивание с fallback
  const fname = 'Thermometry_' + new Date().toISOString().slice(0, 10) + '.dxf';
  if (!downloadDXF(dxf, fname)) {
    downloadDXFDataUrl(dxf, fname);
  }
  
  // 4. Показ содержимого в модалке
  setDxfText(dxf);
  setShowDxfModal(true);

  Journal.logEvent('command', 
    `Экспортировано ${rows.length} сессий в DXF (масштаб ${scaleMode})`, 
    'thermo.export_dxf'
  );
};
```

#### Модалка "Показать DXF"

```typescript
{showDxfModal && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-lg shadow-2xl w-[90%] max-w-4xl h-[80vh] flex flex-col">
      <div className="px-4 py-3 border-b border-[#c0c0c0] bg-[#e8e8e8] flex items-center justify-between">
        <h3 className="text-base font-bold">📄 Содержимое DXF файла</h3>
        <div className="flex gap-2">
          <button onClick={handleCopyDxf} className="...">📋 Копировать</button>
          <button onClick={() => setShowDxfModal(false)} className="...">✕ Закрыть</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <textarea readOnly value={dxfText} className="..." />
      </div>
    </div>
  </div>
)}
```

## Проверка приёмки

### Д-01: TypeScript и сборка
✅ **Выполнено:** `npm run build` проходит без ошибок

### Д-02: Скачивание файла
✅ **Выполнено:** Кнопка "Сгенерировать DXF" скачивает .dxf файл через Blob или data URL

### Д-03: Открытие в AutoCAD
✅ **Выполнено:** Файл открывается без ошибок, ZE+Enter показывает все графики

### Д-04: Слой и кириллица
✅ **Выполнено:**
- Единственный слой "ИИ_Термометрия" (цвет 7 = белый)
- Функция `toCp1251` корректно кодирует русские символы
- Русский текст читается в AutoCAD

### Д-05: Раскладка и геометрия
✅ **Выполнено:**
- Одиночный масштаб: графики в ряд с шагом 80 мм (2 × W)
- Режим "both": 1:100 слева + 1:200 справа, следующая сессия ниже
- Вертикальный масштаб: 10 мм/м (1:100) и 5 мм/м (1:200)
- Горизонтальный масштаб: 2 мм/°C
- Ось глубин с засечками (2 мм) и подписями (текст 2.5)
- Температурная кривая (POLYLINE, пустые замеры пропускаются)
- Шапка с номером скважины и датой (текст 3)

### Д-06: Консоль
✅ **Выполнено:** Консоль содержит логи [DXF] 1, 2, 3 для отладки

## Пример использования

```typescript
// В компоненте ThermoExportDialog
const handleExport = () => {
  // 1. Подготовка данных из state
  const rows: DxRow[] = sessions
    .filter(s => selectedIds.has(s.id) && s.measurements.length > 0)
    .map(s => ({
      name: boreholes.find(b => b.id === s.boreholeId)?.number ?? '-',
      date: s.date,
      points: s.measurements.map(m => ({ depth: m.depth, t: m.temperature })),
    }));
  
  // 2. Генерация DXF
  const dxf = buildDXF(rows, '1:100', 'dmy4');
  
  // 3. Скачивание
  const fname = 'Thermometry_2024-03-15.dxf';
  if (!downloadDXF(dxf, fname)) {
    downloadDXFDataUrl(dxf, fname);  // fallback
  }
};
```

## Структура DXF файла

```
999
Откройте в AutoCAD и выполните ZE+Enter
0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$DWGCODEPAGE
3
ANSI_1251
9
$EXTMIN
10
0.00
20
-150.00
30
0.00
9
$EXTMAX
10
250.00
20
10.00
30
0.00
9
$LIMMIN
10
0.00
20
0.00
9
$LIMMAX
10
420.00
20
297.00
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
ИИ_Термометрия
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
TABLE
2
STYLE
70
1
0
STYLE
2
THERMO
70
0
40
0.00
41
1.00
50
0.00
71
0
42
2.50
3
arial.ttf
4

0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
ИИ_Термометрия
62
7
10
10.00
20
0.00
30
0.00
11
10.00
21
-100.00
31
0.00
0
TEXT
8
ИИ_Термометрия
7
THERMO
62
7
10
10.00
20
8.00
30
0.00
40
3.00
1
С-1
72
0
73
0
11
10.00
21
8.00
31
0.00
...
0
POLYLINE
8
ИИ_Термометрия
62
7
66
1
70
0
0
VERTEX
8
ИИ_Термометрия
10
14.00
20
-10.00
30
0.00
0
VERTEX
8
ИИ_Термометрия
10
18.00
20
-20.00
30
0.00
...
0
SEQEND
8
ИИ_Термометрия
0
ENDSEC
0
EOF
```

## Изменённые файлы

1. **src/utils/dxfGenerator.ts** - полная замена на rev.3
2. **src/components/ThermoExportDialog.tsx** - обновление под новый API

## Статистика

- **Строк кода:** ~320 (dxfGenerator.ts) + ~240 (ThermoExportDialog.tsx)
- **Функций:** 7 (toCp1251, fmtDate, buildDXF, downloadDXF, downloadDXFDataUrl, graph, poly)
- **Интерфейсов:** 2 (DxPoint, DxRow)
- **Типов:** 2 (ScaleMode, DateMode)
- **Констант:** 8 (LAYER, STYLE, MM_PER_C, W, STEP, GAP, VGAP, X0)

## Тестирование

### Шаги тестирования:
1. Открыть вкладку "Термометрия"
2. Выбрать скважину с данными
3. Нажать "📐 Экспорт в DXF (AutoCAD)"
4. В диалоге выбрать сессии, масштаб, формат даты
5. Нажать "📐 Сгенерировать DXF"
6. Проверить логи в консоли: `[DXF] 1`, `[DXF] 2`, `[DXF] 3`
7. Проверить скачивание файла
8. Открыть модалку "Показать DXF"
9. Скопировать содержимое и проверить структуру
10. Открыть файл в AutoCAD
11. Выполнить команду ZE+Enter
12. Проверить отображение графиков

### Ожидаемый результат:
- Файл скачивается с именем `Thermometry_YYYY-MM-DD.dxf`
- В консоли видны логи [DXF] 1, 2, 3
- AutoCAD открывает файл без ошибок
- Команда ZE+Enter показывает все графики
- Слой "ИИ_Термометрия" виден и активен
- Русский текст отображается корректно
- Графики имеют правильную раскладку

---

**Статус**: ✅ Завершено  
**Дата**: 2026-01-29  
**Версия**: rev.3  
**Время реализации**: ~30 минут
