"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  Users,
  UserPlus,
  Mail,
  KeyRound,
  User,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserCheck
} from "lucide-react";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function AdminTeamPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [salespersons, setSalespersons] = useState<TeamMember[]>([]);
  const [admins, setAdmins] = useState<TeamMember[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Toggle Tab: "salesperson" | "admin"
  const [activeTab, setActiveTab] = useState<"salesperson" | "admin">("salesperson");

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Authenticate & Protect page (Admin-only)
  useEffect(() => {
    initialize();
    setIsCheckingAuth(false);
  }, [initialize]);

  useEffect(() => {
    if (isCheckingAuth) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "admin") {
      router.push("/");
    }
  }, [isCheckingAuth, isAuthenticated, user, router]);

  // 2. Fetch Directory (both salespersons & admins)
  const fetchDirectory = async () => {
    setIsLoadingList(true);
    try {
      const [salesRes, adminsRes] = await Promise.all([
        api.get("/api/admin/salespersons"),
        api.get("/api/admin/admins")
      ]);
      setSalespersons(salesRes.data || []);
      setAdmins(adminsRes.data || []);
    } catch (err: any) {
      console.error("Failed to fetch directory:", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && user?.role === "admin") {
      fetchDirectory();
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  // 3. Handle Account Creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName.trim(),
    };

    try {
      if (activeTab === "salesperson") {
        const res = await api.post("/api/admin/salespersons", payload);
        setSuccess(`Salesperson account for "${res.data.name}" created successfully.`);
      } else {
        const res = await api.post("/api/admin/create-admin", payload);
        setSuccess(`Administrator account for "${res.data.name}" created successfully.`);
      }
      
      // Refresh both directories
      await fetchDirectory();

      // Reset form fields on success
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(`Failed to create ${activeTab === "salesperson" ? "salesperson" : "administrator"} account. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-505 text-sm">Verifying administrator credentials...</p>
      </div>
    );
  }

  const currentList = activeTab === "salesperson" ? salespersons : admins;
  const currentTitle = activeTab === "salesperson" ? "Salesperson Directory" : "Administrator Directory";
  const emptyLabel = activeTab === "salesperson" ? "No Salespersons Configured" : "No Administrators Configured";
  const emptyDesc = activeTab === "salesperson" 
    ? "Add your first salesperson using the creation panel."
    : "No other administrators configured under this portal.";

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
          <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
            <Users className="w-7 h-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Team Management</h1>
            <p className="text-slate-500 text-sm mt-1">Configure and manage salesperson and administrator accounts</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Grid Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Team Member Form */}
          <div className="lg:col-span-1 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm relative overflow-hidden h-fit">
            
            {/* Tab Selector */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("salesperson");
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === "salesperson"
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Salesperson
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("admin");
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === "admin"
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Administrator
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              {activeTab === "salesperson" ? (
                <>
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900">Create Salesperson</h3>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900">Add Administrator</h3>
                </>
              )}
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1.5 block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                    placeholder={activeTab === "salesperson" ? "e.g. Alice Smith" : "e.g. Robert Johnson"}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1.5 block">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                    placeholder="e.g. contact@business.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1.5 block">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                    placeholder="Create a strong password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  activeTab === "salesperson" ? "Create Account" : "Add Admin Account"
                )}
              </button>
            </form>
          </div>

          {/* Current Directory List */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{currentTitle}</h3>
              <span className="text-xs bg-gray-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                Total: {currentList.length}
              </span>
            </div>

            {isLoadingList ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <p className="text-slate-500 text-xs font-semibold">Loading directory details...</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <h4 className="font-semibold text-slate-500 text-sm">{emptyLabel}</h4>
                <p className="text-slate-400 text-xs mt-1">{emptyDesc}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-slate-505 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {currentList.map((person) => (
                      <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-teal-600" />
                          {person.name}
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-mono text-xs">
                          {person.email}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
