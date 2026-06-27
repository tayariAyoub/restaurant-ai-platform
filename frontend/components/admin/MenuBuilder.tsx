"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  ExternalLink,
  Image as ImageIcon,
  Leaf,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/admin/AdminShell";
import { adminRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Category, MenuItem, Restaurant } from "@/lib/types";

type ToastState = { type: "success" | "error"; message: string } | null;

type CategoryDraft = {
  name: string;
  description: string;
};

type ItemDraft = {
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  allergens: string;
  is_available: boolean;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_halal: boolean;
};

const blankCategory: CategoryDraft = {
  name: "",
  description: "",
};

const blankItem: ItemDraft = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  image_url: "",
  allergens: "",
  is_available: true,
  is_vegan: false,
  is_vegetarian: false,
  is_halal: false,
};

export default function MenuBuilder({ restaurantId }: { restaurantId: number }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [savingAction, setSavingAction] = useState("");
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(blankCategory);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(blankItem);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    void loadRestaurant();
  }, [restaurantId]);

  const categories = restaurant?.categories ?? [];
  const menuItems = useMemo(
    () => categories.flatMap((category) => category.items.map((item) => ({ ...item, categoryName: category.name }))),
    [categories],
  );
  const availableCount = menuItems.filter((item) => item.is_available).length;
  const soldOutCount = menuItems.length - availableCount;

  async function loadRestaurant() {
    setLoading(true);
    setError("");
    try {
      const data = await adminRequest<Restaurant>(`/admin/restaurants/${restaurantId}`, getToken());
      setRestaurant(data);
      setItemDraft((current) => ({
        ...current,
        category_id: current.category_id || String(data.categories[0]?.id ?? ""),
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load menu builder.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshRestaurant() {
    const data = await adminRequest<Restaurant>(`/admin/restaurants/${restaurantId}`, getToken());
    setRestaurant(data);
    return data;
  }

  function updateCategoryDraft(values: Partial<CategoryDraft>) {
    setFormErrors([]);
    setToast(null);
    setCategoryDraft((current) => ({ ...current, ...values }));
  }

  function updateItemDraft(values: Partial<ItemDraft>) {
    setFormErrors([]);
    setToast(null);
    setItemDraft((current) => ({ ...current, ...values }));
  }

  function startCategoryEdit(category: Category) {
    setEditingCategory(category);
    setCategoryDraft({ name: category.name, description: category.description || "" });
    setFormErrors([]);
    setToast(null);
  }

  function cancelCategoryEdit() {
    setEditingCategory(null);
    setCategoryDraft(blankCategory);
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurant) return;
    const errors = validateCategory(categoryDraft);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setSavingAction("category");
    setToast(null);
    try {
      const payload = {
        name: categoryDraft.name.trim(),
        description: categoryDraft.description.trim(),
        sort_order: editingCategory?.sort_order ?? restaurant.categories.length,
      };
      if (editingCategory) {
        await adminRequest(`/admin/restaurants/${restaurant.id}/categories/${editingCategory.id}`, getToken(), {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setToast({ type: "success", message: "Category saved." });
      } else {
        await adminRequest(`/admin/restaurants/${restaurant.id}/categories`, getToken(), {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setToast({ type: "success", message: "Category created." });
      }
      setCategoryDraft(blankCategory);
      setEditingCategory(null);
      await refreshRestaurant();
    } catch (saveError) {
      setToast({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Could not save category.",
      });
    } finally {
      setSavingAction("");
    }
  }

  async function deleteCategory(category: Category) {
    if (!restaurant) return;
    const shouldDelete = window.confirm(`Delete "${category.name}" and all dishes inside it?`);
    if (!shouldDelete) return;

    setSavingAction(`category-${category.id}`);
    setToast(null);
    try {
      await adminRequest(`/admin/restaurants/${restaurant.id}/categories/${category.id}`, getToken(), { method: "DELETE" });
      if (editingCategory?.id === category.id) cancelCategoryEdit();
      setToast({ type: "success", message: "Category deleted." });
      await refreshRestaurant();
    } catch (deleteError) {
      setToast({
        type: "error",
        message: deleteError instanceof Error ? deleteError.message : "Could not delete category.",
      });
    } finally {
      setSavingAction("");
    }
  }

  function startItemEdit(item: MenuItem) {
    setEditingItem(item);
    setItemDraft({
      category_id: String(item.category_id),
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      image_url: item.image_url || "",
      allergens: item.allergens || "",
      is_available: item.is_available,
      is_vegan: item.is_vegan,
      is_vegetarian: item.is_vegetarian,
      is_halal: item.is_halal,
    });
    setFormErrors([]);
    setToast(null);
  }

  function resetItemForm(nextRestaurant = restaurant) {
    setEditingItem(null);
    setItemDraft({ ...blankItem, category_id: String(nextRestaurant?.categories[0]?.id ?? "") });
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurant) return;
    const errors = validateItem(itemDraft, restaurant.categories.length > 0);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setSavingAction("item");
    setToast(null);
    try {
      const payload = {
        category_id: Number(itemDraft.category_id),
        name: itemDraft.name.trim(),
        description: itemDraft.description.trim(),
        price: Number(itemDraft.price),
        image_url: itemDraft.image_url.trim(),
        allergens: itemDraft.allergens.trim(),
        is_available: itemDraft.is_available,
        is_vegan: itemDraft.is_vegan,
        is_vegetarian: itemDraft.is_vegetarian,
        is_halal: itemDraft.is_halal,
      };
      if (editingItem) {
        await adminRequest(`/admin/restaurants/${restaurant.id}/menu-items/${editingItem.id}`, getToken(), {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setToast({ type: "success", message: "Menu item saved." });
      } else {
        await adminRequest(`/admin/restaurants/${restaurant.id}/menu-items`, getToken(), {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setToast({ type: "success", message: "Menu item created." });
      }
      const nextRestaurant = await refreshRestaurant();
      resetItemForm(nextRestaurant);
    } catch (saveError) {
      setToast({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Could not save menu item.",
      });
    } finally {
      setSavingAction("");
    }
  }

  async function deleteItem(item: MenuItem) {
    if (!restaurant) return;
    const shouldDelete = window.confirm(`Delete "${item.name}" from the menu?`);
    if (!shouldDelete) return;

    setSavingAction(`item-${item.id}`);
    setToast(null);
    try {
      await adminRequest(`/admin/restaurants/${restaurant.id}/menu-items/${item.id}`, getToken(), { method: "DELETE" });
      if (editingItem?.id === item.id) resetItemForm();
      setToast({ type: "success", message: "Menu item deleted." });
      await refreshRestaurant();
    } catch (deleteError) {
      setToast({
        type: "error",
        message: deleteError instanceof Error ? deleteError.message : "Could not delete menu item.",
      });
    } finally {
      setSavingAction("");
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <MenuBuilderSkeleton />
      </AdminShell>
    );
  }

  if (error || !restaurant) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">{error || "Restaurant not found."}</div>
      </AdminShell>
    );
  }

  const primary = restaurant.primary_color || restaurant.theme?.primary_color || "#c84b31";
  const saving = Boolean(savingAction);

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-600">Visual Menu Builder</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{restaurant.name} menu</h1>
            <p className="mt-3 max-w-3xl text-slate-500">
              Build categories, dishes, prices, availability, and dietary clarity in one focused workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/builder/${restaurant.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm">
              <ArrowLeft size={16} /> Back to Visual Builder
            </Link>
            <Link href={`/restaurants/${restaurant.slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm">
              <ExternalLink size={16} /> Open public site
            </Link>
          </div>
        </header>

        {toast && <MessageBanner type={toast.type} message={toast.message} />}
        {formErrors.length > 0 && <ValidationBanner errors={formErrors} />}

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-3xl border border-black/5 bg-slate-950 p-5 text-white shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500">
                  <UtensilsCrossed size={23} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Menu health</p>
                  <h2 className="text-2xl font-semibold">{menuItems.length} dishes</h2>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                <Metric label="Categories" value={categories.length} />
                <Metric label="Available" value={availableCount} />
                <Metric label="Sold out" value={soldOutCount} />
              </div>
            </section>

            <form onSubmit={saveCategory} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <SectionHeader
                icon={editingCategory ? Pencil : Plus}
                title={editingCategory ? "Edit category" : "Create category"}
                copy="Keep categories simple: guests should understand the menu in seconds."
              />
              <div className="mt-5 space-y-4">
                <TextField
                  label="Category name"
                  value={categoryDraft.name}
                  placeholder="Starters"
                  onChange={(name) => updateCategoryDraft({ name })}
                  required
                />
                <TextField
                  label="Category description"
                  value={categoryDraft.description}
                  placeholder="Small plates to begin"
                  onChange={(description) => updateCategoryDraft({ description })}
                />
              </div>
              <div className="mt-5 flex gap-2">
                {editingCategory && (
                  <button type="button" onClick={cancelCategoryEdit} className="grid h-12 w-12 place-items-center rounded-xl border bg-white text-slate-500" aria-label="Cancel category edit">
                    <X size={18} />
                  </button>
                )}
                <button disabled={saving} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {savingAction === "category" ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {editingCategory ? "Save category" : "Create category"}
                </button>
              </div>
            </form>

            <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <p className="font-semibold">Deferred fields</p>
              <p className="mt-2">
                Gluten-free, spicy, chef recommendation, and drag/drop item ordering need backend fields before they can be added safely.
              </p>
            </section>
          </aside>

          <main className="space-y-6">
            <MenuItemForm
              restaurant={restaurant}
              itemDraft={itemDraft}
              editingItem={editingItem}
              saving={saving}
              savingAction={savingAction}
              primary={primary}
              onChange={updateItemDraft}
              onSubmit={saveItem}
              onCancel={() => resetItemForm()}
            />

            {categories.length === 0 ? (
              <EmptyState
                title="No menu categories yet"
                description="Create a category first, then add dishes inside it."
              />
            ) : (
              categories.map((category) => (
                <section key={category.id} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Category</p>
                      <h2 className="mt-1 text-3xl font-semibold">{category.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{category.description || "No description yet."}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startCategoryEdit(category)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"
                        aria-label={`Edit category ${category.name}`}
                      >
                        <Pencil size={15} /> Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(category)}
                        disabled={saving}
                        className="grid h-11 w-11 place-items-center rounded-xl border bg-white text-red-600 disabled:opacity-50"
                        aria-label={`Delete ${category.name}`}
                      >
                        {savingAction === `category-${category.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  {category.items.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
                      No items in this category yet.
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-4">
                      {category.items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          categoryName={category.name}
                          primary={primary}
                          saving={saving}
                          savingAction={savingAction}
                          onEdit={() => startItemEdit(item)}
                          onDelete={() => deleteItem(item)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </main>

          <aside className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:self-start">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Public preview</p>
                <h2 className="text-xl font-semibold">Guest menu scan</h2>
              </div>
              <ChefHat className="text-orange-500" size={22} />
            </div>
            <MenuPreview restaurant={restaurant} primary={primary} />
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

function MenuItemForm({
  restaurant,
  itemDraft,
  editingItem,
  saving,
  savingAction,
  primary,
  onChange,
  onSubmit,
  onCancel,
}: {
  restaurant: Restaurant;
  itemDraft: ItemDraft;
  editingItem: MenuItem | null;
  saving: boolean;
  savingAction: string;
  primary: string;
  onChange: (values: Partial<ItemDraft>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          icon={editingItem ? Pencil : Sparkles}
          title={editingItem ? "Edit menu item" : "Create menu item"}
          copy="Use concise copy, clear pricing, and availability that matches the kitchen."
        />
        {editingItem && (
          <button type="button" onClick={onCancel} className="grid h-11 w-11 place-items-center rounded-xl border text-slate-500" aria-label="Cancel item edit">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_220px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Category <span className="text-orange-600">*</span>
            <select
              value={itemDraft.category_id}
              onChange={(event) => onChange({ category_id: event.target.value })}
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-sm sm:text-sm"
              required
            >
              <option value="">Choose category</option>
              {restaurant.categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <TextField label="Item name" value={itemDraft.name} placeholder="Burrata Pugliese" onChange={(name) => onChange({ name })} required />
          <TextField label="Price" type="number" value={itemDraft.price} placeholder="12.50" onChange={(price) => onChange({ price })} required />
          <TextField label="Allergens" value={itemDraft.allergens} placeholder="Gluten, milk, nuts" onChange={(allergens) => onChange({ allergens })} />
          <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
            Description
            <textarea
              value={itemDraft.description}
              onChange={(event) => onChange({ description: event.target.value })}
              placeholder="Ingredients, texture, portion, spice level, or serving style."
              className="min-h-28 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal leading-7 text-slate-900 shadow-sm sm:text-sm"
            />
          </label>
          <TextField label="Food image URL" value={itemDraft.image_url} placeholder="https://..." onChange={(image_url) => onChange({ image_url })} />
          <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm sm:col-span-2">
            <p className="font-semibold text-slate-700">Availability and dietary tags</p>
            <div className="flex flex-wrap gap-3">
              <CheckToggle label="Available today" checked={itemDraft.is_available} onChange={(is_available) => onChange({ is_available })} />
              <CheckToggle label="Vegan" checked={itemDraft.is_vegan} onChange={(is_vegan) => onChange({ is_vegan })} />
              <CheckToggle label="Vegetarian" checked={itemDraft.is_vegetarian} onChange={(is_vegetarian) => onChange({ is_vegetarian })} />
              <CheckToggle label="Halal" checked={itemDraft.is_halal} onChange={(is_halal) => onChange({ is_halal })} />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <ImagePreview src={itemDraft.image_url} fallbackText="Food image preview" />
          {itemDraft.image_url && (
            <button type="button" onClick={() => onChange({ image_url: "" })} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-red-600">
              <X size={15} /> Clear image URL
            </button>
          )}
          <button
            disabled={saving || restaurant.categories.length === 0}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            {savingAction === "item" ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            {editingItem ? "Save item" : "Create item"}
          </button>
        </div>
      </div>
    </form>
  );
}

function MenuItemCard({
  item,
  categoryName,
  primary,
  saving,
  savingAction,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  categoryName: string;
  primary: string;
  saving: boolean;
  savingAction: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:grid-cols-[104px_1fr_auto]">
      <ImagePreview src={item.image_url} fallbackText="Dish image" compact />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">{formatCurrency(item.price)}</span>
          {!item.is_available && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Sold out</span>}
        </div>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{categoryName}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{item.description || "No description yet."}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          {item.is_vegan && <Badge icon={Leaf} label="Vegan" />}
          {item.is_vegetarian && <Badge label="Vegetarian" />}
          {item.is_halal && <Badge label="Halal" />}
          {item.allergens && <Badge label={`Allergens: ${item.allergens}`} />}
        </div>
      </div>
      <div className="flex gap-2 md:flex-col">
        <button onClick={onEdit} className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold" aria-label={`Edit ${item.name}`}>
          <Pencil size={15} /> Edit
        </button>
        <button
          onClick={onDelete}
          disabled={saving}
          className="grid h-10 w-10 place-items-center rounded-xl border bg-white text-red-600 disabled:opacity-50"
          aria-label={`Delete ${item.name}`}
        >
          {savingAction === `item-${item.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>
    </article>
  );
}

function MenuPreview({ restaurant, primary }: { restaurant: Restaurant; primary: string }) {
  const categories = restaurant.categories;
  return (
    <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
          Menu preview appears after categories are added.
        </div>
      ) : (
        categories.map((category) => (
          <section key={category.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold">{category.name}</h3>
              <span className="text-xs font-bold text-slate-400">{category.items.filter((item) => item.is_available).length} available</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">{category.description || "Prepared by the kitchen."}</p>
            <div className="mt-3 space-y-3">
              {category.items.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">No dishes yet.</p>
              ) : (
                category.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">{item.name}</p>
                      <span className="text-sm font-bold" style={{ color: primary }}>{formatCurrency(item.price)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description || "Description coming soon."}</p>
                    {!item.is_available && <p className="mt-2 text-xs font-bold text-red-600">Sold out today</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-orange-600">*</span>}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal text-slate-900 shadow-sm outline-none transition focus:border-slate-400 sm:text-sm"
      />
    </label>
  );
}

function CheckToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 font-semibold ${
        checked ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${checked ? "bg-orange-300" : "bg-slate-300"}`} />
      {label}
    </button>
  );
}

function ImagePreview({ src, fallbackText, compact = false }: { src: string; fallbackText: string; compact?: boolean }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const className = compact ? "h-24 w-24" : "h-48 w-full";
  if (!src || broken) {
    return (
      <div className={`${className} grid place-items-center rounded-2xl border border-dashed bg-white text-center text-xs font-semibold text-slate-400`}>
        <span>
          <ImageIcon className="mx-auto mb-2" size={20} />
          {broken ? "Image URL could not load" : fallbackText}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="item image preview"
      onError={() => setBroken(true)}
      className={`${className} rounded-2xl object-cover`}
      loading="lazy"
      decoding="async"
    />
  );
}

function SectionHeader({ icon: Icon, title, copy }: { icon: LucideIcon; title: string; copy: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
        <Icon size={20} />
      </span>
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <b className="block text-xl">{value}</b>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}

function Badge({ label, icon: Icon }: { label: string; icon?: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm">
      {Icon && <Icon size={12} />} {label}
    </span>
  );
}

function MessageBanner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${
        type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </div>
  );
}

function ValidationBanner({ errors }: { errors: string[] }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle size={18} /> Please fix these details.
      </div>
      <ul className="mt-3 space-y-1">
        {errors.map((error) => (
          <li key={error}>- {error}</li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed bg-white p-10 text-center shadow-sm">
      <ChefHat className="mx-auto text-slate-300" size={42} />
      <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function MenuBuilderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-3xl bg-white/75" />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr_360px]">
        <div className="h-96 animate-pulse rounded-3xl bg-white/75" />
        <div className="h-[40rem] animate-pulse rounded-3xl bg-white/75" />
        <div className="h-[34rem] animate-pulse rounded-3xl bg-white/75" />
      </div>
    </div>
  );
}

function validateCategory(draft: CategoryDraft) {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Category name is required.");
  return errors;
}

function validateItem(draft: ItemDraft, hasCategories: boolean) {
  const errors: string[] = [];
  const price = Number(draft.price);
  if (!hasCategories) errors.push("Create a category before adding menu items.");
  if (!draft.category_id) errors.push("Choose a category.");
  if (!draft.name.trim()) errors.push("Item name is required.");
  if (!draft.price.trim()) errors.push("Price is required.");
  if (Number.isNaN(price) || price < 0) errors.push("Price must be a valid positive number.");
  return errors;
}

function formatCurrency(value: string | number) {
  return `EUR ${Number(value).toFixed(2)}`;
}
