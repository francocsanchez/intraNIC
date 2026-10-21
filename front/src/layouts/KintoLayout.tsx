import BaseAppLayout from "@/layouts/BaseAppLayout";
import { paths } from "@/routes/paths";
import { CarFront, Flame, ReceiptText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function KintoLayout() {
  const { pathname } = useLocation();

  return (
    <BaseAppLayout
      footerLeft="IntraNIC - Uso interno Nippon Car"
      footerRight="Desarrollado por Franco Sanchez"
      centerContent={<>
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
        <Link
          to={paths.kinto.matafuegos}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname === paths.kinto.matafuegos
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Flame size={16} strokeWidth={1.75} />
          Matafuegos
        </Link>
        <Link
          to={paths.kinto.multas}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname === paths.kinto.multas
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ReceiptText size={16} strokeWidth={1.75} />
          Multas
        </Link>
      </>}
    />
  );
}
