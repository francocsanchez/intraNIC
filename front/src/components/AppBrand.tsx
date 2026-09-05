import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { Link } from "react-router-dom";

type AppBrandProps = {
  className?: string;
  onClick?: () => void;
};

export default function AppBrand({ className, onClick }: AppBrandProps) {
  return (
    <Link
      to={paths.home}
      onClick={onClick}
      className={cn("flex min-w-0 shrink-0 items-center gap-3", className)}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        NIC
      </span>
      <span className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
        IntraNIC
      </span>
    </Link>
  );
}
