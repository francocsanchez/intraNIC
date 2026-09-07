import { getColoresUnidadesBadges } from "@/api/coloresUnidadesAPI";
import { getContrastForeground, normalizeColorName, setTablaColores } from "@/helpers/colores";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

function classNameForColor(name: string) {
  let hash = 5381;
  for (const character of name) hash = (hash * 33) ^ character.charCodeAt(0);
  return `vehicle-color-${(hash >>> 0).toString(36)}`;
}

export default function VehicleColorBadgeProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem("AUTH_TOKEN")));

  useEffect(() => {
    const syncToken = () => setHasToken(Boolean(localStorage.getItem("AUTH_TOKEN")));
    window.addEventListener("auth-token-changed", syncToken);
    window.addEventListener("storage", syncToken);
    return () => {
      window.removeEventListener("auth-token-changed", syncToken);
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  const { data } = useQuery({
    queryKey: ["colores-unidades", "badges"],
    queryFn: getColoresUnidadesBadges,
    staleTime: 5 * 60 * 1000,
    enabled: hasToken,
  });

  const entries = (data?.data ?? [])
    .filter((color) => color.hex)
    .map((color) => ({ name: normalizeColorName(color.nombre), hex: color.hex! }));

  setTablaColores(Object.fromEntries(entries.map(({ name }) => [name, classNameForColor(name)])));

  const rules = entries
    .map(({ name, hex }) => `.${classNameForColor(name)}{background-color:${hex};color:${getContrastForeground(hex)};border-color:${hex};}`)
    .join("\n");

  return <>{rules ? <style>{rules}</style> : null}{children}</>;
}
