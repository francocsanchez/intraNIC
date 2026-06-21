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
      footerLeft={`Copyright ${new Date().getFullYear()} ${footerBrand}`}
      footerRight="Franco Sanchez"
      mainClassName="px-4"
      footerHeightClassName="h-14"
    />
  );
}
