// Автогенерация содержимого разделов пояснительной записки
// Этап 7: Пояснительная записка

import { Borehole, GeoLogData } from '../core/dataStore';

interface SectionContent {
  text?: string;
  tableRows?: string[][];
}

export function generateSectionContent(sectionId: string): SectionContent {
  const boreholes = GeoLogData.getAll();
  const dicts = GeoLogData.getDicts();
  
  switch (sectionId) {
    case 'report-1':
      return generateIntroduction();
    case 'report-4':
      return generateMethodology(boreholes);
    case 'report-5-1':
      return generateStratigraphy(boreholes);
    case 'report-6':
      return generateHydrogeology(boreholes);
    case 'report-7':
      return generateSoilProperties(boreholes);
    case 'report-10':
      return generateEngineeringConditions(boreholes);
    case 'report-15':
      return generateConclusion(boreholes);
    case 'report-16':
      return generateLiterature();
    case 'report-app-g':
      return generateBoreholeCatalog(boreholes);
    case 'report-app-d':
      return generateSoilPropertiesTable(dicts);
    case 'report-app-i':
      return generateCompressionTests(boreholes);
    case 'report-app-l':
      return generateWaterChemistry(boreholes);
    case 'report-app-h':
      return generateStaticSounding();
    case 'report-app-ts':
      return generateDynamicSounding();
    case 'report-app-sh':
      return generateStampTests();
    case 'report-app-sch':
      return generateVaneTests();
    case 'report-app-ya':
      return generateAcceptanceAct();
    case 'report-changes':
      return generateChangesTable();
    default:
      return { text: 'Текст раздела будет добавлен позже.' };
  }
}

function generateIntroduction(): SectionContent {
  const currentDate = new Date().toLocaleDateString('ru-RU');
  return {
    text: `Настоящая пояснительная записка составлена по результатам инженерно-геологических изысканий, выполненных для обоснования проектной документации.

Целью работ является изучение инженерно-геологических условий участка изысканий для принятия обоснованных проектных решений по фундаментам и другим инженерным сооружениям.

Задачи изысканий:
- изучение геологического строения и геоморфологии участка;
- определение гидрогеологических условий;
- получение характеристик физико-механических свойств грунтов;
- оценка геологических и инженерно-геологических процессов;
- составление прогноза изменения инженерно-геологических условий.

Работы выполнены в соответствии с требованиями СП 47.13330.2016 «Инженерные изыскания для строительства».

Дата составления: ${currentDate}`
  };
}

function generateMethodology(boreholes: Borehole[]): SectionContent {
  const totalDepth = boreholes.reduce((sum, b) => sum + (b.depth_m || 0), 0);
  const totalSamples = boreholes.reduce((sum, b) => sum + (b.samples?.length || 0), 0);
  const undisturbedSamples = boreholes.reduce((sum, b) => 
    sum + (b.samples?.filter(s => s.sample_type === 'Монолит').length || 0), 0);
  const disturbedSamples = boreholes.reduce((sum, b) => 
    sum + (b.samples?.filter(s => s.sample_type === 'Нарушенный').length || 0), 0);
  const waterSamples = boreholes.reduce((sum, b) => 
    sum + (b.samples?.filter(s => s.sample_type === 'water').length || 0), 0);
  const thermoSessions = boreholes.reduce((sum, b) => 
    sum + (b.thermoSessions?.length || 0), 0);

  return {
    text: `Объём выполненных работ:

- Количество скважин: ${boreholes.length} ед.
- Общая глубина бурения: ${totalDepth.toFixed(1)} м
- Пробы грунта: ${totalSamples} шт. (монолиты: ${undisturbedSamples}, нарушенные: ${disturbedSamples})
- Пробы воды: ${waterSamples} шт.
- Сессии термометрии: ${thermoSessions} шт.

Методики полевых работ:
- Бурение скважин: ${boreholes.length > 0 ? 'вращательное, ударно-канатное' : 'не выполнялось'}
- Описание грунтов: визуальное, с отбором проб
- Определение уровня грунтовых вод: фиксация при бурении

Лабораторные работы:
- Определение физических характеристик грунтов
- Определение механических характеристик
- Химический анализ грунтов и вод`
  };
}

function generateStratigraphy(boreholes: Borehole[]): SectionContent {
  const allLayers: Array<{ depthFrom: number; depthTo: number; groundType: string }> = [];
  
  boreholes.forEach(bh => {
    (bh.soil_layers || []).forEach(layer => {
      allLayers.push({
        depthFrom: layer.depth_from_m,
        depthTo: layer.depth_to_m,
        groundType: layer.ground_type
      });
    });
  });

  const uniqueTypes = Array.from(new Set(allLayers.map(l => l.groundType)));
  
  let text = 'Стратиграфическое расчленение разреза выполнено на основании литологических признаков и физико-механических свойств грунтов.\n\n';
  text += `Выделено ${uniqueTypes.length} типов грунтов:\n\n`;
  
  uniqueTypes.forEach((type, index) => {
    const layers = allLayers.filter(l => l.groundType === type);
    const minDepth = Math.min(...layers.map(l => l.depthFrom));
    const maxDepth = Math.max(...layers.map(l => l.depthTo));
    text += `${index + 1}. ${type} — интервал глубин ${minDepth.toFixed(1)}–${maxDepth.toFixed(1)} м\n`;
  });

  const tableRows = uniqueTypes.map(type => {
    const layers = allLayers.filter(l => l.groundType === type);
    const minDepth = Math.min(...layers.map(l => l.depthFrom));
    const maxDepth = Math.max(...layers.map(l => l.depthTo));
    const avgThickness = (maxDepth - minDepth) / layers.length;
    return [type, `${minDepth.toFixed(1)}–${maxDepth.toFixed(1)}`, avgThickness.toFixed(2)];
  });

  return { text, tableRows };
}

function generateHydrogeology(boreholes: Borehole[]): SectionContent {
  const waterLayers = boreholes.flatMap(bh => 
    (bh.water_layers || []).map(wl => ({
      boreholeNumber: bh.number,
      depth: wl.depth_m,
      type: wl.water_type
    }))
  );

  let text = 'Гидрогеологические условия участка изучены по данным опробования скважин.\n\n';
  
  if (waterLayers.length === 0) {
    text += 'Водоносные горизонты не выявлены.';
  } else {
    text += `Выявлено ${waterLayers.length} водопроявлений:\n\n`;
    waterLayers.forEach((wl, index) => {
      text += `${index + 1}. Скважина ${wl.boreholeNumber}, глубина ${wl.depth.toFixed(2)} м — ${wl.type}\n`;
    });
  }

  const tableRows = waterLayers.map(wl => [
    wl.boreholeNumber,
    wl.depth.toFixed(2),
    wl.type
  ]);

  return { text, tableRows };
}

function generateSoilProperties(boreholes: Borehole[]): SectionContent {
  const totalSamples = boreholes.reduce((sum, b) => sum + (b.samples?.length || 0), 0);
  
  return {
    text: `Физико-механические свойства грунтов определены в результате лабораторных испытаний.

Всего отобрано и испытано проб: ${totalSamples} шт.

Основные характеристики:
- Плотность грунтов
- Влажность
- Коэффициент пористости
- Модуль деформации
- Сцепление и угол внутреннего трения

Подробные данные приведены в Приложении Д.`
  };
}

function generateEngineeringConditions(boreholes: Borehole[]): SectionContent {
  const dicts = GeoLogData.getDicts();
  const igeCount = (dicts as any).ige_catalog?.length || 0;
  const waterCount = boreholes.reduce((sum, b) => sum + (b.water_layers?.length || 0), 0);

  return {
    text: `Инженерно-геологические условия участка характеризуются следующими параметрами:

- Количество выделенных инженерно-геологических элементов: ${igeCount}
- Количество водоносных горизонтов: ${waterCount}
- Рельеф: ${boreholes.length > 0 ? 'равнинный' : 'не определён'}
- Сейсмичность: определяется по карте ОСР-78

Условия строительства оцениваются как ${igeCount > 0 ? 'средние' : 'не изучены'}.`
  };
}

function generateConclusion(boreholes: Borehole[]): SectionContent {
  const totalDepth = boreholes.reduce((sum, b) => sum + (b.depth_m || 0), 0);
  const totalSamples = boreholes.reduce((sum, b) => sum + (b.samples?.length || 0), 0);

  return {
    text: `По результатам выполненных инженерно-геологических изысканий можно сделать следующие выводы:

1. Выполнено ${boreholes.length} скважин общей глубиной ${totalDepth.toFixed(1)} м.
2. Отобрано ${totalSamples} проб грунта для лабораторных исследований.
3. Изучены инженерно-геологические условия участка.
4. Определены физико-механические характеристики грунтов.
5. Выявлены гидрогеологические условия.

Полученные данные могут быть использованы для проектирования фундаментов и других инженерных сооружений.

Рекомендации:
- При проектировании учитывать полученные характеристики грунтов
- Контролировать уровень грунтовых вод в период строительства
- Выполнить мониторинг деформаций сооружений`
  };
}

function generateLiterature(): SectionContent {
  return {
    text: `1. СП 47.13330.2016 «Инженерные изыскания для строительства. Основные положения»
2. СП 22.13330.2016 «Основания зданий и сооружений»
3. ГОСТ 25100-2020 «Грунты. Классификация»
4. ГОСТ 20522-2012 «Грунты. Методы статистической обработки результатов определений характеристик»
5. ГОСТ 12536-2014 «Грунты. Методы лабораторного определения гранулометрического состава»
6. ГОСТ 5180-2015 «Грунты. Методы лабораторного определения физических характеристик»
7. ГОСТ 23161-2018 «Грунты. Методы лабораторного определения характеристик просадочности»
8. ГОСТ 25584-2016 «Грунты. Методы лабораторного определения коэффициента фильтрации»
9. ГОСТ 12248-2010 «Грунты. Методы лабораторного определения характеристик прочности и деформируемости»
10. ГОСТ 28622-2012 «Грунты. Методы лабораторного определения пучинистости»`
  };
}

function generateBoreholeCatalog(boreholes: Borehole[]): SectionContent {
  const tableRows = boreholes.map((bh, index) => [
    String(index + 1),
    bh.number,
    bh.x.toFixed(2),
    bh.y.toFixed(2),
    bh.wgs84_lon?.toFixed(4) || '—',
    bh.wgs84_lat?.toFixed(4) || '—',
    bh.elev_m.toFixed(2),
    bh.depth_m.toFixed(2),
    bh.date || '—'
  ]);

  return { tableRows };
}

function generateSoilPropertiesTable(dicts: any): SectionContent {
  const igeCatalog = dicts.ige_catalog || [];
  
  const tableRows = igeCatalog.map((ige: any) => [
    ige.code,
    ige.name,
    '—', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—'
  ]);

  return { tableRows };
}

function generateCompressionTests(boreholes: Borehole[]): SectionContent {
  const undisturbedSamples = boreholes.flatMap(bh => 
    (bh.samples || [])
      .filter(s => s.sample_type === 'Монолит')
      .map(s => ({
        labNumber: s.lab_number || '—',
        boreholeNumber: bh.number,
        depth: s.depth_m,
        igeCode: s.ige_code || '—'
      }))
  );

  const tableRows = undisturbedSamples.map(s => [
    s.labNumber,
    s.boreholeNumber,
    s.depth.toFixed(2),
    s.igeCode,
    '—', '—', '—'
  ]);

  return { tableRows };
}

function generateWaterChemistry(boreholes: Borehole[]): SectionContent {
  const waterSamples = boreholes.flatMap(bh => 
    (bh.samples || [])
      .filter(s => s.sample_type === 'water')
      .map(s => ({
        labNumber: s.lab_number || '—',
        boreholeNumber: bh.number,
        depth: s.depth_m
      }))
  );

  const tableRows = waterSamples.map(s => [
    s.labNumber,
    s.boreholeNumber,
    s.depth.toFixed(2),
    '—', '—', '—', '—', '—'
  ]);

  return { tableRows };
}

function generateStaticSounding(): SectionContent {
  return {
    text: 'Данные статического зондирования будут добавлены после выполнения полевых работ.',
    tableRows: []
  };
}

function generateDynamicSounding(): SectionContent {
  return {
    text: 'Данные динамического зондирования будут добавлены после выполнения полевых работ.',
    tableRows: []
  };
}

function generateStampTests(): SectionContent {
  return {
    text: 'Данные штамповых испытаний будут добавлены после выполнения полевых работ.',
    tableRows: []
  };
}

function generateVaneTests(): SectionContent {
  return {
    text: 'Данные испытаний крыльчаткой будут добавлены после выполнения полевых работ.',
    tableRows: []
  };
}

function generateAcceptanceAct(): SectionContent {
  const currentDate = new Date().toLocaleDateString('ru-RU');
  return {
    text: `АКТ
сдачи-приёмки полевых работ по инженерно-геологическим изысканиям

Дата: ${currentDate}

Настоящий акт составлен в том, что полевые работы по инженерно-геологическим изысканиям выполнены в полном объёме согласно программе работ и требованиям нормативных документов.

Заказчик: _________________
Исполнитель: _________________

Подписи:
От заказчика: _________________
От исполнителя: _________________`
  };
}

function generateChangesTable(): SectionContent {
  return {
    tableRows: [
      ['', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '']
    ]
  };
}

// Конец файла
