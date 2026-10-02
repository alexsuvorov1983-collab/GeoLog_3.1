import { ColumnConfig, serviceColumns, getColumnsByComposition } from './SampleTableColumns';

interface SampleTableHeaderProps {
  compositionType: string;
}

export default function SampleTableHeader({ compositionType }: SampleTableHeaderProps) {
  const compositionColumns = getColumnsByComposition(compositionType);
  const allColumns = [...serviceColumns, ...compositionColumns];
  
  // Группировка колонок по уровню 2 для создания заголовков групп
  const level2Groups = new Map<string, ColumnConfig[]>();
  compositionColumns.forEach(col => {
    if (col.level2) {
      if (!level2Groups.has(col.level2)) {
        level2Groups.set(col.level2, []);
      }
      level2Groups.get(col.level2)!.push(col);
    }
  });
  
  // Группировка колонок по уровню 3 для создания подзаголовков
  const level3Groups = new Map<string, ColumnConfig[]>();
  compositionColumns.forEach(col => {
    if (col.level3) {
      const key = `${col.level2 || ''}_${col.level3}`;
      if (!level3Groups.has(key)) {
        level3Groups.set(key, []);
      }
      level3Groups.get(key)!.push(col);
    }
  });
  
  const fixedCellClass = "px-2 py-1 text-xs border-r border-b border-[#c0c0c0] bg-[#e8e8e8] font-semibold text-center sticky top-0 z-20";
  const headerCellClass = "px-2 py-1 text-xs border-r border-b border-[#c0c0c0] bg-[#e8e8e8] font-semibold text-center sticky top-0 z-10";
  
  return (
    <thead>
      {/* Уровень 1: Служебные колонки (закреплённые слева) */}
      <tr>
        {serviceColumns.map(col => (
          <th
            key={col.key}
            className={fixedCellClass}
            style={{ 
              left: col.fixed ? `${serviceColumns.slice(0, serviceColumns.indexOf(col)).reduce((sum, c) => sum + (c.width || 80), 0)}px` : undefined,
              width: `${col.width || 80}px`,
              minWidth: `${col.width || 80}px`
            }}
            rowSpan={4} // Занимает все 4 уровня
          >
            <div className="flex flex-col items-center gap-1">
              <span>{col.label}</span>
              {col.unit && <span className="text-[10px] text-gray-500">{col.unit}</span>}
            </div>
          </th>
        ))}
        
        {/* Уровень 2: Группы параметров */}
        {Array.from(level2Groups.entries()).map(([groupName, cols]) => {
          // Проверяем, есть ли у этой группы подгруппы уровня 3
          const hasLevel3 = cols.some(col => col.level3);
          
          if (hasLevel3) {
            // Если есть подгруппы, создаём заголовок группы с rowSpan=1
            return (
              <th
                key={groupName}
                className={headerCellClass}
                colSpan={cols.length}
              >
                {groupName}
              </th>
            );
          } else {
            // Если нет подгрупп, создаём заголовок с rowSpan=2
            return (
              <th
                key={groupName}
                className={headerCellClass}
                colSpan={cols.length}
                rowSpan={2}
              >
                {groupName}
              </th>
            );
          }
        })}
      </tr>
      
      {/* Уровень 3: Расшифровка групп (подзаголовки) */}
      <tr>
        {Array.from(level3Groups.entries()).map(([key, cols]) => {
          const level3Name = cols[0].level3;
          return (
            <th
              key={key}
              className={headerCellClass}
              colSpan={cols.length}
            >
              {level3Name}
            </th>
          );
        })}
      </tr>
      
      {/* Уровень 4: Индивидуальные колонки с единицами измерения */}
      <tr>
        {compositionColumns.map(col => (
          <th
            key={col.key}
            className={headerCellClass}
            style={{ width: `${col.width || 80}px`, minWidth: `${col.width || 80}px` }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span>{col.label}</span>
              {col.unit && <span className="text-[10px] text-gray-500">{col.unit}</span>}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
