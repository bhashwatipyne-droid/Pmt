import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import WorkSheetPage from "@/pages/WorkSheetPage";
import DashboardPage from "@/pages/DashboardPage";

function App() {
  return (
    <div className="App">
      <UserProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<WorkSheetPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
        <Toaster position="top-right" />
      </UserProvider>
    </div>
  );
}

export default App;
