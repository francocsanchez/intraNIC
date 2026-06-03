import { getPatentamientosBrandParticipationEvolutionPais } from "@/services/patentamientosDashboardService";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MarcaPaisParticipacionChartProps = {
  year: number;
};

const TOYOTA_BRAND = "TOYOTA";
const LINE_COLORS = ["#dc2626", "#15aa9a", "#334155", "#ea580c", "#7c3aed", "#0284c7", "#65a30d"];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const formatPercentage = (value: number) =>
  `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

export default function MarcaPaisParticipacionChart({
  year,
}: MarcaPaisParticipacionChartProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([TOYOTA_BRAND]);

  const query = useQuery({
    queryKey: ["patentamientos-dashboard", "brand-participation-pais", year],
    queryFn: () => getPatentamientosBrandParticipationEvolutionPais(year),
    enabled: year > 0,
  });

  const availableBrands = useMemo(
    () => (query.data?.brands ?? []).map((brand) => brand.brand),
    [query.data],
  );
  const anchorBrand = useMemo(
    () => availableBrands.find((brand) => normalizeText(brand) === TOYOTA_BRAND) ?? availableBrands[0] ?? null,
    [availableBrands],
  );

  const effectiveSelectedBrands = useMemo(() => {
    if (!anchorBrand) {
      return [];
    }

    const nextSelection = selectedBrands.filter((brand) => availableBrands.includes(brand));
    const withRequired = nextSelection.includes(anchorBrand)
      ? nextSelection
      : [anchorBrand, ...nextSelection];

    return Array.from(new Set(withRequired)).sort((a, b) => {
      if (a === anchorBrand) return -1;
      if (b === anchorBrand) return 1;
      return availableBrands.indexOf(a) - availableBrands.indexOf(b);
    });
  }, [anchorBrand, availableBrands, selectedBrands]);

  const chartData = useMemo(() => {
    if (!query.data) {
      return [];
    }

    return query.data.months.map((month) => {
      const row: Record<string, number | string> = { label: month.label };

      query.data.brands.forEach((brand) => {
        row[brand.brand] = brand.values[month.key]?.percentage ?? 0;
        row[`${brand.brand}__quantity`] = brand.values[month.key]?.quantity ?? 0;
      });

      return row;
    });
  }, [query.data]);

  const visibleBrands = useMemo(
    () => {
      const selectedBrandSet = new Set(effectiveSelectedBrands);
      return (query.data?.brands ?? []).filter((brand) => selectedBrandSet.has(brand.brand));
    },
    [effectiveSelectedBrands, query.data],
  );

  const buttonLabel = useMemo(() => {
    if (!anchorBrand) {
      return "Marcas";
    }

    const extraCount = effectiveSelectedBrands.filter((brand) => brand !== anchorBrand).length;

    if (!extraCount) {
      return anchorBrand;
    }

    return `${anchorBrand} + ${extraCount} marca${extraCount > 1 ? "s" : ""}`;
  }, [anchorBrand, effectiveSelectedBrands]);

  const toggleBrand = (brand: string) => {
    if (normalizeText(brand) === TOYOTA_BRAND) {
      return;
    }

    setSelectedBrands((current) =>
      current.includes(brand)
        ? current.filter((item) => item !== brand)
        : [...current, brand],
    );
  };

  const getLineColor = (brand: string) => {
    if (normalizeText(brand) === TOYOTA_BRAND) {
      return "#dc2626";
    }

    const brandIndex = availableBrands.filter((item) => normalizeText(item) !== TOYOTA_BRAND).indexOf(brand);
    return LINE_COLORS[(brandIndex + 1) % LINE_COLORS.length] ?? "#15aa9a";
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            {query.data?.title ?? "Evolucion mensual por participacion de marca - PAIS"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {query.data?.description ?? "Comparacion porcentual mensual entre Toyota y las marcas seleccionadas sobre el total pais."}
          </p>
        </div>

        <Menu as="div" className="relative">
          <MenuButton className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50">
            Marcas
            <span className="max-w-[220px] truncate text-gray-500">{buttonLabel}</span>
            <ChevronDown size={16} className="text-gray-500" />
          </MenuButton>

          <MenuItems
            anchor="bottom end"
            className="mt-3 max-h-80 w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg focus:outline-none"
          >
            {(query.data?.brands ?? []).map((brand) => {
              const isToyota = normalizeText(brand.brand) === TOYOTA_BRAND;
              const isChecked = effectiveSelectedBrands.includes(brand.brand);

              return (
                <MenuItem key={brand.brand}>
                  <label
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 data-[focus]:bg-gray-50 ${
                      isToyota ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isToyota}
                      onChange={() => toggleBrand(brand.brand)}
                      className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a] disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    <span className="min-w-0 flex-1 truncate">{brand.brand}</span>
                  </label>
                </MenuItem>
              );
            })}
          </MenuItems>
        </Menu>
      </div>

      <div className="mt-5 h-[360px] w-full">
        {!query.data || !query.data.months.length || !query.data.brands.length ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-500">
            No hay informacion suficiente para graficar la participacion mensual por marca todavia.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#4b5563" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  borderColor: "#cfe7ee",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                }}
                formatter={(value, name, item) => {
                  const quantity = Number(item.payload?.[`${String(name)}__quantity`] ?? 0);
                  return [formatPercentage(Number(value)), `${String(name)} (${quantity.toLocaleString("es-AR")})`];
                }}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Legend />
              {visibleBrands.map((brand) => (
                <Line
                  key={brand.brand}
                  type="monotone"
                  dataKey={brand.brand}
                  name={brand.brand}
                  stroke={getLineColor(brand.brand)}
                  strokeWidth={normalizeText(brand.brand) === TOYOTA_BRAND ? 3 : 2.5}
                  dot={{ r: 4, fill: getLineColor(brand.brand), stroke: getLineColor(brand.brand) }}
                  activeDot={{ r: 6, fill: getLineColor(brand.brand), stroke: getLineColor(brand.brand) }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
