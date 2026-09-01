import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import WorkSheetPage from "@/pages/WorkSheetPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import TeamPage from "@/pages/TeamPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import ClientsPage from "@/pages/ClientsPage";

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
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
        <Toaster position="top-right" />
      </UserProvider>
    </div>
  );
}

export default App;
