import { useState,useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import API from "../api/axios";
import { useAuth } from "../Context/authContext";
import Button from "./ui/Button";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof schema>;

function Login() {

  const navigate = useNavigate();
  const { login,user,loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

 

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginForm>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });


     // 👇 ADD THIS REDIRECT LOGIC
  useEffect(() => {
    console.log("🔵 Login page - loading:", loading);
    console.log("🔵 Login page - user:", user);
    
    if (!loading && user) {
      console.log("✅ Already logged in! Redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  // 👇 ADD LOADING STATE
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // 👇 IF USER EXISTS, DON'T RENDER LOGIN FORM
  if (user) {
    return null;
  }

  const onSubmit = async (values: LoginForm) => {
    
    setServerError("");
    try {
      const response = await API.post("/auth/login", {
        email: values.email,
        password: values.password,
      });
      login(response.data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Login failed");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[rgba(56,116,255,0.25)] blur-3xl" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[rgba(131,187,255,0.35)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.6),rgba(255,255,255,0.1))]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur"
        >
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--text-2))]">
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Sign in to your workspace</h1>
            <p className="mt-2 text-sm text-[rgb(var(--text-2))]">
              Track clients, projects, and revenue from one polished hub.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                id="login-email"
                className="peer h-12 w-full rounded-2xl border border-white/60 bg-white/80 px-11 text-sm text-[rgb(var(--text-1))] shadow-sm outline-none transition focus:border-[rgb(var(--brand-2))] focus:ring-2 focus:ring-[rgba(56,116,255,0.2)]"
                placeholder="Email Address"
                {...register("email")}
              />
           
              <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-[rgb(var(--text-2))]" />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                className="peer h-12 w-full rounded-2xl border border-white/60 bg-white/80 px-11 text-sm text-[rgb(var(--text-1))] shadow-sm outline-none transition focus:border-[rgb(var(--brand-2))] focus:ring-2 focus:ring-[rgba(56,116,255,0.2)]"
                placeholder="Password"
                {...register("password")}
              />

              <LockClosedIcon className="absolute left-3 top-3.5 h-5 w-5 text-[rgb(var(--text-2))]" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3.5 text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]"
    
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[rgb(var(--text-2))]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/60 text-[rgb(var(--brand-2))]"
                  {...register("remember")}
                />
                Remember me
              </label>
              <a href="#" className="text-[rgb(var(--brand-2))] hover:underline">
                Forgot password?
              </a>
            </div>

            {serverError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-2))]">
              <div className="h-px flex-1 bg-white/70" />
              Or continue with
              <div className="h-px flex-1 bg-white/70" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline">
                Google
              </Button>
              <Button type="button" variant="outline">
                GitHub
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-[rgb(var(--text-2))]">
            New here?{" "}
            <Link to="/register" className="font-semibold text-[rgb(var(--brand-2))]">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
