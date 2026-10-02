import { useState, useEffect } from 'react';
import { Borehole, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import { useColumnResize, ColumnResizer } from './ResizableTable';
import SoilLayersTable from './SoilLayersTable';
import WaterLayersTable from './WaterLayersTable';
import SoilSamplesTable from './SoilSamplesTable';

interface Props {
  borehole: Borehole | null;
  onUpdate: (data: Partial<Borehole>) => void;
  height?: number;
  boreholeId?: string | null;
  onSelectBorehole?: (id: string) => void;
}

type TabId = 'general' | 'soil' | 'water' | 'samples' | 'thermometry' | 'additional';

export default function BottomPanel({ borehole, boreholeId, onUpdate, height = 260, onSelectBorehole }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: 'Общие' },
    { id: 'soil', label: 'Слои грунта' },
    { id: 'water', label: 'Слои воды' },
    { id: 'samples', label: 'Пробы грунта' },
    { id: 'thermometry', label: 'Термометрия' },
    { id: 'additional', label: 'Дополнительно' },
  ];

  if (!borehole) {
    return (
      <div style={{ height: `${height}px`, minHeight: '150px' }} className="border-t border-[#c0c0c0] bg-[#f5f5f5] flex flex-col flex-shrink-0">
        <div className="flex bg-[#e8e8e8] border-b border-[#c0c0c0]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-1.5 text-sm border-r border-[#c0c0c0] ${activeTab === tab.id ? 'bg-white font-semibold' : 'hover:bg-[#f0f0ff]'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center text-[#808080] text-sm">
          Выберите скважину для редактирования
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px`, minHeight: '150px' }} className="border-t border-[#c0c0c0] bg-[#f5f5f5] flex flex-col flex-shrink-0">
      {/* Tabs */}
      <div className="flex bg-[#e8e8e8] border-b border-[#c0c0c0]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-1.5 text-sm border-r border-[#c0c0c0] ${activeTab === tab.id ? 'bg-white font-semibold' : 'hover:bg-[#f0f0ff]'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeTab === 'general' && <GeneralForm borehole={borehole} onUpdate={onUpdate} />}
        {activeTab === 'soil' && borehole && boreholeId && <SoilLayersTable borehole={borehole} boreholeId={boreholeId} onUpdate={onUpdate} onSelectBorehole={onSelectBorehole} />}
        {activeTab === 'water' && borehole && boreholeId && <WaterLayersTable borehole={borehole} boreholeId={boreholeId} onUpdate={onUpdate} onSelectBorehole={onSelectBorehole} />}
        {activeTab === 'samples' && borehole && boreholeId && <SoilSamplesTable borehole={borehole} boreholeId={boreholeId} onUpdate={onUpdate} onSelectBorehole={onSelectBorehole} />}
        {activeTab === 'thermometry' && <ThermometryTab borehole={borehole} boreholeId={boreholeId} onUpdate={onUpdate} />}
        {activeTab === 'additional' && <AdditionalTab borehole={borehole} />}
      </div>
    </div>
  );
}

function GeneralForm({ borehole, onUpdate }: { borehole: Borehole; onUpdate: (data: Partial<Borehole>) => void }) {
  const dicts = GeoLogData.getDicts();
  
  // Форматирование значения с двумя знаками после запятой
  const formatWithTwoDecimals = (value: string | number | undefined): string => {
    if (value === undefined || value === null || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '';
    return num.toFixed(2);
  };
  
  const [form, setForm] = useState({
    number: borehole.number || '',
    depth_m: formatWithTwoDecimals(borehole.depth_m),
    elev_m: formatWithTwoDecimals(borehole.elev_m),
    x: formatWithTwoDecimals(borehole.x),
    y: formatWithTwoDecimals(borehole.y),
    date: borehole.date || '',
    end_date: borehole.end_date || '',
    wgs84_lon: borehole.wgs84_lon?.toString() || '',
    wgs84_lat: borehole.wgs84_lat?.toString() || '',
    side_id: (borehole as any).side_id || '',
    rig_id: (borehole as any).rig_id || '',
    method_id: (borehole as any).method_id || '',
    diameter_id: (borehole as any).diameter_id || '',
    casing_depth_m: formatWithTwoDecimals(borehole.casing_depth_m),
    casing_diameter_id: (borehole as any).casing_diameter_id || '',
    reaming_m: formatWithTwoDecimals(borehole.reaming_m),
    gso_m: formatWithTwoDecimals(borehole.gso_m),
    gsp_m: formatWithTwoDecimals(borehole.gsp_m),
    mmg_m: formatWithTwoDecimals(borehole.mmg_m),
    gso_manual: borehole.gso_manual || false,
    gsp_manual: borehole.gsp_manual || false,
    mmg_manual: borehole.mmg_manual || false,
    user: borehole.user || '',
  });
  
  // Флаг для отслеживания ручного изменения даты окончания
  const [endDateManual, setEndDateManual] = useState(false);

  useEffect(() => {
    setForm({
      number: borehole.number || '',
      depth_m: formatWithTwoDecimals(borehole.depth_m),
      elev_m: formatWithTwoDecimals(borehole.elev_m),
      x: formatWithTwoDecimals(borehole.x),
      y: formatWithTwoDecimals(borehole.y),
      date: borehole.date || '',
      end_date: borehole.end_date || '',
      wgs84_lon: borehole.wgs84_lon?.toString() || '',
      wgs84_lat: borehole.wgs84_lat?.toString() || '',
      side_id: (borehole as any).side_id || '',
      rig_id: (borehole as any).rig_id || '',
      method_id: (borehole as any).method_id || '',
      diameter_id: (borehole as any).diameter_id || '',
      casing_depth_m: formatWithTwoDecimals(borehole.casing_depth_m),
      casing_diameter_id: (borehole as any).casing_diameter_id || '',
      reaming_m: formatWithTwoDecimals(borehole.reaming_m),
      gso_m: formatWithTwoDecimals(borehole.gso_m),
      gsp_m: formatWithTwoDecimals(borehole.gsp_m),
      mmg_m: formatWithTwoDecimals(borehole.mmg_m),
      gso_manual: borehole.gso_manual || false,
      gsp_manual: borehole.gsp_manual || false,
      mmg_manual: borehole.mmg_manual || false,
      user: borehole.user || '',
    });
    // Сбрасываем флаг ручного изменения при смене скважины
    setEndDateManual(false);
  }, [borehole.id]);

  const handleChange = (field: string, value: string | boolean) => {
    const newForm = { ...form, [field]: value };
    
    // Если изменяется поле "Начата" и дата окончания не была изменена вручную,
    // автоматически подставляем дату в "Окончена"
    if (field === 'date' && !endDateManual && typeof value === 'string' && value) {
      newForm.end_date = value;
    }
    
    // Если пользователь вручную изменяет поле "Окончена", устанавливаем флаг
    if (field === 'end_date') {
      setEndDateManual(true);
    }
    
    setForm(newForm);
    
    // Числовые поля сохраняются только при потере фокуса (onBlur)
    // Текстовые поля и селекты сохраняются сразу
    const numericFields = ['depth_m', 'elev_m', 'x', 'y', 'wgs84_lon', 'wgs84_lat', 'casing_depth_m', 'reaming_m', 'gso_m', 'gsp_m', 'mmg_m'];
    
    if (numericFields.includes(field)) {
      // Для числовых полей не сохраняем сразу, ждём onBlur
      return;
    }
    
    // Автоматическое сохранение для текстовых полей и селектов
    const data: Partial<Borehole> = {
      number: newForm.number,
      depth_m: truncateToTwoDecimals(newForm.depth_m),
      elev_m: truncateToTwoDecimals(newForm.elev_m),
      x: truncateToTwoDecimals(newForm.x),
      y: truncateToTwoDecimals(newForm.y),
      date: newForm.date,
      wgs84_lon: truncateToTwoDecimals(newForm.wgs84_lon) || undefined,
      wgs84_lat: truncateToTwoDecimals(newForm.wgs84_lat) || undefined,
      casing_depth_m: truncateToTwoDecimals(newForm.casing_depth_m) || undefined,
      reaming_m: truncateToTwoDecimals(newForm.reaming_m) || undefined,
      gso_m: truncateToTwoDecimals(newForm.gso_m) || undefined,
      gsp_m: truncateToTwoDecimals(newForm.gsp_m) || undefined,
      mmg_m: truncateToTwoDecimals(newForm.mmg_m) || undefined,
      gso_manual: newForm.gso_manual,
      gsp_manual: newForm.gsp_manual,
      mmg_manual: newForm.mmg_manual,
      user: newForm.user,
    };
    (data as any).end_date = newForm.end_date;
    (data as any).side_id = newForm.side_id;
    (data as any).rig_id = newForm.rig_id;
    (data as any).method_id = newForm.method_id;
    (data as any).diameter_id = newForm.diameter_id;
    (data as any).casing_diameter_id = newForm.casing_diameter_id;
    onUpdate(data);
  };

  const handleSave = () => {
    const data: Partial<Borehole> = {
      number: form.number,
      depth_m: roundToStep(form.depth_m),
      elev_m: truncateToTwoDecimals(form.elev_m),
      x: truncateToTwoDecimals(form.x),
      y: truncateToTwoDecimals(form.y),
      date: form.date,
      wgs84_lon: truncateToTwoDecimals(form.wgs84_lon) || undefined,
      wgs84_lat: truncateToTwoDecimals(form.wgs84_lat) || undefined,
      casing_depth_m: roundToStep(form.casing_depth_m) || undefined,
      reaming_m: roundToStep(form.reaming_m) || undefined,
      gso_m: roundToStep(form.gso_m) || undefined,
      gsp_m: roundToStep(form.gsp_m) || undefined,
      mmg_m: roundToStep(form.mmg_m) || undefined,
      gso_manual: form.gso_manual,
      gsp_manual: form.gsp_manual,
      mmg_manual: form.mmg_manual,
      user: form.user,
    };
    (data as any).end_date = form.end_date;
    (data as any).side_id = form.side_id;
    (data as any).rig_id = form.rig_id;
    (data as any).method_id = form.method_id;
    (data as any).diameter_id = form.diameter_id;
    (data as any).casing_diameter_id = form.casing_diameter_id;
    onUpdate(data);
    Journal.logEvent('command', `Форма скважины ${borehole.number} сохранена`, 'bore.edit');
  };

  const inputClass = "w-full px-2 py-1 text-sm border border-[#c0c0c0] bg-white rounded focus:border-blue-400 focus:outline-none";
  const labelClass = "text-sm text-[#555] text-right whitespace-nowrap min-w-[140px]";
  const fieldRowClass = "grid grid-cols-[auto_1fr] gap-2 items-center";

  // Конвертация даты из формата YYYY-MM-DD в ДД.ММ.ГГГГ
  const formatDateToDisplay = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 10) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  // Конвертация даты из формата ДД.ММ.ГГГГ в YYYY-MM-DD
  const formatDateToStorage = (dateStr: string): string => {
    if (!dateStr) return '';
    // Если уже в формате YYYY-MM-DD
    if (dateStr.length === 10 && dateStr.includes('-')) return dateStr;
    // Если в формате ДД.ММ.ГГГГ
    if (dateStr.includes('.')) {
      const [day, month, year] = dateStr.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  // Вспомогательная функция для обрезания числа до двух знаков после запятой без округления
  const truncateToTwoDecimals = (value: string): number => {
    const normalized = value.replace(',', '.');
    const parts = normalized.split('.');
    let truncatedValue = normalized;
    if (parts.length === 2 && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      truncatedValue = parts.join('.');
    }
    return parseFloat(truncatedValue) || 0;
  };

  // Округление до ближайшего кратного 0.10 метра
  const roundToStep = (value: string): number => {
    const normalized = value.replace(',', '.');
    const num = parseFloat(normalized);
    if (isNaN(num)) return 0;
    return Math.round(num * 10) / 10;
  };

  // Форматирование числовых значений с двумя знаками после запятой при потере фокуса (обрезание без округления)
  const handleBlurFormat = (field: string, value: string) => {
    if (!value || value === '') return;
    
    const num = truncateToTwoDecimals(value);
    if (!isNaN(num)) {
      const formattedValue = num.toFixed(2);
      setForm(prev => ({ ...prev, [field]: formattedValue }));
      
      // Сохраняем данные при потере фокуса
      const data: Partial<Borehole> = {
        number: form.number,
        depth_m: truncateToTwoDecimals(form.depth_m),
        elev_m: truncateToTwoDecimals(form.elev_m),
        x: truncateToTwoDecimals(form.x),
        y: truncateToTwoDecimals(form.y),
        date: form.date,
        wgs84_lon: truncateToTwoDecimals(form.wgs84_lon) || undefined,
        wgs84_lat: truncateToTwoDecimals(form.wgs84_lat) || undefined,
        casing_depth_m: truncateToTwoDecimals(form.casing_depth_m) || undefined,
        reaming_m: truncateToTwoDecimals(form.reaming_m) || undefined,
        gso_m: truncateToTwoDecimals(form.gso_m) || undefined,
        gsp_m: truncateToTwoDecimals(form.gsp_m) || undefined,
        mmg_m: truncateToTwoDecimals(form.mmg_m) || undefined,
        gso_manual: form.gso_manual,
        gsp_manual: form.gsp_manual,
        mmg_manual: form.mmg_manual,
        user: form.user,
      };
      (data as any)[field] = num;
      (data as any).end_date = form.end_date;
      (data as any).side_id = form.side_id;
      (data as any).rig_id = form.rig_id;
      (data as any).method_id = form.method_id;
      (data as any).diameter_id = form.diameter_id;
      (data as any).casing_diameter_id = form.casing_diameter_id;
      onUpdate(data);
    }
  };

  // Форматирование числовых значений с округлением до шага 0.10 при потере фокуса
  const handleBlurFormatStep = (field: string, value: string) => {
    if (!value || value === '') return;
    
    const num = roundToStep(value);
    if (!isNaN(num)) {
      const formattedValue = num.toFixed(2);
      setForm(prev => ({ ...prev, [field]: formattedValue }));
      
      // Сохраняем данные при потере фокуса
      const data: Partial<Borehole> = {
        number: form.number,
        depth_m: roundToStep(form.depth_m),
        elev_m: truncateToTwoDecimals(form.elev_m),
        x: truncateToTwoDecimals(form.x),
        y: truncateToTwoDecimals(form.y),
        date: form.date,
        wgs84_lon: truncateToTwoDecimals(form.wgs84_lon) || undefined,
        wgs84_lat: truncateToTwoDecimals(form.wgs84_lat) || undefined,
        casing_depth_m: roundToStep(form.casing_depth_m) || undefined,
        reaming_m: roundToStep(form.reaming_m) || undefined,
        gso_m: roundToStep(form.gso_m) || undefined,
        gsp_m: roundToStep(form.gsp_m) || undefined,
        mmg_m: roundToStep(form.mmg_m) || undefined,
        gso_manual: form.gso_manual,
        gsp_manual: form.gsp_manual,
        mmg_manual: form.mmg_manual,
        user: form.user,
      };
      (data as any)[field] = num;
      (data as any).end_date = form.end_date;
      (data as any).side_id = form.side_id;
      (data as any).rig_id = form.rig_id;
      (data as any).method_id = form.method_id;
      (data as any).diameter_id = form.diameter_id;
      (data as any).casing_diameter_id = form.casing_diameter_id;
      onUpdate(data);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Column 1 */}
      <div className="space-y-2">
        <div className={fieldRowClass}>
          <label className={labelClass}>Номер:</label>
          <input className={inputClass} value={form.number} onChange={(e) => handleChange('number', e.target.value)} />
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Глубина, м:</label>
          <input className={inputClass} type="text" step="0.10" value={form.depth_m} onChange={(e) => handleChange('depth_m', e.target.value)} onBlur={(e) => handleBlurFormatStep('depth_m', e.target.value)} />
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Отметка, м:</label>
          <input className={inputClass} type="text" value={form.elev_m} onChange={(e) => handleChange('elev_m', e.target.value)} onBlur={(e) => handleBlurFormat('elev_m', e.target.value)} />
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Координата X:</label>
          <input className={inputClass} type="text" value={form.x} onChange={(e) => handleChange('x', e.target.value)} onBlur={(e) => handleBlurFormat('x', e.target.value)} />
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Координата Y:</label>
          <input className={inputClass} type="text" value={form.y} onChange={(e) => handleChange('y', e.target.value)} onBlur={(e) => handleBlurFormat('y', e.target.value)} />
        </div>
      </div>

      {/* Column 2 */}
      <div className="space-y-2">
        <div className={fieldRowClass}>
          <label className={labelClass}>Начата:</label>
          <input 
            className={inputClass} 
            type="date" 
            value={formatDateToStorage(form.date)} 
            onChange={(e) => handleChange('date', formatDateToDisplay(e.target.value))} 
          />
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Окончена:</label>
          <input 
            className={inputClass} 
            type="date" 
            value={formatDateToStorage(form.end_date)} 
            onChange={(e) => handleChange('end_date', formatDateToDisplay(e.target.value))} 
          />
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Сторонность:</label>
          <select className={inputClass} value={form.side_id} onChange={(e) => handleChange('side_id', e.target.value)}>
            <option value="">—</option>
            {dicts.sides.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>WGS84 долгота:</label>
          <input className={inputClass} type="number" step="0.0001" value={form.wgs84_lon} onChange={(e) => handleChange('wgs84_lon', e.target.value)} />
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>WGS84 широта:</label>
          <input className={inputClass} type="number" step="0.0001" value={form.wgs84_lat} onChange={(e) => handleChange('wgs84_lat', e.target.value)} />
        </div>
        <button className="text-[10px] text-blue-600 hover:underline" onClick={() => Journal.logEvent('command', 'Пересчёт WGS84')}>
          🔄 Пересчёт координат
        </button>
      </div>

      {/* Column 3 */}
      <div className="space-y-2">
        <div className={fieldRowClass}>
          <label className={labelClass}>Буровая установка:</label>
          <select className={inputClass} value={form.rig_id} onChange={(e) => handleChange('rig_id', e.target.value)}>
            <option value="">—</option>
            {dicts.rigs.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Способ проходки:</label>
          <select className={inputClass} value={form.method_id} onChange={(e) => handleChange('method_id', e.target.value)}>
            <option value="">—</option>
            {dicts.methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Диаметр, мм:</label>
          <select className={inputClass} value={form.diameter_id} onChange={(e) => handleChange('diameter_id', e.target.value)}>
            <option value="">—</option>
            {dicts.diameters.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Глубина обсадки, м:</label>
          <input className={inputClass} type="text" step="0.10" value={form.casing_depth_m} onChange={(e) => handleChange('casing_depth_m', e.target.value)} onBlur={(e) => handleBlurFormatStep('casing_depth_m', e.target.value)} />
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Диаметр обсадки, мм:</label>
          <select className={inputClass} value={form.casing_diameter_id} onChange={(e) => handleChange('casing_diameter_id', e.target.value)}>
            <option value="">—</option>
            {dicts.diameters.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Разбуривание, м:</label>
          <input className={inputClass} type="text" step="0.10" value={form.reaming_m} onChange={(e) => handleChange('reaming_m', e.target.value)} onBlur={(e) => handleBlurFormatStep('reaming_m', e.target.value)} />
        </div>
      </div>

      {/* Column 4 */}
      <div className="space-y-2">
        <div className={fieldRowClass}>
          <label className={labelClass}>ГСО, м:</label>
          <div>
            <input className={inputClass} type="text" step="0.10" value={form.gso_m} onChange={(e) => handleChange('gso_m', e.target.value)} onBlur={(e) => handleBlurFormatStep('gso_m', e.target.value)} disabled={!form.gso_manual} />
            <label className="flex items-center text-xs mt-1">
              <input type="checkbox" checked={form.gso_manual} onChange={(e) => handleChange('gso_manual', e.target.checked)} className="mr-1.5" />
              Вручную
            </label>
          </div>
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>ГСП, м:</label>
          <div>
            <input className={inputClass} type="text" step="0.10" value={form.gsp_m} onChange={(e) => handleChange('gsp_m', e.target.value)} onBlur={(e) => handleBlurFormatStep('gsp_m', e.target.value)} disabled={!form.gsp_manual} />
            <label className="flex items-center text-xs mt-1">
              <input type="checkbox" checked={form.gsp_manual} onChange={(e) => handleChange('gsp_manual', e.target.checked)} className="mr-1.5" />
              Вручную
            </label>
          </div>
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>ММГ, м:</label>
          <div>
            <input className={inputClass} type="text" step="0.10" value={form.mmg_m} onChange={(e) => handleChange('mmg_m', e.target.value)} onBlur={(e) => handleBlurFormatStep('mmg_m', e.target.value)} disabled={!form.mmg_manual} />
            <label className="flex items-center text-xs mt-1">
              <input type="checkbox" checked={form.mmg_manual} onChange={(e) => handleChange('mmg_manual', e.target.checked)} className="mr-1.5" />
              Вручную
            </label>
          </div>
        </div>
        <div className={fieldRowClass}>
          <label className={labelClass}>Исполнитель:</label>
          <input className={inputClass} value={form.user} onChange={(e) => handleChange('user', e.target.value)} />
        </div>
      </div>

      {/* Save button */}
      <div className="col-span-4 flex justify-end">
        <button
          onClick={handleSave}
          className="px-5 py-1.5 text-sm bg-[#4472c4] text-white rounded hover:bg-[#3060b0] border border-[#2a5090]"
        >
          💾 Сохранить
        </button>
      </div>
    </div>
  );
}

function SoilLayersTab({ borehole, boreholeId, onUpdate }: { borehole: Borehole; boreholeId?: string | null; onUpdate: (data: Partial<Borehole>) => void }) {
  const layers = borehole.soil_layers || [];
  const colKeys = ['depth_from', 'depth_to', 'ground_type', 'description'];
  const defaultWidths: Record<string, number> = { depth_from: 100, depth_to: 100, ground_type: 150, description: 300 };
  const { widths, handleMouseDown } = useColumnResize(colKeys, defaultWidths);

  const handleAdd = () => {
    const newLayer = {
      id: 'sl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId || borehole.id,
      depth_from_m: 0,
      depth_to_m: 1,
      ground_type: 'Новый слой',
      description: '',
    };
    onUpdate({ soil_layers: [...layers, newLayer] });
  };

  const handleDelete = (id: string) => {
    onUpdate({ soil_layers: layers.filter(l => l.id !== id) });
  };

  const handleCellEdit = (id: string, field: keyof typeof layers[0], value: string | number) => {
    const updatedLayers = layers.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    );
    onUpdate({ soil_layers: updatedLayers });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Слои грунта — {borehole.number}</div>
        <button onClick={handleAdd} className="px-2 py-0.5 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]">+ Добавить</button>
      </div>
      {layers.length === 0 ? (
        <div className="text-sm text-[#808080]">Нет данных</div>
      ) : (
        <div className="overflow-auto">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#e8e8e8] border-b">
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.depth_from}px` }}>Глубина от, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth_from')} /></th>
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.depth_to}px` }}>Глубина до, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth_to')} /></th>
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.ground_type}px` }}>Тип грунта<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'ground_type')} /></th>
                <th className="px-2 py-1.5 text-center relative leading-tight" style={{ width: `${widths.description}px` }}>Описание</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {layers.map((l) => (
                <tr key={l.id} className="border-b border-[#e8e8e8]">
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="number" 
                      step="0.01"
                      value={l.depth_from_m} 
                      onChange={(e) => handleCellEdit(l.id, 'depth_from_m', parseFloat(e.target.value) || 0)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="number" 
                      step="0.01"
                      value={l.depth_to_m} 
                      onChange={(e) => handleCellEdit(l.id, 'depth_to_m', parseFloat(e.target.value) || 0)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="text"
                      value={l.ground_type} 
                      onChange={(e) => handleCellEdit(l.id, 'ground_type', e.target.value)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input 
                      type="text"
                      value={l.description || ''} 
                      onChange={(e) => handleCellEdit(l.id, 'description', e.target.value)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WaterLayersTab({ borehole, boreholeId, onUpdate }: { borehole: Borehole; boreholeId?: string | null; onUpdate: (data: Partial<Borehole>) => void }) {
  const layers = borehole.water_layers || [];
  const colKeys = ['depth', 'water_type'];
  const defaultWidths: Record<string, number> = { depth: 120, water_type: 200 };
  const { widths, handleMouseDown } = useColumnResize(colKeys, defaultWidths);

  const handleAdd = () => {
    const newLayer = {
      id: 'wl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId || borehole.id,
      depth_m: 0,
      water_type: 'Грунтовые',
    };
    onUpdate({ water_layers: [...layers, newLayer] });
  };

  const handleDelete = (id: string) => {
    onUpdate({ water_layers: layers.filter(l => l.id !== id) });
  };

  const handleCellEdit = (id: string, field: keyof typeof layers[0], value: string | number) => {
    const updatedLayers = layers.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    );
    onUpdate({ water_layers: updatedLayers });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Слои воды — {borehole.number}</div>
        <button onClick={handleAdd} className="px-2 py-0.5 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]">+ Добавить</button>
      </div>
      {layers.length === 0 ? (
        <div className="text-sm text-[#808080]">Нет данных</div>
      ) : (
        <div className="overflow-auto">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#e8e8e8] border-b">
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.depth}px` }}>Глубина, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth')} /></th>
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.water_type}px` }}>Тип воды</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {layers.map((l) => (
                <tr key={l.id} className="border-b border-[#e8e8e8]">
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="number" 
                      step="0.01"
                      value={l.depth_m} 
                      onChange={(e) => handleCellEdit(l.id, 'depth_m', parseFloat(e.target.value) || 0)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="text"
                      value={l.water_type} 
                      onChange={(e) => handleCellEdit(l.id, 'water_type', e.target.value)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:text-red-800 text-xs">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SamplesTab({ borehole, boreholeId, onUpdate }: { borehole: Borehole; boreholeId?: string | null; onUpdate: (data: Partial<Borehole>) => void }) {
  const samples = borehole.samples || [];
  const colKeys = ['depth', 'sample_type', 'lab_number'];
  const defaultWidths: Record<string, number> = { depth: 100, sample_type: 150, lab_number: 150 };
  const { widths, handleMouseDown } = useColumnResize(colKeys, defaultWidths);

  const handleAdd = () => {
    const newSample = {
      id: 'sp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId || borehole.id,
      depth_m: 0,
      sample_type: 'Нарушенный',
      lab_number: '',
    };
    onUpdate({ samples: [...samples, newSample] });
  };

  const handleDelete = (id: string) => {
    onUpdate({ samples: samples.filter(s => s.id !== id) });
  };

  const handleCellEdit = (id: string, field: keyof typeof samples[0], value: string | number) => {
    const updatedSamples = samples.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    onUpdate({ samples: updatedSamples });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Пробы — {borehole.number}</div>
        <button onClick={handleAdd} className="px-2 py-0.5 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]">+ Добавить</button>
      </div>
      {samples.length === 0 ? (
        <div className="text-sm text-[#808080]">Нет данных</div>
      ) : (
        <div className="overflow-auto">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#e8e8e8] border-b">
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.depth}px` }}>Глубина, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth')} /></th>
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.sample_type}px` }}>Тип<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'sample_type')} /></th>
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.lab_number}px` }}>Лаб. номер</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} className="border-b border-[#e8e8e8]">
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="number" 
                      step="0.01"
                      value={s.depth_m} 
                      onChange={(e) => handleCellEdit(s.id, 'depth_m', parseFloat(e.target.value) || 0)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="text"
                      value={s.sample_type} 
                      onChange={(e) => handleCellEdit(s.id, 'sample_type', e.target.value)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="text"
                      value={s.lab_number || ''} 
                      onChange={(e) => handleCellEdit(s.id, 'lab_number', e.target.value)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800 text-xs">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ThermometryTab({ borehole, boreholeId, onUpdate }: { borehole: Borehole; boreholeId?: string | null; onUpdate: (data: Partial<Borehole>) => void }) {
  const entries = borehole.thermometry || [];
  const colKeys = ['depth', 'temperature'];
  const defaultWidths: Record<string, number> = { depth: 120, temperature: 150 };
  const { widths, handleMouseDown } = useColumnResize(colKeys, defaultWidths);

  const handleAdd = () => {
    const newEntry = {
      id: 'th-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId || borehole.id,
      depth_m: 0,
      temperature_c: 10,
    };
    onUpdate({ thermometry: [...entries, newEntry] });
  };

  const handleDelete = (id: string) => {
    onUpdate({ thermometry: entries.filter(t => t.id !== id) });
  };

  const handleCellEdit = (id: string, field: keyof typeof entries[0], value: string | number) => {
    const updatedEntries = entries.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    );
    onUpdate({ thermometry: updatedEntries });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Термометрия — {borehole.number}</div>
        <button onClick={handleAdd} className="px-2 py-0.5 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]">+ Добавить</button>
      </div>
      {entries.length === 0 ? (
        <div className="text-sm text-[#808080]">Нет данных</div>
      ) : (
        <div className="overflow-auto">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#e8e8e8] border-b">
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.depth}px` }}>Глубина, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth')} /></th>
                <th className="px-2 py-1.5 text-center border-r relative leading-tight" style={{ width: `${widths.temperature}px` }}>Температура, °C</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((t) => (
                <tr key={t.id} className="border-b border-[#e8e8e8]">
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="number" 
                      step="0.01"
                      value={t.depth_m} 
                      onChange={(e) => handleCellEdit(t.id, 'depth_m', parseFloat(e.target.value) || 0)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-1 py-1 border-r">
                    <input 
                      type="number" 
                      step="0.1"
                      value={t.temperature_c} 
                      onChange={(e) => handleCellEdit(t.id, 'temperature_c', parseFloat(e.target.value) || 0)}
                      className="w-full px-1 py-0.5 text-sm border border-transparent focus:border-blue-400 rounded"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 text-xs">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdditionalTab({ borehole }: { borehole: Borehole }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold mb-2">Дополнительно — {borehole.number}</div>
      <div className="grid grid-cols-2 gap-5 text-sm">
        <div>
          <div className="font-semibold mb-1.5">Аудит</div>
          <div>Пользователь: {borehole.user || '—'}</div>
          <div>Изменено: {borehole.modified_at || '—'}</div>
          <div>Ревизия: {borehole.rev || 0}</div>
        </div>
        <div>
          <div className="font-semibold mb-1.5">Источник</div>
          <div className="text-[#808080]">{borehole.source || 'Локальные данные'}</div>
          <div className="font-semibold mt-2 mb-1.5">WGS84</div>
          <div>Долгота: {borehole.wgs84_lon?.toFixed(4) || '—'}</div>
          <div>Широта: {borehole.wgs84_lat?.toFixed(4) || '—'}</div>
        </div>
      </div>
    </div>
  );
}
