import { useState } from 'react';
import { GeoLogData } from '../core/dataStore';
import { CommandRegistry } from '../core/commandRegistry';
import { bus } from '../core/eventBus';

interface Props {
  selectedBoreholeId: string | null;
  onSelect: (id: string | null) => void;
  onContextMenu: (e: React.MouseEvent, items: { label: string; commandId: string }[]) => void;
  width?: number;
}

interface TreeNode {
  id: string;
  label: string;
  count?: number;
  children?: TreeNode[];
  commandId?: string;
  icon?: string;
}

export default function NavigatorTree({ selectedBoreholeId, onSelect, onContextMenu, width = 280 }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['geology', 'project', 'field', 'lab', 'processing', 'geophysics', 'report']));

  const boreholes = GeoLogData.getAll();
  const dicts = GeoLogData.getDicts();

  // Подсчёт проб типа "water"
  const waterSamplesCount = boreholes.reduce((count, bh) => {
    return count + (bh.samples?.filter(s => s.sample_type === 'water').length || 0);
  }, 0);

  const treeData: TreeNode[] = [
    {
      id: 'geology', label: 'ГЕОЛОГИЯ', icon: '🌍', children: [
        { id: 'lab-equip', label: `Лабораторное оборудование (${dicts.equipment.length})`, commandId: 'dicts.equipment', icon: '🔬' },
        { id: 'field-equip', label: `Полевое оборудование (${dicts.field_equipment.length})`, commandId: 'dicts.field_equipment', icon: '⛏️' },
        { id: 'soil-code', label: 'Кодификатор грунтов', commandId: 'dicts.soil_code', icon: '📖' },
        { id: 'rock-catalog', label: `Каталог скальных грунтов (${dicts.rock_catalog.length})`, commandId: 'dicts.rock_catalog', icon: '🪨' },
      ]
    },
    {
      id: 'project', label: '№ геология', icon: '📁', children: [
        { id: 'project-props', label: 'Свойства проекта', commandId: 'project.properties', icon: '⚙️' },
      ]
    },
    {
      id: 'field', label: 'ПОЛЕ', icon: '🏗️', children: [
        { id: 'boreholes', label: `Скважины (${boreholes.length})`, commandId: 'doc.open.boreholes', icon: '🕳️', count: boreholes.length, children: [] },
        { id: 'cpt', label: 'Статическое зондирование', commandId: 'doc.open.cpt', icon: '📊' },
        { id: 'dpt', label: 'Динамическое зондирование', commandId: 'doc.open.dpt', icon: '📊' },
        { id: 'stamp', label: 'Штампы', commandId: 'doc.open.stamp', icon: '📐' },
        { id: 'vane', label: 'Крыльчатка', commandId: 'doc.open.vane', icon: '🌀' },
      ]
    },
    {
      id: 'lab', label: 'ЛАБОРАТОРИЯ', icon: '🧪', children: [
        { id: 'soil-samples', label: 'Пробы грунта', commandId: 'doc.open.soil-samples', icon: '🏔️' },
        { id: 'water-samples', label: `Пробы воды (${waterSamplesCount})`, commandId: 'doc.open.water-samples', icon: '💧' },
      ]
    },
    {
      id: 'processing', label: 'ОБРАБОТКА', icon: '📈', children: [
        { id: 'ige', label: 'ИГЭ', commandId: 'doc.open.ige', icon: '📋' },
        { id: 'aquifers', label: 'Водоносные горизонты', commandId: 'doc.open.aquifers', icon: '💦' },
        { id: 'subsidence', label: 'Тип просадки', commandId: 'doc.open.subsidence', icon: '⚠️' },
        { id: 'pile-bearing', label: 'Несущая способность свай', commandId: 'doc.open.pile', icon: '🏗️' },
      ]
    },
    {
      id: 'geophysics', label: 'ГЕОФИЗИКА', icon: '📡', children: [
        { id: 'vez', label: 'ВЭЗ', icon: '📊' },
        { id: 'bt', label: 'БТ', icon: '📊' },
        { id: 'microseismic', label: 'Микросейсморайонирование', icon: '📊' },
      ]
    },
    {
      id: 'report', label: 'ПОЯСНИТЕЛЬНАЯ ЗАПИСКА', icon: '📝', commandId: 'report.open.docx', children: [
        { id: 'report-1', label: '1. Введение', icon: '📄' },
        { id: 'report-2', label: '2. Изученность инженерно-геологических условий', icon: '📄' },
        { id: 'report-3', label: '3. Физико-географические и техногенные условия', icon: '📄' },
        { id: 'report-4', label: '4. Методики и технология выполнения работ', icon: '📄' },
        { 
          id: 'report-5', label: '5. Геолого-геоморфологическое строение', icon: '📄', children: [
            { id: 'report-5-1', label: '5.1. Стратиграфия', icon: '📄' }
          ]
        },
        { id: 'report-6', label: '6. Гидрогеологические условия', icon: '📄' },
        { id: 'report-7', label: '7. Свойства грунтов', icon: '📄' },
        { id: 'report-8', label: '8. Специфические грунты', icon: '📄' },
        { id: 'report-9', label: '9. Геологические и инженерно-геологические процессы', icon: '📄' },
        { id: 'report-10', label: '10. Инженерно-геологические условия', icon: '📄' },
        { id: 'report-11', label: '11. Геофизические исследования', icon: '📄' },
        { id: 'report-12', label: '12. Уточнение исходной сейсмичности', icon: '📄' },
        { id: 'report-13', label: '13. Прогноз изменения инженерно-геологических условий', icon: '📄' },
        { id: 'report-14', label: '14. Сведения о контроле качества и приемке работ', icon: '📄' },
        { id: 'report-15', label: '15. Заключение', icon: '📄' },
        { id: 'report-16', label: '16. Список использованной литературы', icon: '📄' },
        { id: 'report-app-a', label: 'Приложение А Техническое задание на выполнение инженерных изысканий', icon: '📎' },
        { id: 'report-app-b', label: 'Приложение Б Программа работ на производство инженерно-геологических изысканий', icon: '📎' },
        { id: 'report-app-v', label: 'Приложение В Выписка из реестра членов саморегулируемой организации. Уведомление о включении сведений в Национальный реестр специалистов в области инженерных изысканий и архитектурно-строительного проектирования', icon: '📎' },
        { id: 'report-app-g', label: 'Приложение Г Каталог координат и высот инженерно-геологических выработок и точек геофизического исследования', icon: '📎' },
        { id: 'report-app-d', label: 'Приложение Д Сводная таблица физико-механических свойств грунтов по инженерно-геологическим элементам', icon: '📎' },
        { id: 'report-app-e', label: 'Приложение Е Ведомость результатов лабораторных испытаний агрессивного воздействия грунтов на бетонные и железобетонные конструкции', icon: '📎' },
        { id: 'report-app-zh', label: 'Приложение Ж Результаты лабораторного определения степени засоленности грунтов легкорастворимыми солями', icon: '📎' },
        { id: 'report-app-i', label: 'Приложение И Паспорта компрессионных испытаний талых грунтов', icon: '📎' },
        { id: 'report-app-k', label: 'Приложение К Паспорта компрессионных испытаний мерзлых грунтов', icon: '📎' },
        { id: 'report-app-l', label: 'Приложение Л Ведомость химического анализа подземных вод', icon: '📎' },
        { id: 'report-app-m', label: 'Приложение М Ведомость лабораторного определения коррозионной агрессивности грунта по отношению к углеродистой и низколегированной стали', icon: '📎' },
        { id: 'report-app-n', label: 'Приложение Н Ведомость лабораторного определения относительной деформации пучения грунтов', icon: '📎' },
        { id: 'report-app-p', label: 'Приложение П Трехосное сжатие грунтов', icon: '📎' },
        { id: 'report-app-r', label: 'Приложение Р Определение коэффициента истираемости крупнообломочного грунта', icon: '📎' },
        { id: 'report-app-s', label: 'Приложение С Лабораторное определение касательной силы морозного пучения грунтов', icon: '📎' },
        { id: 'report-app-t', label: 'Приложение Т Трёхосное сжатие глинистых и крупнообломочных грунтов', icon: '📎' },
        { id: 'report-app-u', label: 'Приложение У Оценка прочности и сжимаемости крупнообломочных грунтов с пылеватым и глинистым заполнителем и пылеватых и глинистых грунтов с крупнообломочными включениями по Методике ДальНИИС Госстроя СССР, 1989', icon: '📎' },
        { id: 'report-app-f', label: 'Приложение Ф Результаты рекогносцировочного обследования', icon: '📎' },
        { id: 'report-app-h', label: 'Приложение Х Статическое зондирование грунтов', icon: '📎' },
        { id: 'report-app-ts', label: 'Приложение Ц Динамическое зондирование', icon: '📎' },
        { id: 'report-app-sh', label: 'Приложение Ш Штамповые испытания грунтов', icon: '📎' },
        { id: 'report-app-sch', label: 'Приложение Щ Крыльчатка', icon: '📎' },
        { id: 'report-app-e2', label: 'Приложение Э Ведомость коррозийной агрессивности грунта по отношению к стали на основе данных удельного электрического сопротивления', icon: '📎' },
        { id: 'report-app-yu', label: 'Приложение Ю Ведомость определения наличия блуждающих токов (ГОСТ 9.602-2016)', icon: '📎' },
        { id: 'report-app-ya', label: 'Приложение Я Акт сдачи-приёмки полевых работ по инженерно-геологическим изысканиям и инженерно-геофизическим исследованиям', icon: '📎' },
        { id: 'report-changes', label: 'ТАБЛИЦА РЕГИСТРАЦИИ ИЗМЕНЕНИЙ', icon: '📋' },
      ]
    },
  ];

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.commandId) {
      CommandRegistry.execute(node.commandId);
    }
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = (node.children && node.children.length > 0) || node.id === 'boreholes';
    const isExpanded = expanded.has(node.id);
    const isSelected = node.id === selectedBoreholeId;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-1 px-1 cursor-pointer hover:bg-[#e8e8ff] ${isSelected ? 'bg-[#c8c8ff]' : ''}`}
          style={{ paddingLeft: `${level * 18 + 6}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(node.id);
              // Also execute command if exists (for boreholes node)
              if (node.commandId && node.id === 'boreholes') {
                handleNodeClick(node);
              }
              // Open report window when clicking on report section
              if (node.id === 'report') {
                bus.emit('ui:report-open');
              }
            } else {
              handleNodeClick(node);
            }
          }}
          onDoubleClick={() => {
            if (node.commandId) {
              handleNodeClick(node);
            }
          }}
          onContextMenu={(e) => {
            const items = [];
            if (node.commandId) items.push({ label: 'Открыть', commandId: node.commandId });
            if (node.id === 'boreholes') {
              items.push({ label: 'Создать скважину', commandId: 'bore.create' });
              items.push({ label: 'Удалить', commandId: 'bore.delete' });
            }
            if (items.length > 0) onContextMenu(e, items);
          }}
        >
          {hasChildren && (
            <span className="w-4 text-center text-xs">{isExpanded ? '▼' : '▶'}</span>
          )}
          {!hasChildren && <span className="w-4" />}
          <span className="mr-1.5">{node.icon || '📄'}</span>
          <span className="text-sm truncate">{node.label}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.id === 'boreholes' ? (
              // Render borehole entries
              boreholes.map((bh) => (
                <div
                  key={bh.id}
                  className={`flex items-center py-1 px-1 cursor-pointer hover:bg-[#e8e8ff] ${selectedBoreholeId === bh.id ? 'bg-[#c8c8ff]' : ''}`}
                  style={{ paddingLeft: `${(level + 1) * 18 + 6}px` }}
                  onClick={() => onSelect(bh.id)}
                  onContextMenu={(e) => {
                    onSelect(bh.id);
                    onContextMenu(e, [
                      { label: 'Изменить', commandId: 'bore.edit' },
                      { label: 'Удалить', commandId: 'bore.delete' },
                      { label: 'Найти на чертеже', commandId: 'bore.find' },
                    ]);
                  }}
                >
                  <span className="w-4" />
                  <span className="mr-1.5">🕳️</span>
                  <span className="text-sm">{bh.number}</span>
                </div>
              ))
            ) : (
              node.children!.map((child) => renderNode(child, level + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: `${width}px`, minWidth: '180px' }} className="bg-white border-r border-[#c0c0c0] flex flex-col overflow-hidden flex-shrink-0">
      <div className="bg-[#e8e8e8] border-b border-[#c0c0c0] px-3 py-1.5 text-sm font-bold">
        Навигатор
      </div>
      <div className="flex-1 overflow-y-auto">
        {treeData.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
