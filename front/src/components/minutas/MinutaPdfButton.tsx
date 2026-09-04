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
      className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileDown size={14} />
      {loading ? "Generando..." : "PDF"}
    </button>
  );
}
