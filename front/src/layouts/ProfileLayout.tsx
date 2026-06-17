import { useAuth } from "@/hooks/useAuthe";
import { Navigate, Outlet } from "react-router-dom";
import Loading from "@/components/Loading";
import GlobalNavbar from "@/components/GlobalNavbar";

export default function ProfileLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const companies = user.company ?? [];
  const hasConvencional = companies.includes("convencional");
  const hasUsados = companies.includes("usados");
  const hasLiess = companies.includes("liess");

  const footerBrand = hasLiess && !hasConvencional && !hasUsados ? "IntraLiess" : "IntraNIC";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GlobalNavbar />

      <main className="flex-1">
        <div className="px-4">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between text-sm text-gray-500">
          <span>{`© ${new Date().getFullYear()} ${footerBrand}`}</span>
          <span>Franco Sanchez</span>
        </div>
      </footer>
    </div>
  );
}
