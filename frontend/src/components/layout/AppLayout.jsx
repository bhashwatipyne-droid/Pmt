import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { RoleSwitcher } from "./RoleSwitcher";

const TITLES = {
  "/": "Work Sheet",
  "/dashboard": "Admin Dashboard",
};

export const AppLayout = ({ children }) => {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-gradient-to-r from-teal-800 to-teal-700 px-5 py-3 text-white shadow-sm">
          <h1 className="text-base font-semibold tracking-tight">{TITLES[pathname] || "WorkSheet"}</h1>
          <RoleSwitcher />
        </header>
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
};
