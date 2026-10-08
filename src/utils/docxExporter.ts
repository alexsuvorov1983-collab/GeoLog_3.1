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
  Tab,
  TabStopPosition,
  TabStopType
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

// Поля рамки по ГОСТ Р 21.1101 (в мм)
const FRAME_MARGINS = {
  left: 20,
  right: 5,
  top: 5,
  bottom: 5
};

// Размеры штампов (в мм)
const STAMP_SIZES = {
  big: { width: 185, height: 55 },
  small: { width: 185, height: 15 }
};

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

// Создание малого штампа (форма 2) - таблица с шифром и номерами страниц
function createSmallStamp(stampSettings: StampSettings): Table {
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: stampSettings.code, size: 18, font: 'Times New Roman' }),
                  new TextRun({ text: '  ' }),
                  new TextRun({ children: ['Лист ', PageNumber.CURRENT], size: 18, font: 'Times New Roman' }),
                  new TextRun({ text: '  ' }),
                  new TextRun({ children: ['Листов ', PageNumber.TOTAL_PAGES], size: 18, font: 'Times New Roman' })
                ],
                alignment: AlignmentType.CENTER
              })
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
            },
            width: { size: convertMillimetersToTwip(STAMP_SIZES.small.width), type: WidthType.DXA }
          })
        ]
      })
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
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

  // Header с рамкой (таблица 1×1 на всю страницу)
  const headerContent: Paragraph[] = [];
  
  // Footer со штампом
  let footerContent: any[] = [];
  
  if (pageSettings.stamp === 'big') {
    footerContent = [
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [new TextRun({ text: '' })],
        alignment: AlignmentType.RIGHT
      })
    ];
  } else if (pageSettings.stamp === 'small') {
    footerContent = [
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [new TextRun({ text: '' })],
        alignment: AlignmentType.RIGHT
      })
    ];
  }

  return {
    properties: {
      page: {
        size: {
          width: convertMillimetersToTwip(pageWidth),
          height: convertMillimetersToTwip(pageHeight),
          orientation: pageSettings.orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
        },
        margin: {
          top: convertMillimetersToTwip(FRAME_MARGINS.top),
          right: convertMillimetersToTwip(FRAME_MARGINS.right),
          bottom: convertMillimetersToTwip(FRAME_MARGINS.bottom),
          left: convertMillimetersToTwip(FRAME_MARGINS.left)
        },
        // Рамка страницы
        border: {
          top: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 },
          left: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 },
          right: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 }
        }
      },
      type: isFirstSection ? SectionType.CONTINUOUS : SectionType.NEXT_PAGE
    },
    headers: {
      default: new Header({
        children: headerContent
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
    const settings = pageSettings[section.id] || { format: 'A4', orientation: 'portrait', stamp: 'small' };

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
