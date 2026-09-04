import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="flex flex-col items-center gap-4">

        <LoaderCircle
          size={36}
          strokeWidth={1.5}
          className="animate-spin text-foreground"
        />

        <p className="text-sm font-medium text-muted-foreground tracking-wide">
          Cargando...
        </p>

      </div>
    </div>
  );
}