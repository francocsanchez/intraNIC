import Loading from "@/components/Loading";
import AppFooter from "@/components/AppFooter";
import GlobalNavbar from "@/components/GlobalNavbar";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

type BaseAppLayoutProps = {
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  mainClassName?: string;
  footerHeightClassName?: string;
};

export default function BaseAppLayout({
  centerContent,
  rightContent,
  mainClassName = "px-2 py-3",
  footerHeightClassName = "h-12",
}: BaseAppLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <div
      className="font-preset min-h-screen flex flex-col overflow-x-hidden bg-muted"
    >
      <GlobalNavbar
        centerContent={centerContent}
        rightContent={rightContent}
      />

      <main className="flex-1 overflow-x-hidden">
        <div className={mainClassName}>
          <Outlet />
        </div>
      </main>

      <AppFooter className={footerHeightClassName} />
    </div>
  );
}
