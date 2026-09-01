import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import WorkSheetPage from "@/pages/WorkSheetPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import PlaceholderPage from "@/pages/PlaceholderPage";

function App() {
  return (
    <div className="App">
      <UserProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<WorkSheetPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/team" element={<PlaceholderPage title="Team" phase="Phase 5" />} />
              <Route path="/approvals" element={<PlaceholderPage title="Approvals" phase="Phase 4" />} />
              <Route path="/clients" element={<PlaceholderPage title="Clients" phase="Phase 1 (up next)" />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
        <Toaster position="top-right" />
      </UserProvider>
    </div>
  );
}

export default App;
