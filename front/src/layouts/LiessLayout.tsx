import { Outlet } from "react-router-dom";
import AppFooter from "@/components/AppFooter";
import NavBarLiess from "./NavBarLiess";

export default function LiessLayout() {
  return <div className="flex min-h-screen flex-col overflow-x-hidden bg-muted font-preset"><NavBarLiess /><main className="flex-1 overflow-x-hidden"><Outlet /></main><AppFooter /></div>;
}
