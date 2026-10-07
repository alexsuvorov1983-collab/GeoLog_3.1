// Структура разделов пояснительной записки
// Этап 7: Пояснительная записка

export interface ReportSection {
  id: string;
  number: string;
  title: string;
  level: number; // 1 = основной раздел, 2 = подраздел
  parentId?: string;
  hasTable?: boolean;
  tableHeaders?: string[];
}

export const REPORT_SECTIONS: ReportSection[] = [
  { id: 'report-cover', number: '', title: 'Обложка', level: 1 },
  { id: 'report-title', number: '', title: 'Титул', level: 1 },
  { id: 'report-executors', number: '', title: 'Список исполнителей', level: 1 },
  { id: 'report-volume-contents', number: '', title: 'Содержание тома', level: 1 },
  { id: 'report-documentation', number: '', title: 'Состав отчётной документации', level: 1 },
  { id: 'report-contents', number: '', title: 'Содержание', level: 1 },
  { id: 'report-1', number: '1', title: 'Введение', level: 1 },
  { id: 'report-2', number: '2', title: 'Изученность инженерно-геологических условий', level: 1 },
  { id: 'report-3', number: '3', title: 'Физико-географические и техногенные условия', level: 1 },
  { id: 'report-4', number: '4', title: 'Методики и технология выполнения работ', level: 1 },
  { id: 'report-5', number: '5', title: 'Геолого-геоморфологическое строение', level: 1 },
  { id: 'report-5-1', number: '5.1', title: 'Стратиграфия', level: 2, parentId: 'report-5' },
  { id: 'report-6', number: '6', title: 'Гидрогеологические условия', level: 1 },
  { id: 'report-7', number: '7', title: 'Свойства грунтов', level: 1 },
  { id: 'report-8', number: '8', title: 'Специфические грунты', level: 1 },
  { id: 'report-9', number: '9', title: 'Геологические и инженерно-геологические процессы', level: 1 },
  { id: 'report-10', number: '10', title: 'Инженерно-геологические условия', level: 1 },
  { id: 'report-11', number: '11', title: 'Геофизические исследования', level: 1 },
  { id: 'report-12', number: '12', title: 'Уточнение исходной сейсмичности', level: 1 },
  { id: 'report-13', number: '13', title: 'Прогноз изменения инженерно-геологических условий', level: 1 },
  { id: 'report-14', number: '14', title: 'Сведения о контроле качества и приемке работ', level: 1 },
  { id: 'report-15', number: '15', title: 'Заключение', level: 1 },
  { id: 'report-16', number: '16', title: 'Список использованной литературы', level: 1 },
  { id: 'report-app-a', number: 'Приложение А', title: 'Техническое задание на выполнение инженерных изысканий', level: 1 },
  { id: 'report-app-b', number: 'Приложение Б', title: 'Программа работ на производство инженерно-геологических изысканий', level: 1 },
  { id: 'report-app-v', number: 'Приложение В', title: 'Выписка из реестра членов саморегулируемой организации', level: 1 },
  { id: 'report-app-g', number: 'Приложение Г', title: 'Каталог координат и высот инженерно-геологических выработок', level: 1, hasTable: true, tableHeaders: ['№ п/п', '№ скважины', 'X', 'Y', 'Долгота', 'Широта', 'Отметка устья, м', 'Глубина, м', 'Дата'] },
  { id: 'report-app-d', number: 'Приложение Д', title: 'Сводная таблица физико-механических свойств грунтов', level: 1, hasTable: true, tableHeaders: ['ИГЭ', 'Наименование', 'ρ', 'ρd', 'ρs', 'W', 'WL', 'WP', 'Ip', 'IL', 'e', 'Sr', 'c', 'φ', 'E'] },
  { id: 'report-app-e', number: 'Приложение Е', title: 'Ведомость результатов лабораторных испытаний агрессивного воздействия грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'Тип агрессии', 'pH', 'SO₄²⁻', 'Mg²⁺', 'HCO₃⁻'] },
  { id: 'report-app-zh', number: 'Приложение Ж', title: 'Результаты лабораторного определения степени засоленности грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'Степень засоления', 'Сумма солей, %'] },
  { id: 'report-app-i', number: 'Приложение И', title: 'Паспорта компрессионных испытаний талых грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'ИГЭ', 'e₀', 'm₀', 'Eoed'] },
  { id: 'report-app-k', number: 'Приложение К', title: 'Паспорта компрессионных испытаний мерзлых грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'Температура, °C', 'Льдистость', 'Eoed'] },
  { id: 'report-app-l', number: 'Приложение Л', title: 'Ведомость химического анализа подземных вод', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'pH', 'Минерализация', 'Жесткость', 'Тип воды'] },
  { id: 'report-app-m', number: 'Приложение М', title: 'Ведомость лабораторного определения коррозионной агрессивности грунта', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'Удельное сопротивление, Ом·м', 'Категория агрессивности'] },
  { id: 'report-app-n', number: 'Приложение Н', title: 'Ведомость лабораторного определения относительной деформации пучения грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'Влажность, %', 'Деформация пучения, %'] },
  { id: 'report-app-p', number: 'Приложение П', title: 'Трехосное сжатие грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'σ₃, МПа', 'σ₁, МПа', 'c, кПа', 'φ, град'] },
  { id: 'report-app-r', number: 'Приложение Р', title: 'Определение коэффициента истираемости крупнообломочного грунта', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'Kwr', 'Потеря массы, %'] },
  { id: 'report-app-s', number: 'Приложение С', title: 'Лабораторное определение касательной силы морозного пучения грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'τf, кПа'] },
  { id: 'report-app-t', number: 'Приложение Т', title: 'Трёхосное сжатие глинистых и крупнообломочных грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'Тип грунта', 'c, кПа', 'φ, град', 'E, МПа'] },
  { id: 'report-app-u', number: 'Приложение У', title: 'Оценка прочности и сжимаемости крупнообломочных грунтов', level: 1, hasTable: true, tableHeaders: ['№ пробы', 'Скважина', 'Глубина, м', 'Rc, МПа', 'E, МПа'] },
  { id: 'report-app-f', number: 'Приложение Ф', title: 'Результаты рекогносцировочного обследования', level: 1 },
  { id: 'report-app-h', number: 'Приложение Х', title: 'Статическое зондирование грунтов', level: 1, hasTable: true, tableHeaders: ['№ точки', 'Глубина, м', 'qc, МПа', 'fs, кПа'] },
  { id: 'report-app-ts', number: 'Приложение Ц', title: 'Динамическое зондирование', level: 1, hasTable: true, tableHeaders: ['№ точки', 'Глубина, м', 'Отказ, см'] },
  { id: 'report-app-sh', number: 'Приложение Ш', title: 'Штамповые испытания грунтов', level: 1, hasTable: true, tableHeaders: ['№ штампа', 'Глубина, м', 'Давление, МПа', 'Осадка, мм', 'E, МПа'] },
  { id: 'report-app-sch', number: 'Приложение Щ', title: 'Крыльчатка', level: 1, hasTable: true, tableHeaders: ['№ точки', 'Глубина, м', 'Прочность, кПа'] },
  { id: 'report-app-e2', number: 'Приложение Э', title: 'Ведомость коррозийной агрессивности грунта по отношению к стали', level: 1, hasTable: true, tableHeaders: ['№ точки', 'Глубина, м', 'ρ, Ом·м', 'Категория'] },
  { id: 'report-app-yu', number: 'Приложение Ю', title: 'Ведомость определения наличия блуждающих токов', level: 1, hasTable: true, tableHeaders: ['№ точки', 'Дата', 'Время', 'Потенциал, В', 'Градиент, мВ/м'] },
  { id: 'report-app-ya', number: 'Приложение Я', title: 'Акт сдачи-приёмки полевых работ', level: 1 },
  { id: 'report-changes', number: '', title: 'ТАБЛИЦА РЕГИСТРАЦИИ ИЗМЕНЕНИЙ', level: 1, hasTable: true, tableHeaders: ['Изм.', 'Изменённых', 'Заменённых', 'Новых', 'Аннулированных', 'Всего листов', '№ док.', 'Подп.', 'Дата'] },
];

// Конец файла
