const MONTHS = [
  { value: 1, label: "ENE" },
  { value: 2, label: "FEB" },
  { value: 3, label: "MAR" },
  { value: 4, label: "ABR" },
  { value: 5, label: "MAY" },
  { value: 6, label: "JUN" },
  { value: 7, label: "JUL" },
  { value: 8, label: "AGO" },
  { value: 9, label: "SEP" },
  { value: 10, label: "OCT" },
  { value: 11, label: "NOV" },
  { value: 12, label: "DIC" },
];

type FilterOption = {
  label: string;
  value: string;
};

type OperacionesFiltersProps = {
  anios: number[];
  selectedAnios: number[];
  selectedMeses: number[];
  sucursales: FilterOption[];
  modelos: FilterOption[];
  dias: number[];
  selectedSucursales: string[];
  selectedModelos: string[];
  selectedDias: number[];
  onAniosChange: (anios: number[]) => void;
  onMesesChange: (meses: number[]) => void;
  onSucursalesChange: (values: string[]) => void;
  onModelosChange: (values: string[]) => void;
  onDiasChange: (values: number[]) => void;
};

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-2 py-0.5 text-[11px] leading-5 transition ${
        active
          ? "border-[#15aa9a] bg-[#15aa9a] text-white"
          : "border-[#d6e7ed] bg-white text-gray-700 hover:border-[#15aa9a] hover:text-[#128c80]"
      }`}
    >
      {label}
    </button>
  );
}

function CompactCheckboxGroup({
  title,
  options,
  selectedValues,
  onChange,
}: {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) {
  const toggleValue = (nextValue: string) => {
    onChange(
      selectedValues.includes(nextValue)
        ? selectedValues.filter((value) => value !== nextValue)
        : [...selectedValues, nextValue],
    );
  };

  return (
    <div className="rounded-lg border border-[#d8e9ef] bg-white px-2 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{title}</span>
        <span className="text-[11px] text-[#128c80]">{selectedValues.length ? selectedValues.length : "Todos"}</span>
      </div>

      <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 px-1 py-0.5 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => toggleValue(option.value)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
            />
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function OperacionesFilters({
  anios,
  selectedAnios,
  selectedMeses,
  sucursales,
  modelos,
  dias,
  selectedSucursales,
  selectedModelos,
  selectedDias,
  onAniosChange,
  onMesesChange,
  onSucursalesChange,
  onModelosChange,
  onDiasChange,
}: OperacionesFiltersProps) {
  const toggleAnio = (nextAnio: number) => {
    onAniosChange(
      selectedAnios.includes(nextAnio)
        ? selectedAnios.filter((value) => value !== nextAnio)
        : [...selectedAnios, nextAnio].sort((a, b) => a - b),
    );
  };

  const toggleMes = (nextMes: number) => {
    onMesesChange(
      selectedMeses.includes(nextMes)
        ? selectedMeses.filter((value) => value !== nextMes)
        : [...selectedMeses, nextMes].sort((a, b) => a - b),
    );
  };

  const toggleDay = (nextDay: number) => {
    onDiasChange(
      selectedDias.includes(nextDay)
        ? selectedDias.filter((value) => value !== nextDay)
        : [...selectedDias, nextDay].sort((a, b) => a - b),
    );
  };

  return (
    <section className="rounded-xl border border-[#cfe7ee] bg-[#eef8fb] p-2.5 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-1">
            {anios.map((anio) => (
              <ToggleButton
                key={anio}
                active={selectedAnios.includes(anio)}
                label={String(anio)}
                onClick={() => toggleAnio(anio)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-1">
              {MONTHS.map((item) => (
                <ToggleButton
                  key={item.value}
                  active={selectedMeses.includes(item.value)}
                  label={item.label}
                  onClick={() => toggleMes(item.value)}
                />
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-1">
              {dias.map((dia) => (
                <ToggleButton
                  key={dia}
                  active={selectedDias.includes(dia)}
                  label={String(dia).padStart(2, "0")}
                  onClick={() => toggleDay(dia)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <CompactCheckboxGroup
            title="Sucursales"
            options={sucursales}
            selectedValues={selectedSucursales}
            onChange={onSucursalesChange}
          />

          <CompactCheckboxGroup
            title="Modelos"
            options={modelos}
            selectedValues={selectedModelos}
            onChange={onModelosChange}
          />
        </div>
      </div>
    </section>
  );
}
