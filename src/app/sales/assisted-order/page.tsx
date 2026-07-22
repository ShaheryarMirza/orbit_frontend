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
  PoundSterling
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

  // 2. Fetch Initial Catalog & Shop Data
  const loadInitialData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [shopsRes, productsRes, categoriesRes] = await Promise.all([
        api.get("/admin/shops", { params: { page_size: 10000, approval_status: "approved" } }),
        api.get("/products", { params: { page_size: 100000, is_active: true } }),
        api.get("/api/categories")
      ]);

      const shopList = shopsRes.data.items || [];
      const prodList = productsRes.data.items || [];
      setShops(shopList);
      setProducts(prodList);
      setCategories(categoriesRes.data || []);

      // Default quantities to 1
      const initialQtys: { [key: number]: number } = {};
      prodList.forEach((prod: Product) => {
        initialQtys[prod.id] = 1;
      });
      setQuantities(initialQtys);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load approved customer accounts or catalog products. Check server connection.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && (user?.role === "admin" || user?.role === "salesperson")) {
      loadInitialData();
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  // 3. Catalog Quantity Change
  const handleQuantityChange = (productId: number, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, val),
    }));
  };

  // 4. Cart Operations
  const handleAddToCart = (product: Product) => {
    const qtyToAdd = quantities[product.id] || 1;
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qtyToAdd;
        return updated;
      }
      return [...prev, { product, quantity: qtyToAdd }];
    });

    // Reset card quantity selection to 1
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

  // 5. Category Selection
  const handleSelectCategory = (catSlug: string | null) => {
    setSelectedCategorySlug(catSlug);
  };

  // Filter products by selected category and search query
  const query = searchQuery.toLowerCase().trim();
  const filteredProducts = products.filter((prod) => {
    // Filter by Category
    if (selectedCategorySlug) {
      const catObj = categories.find((c) => c.slug === selectedCategorySlug);
      if (catObj && prod.category_id !== catObj.id) {
        return false;
      }
    }

    // Filter by Search Query
    if (!query) return true;
    return (
      prod.product_name.toLowerCase().includes(query) ||
      prod.product_code.toLowerCase().includes(query) ||
      (prod.description && prod.description.toLowerCase().includes(query))
    );
  });

  // 6. Calculations
  const subtotal = cartItems.reduce((sum, item) => {
    const priceNum = typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price;
    return sum + (priceNum * item.quantity);
  }, 0);

  const discountValNum = parseFloat(discountValue) || 0;
  let calculatedDiscountAmount = 0;
  if (discountType === "fixed") {
    calculatedDiscountAmount = Math.min(subtotal, discountValNum);
  } else if (discountType === "percentage") {
    const pct = Math.min(100, Math.max(0, discountValNum));
    calculatedDiscountAmount = (subtotal * pct) / 100;
  }

  const netSubtotal = Math.max(0, subtotal - calculatedDiscountAmount);

  // Line-item level VAT calculation using each product's vat_rate
  const totalVat = cartItems.reduce((sum, item) => {
    const priceNum = typeof item.product.price === "string" ? parseFloat(item.product.price) : item.product.price;
    const vatRate = item.product.vat_rate !== undefined ? item.product.vat_rate : 20.0;
    const lineSubtotal = priceNum * item.quantity;
    
    // Proportional discount ratio per line item
    const lineRatio = subtotal > 0 ? lineSubtotal / subtotal : 0;
    const lineDiscount = calculatedDiscountAmount * lineRatio;
    const lineNet = Math.max(0, lineSubtotal - lineDiscount);

    return sum + (lineNet * (vatRate / 100));
  }, 0);

  const finalTotal = netSubtotal + totalVat;

  // 7. Submit Assisted Order
  const handleSubmitAssistedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!selectedShopId) {
      setError("Please select a registered customer account for this order.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Please add at least one product to the order cart.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      shop_id: Number(selectedShopId),
      items: cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        vat_rate: item.product.vat_rate !== undefined ? item.product.vat_rate : 20.0,
      })),
      discount_type: discountType || null,
      discount_value: discountType && discountValNum > 0 ? discountValNum : null,
      customer_reference: customerReference.trim() || null,
      internal_notes: internalNotes.trim() || null,
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
      setTimeout(() => {
        router.push("/orders");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create assisted order. Please check selections.");
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
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Briefcase className="w-3.5 h-3.5" />
                Staff Sales Mode • Assisted Order Terminal
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                Assisted Order Catalog
              </h1>
              <p className="text-slate-500 text-sm max-w-xl">
                Browse catalog inventory and place direct sales orders on behalf of registered B2B customer accounts.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search catalog products by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-sans"
              />
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

        {/* Main 3-Column Layout (Sidebar Category Filter + Catalog Grid + Assisted Cart Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. Sidebar Categories (3 Columns) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <Filter className="w-4 h-4 text-teal-600" />
                Filter Categories
              </h3>
              
              <div className="space-y-1.5">
                {/* All Products Option */}
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

          {/* 2. Catalog Products Grid (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredProducts.map((product) => {
                  const currentQty = quantities[product.id] || 1;
                  const priceNum = typeof product.price === "string" ? parseFloat(product.price) : product.price;
                  const vatRateVal = product.vat_rate !== undefined ? product.vat_rate : 20.0;
                  const priceIncVat = priceNum * (1 + vatRateVal / 100);

                  return (
                    <div
                      key={product.id}
                      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        {/* Product Image */}
                        <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100 relative">
                          {product.image_url ? (
                            <img
                              src={product.image_url.startsWith("http") ? product.image_url : (API_BASE_URL + product.image_url)}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                              <span className="text-[10px] font-bold uppercase font-mono tracking-wider bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                {product.product_code}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                            {product.product_code}
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-tight line-clamp-2">
                            {product.product_name}
                          </h3>
                          {product.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-normal font-normal">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Add to Cart Controls */}
                      <div className="p-4 pt-0 space-y-3">
                        <div className="flex flex-col gap-0.5 border-t border-gray-100 pt-3">
                          <span className="text-lg font-extrabold text-slate-900 flex items-baseline gap-1 font-mono">
                            £{priceNum.toFixed(2)}
                            <span className="text-[10px] text-slate-500 font-normal normal-case">ex. VAT</span>
                          </span>
                          <span className="text-xs text-teal-600 font-bold font-mono">
                            £{priceIncVat.toFixed(2)} <span className="text-[10px] text-teal-500 font-normal">inc. VAT ({vatRateVal}%)</span>
                          </span>
                        </div>

                        {/* Qty Selector & Add Button */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border border-gray-200 bg-gray-50 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, currentQty - 1)}
                              className="p-1 hover:bg-gray-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-slate-800 w-8 text-center font-mono">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, currentQty + 1)}
                              className="p-1 hover:bg-gray-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-xs font-bold shadow-xs transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add to Assisted Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Assisted Order Cart & Checkout Panel (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={handleSubmitAssistedOrder} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-teal-600" />
                  Assisted Cart & Checkout
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure customer and discount details</p>
              </div>

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
                  <div className="p-4 border border-dashed border-gray-200 rounded-2xl text-center text-slate-400 text-xs py-8">
                    No products added yet. Click "+ Add to Assisted Cart" on any catalog item.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
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
                              <span className="w-5 text-center font-bold font-mono">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                                className="p-1 text-slate-500 hover:bg-gray-100 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="font-mono font-bold text-slate-900 w-16 text-right">
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

              {/* Discount Section */}
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
                    <PoundSterling className="w-3 h-3" /> Flat (£)
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
                    <Percent className="w-3 h-3" /> Percent (%)
                  </button>
                </div>

                {discountType && (
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder={discountType === "fixed" ? "Enter discount amount in £" : "Enter percentage (e.g. 10)"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-xs font-mono"
                    />
                  </div>
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

              {/* Real-time Order Summary Calculations */}
              <div className="space-y-2.5 pt-3 border-t border-gray-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal (ex. VAT)</span>
                  <span className="font-mono font-bold text-slate-900">£{subtotal.toFixed(2)}</span>
                </div>

                {calculatedDiscountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>
                      Discount ({discountType === "percentage" ? `${discountValNum}%` : "Fixed"})
                    </span>
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
                    Creating Assisted Order...
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

      </div>
    </div>
  );
}
