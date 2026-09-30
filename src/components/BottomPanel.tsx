import { useState, useEffect } from 'react';
import { Borehole, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import { useColumnResize, ColumnResizer } from './ResizableTable';

interface Props {
  borehole: Borehole | null;
  onUpdate: (data: Partial<Borehole>) => void;
}

type TabId = 'general' | 'soil' | 'water' | 'samples' | 'thermometry' | 'additional';

export default function BottomPanel({ borehole, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: 'Общие' },
    { id: 'soil', label: 'Слои грунта' },
    { id: 'water', label: 'Слои воды' },
    { id: 'samples', label: 'Пробы' },
    { id: 'thermometry', label: 'Термометрия' },
    { id: 'additional', label: 'Дополнительно' },
  ];

  if (!borehole) {
    return (
      <div className="h-[260px] min-h-[200px] border-t border-[#c0c0c0] bg-[#f5f5f5] flex flex-col">
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
    <div className="h-[260px] min-h-[200px] border-t border-[#c0c0c0] bg-[#f5f5f5] flex flex-col">
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
        {activeTab === 'soil' && <SoilLayersTab borehole={borehole} />}
        {activeTab === 'water' && <WaterLayersTab borehole={borehole} />}
        {activeTab === 'samples' && <SamplesTab borehole={borehole} />}
        {activeTab === 'thermometry' && <ThermometryTab borehole={borehole} />}
        {activeTab === 'additional' && <AdditionalTab borehole={borehole} />}
      </div>
    </div>
  );
}

function GeneralForm({ borehole, onUpdate }: { borehole: Borehole; onUpdate: (data: Partial<Borehole>) => void }) {
  const dicts = GeoLogData.getDicts();
  const [form, setForm] = useState({
    number: borehole.number || '',
    depth_m: borehole.depth_m?.toString() || '',
    elev_m: borehole.elev_m?.toString() || '',
    x: borehole.x?.toString() || '',
    y: borehole.y?.toString() || '',
    date: borehole.date || '',
    wgs84_lon: borehole.wgs84_lon?.toString() || '',
    wgs84_lat: borehole.wgs84_lat?.toString() || '',
    casing_depth_m: borehole.casing_depth_m?.toString() || '',
    reaming_m: borehole.reaming_m?.toString() || '',
    gso_m: borehole.gso_m?.toString() || '',
    gsp_m: borehole.gsp_m?.toString() || '',
    mmg_m: borehole.mmg_m?.toString() || '',
    gso_manual: borehole.gso_manual || false,
    gsp_manual: borehole.gsp_manual || false,
    mmg_manual: borehole.mmg_manual || false,
  });

  useEffect(() => {
    setForm({
      number: borehole.number || '',
      depth_m: borehole.depth_m?.toString() || '',
      elev_m: borehole.elev_m?.toString() || '',
      x: borehole.x?.toString() || '',
      y: borehole.y?.toString() || '',
      date: borehole.date || '',
      wgs84_lon: borehole.wgs84_lon?.toString() || '',
      wgs84_lat: borehole.wgs84_lat?.toString() || '',
      casing_depth_m: borehole.casing_depth_m?.toString() || '',
      reaming_m: borehole.reaming_m?.toString() || '',
      gso_m: borehole.gso_m?.toString() || '',
      gsp_m: borehole.gsp_m?.toString() || '',
      mmg_m: borehole.mmg_m?.toString() || '',
      gso_manual: borehole.gso_manual || false,
      gsp_manual: borehole.gsp_manual || false,
      mmg_manual: borehole.mmg_manual || false,
    });
  }, [borehole.id]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const data: Partial<Borehole> = {
      number: form.number,
      depth_m: parseFloat(form.depth_m) || 0,
      elev_m: parseFloat(form.elev_m) || 0,
      x: parseFloat(form.x) || 0,
      y: parseFloat(form.y) || 0,
      date: form.date,
      wgs84_lon: parseFloat(form.wgs84_lon) || undefined,
      wgs84_lat: parseFloat(form.wgs84_lat) || undefined,
      casing_depth_m: parseFloat(form.casing_depth_m) || undefined,
      reaming_m: parseFloat(form.reaming_m) || undefined,
      gso_m: parseFloat(form.gso_m) || undefined,
      gsp_m: parseFloat(form.gsp_m) || undefined,
      mmg_m: parseFloat(form.mmg_m) || undefined,
      gso_manual: form.gso_manual,
      gsp_manual: form.gsp_manual,
      mmg_manual: form.mmg_manual,
    };
    onUpdate(data);
    Journal.logEvent('command', `Форма скважины ${borehole.number} сохранена`, 'bore.edit');
  };

  const inputClass = "w-full px-2 py-1 text-sm border border-[#c0c0c0] bg-white rounded focus:border-blue-400 focus:outline-none";
  const labelClass = "text-sm text-[#555] mb-1";

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left column */}
      <div className="space-y-2">
        <div>
          <label className={labelClass}>Номер</label>
          <input className={inputClass} value={form.number} onChange={(e) => handleChange('number', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Глубина, м</label>
          <input className={inputClass} type="number" step="0.01" value={form.depth_m} onChange={(e) => handleChange('depth_m', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Отметка, м</label>
          <input className={inputClass} type="number" step="0.01" value={form.elev_m} onChange={(e) => handleChange('elev_m', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Координата X</label>
          <input className={inputClass} type="number" step="0.01" value={form.x} onChange={(e) => handleChange('x', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Координата Y</label>
          <input className={inputClass} type="number" step="0.01" value={form.y} onChange={(e) => handleChange('y', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Дата</label>
          <input className={inputClass} value={form.date} onChange={(e) => handleChange('date', e.target.value)} placeholder="ДД.ММ.ГГГГ" />
        </div>
        <div>
          <label className={labelClass}>Сторонность</label>
          <select className={inputClass}>
            <option value="">—</option>
            {dicts.sides.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>WGS84 Долгота</label>
            <input className={inputClass} type="number" step="0.0001" value={form.wgs84_lon} onChange={(e) => handleChange('wgs84_lon', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>WGS84 Широта</label>
            <input className={inputClass} type="number" step="0.0001" value={form.wgs84_lat} onChange={(e) => handleChange('wgs84_lat', e.target.value)} />
          </div>
        </div>
        <button className="text-[10px] text-blue-600 hover:underline" onClick={() => Journal.logEvent('command', 'Пересчёт WGS84')}>
          🔄 Пересчёт координат
        </button>
      </div>

      {/* Right column */}
      <div className="space-y-2">
        <div>
          <label className={labelClass}>Буровая установка</label>
          <select className={inputClass}>
            <option value="">—</option>
            {dicts.rigs.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Способ проходки</label>
          <select className={inputClass}>
            <option value="">—</option>
            {dicts.methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Диаметр, мм</label>
          <select className={inputClass}>
            <option value="">—</option>
            {dicts.diameters.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Глубина обсадки, м</label>
          <input className={inputClass} type="number" step="0.01" value={form.casing_depth_m} onChange={(e) => handleChange('casing_depth_m', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Диаметр обсадки, мм</label>
          <select className={inputClass}>
            <option value="">—</option>
            {dicts.diameters.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Разбуривание, м</label>
          <input className={inputClass} type="number" step="0.01" value={form.reaming_m} onChange={(e) => handleChange('reaming_m', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelClass}>ГСО, м</label>
            <input className={inputClass} type="number" step="0.01" value={form.gso_m} onChange={(e) => handleChange('gso_m', e.target.value)} disabled={!form.gso_manual} />
            <label className="flex items-center text-xs mt-1">
              <input type="checkbox" checked={form.gso_manual} onChange={(e) => handleChange('gso_manual', e.target.checked)} className="mr-1.5" />
              Вручную
            </label>
          </div>
          <div>
            <label className={labelClass}>ГСП, м</label>
            <input className={inputClass} type="number" step="0.01" value={form.gsp_m} onChange={(e) => handleChange('gsp_m', e.target.value)} disabled={!form.gsp_manual} />
            <label className="flex items-center text-xs mt-1">
              <input type="checkbox" checked={form.gsp_manual} onChange={(e) => handleChange('gsp_manual', e.target.checked)} className="mr-1.5" />
              Вручную
            </label>
          </div>
          <div>
            <label className={labelClass}>ММГ, м</label>
            <input className={inputClass} type="number" step="0.01" value={form.mmg_m} onChange={(e) => handleChange('mmg_m', e.target.value)} disabled={!form.mmg_manual} />
            <label className="flex items-center text-xs mt-1">
              <input type="checkbox" checked={form.mmg_manual} onChange={(e) => handleChange('mmg_manual', e.target.checked)} className="mr-1.5" />
              Вручную
            </label>
          </div>
        </div>
        <div>
          <label className={labelClass}>Исполнитель</label>
          <input className={inputClass} value={borehole.user || ''} readOnly />
        </div>
      </div>

      {/* Save button */}
      <div className="col-span-2 flex justify-end">
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

function SoilLayersTab({ borehole }: { borehole: Borehole }) {
  const layers = borehole.soil_layers || [];
  const colKeys = ['depth_from', 'depth_to', 'ground_type', 'description'];
  const defaultWidths: Record<string, number> = { depth_from: 100, depth_to: 100, ground_type: 150, description: 300 };
  const { widths, handleMouseDown } = useColumnResize(colKeys, defaultWidths);

  return (
    <div>
      <div className="text-sm font-semibold mb-2">Слои грунта — {borehole.number}</div>
      {layers.length === 0 ? (
        <div className="text-sm text-[#808080]">Нет данных</div>
      ) : (
        <div className="overflow-auto">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#e8e8e8] border-b">
                <th className="px-3 py-1.5 text-left border-r relative" style={{ width: `${widths.depth_from}px` }}>Глубина от, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth_from')} /></th>
                <th className="px-3 py-1.5 text-left border-r relative" style={{ width: `${widths.depth_to}px` }}>Глубина до, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth_to')} /></th>
                <th className="px-3 py-1.5 text-left border-r relative" style={{ width: `${widths.ground_type}px` }}>Тип грунта<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'ground_type')} /></th>
                <th className="px-3 py-1.5 text-left relative" style={{ width: `${widths.description}px` }}>Описание</th>
              </tr>
            </thead>
            <tbody>
              {layers.map((l) => (
                <tr key={l.id} className="border-b border-[#e8e8e8]">
                  <td className="px-3 py-1 border-r">{l.depth_from_m.toFixed(2)}</td>
                  <td className="px-3 py-1 border-r">{l.depth_to_m.toFixed(2)}</td>
                  <td className="px-3 py-1 border-r">{l.ground_type}</td>
                  <td className="px-3 py-1">{l.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WaterLayersTab({ borehole }: { borehole: Borehole }) {
  const layers = borehole.water_layers || [];
  const colKeys = ['depth', 'water_type'];
  const defaultWidths: Record<string, number> = { depth: 120, water_type: 200 };
  const { widths, handleMouseDown } = useColumnResize(colKeys, defaultWidths);

  return (
    <div>
      <div className="text-sm font-semibold mb-2">Слои воды — {borehole.number}</div>
      {layers.length === 0 ? (
        <div className="text-sm text-[#808080]">Нет данных</div>
      ) : (
        <div className="overflow-auto">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#e8e8e8] border-b">
                <th className="px-3 py-1.5 text-left border-r relative" style={{ width: `${widths.depth}px` }}>Глубина, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth')} /></th>
                <th className="px-3 py-1.5 text-left relative" style={{ width: `${widths.water_type}px` }}>Тип воды</th>
              </tr>
            </thead>
            <tbody>
              {layers.map((l) => (
                <tr key={l.id} className="border-b border-[#e8e8e8]">
                  <td className="px-3 py-1 border-r">{l.depth_m.toFixed(2)}</td>
                  <td className="px-3 py-1">{l.water_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SamplesTab({ borehole }: { borehole: Borehole }) {
  const samples = borehole.samples || [];
  const colKeys = ['depth', 'sample_type', 'lab_number'];
  const defaultWidths: Record<string, number> = { depth: 100, sample_type: 150, lab_number: 150 };
  const { widths, handleMouseDown } = useColumnResize(colKeys, defaultWidths);

  return (
    <div>
      <div className="text-sm font-semibold mb-2">Пробы — {borehole.number}</div>
      {samples.length === 0 ? (
        <div className="text-sm text-[#808080]">Нет данных</div>
      ) : (
        <div className="overflow-auto">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#e8e8e8] border-b">
                <th className="px-3 py-1.5 text-left border-r relative" style={{ width: `${widths.depth}px` }}>Глубина, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth')} /></th>
                <th className="px-3 py-1.5 text-left border-r relative" style={{ width: `${widths.sample_type}px` }}>Тип<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'sample_type')} /></th>
                <th className="px-3 py-1.5 text-left relative" style={{ width: `${widths.lab_number}px` }}>Лаб. номер</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} className="border-b border-[#e8e8e8]">
                  <td className="px-3 py-1 border-r">{s.depth_m.toFixed(2)}</td>
                  <td className="px-3 py-1 border-r">{s.sample_type}</td>
                  <td className="px-3 py-1">{s.lab_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ThermometryTab({ borehole }: { borehole: Borehole }) {
  const entries = borehole.thermometry || [];
  const colKeys = ['depth', 'temperature'];
  const defaultWidths: Record<string, number> = { depth: 120, temperature: 150 };
  const { widths, handleMouseDown } = useColumnResize(colKeys, defaultWidths);

  return (
    <div>
      <div className="text-sm font-semibold mb-2">Термометрия — {borehole.number}</div>
      {entries.length === 0 ? (
        <div className="text-sm text-[#808080]">Нет данных</div>
      ) : (
        <div className="overflow-auto">
          <table className="text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#e8e8e8] border-b">
                <th className="px-3 py-1.5 text-left border-r relative" style={{ width: `${widths.depth}px` }}>Глубина, м<ColumnResizer onMouseDown={(e) => handleMouseDown(e, 'depth')} /></th>
                <th className="px-3 py-1.5 text-left relative" style={{ width: `${widths.temperature}px` }}>Температура, °C</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((t) => (
                <tr key={t.id} className="border-b border-[#e8e8e8]">
                  <td className="px-3 py-1 border-r">{t.depth_m.toFixed(2)}</td>
                  <td className="px-3 py-1">{t.temperature_c.toFixed(1)}</td>
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
