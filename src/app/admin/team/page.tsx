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
  UserCheck,
  Edit,
  Trash2,
  Plus,
  X,
  ShieldAlert
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

  // Create Form Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form Modal State
  const [editingPerson, setEditingPerson] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Deactivate Confirmation Modal State
  const [deactivatingPerson, setDeactivatingPerson] = useState<TeamMember | null>(null);
  const [isSubmittingDeactivate, setIsSubmittingDeactivate] = useState(false);

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
      setIsCreateOpen(false);
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

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    setIsSubmittingEdit(true);
    setError(null);
    setSuccess(null);

    const payload = {
      full_name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      password: editPassword ? editPassword : null,
    };

    try {
      await api.patch(`/api/admin/salespersons/${editingPerson.id}`, payload);
      setSuccess(`Account for "${editName}" updated successfully.`);
      setEditingPerson(null);
      setEditName("");
      setEditEmail("");
      setEditPassword("");
      await fetchDirectory();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to update salesperson account. Please try again.");
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivatingPerson) return;
    setIsSubmittingDeactivate(true);
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/api/admin/salespersons/${deactivatingPerson.id}`);
      setSuccess(`Account for "${deactivatingPerson.name}" deactivated successfully.`);
      setDeactivatingPerson(null);
      await fetchDirectory();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to deactivate salesperson account. Please try again.");
      }
    } finally {
      setIsSubmittingDeactivate(false);
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
        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <Users className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Team Management</h1>
              <p className="text-slate-505 text-sm mt-1 font-medium">Configure and manage salesperson and administrator accounts</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFullName("");
              setEmail("");
              setPassword("");
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-2 text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 py-2.5 px-4 shadow-sm transition-all cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "salesperson" ? "New Salesperson" : "Add Administrator"}
          </button>
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

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab("salesperson");
              setError(null);
              setSuccess(null);
            }}
            className={`pb-3.5 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "salesperson"
                ? "border-teal-600 text-teal-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Salespersons Directory
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError(null);
              setSuccess(null);
            }}
            className={`pb-3.5 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "admin"
                ? "border-teal-600 text-teal-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Administrators Directory
          </button>
        </div>

        {/* Current Directory List */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
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
              <h4 className="font-semibold text-slate-505 text-sm">{emptyLabel}</h4>
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
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {currentList.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-teal-600" />
                        {person.name}
                      </td>
                      <td className="py-4 px-6 text-slate-705 font-mono text-xs">
                        {person.email}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${
                          person.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {person.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {person.role === "salesperson" ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingPerson(person);
                                setEditName(person.name);
                                setEditEmail(person.email);
                                setEditPassword("");
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold border border-slate-300 hover:border-teal-600 hover:bg-teal-50 text-slate-700 hover:text-teal-600 py-1.5 px-3 rounded-lg transition-all cursor-pointer bg-transparent"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeactivatingPerson(person)}
                              disabled={!person.is_active}
                              className="inline-flex items-center gap-1 text-xs font-bold border border-rose-200 hover:bg-rose-50 text-rose-700 py-1.5 px-3 rounded-lg transition-all cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Deactivate
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">System Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* 1. Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-xl relative overflow-hidden text-slate-800 animate-none">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-slate-800 transition-colors bg-transparent border-0 outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900 font-sans">
                {activeTab === "salesperson" ? "Create Salesperson Account" : "Add Administrator"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set name, email, and authentication credentials for this role.
              </p>
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
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
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
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
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
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
                    placeholder="Create a strong password"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-semibold text-slate-650 hover:bg-gray-50 transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Modal */}
      {editingPerson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-xl relative overflow-hidden text-slate-800 animate-none">
            <button
              onClick={() => setEditingPerson(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-slate-800 transition-colors bg-transparent border-0 outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900 font-sans">Edit Salesperson Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update name, email, or reset password for {editingPerson.name}.
              </p>
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1.5 block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
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
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1.5 block">
                  New Password <span className="text-[10px] text-slate-400 font-normal italic">(Leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
                    placeholder="Enter new password to reset"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-semibold text-slate-650 hover:bg-gray-50 transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-2.5 px-4 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
                >
                  {isSubmittingEdit ? (
                    <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Deactivate Modal */}
      {deactivatingPerson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-xl relative overflow-hidden text-slate-800 animate-none">
            <button
              onClick={() => setDeactivatingPerson(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-slate-800 transition-colors bg-transparent border-0 outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-sans">Deactivate Salesperson?</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Are you sure you want to deactivate salesperson <strong>{deactivatingPerson.name}</strong> ({deactivatingPerson.email})? 
              This will disable their account access, but historical order history will remain preserved.
            </p>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setDeactivatingPerson(null)}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-semibold text-slate-650 hover:bg-gray-50 transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDeactivate}
                onClick={handleDeactivateAccount}
                className="flex-1 py-2.5 px-4 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
              >
                {isSubmittingDeactivate ? (
                  <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  "Deactivate Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
