import { FileDown } from "lucide-react";

type MinutaPdfButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export default function MinutaPdfButton({
  disabled = false,
  loading = false,
  onClick,
}: MinutaPdfButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileDown size={14} />
      {loading ? "Generando..." : "PDF"}
    </button>
  );
}
