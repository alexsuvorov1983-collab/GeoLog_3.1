// Компонент штампа для превью листа
// Этап 7: Пояснительная записка - экранные рамки и штампы

import { StampSettings } from '../utils/reportStructure';

interface Props {
  type: 'big' | 'small';
  stampSettings: StampSettings;
  pageNumber: number;
  totalPages: number;
}

export default function SheetStamp({ type, stampSettings, pageNumber, totalPages }: Props) {
  if (type === 'small') {
    // Малый штамп: 185×15 мм
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '5mm',
          right: '5mm',
          width: '185mm',
          height: '15mm',
          border: '0.3mm solid #000',
          display: 'flex',
          fontSize: '8pt',
          fontFamily: 'Times New Roman, serif',
          backgroundColor: 'white'
        }}
      >
        {/* Левая часть: пустые графы */}
        <div
          style={{
            flex: '0 0 40%',
            borderRight: '0.3mm solid #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 2mm'
          }}
        >
          <span>Изм.</span>
          <span>Лист</span>
          <span>№докум.</span>
          <span>Подп.</span>
          <span>Дата</span>
        </div>
        
        {/* Правая часть: шифр и номера */}
        <div
          style={{
            flex: '0 0 60%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2mm'
          }}
        >
          <span style={{ fontSize: '7pt' }}>{stampSettings.code}</span>
          <span>Лист {pageNumber}</span>
          <span>Листов {totalPages}</span>
        </div>
      </div>
    );
  }

  // Большой штамп: 185×55 мм
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '5mm',
        right: '5mm',
        width: '185mm',
        height: '55mm',
        border: '0.3mm solid #000',
        fontSize: '8pt',
        fontFamily: 'Times New Roman, serif',
        backgroundColor: 'white',
        padding: '2mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Организация */}
      <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
        {stampSettings.organization}
      </div>
      
      {/* Название документа */}
      <div style={{ textAlign: 'center' }}>
        {stampSettings.documentName}
      </div>
      
      {/* Шифр */}
      <div style={{ textAlign: 'center', fontSize: '7pt' }}>
        {stampSettings.code}
      </div>
      
      {/* Роли и даты */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm', fontSize: '7pt' }}>
        <div>Разработал: {stampSettings.developer}</div>
        <div>Дата: {stampSettings.developerDate}</div>
        <div>Проверил: {stampSettings.checker}</div>
        <div>Дата: {stampSettings.checkerDate}</div>
        <div>Н.контр.: {stampSettings.normControl}</div>
        <div>Дата: {stampSettings.normControlDate}</div>
        <div>Утвердил: {stampSettings.approver}</div>
        <div>Дата: {stampSettings.approverDate}</div>
      </div>
      
      {/* Стадия и листы */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7pt' }}>
        <span>{stampSettings.stage}</span>
        <span>Лист 1</span>
        <span>Листов {totalPages}</span>
      </div>
    </div>
  );
}
// Конец файла
