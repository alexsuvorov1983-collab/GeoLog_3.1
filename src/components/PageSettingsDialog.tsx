// Диалог настроек листа для раздела
// Этап 7: Пояснительная записка - ГОСТ рамки и штампы

import { useState } from 'react';
import { PageSettings } from '../utils/reportStructure';

interface Props {
  sectionId: string;
  sectionTitle: string;
  currentSettings: PageSettings;
  onSave: (sectionId: string, settings: PageSettings) => void;
  onClose: () => void;
}

export default function PageSettingsDialog({ sectionId, sectionTitle, currentSettings, onSave, onClose }: Props) {
  const [settings, setSettings] = useState<PageSettings>(currentSettings);

  const handleSave = () => {
    onSave(sectionId, settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg shadow-2xl w-[400px]">
        {/* Заголовок */}
        <div className="px-4 py-3 border-b border-[#c0c0c0] bg-[#e8e8e8] flex items-center justify-between">
          <h3 className="text-sm font-bold">📄 Настройки листа</h3>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm hover:bg-[#ff6666] hover:text-white rounded"
          >
            ✕
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-4 space-y-4">
          <div className="text-xs text-[#808080]">
            Раздел: <strong>{sectionTitle}</strong>
          </div>

          {/* Формат */}
          <div>
            <label className="block text-sm font-semibold mb-2">Формат листа:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings({ ...settings, format: 'A4' })}
                className={`flex-1 px-3 py-2 text-sm border rounded ${
                  settings.format === 'A4'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white border-[#c0c0c0] hover:bg-[#e8e8ff]'
                }`}
              >
                A4 (210×297)
              </button>
              <button
                onClick={() => setSettings({ ...settings, format: 'A3' })}
                className={`flex-1 px-3 py-2 text-sm border rounded ${
                  settings.format === 'A3'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white border-[#c0c0c0] hover:bg-[#e8e8ff]'
                }`}
              >
                A3 (297×420)
              </button>
            </div>
          </div>

          {/* Ориентация */}
          <div>
            <label className="block text-sm font-semibold mb-2">Ориентация:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings({ ...settings, orientation: 'portrait' })}
                className={`flex-1 px-3 py-2 text-sm border rounded ${
                  settings.orientation === 'portrait'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white border-[#c0c0c0] hover:bg-[#e8e8ff]'
                }`}
              >
                📄 Вертикальная
              </button>
              <button
                onClick={() => setSettings({ ...settings, orientation: 'landscape' })}
                className={`flex-1 px-3 py-2 text-sm border rounded ${
                  settings.orientation === 'landscape'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white border-[#c0c0c0] hover:bg-[#e8e8ff]'
                }`}
              >
                📃 Горизонтальная
              </button>
            </div>
          </div>

          {/* Штамп */}
          <div>
            <label className="block text-sm font-semibold mb-2">Тип штампа:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings({ ...settings, stamp: 'big' })}
                className={`flex-1 px-3 py-2 text-sm border rounded ${
                  settings.stamp === 'big'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white border-[#c0c0c0] hover:bg-[#e8e8ff]'
                }`}
              >
                Большой
              </button>
              <button
                onClick={() => setSettings({ ...settings, stamp: 'small' })}
                className={`flex-1 px-3 py-2 text-sm border rounded ${
                  settings.stamp === 'small'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white border-[#c0c0c0] hover:bg-[#e8e8ff]'
                }`}
              >
                Малый
              </button>
              <button
                onClick={() => setSettings({ ...settings, stamp: 'none' })}
                className={`flex-1 px-3 py-2 text-sm border rounded ${
                  settings.stamp === 'none'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white border-[#c0c0c0] hover:bg-[#e8e8ff]'
                }`}
              >
                Без штампа
              </button>
            </div>
          </div>

          {/* Предпросмотр */}
          <div className="bg-[#f9f9f9] border border-[#c0c0c0] rounded p-3">
            <div className="text-xs font-semibold mb-2">Текущие настройки:</div>
            <div className="text-xs text-[#555]">
              <div>Формат: <strong>{settings.format}</strong></div>
              <div>Ориентация: <strong>{settings.orientation === 'portrait' ? 'Вертикальная' : 'Горизонтальная'}</strong></div>
              <div>Штамп: <strong>{settings.stamp === 'big' ? 'Большой (форма 1)' : settings.stamp === 'small' ? 'Малый (форма 2)' : 'Без штампа'}</strong></div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="px-4 py-3 border-t border-[#c0c0c0] bg-[#f5f5f5] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-[#4472c4] text-white rounded hover:bg-[#3060b0]"
          >
            ✓ Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
// Конец файла
