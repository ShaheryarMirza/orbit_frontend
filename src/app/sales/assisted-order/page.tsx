"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api, { API_BASE_URL } from "@/lib/api";
import {
  Loader2,
  Plus,
  Minus,
  Trash2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Building2,
  Package,
  FileText,
  Search,
  Filter,
  ShoppingCart,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Tag,
  Percent,
  PoundSterling,
  X
} from "lucide-react";

interface Shop {
  id: number;
  company_name: string;
  city: string;
  phone_number: string;
  approval_status: string;
  account_ref?: string | null;
}

interface SubCategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: SubCategory[];
}

interface Product {
  id: number;
  category_id: number | null;
  subcategory_id: number | null;
  product_code: string;
  product_name: string;
  description: string | null;
  image_url: string | null;
  price: string | number;
  vat_rate?: number;
  quantity: number;
  is_active: boolean;
}

interface AssistedCartItem {
  product: Product;
  quantity: number;
}

export default function AssistedOrderPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Catalog State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  // Checkout State
  const [selectedShopId, setSelectedShopId] = useState<number | "">("");
  const [cartItems, setCartItems] = useState<AssistedCartItem[]>([]);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage" | "">("");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [customerReference, setCustomerReference] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Cart Drawer State
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // 1. Auth Guard - Admin & Salesperson only
  useEffect(() => {
    initialize();
    setIsCheckingAuth(false);
  }, [initialize]);

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "admin" && user?.role !== "salesperson") {
      router.push("/");
    }
  }, [isCheckingAuth, isAuthenticated, user, router]);

  // 2. Fetch Initial Data
  const fetchData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [shopsRes, prodRes, catRes] = await Promise.all([
        api.get("/admin/shops"),
        api.get("/api/products?page_size=100000"),
        api.get("/api/categories")
      ]);
      const approvedShops = (shopsRes.data || []).filter((s: Shop) => s.approval_status === "approved");
      setShops(approvedShops);
      setProducts(prodRes.data.items || prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load assisted order data. Please check connectivity.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && (user?.role === "admin" || user?.role === "salesperson")) {
      fetchData();
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  // 3. Category & Quantity Handling
  const handleSelectCategory = (catSlug: string | null) => {
    setSelectedCategorySlug(catSlug);
  };

  const handleQuantityChange = (productId: number, val: number) => {
    const qty = Math.max(1, val);
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleAddToCart = (product: Product) => {
    const qtyToAdd = quantities[product.id] || 1;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qtyToAdd;
        return updated;
      }
      return [...prev, { product, quantity: qtyToAdd }];
    });
    // Reset local selector qty
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const handleUpdateCartQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // 4. Calculations
  const subtotal = cartItems.reduce((acc, item) => {
    const priceNum = typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price;
    return acc + priceNum * item.quantity;
  }, 0);

  let calculatedDiscountAmount = 0;
  const discountValNum = parseFloat(discountValue) || 0;
  if (discountType === "fixed") {
    calculatedDiscountAmount = Math.min(subtotal, discountValNum);
  } else if (discountType === "percentage") {
    calculatedDiscountAmount = subtotal * (Math.min(100, Math.max(0, discountValNum)) / 100);
  }

  const netSubtotal = Math.max(0, subtotal - calculatedDiscountAmount);

  // Dynamic VAT calculation using each product's specific vat_rate
  const totalVat = cartItems.reduce((acc, item) => {
    const priceNum = typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price;
    const vatRateVal = item.product.vat_rate !== undefined ? item.product.vat_rate : 20.0;
    const lineGross = priceNum * item.quantity;
    const ratio = subtotal > 0 ? (subtotal - calculatedDiscountAmount) / subtotal : 1;
    const lineNet = lineGross * ratio;
    return acc + lineNet * (vatRateVal / 100);
  }, 0);

  const finalTotal = netSubtotal + totalVat;
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Filter products by Category & Search
  const filteredProducts = products.filter((prod) => {
    // 1. Category Filter
    if (selectedCategorySlug) {
      const selectedCategory = categories.find((c) => c.slug === selectedCategorySlug);
      if (selectedCategory && prod.category_id !== selectedCategory.id) {
        return false;
      }
    }
    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = prod.product_name.toLowerCase().includes(q);
      const matchCode = prod.product_code.toLowerCase().includes(q);
      const matchDesc = prod.description ? prod.description.toLowerCase().includes(q) : false;
      return matchName || matchCode || matchDesc;
    }
    return true;
  });

  // 5. Submit Order Handler
  const handleSubmitAssistedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) {
      setError("Please select a customer shop account for this assisted order.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Cart is empty. Add at least one product before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      shop_id: Number(selectedShopId),
      items: cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity
      })),
      discount_type: discountType || null,
      discount_value: discountValue ? parseFloat(discountValue) : null,
      customer_reference: customerReference.trim() || null,
      internal_notes: internalNotes.trim() || null
    };

    try {
      const res = await api.post("/orders/assisted", payload);
      setSuccessMsg(`Assisted Order created successfully! Order Ref: ${res.data.order_number || `SO-${res.data.id}`}`);
      setCartItems([]);
      setCustomerReference("");
      setInternalNotes("");
      setDiscountType("");
      setDiscountValue("");
      setSelectedShopId("");
      setIsCartDrawerOpen(false);
      setTimeout(() => {
        router.push("/orders");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create assisted order.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth || !isAuthenticated || (user?.role !== "admin" && user?.role !== "salesperson")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm font-semibold">Verifying staff credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Briefcase className="w-3.5 h-3.5" />
                Staff Sales Mode • Assisted Order Terminal
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                Assisted Order Catalog
              </h1>
            </div>
            
            {/* Search Input & Cart Trigger */}
            <div className="flex items-center gap-3 w-full md:max-w-lg">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search catalog products by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-2xl shadow-sm transition-all cursor-pointer shrink-0"
              >
                <div className="relative">
                  <ShoppingCart className="w-4.5 h-4.5" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                      {totalCartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs hidden sm:inline">View Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Layout (Sidebar Category Filter + 5-Column Catalog Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. Sidebar Categories (3 Columns) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <Filter className="w-4 h-4 text-teal-600" />
                Filter Categories
              </h3>
              
              <div className="space-y-1.5">
                <button
                  onClick={() => handleSelectCategory(null)}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    !selectedCategorySlug
                      ? "bg-teal-50 text-teal-700 border border-teal-200 shadow-xs"
                      : "text-slate-600 hover:text-teal-600 hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  All Catalog Products
                </button>

                {categories.map((cat) => {
                  const isCatSelected = selectedCategorySlug === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase ${
                        isCatSelected
                          ? "bg-teal-50 text-teal-700 border border-teal-200 shadow-xs"
                          : "text-slate-600 hover:text-teal-600 hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Catalog Products Grid (9 Columns - 5 Cards per Row) */}
          <div className="lg:col-span-9 space-y-6">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border border-gray-200 rounded-3xl">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                <p className="text-slate-500 text-sm font-semibold">Loading catalog inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white border border-gray-200 rounded-3xl">
                <ShoppingBag className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">No Products Found</h3>
                <p className="text-slate-500 text-sm max-w-sm mt-1">
                  Try adjusting your search query or choosing another product category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {filteredProducts.map((product) => {
                  const currentQty = quantities[product.id] || 1;
                  const priceNum = typeof product.price === "string" ? parseFloat(product.price) : product.price;
                  const vatRateVal = product.vat_rate !== undefined ? product.vat_rate : 20.0;
                  const priceIncVat = priceNum * (1 + vatRateVal / 100);

                  return (
                    <div
                      key={product.id}
                      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Fixed-Aspect-Ratio Image Container with Object-Contain */}
                        <div className="aspect-square bg-gray-50/80 flex items-center justify-center p-3 overflow-hidden border-b border-gray-100 relative">
                          {product.image_url ? (
                            <img
                              src={product.image_url.startsWith("http") ? product.image_url : (API_BASE_URL + product.image_url)}
                              alt={product.product_name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 space-y-1">
                              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                              <span className="text-[9px] font-bold uppercase font-mono tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                {product.product_code}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3 space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                            {product.product_code}
                          </span>
                          <h3 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-2" title={product.product_name}>
                            {product.product_name}
                          </h3>
                        </div>
                      </div>

                      {/* Pricing & Add to Cart Controls */}
                      <div className="p-3 pt-0 space-y-2">
                        <div className="flex flex-col gap-0.5 border-t border-gray-100 pt-2">
                          <span className="text-sm font-extrabold text-slate-900 flex items-baseline gap-1 font-mono">
                            £{priceNum.toFixed(2)}
                            <span className="text-[9px] text-slate-500 font-normal normal-case">ex. VAT</span>
                          </span>
                          <span className="text-[10px] text-teal-600 font-bold font-mono">
                            £{priceIncVat.toFixed(2)} <span className="text-[9px] text-teal-500 font-normal">inc. VAT</span>
                          </span>
                        </div>

                        {/* Qty Selector & Add Button */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border border-gray-200 bg-gray-50 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, currentQty - 1)}
                              className="p-1 hover:bg-gray-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-slate-800 w-6 text-center font-mono">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, currentQty + 1)}
                              className="p-1 hover:bg-gray-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Floating View Cart Pill Button */}
      <button
        onClick={() => setIsCartDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-full shadow-2xl transition-all cursor-pointer hover:scale-105"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {totalCartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono border-2 border-teal-600">
              {totalCartCount}
            </span>
          )}
        </div>
        <span className="text-sm font-sans font-bold">Assisted Cart</span>
        <span className="font-mono text-sm font-extrabold border-l border-teal-500/60 pl-3">
          £{finalTotal.toFixed(2)}
        </span>
      </button>

      {/* Slide-out Cart Drawer Modal */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 text-slate-800">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/10 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-sans">Assisted Order Cart</h3>
                  <p className="text-xs text-slate-500">Review selected products and customer account</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1.5 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-gray-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSubmitAssistedOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Mandatory Customer Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  Select Customer Account <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-xs font-medium font-sans"
                >
                  <option value="">-- Choose Approved Customer Shop --</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.company_name} ({shop.account_ref || `ID: ${shop.id}`}) - {shop.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer PO Reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  Customer PO Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-8832-ASSISTED"
                  value={customerReference}
                  onChange={(e) => setCustomerReference(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-xs font-mono"
                />
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Order Items ({cartItems.length})
                </span>
                
                {cartItems.length === 0 ? (
                  <div className="p-6 border border-dashed border-gray-200 rounded-2xl text-center text-slate-400 text-xs space-y-2">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                    <p>No products added yet.</p>
                    <p className="text-[11px] text-slate-400">Click "+ Add to Cart" on any product in the catalog.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {cartItems.map((item) => {
                      const pNum = typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price;
                      const lineExVat = pNum * item.quantity;

                      return (
                        <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs gap-3">
                          <div className="flex-1 space-y-0.5">
                            <p className="font-bold text-slate-900 line-clamp-1">{item.product.product_name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {item.product.product_code} • £{pNum.toFixed(2)} ex. VAT
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-gray-300 bg-white rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                                className="p-1 text-slate-500 hover:bg-gray-100 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center font-bold font-mono text-xs">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                                className="p-1 text-slate-500 hover:bg-gray-100 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-mono font-bold text-slate-900 w-14 text-right">
                              £{lineExVat.toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(item.product.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Staff Discount */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-teal-600" />
                  Staff Discount
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType("")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      !discountType
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-white text-slate-600 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                      discountType === "fixed"
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-white text-slate-600 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <PoundSterling className="w-3 h-3" /> Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                      discountType === "percentage"
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-white text-slate-600 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Percent className="w-3 h-3" /> %
                  </button>
                </div>

                {discountType && (
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder={discountType === "fixed" ? "Enter discount amount (£)" : "Enter percentage (e.g. 10)"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-xs font-mono"
                  />
                )}
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Internal Order Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes for dispatch or accounting..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-xs font-sans"
                />
              </div>

              {/* Financial Calculations Footer */}
              <div className="space-y-2 pt-3 border-t border-gray-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal (ex. VAT)</span>
                  <span className="font-mono font-bold text-slate-900">£{subtotal.toFixed(2)}</span>
                </div>

                {calculatedDiscountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount ({discountType === "percentage" ? `${parseFloat(discountValue)}%` : "Fixed"})</span>
                    <span className="font-mono">-£{calculatedDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Net Subtotal</span>
                  <span className="font-mono font-bold text-slate-900">£{netSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Total VAT</span>
                  <span className="font-mono font-bold text-slate-900">£{totalVat.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-slate-950 border-t border-gray-200 pt-3">
                  <span>Final Total (inc. VAT)</span>
                  <span className="font-mono text-teal-600">£{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || cartItems.length === 0 || !selectedShopId}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Place Assisted Order
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
