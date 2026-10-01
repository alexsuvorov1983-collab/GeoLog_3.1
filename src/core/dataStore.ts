// GeoLog.Data (1.1) — хранилище данных со схемой v1.4
// GeoLog 7.4 main.tsx rev.2 (01.10.2026) | schema v1.4
import { bus } from './eventBus';
import { Journal } from './journal';

const STORAGE_KEY = 'geolog_state_v1.4';
const OLD_STORAGE_KEY = 'geolog_state_v1.3';

// Схема v1.3 — поля скважины
export interface Borehole {
  id: string;
  number: string;
  norm_key?: string;
  depth_m: number;
  elev_m: number;
  x: number;
  y: number;
  wgs84_lon?: number;
  wgs84_lat?: number;
  date?: string; // ДД.ММ.ГГГГ
  end_date?: string; // ДД.ММ.ГГГГ
  casing_depth_m?: number;
  reaming_m?: number;
  gso_m?: number;
  gsp_m?: number;
  mmg_m?: number;
  gso_manual?: boolean;
  gsp_manual?: boolean;
  mmg_manual?: boolean;
  modified_at?: string;
  rev?: number;
  source?: string;
  user?: string;
  // Soil layers
  soil_layers?: SoilLayer[];
  // Water layers
  water_layers?: WaterLayer[];
  // Samples
  samples?: Sample[];
  // Thermometry
  thermometry?: ThermometryEntry[];
}

export interface SoilLayer {
  id: string;
  borehole_id: string;
  depth_from_m: number;
  depth_to_m: number;
  ground_type: string;
  ige_code?: string;
  classification?: string;
  description?: string;
}

export interface WaterLayer {
  id: string;
  borehole_id: string;
  depth_m: number;
  water_type: string;
}

export interface Sample {
  id: string;
  borehole_id: string;
  depth_m: number;
  sample_type: string;
  lab_number?: string;
}

export interface ThermometryEntry {
  id: string;
  borehole_id: string;
  depth_m: number;
  temperature_c: number;
}

// Справочники
export interface DictItem {
  id: string;
  name: string;
}

export interface IGEItem {
  code: string;
  name: string;
}

// Фикстура — 5 скважин (2.1)
const fixtureBoreholes: Borehole[] = [
  {
    id: 'bh-001', number: 'С-1', norm_key: 'СК-001',
    depth_m: 15.50, elev_m: 142.30, x: 554321.12, y: 6178234.45,
    wgs84_lon: 37.6173, wgs84_lat: 55.7558,
    date: '15.03.2024', casing_depth_m: 5.00, reaming_m: 0.50,
    gso_m: 3.20, gsp_m: 8.50, mmg_m: 12.00,
    modified_at: '15.03.2024 14:30:00', rev: 1, user: 'Инженер',
    soil_layers: [
      { id: 'sl-001', borehole_id: 'bh-001', depth_from_m: 0, depth_to_m: 2.5, ground_type: 'Насыпной грунт', ige_code: 'ИГЭ-1', classification: 'Суглинок полутвёрдый', description: 'ПРС: Супесь коричневая пластичная, с корнями растений' },
      { id: 'sl-002', borehole_id: 'bh-001', depth_from_m: 2.5, depth_to_m: 7.0, ground_type: 'Суглинок', ige_code: 'ИГЭ-2', classification: 'Суглинок тугопластичный', description: 'Суглинок тугопластичный, коричневый, с гравием и галькой до 10%' },
      { id: 'sl-003', borehole_id: 'bh-001', depth_from_m: 7.0, depth_to_m: 15.5, ground_type: 'Песок мелкий', ige_code: 'ИГЭ-3', classification: 'Песок пылеватый средней плотности', description: 'Песок пылеватый средней плотности неоднородный насыщенный водой, с прослоями супеси серой текучей, суглинка серого текучего' },
    ],
    water_layers: [
      { id: 'wl-001', borehole_id: 'bh-001', depth_m: 3.20, water_type: 'Верховодка' },
      { id: 'wl-002', borehole_id: 'bh-001', depth_m: 8.50, water_type: 'Грунтовые' },
    ],
    samples: [
      { id: 'sp-001', borehole_id: 'bh-001', depth_m: 3.0, sample_type: 'Нарушенный', lab_number: 'Л-001' },
      { id: 'sp-002', borehole_id: 'bh-001', depth_m: 7.5, sample_type: 'Монолит', lab_number: 'Л-002' },
      { id: 'sp-003', borehole_id: 'bh-001', depth_m: 8.0, sample_type: 'water', lab_number: 'В-1' },
    ],
    thermometry: [
      { id: 'th-001', borehole_id: 'bh-001', depth_m: 5.0, temperature_c: 8.2 },
      { id: 'th-002', borehole_id: 'bh-001', depth_m: 10.0, temperature_c: 9.5 },
    ],
  },
  {
    id: 'bh-002', number: 'С-2', norm_key: 'СК-002',
    depth_m: 22.00, elev_m: 140.80, x: 554345.67, y: 6178267.89,
    wgs84_lon: 37.6179, wgs84_lat: 55.7561,
    date: '16.03.2024', casing_depth_m: 8.00, reaming_m: 0.30,
    gso_m: 4.10, gsp_m: 10.20, mmg_m: 18.50,
    modified_at: '16.03.2024 09:15:00', rev: 2, user: 'Инженер',
    soil_layers: [
      { id: 'sl-004', borehole_id: 'bh-002', depth_from_m: 0, depth_to_m: 3.0, ground_type: 'Насыпной грунт' },
      { id: 'sl-005', borehole_id: 'bh-002', depth_from_m: 3.0, depth_to_m: 12.0, ground_type: 'Глина', description: 'Глина твёрдая' },
      { id: 'sl-006', borehole_id: 'bh-002', depth_from_m: 12.0, depth_to_m: 22.0, ground_type: 'Песок крупный' },
    ],
    water_layers: [
      { id: 'wl-003', borehole_id: 'bh-002', depth_m: 4.10, water_type: 'Верховодка' },
    ],
    samples: [
      { id: 'sp-003', borehole_id: 'bh-002', depth_m: 5.0, sample_type: 'Монолит', lab_number: 'Л-003' },
    ],
    thermometry: [],
  },
  {
    id: 'bh-003', number: 'С-3', norm_key: 'СК-003',
    depth_m: 10.00, elev_m: 143.50, x: 554389.23, y: 6178212.56,
    wgs84_lon: 37.6188, wgs84_lat: 55.7556,
    date: '17.03.2024', casing_depth_m: 3.00, reaming_m: 0.00,
    gso_m: 2.80, gsp_m: 6.50, mmg_m: 8.00,
    modified_at: '17.03.2024 11:45:00', rev: 1, user: 'Геолог',
    soil_layers: [
      { id: 'sl-007', borehole_id: 'bh-003', depth_from_m: 0, depth_to_m: 1.5, ground_type: 'Растительный слой' },
      { id: 'sl-008', borehole_id: 'bh-003', depth_from_m: 1.5, depth_to_m: 10.0, ground_type: 'Супесь', description: 'Супесь пластичная' },
    ],
    water_layers: [
      { id: 'wl-004', borehole_id: 'bh-003', depth_m: 2.80, water_type: 'Грунтовые' },
    ],
    samples: [
      { id: 'sp-004', borehole_id: 'bh-003', depth_m: 2.0, sample_type: 'Нарушенный', lab_number: 'Л-004' },
      { id: 'sp-005', borehole_id: 'bh-003', depth_m: 5.0, sample_type: 'Монолит', lab_number: 'Л-005' },
    ],
    thermometry: [
      { id: 'th-003', borehole_id: 'bh-003', depth_m: 5.0, temperature_c: 7.8 },
    ],
  },
  {
    id: 'bh-004', number: 'С-4', norm_key: 'СК-004',
    depth_m: 30.00, elev_m: 138.20, x: 554412.89, y: 6178290.12,
    wgs84_lon: 37.6194, wgs84_lat: 55.7563,
    date: '18.03.2024', casing_depth_m: 12.00, reaming_m: 1.00,
    gso_m: 5.50, gsp_m: 14.00, mmg_m: 25.00,
    modified_at: '18.03.2024 16:20:00', rev: 3, user: 'Инженер',
    soil_layers: [
      { id: 'sl-009', borehole_id: 'bh-004', depth_from_m: 0, depth_to_m: 4.0, ground_type: 'Насыпной грунт' },
      { id: 'sl-010', borehole_id: 'bh-004', depth_from_m: 4.0, depth_to_m: 15.0, ground_type: 'Суглинок', description: 'Суглинок полутвёрдый' },
      { id: 'sl-011', borehole_id: 'bh-004', depth_from_m: 15.0, depth_to_m: 30.0, ground_type: 'Песок средний' },
    ],
    water_layers: [
      { id: 'wl-005', borehole_id: 'bh-004', depth_m: 5.50, water_type: 'Верховодка' },
      { id: 'wl-006', borehole_id: 'bh-004', depth_m: 14.0, water_type: 'Межпластовые' },
    ],
    samples: [
      { id: 'sp-006', borehole_id: 'bh-004', depth_m: 6.0, sample_type: 'Монолит', lab_number: 'Л-006' },
      { id: 'sp-007', borehole_id: 'bh-004', depth_m: 16.0, sample_type: 'Монолит', lab_number: 'Л-007' },
    ],
    thermometry: [
      { id: 'th-004', borehole_id: 'bh-004', depth_m: 10.0, temperature_c: 10.2 },
      { id: 'th-005', borehole_id: 'bh-004', depth_m: 20.0, temperature_c: 11.8 },
    ],
  },
  {
    id: 'bh-005', number: 'С-5', norm_key: 'СК-005',
    depth_m: 8.00, elev_m: 145.10, x: 554356.45, y: 6178198.34,
    wgs84_lon: 37.6182, wgs84_lat: 55.7554,
    date: '19.03.2024', casing_depth_m: 2.00, reaming_m: 0.00,
    gso_m: 1.80, gsp_m: 5.00, mmg_m: 6.50,
    modified_at: '19.03.2024 08:30:00', rev: 1, user: 'Геолог',
    soil_layers: [
      { id: 'sl-012', borehole_id: 'bh-005', depth_from_m: 0, depth_to_m: 0.5, ground_type: 'Растительный слой' },
      { id: 'sl-013', borehole_id: 'bh-005', depth_from_m: 0.5, depth_to_m: 8.0, ground_type: 'Песок пылеватый', description: 'Песок пылеватый водонас.' },
    ],
    water_layers: [
      { id: 'wl-007', borehole_id: 'bh-005', depth_m: 1.80, water_type: 'Грунтовые' },
    ],
    samples: [
      { id: 'sp-008', borehole_id: 'bh-005', depth_m: 1.0, sample_type: 'Нарушенный', lab_number: 'Л-008' },
    ],
    thermometry: [],
  },
];

// Справочники
const dicts = {
  sides: [
    { id: 'left', name: 'Левая' },
    { id: 'right', name: 'Правая' },
    { id: 'center', name: 'Центральная' },
  ],
  rigs: [
    { id: 'rig-1', name: 'УРБ-2А' },
    { id: 'rig-2', name: 'УРБ-2А2' },
    { id: 'rig-3', name: 'SKF-30' },
  ],
  methods: [
    { id: 'm-3', name: 'Колонковое' },
    { id: 'm-1', name: 'Вращательное' },
    { id: 'm-2', name: 'Ударно-канатное' },
  ],
  diameters: [
    { id: 'd-1', name: '112' },
    { id: 'd-2', name: '132' },
    { id: 'd-3', name: '76' },
    { id: 'd-4', name: '90' },
  ],
  equipment: [
    { id: 'eq-1', name: 'Стандартное лабораторное' },
    { id: 'eq-2', name: 'Расширенное' },
  ],
  field_equipment: [
    { id: 'fe-1', name: 'Пенетрометр' },
    { id: 'fe-2', name: 'Штамп' },
  ],
  rock_catalog: [
    { id: 'rc-1', name: 'Гранит' },
    { id: 'rc-2', name: 'Базальт' },
    { id: 'rc-3', name: 'Диорит' },
  ],
  ige_catalog: [
    { code: 'ИГЭ-1', name: 'Суглинок полутвёрдый' },
    { code: 'ИГЭ-2', name: 'Суглинок тугопластичный' },
    { code: 'ИГЭ-3', name: 'Песок пылеватый средней плотности' },
    { code: 'ИГЭ-4', name: 'Глина твёрдая' },
    { code: 'ИГЭ-5', name: 'Песок крупный' },
  ],
};

// Состояние хранилища
let boreholes: Borehole[] = [...fixtureBoreholes];
let storeListeners: Set<() => void> = new Set();

function notify() {
  storeListeners.forEach((fn) => fn());
  bus.emit('data:changed');
}

export const GeoLogData = {
  // CRUD для скважин
  getAll(): Borehole[] {
    return [...boreholes];
  },

  getById(id: string): Borehole | undefined {
    return boreholes.find((b) => b.id === id);
  },

  // Миграция v1.3 → v1.4
  migrateData(oldBoreholes: any[]): Borehole[] {
    return oldBoreholes.map(bh => ({
      ...bh,
      soil_layers: (bh.soil_layers || []).map((layer: any) => ({
        ...layer,
        ige_code: layer.ige_code || undefined,
        classification: layer.classification || layer.ground_type || undefined,
        description: layer.description || undefined,
      })),
      samples: (bh.samples || []).map((sample: any) => ({
        ...sample,
        sample_type: sample.sample_type || 'disturbed',
      })),
    }));
  },

  create(data: Partial<Borehole>): Borehole {
    const newBh: Borehole = {
      id: 'bh-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      number: data.number || 'Новая',
      depth_m: data.depth_m || 0,
      elev_m: data.elev_m || 0,
      x: data.x || 0,
      y: data.y || 0,
      date: data.date || new Date().toLocaleDateString('ru-RU'),
      end_date: data.end_date || data.date || new Date().toLocaleDateString('ru-RU'),
      modified_at: new Date().toLocaleString('ru-RU'),
      rev: 1,
      user: '',
      ...data,
    };
    boreholes.push(newBh);
    notify();
    Journal.logEvent('command', `Создана скважина: ${newBh.number}`, 'bore.create');
    return newBh;
  },

  update(id: string, data: Partial<Borehole>): Borehole | undefined {
    const idx = boreholes.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    boreholes[idx] = {
      ...boreholes[idx],
      ...data,
      modified_at: new Date().toLocaleString('ru-RU'),
      rev: (boreholes[idx].rev || 0) + 1,
    };
    notify();
    bus.emit('ui:catalog-changed', { collection: 'boreholes', id });
    Journal.logEvent('command', `Обновлена скважина: ${boreholes[idx].number}`, 'bore.edit');
    return boreholes[idx];
  },

  delete(id: string) {
    const bh = boreholes.find((b) => b.id === id);
    if (!bh) return;
    boreholes = boreholes.filter((b) => b.id !== id);
    notify();
    Journal.logEvent('command', `Удалена скважина: ${bh.number}`, 'bore.delete');
  },

  restore(id: string) {
    Journal.logEvent('warning', `Восстановление скважины ${id} — не реализовано`, 'bore.restore');
  },

  count(): number {
    return boreholes.length;
  },

  totalObjects(): number {
    let total = boreholes.length;
    boreholes.forEach((b) => {
      total += (b.soil_layers?.length || 0);
      total += (b.water_layers?.length || 0);
      total += (b.samples?.length || 0);
      total += (b.thermometry?.length || 0);
    });
    return total;
  },

  getDicts() {
    return dicts;
  },

  subscribe(fn: () => void) {
    storeListeners.add(fn);
    return () => storeListeners.delete(fn);
  },

  sortByNumber() {
    boreholes.sort((a, b) => {
      // Извлекаем числовую часть из номера скважины
      const numA = parseInt(a.number.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.number.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });
    notify();
    Journal.logEvent('info', 'Скважины отсортированы по номеру', 'bore.sort');
  },
};
