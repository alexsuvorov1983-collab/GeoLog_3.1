// Диалог редактирования реквизитов штампа
// Этап 7: Пояснительная записка - ГОСТ рамки и штампы

import { useState } from 'react';
import { StampSettings } from '../utils/reportStructure';

interface Props {
  currentSettings: StampSettings;
  onSave: (settings: StampSettings) => void;
  onClose: () => void;
}

export default function StampSettingsDialog({ currentSettings, onSave, onClose }: Props) {
  const [settings, setSettings] = useState<StampSettings>(currentSettings);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const updateField = (field: keyof StampSettings, value: string | number) => {
    setSettings({ ...settings, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg shadow-2xl w-[600px] max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="px-4 py-3 border-b border-[#c0c0c0] bg-[#e8e8e8] flex items-center justify-between">
          <h3 className="text-sm font-bold">📋 Реквизиты штампа</h3>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm hover:bg-[#ff6666] hover:text-white rounded"
          >
            ✕
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Организация */}
          <div>
            <label className="block text-sm font-semibold mb-1">Организация:</label>
            <input
              type="text"
              value={settings.organization}
              onChange={(e) => updateField('organization', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-[#c0c0c0] rounded"
            />
          </div>

          {/* Название документа */}
          <div>
            <label className="block text-sm font-semibold mb-1">Название документа:</label>
            <input
              type="text"
              value={settings.documentName}
              onChange={(e) => updateField('documentName', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-[#c0c0c0] rounded"
            />
          </div>

          {/* Шифр */}
          <div>
            <label className="block text-sm font-semibold mb-1">Шифр:</label>
            <input
              type="text"
              value={settings.code}
              onChange={(e) => updateField('code', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-[#c0c0c0] rounded"
            />
          </div>

          {/* Стадия */}
          <div>
            <label className="block text-sm font-semibold mb-1">Стадия:</label>
            <input
              type="text"
              value={settings.stage}
              onChange={(e) => updateField('stage', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-[#c0c0c0] rounded"
            />
          </div>

          {/* Разделитель */}
          <div className="border-t border-[#c0c0c0] pt-4">
            <div className="text-sm font-semibold mb-3">Ответственные лица:</div>
          </div>

          {/* Разработал */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Разработал:</label>
              <input
                type="text"
                value={settings.developer}
                onChange={(e) => updateField('developer', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
                placeholder="Фамилия И.О."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Дата:</label>
              <input
                type="text"
                value={settings.developerDate}
                onChange={(e) => updateField('developerDate', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
                placeholder="ДД.ММ.ГГГГ"
              />
            </div>
          </div>

          {/* Проверил */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Проверил:</label>
              <input
                type="text"
                value={settings.checker}
                onChange={(e) => updateField('checker', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
                placeholder="Фамилия И.О."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Дата:</label>
              <input
                type="text"
                value={settings.checkerDate}
                onChange={(e) => updateField('checkerDate', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
                placeholder="ДД.ММ.ГГГГ"
              />
            </div>
          </div>

          {/* Н.контр. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Н.контр.:</label>
              <input
                type="text"
                value={settings.normControl}
                onChange={(e) => updateField('normControl', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
                placeholder="Фамилия И.О."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Дата:</label>
              <input
                type="text"
                value={settings.normControlDate}
                onChange={(e) => updateField('normControlDate', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
                placeholder="ДД.ММ.ГГГГ"
              />
            </div>
          </div>

          {/* Утвердил */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Утвердил:</label>
              <input
                type="text"
                value={settings.approver}
                onChange={(e) => updateField('approver', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
                placeholder="Фамилия И.О."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Дата:</label>
              <input
                type="text"
                value={settings.approverDate}
                onChange={(e) => updateField('approverDate', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
                placeholder="ДД.ММ.ГГГГ"
              />
            </div>
          </div>

          {/* Разделитель */}
          <div className="border-t border-[#c0c0c0] pt-4">
            <div className="text-sm font-semibold mb-3">Дополнительно:</div>
          </div>

          {/* Количество листов */}
          <div>
            <label className="block text-sm font-semibold mb-1">Всего листов:</label>
            <input
              type="number"
              value={settings.totalSheets}
              onChange={(e) => updateField('totalSheets', parseInt(e.target.value) || 0)}
              className="w-32 px-2 py-1 text-sm border border-[#c0c0c0] rounded"
              min="0"
            />
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
