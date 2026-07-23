"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  Briefcase,
  Search,
  X,
  SlidersHorizontal,
  Trash2
} from "lucide-react";

interface Salesperson {
  id: number;
  name: string;
  email: string;
}

interface Order {
  id: number;
  order_number: string | null;
  shop_id: number;
  created_by_user_id: number;
  created_by_role: string;
  salesperson_id: number | null;
  customer_reference: string | null;
  subtotal: string | number;
  discount_type: string | null;
  discount_value: string | number | null;
  discount_amount: string | number;
  final_total: string | number;
  status: "placed" | "cancelled";
  sage_sales_order_id: string | null;
  sage_sync_status: "pending" | "processing" | "synced" | "failed";
  created_at: string;
  salesperson: Salesperson | null;
  account_ref?: string | null;
  shop?: {
    id: number;
    company_name: string;
    phone_number: string;
    address: string;
    postcode: string;
    city: string;
    account_ref?: string | null;
  } | null;
}

export default function OrderHistoryPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Deletion States (Root Admin Only)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isRootAdmin = user?.role === "root_admin" || user?.email === "admin@admin.com";

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/orders/${deletingOrder.id}`);
      setSuccessMsg(`Order ${deletingOrder.order_number || `#${deletingOrder.id}`} successfully deleted.`);
      setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
      setDeletingOrder(null);
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.detail || "Failed to delete order. Please check permissions and sync status.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Derived filtered orders array
  const filteredOrders = orders.filter((order) => {
    // 1. Text filter (case-insensitive substring match against order_id, company_name, account_ref)
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const orderIdStr = order.id.toString();
      const orderNumStr = order.order_number?.toLowerCase() || "";
      const companyName = order.shop?.company_name?.toLowerCase() || "";
      const accountRef = order.shop?.account_ref?.toLowerCase() || order.account_ref?.toLowerCase() || "";
      
      const matchesText =
        orderIdStr.includes(query) ||
        orderNumStr.includes(query) ||
        companyName.includes(query) ||
        accountRef.includes(query);
      if (!matchesText) return false;
    }

    // 2. Date range filter
    if (startDate || endDate) {
      const orderDate = new Date(order.created_at);
      const normalizedOrderDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

      if (startDate) {
        const start = new Date(startDate);
        const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        if (normalizedOrderDate < normalizedStart) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        if (normalizedOrderDate > normalizedEnd) return false;
      }
    }

    // 3. Status filter ('All', 'Pending', 'Synced to Sage', 'Failed')
    if (statusFilter !== "All") {
      if (statusFilter === "Pending" && order.sage_sync_status !== "pending") return false;
      if (statusFilter === "Synced to Sage" && order.sage_sync_status !== "synced") return false;
      if (statusFilter === "Failed" && order.sage_sync_status !== "failed") return false;
    }

    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("All");
  };

  // 1. Auth Guard
  useEffect(() => {
    initialize();
    setIsCheckingAuth(false);
  }, [initialize]);

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  // 2. Fetch Orders
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/orders", {
        params: { page_size: 100 }
      });
      setOrders(res.data.items || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch order history. Please check connection to server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      fetchOrders();
    }
  }, [isCheckingAuth, isAuthenticated]);

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <FileSpreadsheet className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order History</h1>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 text-sm font-semibold border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Control Bar */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Search input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by Order ID, Company Name, or Account Ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 bg-white placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
            />
          </div>

          {/* Right: Date Pickers & Status selector */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex flex-col w-full sm:w-36">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white text-slate-900 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-xs font-semibold w-full"
                  placeholder="Start Date"
                />
              </div>
              <span className="text-slate-400 text-xs font-bold font-mono">to</span>
              <div className="flex flex-col w-full sm:w-36">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white text-slate-900 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-505 transition-all text-xs font-semibold w-full"
                  placeholder="End Date"
                />
              </div>
            </div>

            <div className="w-full sm:w-auto relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-xl border border-gray-300 bg-white text-slate-800 py-2.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-xs font-bold cursor-pointer w-full"
              >
                <option value="All">All Sync Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Synced to Sage">Synced to Sage</option>
                <option value="Failed">Failed</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            {(searchQuery || startDate || endDate || statusFilter !== "All") && (
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 px-3.5 rounded-xl transition-all cursor-pointer bg-transparent shrink-0 w-full sm:w-auto"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <p className="text-slate-500 text-sm font-semibold">Retrieving orders list...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Orders Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-1 mb-6">
                No orders have been recorded in your account history yet.
              </p>
              {user?.role === "shop_owner" && (
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-sm font-bold shadow-sm transition-all"
                >
                  Start Shopping
                </Link>
              )}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 gap-4">
              <FileSpreadsheet className="w-12 h-12 text-slate-300" />
              <div>
                <h3 className="text-lg font-bold text-slate-800">No Matching Orders Found</h3>
                <p className="text-slate-500 text-sm max-w-md mt-1 font-medium leading-relaxed">
                  No matching orders found for your current search criteria. Try clearing your filters.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-xs font-bold shadow-sm transition-all border-0 cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Order Number</th>
                    <th className="py-4 px-6">Date Placed</th>
                    {user?.role === "admin" && <th className="py-4 px-6">Salesperson</th>}
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Sage Sync Status</th>
                    <th className="py-4 px-6">Final Total</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredOrders.map((order) => {
                    const formattedDate = new Date(order.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    const finalTotalVal = typeof order.final_total === "string" 
                      ? parseFloat(order.final_total) 
                      : order.final_total;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        
                        {/* Order Number & Details */}
                        <td className="py-4.5 px-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-600">{order.order_number || `SO-PEND-${order.id}`}</span>
                            {order.customer_reference && (
                              <span className="text-[10px] bg-gray-100 text-slate-500 px-2 py-0.5 rounded font-mono border border-gray-200">
                                Ref: {order.customer_reference}
                              </span>
                            )}
                            {order.created_by_role === "salesperson" && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                                <Briefcase className="w-2.5 h-2.5" />
                                Assisted
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4.5 px-6 text-slate-700">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>

                        {/* Salesperson (Admin only) */}
                        {user?.role === "admin" && (
                          <td className="py-4.5 px-6 text-slate-700">
                            {order.salesperson ? (
                              <span className="text-xs text-indigo-700 font-bold">
                                {order.salesperson.name}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Direct Purchase
                              </span>
                            )}
                          </td>
                        )}

                        {/* Order Status */}
                        <td className="py-4.5 px-6">
                          {order.status === "placed" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Placed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Cancelled
                            </span>
                          )}
                        </td>

                        {/* Sage Sync Status */}
                        <td className="py-4.5 px-6">
                          {order.sage_sync_status === "pending" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          )}
                          {order.sage_sync_status === "processing" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Processing
                            </span>
                          )}
                          {order.sage_sync_status === "synced" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Synced
                            </span>
                          )}
                          {order.sage_sync_status === "failed" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Final Total */}
                        <td className="py-4.5 px-6 font-mono font-bold text-slate-905">
                          £{finalTotalVal.toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/orders/${order.id}`}
                              className="inline-flex items-center justify-center gap-1 text-xs font-bold border border-gray-300 hover:border-teal-500/40 bg-white hover:bg-teal-50 hover:text-teal-600 py-1.5 px-3 rounded-lg transition-all cursor-pointer shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </Link>
                            {isRootAdmin && (order.sage_sync_status !== "synced" && (order.sage_sync_status as string) !== "completed") && (
                              <button
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeletingOrder(order);
                                }}
                                className="inline-flex items-center justify-center p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-gray-200 hover:border-rose-300 rounded-lg transition-all cursor-pointer shadow-xs"
                                title="Delete Unsynced Order (Root Admin Only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100/80 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Confirm Order Deletion</h3>
                <p className="text-xs text-rose-600 font-semibold mt-0.5">Root Admin Privileged Action</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Are you sure you want to permanently delete this unsynced record{" "}
              <strong className="text-slate-900 font-bold">{deletingOrder.order_number || `SO-${deletingOrder.id}`}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setDeletingOrder(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl text-slate-700 hover:bg-gray-100 text-xs font-bold transition-all border border-gray-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 text-xs font-bold shadow-sm transition-all border-0 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
