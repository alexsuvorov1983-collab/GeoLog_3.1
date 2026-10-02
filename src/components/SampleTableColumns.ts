// Конфигурация колонок для вкладки "Пробы грунта"
// Определяет структуру шапки (5 уровней) и колонки для каждой композиции

export interface ColumnConfig {
  key: string;
  label: string;
  width?: number;
  editable?: boolean;
  type?: 'text' | 'number' | 'select';
  fixed?: boolean; // Закреплённая колонка слева
  level2?: string; // Группа параметров (Уровень 2)
  level3?: string; // Расшифровка (Уровень 3)
  level4?: string; // Скрытый служебный (Уровень 4)
  unit?: string; // Единица измерения
  precision?: number; // Точность (знаков после запятой)
}

// Служебные колонки (Уровень 1) - общие для всех композиций
export const serviceColumns: ColumnConfig[] = [
  { key: 'index', label: '№ п/п', width: 30, editable: false, fixed: true },
  { key: 'borehole_number', label: '№ выр.', width: 60, editable: false, fixed: true },
  { key: 'field_number', label: 'Полевой №', width: 75, editable: true, fixed: true },
  { key: 'lab_number', label: 'Лаб. №', width: 75, editable: true, fixed: true },
  { key: 'depth_m', label: 'Глубина отбора', width: 60, editable: true, fixed: true, unit: 'м', precision: 2 },
  { key: 'lithology', label: 'Литология', width: 90, editable: true, fixed: true },
  { key: 'description', label: 'Описание грунтов', width: 150, editable: true, fixed: true },
];

// Композиция "Дисперсный" (Н-ка_Т)
export const dispersedColumns: ColumnConfig[] = [
  // Уровень 2: Гранулометрический состав
  { key: 'f200', label: '>200', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f100', label: '200-100', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f60', label: '100-60', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f10', label: '60-10', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f5', label: '10-5', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f2', label: '5-2', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f1', label: '2-1', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f05', label: '1-0.5', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f025', label: '0.5-0.25', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f01', label: '0.25-0.1', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f005', label: '0.1-0.05', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f001', label: '0.05-0.01', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f0005', label: '0.01-0.005', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f0002', label: '<0.005', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции', unit: '%', precision: 1 },
  { key: 'f0002_gost', label: '<0.002', width: 45, editable: true, level2: 'Гранулометрический состав, %', level3: 'фракции ГОСТ', unit: '%', precision: 1 },
  { key: 'particle_sum', label: 'Сумма частиц', width: 60, editable: false, level2: 'Гранулометрический состав, %', level3: 'контроль', unit: '%', precision: 1 },
  
  // Уровень 2: Влажность
  { key: 'W', label: 'W', width: 45, editable: true, level2: 'Природная влажность W, %', unit: '%', precision: 1 },
  { key: 'WL', label: 'WL', width: 45, editable: true, level2: 'Влажность на границе', unit: '%', precision: 1 },
  { key: 'WP', label: 'WP', width: 45, editable: true, level2: 'Влажность на границе', unit: '%', precision: 1 },
  { key: 'Ip', label: 'Ip', width: 45, editable: false, level2: 'Число пластичности Ip', precision: 1 },
  { key: 'IL', label: 'IL', width: 45, editable: false, level2: 'Показатель текучести IL', precision: 2 },
  
  // Уровень 2: Плотность
  { key: 'rho', label: 'ρ', width: 45, editable: true, level2: 'Плотность, г/см³', level3: 'грунта', unit: 'г/см³', precision: 2 },
  { key: 'rhod', label: 'ρd', width: 45, editable: true, level2: 'Плотность, г/см³', level3: 'сухого', unit: 'г/см³', precision: 2 },
  { key: 'rhos', label: 'ρs', width: 45, editable: true, level2: 'Плотность, г/см³', level3: 'частиц', unit: 'г/см³', precision: 2 },
  
  // Уровень 2: Пористость
  { key: 'n', label: 'n', width: 45, editable: false, level2: 'Пористость n, %', unit: '%', precision: 1 },
  { key: 'e', label: 'e', width: 45, editable: false, level2: 'Коэфф. пористости e', precision: 2 },
  { key: 'Sr', label: 'Sr', width: 45, editable: false, level2: 'Коэфф. водонасыщения Sr', precision: 2 },
  
  // Уровень 2: Прочностные характеристики
  { key: 'c', label: 'c', width: 45, editable: true, level2: 'Одноплоскостной срез', level3: 'сцепление', unit: 'кПа', precision: 1 },
  { key: 'phi', label: 'φ', width: 45, editable: true, level2: 'Одноплоскостной срез', level3: 'угол внутр. трения', unit: 'град', precision: 1 },
  
  // Уровень 2: Компрессионные характеристики
  { key: 'Eoed', label: 'E', width: 45, editable: true, level2: 'Компрес. модуль деформации, МПа', level3: 'ест.', unit: 'МПа', precision: 1 },
  { key: 'Eoed_sat', label: 'E вод.', width: 45, editable: true, level2: 'Компрес. модуль деформации, МПа', level3: 'замоч.', unit: 'МПа', precision: 1 },
  
  // Уровень 2: ИГЭ
  { key: 'ige_code', label: 'ИГЭ', width: 60, editable: true, level2: 'Выход классификации', level3: 'Номер ИГЭ' },
];

// Композиция "Скальный" (Н-ка_СК)
export const rockColumns: ColumnConfig[] = [
  // Уровень 2: Мех. свойства скальных
  { key: 'Rc_dry', label: 'Rc вс', width: 50, editable: true, level2: 'Мех. свойства скальных', level3: 'предел прочности всухую', unit: 'МПа', precision: 1 },
  { key: 'Rc_sat', label: 'Rc водон', width: 50, editable: true, level2: 'Мех. свойства скальных', level3: 'предел прочности водон.', unit: 'МПа', precision: 1 },
  { key: 'Ksof', label: 'Ksof', width: 45, editable: false, level2: 'Мех. свойства скальных', level3: 'коэфф. размягчаемости', precision: 2 },
  { key: 'Kwr', label: 'Kwr', width: 45, editable: true, level2: 'Мех. свойства скальных', level3: 'коэфф. выветрелости', precision: 2 },
  { key: 'RQD', label: 'RQD', width: 45, editable: true, level2: 'RQD', unit: '%', precision: 1 },
  
  // Уровень 2: Прочностные характеристики
  { key: 'c', label: 'c', width: 45, editable: true, level2: 'Одноплоскостной срез', level3: 'сцепление', unit: 'кПа', precision: 1 },
  { key: 'phi', label: 'φ', width: 45, editable: true, level2: 'Одноплоскостной срез', level3: 'угол внутр. трения', unit: 'град', precision: 1 },
  
  // Уровень 2: ИГЭ
  { key: 'ige_code', label: 'ИГЭ', width: 60, editable: true, level2: 'Выход классификации', level3: 'Номер ИГЭ' },
];

// Композиция "Мёрзлый дисперсный" (Н-ка_МЗ)
export const frozenDispersedColumns: ColumnConfig[] = [
  // Уровень 2: Влажности мёрзлых
  { key: 'Wtot', label: 'Wtot', width: 45, editable: true, level2: 'Влажность мёрзлых', level3: 'общая', unit: '%', precision: 1 },
  { key: 'Wm', label: 'Wm', width: 45, editable: true, level2: 'Влажность мёрзлых', level3: 'незамерзшая вода', unit: '%', precision: 1 },
  { key: 'Wi', label: 'Wi', width: 45, editable: true, level2: 'Влажность мёрзлых', level3: 'лёд-включения', unit: '%', precision: 1 },
  { key: 'Ww', label: 'Ww', width: 45, editable: true, level2: 'Влажность мёрзлых', level3: 'лёд-цемент', unit: '%', precision: 1 },
  { key: 'Wic', label: 'Wic', width: 45, editable: true, level2: 'Влажность мёрзлых', level3: 'незамерзшая в мёрзлых', unit: '%', precision: 1 },
  
  // Уровень 2: Плотность мёрзлых
  { key: 'rhof', label: 'ρf', width: 45, editable: true, level2: 'Плотность, г/см³', level3: 'мёрзлого грунта', unit: 'г/см³', precision: 2 },
  { key: 'rhodf', label: 'ρdf', width: 45, editable: true, level2: 'Плотность, г/см³', level3: 'сухого мёрзлого', unit: 'г/см³', precision: 2 },
  { key: 'rhos', label: 'ρs', width: 45, editable: true, level2: 'Плотность, г/см³', level3: 'частиц', unit: 'г/см³', precision: 2 },
  
  // Уровень 2: Пористость мёрзлых
  { key: 'nf', label: 'nf', width: 45, editable: false, level2: 'Пористость n, %', level3: 'мёрзлого', unit: '%', precision: 1 },
  { key: 'ef', label: 'ef', width: 45, editable: false, level2: 'Коэфф. пористости e', level3: 'мёрзлого', precision: 2 },
  { key: 'Srf', label: 'Sr\'', width: 45, editable: false, level2: 'Коэфф. водонасыщения Sr', level3: 'мёрзлого', precision: 2 },
  
  // Уровень 2: Мёрзлые показатели
  { key: 'itot', label: 'itot', width: 45, editable: true, level2: 'Мёрзлые показатели', level3: 'льдистость общая', precision: 2 },
  { key: 'ii', label: 'ii', width: 45, editable: true, level2: 'Мёрзлые показатели', level3: 'льдистость включений', precision: 2 },
  { key: 'Tbf', label: 'Tbf', width: 45, editable: true, level2: 'Мёрзлые показатели', level3: 'температура начала замерзания', unit: '°C', precision: 1 },
  
  // Уровень 2: ИГЭ
  { key: 'ige_code', label: 'ИГЭ', width: 60, editable: true, level2: 'Выход классификации', level3: 'Номер ИГЭ' },
];

// Композиция "Мёрзлый скальный" (Н-ка_МЗСК)
export const frozenRockColumns: ColumnConfig[] = [
  // Уровень 2: Мех. свойства скальных
  { key: 'Rc_dry', label: 'Rc вс', width: 50, editable: true, level2: 'Мех. свойства скальных', level3: 'предел прочности всухую', unit: 'МПа', precision: 1 },
  { key: 'Rc_sat', label: 'Rc водон', width: 50, editable: true, level2: 'Мех. свойства скальных', level3: 'предел прочности водон.', unit: 'МПа', precision: 1 },
  { key: 'RQD', label: 'RQD', width: 45, editable: true, level2: 'RQD', unit: '%', precision: 1 },
  
  // Уровень 2: Мёрзлые показатели
  { key: 'Tbf', label: 'Tbf', width: 45, editable: true, level2: 'Мёрзлые показатели', level3: 'температура начала замерзания', unit: '°C', precision: 1 },
  
  // Уровень 2: ИГЭ
  { key: 'ige_code', label: 'ИГЭ', width: 60, editable: true, level2: 'Выход классификации', level3: 'Номер ИГЭ' },
];

// Функция получения колонок по типу композиции
export function getColumnsByComposition(compositionType: string): ColumnConfig[] {
  switch (compositionType) {
    case 'dispersed':
      return dispersedColumns;
    case 'rock':
      return rockColumns;
    case 'frozen_dispersed':
      return frozenDispersedColumns;
    case 'frozen_rock':
      return frozenRockColumns;
    default:
      return dispersedColumns;
  }
}
