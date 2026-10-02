// Модуль классификации грунтов по ГОСТ 25100
// Этап 4: Классификатор ГОСТ 25100

import { Sample } from '../core/dataStore';
import { CalculatedValues } from './SampleCalculations';

// Интерфейс для результатов классификации
export interface ClassificationResult {
  // Основные результаты
  soilName?: string; // Наименование грунта по ГОСТ
  soilType?: string; // Вид грунта (краткая классификация)
  polyusProjectName?: string; // Название по ПолюсПроект
  
  // Детали классификации
  isCoarseFragmented?: boolean; // Крупнообломочный или нет
  coarseFragmentType?: string; // Валунный/Галечниковый/Гравийный
  sandType?: string; // Вид песка
  sandTypeCode?: number; // Код вида песка (1/2/3)
  densityByE?: string; // Плотность по коэффициенту пористости
  saturationBySr?: string; // Водонасыщение по Sr
  clayTypeByIp?: string; // Вид глинистого по Ip
  consistencyByIL?: string; // Консистенция по IL (словами)
  consistencyCode?: number; // Код консистенции
  mainComponent?: string; // Основной компонент
  fillerType?: string; // Вид заполнителя (если >40%)
  
  // Пучинистость
  frostSusceptibility?: string; // Категория пучинистости
  frostSusceptibilityNormative?: string; // Нормативная пучинистость по ИГЭ
  
  // Окатанность
  roundness?: string; // Окатанность обломков
}

// Классификация крупнообломочных грунтов
function classifyCoarseFragmented(sample: Sample, calc: CalculatedValues): Partial<ClassificationResult> {
  const g = sample.granulometry;
  if (!g) return {};

  // Сумма фракций > 2 мм
  const coarseFractions = [g.f200, g.f100, g.f60, g.f10, g.f5, g.f2];
  const coarseSum: number = coarseFractions.reduce((sum: number, f) => sum + (f || 0), 0);

  if (coarseSum <= 50) return {}; // Не крупнообломочный

  const result: Partial<ClassificationResult> = {
    isCoarseFragmented: true,
  };

  // Определение вида по доминирующей фракции
  if (g.f200 && g.f200 > 50) {
    result.coarseFragmentType = 'Валунный';
  } else if (g.f100 && g.f100 > 50) {
    result.coarseFragmentType = 'Валунный';
  } else if (g.f60 && g.f60 > 50) {
    result.coarseFragmentType = 'Галечниковый';
  } else if (g.f10 && g.f10 > 50) {
    result.coarseFragmentType = 'Гравийный';
  } else {
    result.coarseFragmentType = 'Крупнообломочный';
  }

  // Определение заполнителя
  const filler = calc.filler || 0;
  if (filler > 40) {
    // Заполнитель > 40% - определяем вид
    if (calc.sandInFine && calc.sandInFine > 50) {
      result.fillerType = 'песчаный';
    } else {
      result.fillerType = 'пылевато-глинистый';
    }
  }

  // Формирование наименования
  if (result.fillerType) {
    result.soilName = `${result.coarseFragmentType} с ${result.fillerType} заполнителем`;
  } else {
    result.soilName = result.coarseFragmentType;
  }

  result.soilType = 'Крупнообломочный';

  return result;
}

// Классификация песчаных грунтов
function classifySandy(sample: Sample, calc: CalculatedValues): Partial<ClassificationResult> {
  const g = sample.granulometry;
  if (!g) return {};

  // Сумма фракций > 2 мм
  const coarseFractions = [g.f200, g.f100, g.f60, g.f10, g.f5, g.f2];
  const coarseSum: number = coarseFractions.reduce((sum: number, f) => sum + (f || 0), 0);

  if (coarseSum > 50) return {}; // Это крупнообломочный

  // Накопленные проценты для определения вида песка
  const f2 = g.f2 || 0;
  const f1 = g.f1 || 0;
  const f05 = g.f05 || 0;
  const f025 = g.f025 || 0;
  const f01 = g.f01 || 0;

  let sandType = '';
  let sandTypeCode = 0;

  if (f2 >= 50) {
    sandType = 'Гравелистый';
    sandTypeCode = 1;
  } else if (f2 + f1 >= 50) {
    sandType = 'Крупный';
    sandTypeCode = 2;
  } else if (f2 + f1 + f05 >= 50) {
    sandType = 'Средней крупности';
    sandTypeCode = 3;
  } else if (f2 + f1 + f05 + f025 >= 50) {
    sandType = 'Мелкий';
    sandTypeCode = 4;
  } else {
    sandType = 'Пылеватый';
    sandTypeCode = 5;
  }

  const result: Partial<ClassificationResult> = {
    isCoarseFragmented: false,
    sandType,
    sandTypeCode,
    soilType: 'Песчаный',
  };

  // Определение плотности по коэффициенту пористости
  if (calc.e !== undefined) {
    if (calc.e < 0.55) {
      result.densityByE = 'Плотный';
    } else if (calc.e < 0.7) {
      result.densityByE = 'Средней плотности';
    } else {
      result.densityByE = 'Рыхлый';
    }
  }

  // Определение водонасыщения по Sr
  if (calc.Sr !== undefined) {
    if (calc.Sr < 0.5) {
      result.saturationBySr = 'Маловлажный';
    } else if (calc.Sr < 0.8) {
      result.saturationBySr = 'Влажный';
    } else {
      result.saturationBySr = 'Насыщенный водой';
    }
  }

  // Формирование наименования
  result.soilName = `Песок ${sandType.toLowerCase()}`;
  if (result.densityByE) {
    result.soilName += ` ${result.densityByE.toLowerCase()}`;
  }
  if (result.saturationBySr) {
    result.soilName += ` ${result.saturationBySr.toLowerCase()}`;
  }

  return result;
}

// Классификация глинистых грунтов
function classifyClayey(sample: Sample, calc: CalculatedValues): Partial<ClassificationResult> {
  if (calc.Ip === undefined) return {};

  const result: Partial<ClassificationResult> = {
    isCoarseFragmented: false,
    soilType: 'Глинистый',
  };

  // Определение вида по Ip
  if (calc.Ip <= 1) {
    result.clayTypeByIp = 'Песок пылеватый';
    result.soilName = 'Песок пылеватый';
  } else if (calc.Ip <= 7) {
    result.clayTypeByIp = 'Супесь';
    result.soilName = 'Супесь';
  } else if (calc.Ip <= 17) {
    result.clayTypeByIp = 'Суглинок';
    result.soilName = 'Суглинок';
  } else {
    result.clayTypeByIp = 'Глина';
    result.soilName = 'Глина';
  }

  // Определение консистенции по IL
  if (calc.IL !== undefined) {
    if (calc.IL < 0) {
      result.consistencyByIL = 'Твёрдая';
      result.consistencyCode = 1;
    } else if (calc.IL < 0.25) {
      result.consistencyByIL = 'Полутвёрдая';
      result.consistencyCode = 2;
    } else if (calc.IL < 0.5) {
      result.consistencyByIL = 'Тугопластичная';
      result.consistencyCode = 3;
    } else if (calc.IL < 0.75) {
      result.consistencyByIL = 'Мягкопластичная';
      result.consistencyCode = 4;
    } else if (calc.IL < 1) {
      result.consistencyByIL = 'Текучепластичная';
      result.consistencyCode = 5;
    } else {
      result.consistencyByIL = 'Текучая';
      result.consistencyCode = 6;
    }

    result.soilName += ` ${result.consistencyByIL.toLowerCase()}`;
  }

  return result;
}

// Определение пучинистости
function classifyFrostSusceptibility(sample: Sample, calc: CalculatedValues): Partial<ClassificationResult> {
  const result: Partial<ClassificationResult> = {};

  // Упрощённая классификация по ГОСТ 25100 табл. 27
  const W = sample.W || 0;
  const filler = calc.filler || 0;

  if (filler < 10) {
    result.frostSusceptibility = 'Непучинистый';
  } else if (filler < 30) {
    if (W < 15) {
      result.frostSusceptibility = 'Слабопучинистый';
    } else {
      result.frostSusceptibility = 'Пучинистый';
    }
  } else {
    if (W < 20) {
      result.frostSusceptibility = 'Слабопучинистый';
    } else if (W < 30) {
      result.frostSusceptibility = 'Пучинистый';
    } else {
      result.frostSusceptibility = 'Сильнопучинистый';
    }
  }

  return result;
}

// Генерация названия по ПолюсПроект
function generatePolyusProjectName(classification: Partial<ClassificationResult>): string {
  if (classification.isCoarseFragmented) {
    return classification.soilName || '';
  }

  if (classification.sandType) {
    // Для песков
    let name = `Песок ${classification.sandType.toLowerCase()}`;
    if (classification.densityByE) {
      name += `, ${classification.densityByE.toLowerCase()}`;
    }
    return name;
  }

  if (classification.clayTypeByIp) {
    // Для глинистых
    let name = classification.clayTypeByIp;
    if (classification.consistencyByIL) {
      name += ` ${classification.consistencyByIL.toLowerCase()}`;
    }
    return name;
  }

  return '';
}

// Основная функция классификации
export function classifySoil(sample: Sample, calc: CalculatedValues): ClassificationResult {
  let result: Partial<ClassificationResult> = {};

  // Попытка классификации в порядке приоритета
  const coarseResult = classifyCoarseFragmented(sample, calc);
  if (coarseResult.isCoarseFragmented) {
    result = { ...result, ...coarseResult };
  } else {
    const sandyResult = classifySandy(sample, calc);
    if (sandyResult.sandType) {
      result = { ...result, ...sandyResult };
    } else {
      const clayeyResult = classifyClayey(sample, calc);
      if (clayeyResult.clayTypeByIp) {
        result = { ...result, ...clayeyResult };
      }
    }
  }

  // Пучинистость
  const frostResult = classifyFrostSusceptibility(sample, calc);
  result = { ...result, ...frostResult };

  // Название по ПолюсПроект
  result.polyusProjectName = generatePolyusProjectName(result);

  return result as ClassificationResult;
}
