// Модуль расчёта показателей для проб грунта
// Этап 3: Базовые формулы

import { Sample } from '../core/dataStore';

// Интерфейс для результатов расчётов
export interface CalculatedValues {
  particleSum?: number; // Сумма частиц
  filler?: number; // Заполнитель, %
  sandInFine?: number; // Содержание песка в мелкоземе, %
  rhod?: number; // Плотность сухого грунта, г/см³
  e?: number; // Коэффициент пористости
  n?: number; // Пористость, %
  Sr?: number; // Коэффициент водонасыщения
  Ip?: number; // Число пластичности
  IL?: number; // Показатель текучести
  K1?: number; // Коэффициент выветрелости
  K0?: number; // Коэффициент в природном состоянии
}

// Интерфейс для ошибок валидации
export interface ValidationErrors {
  particleSumError?: boolean; // Сумма ≠ 100%
  ipNegative?: boolean; // Ip < 0
  divisionByZero?: boolean; // Деление на ноль
}

// Функция безопасного деления
function safeDivide(numerator: number | undefined, denominator: number | undefined): number | undefined {
  if (numerator === undefined || denominator === undefined || denominator === 0) {
    return undefined;
  }
  return numerator / denominator;
}

// Функция безопасного умножения
function safeMultiply(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined || b === undefined) {
    return undefined;
  }
  return a * b;
}

// Расчёт суммы фракций грансостава
export function calculateParticleSum(sample: Sample): number | undefined {
  const g = sample.granulometry;
  if (!g) return undefined;

  const fractions = [
    g.f200, g.f100, g.f60, g.f10, g.f5, g.f2, g.f1,
    g.f05, g.f025, g.f01, g.f005, g.f001, g.f0005, g.f0002
  ];

  const definedFractions = fractions.filter(f => f !== undefined && f !== null);
  if (definedFractions.length === 0) return undefined;

  return definedFractions.reduce((sum, f) => sum + (f || 0), 0);
}

// Расчёт заполнителя (сумма фракций < 2 мм)
export function calculateFiller(sample: Sample): number | undefined {
  const g = sample.granulometry;
  if (!g) return undefined;

  const fineFractions = [
    g.f1, g.f05, g.f025, g.f01, g.f005, g.f001, g.f0005, g.f0002
  ];

  const definedFractions = fineFractions.filter(f => f !== undefined && f !== null);
  if (definedFractions.length === 0) return undefined;

  return definedFractions.reduce((sum, f) => sum + (f || 0), 0);
}

// Расчёт содержания песка в мелкоземе
export function calculateSandInFine(sample: Sample): number | undefined {
  const g = sample.granulometry;
  if (!g) return undefined;

  // Песчаные фракции: 2-1, 1-0.5, 0.5-0.25, 0.25-0.1, 0.1-0.05
  const sandFractions = [g.f1, g.f05, g.f025, g.f01, g.f005];
  const definedSand = sandFractions.filter(f => f !== undefined && f !== null);
  
  if (definedSand.length === 0) return undefined;

  const sandSum = definedSand.reduce((sum, f) => sum + (f || 0), 0);
  const filler = calculateFiller(sample);
  
  if (filler === undefined || filler === 0) return undefined;

  return (sandSum / filler) * 100;
}

// Расчёт плотности сухого грунта
export function calculateRhod(sample: Sample): number | undefined {
  if (sample.rho === undefined || sample.W === undefined) return undefined;
  
  const W_decimal = sample.W / 100;
  return sample.rho / (1 + W_decimal);
}

// Расчёт коэффициента пористости
export function calculateE(sample: Sample): number | undefined {
  const rhod = calculateRhod(sample);
  if (rhod === undefined || sample.rhos === undefined || rhod === 0) return undefined;
  
  return (sample.rhos / rhod) - 1;
}

// Расчёт пористости
export function calculateN(sample: Sample): number | undefined {
  const e = calculateE(sample);
  if (e === undefined) return undefined;
  
  return (e / (1 + e)) * 100;
}

// Расчёт коэффициента водонасыщения
export function calculateSr(sample: Sample): number | undefined {
  const e = calculateE(sample);
  if (e === undefined || sample.W === undefined || sample.rhos === undefined || e === 0) return undefined;
  
  const rho_w = 1; // Плотность воды, г/см³
  const W_decimal = sample.W / 100;
  
  return (W_decimal * sample.rhos) / (e * rho_w);
}

// Расчёт числа пластичности
export function calculateIp(sample: Sample): number | undefined {
  if (sample.WL === undefined || sample.WP === undefined) return undefined;
  
  return sample.WL - sample.WP;
}

// Расчёт показателя текучести
export function calculateIL(sample: Sample): number | undefined {
  const Ip = calculateIp(sample);
  if (Ip === undefined || Ip === 0 || sample.W === undefined || sample.WP === undefined) return undefined;
  
  return (sample.W - sample.WP) / Ip;
}

// Расчёт коэффициента выветрелости
export function calculateK1(sample: Sample): number | undefined {
  if (sample.q1 === undefined || sample.q2 === undefined || sample.q2 === 0) return undefined;
  
  return sample.q1 / sample.q2;
}

// Расчёт коэффициента в природном состоянии
export function calculateK0(sample: Sample): number | undefined {
  const filler = calculateFiller(sample);
  if (filler === undefined || filler === 0) return undefined;
  
  const g = sample.granulometry;
  if (!g) return undefined;

  // Крупные фракции > 2 мм
  const coarseFractions = [g.f200, g.f100, g.f60, g.f10, g.f5, g.f2];
  const definedCoarse = coarseFractions.filter(f => f !== undefined && f !== null);
  
  if (definedCoarse.length === 0) return undefined;

  const coarseSum = definedCoarse.reduce((sum, f) => sum + (f || 0), 0);
  
  return filler / coarseSum;
}

// Основная функция расчёта всех показателей
export function calculateAllValues(sample: Sample): CalculatedValues {
  return {
    particleSum: calculateParticleSum(sample),
    filler: calculateFiller(sample),
    sandInFine: calculateSandInFine(sample),
    rhod: calculateRhod(sample),
    e: calculateE(sample),
    n: calculateN(sample),
    Sr: calculateSr(sample),
    Ip: calculateIp(sample),
    IL: calculateIL(sample),
    K1: calculateK1(sample),
    K0: calculateK0(sample),
  };
}

// Функция валидации результатов
export function validateResults(sample: Sample, calculated: CalculatedValues): ValidationErrors {
  const errors: ValidationErrors = {};

  // Проверка суммы частиц
  if (calculated.particleSum !== undefined) {
    const diff = Math.abs(calculated.particleSum - 100);
    if (diff > 1) { // Допуск ±1%
      errors.particleSumError = true;
    }
  }

  // Проверка Ip
  if (calculated.Ip !== undefined && calculated.Ip < 0) {
    errors.ipNegative = true;
  }

  // Проверка деления на ноль
  if (calculated.rhod === undefined && sample.rho !== undefined && sample.W !== undefined) {
    errors.divisionByZero = true;
  }

  return errors;
}

// Функция форматирования значения для отображения
export function formatValue(value: number | undefined, precision: number = 2): string {
  if (value === undefined || value === null) {
    return '—';
  }
  return value.toFixed(precision);
}
