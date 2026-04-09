import { useState } from "react";
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
import Button from "./ui/Button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  agree: z.boolean().refine((val) => val, "Please accept the terms"),
});

type RegisterForm = z.infer<typeof schema>;

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterForm>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", agree: false },
  });

  const onSubmit = async (values: RegisterForm) => {
    setServerError("");
    setSuccess("");
    try {
      const res = await API.post("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      console.log("Registration successful:", res.data);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.response && error.response.data) {
        setServerError(error.response.data.message || "Registration failed");
      } else if (error.request) {
        setServerError("No response from server. Please check your connection.");
      } else {
        setServerError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-[rgba(56,116,255,0.2)] blur-3xl" />
        <div className="absolute bottom-0 right-10 h-96 w-96 rounded-full bg-[rgba(131,187,255,0.3)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.12))]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-3xl border border-white/60 bg-white/75 p-8 shadow-2xl backdrop-blur"
        >
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--text-2))]">
              Start here
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Create your workspace</h1>
            <p className="mt-2 text-sm text-[rgb(var(--text-2))]">
              Build a crisp portfolio dashboard in minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <input
                type="text"
                id="register-name"
                className="peer h-12 w-full rounded-2xl border border-white/60 bg-white/80 px-11 text-sm text-[rgb(var(--text-1))] shadow-sm outline-none transition focus:border-[rgb(var(--brand-2))] focus:ring-2 focus:ring-[rgba(56,116,255,0.2)]"
                placeholder=" "
                {...register("name")}
              />
              <label
                htmlFor="register-name"
                className="pointer-events-none absolute left-11 top-3.5 text-xs font-medium text-[rgb(var(--text-2))] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[rgb(var(--text-2))] peer-focus:top-1 peer-focus:text-xs"
              >
                Full name
              </label>
              <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-[rgb(var(--text-2))]" />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

         <div className="relative">
    <input
        type="email"
        id="register-email"
        className="peer h-12 w-full rounded-2xl border border-white/60 bg-white/80 pl-11 pr-3 text-sm text-[rgb(var(--text-1))] shadow-sm outline-none transition focus:border-[rgb(var(--brand-2))] focus:ring-2 focus:ring-[rgba(56,116,255,0.2)]"
        placeholder="Email address"  // 👈 Add direct placeholder
        {...register("email")}
    />
    <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-[rgb(var(--text-2))]" />
    {/* 👈 REMOVE the <label> tag entirely */}
    {errors.email && (
        <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
    )}
</div>

       <div className="relative">
    <input
        type={showPassword ? "text" : "password"}
        id="register-password"
        className="peer h-12 w-full rounded-2xl border border-white/60 bg-white/80 pl-11 pr-11 text-sm text-[rgb(var(--text-1))] shadow-sm outline-none transition focus:border-[rgb(var(--brand-2))] focus:ring-2 focus:ring-[rgba(56,116,255,0.2)]"
        placeholder="Password"  // 👈 Direct placeholder
        {...register("password")}
    />
    <LockClosedIcon className="absolute left-3 top-3.5 h-5 w-5 text-[rgb(var(--text-2))]" />
    <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-3.5 text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]"
    >
        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
    </button>
    {errors.password && (
        <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
    )}
</div>
            <label className="flex items-start gap-2 text-sm text-[rgb(var(--text-2))]">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-white/60 text-[rgb(var(--brand-2))]"
                {...register("agree")}
              />
              I agree to the Terms of Service and Privacy Policy.
            </label>
            {errors.agree && (
              <p className="text-xs text-red-500">{errors.agree.message}</p>
            )}

            {serverError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>

            <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-2))]">
              <div className="h-px flex-1 bg-white/70" />
              Or sign up with
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
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[rgb(var(--brand-2))]">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
