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
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['geology', 'project', 'field', 'lab', 'processing', 'geophysics']));

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
      id: 'report', label: 'ПОЯСНИТЕЛЬНАЯ ЗАПИСКА', icon: '📝', commandId: 'report.open.docx'
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
