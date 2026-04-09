import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientDetails from "./pages/Dashboard";
import AddClients from "./pages/AnalyticPage";
import Projects from "./pages/ProjectPage";

function App() {
  return (
    
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <ClientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AddClients />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
              <h1 className="text-2xl font-semibold">404 - Page Not Found</h1>
              <p className="text-sm text-[rgb(var(--text-2))]">
                Go to{" "}
                <Link to="/login" className="underline">
                  /login
                </Link>
              </p>
            </div>
          }
        />
      </Routes>
  
  );
}

export default App;