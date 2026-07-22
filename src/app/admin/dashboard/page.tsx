"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  CheckCircle2,
  Building2,
  AlertCircle,
  ShieldAlert,
  Check,
  X,
  RefreshCw,
  Clock,
  Globe,
  Printer,
  Link2,
  FileSpreadsheet,
  UploadCloud,
  Search
} from "lucide-react";

interface Shop {
  id: number;
  user_id: number;
  company_name: string;
  phone_number: string;
  address: string;
  address_line_2: string | null;
  postcode: string;
  city: string;
  country: string;
  company_registration_number: string | null;
  fax: string | null;
  website: string | null;
  approval_status: "pending" | "approved" | "rejected";
  sage_customer_id: string | null;
  account_ref: string;
  sage_sync_status: "pending" | "synced" | "failed";
  created_at: string;
  updated_at: string;
  email?: string;
}

interface ImportSummary {
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
}

export default function AdminDashboard() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Pending approvals state
  const [pendingShops, setPendingShops] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);

  // Password Reset Requests State
  interface PasswordResetRequest {
    id: number;
    account_ref: string;
    company_name: string;
    email: string;
    phone_number: string;
    status: "pending" | "resolved";
    created_at: string;
  }
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [resolvingRequest, setResolvingRequest] = useState<PasswordResetRequest | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState<"registered" | "pending" | "password_resets">("registered");

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Review Modal State
  const [reviewingShop, setReviewingShop] = useState<Shop | null>(null);
  const [modalStatus, setModalStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [modalSageRef, setModalSageRef] = useState("");

  // Dynamic search filtering
  const query = searchQuery.toLowerCase().trim();
  const filteredShops = shops.filter((shop) => {
    if (!query) return true;
    return (
      (shop.company_name?.toLowerCase() || "").includes(query) ||
      (shop.account_ref?.toLowerCase() || "").includes(query) ||
      (shop.city?.toLowerCase() || "").includes(query) ||
      (shop.email?.toLowerCase() || "").includes(query)
    );
  });

  const filteredPendingShops = pendingShops.filter((shop) => {
    if (!query) return true;
    return (
      (shop.company_name?.toLowerCase() || "").includes(query) ||
      (shop.account_ref?.toLowerCase() || "").includes(query) ||
      (shop.city?.toLowerCase() || "").includes(query) ||
      (shop.email?.toLowerCase() || "").includes(query)
    );
  });

  // 1. Auth Guard Protection
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

  // 2. Fetch Shop Listings
  const fetchShops = async () => {
    setIsLoadingShops(true);
    setError(null);
    try {
      const res = await api.get("/admin/shops");
      setShops(res.data.items || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch registered shops. Please check backend connection.");
    } finally {
      setIsLoadingShops(false);
    }
  };

  const fetchPendingShops = async () => {
    setIsLoadingPending(true);
    try {
      const res = await api.get("/api/admin/shops/pending");
      setPendingShops(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch pending approvals.");
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handleApproveShop = async (shopId: number) => {
    setActioningId(shopId);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(`/api/admin/shops/${shopId}/approve`);
      setSuccessMsg("Shop approved successfully!");
      setPendingShops((prev) => prev.filter((s) => s.id !== shopId));
      fetchShops();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to approve shop.");
      }
    } finally {
      setActioningId(null);
    }
  };

  const fetchResetRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await api.get("/api/admin/password-requests");
      setResetRequests(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch password reset requests.");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleResolveRequest = async (requestId: number, newPassword?: string) => {
    setIsSubmittingResolve(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(`/api/admin/password-requests/${requestId}/resolve`, {
        new_password: newPassword || null,
      });
      setSuccessMsg(
        newPassword
          ? "Password reset and marked as resolved successfully!"
          : "Password request dismissed successfully."
      );
      setResetRequests((prev) => prev.filter((r) => r.id !== requestId));
      setResolvingRequest(null);
      setNewPasswordVal("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to resolve password reset request.");
      }
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && user?.role === "admin") {
      fetchShops();
      fetchPendingShops();
      fetchResetRequests();
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  // 3. Open Review Modal
  const openReviewModal = (shop: Shop) => {
    setReviewingShop(shop);
    setModalStatus(shop.approval_status);
    setModalSageRef(shop.account_ref || "");
  };

  // 4. Update Shop Approval and Sage Reference
  const handleUpdateShop = async (shopId: number, status: "approved" | "rejected" | "pending", sageRef: string | null) => {
    setActioningId(shopId);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch(`/admin/shops/${shopId}/approval`, {
        approval_status: status,
        account_ref: sageRef?.trim() || null,
      });

      // Update local state immediately
      setShops((prev) =>
        prev.map((shop) =>
          shop.id === shopId ? { ...shop, approval_status: status as any, account_ref: sageRef?.trim() || "" } : shop
        )
      );

      setSuccessMsg(`Shop registration successfully updated!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setReviewingShop(null); // Close modal
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(`Failed to update shop registration status.`);
      }
    } finally {
      setActioningId(null);
    }
  };

  // 5. Handle Excel / CSV File Import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setSuccessMsg(null);
    setImportSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/admin/import-shops", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setImportSummary({
        imported: res.data.imported,
        updated: res.data.updated,
        failed: res.data.failed,
        errors: res.data.errors,
      });

      setSuccessMsg(`Spreadsheet import complete!`);
      fetchShops(); // Refresh list to show newly imported/approved shops
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to import shop spreadsheet. Please check columns and formatting.");
      }
    } finally {
      setIsImporting(false);
      e.target.value = ""; // Reset
    }
  };

  if (isCheckingAuth || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying administrator credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <ShieldAlert className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              id="bulk-import-file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileImport}
              disabled={isImporting}
              className="hidden"
            />
            <label
              htmlFor="bulk-import-file"
              className={`flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-xl border transition-all cursor-pointer ${
                isImporting
                  ? "border-gray-250 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 hover:border-teal-600 bg-white text-slate-700 hover:text-teal-600 shadow-sm"
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-650" />
                  Importing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  Import Customers
                </>
              )}
            </label>

            <button
              onClick={fetchShops}
              disabled={isLoadingShops}
              className="flex items-center justify-center gap-2 text-sm font-semibold border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 text-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingShops ? "animate-spin" : ""}`} />
              Refresh Shops
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Import Summary Results */}
        {importSummary && (
          <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-xs space-y-3">
            <h4 className="font-bold text-slate-950 flex items-center gap-1.5 mb-1 text-sm font-sans">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              Customer Import Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center font-mono">
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 rounded-xl">
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Imported</span>
                <span className="text-sm font-bold">{importSummary.imported}</span>
              </div>
              <div className="bg-teal-50 text-teal-700 border border-teal-200 py-2 rounded-xl">
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Updated</span>
                <span className="text-sm font-bold">{importSummary.updated}</span>
              </div>
              <div className="bg-rose-50 text-rose-700 border border-rose-200 py-2 rounded-xl">
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Failed</span>
                <span className="text-sm font-bold">{importSummary.failed}</span>
              </div>
            </div>
            {importSummary.errors.length > 0 && (
              <div className="text-rose-700 max-h-24 overflow-y-auto pt-2 border-t border-gray-200 font-mono text-[10px] leading-relaxed">
                <span className="font-bold block mb-1">Import Warnings/Errors:</span>
                {importSummary.errors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search shops by name, account ref, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 border border-gray-200 bg-white placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold bg-transparent border-0 cursor-pointer outline-none"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content Box */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 bg-gray-50/50">
            <button
              onClick={() => setActiveTab("registered")}
              className={`flex-1 sm:flex-none py-3.5 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "registered"
                  ? "border-teal-600 text-teal-600 bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Registered Shops
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 sm:flex-none py-3.5 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "pending"
                  ? "border-teal-600 text-teal-600 bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Pending Approvals
              {pendingShops.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {pendingShops.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("password_resets")}
              className={`flex-1 sm:flex-none py-3.5 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "password_resets"
                  ? "border-teal-600 text-teal-600 bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Password Reset Requests
              {resetRequests.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {resetRequests.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "registered" ? (
            isLoadingShops ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                <p className="text-slate-500 text-sm">Retrieving customer shop listings...</p>
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Building2 className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">
                  {searchQuery ? "No Matching Shops Found" : "No Shops Registered"}
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mt-1 font-medium">
                  {searchQuery
                    ? "Try adjusting your search terms or clear the query to see all registrations."
                    : "There are currently no shop registrations in the database."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Company Name</th>
                      <th className="py-4 px-6">City</th>
                      <th className="py-4 px-6">Phone</th>
                      <th className="py-4 px-6">Company Reg No.</th>
                      <th className="py-4 px-6">Sage Account Ref</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredShops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4.5 px-6 font-medium text-slate-900">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-950">{shop.company_name}</span>
                              <span className="text-xs bg-gray-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-semibold">
                                ID: {shop.id}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 font-normal">
                              {shop.address}, {shop.postcode}
                            </span>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-slate-650">{shop.city}</td>
                        <td className="py-4.5 px-6 font-mono text-slate-650">{shop.phone_number}</td>
                        <td className="py-4.5 px-6 font-mono text-slate-500">{shop.company_registration_number || "-"}</td>
                        <td className="py-4.5 px-6 font-mono font-bold text-teal-700">{shop.account_ref || "UNASSIGNED"}</td>
                        <td className="py-4.5 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                              shop.approval_status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-250"
                                : shop.approval_status === "rejected"
                                ? "bg-rose-50 text-rose-700 border border-rose-250"
                                : "bg-amber-50 text-amber-700 border border-amber-250"
                            }`}
                          >
                            {shop.approval_status === "pending" && <Clock className="w-3 h-3" />}
                            {shop.approval_status === "approved" && <Check className="w-3 h-3" />}
                            {shop.approval_status === "rejected" && <X className="w-3 h-3" />}
                            {shop.approval_status}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <button
                            onClick={() => openReviewModal(shop)}
                            className="inline-flex items-center gap-1 text-xs font-bold border border-gray-300 hover:border-teal-600 hover:bg-teal-50 text-slate-700 hover:text-teal-600 py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                          >
                            Review & Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "pending" ? (
            isLoadingPending ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                <p className="text-slate-500 text-sm">Retrieving pending approvals...</p>
              </div>
            ) : filteredPendingShops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Building2 className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">
                  {searchQuery ? "No Matching Pending Approvals" : "All Approved"}
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mt-1 font-medium">
                  {searchQuery
                    ? "Try adjusting your search terms or clear the query to see all pending approvals."
                    : "There are currently no new shop registrations awaiting admin approval."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Company Name</th>
                      <th className="py-4 px-6">Email Address</th>
                      <th className="py-4 px-6">Sage Ref</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredPendingShops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4.5 px-6 font-medium text-slate-900">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-950">{shop.company_name}</span>
                            <span className="text-xs text-slate-500 font-mono">Phone: {shop.phone_number}</span>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-slate-650">{shop.email}</td>
                        <td className="py-4.5 px-6 font-mono font-bold text-slate-600">{shop.account_ref}</td>
                        <td className="py-4.5 px-6 text-right">
                          <button
                            onClick={() => openReviewModal(shop)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-teal-50 border border-gray-300 hover:border-teal-600 hover:text-teal-700 py-1.5 px-3.5 rounded-lg transition-all cursor-pointer shadow-xs"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            isLoadingRequests ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                <p className="text-slate-500 text-sm">Retrieving password reset requests...</p>
              </div>
            ) : resetRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Building2 className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">No Password Reset Requests</h3>
                <p className="text-slate-500 text-sm max-w-sm mt-1">
                  There are currently no pending password reset requests.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Account Number</th>
                      <th className="py-4 px-6">Company Name</th>
                      <th className="py-4 px-6">Email Address</th>
                      <th className="py-4 px-6">Phone Number</th>
                      <th className="py-4 px-6">Date Requested</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {resetRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4.5 px-6 font-mono text-slate-900 font-bold">{req.account_ref}</td>
                        <td className="py-4.5 px-6 text-slate-900 font-semibold">{req.company_name}</td>
                        <td className="py-4.5 px-6 text-slate-650 font-mono">{req.email}</td>
                        <td className="py-4.5 px-6 text-slate-650 font-mono">{req.phone_number}</td>
                        <td className="py-4.5 px-6 text-slate-500">
                          {new Date(req.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4.5 px-6 text-right space-x-2">
                          <button
                            onClick={() => {
                              setResolvingRequest(req);
                              setNewPasswordVal("");
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 py-1.5 px-3.5 rounded-lg transition-all cursor-pointer shadow-sm border-0"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleResolveRequest(req.id)}
                            disabled={isSubmittingResolve}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 border border-slate-300 hover:bg-slate-50 py-1.5 px-3.5 rounded-lg transition-all cursor-pointer shadow-sm bg-transparent"
                          >
                            Dismiss
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

      </div>

      {/* Review & Edit Modal */}
      {reviewingShop && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-lg space-y-6 shadow-xl relative overflow-hidden text-slate-800">
            {/* Close button */}
            <button
              onClick={() => setReviewingShop(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900 font-sans">Review Shop Registration</h3>
              <p className="text-xs text-slate-500 mt-0.5">Audit company credentials and match Sage 50 Account Reference</p>
            </div>

            {/* Shop Audit details */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-3.5 text-xs text-slate-700 font-sans max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Company Name</span>
                  <span className="font-bold text-slate-900 text-sm leading-snug">{reviewingShop.company_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contact Name</span>
                  <span className="font-semibold text-slate-900">{reviewingShop.contact_name || "—"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                  <span className="font-mono text-slate-900">{reviewingShop.email || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Main Phone</span>
                  <span className="font-mono text-slate-900">{reviewingShop.phone_number}</span>
                </div>
              </div>

              {(reviewingShop.telephone_2 || reviewingShop.telephone_3 || reviewingShop.fax || reviewingShop.website) && (
                <div className="grid grid-cols-2 gap-4 border-t border-gray-200/60 pt-2.5">
                  {reviewingShop.telephone_2 && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Telephone 2</span>
                      <span className="font-mono text-slate-900">{reviewingShop.telephone_2}</span>
                    </div>
                  )}
                  {reviewingShop.telephone_3 && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Telephone 3</span>
                      <span className="font-mono text-slate-900">{reviewingShop.telephone_3}</span>
                    </div>
                  )}
                  {reviewingShop.fax && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fax</span>
                      <span className="font-mono text-slate-900">{reviewingShop.fax}</span>
                    </div>
                  )}
                  {reviewingShop.website && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Website</span>
                      <span className="font-mono text-slate-900">{reviewingShop.website}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t border-gray-200/60 pt-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Address</span>
                <span className="text-slate-900 font-medium leading-relaxed block">
                  {reviewingShop.address}
                  {reviewingShop.address_line_2 ? `, ${reviewingShop.address_line_2}` : ""}, {reviewingShop.city}, {reviewingShop.postcode}, {reviewingShop.country}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-200/60 pt-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Company Reg No.</span>
                  <span className="font-mono text-slate-900">{reviewingShop.company_registration_number || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sage Sync Status</span>
                  <span className="capitalize text-slate-900 font-semibold">{reviewingShop.sage_sync_status}</span>
                </div>
              </div>
            </div>

            {/* Input Forms */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sage Account Reference</label>
                <input
                  type="text"
                  placeholder="e.g. SAGE001"
                  value={modalSageRef}
                  onChange={(e) => setModalSageRef(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-mono uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-1">Must match the Account Reference code of this B2B customer in Sage 50.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Approval Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-sans"
                >
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actioningId !== null}
                  onClick={() => handleUpdateShop(reviewingShop.id, "rejected", modalSageRef)}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
                <button
                  type="button"
                  disabled={actioningId !== null}
                  onClick={() => handleUpdateShop(reviewingShop.id, "approved", modalSageRef)}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingShop(null)}
                  className="py-2 px-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actioningId !== null}
                  onClick={() => handleUpdateShop(reviewingShop.id, modalStatus, modalSageRef)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {actioningId !== null ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {resolvingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-xl relative overflow-hidden text-slate-800 animate-none">
            <button
              onClick={() => setResolvingRequest(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900 font-sans">Reset Customer Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set a new password for {resolvingRequest.company_name} ({resolvingRequest.account_ref})
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">New Password</label>
                <input
                  type="text"
                  placeholder="Enter new password (min 4 chars)"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setResolvingRequest(null)}
                className="py-2 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-slate-600 transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingResolve || !newPasswordVal.trim() || newPasswordVal.length < 4}
                onClick={() => handleResolveRequest(resolvingRequest.id, newPasswordVal)}
                className="inline-flex items-center gap-1.5 py-2 px-5 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingResolve ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save & Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
