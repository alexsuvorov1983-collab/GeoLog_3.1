# Этап 6: Лабораторные опыты (часть 2)

## Обзор

На этапе 6 реализованы 6 дополнительных компонентов лабораторных опытов для детального анализа свойств грунтов:

1. **Трёхосное сжатие (TriaxialTest)** - ГОСТ 12248
2. **Конус Бойченко (ConeTest)** - определение консистенции
3. **Набухание и усадка (SwellShrinkTest)** - деформационные характеристики
4. **Просадочность (SubsidenceTest)** - просадочные свойства
5. **Скальные показатели (RockTest)** - прочность скальных грунтов
6. **Мёрзлые показатели (FrozenTest)** - свойства мёрзлых грунтов

## Реализованные компоненты

### 1. Трёхосное сжатие (TriaxialTest.tsx)

**Назначение:** Определение деформационных и прочностных характеристик грунтов при трёхосном сжатии по ГОСТ 12248.

**Возможности:**
- Выбор схемы испытания (CU, CD, UU)
- Таблица замеров (осевое и радиальное напряжения, деформации)
- Автоматический расчёт:
  - Модуль деформации E_tri (МПа)
  - Коэффициент Пуассона ν
  - Модуль сдвига G (МПа)
  - Модуль объёмной деформации K (МПа)
  - Сопротивление недренированному сдвиг cu (кПа)
  - Угол внутреннего трения φ_tri (град)
  - Сцепление c_tri (кПа)

**Формулы:**
- E_tri = Δσ₁ / Δε₁
- ν = -Δε₃ / Δε₁
- G = E / (2(1 + ν))
- K = E / (3(1 - 2ν))
- cu = (σ₁ - σ₃) / 2
- sin(φ) = (σ₁ - σ₃) / (σ₁ + σ₃)

### 2. Конус Бойченко (ConeTest.tsx)

**Назначение:** Определение показателя консистенции глинистых грунтов.

**Возможности:**
- Выбор типа конуса (стандартный, модифицированный)
- Таблица замеров (глубина погружения, время)
- Редактируемая таблица перехода "глубина → показатель консистенции"
- Автоматический расчёт:
  - Показатель консистенции (интерполяция)
  - Описание консистенции (твёрдая, полутвёрдая, мягкопластичная, текучепластичная, текучая)

**Классификация по показателю консистенции:**
- < 0.25: Твёрдая
- 0.25 - 0.5: Полутвёрдая
- 0.5 - 0.75: Мягкопластичная
- 0.75 - 1.0: Текучепластичная
- > 1.0: Текучая

### 3. Набухание и усадка (SwellShrinkTest.tsx)

**Назначение:** Определение деформационных характеристик при набухании и усадке.

**Возможности:**
- Ввод начальной и конечной влажности
- Начальная высота образца
- Две таблицы замеров (набухание и усадка)
- Автоматический расчёт:
  - Относительное набухание Psw (%)
  - Влажность набухания (%)
  - Относительная усадка (%)
  - Давление набухания (кПа)

**Формулы:**
- Psw = (Δh_наб / h₀) × 100%
- Усадка = (|Δh_усад| / h₀) × 100%

### 4. Просадочность (SubsidenceTest.tsx)

**Назначение:** Определение просадочных свойств грунтов при замачивании.

**Возможности:**
- Ввод начальной высоты и влажности
- Таблица замеров при различных давлениях (0.05 - 0.6 МПа)
- Флаг замоченного состояния для каждого замера
- Автоматический расчёт:
  - Относительная просадочность при каждом давлении
  - Начальное просадочное давление (МПа)
  - Бытовое давление (МПа)
  - Модуль деформации при замачивании E_sat (МПа)

**Формулы:**
- Относительная просадочность = (Δh / h₀) × 100%
- E_sat = (ΔP × h₀) / Δh

### 5. Скальные показатели (RockTest.tsx)

**Назначение:** Определение прочностных и деформационных характеристик скальных грунтов.

**Возможности:**
- Таблицы замеров для Rc вс и Rc водон (сила, площадь)
- Таблица замеров для RQD (длина керна, длина целостных фрагментов)
- Ввод дополнительных параметров:
  - Прочность на растяжение (МПа)
  - Угол естественного откоса (град)
  - Плотность обломков (г/см³)
- Автоматический расчёт:
  - Rc вс - предел прочности на сжатие всухую (МПа)
  - Rc водон - предел прочности на сжатие водонасыщенный (МПа)
  - RQD - индекс качества керна (%)
  - Ksof - коэффициент размягчаемости

**Формулы:**
- Rc = (F × 1000) / A / 1000 (МПа)
- RQD = (ΣL_цел / ΣL_керн) × 100%
- Ksof = Rc водон / Rc вс

### 6. Мёрзлые показатели (FrozenTest.tsx)

**Назначение:** Определение характеристик мёрзлых грунтов.

**Возможности:**
- Ввод температуры начала замерзания Tbf (°C)
- Ввод льдистости (общая, включений, льда-цемента)
- Ввод содержания незамерзшей воды
- Таблица теплофизических характеристик:
  - Теплопроводность мёрзлого/талого (Вт/(м·°C))
  - Температуропроводность мёрзлого/талого (м²/сут)
  - Теплоемкость мёрзлого/талого (кДж/(м³·°C))
- Ввод сопротивления срезу по бетону и стали (кПа)
- Автоматический расчёт:
  - Степень заполнения пор льдом Sr'
  - Относительная осадка мёрзлого грунта
  - Сжимаемость при оттаивании
  - Коэффициент оттаивания
  - Модуль деформации Ef при 0.2 МПа (МПа)

**Формулы:**
- Sr' = (itot + ii + ice_cement) / (itot + ii + ice_cement + unfrozen_water)
- Относительная осадка = itot × 0.05
- Сжимаемость при оттаивании = itot × 0.1
- Коэффициент оттаивания = thermal_conductivity_frozen / 100
- Ef_02 = thermal_conductivity_frozen × 10

## Расширение структуры данных

В `src/core/dataStore.ts` добавлены новые интерфейсы:

```typescript
// Трёхосное сжатие
interface TriaxialMeasurement {
  axial_stress_mpa: number;
  radial_stress_mpa: number;
  axial_strain?: number;
  radial_strain?: number;
}

interface TriaxialTestData {
  test_scheme: 'CU' | 'CD' | 'UU';
  measurements: TriaxialMeasurement[];
  initial_void_ratio?: number;
}

interface TriaxialTestResults {
  E_tri?: number;
  nu?: number;
  G?: number;
  K?: number;
  cu?: number;
  phi_tri?: number;
  c_tri?: number;
}

// Конус Бойченко
interface ConeMeasurement {
  depth_mm: number;
  time_min?: number;
}

interface ConeTestData {
  cone_type: 'standard' | 'modified';
  measurements: ConeMeasurement[];
  transition_table?: Array<{ depth_mm: number; consistency_index: number }>;
}

interface ConeTestResults {
  consistency_index?: number;
  consistency_description?: string;
}

// Набухание и усадка
interface SwellShrinkMeasurement {
  pressure_kpa: number;
  deformation_mm: number;
  time_hours?: number;
}

interface SwellShrinkTestData {
  initial_moisture?: number;
  final_moisture?: number;
  initial_height_mm?: number;
  swell_measurements: SwellShrinkMeasurement[];
  shrink_measurements: SwellShrinkMeasurement[];
}

interface SwellShrinkTestResults {
  Psw?: number;
  moisture_swell?: number;
  shrinkage?: number;
  swell_pressure?: number;
}

// Просадочность
interface SubsidenceMeasurement {
  pressure_mpa: number;
  deformation_mm: number;
  is_saturated: boolean;
}

interface SubsidenceTestData {
  initial_height_mm: number;
  initial_moisture?: number;
  measurements: SubsidenceMeasurement[];
}

interface SubsidenceTestResults {
  relative_subsidence?: Record<number, number>;
  initial_subsidence_pressure?: number;
  household_pressure?: number;
  E_sat?: number;
}

// Скальные показатели
interface RockTestData {
  Rc_dry_measurements?: Array<{ sample_id: string; force_kN: number; area_cm2: number }>;
  Rc_sat_measurements?: Array<{ sample_id: string; force_kN: number; area_cm2: number }>;
  RQD_measurements?: Array<{ core_length_m: number; intact_length_m: number }>;
  tensile_strength?: number;
  natural_slope_angle?: number;
  core_density?: number;
}

interface RockTestResults {
  Rc_dry?: number;
  Rc_sat?: number;
  RQD?: number;
  Ksof?: number;
  Kwr?: number;
  mass_loss?: number;
  Young_modulus?: number;
  Poisson_ratio?: number;
}

// Мёрзлые показатели
interface FrozenTestData {
  Tbf?: number;
  itot?: number;
  ii?: number;
  ice_cement?: number;
  unfrozen_water?: number;
  thermal_measurements?: {
    thermal_conductivity_frozen?: number;
    thermal_conductivity_thawed?: number;
    thermal_diffusivity_frozen?: number;
    thermal_diffusivity_thawed?: number;
    heat_capacity_frozen?: number;
    heat_capacity_thawed?: number;
  };
  shear_strength_concrete?: number;
  shear_strength_steel?: number;
}

interface FrozenTestResults {
  Sr_prime?: number;
  relative_settlement?: number;
  compressibility_thaw?: number;
  thaw_coefficient?: number;
  Ef_02?: number;
}
```

## Интеграция с таблицами проб

### Обновление AllSamplesTable.tsx

Добавлены:
- Импорт новых компонентов
- 6 новых кнопок для открытия модальных окон:
  - **Т** (индиго) - Трёхосное сжатие
  - **Б** (розовый) - Конус Бойченко
  - **Н** (бирюзовый) - Набухание и усадка
  - **П** (голубой) - Просадочность
  - **Км** (янтарный) - Скальные показатели
  - **М** (небесный) - Мёрзлые показатели
- Обработчики для новых типов опытов в switch statement

### Обновление SoilSamplesTable.tsx

Добавлены:
- Импорт новых компонентов
- State для openTestModal
- Обработчики handleCreateTest, handleUpdateTest, getTestForSample
- Колонка с 10 кнопками опытов (4 существующих + 6 новых)
- Рендеринг модальных окон для всех типов опытов

## Цветовая схема кнопок

| Тип опыта | Цвет | Обозначение |
|-----------|------|-------------|
| Компрессионные испытания | Синий (blue-500) | К |
| Одноплоскостной срез | Зелёный (green-500) | С |
| Гранулометрический состав | Фиолетовый (purple-500) | Г |
| Влажность и плотность | Оранжевый (orange-500) | В |
| Трёхосное сжатие | Индиго (indigo-500) | Т |
| Конус Бойченко | Розовый (pink-500) | Б |
| Набухание и усадка | Бирюзовый (teal-500) | Н |
| Просадочность | Голубой (cyan-500) | П |
| Скальные показатели | Янтарный (amber-500) | Км |
| Мёрзлые показатели | Небесный (sky-500) | М |

## Результаты

✅ Созданы 6 новых компонентов лабораторных опытов  
✅ Расширена структура данных SoilTest  
✅ Интегрированы кнопки опытов в обе таблицы проб  
✅ Реализованы модальные окна для всех типов опытов  
✅ Автоматический расчёт результатов для всех типов опытов  
✅ Журналирование всех операций  
✅ Проект успешно собирается без ошибок

## Следующие этапы

Согласно плану реализации, следующий этап:
- **Этап 7**: Статистика по ИГЭ и система проверок

---

**Статус**: ✅ Завершено  
**Дата**: 2026-01-29  
**Время выполнения**: ~50 минут
