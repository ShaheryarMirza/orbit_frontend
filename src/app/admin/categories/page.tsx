"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  FolderPlus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Layers,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Check
} from "lucide-react";

interface SubCategory {
  id: number;
  category_id: number;
  name: string;
  slug: string | null;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string | null;
  is_active: boolean;
  subcategories: SubCategory[];
}

export default function AdminCategoriesPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for Category
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Form states for SubCategory
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subParentId, setSubParentId] = useState<number | "">("");
  const [isCreatingSub, setIsCreatingSub] = useState(false);

  // Edit State
  const [editingItem, setEditingItem] = useState<{
    type: "category" | "subcategory";
    id: number;
    name: string;
    slug: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to retrieve categories. Check server connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && user?.role === "admin") {
      loadCategories();
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  // 3. Slug Helper
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\-]+/g, "") // Remove all non-word chars
      .replace(/\-\-+/g, "-"); // Replace multiple - with single -
  };

  const handleCatNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCatName(val);
    setCatSlug(slugify(val));
  };

  const handleSubNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSubName(val);
    setSubSlug(slugify(val));
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  // 4. Create Operations
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;

    setIsCreatingCat(true);
    setError(null);
    try {
      await api.post("/api/categories", {
        name: catName.trim(),
        slug: catSlug.trim()
      });
      setCatName("");
      setCatSlug("");
      showSuccess("Category created successfully!");
      loadCategories();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create Category.");
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !subSlug.trim() || !subParentId) return;

    setIsCreatingSub(true);
    setError(null);
    try {
      await api.post("/api/subcategories", {
        category_id: Number(subParentId),
        name: subName.trim(),
        slug: subSlug.trim()
      });
      setSubName("");
      setSubSlug("");
      setSubParentId("");
      showSuccess("Subcategory created successfully!");
      loadCategories();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create Subcategory.");
    } finally {
      setIsCreatingSub(false);
    }
  };

  // 5. Delete Operations
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete Category "${name}"?\nAll associated subcategories will be soft-deleted too.`)) return;

    setError(null);
    try {
      await api.delete(`/api/categories/${id}`);
      showSuccess("Category deleted successfully!");
      loadCategories();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to delete category.");
    }
  };

  const handleDeleteSubcategory = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete Subcategory "${name}"?`)) return;

    setError(null);
    try {
      await api.delete(`/api/subcategories/${id}`);
      showSuccess("Subcategory deleted successfully!");
      loadCategories();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to delete subcategory.");
    }
  };

  // 6. Edit Save Operation
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim() || !editingItem.slug.trim()) return;

    setIsSavingEdit(true);
    setError(null);
    const endpoint = editingItem.type === "category" 
      ? `/api/categories/${editingItem.id}` 
      : `/api/subcategories/${editingItem.id}`;
    
    try {
      await api.put(endpoint, {
        name: editingItem.name.trim(),
        slug: editingItem.slug.trim()
      });
      setEditingItem(null);
      showSuccess(`${editingItem.type === "category" ? "Category" : "Subcategory"} updated successfully!`);
      loadCategories();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to save updates.");
    } finally {
      setIsSavingEdit(false);
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

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Back Link & Title */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <Layers className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manage Categories</h1>
              <p className="text-slate-500 text-sm mt-1">
                Configure B2B catalog categories and nested subcategories for product sorting
              </p>
            </div>
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

        {/* Categories split forms and listings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Creator Forms (Left side) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Category Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <FolderPlus className="w-4 h-4 text-teal-600" />
                Add New Category
              </h3>
              
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Industrial Tools"
                    value={catName}
                    onChange={handleCatNameChange}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Slug URL Key</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. industrial-tools"
                    value={catSlug}
                    onChange={(e) => setCatSlug(slugify(e.target.value))}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingCat}
                  className="w-full py-2.5 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCat ? "Adding..." : "Add Category"}
                </button>
              </form>
            </div>

            {/* SubCategory Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <FolderPlus className="w-4 h-4 text-teal-600" />
                Add New Subcategory
              </h3>
              
              <form onSubmit={handleCreateSubcategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Parent Category</label>
                  <select
                    required
                    value={subParentId}
                    onChange={(e) => setSubParentId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-sans"
                  >
                    <option value="">Select parent category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Subcategory Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Screwdrivers"
                    value={subName}
                    onChange={handleSubNameChange}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Slug URL Key</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. screwdrivers"
                    value={subSlug}
                    onChange={(e) => setSubSlug(slugify(e.target.value))}
                    className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingSub || categories.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingSub ? "Adding..." : "Add Subcategory"}
                </button>
              </form>
            </div>

          </div>

          {/* Tree Listing (Right side) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Category Tree View */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm min-h-[400px] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  Category Architecture Tree
                </h3>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                    <p className="text-slate-500 text-sm font-semibold">Loading category architecture...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Layers className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-500">No categories found</p>
                    <p className="text-xs text-slate-400 mt-1">Use the forms on the left to add categories and subcategories</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.id} className="border border-gray-200 bg-gray-50/30 rounded-xl overflow-hidden shadow-xs">
                        
                        {/* Parent Category Row */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/50 transition-all border-b border-gray-100">
                          <div className="flex items-center gap-2.5">
                            <ChevronDown className="w-4 h-4 text-teal-600 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-900 text-base">{category.name}</span>
                              <span className="text-xs text-slate-500 font-mono block">slug: /{category.slug}</span>
                            </div>
                          </div>

                          {/* Category Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingItem({
                                type: "category",
                                id: category.id,
                                name: category.name,
                                slug: category.slug || ""
                              })}
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Nested Subcategories */}
                        <div className="p-3 bg-white divide-y divide-gray-100">
                          {category.subcategories.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2 pl-9">No subcategories defined</p>
                          ) : (
                            category.subcategories.map((sub) => (
                              <div key={sub.id} className="flex items-center justify-between py-2.5 pl-9 pr-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <div>
                                    <span className="font-semibold text-slate-700 text-sm">{sub.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono block">slug: /{category.slug}/{sub.slug}</span>
                                  </div>
                                </div>

                                {/* Subcategory Actions */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingItem({
                                      type: "subcategory",
                                      id: sub.id,
                                      name: sub.name,
                                      slug: sub.slug || ""
                                    })}
                                    className="p-1 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-all cursor-pointer"
                                    title="Edit Subcategory"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                                    className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                                    title="Delete Subcategory"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Edit Modal Popup */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-xl relative overflow-hidden text-slate-800">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 capitalize">Edit {editingItem.type}</h3>
              <p className="text-xs text-slate-500">Update naming details and routing slug for B2B catalog sync</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    setEditingItem((prev: any) => ({
                      ...prev,
                      name: nameVal,
                      slug: slugify(nameVal)
                    }));
                  }}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Slug URL Key</label>
                <input
                  type="text"
                  required
                  value={editingItem.slug}
                  onChange={(e) => {
                    const slugVal = e.target.value;
                    setEditingItem((prev: any) => ({
                      ...prev,
                      slug: slugify(slugVal)
                    }));
                  }}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="py-2 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 py-2 px-5 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
