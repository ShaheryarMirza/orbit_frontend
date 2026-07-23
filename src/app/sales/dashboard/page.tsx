"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  LayoutDashboard,
  Briefcase,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Percent,
  ChevronRight,
  Eye,
  Store
} from "lucide-react";

interface Order {
  id: number;
  order_number: string | null;
  shop_id: number;
  created_by_user_id: number;
  created_by_role: string;
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
}

interface Shop {
  id: number;
  name: string;
  city: string;
}

interface SummaryStats {
  total_orders: number;
  placed_orders: number;
  cancelled_orders: number;
  subtotal_total: number | string;
  discount_total: number | string;
  final_total: number | string;
  pending_sage_sync: number;
}

export default function SalesDashboard() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopMap, setShopMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
    setIsCheckingAuth(false);
  }, [initialize]);

  useEffect(() => {
    if (isCheckingAuth) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "salesperson" && user?.role !== "admin" && user?.role !== "root_admin") {
      router.push("/");
    }
  }, [isCheckingAuth, isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, ordersRes, shopsRes] = await Promise.all([
        api.get("/admin/orders/summary"),
        api.get("/orders", { params: { page_size: 10 } }),
        api.get("/admin/shops", { params: { page_size: 100 } })
      ]);

      setStats(summaryRes.data);
      setOrders(ordersRes.data.items || []);

      const mapping: Record<number, string> = {};
      if (shopsRes.data.items) {
        shopsRes.data.items.forEach((s: Shop) => {
          mapping[s.id] = s.name;
        });
      }
      setShopMap(mapping);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load dashboard metrics. Check server connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && (user?.role === "salesperson" || user?.role === "admin" || user?.role === "root_admin")) {
      loadDashboardData();
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  if (isCheckingAuth || !isAuthenticated || (user?.role !== "salesperson" && user?.role !== "admin" && user?.role !== "root_admin")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying salesperson credentials...</p>
      </div>
    );
  }

  // Parse stats totals safely
  const finalTotalVal = stats ? (typeof stats.final_total === "string" ? parseFloat(stats.final_total) : stats.final_total) : 0;
  const discountTotalVal = stats ? (typeof stats.discount_total === "string" ? parseFloat(stats.discount_total) : stats.discount_total) : 0;

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <LayoutDashboard className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sales Dashboard</h1>
              <p className="text-slate-505 text-sm mt-1">
                Monitor system metrics, place orders on behalf of shops, and review recent activities.
              </p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 text-sm font-semibold border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue */}
          <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500">Total Revenue</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono">
                  {isLoading ? (
                    <span className="inline-block w-24 h-8 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    `£${finalTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-emerald-600 font-semibold">
              <span>Platform orders total</span>
            </div>
          </div>

          {/* Total Orders */}
          <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500">Total Orders</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono">
                  {isLoading ? (
                    <span className="inline-block w-16 h-8 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    stats?.total_orders || 0
                  )}
                </h3>
              </div>
              <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-teal-600 font-semibold">
              <span>Placed: {stats?.placed_orders || 0} | Cancelled: {stats?.cancelled_orders || 0}</span>
            </div>
          </div>

          {/* Pending Sage Sync */}
          <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500">Pending Sync</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono">
                  {isLoading ? (
                    <span className="inline-block w-16 h-8 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    stats?.pending_sage_sync || 0
                  )}
                </h3>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-amber-600 font-semibold">
              <span>Orders awaiting CSV export</span>
            </div>
          </div>

          {/* Total Discount Volume */}
          <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500">Discount Volume</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono">
                  {isLoading ? (
                    <span className="inline-block w-20 h-8 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    `£${discountTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </h3>
              </div>
              <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
                <Percent className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-teal-600 font-semibold">
              <span>Total discounts applied</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-fit space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Quick Actions</h3>
              <p className="text-xs text-slate-500 mt-1">Perform client operations and navigate pages</p>
            </div>
            
            <div className="space-y-4">
              <Link
                href="/sales/assisted-order"
                className="w-full flex items-center justify-between p-4 rounded-xl border border-teal-200 hover:border-teal-300 bg-teal-50 hover:bg-teal-100/50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-600 rounded-lg text-white">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Place Assisted Order</div>
                    <div className="text-xs text-slate-500 mt-0.5">Order on behalf of an approved shop</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/orders"
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-slate-600 border border-gray-200">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-950">Order List History</div>
                    <div className="text-xs text-slate-500 mt-0.5">Search and view all customer orders</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Recent Activity</h3>
                <p className="text-xs text-slate-500 mt-1">Latest orders registered in the system</p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1 group"
              >
                View all orders
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                  <p className="text-slate-550 text-sm font-semibold">Loading recent orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-3" />
                  <h4 className="text-sm font-semibold text-slate-500">No Orders Placed Yet</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Once orders are registered, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-6">Order Details</th>
                        <th className="py-3 px-6">Shop</th>
                        <th className="py-3 px-6">Total</th>
                        <th className="py-3 px-6">Sync Status</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {orders.map((order) => {
                        const formattedDate = new Date(order.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                        const totalVal = typeof order.final_total === "string" ? parseFloat(order.final_total) : order.final_total;

                        return (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3.5 px-6 font-semibold text-slate-900">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-teal-600">
                                  {order.order_number || `SO-PEND-${order.id}`}
                                </span>
                                <span className="text-[10px] text-slate-500">{formattedDate}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-gray-400" />
                                <span className="truncate max-w-[120px]">
                                  {shopMap[order.shop_id] || `Shop ID: ${order.shop_id}`}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                              £{totalVal.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-6">
                              {order.sage_sync_status === "pending" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Pending
                                </span>
                              )}
                              {order.sage_sync_status === "processing" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Processing
                                </span>
                              )}
                              {order.sage_sync_status === "synced" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Synced
                                </span>
                              )}
                              {order.sage_sync_status === "failed" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <Link
                                href={`/orders/${order.id}`}
                                className="inline-flex items-center gap-1 text-slate-700 hover:text-teal-600 transition-colors border border-gray-300 hover:border-teal-500/30 bg-white hover:bg-teal-50 py-1 px-2 rounded cursor-pointer font-bold shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </Link>
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

        </div>

      </div>
    </div>
  );
}
