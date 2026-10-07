// Плавающее окно пояснительной записки
// Этап 7: Пояснительная записка

import { useState, useEffect, useRef } from 'react';
import { REPORT_SECTIONS } from '../utils/reportStructure';
import { generateSectionContent } from '../utils/reportGenerator';
import { generateDocx } from '../utils/docxExporter';
import { Journal } from '../core/journal';

interface ReportWindowState {
  isOpen: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
}

interface SectionState {
  id: string;
  text?: string;
  tableRows?: string[][];
  isEdited: boolean;
  isSaved: boolean;
  isReady: boolean;
}

interface Props {
  projectName: string;
  onClose: () => void;
}

const STORAGE_KEY = 'geolog_report_window_state';
const SECTIONS_STORAGE_KEY = 'geolog_report_sections';

export default function ReportWindow({ projectName, onClose }: Props) {
  const [windowState, setWindowState] = useState<ReportWindowState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      isOpen: true,
      x: (window.innerWidth - 960) / 2,
      y: (window.innerHeight - 640) / 2,
      width: 960,
      height: 640,
      isMaximized: false,
      isMinimized: false
    };
  });

  const [sections, setSections] = useState<SectionState[]>(() => {
    const saved = localStorage.getItem(SECTIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[ReportWindow] Загружено из localStorage:', parsed.length, 'разделов');
      
      // Проверяем, нужна ли миграция (если у первого раздела нет поля isReady)
      const needsMigration = parsed.length > 0 && parsed[0].isReady === undefined;
      
      if (needsMigration) {
        console.log('[ReportWindow] Обнаружены старые данные, выполняю миграцию');
        // Миграция: если поле isReady отсутствует, установить все как неготовые
        const migrated = parsed.map((section: any) => {
          console.log(`[ReportWindow] Миграция раздела ${section.id}: isReady = false`);
          return { ...section, isReady: false };
        });
        console.log('[ReportWindow] Все разделы после миграции не готовы');
        return migrated;
      } else {
        console.log('[ReportWindow] Данные актуальны, миграция не требуется');
        console.log('[ReportWindow] Готовые разделы:', parsed.filter((s: any) => s.isReady).map((s: any) => s.id));
        return parsed;
      }
    }
    
    console.log('[ReportWindow] Инициализация новых разделов');
    // Инициализация разделов автогенерацией
    // По умолчанию все разделы не готовы
    const initialized = REPORT_SECTIONS.map(section => {
      const content = generateSectionContent(section.id);
      return {
        id: section.id,
        text: content.text,
        tableRows: content.tableRows,
        isEdited: false,
        isSaved: true,
        isReady: false
      };
    });
    console.log('[ReportWindow] Все разделы по умолчанию не готовы');
    return initialized;
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [editTableRows, setEditTableRows] = useState<string[][]>([]);
  const [activeSection, setActiveSection] = useState<string>('report-1');
  const [showNavigation, setShowNavigation] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<Record<string, string[]>>({});

  const contentRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Сохранение состояния окна
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(windowState));
  }, [windowState]);

  // Сохранение разделов
  useEffect(() => {
    localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  // Обработка drag
  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    if (type === 'drag') {
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - windowState.x,
        y: e.clientY - windowState.y
      };
    } else {
      isResizing.current = true;
      dragOffset.current = {
        x: e.clientX,
        y: e.clientY
      };
    }
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        setWindowState(prev => ({
          ...prev,
          x: Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragOffset.current.y))
        }));
      } else if (isResizing.current) {
        setWindowState(prev => ({
          ...prev,
          width: Math.max(480, prev.width + (e.clientX - dragOffset.current.x)),
          height: Math.max(320, prev.height + (e.clientY - dragOffset.current.y))
        }));
        dragOffset.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };

    // Всегда добавляем обработчики, проверка флагов внутри них
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Функция проверки готовности раздела
  const isSectionReady = (sectionState: SectionState | undefined): boolean => {
    if (!sectionState) return false;
    
    // Раздел готов, если явно отмечен как готовый
    return sectionState.isReady;
  };

  // Функция переключения готовности раздела
  const toggleSectionReady = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, isReady: !s.isReady }
        : s
    ));
    const section = sections.find(s => s.id === sectionId);
    const newStatus = section?.isReady ? 'не готов' : 'готов';
    Journal.logEvent('info', `Раздел ${sectionId} отмечен как ${newStatus}`, 'report.section_toggle');
  };

  // Функция загрузки изображений
  const handleImageUpload = (sectionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedImages(prev => ({
            ...prev,
            [sectionId]: [...(prev[sectionId] || []), result]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Сброс input для возможности повторной загрузки того же файла
    event.target.value = '';
  };

  // Функция удаления изображения
  const handleImageDelete = (sectionId: string, imageIndex: number) => {
    setUploadedImages(prev => ({
      ...prev,
      [sectionId]: prev[sectionId]?.filter((_, idx) => idx !== imageIndex) || []
    }));
  };

  // Список приложений, для которых доступна загрузка изображений
  const imageUploadSections = [
    'report-app-a', 'report-app-b', 'report-app-v', 'report-app-e', 'report-app-zh',
    'report-app-i', 'report-app-k', 'report-app-l', 'report-app-m', 'report-app-n',
    'report-app-p', 'report-app-r', 'report-app-s', 'report-app-t', 'report-app-u',
    'report-app-h', 'report-app-ts', 'report-app-sh', 'report-app-sch', 'report-app-ya'
  ];

  // Scrollspy
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const scrollTop = contentRef.current.scrollTop;
      
      for (const section of REPORT_SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          if (scrollTop >= offsetTop - 100) {
            setActiveSection(section.id);
          }
        }
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Навигация к разделу
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element && contentRef.current) {
      contentRef.current.scrollTo({
        top: element.offsetTop - 20,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Редактирование раздела
  const startEditing = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setEditingSection(sectionId);
      setEditText(section.text || '');
      setEditTableRows(section.tableRows || []);
    }
  };

  // Сохранение раздела
  const saveSection = () => {
    if (!editingSection) return;
    
    setSections(prev => prev.map(s => 
      s.id === editingSection 
        ? { ...s, text: editText, tableRows: editTableRows, isEdited: false, isSaved: true }
        : s
    ));
    
    setEditingSection(null);
    Journal.logEvent('info', `Раздел ${editingSection} сохранён`, 'report.save');
  };

  // Отмена редактирования
  const cancelEditing = () => {
    setEditingSection(null);
  };

  // Сброс к автогенерации
  const resetToAutoGeneration = (sectionId: string) => {
    const content = generateSectionContent(sectionId);
    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, text: content.text, tableRows: content.tableRows, isEdited: false, isSaved: true }
        : s
    ));
    Journal.logEvent('info', `Раздел ${sectionId} сброшен к автогенерации`, 'report.reset');
  };

  // Экспорт в DOCX
  const exportToDocx = async () => {
    try {
      const sectionsData = sections.map(s => ({
        id: s.id,
        text: s.text,
        tableRows: s.tableRows
      }));
      
      await generateDocx(projectName, sectionsData);
      Journal.logEvent('info', `ПЗ экспортирована в DOCX: ${projectName}_ПЗ.docx`, 'report.export');
      alert('Файл успешно экспортирован!\n\nОткройте файл в Word и обновите поле оглавления (Ctrl+A, F9).');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка при экспорте файла');
    }
  };

  // Управление окном
  const toggleMaximize = () => {
    setWindowState(prev => ({
      ...prev,
      isMaximized: !prev.isMaximized,
      isMinimized: false
    }));
  };

  const toggleMinimize = () => {
    setWindowState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }));
  };

  // Стили окна
  const windowStyle: React.CSSProperties = windowState.isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }
    : {
        position: 'fixed',
        top: windowState.y,
        left: windowState.x,
        width: windowState.width,
        height: windowState.isMinimized ? 'auto' : windowState.height,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      };

  return (
    <div ref={windowRef} style={windowStyle} className="bg-white border border-gray-300 shadow-2xl rounded-lg overflow-hidden">
      {/* Шапка окна */}
      <div
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 flex items-center justify-between cursor-move select-none"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <span className="font-semibold">Пояснительная записка</span>
          <span className="text-sm opacity-75">— {projectName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToDocx}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm font-semibold"
            title="Выгрузить в DOCX"
          >
            💾 DOCX
          </button>
          <button
            onClick={() => setShowNavigation(!showNavigation)}
            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-sm"
            title="Показать/скрыть навигацию"
          >
            ☰
          </button>
          <button
            onClick={toggleMinimize}
            className="px-2 py-1 hover:bg-blue-500 rounded"
            title="Свернуть"
          >
            —
          </button>
          <button
            onClick={toggleMaximize}
            className="px-2 py-1 hover:bg-blue-500 rounded"
            title="Развернуть"
          >
            □
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 hover:bg-red-500 rounded"
            title="Закрыть"
          >
            ×
          </button>
        </div>
      </div>

      {/* Содержимое окна */}
      {!windowState.isMinimized && (
        <div className="flex flex-1 overflow-hidden">
          {/* Левая панель - навигация */}
          {showNavigation && (
            <div className="w-72 bg-gray-50 border-r border-gray-300 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Разделы</div>
                {REPORT_SECTIONS.map(section => {
                  const sectionState = sections.find(s => s.id === section.id);
                  const isActive = activeSection === section.id;
                  const hasUnsavedChanges = sectionState?.isEdited && !sectionState?.isSaved;
                  const isReady = isSectionReady(sectionState);
                  
                  return (
                    <div
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`px-3 py-2 cursor-pointer rounded mb-1 flex items-center gap-2 ${
                        isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                      }`}
                      style={{ paddingLeft: `${section.level === 2 ? 24 : 12}px` }}
                    >
                      {hasUnsavedChanges && <span className="text-red-500 text-xs">●</span>}
                      <span className={`text-lg ${isReady ? 'text-green-600' : 'text-red-500'}`}>
                        {isReady ? '✓' : '✗'}
                      </span>
                      <span className="text-sm flex-1">
                        {section.number && <span className="font-semibold">{section.number} </span>}
                        {section.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Правая панель - содержимое */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 bg-gray-100">
            {REPORT_SECTIONS.map(section => {
              const sectionState = sections.find(s => s.id === section.id);
              const isEditing = editingSection === section.id;
              const isReady = isSectionReady(sectionState);
              
              return (
                <div key={section.id} id={section.id} className="mb-8 flex gap-4">
                  {/* Левая панель с кнопками управления */}
                  <div className="flex-shrink-0 w-48 flex flex-col gap-2 pt-4">
                    {/* Индикатор готовности */}
                    <div className={`text-4xl text-center ${isReady ? 'text-green-600' : 'text-red-500'}`} title={isReady ? 'Раздел готов' : 'Раздел не готов'}>
                      {isReady ? '✓' : '✗'}
                    </div>
                    
                    {/* Кнопки управления */}
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveSection}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-semibold"
                        >
                          ✓ Сохранить
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-semibold"
                        >
                          ✗ Отменить
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(section.id)}
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold"
                        >
                          ✎ Редактировать
                        </button>
                        <button
                          onClick={() => resetToAutoGeneration(section.id)}
                          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-semibold"
                        >
                          ↺ Автогенерация
                        </button>
                        <button
                          onClick={() => toggleSectionReady(section.id)}
                          className={`px-3 py-2 text-white rounded text-sm font-semibold ${
                            isReady 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                          title={isReady ? 'Раздел готов' : 'Раздел не готов'}
                        >
                          {isReady ? '✓ Готово' : '✗ Не готово'}
                        </button>
                        
                        {/* Кнопка загрузки изображений для приложений */}
                        {imageUploadSections.includes(section.id) && (
                          <label className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-semibold cursor-pointer text-center">
                            📷 Загрузить
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg"
                              multiple
                              onChange={(e) => handleImageUpload(section.id, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Лист A4 */}
                  <div 
                    className="bg-white shadow-lg flex-1"
                    style={{
                      maxWidth: '210mm',
                      minHeight: '297mm',
                      padding: '20mm 15mm 20mm 30mm',
                      fontFamily: '"Times New Roman", Times, serif',
                      fontSize: '12pt',
                      lineHeight: '1.5',
                      pageBreakBefore: 'always'
                    }}
                  >
                  {/* Заголовок раздела */}
                  <div className="mb-4">
                    <h2 className={`font-bold text-gray-800 uppercase ${section.level === 1 ? 'text-2xl' : 'text-xl'}`}>
                      {section.number && <span>{section.number} </span>}
                      {section.title.toUpperCase()}
                    </h2>
                  </div>

                  {/* Содержимое раздела */}
                  {isEditing ? (
                    <div className="space-y-4">
                      {sectionState?.text !== undefined && (
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full h-64 p-3 border border-gray-300 rounded font-mono text-sm"
                          placeholder="Текст раздела..."
                        />
                      )}
                      {sectionState?.tableRows && section.tableHeaders && (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                {section.tableHeaders.map((header, i) => (
                                  <th key={i} className="border border-gray-300 px-2 py-1 text-left font-semibold">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {editTableRows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="border border-gray-300 px-1 py-1">
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => {
                                          const newRows = [...editTableRows];
                                          newRows[rowIndex][cellIndex] = e.target.value;
                                          setEditTableRows(newRows);
                                        }}
                                        className="w-full px-1 py-0.5 border-none focus:outline-none focus:bg-blue-50"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {/* Загруженные изображения */}
                      {uploadedImages[section.id] && uploadedImages[section.id].length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-gray-700">Загруженные изображения:</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {uploadedImages[section.id].map((image, idx) => (
                              <div key={idx} className="relative group">
                                <img 
                                  src={image} 
                                  alt={`Изображение ${idx + 1}`}
                                  className="w-full h-auto border border-gray-300 rounded"
                                />
                                <button
                                  onClick={() => handleImageDelete(section.id, idx)}
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Удалить изображение"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      {sectionState?.text && (
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {sectionState.text}
                        </div>
                      )}
                      {sectionState?.tableRows && section.tableHeaders && (
                        <div className="overflow-x-auto mt-4">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                {section.tableHeaders.map((header, i) => (
                                  <th key={i} className="border border-gray-300 px-3 py-2 text-left font-semibold">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sectionState.tableRows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50">
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="border border-gray-300 px-3 py-2">
                                      {cell || '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {/* Загруженные изображения */}
                      {uploadedImages[section.id] && uploadedImages[section.id].length > 0 && (
                        <div className="space-y-4 mt-6">
                          <h3 className="text-sm font-semibold text-gray-700">Загруженные изображения:</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {uploadedImages[section.id].map((image, idx) => (
                              <div key={idx} className="relative group">
                                <img 
                                  src={image} 
                                  alt={`Изображение ${idx + 1}`}
                                  className="w-full h-auto border border-gray-300 rounded"
                                />
                                <button
                                  onClick={() => handleImageDelete(section.id, idx)}
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Удалить изображение"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  </div> {/* Конец листа A4 */}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ручка изменения размера */}
      {!windowState.isMaximized && !windowState.isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gradient-to-tl from-gray-400 to-transparent"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      )}
    </div>
  );
}

// Конец файла
