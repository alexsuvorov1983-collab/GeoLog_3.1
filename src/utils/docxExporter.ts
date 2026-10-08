// Экспорт пояснительной записки в DOCX с ГОСТ-рамками и штампами
// Этап 7: Пояснительная записка - ГОСТ рамки и штампы

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageNumber,
  Footer,
  Header,
  SectionType,
  PageOrientation,
  convertMillimetersToTwip,
  VerticalAlign,
  HeightRule,
  TableLayoutType
} from 'docx';
import { saveAs } from 'file-saver';
import { REPORT_SECTIONS, PageSettings, StampSettings } from './reportStructure';

interface SectionData {
  id: string;
  text?: string;
  tableRows?: string[][];
}

// Размеры страниц в мм
const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 }
};

// Поля страницы (в мм)
const PAGE_MARGINS = {
  top: 10,
  bottom: 20,
  left: 20,
  right: 10
};

// Расстояния колонтитулов (в мм)
const HEADER_FOOTER_DISTANCE = 5;

// Размеры рамки (в мм) - для A4 вертикальная
const FRAME_SIZE = {
  width: 185,  // 210 - 20 (left) - 5 (right)
  height: 287  // 297 - 5 (top) - 5 (bottom)
};

// Размеры штампов (в мм)
const STAMP_SIZES = {
  big: { width: 185, height: 55 },
  small: { width: 185, height: 15 }
};

// Коэффициент конвертации мм в твипы
const MM_TO_TWIP = 56.6929;

// Создание большого штампа (форма 1) - таблица с реквизитами
function createBigStamp(stampSettings: StampSettings): Table {
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: stampSettings.organization, size: 20, font: 'Times New Roman' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 20 }
              }),
              new Paragraph({
                children: [new TextRun({ text: stampSettings.documentName, size: 20, font: 'Times New Roman' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 20 }
              }),
              new Paragraph({
                children: [new TextRun({ text: stampSettings.code, size: 18, font: 'Times New Roman' })],
                alignment: AlignmentType.CENTER
              })
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
            },
            width: { size: convertMillimetersToTwip(STAMP_SIZES.big.width), type: WidthType.DXA }
          })
        ]
      })
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

// Создание малого штампа (форма 2) - таблица с двумя колонками
function createSmallStamp(stampSettings: StampSettings): Table {
  const stampWidth = STAMP_SIZES.small.width;
  const stampHeight = STAMP_SIZES.small.height;
  
  // Левая колонка: пустые графы (Изм, Лист, №док, Подп, Дата)
  const leftColumnWidth = Math.round((stampWidth * 0.4) * MM_TO_TWIP);
  // Правая колонка: шифр и номера страниц
  const rightColumnWidth = Math.round((stampWidth * 0.6) * MM_TO_TWIP);

  return new Table({
    width: { size: Math.round(stampWidth * MM_TO_TWIP), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        height: { value: Math.round(stampHeight * MM_TO_TWIP), rule: HeightRule.EXACT },
        children: [
          // Левая колонка - пустые графы
          new TableCell({
            width: { size: leftColumnWidth, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
            },
            margins: {
              top: 0,
              bottom: 0,
              left: 20,
              right: 20
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Изм.', size: 20, font: 'Times New Roman' }),
                  new TextRun({ text: '  ' }),
                  new TextRun({ text: 'Лист', size: 20, font: 'Times New Roman' }),
                  new TextRun({ text: '  ' }),
                  new TextRun({ text: '№докум.', size: 20, font: 'Times New Roman' }),
                  new TextRun({ text: '  ' }),
                  new TextRun({ text: 'Подп.', size: 20, font: 'Times New Roman' }),
                  new TextRun({ text: '  ' }),
                  new TextRun({ text: 'Дата', size: 20, font: 'Times New Roman' })
                ]
              })
            ]
          }),
          // Правая колонка - шифр и номера страниц
          new TableCell({
            width: { size: rightColumnWidth, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
            },
            margins: {
              top: 0,
              bottom: 0,
              left: 20,
              right: 20
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: stampSettings.code, size: 20, font: 'Times New Roman' }),
                  new TextRun({ text: '  ' }),
                  new TextRun({ text: 'Лист ', size: 20, font: 'Times New Roman' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 20, font: 'Times New Roman' }),
                  new TextRun({ text: '  ' }),
                  new TextRun({ text: 'Листов ', size: 20, font: 'Times New Roman' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, font: 'Times New Roman' })
                ],
                alignment: AlignmentType.RIGHT
              })
            ]
          })
        ]
      })
    ]
  });
}

// Создание таблицы с данными
function createTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    children: headers.map(header => 
      new TableCell({
        children: [
          new Paragraph({
            text: header,
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 }
          })
        ],
        shading: { fill: 'D9D9D9' },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
        }
      })
    )
  });

  const dataRows = rows.map(row => 
    new TableRow({
      children: row.map(cell => 
        new TableCell({
          children: [
            new Paragraph({
              text: cell,
              spacing: { after: 0 }
            })
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
          }
        })
      )
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

// Создание рамки через таблицу в header
function createFrameInHeader(pageSettings: PageSettings): Table {
  // Рамка всегда 185×287 мм для A4 вертикальная
  const frameWidth = FRAME_SIZE.width;
  const frameHeight = FRAME_SIZE.height;

  // Создаем таблицу 1x1 с границами
  return new Table({
    width: { size: Math.round(frameWidth * MM_TO_TWIP), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 8, color: '000000' }
    },
    rows: [
      new TableRow({
        cantSplit: true,
        height: { value: Math.round(frameHeight * MM_TO_TWIP), rule: HeightRule.EXACT },
        children: [
          new TableCell({
            width: { size: Math.round(frameWidth * MM_TO_TWIP), type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 8, color: '000000' }
            },
            margins: {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0
            },
            children: [new Paragraph({ text: '' })]
          })
        ]
      })
    ]
  });
}

// Создание секции документа с рамкой и штампом
function createSection(
  sectionData: SectionData,
  section: typeof REPORT_SECTIONS[0],
  pageSettings: PageSettings,
  stampSettings: StampSettings,
  isFirstSection: boolean
): any {
  const children: any[] = [];

  // Заголовок раздела
  const headingText = section.number ? `${section.number} ${section.title}` : section.title;
  children.push(
    new Paragraph({
      text: headingText,
      heading: section.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      alignment: AlignmentType.CENTER
    })
  );

  // Текст раздела
  if (sectionData?.text) {
    const paragraphs = sectionData.text.split('\n\n');
    paragraphs.forEach(para => {
      children.push(
        new Paragraph({
          text: para,
          spacing: { after: 200, line: 360 },
          indent: { firstLine: convertMillimetersToTwip(12.5) }
        })
      );
    });
  }

  // Таблица раздела
  if (sectionData?.tableRows && section.tableHeaders) {
    children.push(createTable(section.tableHeaders, sectionData.tableRows));
  }

  // Настройки страницы
  const pageSize = PAGE_SIZES[pageSettings.format];
  const pageWidth = pageSettings.orientation === 'portrait' ? pageSize.width : pageSize.height;
  const pageHeight = pageSettings.orientation === 'portrait' ? pageSize.height : pageSize.width;

  // Создание рамки через таблицу в header
  const frameTable = createFrameInHeader(pageSettings);
  
  return {
    properties: {
      page: {
        size: {
          width: convertMillimetersToTwip(pageWidth),
          height: convertMillimetersToTwip(pageHeight),
          orientation: pageSettings.orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
        },
        margin: {
          top: convertMillimetersToTwip(PAGE_MARGINS.top),
          right: convertMillimetersToTwip(PAGE_MARGINS.right),
          bottom: convertMillimetersToTwip(PAGE_MARGINS.bottom),
          left: convertMillimetersToTwip(PAGE_MARGINS.left)
        },
        headerDistance: convertMillimetersToTwip(HEADER_FOOTER_DISTANCE),
        footerDistance: convertMillimetersToTwip(HEADER_FOOTER_DISTANCE)
      },
      type: isFirstSection ? SectionType.CONTINUOUS : SectionType.NEXT_PAGE
    },
    headers: {
      default: new Header({
        children: [frameTable]
      })
    },
    footers: {
      default: new Footer({
        children: pageSettings.stamp === 'big' 
          ? [createBigStamp(stampSettings)]
          : pageSettings.stamp === 'small'
          ? [createSmallStamp(stampSettings)]
          : [new Paragraph({ text: '' })]
      })
    },
    children
  };
}

// Главная функция генерации DOCX
export async function generateDocx(
  projectName: string,
  sections: SectionData[],
  pageSettings: Record<string, PageSettings>,
  stampSettings: StampSettings
): Promise<void> {
  const docSections: any[] = [];

  // Создаём секции для каждого раздела
  for (let i = 0; i < REPORT_SECTIONS.length; i++) {
    const section = REPORT_SECTIONS[i];
    const sectionData = sections.find(s => s.id === section.id);
    
    // Получаем настройки или используем значения по умолчанию
    const settings = pageSettings[section.id] || { 
      format: 'A4', 
      orientation: 'portrait', 
      stamp: 'small' 
    };

    const docSection = createSection(
      sectionData || { id: section.id },
      section,
      settings,
      stampSettings,
      i === 0
    );

    docSections.push(docSection);
  }

  // Создание документа
  const doc = new Document({
    sections: docSections
  });

  // Генерация и скачивание файла
  const blob = await Packer.toBlob(doc);
  const fileName = `${projectName}_ПЗ.docx`;
  saveAs(blob, fileName);
}

// Конец файла
