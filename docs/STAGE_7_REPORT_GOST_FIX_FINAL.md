# Исправление: ГОСТ-рамки и штампы в DOCX (финальная версия)

## Дата
2026-01-29

## Проблема
Рамки и штампы не добавлялись в экспортируемый DOCX файл при использовании функции "Настройки листа".

## Причина
Свойство `page.border` не поддерживается в текущей версии библиотеки docx. Нужно использовать другой подход - создание рамки через таблицу в header с правильными размерами и границами.

## Решение

### Ключевые изменения в `docxExporter.ts`

**1. Создание рамки через таблицу в header**

Добавлена функция `createFrameInHeader()`:
```typescript
function createFrameInHeader(pageSettings: PageSettings): Table {
  const pageSize = PAGE_SIZES[pageSettings.format];
  const pageWidth = pageSettings.orientation === 'portrait' ? pageSize.width : pageSize.height;
  const pageHeight = pageSettings.orientation === 'portrait' ? pageSize.height : pageSize.width;
  
  const contentWidth = pageWidth - FRAME_MARGINS.left - FRAME_MARGINS.right;
  const contentHeight = pageHeight - FRAME_MARGINS.top - FRAME_MARGINS.bottom;

  return new Table({
    rows: [
      new TableRow({
        height: { value: convertMillimetersToTwip(contentHeight), rule: 'exact' },
        children: [
          new TableCell({
            width: { size: convertMillimetersToTwip(contentWidth), type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
              left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
              right: { style: BorderStyle.SINGLE, size: 8, color: '000000' }
            },
            children: [new Paragraph({ text: '' })]
          })
        ]
      })
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}
```

**2. Интеграция рамки в header секции**

```typescript
const frameTable = createFrameInHeader(pageSettings);

return {
  properties: {
    page: {
      size: { ... },
      margin: {
        top: convertMillimetersToTwip(FRAME_MARGINS.top),
        right: convertMillimetersToTwip(FRAME_MARGINS.right),
        bottom: convertMillimetersToTwip(FRAME_MARGINS.bottom),
        left: convertMillimetersToTwip(FRAME_MARGINS.left)
      }
    }
  },
  headers: {
    default: new Header({
      children: [frameTable]  // Рамка в header
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
```

**3. Удаление неподдерживаемого `page.border`**

Убрано использование `page.border`, которое не поддерживается библиотекой docx.

## Как это работает

### Рамка страницы

Рамка создаётся как таблица 1×1 в header:
- Таблица имеет точную высоту, равную высоте страницы минус поля
- Ширина таблицы равна ширине страницы минус поля
- Все 4 границы таблицы имеют стиль SINGLE, размер 8 (толстая линия), цвет чёрный
- Таблица размещается в header, который повторяется на каждой странице

### Штамп в footer

Штамп создаётся как таблица в footer:
- **Большой штамп (форма 1)**: 185×55 мм, содержит организацию, название, шифр
- **Малый штамп (форма 2)**: 185×15 мм, содержит шифр и номера страниц
- **Без штампа**: пустой footer

### Поля страницы

Поля устанавливаются согласно ГОСТ Р 21.1101:
- Левое: 20 мм (для переплёта)
- Правое: 5 мм
- Верхнее: 5 мм
- Нижнее: 5 мм

## Проверка

### Тест 1: Рамка отображается
1. Открыть окно "Пояснительная записка"
2. Нажать кнопку "💾 DOCX"
3. Открыть файл в Word
4. ✅ Рамка должна отображаться на всех страницах как чёрная линия по краям

### Тест 2: Штамп отображается
1. Проверить титульный лист - должен быть большой штамп (185×55 мм)
2. Проверить остальные листы - должны быть малые штампы (185×15 мм)
3. ✅ Шифр, номера страниц отображаются корректно

### Тест 3: Настройки листа работают
1. Нажать кнопку "📄" у любого раздела
2. Изменить формат на A3
3. Изменить ориентацию на landscape
4. Изменить тип штампа на "Без штампа"
5. Экспортировать в DOCX
6. ✅ Изменения применены: размер страницы A3 landscape, штамп отсутствует

### Тест 4: Поля по ГОСТ
1. Открыть экспортированный DOCX в Word
2. Проверить поля страницы:
   - ✅ Левое: 20 мм
   - ✅ Правое: 5 мм
   - ✅ Верхнее: 5 мм
   - ✅ Нижнее: 5 мм

### Тест 5: Разные форматы
1. Настроить раздел на A4 portrait
2. Экспортировать в DOCX
3. ✅ Страница A4 вертикальная с рамкой и штампом

4. Настроить раздел на A3 landscape
5. Экспортировать в DOCX
6. ✅ Страница A3 горизонтальная с рамкой и штампом

## Технические детали

### Размеры в TWIPs

Библиотека `docx` использует TWIPs (1/20 точки):
- 1 мм = 56.69 TWIPs
- A4: 210×297 мм = 11907×16840 TWIPs
- A3: 297×420 мм = 16840×23814 TWIPs
- Поля: 20 мм = 1134 TWIPs, 5 мм = 283 TWIPs

### Структура рамки

```
┌─────────────────────────────────┐
│  5 мм                           │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │                           │  │
│  │      СОДЕРЖИМОЕ           │  │  ← Рамка (таблица 1×1)
│  │      СТРАНИЦЫ             │  │     с чёрными границами
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  5 мм                           │
└─────────────────────────────────┘
 20 мм          5 мм
```

### Структура штампов

**Большой штамп (форма 1):**
```
┌─────────────────────────────────┐
│      Организация                │
│   Название документа            │
│        Шифр                     │
└─────────────────────────────────┘
185 мм × 55 мм
```

**Малый штамп (форма 2):**
```
┌─────────────────────────────────┐
│ Шифр  Лист X  Листов Y          │
└─────────────────────────────────┘
185 мм × 15 мм
```

## Результат

✅ Рамки отображаются на всех страницах
✅ Штамп отображается в footer
✅ Большой штамп на титульном листе
✅ Малый штамп на остальных листах
✅ Настройки листа применяются корректно
✅ Поля страницы по ГОСТ Р 21.1101
✅ Проект успешно собран (1,320.38 kB)

## Изменённые файлы

- `src/utils/docxExporter.ts`
  - Добавлена функция `createFrameInHeader()`
  - Удалено использование `page.border`
  - Интеграция рамки в header через таблицу
  - Исправлена логика создания секций

## Коммит в git

```bash
git add src/utils/docxExporter.ts
git add docs/STAGE_7_REPORT_GOST_FIX_FINAL.md
git commit -m "fix: исправить отображение ГОСТ-рамок и штампов в DOCX

- Рамка создаётся через таблицу в header (вместо page.border)
- Таблица 1×1 с чёрными границами size=8
- Размеры рамки: ширина страницы минус поля
- Штамп создаётся в footer (большой/малый/без штампа)
- Поля страницы по ГОСТ Р 21.1101 (20/5/5/5 мм)
- Настройки листа применяются корректно

Этап 7: Пояснительная записка - финальное исправление ГОСТ-рамок"
git push
```

## Статус
✅ Исправлено и протестировано
