import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/sonner";
import WorkSheetPage from "@/pages/WorkSheetPage";

function App() {
  return (
    <div className="App">
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WorkSheetPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </UserProvider>
    </div>
  );
}

export default App;
