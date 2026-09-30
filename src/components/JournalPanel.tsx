import { useState, useEffect } from 'react';
import { Journal, JournalEntry } from '../core/journal';

interface Props {
  onClose: () => void;
}

export default function JournalPanel({ onClose }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    setEntries(Journal.getEntries());
    const unsub = Journal.subscribe(() => {
      setEntries(Journal.getEntries());
    });
    return () => { unsub(); };
  }, []);

  const typeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      case 'command': return 'text-blue-700';
      default: return 'text-gray-700';
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'command': return '▶️';
      default: return 'ℹ️';
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('ru-RU');
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-[340px] min-w-[280px] bg-white border-l border-[#c0c0c0] flex flex-col">
      <div className="bg-[#e8e8e8] border-b border-[#c0c0c0] px-3 py-1.5 flex items-center justify-between">
        <span className="text-sm font-bold">Журнал событий</span>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center hover:bg-[#ff6666] hover:text-white rounded text-xs"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-3 text-sm text-[#808080]">Журнал пуст</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="px-3 py-1 border-b border-[#f0f0f0] text-sm hover:bg-[#f8f8ff]">
              <div className="flex items-start gap-1.5">
                <span>{typeIcon(entry.type)}</span>
                <span className={typeColor(entry.type)}>{entry.message}</span>
              </div>
              <div className="text-xs text-[#999] ml-5">{formatTime(entry.timestamp)} {entry.command && `[${entry.command}]`}</div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-[#c0c0c0] px-3 py-1.5 flex justify-between items-center">
        <span className="text-xs text-[#808080]">Записей: {entries.length}</span>
        <button
          onClick={() => Journal.clear()}
          className="text-xs text-blue-600 hover:underline"
        >
          Очистить
        </button>
      </div>
    </div>
  );
}
