"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [storedId, setStoredId] = useState<string | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  const createClient = useMutation(api.clients.create);

  useEffect(() => {
    const id = localStorage.getItem("rg_client_id");
    setStoredId(id);
    setCheckedStorage(true);
  }, []);

  const existingClient = useQuery(
    api.clients.get,
    storedId ? { clientId: storedId as Id<"clients"> } : "skip"
  );

  // If already logged in, redirect
  useEffect(() => {
    if (!existingClient) return;
    if (existingClient.onboardingCompletedAt) {
      router.push("/dashboard");
    } else {
      const step = existingClient.onboardingStep || 1;
      const stepPaths: Record<number, string> = {
        1: "1-welcome",
        2: "2-questionnaire",
        3: "3-brand-profile",
        4: "4-brand-docs",
        5: "5-api-keys",
        6: "6-software-access",
        7: "7-schedule-calls",
        8: "8-complete",
      };
      router.push(`/onboarding/${stepPaths[step] || "1-welcome"}`);
    }
  }, [existingClient, router]);

  if (!checkedStorage) return null;
  if (existingClient) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const clientId = await createClient({ name, email, company, password });
      localStorage.setItem("rg_client_id", clientId);
      router.push("/onboarding/1-welcome");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("Enter the email you signed up with. If you don't have an account, switch to Sign Up.");
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#060B08]">
      {/* Green radial glow */}
      <div className="pointer-events-none absolute -top-[200px] left-1/2 h-[1000px] w-[1200px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(12,191,106,.07)_0%,transparent_60%)]" />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_10%,transparent_60%)]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(12,191,106,.12) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Rawgrowth</h1>
          <p className="mt-2 text-sm text-[rgba(255,255,255,.5)]">
            Your AI Department Portal
          </p>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,.06)] bg-[#0A1210] p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0CBF6A]/40 to-transparent" />

          {/* Tab toggle */}
          <div className="mb-6 flex rounded-lg border border-[rgba(255,255,255,.06)] bg-[rgba(255,255,255,.03)]">
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-[#0CBF6A] text-white"
                  : "text-[rgba(255,255,255,.5)] hover:text-white"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-[#0CBF6A] text-white"
                  : "text-[rgba(255,255,255,.5)] hover:text-white"
              }`}
            >
              Log In
            </button>
          </div>

          <form onSubmit={mode === "signup" ? handleSignup : handleLogin}>
            {mode === "signup" && (
              <>
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,.3)] outline-none transition-colors focus:border-[#0CBF6A]/50 focus:ring-1 focus:ring-[#0CBF6A]/30"
                    placeholder="Chris West"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,.3)] outline-none transition-colors focus:border-[#0CBF6A]/50 focus:ring-1 focus:ring-[#0CBF6A]/30"
                    placeholder="Rawgrowth"
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,.3)] outline-none transition-colors focus:border-[#0CBF6A]/50 focus:ring-1 focus:ring-[#0CBF6A]/30"
                placeholder="you@company.com"
              />
            </div>

            {mode === "signup" && (
              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,.3)] outline-none transition-colors focus:border-[#0CBF6A]/50 focus:ring-1 focus:ring-[#0CBF6A]/30"
                  placeholder="Min 6 characters"
                />
              </div>
            )}

            {error && (
              <p className="mb-4 text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-shine w-full rounded-xl bg-[#0CBF6A] px-10 py-4 text-[15px] font-bold text-white transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : mode === "signup"
                  ? "Create Account"
                  : "Log In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[rgba(255,255,255,.35)]">
          By signing up you agree to work with Rawgrowth to install your AI department.
        </p>
      </div>
    </div>
  );
}
