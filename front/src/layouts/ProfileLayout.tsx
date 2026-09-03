import { useAuth } from "@/hooks/useAuthe";
import BaseAppLayout from "@/layouts/BaseAppLayout";

export default function ProfileLayout() {
  const { user } = useAuth();

  const companies = user?.company ?? [];
  const hasConvencional = companies.includes("convencional");
  const hasUsados = companies.includes("usados");
  const hasLiess = companies.includes("liess");

  const footerBrand = hasLiess && !hasConvencional && !hasUsados ? "IntraLiess" : "IntraNIC";

  return (
    <BaseAppLayout
      footerLeft={`${footerBrand} - Uso interno Nippon Car`}
      footerRight="Desarrollado por Franco Sanchez"
      mainClassName="px-2 py-3"
      footerHeightClassName="h-12"
      presetNavigation
    />
  );
}
