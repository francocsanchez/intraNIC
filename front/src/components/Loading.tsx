import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">

        <LoaderCircle
          size={36}
          strokeWidth={1.5}
          className="animate-spin text-gray-900"
        />

        <p className="text-sm font-medium text-gray-600 tracking-wide">
          Cargando...
        </p>

      </div>
    </div>
  );
}