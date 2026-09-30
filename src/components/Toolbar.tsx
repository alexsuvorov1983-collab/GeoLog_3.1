import { CommandRegistry } from '../core/commandRegistry';
import { Journal } from '../core/journal';
import ThemeSwitcher, { ThemeMode } from './ThemeSwitcher';

interface ToolbarProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export default function Toolbar({ theme, onThemeChange }: ToolbarProps) {
  const handleAction = (action: string) => {
    switch (action) {
      case 'new':
        CommandRegistry.execute('file.new');
        break;
      case 'print':
        Journal.logEvent('command', 'Печать документа');
        break;
      case 'preview':
        Journal.logEvent('command', 'Предпросмотр документа');
        break;
      case 'export':
        Journal.logEvent('command', 'Экспорт данных');
        break;
      case 'open':
        CommandRegistry.execute('file.open');
        break;
    }
  };

  return (
    <div className="bg-[#f5f5f5] border-b border-[#c0c0c0] flex items-center px-2 py-1 gap-1.5" style={{ height: '38px' }}>
      {/* New */}
      <button
        onClick={() => handleAction('new')}
        className="px-3 py-1.5 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff] flex items-center gap-1.5"
        title="Создать проект"
      >
        <span className="text-blue-600">📄</span> Создать
      </button>

      {/* Open */}
      <button
        onClick={() => handleAction('open')}
        className="px-3 py-1.5 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff] flex items-center gap-1.5"
        title="Открыть проект"
      >
        <span className="text-yellow-600">📂</span> Открыть
      </button>

      <div className="w-px h-6 bg-[#c0c0c0] mx-1" />

      {/* Print */}
      <button
        onClick={() => handleAction('print')}
        className="px-3 py-1.5 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff] flex items-center gap-1.5"
        title="Печать"
      >
        <span>🖨️</span> Печать
      </button>

      {/* Preview */}
      <button
        onClick={() => handleAction('preview')}
        className="px-3 py-1.5 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff] flex items-center gap-1.5"
        title="Предпросмотр"
      >
        <span>🔍</span> Предпросмотр
      </button>

      {/* Export */}
      <button
        onClick={() => handleAction('export')}
        className="px-3 py-1.5 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff] flex items-center gap-1.5"
        title="Экспорт"
      >
        <span>📤</span> Экспорт
      </button>

      <div className="w-px h-6 bg-[#c0c0c0] mx-1" />

      {/* Dropdown for quick open */}
      <div className="relative group">
        <button
          className="px-3 py-1.5 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff] flex items-center gap-1.5"
          title="Быстрое открытие документов"
        >
          <span>📋</span> Документы ▾
        </button>
        <div className="absolute top-full left-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[200px] hidden group-hover:block">
          <button className="w-full text-left px-4 py-1.5 text-sm hover:bg-[#d0d0ff]">Скважины</button>
          <button className="w-full text-left px-4 py-1.5 text-sm hover:bg-[#d0d0ff]">Пробы грунта</button>
          <button className="w-full text-left px-4 py-1.5 text-sm hover:bg-[#d0d0ff]">Пробы воды</button>
          <button className="w-full text-left px-4 py-1.5 text-sm hover:bg-[#d0d0ff]">ИГЭ</button>
        </div>
      </div>

      {/* Переключатель темы (справа) */}
      <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
    </div>
  );
}
