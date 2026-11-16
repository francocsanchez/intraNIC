type AppFooterProps = {
  className?: string;
};

export default function AppFooter({ className = "" }: AppFooterProps) {
  return (
    <footer className={`border-t border-black bg-black text-white ${className}`.trim()}>
      <div className="mx-auto flex min-h-12 max-w-7xl items-center justify-center px-3 py-2 text-center text-xs font-medium sm:text-sm">
        IntraNIC — Pensado y desarrollado exclusivamente para Nippon Car S.R.L. y Liess S.A.S.
      </div>
    </footer>
  );
}
