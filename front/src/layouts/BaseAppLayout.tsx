import Loading from "@/components/Loading";
import GlobalNavbar from "@/components/GlobalNavbar";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

type BaseAppLayoutProps = {
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  footerLeft: ReactNode;
  footerRight: ReactNode;
  mainClassName?: string;
  footerHeightClassName?: string;
  presetNavigation?: boolean;
};

export default function BaseAppLayout({
  centerContent,
  rightContent,
  footerLeft,
  footerRight,
  mainClassName = "px-4 py-6",
  footerHeightClassName = "h-12",
  presetNavigation = false,
}: BaseAppLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden ${presetNavigation ? "font-preset bg-muted" : "bg-gray-50"}`}>
      <GlobalNavbar centerContent={centerContent} rightContent={rightContent} preset={presetNavigation} />

      <main className="flex-1 overflow-x-hidden">
        <div className={mainClassName}>
          <Outlet />
        </div>
      </main>

      <footer className={presetNavigation ? "border-t border-border bg-card" : "bg-white border-t border-gray-200"}>
        <div className={`max-w-7xl mx-auto px-3 sm:px-4 ${footerHeightClassName} flex flex-col gap-1 py-2 text-xs ${presetNavigation ? "text-muted-foreground" : "text-gray-500"} sm:flex-row sm:items-center sm:justify-between sm:py-0 sm:text-sm`}>
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      </footer>
    </div>
  );
}
