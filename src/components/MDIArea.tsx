import { useState, useCallback } from 'react';
import { Borehole, GeoLogData } from '../core/dataStore';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useColumnResize, ColumnResizer } from './ResizableTable';
import AllSamplesTable from './AllSamplesTable';
import IgeStatistics from './IgeStatistics';
import ThermoTable from './ThermoTable';

interface Props {
  openDocs: { id: string; title: string; dirty: boolean }[];
  activeDocId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onReorder: (newDocs: { id: string; title: string; dirty: boolean }[]) => void;
  boreholes: Borehole[];
  selectedBoreholeId: string | null;
  onSelectBorehole: (id: string) => void;
  selectedSampleId?: string | null;
  onSelectSample?: (id: string | null) => void;
  onCreateBorehole?: () => void;
  onDeleteBorehole?: () => void;
  onLoadFromCatalog?: () => void;
}

// GAP-поля (не в схеме v1.3) — используются для определения полей, которые появятся в v1.4
const _GAP_FIELDS = ['side_id', 'rig_id', 'method_id', 'diameter_id', 'casing_diameter_id', 'executor'];
void _GAP_FIELDS;

const columns = [
  { key: 'number', label: 'Номер', gap: false },
  { key: 'depth_m', label: 'Глубина', gap: false },
  { key: 'elev_m', label: 'Отметка', gap: false },
  { key: 'x', label: 'X', gap: false },
  { key: 'y', label: 'Y', gap: false },
  { key: 'wgs84_lon', label: 'WGS84 Долгота', gap: false },
  { key: 'wgs84_lat', label: 'WGS84 Широта', gap: false },
  { key: 'side_id', label: 'Сторонность', gap: true },
  { key: 'rig_id', label: 'Буровая установка', gap: true },
  { key: 'method_id', label: 'Способ проходки', gap: true },
  { key: 'diameter_id', label: 'Диаметр', gap: true },
  { key: 'casing_depth_m', label: 'Глубина обсадки', gap: false },
  { key: 'casing_diameter_id', label: 'Диаметр обсадки', gap: true },
  { key: 'reaming_m', label: 'Разбуривание', gap: false },
  { key: 'gso_m', label: 'ГСО', gap: false },
  { key: 'gsp_m', label: 'ГСП', gap: false },
  { key: 'mmg_m', label: 'ММГ', gap: false },
  { key: 'user', label: 'Исполнитель', gap: false },
];

function formatValue(key: string, value: any): string {
  if (value === null || value === undefined) return '';
  if (['depth_m', 'elev_m', 'x', 'y', 'wgs84_lon', 'wgs84_lat', 'casing_depth_m', 'reaming_m', 'gso_m', 'gsp_m', 'mmg_m'].includes(key)) {
    return typeof value === 'number' ? value.toFixed(2) : String(value);
  }
  if (key === 'date') {
    return String(value); // Already in DD.MM.YYYY format
  }
  if (key === 'user') {
    return String(value || '—');
  }
  
  // Преобразование ID справочников в названия
  const dicts = GeoLogData.getDicts();
  if (key === 'side_id') {
    const item = dicts.sides.find(s => s.id === value);
    return item ? item.name : String(value);
  }
  if (key === 'rig_id') {
    const item = dicts.rigs.find(r => r.id === value);
    return item ? item.name : String(value);
  }
  if (key === 'method_id') {
    const item = dicts.methods.find(m => m.id === value);
    return item ? item.name : String(value);
  }
  if (key === 'diameter_id' || key === 'casing_diameter_id') {
    const item = dicts.diameters.find(d => d.id === value);
    return item ? item.name : String(value);
  }
  
  return String(value);
}

// Sortable tab component
function SortableTab({ doc, isActive, onActivate, onClose }: {
  doc: { id: string; title: string; dirty: boolean };
  isActive: boolean;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center px-4 border-r border-[#c0c0c0] text-sm select-none ${
        isActive ? 'bg-white font-semibold' : 'bg-[#e8e8e8] hover:bg-[#f0f0ff]'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onClick={() => onActivate(doc.id)}
    >
      {/* Drag handle area */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mr-1.5 text-[#999] hover:text-[#555]"
        title="Перетащить вкладку"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </span>
      <span className="cursor-pointer">{doc.title}{doc.dirty ? ' *' : ''}</span>
      <button
        className="ml-2 w-5 h-5 flex items-center justify-center hover:bg-[#ff6666] hover:text-white rounded text-xs"
        onClick={(e) => { e.stopPropagation(); onClose(doc.id); }}
      >
        ×
      </button>
    </div>
  );
}

export default function MDIArea({ openDocs, activeDocId, onActivate, onClose, onReorder, boreholes, selectedBoreholeId, onSelectBorehole, selectedSampleId, onSelectSample, onCreateBorehole, onDeleteBorehole, onLoadFromCatalog }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Минимальное расстояние для начала перетаскивания
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = openDocs.findIndex((d) => d.id === active.id);
      const newIndex = openDocs.findIndex((d) => d.id === over.id);
      const newDocs = arrayMove(openDocs, oldIndex, newIndex);
      onReorder(newDocs);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#e0e0e0]">
      {/* Document Tabs */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={openDocs.map((d) => d.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex bg-[#f0f0f0] border-b border-[#c0c0c0] overflow-x-auto" style={{ height: '30px' }}>
            {openDocs.map((doc) => (
              <SortableTab
                key={doc.id}
                doc={doc}
                isActive={activeDocId === doc.id}
                onActivate={onActivate}
                onClose={onClose}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-white">
        {openDocs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#808080] text-sm">
            Нет открытых документов
          </div>
        ) : (
          <DocContent
            docId={activeDocId}
            boreholes={boreholes}
            selectedId={selectedBoreholeId}
            onSelect={onSelectBorehole}
            selectedSampleId={selectedSampleId}
            onSelectSample={onSelectSample}
            onCreateBorehole={onCreateBorehole}
            onDeleteBorehole={onDeleteBorehole}
            onLoadFromCatalog={onLoadFromCatalog}
          />
        )}
      </div>
    </div>
  );
}

function DocContent({ docId, boreholes, selectedId, onSelect, selectedSampleId, onSelectSample, onCreateBorehole, onDeleteBorehole, onLoadFromCatalog }: { 
  docId: string; 
  boreholes: Borehole[]; 
  selectedId: string | null; 
  onSelect: (id: string) => void;
  selectedSampleId?: string | null;
  onSelectSample?: (id: string | null) => void;
  onCreateBorehole?: () => void;
  onDeleteBorehole?: () => void;
  onLoadFromCatalog?: () => void;
}) {
  const docConfigs: Record<string, { title: string; icon: string; description: string; columns?: string[] }> = {
    'doc-boreholes': { title: 'Скважины', icon: '🕳️', description: 'Таблица скважин проекта' },
    'doc-cpt': { title: 'Статическое зондирование', icon: '📊', description: 'Данные статического зондирования (CPT)', columns: ['Номер', 'Глубина, м', 'Сопротивление, МПа', 'Дата'] },
    'doc-dpt': { title: 'Динамическое зондирование', icon: '📊', description: 'Данные динамического зондирования (DPT)', columns: ['Номер', 'Глубина, м', 'Отказ, см', 'Дата'] },
    'doc-stamp': { title: 'Штампы', icon: '📐', description: 'Результаты испытаний штампами', columns: ['Номер', 'Площадь, см²', 'Давление, МПа', 'Осадка, мм'] },
    'doc-vane': { title: 'Крыльчатка', icon: '🌀', description: 'Испытания крыльчаткой', columns: ['Номер', 'Глубина, м', 'Прочность, кПа', 'Дата'] },
    'doc-soil-samples': { title: 'Пробы грунта', icon: '🏔️', description: 'Лабораторные пробы грунта', columns: ['Номер пробы', 'Скважина', 'Глубина, м', 'Тип', 'Лаб. номер'] },
    'doc-water-samples': { title: 'Пробы воды', icon: '💧', description: 'Лабораторные пробы воды', columns: ['Номер пробы', 'Скважина', 'Глубина, м', 'Тип воды', 'Лаб. номер'] },
    'doc-ige': { title: 'ИГЭ', icon: '📋', description: 'Инженерно-геологические элементы', columns: ['Номер ИГЭ', 'Тип грунта', 'Кол-во определений', 'Среднее значение'] },
    'doc-aquifers': { title: 'Водоносные горизонты', icon: '💦', description: 'Характеристики водоносных горизонтов', columns: ['Номер', 'Тип', 'Глубина залегания, м', 'Мощность, м'] },
    'doc-subsidence': { title: 'Тип просадки', icon: '⚠️', description: 'Оценка просадочности грунтов', columns: ['Номер', 'Скважина', 'Тип просадки', 'Коэффициент'] },
    'doc-pile': { title: 'Несущая способность свай', icon: '🏗️', description: 'Расчёт несущей способности свай', columns: ['Номер', 'Тип сваи', 'Длина, м', 'Несущая способность, кН'] },
  };

  if (docId === 'doc-boreholes') {
    return <BoreholeTable 
      boreholes={boreholes} 
      selectedId={selectedId} 
      onSelect={onSelect}
      onCreateBorehole={onCreateBorehole}
      onDeleteBorehole={onDeleteBorehole}
      onLoadFromCatalog={onLoadFromCatalog}
    />;
  }

  if (docId === 'doc-soil-samples') {
    const selectedBorehole = selectedId ? boreholes.find(b => b.id === selectedId) : null;
    if (!selectedBorehole) {
      return (
        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl">🏔️</span>
            <div>
              <h2 className="text-base font-bold">Пробы грунта</h2>
              <p className="text-sm text-[#808080]">Лабораторные пробы грунта</p>
            </div>
          </div>
          <div className="text-sm text-[#808080]">Выберите скважину в таблице для просмотра проб</div>
        </div>
      );
    }
    return (
      <AllSamplesTable 
        boreholes={boreholes}
        selectedSampleId={selectedSampleId}
        onSelectSample={onSelectSample}
        onSelectBorehole={onSelect}
      />
    );
  }

  if (docId === 'doc-ige') {
    return (
      <IgeStatistics boreholes={boreholes} />
    );
  }

  if (docId === 'doc-thermometry') {
    const selectedBorehole = selectedId ? boreholes.find(b => b.id === selectedId) || null : null;
    return (
      <ThermoTable 
        borehole={selectedBorehole}
        boreholes={boreholes}
        boreholeId={selectedId}
        selectedBoreholeId={selectedId}
        onSelectBorehole={onSelect}
      />
    );
  }

  const config = docConfigs[docId];
  if (!config) {
    return <div className="p-4 text-sm text-[#808080]">Документ не найден</div>;
  }

  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl">{config.icon}</span>
        <div>
          <h2 className="text-base font-bold">{config.title}</h2>
          <p className="text-sm text-[#808080]">{config.description}</p>
        </div>
      </div>
      {config.columns && (
        <ResizableDocTable columns={config.columns} />
      )}
    </div>
  );
}

function BoreholeTable({ boreholes, selectedId, onSelect, onCreateBorehole, onDeleteBorehole, onLoadFromCatalog }: { 
  boreholes: Borehole[]; 
  selectedId: string | null; 
  onSelect: (id: string) => void;
  onCreateBorehole?: () => void;
  onDeleteBorehole?: () => void;
  onLoadFromCatalog?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрация скважин по номеру
  const filteredBoreholes = boreholes.filter(bh => 
    !searchQuery || bh.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ширина столбцов по умолчанию
  const defaultColumnWidths: Record<string, number> = {
    number: 80,
    depth_m: 70,
    elev_m: 70,
    x: 90,
    y: 90,
    wgs84_lon: 85,
    wgs84_lat: 85,
    side_id: 75,
    rig_id: 95,
    method_id: 100,
    diameter_id: 70,
    casing_depth_m: 90,
    casing_diameter_id: 95,
    reaming_m: 80,
    gso_m: 60,
    gsp_m: 60,
    mmg_m: 60,
    user: 85,
  };

  const columnKeys = columns.map((c) => c.key);
  const { widths, handleMouseDown } = useColumnResize(columnKeys, defaultColumnWidths);

  return (
    <div className="flex flex-col h-full">
      {/* Панель инструментов */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f5f5f5] border-b border-[#c0c0c0]">
        <button
          onClick={onCreateBorehole}
          className="px-3 py-1 text-sm bg-[#4472c4] text-white rounded hover:bg-[#3060b0] border border-[#2a5090]"
          title="Создать новую скважину"
        >
          + Создать
        </button>
        <button
          onClick={onDeleteBorehole}
          disabled={!selectedId}
          className="px-3 py-1 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#ffe8e8] disabled:opacity-50 disabled:cursor-not-allowed"
          title="Удалить выбранную скважину"
        >
          🗑️ Удалить
        </button>
        <button
          onClick={onLoadFromCatalog}
          className="px-3 py-1 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
          title="Загрузить скважины из каталога"
        >
          📂 Из каталога
        </button>
        
        <select
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="px-2 py-1 text-sm border border-[#c0c0c0] rounded bg-white"
          title="Выбрать скважину из списка"
        >
          <option value="">-- Выберите скважину --</option>
          {boreholes.map((bh) => (
            <option key={bh.id} value={bh.id}>
              {bh.number}
            </option>
          ))}
        </select>
        
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-[#555]">Поиск:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Номер скважины..."
            className="px-2 py-1 text-sm border border-[#c0c0c0] rounded w-48"
          />
        </div>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#e8e8e8] border-b border-[#c0c0c0]">
              <th className="px-3 py-1.5 text-center border-r border-[#c0c0c0] font-semibold relative" style={{ width: '40px' }}>#</th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-2 py-1.5 text-center border-r border-[#c0c0c0] font-semibold relative leading-tight"
                style={{ width: `${widths[col.key] || 100}px` }}
                title={col.label}
              >
                {col.label}
                <ColumnResizer onMouseDown={(e) => handleMouseDown(e, col.key)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredBoreholes.map((bh, idx) => (
            <tr
              key={bh.id}
              className={`cursor-pointer border-b border-[#e8e8e8] ${selectedId === bh.id ? 'bg-[#c8d8ff]' : idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'} hover:bg-[#e0e8ff]`}
              onClick={() => onSelect(bh.id)}
            >
              <td className="px-3 py-1 border-r border-[#e8e8e8] text-center text-[#808080]">{idx + 1}</td>
              {columns.map((col) => {
                const value = (bh as any)[col.key];
                const formatted = formatValue(col.key, value);
                return (
                  <td
                    key={col.key}
                    className="px-2 py-1 border-r border-[#e8e8e8] text-center"
                  >
                    {formatted}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

// Компонент таблицы с ресайзом для остальных документов
function ResizableDocTable({ columns: cols }: { columns: string[] }) {
  const defaultWidths: Record<string, number> = {};
  cols.forEach((col) => {
    defaultWidths[col] = 150;
  });

  const { widths, handleMouseDown } = useColumnResize(cols, defaultWidths);

  return (
    <div className="border border-[#c0c0c0] rounded overflow-auto">
      <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="bg-[#e8e8e8] border-b border-[#c0c0c0]">
            {cols.map((col, idx) => (
              <th
                key={idx}
                className="px-2 py-1.5 text-center border-r border-[#c0c0c0] font-semibold relative last:border-r-0 leading-tight"
                style={{ width: `${widths[col] || 150}px` }}
              >
                {col}
                <ColumnResizer onMouseDown={(e) => handleMouseDown(e, col)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={cols.length} className="px-3 py-5 text-center text-[#808080] italic">
              Нет данных
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
