import { NavLink } from "react-router-dom";
import { LayoutDashboard, Table2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { LAYOUT } from "@/constants/testIds";

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-teal-600/90 text-white" : "text-teal-100/70 hover:bg-teal-800/60 hover:text-white"
  }`;

export const Sidebar = () => {
  const { currentUser } = useUser();

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col bg-[#0c2b30] px-3 py-4">
      <div className="mb-6 px-2">
        <div className="text-lg font-bold tracking-tight text-white">WorkSheet</div>
        <div className="text-[11px] text-teal-300/70">Spreadsheet-first tracking</div>
      </div>

      <nav className="flex flex-col gap-1">
        {currentUser?.role === "admin" && (
          <NavLink to="/dashboard" data-testid={LAYOUT.sidebarNavDashboard} className={navItemClass}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
        )}
        <NavLink to="/" data-testid={LAYOUT.sidebarNavSheet} className={navItemClass}>
          <Table2 className="h-4 w-4" />
          Work Sheet
        </NavLink>
      </nav>

      <div className="mt-auto px-2 pt-4">
        {currentUser && (
          <div data-testid={LAYOUT.sidebarUserInfo} className="rounded-lg bg-black/20 px-3 py-2.5">
            <div className="text-sm font-medium text-white">{currentUser.name}</div>
            <div className="text-[11px] capitalize text-teal-300/70">{currentUser.role}</div>
          </div>
        )}
      </div>
    </aside>
  );
};
