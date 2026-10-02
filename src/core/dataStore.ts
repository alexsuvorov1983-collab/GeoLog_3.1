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
  
  // Термометрия - сессии замеров (новая структура)
  thermoSessions?: ThermoSession[];
  
  // Лабораторные опыты (новая схема v1.5)
  soil_tests?: SoilTest[];
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
  depth_m: number; // для обратной совместимости
  water_type: string; // для обратной совместимости
  // Новые поля (схема v1.4)
  upv?: number; // глубина УППВ, м
  upvAbsent?: boolean; // отметка «Нет»
  upvDate?: string; // дата замера УППВ
  uuv?: number; // глубина УУПВ, м
  uuvAbsent?: boolean; // отметка «Нет»
  uuvDate?: string; // дата замера УУПВ
  bottom?: number; // подошва слоя, м
  horizon?: string; // ВГ, индекс водоносного горизонта
  pressure?: number; // напор, м
  depression?: number; // понижение, м
  provenance?: string; // источник данных
}

export interface Sample {
  id: string;
  borehole_id: string;
  depth_m: number;
  sample_type: string;
  lab_number?: string;
  
  // Новые поля для лабораторной карточки (схема v1.5)
  field_number?: string; // Полевой номер
  ige_code?: string; // Привязка к ИГЭ
  composition_type?: 'dispersed' | 'rock' | 'frozen_dispersed' | 'frozen_rock'; // Тип композиции
  lithology?: string; // Литология (для скальных)
  description?: string; // Описание грунта
  note?: string; // Примечание
  
  // Гранулометрический состав, %
  granulometry?: {
    f200?: number; // >200 мм
    f100?: number; // 200-100 мм
    f60?: number; // 100-60 мм
    f10?: number; // 60-10 мм
    f5?: number; // 10-5 мм
    f2?: number; // 5-2 мм
    f1?: number; // 2-1 мм
    f05?: number; // 1-0.5 мм
    f025?: number; // 0.5-0.25 мм
    f01?: number; // 0.25-0.1 мм
    f005?: number; // 0.1-0.05 мм
    f001?: number; // 0.05-0.01 мм
    f0005?: number; // 0.01-0.005 мм
    f0002?: number; // <0.005 мм (по ГОСТ 12536-2014)
    f0002_gost?: number; // <0.002 мм (по ГОСТ 12536-2014)
  };
  
  // q1, q2 для определения коэффициентов выветрелости
  q1?: number;
  q2?: number;
  
  // Влажность
  W?: number; // Природная влажность, %
  WL?: number; // Влажность на границе текучести
  WP?: number; // Влажность на границе раскатывания
  
  // Влажности для мёрзлых грунтов
  Wtot?: number; // Общая влажность
  Wm?: number; // Влажность за счёт незамерзшей воды
  Wi?: number; // Влажность за счёт льда-включений
  Ww?: number; // Влажность за счёт льда-цемента
  Wic?: number; // Влажность за счёт незамерзшей воды в мёрзлых
  
  // Плотности
  rho?: number; // Плотность грунта, г/см³
  rhod?: number; // Плотность сухого грунта, г/см³
  rhos?: number; // Плотность частиц, г/см³
  rhof?: number; // Плотность мёрзлого грунта, г/см³
  rhodf?: number; // Плотность сухого мёрзлого грунта, г/см³
  
  // Пористость и коэффициент пористости
  n?: number; // Пористость, %
  nf?: number; // Пористость мёрзлого, %
  e?: number; // Коэффициент пористости
  ef?: number; // Коэффициент пористости мёрзлого
  
  // Коэффициент водонасыщения
  Sr?: number;
  Srf?: number; // Для мёрзлых
  
  // Прочностные характеристики
  c?: number; // Сцепление, кПа (одноплоскостной срез, ест.)
  phi?: number; // Угол внутреннего трения, град (ест.)
  c_sat?: number; // Сцепление замоченное, кПа
  phi_sat?: number; // Угол внутреннего трения замоченный, град
  
  // Компрессионные характеристики
  Eoed?: number; // Модуль деформации, МПа (ест.)
  Eoed_sat?: number; // Модуль деформации, МПа (замоч.)
  
  // Трёхосные испытания
  c_tri?: number; // Сцепление трёхосное
  phi_tri?: number; // Угол трёхосный
  E_tri?: number; // Модуль деформации трёхосный
  cu?: number; // Недренированная прочность
  nu?: number; // Коэффициент Пуассона
  Ekoed?: number; // Модуль упругости
  
  // Скальные показатели
  Rc_dry?: number; // Предел прочности на сжатие всухую, МПа
  Rc_sat?: number; // Предел прочности на сжатие водонасыщенный, МПа
  RQD?: number; // Индекс качества керна
  Ksof?: number; // Коэффициент размягчаемости
  Kwr?: number; // Коэффициент выветрелости
  
  // Мёрзлые показатели
  itot?: number; // Льдистость общая
  ii?: number; // Льдистость включений
  Tbf?: number; // Температура начала замерзания
  
  // Другие показатели
  Dsal?: number; // Засолённость, %
  Ddp?: number; // Степень разложения, %
  Ir?: number; // Относительное содержание органики
  Kf?: number; // Коэффициент фильтрации, м/сут
}

// Интерфейс для лабораторных опытов (вложенная карточка)
// Интерфейсы для лабораторных опытов (Этап 5)

export interface CompressionMeasurement {
  pressure_mpa: number; // Давление, МПа
  height_mm: number; // Высота образца, мм
  deformation_mm: number; // Абсолютная деформация, мм
}

export interface CompressionTestData {
  initial_height_mm: number; // Начальная высота образца
  ring_area_cm2: number; // Площадь кольца, см²
  initial_moisture?: number; // Начальная влажность, %
  initial_density?: number; // Начальная плотность, г/см³
  measurements: CompressionMeasurement[]; // Замеры
  final_height_mm?: number; // Высота после опыта (ручной ввод)
}

export interface CompressionTestResults {
  e0?: number; // Начальный коэффициент пористости
  m0?: number; // Коэффициент сжимаемости, МПа⁻¹
  Eoed?: number; // Модуль деформации, МПа (естественное состояние)
  Eoed_sat?: number; // Модуль деформации, МПа (водонасыщенное)
  compression_coeff?: number; // Коэффициент компрессии
}

export interface ShearMeasurement {
  normal_stress_kpa: number; // Нормальное напряжение, кПа
  shear_stress_kpa: number; // Касательное напряжение, кПа
  displacement_mm?: number; // Смещение, мм
}

export interface ShearTestData {
  condition: 'natural' | 'saturated' | 'frozen'; // Состояние
  measurements: ShearMeasurement[]; // Замеры
  test_type?: 'plane' | 'triaxial' | 'frozen_surface'; // Тип среза
}

export interface ShearTestResults {
  c?: number; // Сцепление, кПа
  phi?: number; // Угол внутреннего трения, град
  correlation?: number; // Коэффициент корреляции
}

export interface GranulometryMeasurement {
  fraction_mm: string; // Фракция (например, "200-100")
  weight_g: number; // Вес, г
  percentage?: number; // Процент, %
}

export interface GranulometryTestData {
  total_weight_g: number; // Общий вес пробы, г
  measurements: GranulometryMeasurement[]; // Замеры по фракциям
  wet_screening?: boolean; // Мокрый рассев
  fraction_0002?: number; // Фракция <0.002 мм, %
}

export interface GranulometryTestResults {
  particle_sum?: number; // Сумма частиц, %
  filler?: number; // Заполнитель, %
  sand_in_fine?: number; // Песок в мелкоземе, %
  fractions: Record<string, number>; // Проценты по фракциям
}

export interface MoistureMeasurement {
  sample_weight_g: number; // Вес образца, г
  dry_weight_g: number; // Вес после высушивания, г
  moisture?: number; // Влажность, %
}

export interface MoistureDensityTestData {
  fraction_type: 'fine' | 'coarse' | 'total'; // Тип фракции (<2мм, >2мм, общая)
  measurements: MoistureMeasurement[]; // Замеры
  calculate_density?: boolean; // Авторасчет плотности частиц
}

export interface MoistureDensityTestResults {
  average_moisture?: number; // Средняя влажность, %
  density?: number; // Плотность, г/см³
  dry_density?: number; // Плотность сухого грунта, г/см³
}

// Интерфейсы для Этапа 6: Дополнительные лабораторные опыты

// Трёхосное сжатие (ГОСТ 12248)
export interface TriaxialMeasurement {
  axial_stress_mpa: number; // Осевое напряжение, МПа
  radial_stress_mpa: number; // Радиальное напряжение, МПа
  axial_strain?: number; // Осевая деформация
  radial_strain?: number; // Радиальная деформация
}

export interface TriaxialTestData {
  test_scheme: 'CU' | 'CD' | 'UU'; // CU - консолидированно-недренированное, CD - консолидированно-дренированное, UU - неконсолидированно-недренированное
  measurements: TriaxialMeasurement[];
  initial_void_ratio?: number; // Начальный коэффициент пористости
}

export interface TriaxialTestResults {
  E_tri?: number; // Модуль деформации, МПа
  nu?: number; // Коэффициент Пуассона
  G?: number; // Модуль сдвига, МПа
  K?: number; // Модуль объёмной деформации, МПа
  cu?: number; // Сопротивление недренированному сдвигу, кПа
  phi_tri?: number; // Угол внутреннего трения, град
  c_tri?: number; // Сцепление, кПа
}

// Конус Бойченко
export interface ConeMeasurement {
  depth_mm: number; // Глубина погружения, мм
  time_min?: number; // Время, мин
}

export interface ConeTestData {
  cone_type: 'standard' | 'modified'; // Тип конуса
  measurements: ConeMeasurement[];
  transition_table?: Array<{ depth_mm: number; consistency_index: number }>; // Таблица перехода
}

export interface ConeTestResults {
  consistency_index?: number; // Показатель консистенции
  consistency_description?: string; // Описание консистенции
}

// Набухание и усадка
export interface SwellShrinkMeasurement {
  pressure_kpa: number; // Давление, кПа
  deformation_mm: number; // Деформация, мм
  time_hours?: number; // Время, часы
}

export interface SwellShrinkTestData {
  initial_moisture?: number; // Начальная влажность, %
  final_moisture?: number; // Конечная влажность, %
  initial_height_mm?: number; // Начальная высота, мм
  swell_measurements: SwellShrinkMeasurement[]; // Замеры набухания
  shrink_measurements: SwellShrinkMeasurement[]; // Замеры усадки
}

export interface SwellShrinkTestResults {
  Psw?: number; // Относительное набухание
  moisture_swell?: number; // Влажность набухания, %
  shrinkage?: number; // Относительная усадка
  swell_pressure?: number; // Давление набухания, кПа
}

// Просадочность
export interface SubsidenceMeasurement {
  pressure_mpa: number; // Давление, МПа
  deformation_mm: number; // Деформация, мм
  is_saturated: boolean; // Замоченное состояние
}

export interface SubsidenceTestData {
  initial_height_mm: number; // Начальная высота, мм
  initial_moisture?: number; // Начальная влажность, %
  measurements: SubsidenceMeasurement[];
}

export interface SubsidenceTestResults {
  relative_subsidence?: Record<number, number>; // Относительная просадочность при каждом давлении
  initial_subsidence_pressure?: number; // Начальное просадочное давление, МПа
  household_pressure?: number; // Бытовое давление, МПа
  E_sat?: number; // Модуль деформации при замачивании, МПа
}

// Скальные показатели
export interface RockTestData {
  Rc_dry_measurements?: Array<{ sample_id: string; force_kN: number; area_cm2: number }>; // Замеры Rc вс
  Rc_sat_measurements?: Array<{ sample_id: string; force_kN: number; area_cm2: number }>; // Замеры Rc водон
  RQD_measurements?: Array<{ core_length_m: number; intact_length_m: number }>; // Замеры RQD
  tensile_strength?: number; // Прочность на растяжение, МПа
  natural_slope_angle?: number; // Угол естественного откоса, град
  core_density?: number; // Плотность обломков, г/см³
}

export interface RockTestResults {
  Rc_dry?: number; // Предел прочности на сжатие всухую, МПа
  Rc_sat?: number; // Предел прочности на сжатие водонасыщенный, МПа
  RQD?: number; // Индекс качества керна, %
  Ksof?: number; // Коэффициент размягчаемости
  Kwr?: number; // Коэффициент выветрелости
  mass_loss?: number; // Потери в массе, %
  Young_modulus?: number; // Модуль Юнга, МПа
  Poisson_ratio?: number; // Коэффициент Пуассона
}

// Мёрзлые показатели
export interface FrozenTestData {
  Tbf?: number; // Температура начала замерзания, °C
  itot?: number; // Общая льдистость
  ii?: number; // Льдистость включений
  ice_cement?: number; // Льдистость льда-цемента
  unfrozen_water?: number; // Содержание незамерзшей воды, %
  thermal_measurements?: {
    thermal_conductivity_frozen?: number; // Теплопроводность мёрзлого, Вт/(м·°C)
    thermal_conductivity_thawed?: number; // Теплопроводность талого, Вт/(м·°C)
    thermal_diffusivity_frozen?: number; // Температуропроводность мёрзлого, м²/сут
    thermal_diffusivity_thawed?: number; // Температуропроводность талого, м²/сут
    heat_capacity_frozen?: number; // Теплоемкость мёрзлого, кДж/(м³·°C)
    heat_capacity_thawed?: number; // Теплоемкость талого, кДж/(м³·°C)
  };
  shear_strength_concrete?: number; // Сопротивление срезу по бетону, кПа
  shear_strength_steel?: number; // Сопротивление срезу по стали, кПа
}

export interface FrozenTestResults {
  Sr_prime?: number; // Степень заполнения пор льдом и незамёрзшей водой
  relative_settlement?: number; // Относительная осадка мёрзлого грунта
  compressibility_thaw?: number; // Сжимаемость при оттаивании
  thaw_coefficient?: number; // Коэффициент оттаивания
  Ef_02?: number; // Модуль деформации при 0.2 МПа, МПа
}

export interface SoilTest {
  id: string;
  sample_id: string;
  test_type: 'compression' | 'shear' | 'triaxial' | 'cone' | 'granulometry' | 'moisture' | 'swell' | 'subsidence' | 'frost' | 'consolidation' | 'chemical' | 'rock' | 'frozen';
  data?: CompressionTestData | ShearTestData | GranulometryTestData | MoistureDensityTestData | TriaxialTestData | ConeTestData | SwellShrinkTestData | SubsidenceTestData | RockTestData | FrozenTestData | Record<string, any>;
  results?: CompressionTestResults | ShearTestResults | GranulometryTestResults | MoistureDensityTestResults | TriaxialTestResults | ConeTestResults | SwellShrinkTestResults | SubsidenceTestResults | RockTestResults | FrozenTestResults | Record<string, any>;
  created_at?: string;
}

export interface ThermometryEntry {
  id: string;
  borehole_id: string;
  depth_m: number;
  temperature_c: number;
}

// Термометрия - сессии замеров (новая структура для вкладки "Термометрия")
export interface ThermoMeasurement {
  depth: number;
  temperature: number;
}

export interface ThermoSession {
  id: string;
  boreholeId: string;
  date: string; // ISO формат YYYY-MM-DD
  campaign?: string; // Название кампании
  measurements: ThermoMeasurement[];
  provenance?: {
    type: 'manual' | 'xlsx_import';
    fileName?: string;
    sheetName?: string;
    rowNumber?: number;
    importedAt?: string;
  };
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
      { 
        id: 'wl-001', 
        borehole_id: 'bh-001', 
        depth_m: 3.20, 
        water_type: 'Верховодка',
        upv: 3.52,
        upvDate: '15.10.2019',
        uuv: 3.30,
        uuvDate: '20.10.2019',
        bottom: 8.00,
        horizon: 'В1'
      },
      { 
        id: 'wl-002', 
        borehole_id: 'bh-001', 
        depth_m: 8.50, 
        water_type: 'Грунтовые'
      },
    ],
    samples: [
      { id: 'sp-001', borehole_id: 'bh-001', depth_m: 3.0, sample_type: 'Нарушенный', lab_number: 'Л-001' },
      { id: 'sp-002', borehole_id: 'bh-001', depth_m: 7.5, sample_type: 'Монолит', lab_number: 'Л-002' },
      { id: 'sp-003', borehole_id: 'bh-001', depth_m: 8.0, sample_type: 'water', lab_number: 'В-1' },
      // Демо-пробы для вкладки "Пробы грунта" (5 типов)
      { 
        id: 'sp-demo-001', borehole_id: 'bh-001', depth_m: 4.5, sample_type: 'Монолит', lab_number: 'Л-101',
        field_number: 'П-001', ige_code: 'ИГЭ-3', composition_type: 'dispersed',
        description: 'Песок пылеватый средней плотности',
        granulometry: { f200: 0, f100: 0, f60: 0, f10: 2.5, f5: 8.3, f2: 15.2, f1: 18.7, f05: 22.4, f025: 16.8, f01: 9.6, f005: 4.2, f001: 1.8, f0005: 0.5 },
        W: 18.5, WL: 26.0, WP: 19.0,
        rho: 1.92, rhod: 1.62, rhos: 2.68,
      },
      { 
        id: 'sp-demo-002', borehole_id: 'bh-001', depth_m: 6.0, sample_type: 'Монолит', lab_number: 'Л-102',
        field_number: 'П-002', ige_code: 'ИГЭ-2', composition_type: 'dispersed',
        description: 'Суглинок полутвёрдый',
        granulometry: { f200: 0, f100: 0, f60: 0, f10: 0, f5: 1.2, f2: 3.8, f1: 8.5, f05: 15.3, f025: 22.7, f01: 24.6, f005: 14.8, f001: 6.4, f0005: 2.7 },
        W: 14.2, WL: 32.0, WP: 18.5,
        rho: 2.01, rhod: 1.76, rhos: 2.71,
        c: 28, phi: 16, c_sat: 18, phi_sat: 12,
        Eoed: 15.5, Eoed_sat: 9.8,
      },
      { 
        id: 'sp-demo-003', borehole_id: 'bh-001', depth_m: 9.0, sample_type: 'Монолит', lab_number: 'Л-103',
        field_number: 'П-003', ige_code: 'ИГЭ-5', composition_type: 'dispersed',
        description: 'Галечник с песчаным заполнителем',
        granulometry: { f200: 35.0, f100: 22.0, f60: 8.0, f10: 5.0, f5: 6.5, f2: 8.2, f1: 5.8, f05: 4.5, f025: 2.8, f01: 1.5, f005: 0.5, f001: 0.2 },
        q1: 850, q2: 620,
        W: 12.8, rho: 2.15, rhod: 1.91, rhos: 2.65,
      },
      { 
        id: 'sp-demo-004', borehole_id: 'bh-001', depth_m: 12.5, sample_type: 'Монолит', lab_number: 'Л-104',
        field_number: 'П-004', ige_code: 'ИГЭ-6', composition_type: 'rock',
        lithology: 'Известняк',
        description: 'Известняк трещиноватый, среднепрочный',
        Rc_dry: 45.2, Rc_sat: 32.8, RQD: 68, Ksof: 0.72,
      },
      { 
        id: 'sp-demo-005', borehole_id: 'bh-001', depth_m: 14.0, sample_type: 'Монолит', lab_number: 'Л-105',
        field_number: 'П-005', ige_code: 'ИГЭ-7', composition_type: 'frozen_dispersed',
        description: 'Суглинок мёрзлый тугопластичный',
        granulometry: { f200: 0, f100: 0, f60: 0, f10: 0, f5: 2.1, f2: 4.5, f1: 9.2, f05: 16.8, f025: 23.4, f01: 22.1, f005: 13.5, f001: 5.8, f0005: 2.6 },
        Wtot: 28.5, Wm: 8.2, Wi: 15.3, Ww: 5.0, Wic: 7.8,
        rhof: 2.10, rhodf: 1.68, rhos: 2.69,
        itot: 0.32, ii: 0.08, Tbf: -1.8,
      },
    ],
    thermometry: [
      { id: 'th-001', borehole_id: 'bh-001', depth_m: 5.0, temperature_c: 8.2 },
      { id: 'th-002', borehole_id: 'bh-001', depth_m: 10.0, temperature_c: 9.5 },
    ],
    thermoSessions: [
      {
        id: 'ts-demo-001',
        boreholeId: 'bh-001',
        date: '2024-03-15',
        campaign: 'Весенняя кампания 2024',
        measurements: [
          { depth: 0.5, temperature: 7.8 },
          { depth: 1.0, temperature: 8.0 },
          { depth: 1.5, temperature: 8.1 },
          { depth: 2.0, temperature: 8.2 },
          { depth: 3.0, temperature: 8.4 },
          { depth: 5.0, temperature: 8.8 },
          { depth: 7.0, temperature: 9.2 },
          { depth: 10.0, temperature: 9.8 },
        ],
        provenance: { type: 'manual' },
      },
      {
        id: 'ts-demo-002',
        boreholeId: 'bh-001',
        date: '2024-07-20',
        campaign: 'Летняя кампания 2024',
        measurements: [
          { depth: 0.5, temperature: 12.5 },
          { depth: 1.0, temperature: 12.3 },
          { depth: 1.5, temperature: 12.1 },
          { depth: 2.0, temperature: 11.9 },
          { depth: 3.0, temperature: 11.5 },
          { depth: 5.0, temperature: 10.8 },
          { depth: 7.0, temperature: 10.2 },
          { depth: 10.0, temperature: 9.6 },
        ],
        provenance: { type: 'manual' },
      },
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
      { 
        id: 'wl-003', 
        borehole_id: 'bh-002', 
        depth_m: 4.10, 
        water_type: 'Верховодка',
        upvAbsent: true,
        upvDate: '16.10.2019',
        uuvAbsent: true,
        uuvDate: '17.10.2019'
      },
    ],
    samples: [
      { id: 'sp-003', borehole_id: 'bh-002', depth_m: 5.0, sample_type: 'Монолит', lab_number: 'Л-003' },
    ],
    thermometry: [],
    thermoSessions: [
      {
        id: 'ts-demo-003',
        boreholeId: 'bh-002',
        date: '2024-03-16',
        campaign: 'Весенняя кампания 2024',
        measurements: [
          { depth: 0.5, temperature: 7.5 },
          { depth: 1.0, temperature: 7.8 },
          { depth: 2.0, temperature: 8.2 },
          { depth: 4.0, temperature: 8.8 },
          { depth: 6.0, temperature: 9.3 },
          { depth: 8.0, temperature: 9.7 },
          { depth: 12.0, temperature: 10.4 },
          { depth: 15.0, temperature: 10.8 },
          { depth: 20.0, temperature: 11.2 },
        ],
        provenance: { type: 'manual' },
      },
    ],
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
      { 
        id: 'wl-004', 
        borehole_id: 'bh-003', 
        depth_m: 2.80, 
        water_type: 'Грунтовые',
        upv: 3.80,
        horizon: 'В2',
        pressure: 1.20
      },
    ],
    samples: [
      { id: 'sp-004', borehole_id: 'bh-003', depth_m: 2.0, sample_type: 'Нарушенный', lab_number: 'Л-004' },
      { id: 'sp-005', borehole_id: 'bh-003', depth_m: 5.0, sample_type: 'Монолит', lab_number: 'Л-005' },
    ],
    thermometry: [
      { id: 'th-003', borehole_id: 'bh-003', depth_m: 5.0, temperature_c: 7.8 },
    ],
    thermoSessions: [
      {
        id: 'ts-demo-004',
        boreholeId: 'bh-003',
        date: '2024-03-17',
        campaign: 'Весенняя кампания 2024',
        measurements: [
          { depth: 0.5, temperature: 7.2 },
          { depth: 1.0, temperature: 7.5 },
          { depth: 2.0, temperature: 7.8 },
          { depth: 5.0, temperature: 8.5 },
          { depth: 8.0, temperature: 9.0 },
        ],
        provenance: { type: 'manual' },
      },
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
    thermoSessions: [
      {
        id: 'ts-demo-005',
        boreholeId: 'bh-004',
        date: '2024-03-18',
        campaign: 'Весенняя кампания 2024',
        measurements: [
          { depth: 0.5, temperature: 7.0 },
          { depth: 1.0, temperature: 7.3 },
          { depth: 2.0, temperature: 7.8 },
          { depth: 4.0, temperature: 8.5 },
          { depth: 6.0, temperature: 9.0 },
          { depth: 10.0, temperature: 10.2 },
          { depth: 15.0, temperature: 11.0 },
          { depth: 20.0, temperature: 11.8 },
          { depth: 25.0, temperature: 12.3 },
        ],
        provenance: { type: 'manual' },
      },
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

  // CRUD для водных слоёв
  addWaterLayer(boreholeId: string, data: Partial<WaterLayer>): WaterLayer {
    const bh = boreholes.find(b => b.id === boreholeId);
    if (!bh) throw new Error(`Скважина ${boreholeId} не найдена`);
    
    if (!bh.water_layers) bh.water_layers = [];
    
    const newLayer: WaterLayer = {
      id: 'wl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId,
      depth_m: data.depth_m || 0,
      water_type: data.water_type || '',
      ...data,
    };
    
    bh.water_layers.push(newLayer);
    notify();
    bus.emit('ui:catalog-changed', { collection: 'water_layers', id: newLayer.id });
    Journal.logEvent('command', `Добавлен водный слой ${newLayer.id}`, 'water_layer.add');
    return newLayer;
  },

  updateWaterLayer(boreholeId: string, layerId: string, data: Partial<WaterLayer>): WaterLayer | undefined {
    const bh = boreholes.find(b => b.id === boreholeId);
    if (!bh || !bh.water_layers) return undefined;
    
    const idx = bh.water_layers.findIndex(l => l.id === layerId);
    if (idx === -1) return undefined;
    
    bh.water_layers[idx] = { ...bh.water_layers[idx], ...data };
    notify();
    bus.emit('ui:catalog-changed', { collection: 'water_layers', id: layerId });
    Journal.logEvent('command', `Обновлён водный слой ${layerId}`, 'water_layer.update');
    return bh.water_layers[idx];
  },

  deleteWaterLayer(boreholeId: string, layerId: string): boolean {
    const bh = boreholes.find(b => b.id === boreholeId);
    if (!bh || !bh.water_layers) return false;
    
    const idx = bh.water_layers.findIndex(l => l.id === layerId);
    if (idx === -1) return false;
    
    bh.water_layers.splice(idx, 1);
    notify();
    bus.emit('ui:catalog-changed', { collection: 'water_layers', id: layerId });
    Journal.logEvent('command', `Удалён водный слой ${layerId}`, 'water_layer.delete');
    return true;
  },

  // CRUD для термометрических сессий
  addThermoSession(boreholeId: string, data: Partial<ThermoSession>): ThermoSession {
    const bh = boreholes.find(b => b.id === boreholeId);
    if (!bh) throw new Error(`Скважина ${boreholeId} не найдена`);
    
    if (!bh.thermoSessions) bh.thermoSessions = [];
    
    const newSession: ThermoSession = {
      id: 'ts-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      boreholeId: boreholeId,
      date: data.date || new Date().toISOString().split('T')[0],
      campaign: data.campaign || '',
      measurements: data.measurements || [],
      provenance: data.provenance || { type: 'manual' },
    };
    
    bh.thermoSessions.push(newSession);
    notify();
    Journal.logEvent('command', `Добавлена термометрическая сессия ${newSession.id}`, 'thermo_session.add');
    return newSession;
  },

  updateThermoSession(boreholeId: string, sessionId: string, data: Partial<ThermoSession>): ThermoSession | undefined {
    const bh = boreholes.find(b => b.id === boreholeId);
    if (!bh || !bh.thermoSessions) return undefined;
    
    const idx = bh.thermoSessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return undefined;
    
    bh.thermoSessions[idx] = { ...bh.thermoSessions[idx], ...data };
    notify();
    Journal.logEvent('command', `Обновлена термометрическая сессия ${sessionId}`, 'thermo_session.update');
    return bh.thermoSessions[idx];
  },

  deleteThermoSession(boreholeId: string, sessionId: string): boolean {
    const bh = boreholes.find(b => b.id === boreholeId);
    if (!bh || !bh.thermoSessions) return false;
    
    const idx = bh.thermoSessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return false;
    
    bh.thermoSessions.splice(idx, 1);
    notify();
    Journal.logEvent('command', `Удалена термометрическая сессия ${sessionId}`, 'thermo_session.delete');
    return true;
  },

  // Получить все уникальные глубины из всех сессий проекта
  getAllThermoDepths(): number[] {
    const depthSet = new Set<number>();
    
    boreholes.forEach(bh => {
      (bh.thermoSessions || []).forEach(session => {
        session.measurements.forEach(m => {
          depthSet.add(m.depth);
        });
      });
    });
    
    return Array.from(depthSet).sort((a, b) => a - b);
  },

  // Получить все сессии термометрии из всех скважин
  getAllThermoSessions(): Array<ThermoSession & { boreholeNumber: string }> {
    const sessions: Array<ThermoSession & { boreholeNumber: string }> = [];
    
    boreholes.forEach(bh => {
      (bh.thermoSessions || []).forEach(session => {
        sessions.push({
          ...session,
          boreholeNumber: bh.number,
        });
      });
    });
    
    return sessions;
  },
};
