"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api, { API_BASE_URL } from "@/lib/api";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  Search
} from "lucide-react";

interface SubCategory {
  id: number;
  category_id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
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
  quantity: number;
  is_active: boolean;
}

interface ImportSummary {
  created: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

export default function AdminProductsPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"create" | "edit">("create");
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [productId, setProductId] = useState<number | null>(null);
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [selectedCatId, setSelectedCatId] = useState<number | "">("");
  const [selectedSubId, setSelectedSubId] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  // Image Upload state
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // 1. Auth Guard
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

  // 2. Fetch Data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products", { params: { page_size: 100 } }),
        api.get("/api/categories")
      ]);
      setProducts(productsRes.data.items || []);
      setCategories(categoriesRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load catalog products or categories. Check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && user?.role === "admin") {
      loadData();
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  // 3. Open Form handlers
  const handleOpenCreate = () => {
    setFormType("create");
    setProductId(null);
    setProductCode("");
    setProductName("");
    setDescription("");
    setPrice("");
    setQuantity("0");
    setSelectedCatId("");
    setSelectedSubId("");
    setIsActive(true);
    setImageFile(null);
    setImagePreviewUrl("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setFormType("edit");
    setProductId(product.id);
    setProductCode(product.product_code);
    setProductName(product.product_name);
    setDescription(product.description || "");
    setPrice(typeof product.price === "number" ? product.price.toString() : product.price);
    setQuantity(product.quantity.toString());
    setSelectedCatId(product.category_id || "");
    setSelectedSubId(product.subcategory_id || "");
    setIsActive(product.is_active);
    setImageFile(null);
    const imageUrl = product.image_url 
      ? (product.image_url.startsWith("http") ? product.image_url : `${API_BASE_URL}${product.image_url}`)
      : "";
    setImagePreviewUrl(imageUrl);
    setIsFormOpen(true);
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl("");
  };

  // 4. Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCode.trim() || !productName.trim() || !price) return;

    setIsSaving(true);
    setError(null);

    const payload = {
      product_code: productCode.trim(),
      product_name: productName.trim(),
      description: description.trim() || null,
      price: Number(price),
      category_id: selectedCatId ? Number(selectedCatId) : null,
      subcategory_id: selectedSubId ? Number(selectedSubId) : null,
      is_active: isActive
    };

    try {
      let savedProduct: Product;
      if (formType === "create") {
        const res = await api.post("/products", payload);
        savedProduct = res.data;
        showSuccess("Product created successfully!");
      } else {
        const res = await api.patch(`/products/${productId}`, payload);
        savedProduct = res.data;
        showSuccess("Product updated successfully!");
      }

      // Upload image if selected in the modal
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        await api.post(`/products/${savedProduct.id}/image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
      }

      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to save product details.");
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Delete Product
  const handleDeleteProduct = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete Product [${code}]?`)) return;

    setError(null);
    try {
      await api.delete(`/products/${id}`);
      showSuccess("Product deleted successfully!");
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to delete product.");
    }
  };

  // 6. Image Upload Handler
  const handleImageUpload = async (productId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploadingProductId(productId);
    setIsUploading(true);
    setError(null);
    try {
      await api.post(`/products/${productId}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      showSuccess("Product image updated successfully!");
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to upload image.");
    } finally {
      setUploadingProductId(null);
      setIsUploading(false);
    }
  };

  // 7. Bulk Import Products Handler
  const handleBulkImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setSuccess(null);
    setImportSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/products/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setImportSummary({
        created: res.data.created,
        skipped: res.data.skipped,
        errors: res.data.errors,
      });

      showSuccess(`Spreadsheet import complete! Processed ${res.data.created} products successfully.`);
      loadData(); // Refresh product list
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to import products spreadsheet. Please check columns and formatting.");
      }
    } finally {
      setIsImporting(false);
      e.target.value = ""; // Reset
    }
  };

  // Filter subcategories dynamically based on selected Category ID
  const selectedCategory = categories.find((cat) => cat.id === Number(selectedCatId));
  const availableSubcategories = selectedCategory ? selectedCategory.subcategories : [];

  // Dynamic search filtering
  const query = searchQuery.toLowerCase().trim();
  const filteredProducts = products.filter((product) => {
    if (!query) return true;

    const catLabel = categories.find((c) => c.id === product.category_id)?.name || "";
    let subLabel = "";
    for (const cat of categories) {
      const sub = cat.subcategories.find((s) => s.id === product.subcategory_id);
      if (sub) {
        subLabel = sub.name;
        break;
      }
    }

    return (
      (product.product_name?.toLowerCase() || "").includes(query) ||
      (product.product_code?.toLowerCase() || "").includes(query) ||
      catLabel.toLowerCase().includes(query) ||
      subLabel.toLowerCase().includes(query)
    );
  });

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
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center justify-center p-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-xl transition-all mr-1 text-slate-500 hover:text-slate-800 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <Package className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Inventory</h1>
              <p className="text-slate-500 text-sm mt-1">Manage B2B catalog items, stock limits, and categories</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              id="bulk-import-products"
              accept=".xlsx,.xls,.csv"
              onChange={handleBulkImportProducts}
              disabled={isImporting}
              className="hidden"
            />
            <label
              htmlFor="bulk-import-products"
              className={`flex items-center justify-center gap-2 text-sm font-semibold py-3 px-6 rounded-xl border transition-all cursor-pointer shadow-sm ${
                isImporting
                  ? "border-gray-250 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 hover:border-teal-600 bg-white text-slate-700 hover:text-teal-600"
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-650" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-teal-600" />
                  Import Products
                </>
              )}
            </label>

            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 py-3 px-6 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Import Summary Results */}
        {importSummary && (
          <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-xs space-y-3">
            <h4 className="font-bold text-slate-950 flex items-center gap-1.5 mb-1 text-sm">
              <Upload className="w-4 h-4 text-teal-600" />
              Products Import Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center font-mono">
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 rounded-xl">
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Processed (Created/Updated)</span>
                <span className="text-sm font-bold">{importSummary.created}</span>
              </div>
              <div className="bg-rose-50 text-rose-700 border border-rose-200 py-2 rounded-xl">
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Skipped / Failed</span>
                <span className="text-sm font-bold">{importSummary.errors.length}</span>
              </div>
            </div>
            {importSummary.errors.length > 0 && (
              <div className="text-rose-700 max-h-36 overflow-y-auto pt-2 border-t border-gray-200 font-mono text-[10px] leading-relaxed">
                <span className="font-bold block mb-1">Import Warnings/Errors:</span>
                {importSummary.errors.map((err, idx) => (
                  <div key={idx}>• Row {err.row}: {err.error}</div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* Sleek Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 border border-gray-200 bg-white placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm shadow-sm font-sans"
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

        {/* Products Table Card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <p className="text-slate-500 text-sm font-semibold">Loading inventory listings...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Package className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Products Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-1">
                There are currently no products in the catalog database. Click "Add Product" to create one.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Package className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Matching Products Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-1 font-medium">
                No matching products found for your search. Try adjusting your search terms or clear the query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 w-16">Image</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6 w-1/4">Description</th>
                    <th className="py-4 px-6">Category / Sub</th>
                    <th className="py-4 px-6 text-right">Price (ex. VAT)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredProducts.map((product) => {
                    const priceNum = typeof product.price === "string" ? parseFloat(product.price) : product.price;
                    const catLabel = categories.find((c) => c.id === product.category_id)?.name || "—";
                    
                    // Flattened find for subcategory
                    let subLabel = "—";
                    for (const cat of categories) {
                      const sub = cat.subcategories.find((s) => s.id === product.subcategory_id);
                      if (sub) {
                        subLabel = sub.name;
                        break;
                      }
                    }

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        
                        {/* Image & Image Upload trigger */}
                        <td className="py-4 px-6">
                          <div className="relative group/img w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center text-slate-400">
                            {product.image_url ? (
                              <img
                                src={product.image_url.startsWith("http") ? product.image_url : (API_BASE_URL + product.image_url)}
                                alt={product.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5" />
                            )}
                            <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(product.id, e)}
                                className="hidden"
                                disabled={isUploading}
                              />
                            </label>
                            {isUploading && uploadingProductId === product.id && (
                              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-teal-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-4.5 px-6 font-medium text-slate-900">
                          <div className="flex flex-col">
                            <span className="text-base text-slate-950 font-bold">{product.product_name}</span>
                            <span className="text-xs text-slate-500 font-mono mt-0.5">{product.product_code}</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-4.5 px-6 text-slate-500 max-w-xs">
                          <div className="text-xs line-clamp-2 leading-relaxed font-normal">
                            {product.description || <span className="text-slate-300 italic">No description</span>}
                          </div>
                        </td>

                        {/* Category Label */}
                        <td className="py-4.5 px-6">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="text-slate-800 font-semibold">{catLabel}</span>
                            {subLabel !== "—" && (
                              <span className="text-slate-500 italic font-mono">{subLabel}</span>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4.5 px-6 text-right font-mono font-bold text-slate-900">
                          £{priceNum.toFixed(2)}
                        </td>



                        {/* Status */}
                        <td className="py-4.5 px-6">
                          {product.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-slate-500 border border-gray-200">
                              Disabled
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.product_code)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Form Modal (Create or Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-lg space-y-6 shadow-xl relative overflow-hidden text-slate-800">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {formType === "create" ? "Add Catalog Product" : "Edit Catalog Product"}
              </h3>
              <p className="text-xs text-slate-500">Configure catalog properties, pricing, and category hierarchies</p>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Copper Wire 10m"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Product SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CW-10M"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-mono"
                  />
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Product Description</label>
                <textarea
                  placeholder="e.g. Premium quality copper wire designed for high performance electrical installations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unit Price (ex. VAT)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">£</span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Category</label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => {
                      setSelectedCatId(e.target.value ? Number(e.target.value) : "");
                      setSelectedSubId(""); // Reset subcategory when category changes
                    }}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-sans"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subcategory Dropdown (dynamically filtered by parent category selection) */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Subcategory</label>
                <select
                  disabled={!selectedCatId}
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Unassigned</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              {/* Product Picture Selection */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Product Picture</label>
                <div className="flex items-center gap-4 p-3.5 border border-gray-200 rounded-2xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {imagePreviewUrl ? (
                      <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-slate-500 font-medium">
                      {imageFile ? imageFile.name : (imagePreviewUrl ? "Existing product image loaded" : "No image selected")}
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-slate-700 text-xs font-bold shadow-sm transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        Select Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleModalFileChange}
                          className="hidden"
                        />
                      </label>
                      {imagePreviewUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-bold transition-all cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active check */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Product is active and visible in catalog shop
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-2 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 py-2 px-5 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Product
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
