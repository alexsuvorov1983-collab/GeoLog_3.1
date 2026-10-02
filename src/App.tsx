import { useState, useEffect, useCallback, useMemo } from 'react';
import { GeoLogData, Borehole } from './core/dataStore';
import { bus } from './core/eventBus';
import { Journal } from './core/journal';
import { CommandRegistry, stubCommand } from './core/commandRegistry';
import MenuBar from './components/MenuBar';
import Toolbar from './components/Toolbar';
import NavigatorTree from './components/NavigatorTree';
import MDIArea from './components/MDIArea';
import BottomPanel from './components/BottomPanel';
import StatusBar from './components/StatusBar';
import ContextMenu from './components/ContextMenu';
import JournalPanel from './components/JournalPanel';
import Splitter from './components/Splitter';

export default function App() {
  const [selectedBoreholeId, setSelectedBoreholeId] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [openDocs, setOpenDocs] = useState<{ id: string; title: string; dirty: boolean }[]>([
    { id: 'doc-boreholes', title: 'Скважины', dirty: false },
  ]);
  const [activeDocId, setActiveDocId] = useState('doc-boreholes');
  const [showNavigator, setShowNavigator] = useState(true);
  const [showJournal, setShowJournal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'medium' | 'dark'>('light');
  const [navWidth, setNavWidth] = useState(280);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(260);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: { label: string; commandId: string }[] } | null>(null);
  const [, forceUpdate] = useState(0);

  // Open document function
  const openDoc = useCallback((docId: string, title: string) => {
    setOpenDocs((docs) => {
      const existing = docs.find((d) => d.id === docId);
      if (existing) {
        setActiveDocId(docId);
        return docs;
      }
      const newDoc = { id: docId, title, dirty: false };
      setActiveDocId(docId);
      return [...docs, newDoc];
    });
  }, []);

  // Register commands
  useEffect(() => {
    // File commands
    CommandRegistry.register({ id: 'file.new', label: 'Создать', shortcut: 'Ctrl+N', handler: () => { Journal.logEvent('command', 'Создание нового проекта'); } });
    CommandRegistry.register({ id: 'file.open', label: 'Открыть', shortcut: 'Ctrl+O', handler: () => { Journal.logEvent('command', 'Открытие проекта'); } });
    CommandRegistry.register({ id: 'file.save', label: 'Сохранить', shortcut: 'Ctrl+S', handler: () => { Journal.logEvent('command', 'Сохранение проекта'); } });
    CommandRegistry.register({ id: 'file.saveas', label: 'Сохранить как...', handler: () => { Journal.logEvent('command', 'Сохранить как'); } });
    CommandRegistry.register({ id: 'file.archive', label: 'Архив', handler: () => { Journal.logEvent('command', 'Архив'); } });
    CommandRegistry.register({ id: 'file.recent', label: 'Последние проекты', handler: () => { Journal.logEvent('command', 'Последние проекты'); } });
    CommandRegistry.register({ id: 'file.exit', label: 'Выход', handler: () => { Journal.logEvent('command', 'Выход из приложения'); } });

    // Edit commands
    CommandRegistry.register({ id: 'bore.create', label: 'Создать скважину', handler: () => {
      const bh = GeoLogData.create({ number: `С-${GeoLogData.count() + 1}`, depth_m: 10, elev_m: 140, x: 554000, y: 6178000 });
      setSelectedBoreholeId(bh.id);
      forceUpdate((n) => n + 1);
    }});
    CommandRegistry.register({ id: 'bore.edit', label: 'Изменить', handler: () => { Journal.logEvent('command', 'Изменение скважины'); } });
    CommandRegistry.register({ id: 'bore.delete', label: 'Удалить', handler: () => {
      if (selectedBoreholeId) { GeoLogData.delete(selectedBoreholeId); setSelectedBoreholeId(null); forceUpdate((n) => n + 1); }
    }});
    CommandRegistry.register({ id: 'bore.restore', label: 'Восстановить', handler: () => { Journal.logEvent('warning', 'Восстановление — не реализовано'); } });
    CommandRegistry.register({ id: 'bore.find', label: 'Найти на чертеже', handler: () => { Journal.logEvent('command', 'Поиск на чертеже'); } });
    stubCommand('edit.undo', 'Отмена');
    stubCommand('edit.redo', 'Повтор');

    // View commands
    CommandRegistry.register({ id: 'view.navigator', label: 'Навигатор', handler: () => { setShowNavigator((v) => !v); } });
    CommandRegistry.register({ id: 'view.journal', label: 'Журнал', handler: () => { setShowJournal((v) => !v); } });
    CommandRegistry.register({ id: 'view.theme', label: 'Тема', handler: () => { setTheme(v => v === 'light' ? 'medium' : v === 'medium' ? 'dark' : 'light'); } });
    CommandRegistry.register({ id: 'view.resetLayout', label: 'Сброс раскладки', handler: () => { Journal.logEvent('command', 'Сброс раскладки'); } });
    CommandRegistry.register({ id: 'view.refresh', label: 'Обновить', shortcut: 'F5', handler: () => { forceUpdate((n) => n + 1); Journal.logEvent('command', 'Обновление'); } });

    // Reports stubs
    stubCommand('reports.rdl', 'Отчёт RDL');
    stubCommand('reports.docx', 'Отчёт DOCX');

    // Window commands
    CommandRegistry.register({ id: 'window.cascade', label: 'Каскад', handler: () => { Journal.logEvent('command', 'Каскадное расположение'); } });
    CommandRegistry.register({ id: 'window.closeAll', label: 'Закрыть все', handler: () => { setOpenDocs([]); } });

    // Help
    stubCommand('help.about', 'О программе');
    stubCommand('help.manual', 'Справка');
    stubCommand('help.quickstart', 'Быстрое начало');

    // Document open commands
    CommandRegistry.register({ id: 'doc.open.boreholes', label: 'Скважины', handler: () => openDoc('doc-boreholes', 'Скважины') });
    CommandRegistry.register({ id: 'doc.open.cpt', label: 'Статическое зондирование', handler: () => openDoc('doc-cpt', 'Статическое зондирование') });
    CommandRegistry.register({ id: 'doc.open.dpt', label: 'Динамическое зондирование', handler: () => openDoc('doc-dpt', 'Динамическое зондирование') });
    CommandRegistry.register({ id: 'doc.open.stamp', label: 'Штампы', handler: () => openDoc('doc-stamp', 'Штампы') });
    CommandRegistry.register({ id: 'doc.open.vane', label: 'Крыльчатка', handler: () => openDoc('doc-vane', 'Крыльчатка') });
    CommandRegistry.register({ id: 'doc.open.soil-samples', label: 'Пробы грунта', handler: () => openDoc('doc-soil-samples', 'Пробы грунта') });
    CommandRegistry.register({ id: 'doc.open.water-samples', label: 'Пробы воды', handler: () => openDoc('doc-water-samples', 'Пробы воды') });
    CommandRegistry.register({ id: 'doc.open.ige', label: 'ИГЭ', handler: () => openDoc('doc-ige', 'ИГЭ') });
    CommandRegistry.register({ id: 'doc.open.aquifers', label: 'Водоносные горизонты', handler: () => openDoc('doc-aquifers', 'Водоносные горизонты') });
    CommandRegistry.register({ id: 'doc.open.subsidence', label: 'Тип просадки', handler: () => openDoc('doc-subsidence', 'Тип просадки') });
    CommandRegistry.register({ id: 'doc.open.pile', label: 'Несущая способность свай', handler: () => openDoc('doc-pile', 'Несущая способность свай') });

    Journal.logEvent('info', 'GeoLog 3.0 запущен');
  }, [selectedBoreholeId, openDoc]);

  // Listen for bus events
  useEffect(() => {
    const unsub = bus.on('ui:node-selected', (payload) => {
      if (payload?.collection === 'boreholes' && payload?.id) {
        setSelectedBoreholeId(payload.id);
      }
    });
    return unsub;
  }, []);

  // Listen for data changes
  useEffect(() => {
    const unsub = GeoLogData.subscribe(() => {
      forceUpdate((n) => n + 1);
    });
    return () => { unsub(); };
  }, []);

  // Подписка на изменения данных для обновления таблицы скважин
  const [dataVersion, setDataVersion] = useState(0);
  useEffect(() => {
    const unsub = GeoLogData.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return () => { unsub(); };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F5') { e.preventDefault(); CommandRegistry.execute('view.refresh'); }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); CommandRegistry.execute('file.new'); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); CommandRegistry.execute('file.save'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent, items: { label: string; commandId: string }[]) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Select borehole
  const selectBorehole = useCallback((id: string | null) => {
    setSelectedBoreholeId(id);
    if (id) {
      bus.emit('ui:node-selected', { collection: 'boreholes', id });
    }
  }, []);

  // Mark doc dirty
  const markDirty = useCallback((docId: string) => {
    setOpenDocs((docs) => docs.map((d) => d.id === docId ? { ...d, dirty: true } : d));
  }, []);

  // Navigator resize handler
  const handleNavResize = useCallback((delta: number) => {
    setNavWidth((prev) => Math.max(180, Math.min(600, prev + delta)));
  }, []);

  // Bottom panel resize handler
  const handleBottomResize = useCallback((delta: number) => {
    setBottomPanelHeight((prev) => Math.max(150, Math.min(500, prev - delta)));
  }, []);

  // Borehole actions
  const handleCreateBorehole = useCallback(() => {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const bh = GeoLogData.create({ 
      number: `С-${GeoLogData.count() + 1}`, 
      depth_m: 10, 
      elev_m: 140, 
      x: 554000, 
      y: 6178000,
      date: currentDate,
      end_date: currentDate
    });
    setSelectedBoreholeId(bh.id);
    forceUpdate((n) => n + 1);
  }, []);

  const handleDeleteBorehole = useCallback(() => {
    if (selectedBoreholeId) {
      GeoLogData.delete(selectedBoreholeId);
      setSelectedBoreholeId(null);
      forceUpdate((n) => n + 1);
    }
  }, [selectedBoreholeId]);

  const handleLoadFromCatalog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        // Пропускаем первую строку (заголовки), начинаем со второй
        let loadedCount = 0;
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 4) continue;

          const number = String(row[0] || '').trim();
          const x = parseFloat(row[1]) || 0;
          const y = parseFloat(row[2]) || 0;
          const elev_m = parseFloat(row[3]) || 0;

          if (!number) continue;

          // Устанавливаем текущую дату для полей "Начата" и "Окончена"
          const currentDate = new Date().toLocaleDateString('ru-RU');
          GeoLogData.create({ number, x, y, elev_m, depth_m: 10, date: currentDate, end_date: currentDate });
          loadedCount++;
        }

        // Снимаем выделение, чтобы пользователь мог выбрать отдельную скважину
        setSelectedBoreholeId(null);
        
        // Сортируем скважины по номеру
        GeoLogData.sortByNumber();
        
        forceUpdate((n) => n + 1);
        Journal.logEvent('info', `Загружено скважин из Excel: ${loadedCount}`, 'bore.load_catalog');
      } catch (error) {
        Journal.logEvent('error', `Ошибка загрузки Excel: ${(error as Error).message}`, 'bore.load_catalog');
      }
    };
    input.click();
  }, []);

  // Close doc with confirmation
  const closeDoc = useCallback((docId: string) => {
    const doc = openDocs.find((d) => d.id === docId);
    if (doc?.dirty) {
      if (!window.confirm('Документ изменён. Сохранить перед закрытием?')) {
        setOpenDocs((docs) => docs.filter((d) => d.id !== docId));
        if (activeDocId === docId) {
          const remaining = openDocs.filter((d) => d.id !== docId);
          if (remaining.length > 0) setActiveDocId(remaining[remaining.length - 1].id);
        }
      }
    } else {
      setOpenDocs((docs) => docs.filter((d) => d.id !== docId));
      if (activeDocId === docId) {
        const remaining = openDocs.filter((d) => d.id !== docId);
        if (remaining.length > 0) setActiveDocId(remaining[remaining.length - 1].id);
      }
    }
  }, [openDocs, activeDocId]);

  // Вычисляем selectedBorehole с зависимостью от dataVersion для реактивности
  const selectedBorehole: Borehole | null = useMemo(() => {
    return selectedBoreholeId ? (GeoLogData.getById(selectedBoreholeId) ?? null) : null;
  }, [selectedBoreholeId, dataVersion]);

  // Получаем актуальный список скважин с зависимостью от dataVersion
  const boreholes = useMemo(() => {
    return GeoLogData.getAll();
  }, [dataVersion]);

  const themeClass = `theme-${theme}`;

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden ${themeClass}`} style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: '12px' }}>
      {/* Menu Bar */}
      <MenuBar />

      {/* Toolbar */}
      <Toolbar theme={theme} onThemeChange={setTheme} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigator Tree */}
        {showNavigator && (
          <NavigatorTree
            selectedBoreholeId={selectedBoreholeId}
            onSelect={selectBorehole}
            onContextMenu={handleContextMenu}
            width={navWidth}
          />
        )}

        {/* Vertical Splitter */}
        {showNavigator && (
          <Splitter direction="vertical" onResize={handleNavResize} />
        )}

        {/* Center + Bottom */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* MDI Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <MDIArea
              openDocs={openDocs}
              activeDocId={activeDocId}
              onActivate={setActiveDocId}
              onClose={closeDoc}
              onReorder={setOpenDocs}
              boreholes={boreholes}
              selectedBoreholeId={selectedBoreholeId}
              onSelectBorehole={selectBorehole}
              selectedSampleId={selectedSampleId}
              onSelectSample={setSelectedSampleId}
              onCreateBorehole={handleCreateBorehole}
              onDeleteBorehole={handleDeleteBorehole}
              onLoadFromCatalog={handleLoadFromCatalog}
            />
          </div>

          {/* Horizontal Splitter */}
          <Splitter direction="horizontal" onResize={handleBottomResize} />

          {/* Bottom Panel */}
          <BottomPanel
            borehole={selectedBorehole}
            boreholes={boreholes}
            boreholeId={selectedBoreholeId}
            selectedSampleId={selectedSampleId}
            height={bottomPanelHeight}
            onSelectBorehole={selectBorehole}
            onUpdate={(data?: Partial<Borehole>) => {
              // Если есть данные для обновления скважины и выбрана скважина
              if (selectedBoreholeId && data && Object.keys(data).length > 0) {
                GeoLogData.update(selectedBoreholeId, data);
                markDirty('doc-boreholes');
              }
              // Всегда увеличиваем dataVersion для перерисовки данных
              setDataVersion(v => v + 1);
              forceUpdate((n) => n + 1);
            }}
          />
        </div>

        {/* Journal Panel */}
        {showJournal && (
          <JournalPanel onClose={() => setShowJournal(false)} />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        boreholeNumber={selectedBorehole?.number}
        user={selectedBorehole?.user || 'Пользователь'}
        modifiedAt={selectedBorehole?.modified_at}
        totalObjects={GeoLogData.totalObjects()}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
