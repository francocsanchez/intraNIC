import BaseAppLayout from "@/layouts/BaseAppLayout";
import { paths } from "@/routes/paths";
import { CarFront } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function KintoLayout() {
  const { pathname } = useLocation();

  return (
    <BaseAppLayout
      footerLeft="IntraNIC - Uso interno Nippon Car"
      footerRight="Desarrollado por Franco Sanchez"
      centerContent={
        <Link
          to={paths.kinto.flota}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname === paths.kinto.flota
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <CarFront size={16} strokeWidth={1.75} />
          Flota
        </Link>
      }
    />
  );
}
