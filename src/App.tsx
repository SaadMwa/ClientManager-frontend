import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import Skeleton from "./components/ui/Skeleton";

const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/AnalyticPage"));
const Projects = lazy(() => import("./pages/ProjectPage"));

const RouteFallback = () => (
  <div className="mx-auto max-w-6xl p-6">
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-64 w-full md:col-span-2" />
    </div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <Clients />
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
          path="/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route path="/analytics" element={<Navigate to="/clients" replace />} />
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
    </Suspense>
  );
}

export default App;
