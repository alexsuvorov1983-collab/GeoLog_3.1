import { useState, useRef, useEffect } from 'react';

export type ThemeMode = 'light' | 'medium' | 'dark';

interface Props {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

const themeOptions: { id: ThemeMode; label: string; icon: string }[] = [
  { id: 'light', label: 'Светлая', icon: '☀️' },
  { id: 'medium', label: 'Средняя', icon: '🌤️' },
  { id: 'dark', label: 'Тёмная', icon: '🌙' },
];

export default function ThemeSwitcher({ theme, onThemeChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentTheme = themeOptions.find((t) => t.id === theme)!;

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff] flex items-center gap-1.5"
        title="Тема оформления"
      >
        <span>{currentTheme.icon}</span>
        <span>{currentTheme.label}</span>
        <span className="text-xs ml-1">▾</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[160px]">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              className={`w-full text-left px-4 py-1.5 text-sm hover:bg-[#d0d0ff] flex items-center gap-2 ${
                theme === option.id ? 'bg-[#e0e0ff] font-semibold' : ''
              }`}
              onClick={() => {
                onThemeChange(option.id);
                setOpen(false);
              }}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              {theme === option.id && <span className="ml-auto text-blue-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
