import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/authContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bars3Icon,
  ChartBarIcon,
  FolderOpenIcon,
  Squares2X2Icon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Button from "./ui/Button";
import { cn } from "../utils/cn";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: Squares2X2Icon },
  { label: "Projects", to: "/projects", icon: FolderOpenIcon },
  { label: "Clients", to: "/clients", icon: ChartBarIcon },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    window.localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-6 px-4 py-5">
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-1))] p-5 shadow-[var(--shadow-1)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--brand-2))] text-white">
                CM
              </div>
              <div>
                <p className="text-lg font-semibold">Client Manager</p>
                <p className="text-xs text-[rgb(var(--text-2))]">Portfolio Suite</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-[rgba(56,116,255,0.14)] text-[rgb(var(--brand-1))]"
                          : "text-[rgb(var(--text-2))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text-1))]"
                      )
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <button
              onClick={() => setIsDark((prev) => !prev)}
              className="mt-6 inline-flex w-full items-center justify-between rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text-1))] transition hover:-translate-y-[1px]"
              aria-label="Toggle dark mode"
            >
              <span className="flex items-center gap-2">
                {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                {isDark ? "Light mode" : "Dark mode"}
              </span>
            </button>

            <div className="mt-10 rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
                Signed in
              </p>
              <p className="mt-2 text-sm font-medium">{user?.email}</p>
              <Button variant="ghost" className="mt-3 w-full justify-center text-sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          <header className="flex items-center justify-between rounded-3xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-1))] px-5 py-4 shadow-[var(--shadow-1)] backdrop-blur lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(var(--brand-2))] text-white">
                CM
              </div>
              <div>
                <p className="text-sm font-semibold">Client Manager</p>
                <p className="text-xs text-[rgb(var(--text-2))]">Track Clients</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Bars3Icon className="h-6 w-6" />
            </Button>
          </header>

          <main className="rounded-3xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-1))] p-6 shadow-[var(--shadow-1)] backdrop-blur lg:p-8">
            {children}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
              className="h-full w-72 bg-[rgb(var(--surface-1))] p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(var(--brand-2))] text-white">
                    CM
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Client Manager</p>
                    <p className="text-xs text-[rgb(var(--text-2))]">Portfolio Suite</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>

              <nav className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                          isActive
                            ? "bg-[rgba(56,116,255,0.14)] text-[rgb(var(--brand-1))]"
                            : "text-[rgb(var(--text-2))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text-1))]"
                        )
                      }
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>

              <button
                onClick={() => setIsDark((prev) => !prev)}
                className="mt-6 inline-flex w-full items-center justify-between rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text-1))] transition hover:-translate-y-[1px]"
                aria-label="Toggle dark mode"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                  {isDark ? "Light mode" : "Dark mode"}
                </span>
              </button>

              <div className="mt-10 rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
                  Signed in
                </p>
                <p className="mt-2 text-sm font-medium">{user?.email}</p>
                <Button variant="ghost" className="mt-3 w-full justify-center text-sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="px-4 pb-6 text-center text-xs text-[rgb(var(--text-2))]">
        Copyright {new Date().getFullYear()} Freeee. Trusted by freelancers.
      </footer>
    </div>
  );
};

export default Layout;
