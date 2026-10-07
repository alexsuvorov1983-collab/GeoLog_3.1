import { useState, useRef, useEffect } from 'react';
import { CommandRegistry } from '../core/commandRegistry';

interface MenuItem {
  label: string;
  commandId?: string;
  separator?: boolean;
  shortcut?: string;
  submenu?: MenuItem[];
}

const menuStructure: { label: string; items: MenuItem[] }[] = [
  {
    label: 'ФАЙЛ',
    items: [
      { label: 'Создать', commandId: 'file.new', shortcut: 'Ctrl+N' },
      { label: 'Открыть...', commandId: 'file.open', shortcut: 'Ctrl+O' },
      { label: 'Сохранить', commandId: 'file.save', shortcut: 'Ctrl+S' },
      { label: 'Сохранить как...', commandId: 'file.saveas' },
      { separator: true, label: '' },
      { label: 'Архив', commandId: 'file.archive' },
      { label: 'Последние проекты', commandId: 'file.recent' },
      { separator: true, label: '' },
      { label: 'Выход', commandId: 'file.exit' },
    ],
  },
  {
    label: 'ПРАВКА',
    items: [
      { label: 'Создать скважину', commandId: 'bore.create' },
      { label: 'Изменить', commandId: 'bore.edit' },
      { label: 'Удалить', commandId: 'bore.delete' },
      { label: 'Восстановить', commandId: 'bore.restore' },
      { separator: true, label: '' },
      { label: 'Найти на чертеже', commandId: 'bore.find' },
      { separator: true, label: '' },
      { label: 'Отмена', commandId: 'edit.undo', shortcut: 'Ctrl+Z' },
      { label: 'Повтор', commandId: 'edit.redo', shortcut: 'Ctrl+Y' },
    ],
  },
  {
    label: 'ВИД',
    items: [
      { label: 'Навигатор', commandId: 'view.navigator' },
      { label: 'Журнал', commandId: 'view.journal' },
      { separator: true, label: '' },
      { label: 'Тема', commandId: 'view.theme' },
      { label: 'Сброс раскладки', commandId: 'view.resetLayout' },
      { separator: true, label: '' },
      { label: 'Обновить', commandId: 'view.refresh', shortcut: 'F5' },
    ],
  },
  {
    label: 'ОТЧЁТЫ RDL',
    items: [
      { label: 'Сформировать отчёт...', commandId: 'reports.rdl' },
    ],
  },
  {
    label: 'ОТЧЁТЫ DOCX',
    items: [
      { label: 'Пояснительная записка', commandId: 'report.open.docx' },
      { separator: true, label: '' },
      { label: 'Сформировать отчёт...', commandId: 'reports.docx' },
    ],
  },
  {
    label: 'ОКНО',
    items: [
      { label: 'Каскад', commandId: 'window.cascade' },
      { label: 'Закрыть все', commandId: 'window.closeAll' },
    ],
  },
  {
    label: 'СПРАВКА',
    items: [
      { label: 'Справка', commandId: 'help.manual' },
      { label: 'Быстрое начало', commandId: 'help.quickstart' },
      { separator: true, label: '' },
      { label: 'О программе', commandId: 'help.about' },
    ],
  },
];

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleItemClick = (item: MenuItem) => {
    if (item.commandId) {
      CommandRegistry.execute(item.commandId);
    }
    setOpenMenu(null);
  };

  return (
    <div ref={menuRef} className="bg-[#f0f0f0] border-b border-[#c0c0c0] select-none" style={{ height: '28px' }}>
      <div className="flex h-full">
        {menuStructure.map((menu, idx) => (
          <div key={menu.label} className="relative">
            <button
              className={`px-4 h-full text-sm hover:bg-[#d0d0ff] ${openMenu === idx ? 'bg-[#d0d0ff]' : ''}`}
              onMouseEnter={() => { if (openMenu !== null) setOpenMenu(idx); }}
              onClick={() => setOpenMenu(openMenu === idx ? null : idx)}
            >
              {menu.label}
            </button>
            {openMenu === idx && (
              <div className="absolute top-full left-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[240px]">
                {menu.items.map((item, i) =>
                  item.separator ? (
                    <div key={i} className="border-t border-[#e0e0e0] my-1" />
                  ) : (
                    <button
                      key={i}
                      className="w-full text-left px-4 py-1.5 text-sm hover:bg-[#d0d0ff] flex justify-between items-center"
                      onClick={() => handleItemClick(item)}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className="text-[#808080] ml-8 text-xs">{item.shortcut}</span>}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
