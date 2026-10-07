// Экспорт пояснительной записки в DOCX
// Этап 7: Пояснительная записка

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
  TableOfContents,
  SectionType,
  convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';
import { REPORT_SECTIONS, ReportSection } from './reportStructure';

interface SectionData {
  id: string;
  text?: string;
  tableRows?: string[][];
}

export async function generateDocx(
  projectName: string,
  sections: SectionData[]
): Promise<void> {
  const children: any[] = [];

  // Секция 1: Титульный лист
  children.push(
    new Paragraph({
      text: 'МИНИСТЕРСТВО СТРОИТЕЛЬСТВА РОССИЙСКОЙ ФЕДЕРАЦИИ',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: projectName.toUpperCase(),
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: 'ПОЯСНИТЕЛЬНАЯ ЗАПИСКА',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6 },
        bottom: { style: BorderStyle.SINGLE, size: 6 }
      }
    }),
    new Paragraph({
      text: 'к проектной документации',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: 'ИНЖЕНЕРНО-ГЕОЛОГИЧЕСКИЕ ИЗЫСКАНИЯ',
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 }
    }),
    new Paragraph({
      text: new Date().getFullYear().toString(),
      alignment: AlignmentType.CENTER
    })
  );

  // Секция 2: Таблица регистрации изменений
  children.push(
    new Paragraph({
      children: [new PageBreak()]
    }),
    new Paragraph({
      text: 'ТАБЛИЦА РЕГИСТРАЦИИ ИЗМЕНЕНИЙ',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  const changesSection = sections.find(s => s.id === 'report-changes');
  if (changesSection?.tableRows) {
    children.push(createTable(['Изм.', 'Изменённых', 'Заменённых', 'Новых', 'Аннулированных', 'Всего листов', '№ док.', 'Подп.', 'Дата'], changesSection.tableRows));
  }

  // Оглавление
  children.push(
    new Paragraph({
      children: [new PageBreak()]
    }),
    new Paragraph({
      text: 'СОДЕРЖАНИЕ',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new TableOfContents('Table of Contents', {
      hyperlink: true,
      headingStyleRange: '1-2'
    })
  );

  // Секция 3: Основные разделы и приложения
  for (const section of REPORT_SECTIONS) {
    const sectionData = sections.find(s => s.id === section.id);
    
    // Новая страница для приложений
    if (section.id.startsWith('report-app-') || section.id === 'report-changes') {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // Заголовок раздела
    const headingText = section.number ? `${section.number} ${section.title}` : section.title;
    children.push(
      new Paragraph({
        text: headingText,
        heading: section.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
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
            indent: { firstLine: convertInchesToTwip(0.5) }
          })
        );
      });
    }

    // Таблица раздела
    if (sectionData?.tableRows && section.tableHeaders) {
      children.push(createTable(section.tableHeaders, sectionData.tableRows));
    }
  }

  // Создание документа
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.79), // 20 мм
            right: convertInchesToTwip(0.39), // 10 мм
            bottom: convertInchesToTwip(0.79), // 20 мм
            left: convertInchesToTwip(1.18) // 30 мм
          }
        }
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT]
                })
              ]
            })
          ]
        })
      },
      children
    }]
  });

  // Генерация и скачивание файла
  const blob = await Packer.toBlob(doc);
  const fileName = `${projectName}_ПЗ.docx`;
  saveAs(blob, fileName);
}

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
        shading: { fill: 'D9D9D9' }
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
          ]
        })
      )
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

// Конец файла
