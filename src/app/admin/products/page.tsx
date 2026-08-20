'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mockData';
import { getDbDocs, setDbDoc, deleteDbDoc } from '@/lib/services/db';
import { generateAIProductViews } from '@/lib/services/aiImage';
import { useApp } from '@/context/AppContext';
import { 
  Plus, Edit, Trash2, Sparkles, Image, HardDrive, 
  RotateCw, PlusCircle, Save, X, Search 
} from 'lucide-react';

export default function AdminProductsPage() {
  const { showToast } = useApp();
  
  // State lists
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View states
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState(MOCK_CATEGORIES[0]?.id || '');
  const [material, setMaterial] = useState('stainless_steel');
  const [retailPrice, setRetailPrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [gstRate, setGstRate] = useState(18);
  const [hsnCode, setHsnCode] = useState('73239390');
  const [unit, setUnit] = useState('pcs');
  const [originalImage, setOriginalImage] = useState('https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80');
  const [description, setDescription] = useState('');

  // Specs map editing helper
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  // AI loading trackers
  const [generatingViewsMap, setGeneratingViewsMap] = useState<Record<string, boolean>>({});

  // Fetch products from Firestore on mount
  useEffect(() => {
    const fetchProducts = async () => {
      const list = await getDbDocs('products') as Product[];
      if (list.length > 0) {
        // Sort by updatedAt descending
        list.sort((a, b) => {
          const timeA = a.updatedAt?.seconds || (typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() / 1000 : 0) || 0;
          const timeB = b.updatedAt?.seconds || (typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() / 1000 : 0) || 0;
          return timeB - timeA;
        });
        setProducts(list);
      }
    };
    fetchProducts();
  }, []);

  // Fill form fields for editing
  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setIsAddMode(false);
    setName(p.name);
    setSku(p.sku);
    setCategoryId(p.categoryId);
    setMaterial(p.material);
    setRetailPrice(p.retailPrice);
    setWholesalePrice(p.wholesalePrice);
    setDiscountPrice(p.discountPrice || 0);
    setStockQuantity(p.stockQuantity);
    setGstRate(p.gstRate);
    setHsnCode(p.hsnCode);
    setUnit(p.unit);
    setOriginalImage(p.originalImage);
    setSpecs(p.specifications as Record<string, string>);
    setDescription(p.description || '');
  };

  const startAdd = () => {
    setEditingProduct(null);
    setIsAddMode(true);
    setName('');
    setSku(`ESH-${Date.now().toString().slice(-6)}`);
    setCategoryId(categories[0]?.id || 'steel-vessels');
    setMaterial('stainless_steel');
    setRetailPrice(1000);
    setWholesalePrice(700);
    setDiscountPrice(0);
    setStockQuantity(20);
    setGstRate(18);
    setHsnCode('73239390');
    setUnit('pcs');
    setOriginalImage('https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80');
    setSpecs({
      'Gauge/Thickness': '22 Gauge',
      'Dishwasher Safe': 'Yes',
      'Induction Friendly': 'No',
    });
    setDescription('');
  };

  // Add key-value spec
  const addSpecPair = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecs(prev => ({ ...prev, [newSpecKey.trim()]: newSpecValue.trim() }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecKey = (k: string) => {
    setSpecs(prev => {
      const updated = { ...prev };
      delete updated[k];
      return updated;
    });
  };

  // Submit product creation/update
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingProduct ? editingProduct.id : `prd_${Math.random().toString(36).substring(2, 9)}`;

    const updatedProduct: Product = {
      id,
      name,
      sku,
      categoryId,
      material,
      description,
      retailPrice,
      wholesalePrice,
      discountPrice: discountPrice > 0 ? discountPrice : undefined,
      stockQuantity,
      reservedStock: editingProduct ? editingProduct.reservedStock : 0,
      availableStock: stockQuantity - (editingProduct ? editingProduct.reservedStock : 0),
      lowStockThreshold: editingProduct ? editingProduct.lowStockThreshold : 5,
      minOrderQty: 1,
      wholesaleMinQty: editingProduct ? editingProduct.wholesaleMinQty : 10,
      unit,
      gstRate,
      hsnCode,
      createdAt: editingProduct ? editingProduct.createdAt : new Date(),
      updatedAt: new Date(),
      specifications: specs,
      originalImage,
      views: editingProduct ? editingProduct.views : [],
      has360: editingProduct ? editingProduct.has360 : false,
      tags: [material, categoryId],
      keywords: [name.toLowerCase(), sku.toLowerCase()],
      status: 'active',
      featured: editingProduct ? editingProduct.featured : true,
      bestseller: editingProduct ? editingProduct.bestseller : false,
    };

    try {
      // Save product to database (with local JSON fallback)
      await setDbDoc('products', id, updatedProduct);

      // Update local state list
      if (editingProduct) {
        setProducts(products.map(p => p.id === id ? updatedProduct : p));
        showToast('Product updated successfully!', 'success');
      } else {
        setProducts([updatedProduct, ...products]);
        showToast('Product created successfully!', 'success');
      }

      // Clear editor
      setEditingProduct(null);
      setIsAddMode(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to save product.', 'error');
    }
  };

  // Deletes product
  const deleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDbDoc('products', id);
        setProducts(products.filter(p => p.id !== id));
        showToast('Product deleted.', 'info');
      } catch (e) {
        console.error(e);
        showToast('Delete operation failed.', 'error');
      }
    }
  };

  // Triggers AI views generation (24 frames)
  const triggerAiViews = async (productObj: Product) => {
    setGeneratingViewsMap(prev => ({ ...prev, [productObj.id]: true }));
    showToast('AI multi-angle view generation started...', 'info');
    
    try {
      const generatedViews = await generateAIProductViews(
        productObj.id, 
        productObj.name, 
        productObj.originalImage
      );

      // Update Firestore/Local DB product metadata
      await setDbDoc('products', productObj.id, {
        ...productObj,
        views: generatedViews,
        has360: true,
        updatedAt: new Date(),
      });

      // Update local state
      setProducts(products.map(p => p.id === productObj.id ? { ...p, views: generatedViews, has360: true } : p));
      showToast(`Generated 24-angle 3D sequence for ${productObj.name}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('AI view generation failed.', 'error');
    } finally {
      setGeneratingViewsMap(prev => ({ ...prev, [productObj.id]: false }));
    }
  };

  // Google Drive image import handler removed

  // Filter products by search query
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 relative">
      
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">Products Manager</h1>
          <p className="text-xs text-stone-500 mt-0.5">Manage store products, specifications, and AI 360-degree assets</p>
        </div>

        {!editingProduct && !isAddMode && (
          <button
            onClick={startAdd}
            className="bg-copper hover:bg-copper-dark text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* 1. PRODUCT EDITOR FORM PANEL */}
      {(editingProduct || isAddMode) && (
        <form onSubmit={handleProductSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-stone-600">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              {isAddMode ? 'Add New Kitchen Product' : `Edit Product: ${editingProduct?.name}`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsAddMode(false);
              }}
              className="p-1 hover:bg-stone-50 rounded text-stone-500"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Form grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Left columns: Core inputs (3/4 width) */}
            <div className="md:col-span-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Product Title *</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">SKU Code *</label>
                  <input
                    type="text" required value={sku} onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Category *</label>
                  <select
                    value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2 py-1.5 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Material Purity *</label>
                  <select
                    value={material} onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="stainless_steel">Stainless Steel</option>
                    <option value="triply">Triply Cookware</option>
                    <option value="brass">Brass</option>
                    <option value="copper">Copper</option>
                    <option value="plastic">Plastic</option>
                    <option value="wooden">Wooden</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Stock Quantity *</label>
                  <input
                    type="number" required value={stockQuantity} onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Unit Type *</label>
                  <input
                    type="text" required value={unit} onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs, set, box"
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Retail Price (₹) *</label>
                  <input
                    type="number" required value={retailPrice} onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Discount Retail Price (₹)</label>
                  <input
                    type="number" value={discountPrice} onChange={(e) => setDiscountPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Wholesale Price (₹) *</label>
                  <input
                    type="number" required value={wholesalePrice} onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number" required value={gstRate} onChange={(e) => setGstRate(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Product Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  placeholder="Enter detailed description of dimensions, metal grades, caps, capacities, handles, induction bases..."
                />
              </div>
            </div>

            {/* Right column: Image preview & GDrive link (1/4 width) */}
            <div className="space-y-4">
              <label className="text-[10px] font-semibold text-stone-500 block mb-1">Product Photo URL</label>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center p-2">
                <img src={originalImage} alt="Form preview" className="w-full h-full object-contain" />
              </div>
              
              <input
                type="text" value={originalImage} onChange={(e) => setOriginalImage(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
              />
            </div>

          </div>

          {/* Flexible Specifications Section */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            <span className="font-bold text-stone-800 text-xs block">Flexible Technical Specifications</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[10px] font-semibold text-stone-400 block mb-1">Spec Key</label>
                <input 
                  type="text" value={newSpecKey} onChange={(e) => setNewSpecKey(e.target.value)} 
                  placeholder="e.g., Capacity, Induction Friendly"
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-400 block mb-1">Spec Value</label>
                <input 
                  type="text" value={newSpecValue} onChange={(e) => setNewSpecValue(e.target.value)} 
                  placeholder="e.g., 3 Liters, Yes"
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <button
                type="button" onClick={addSpecPair}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2 px-4 rounded text-xs cursor-pointer h-8 text-center"
              >
                Add Spec Detail
              </button>
            </div>

            {/* Render added specs keys list */}
            {Object.keys(specs).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.keys(specs).map(k => (
                  <span key={k} className="bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 font-semibold text-[10px] text-stone-700">
                    {k}: {specs[k]}
                    <button type="button" onClick={() => removeSpecKey(k)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsAddMode(false);
              }}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-copper hover:bg-copper-dark text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" /> Save Product Details
            </button>
          </div>
        </form>
      )}

      {/* 2. PRODUCT DATA LIST TABLE */}
      {!editingProduct && !isAddMode && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
          {/* List Toolbar search */}
          <div className="p-4 border-b border-stone-200 flex justify-between items-center gap-4 bg-stone-50/50">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Search products by title or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg pl-8 pr-4 py-1.5 text-xs focus:outline-none focus:border-copper"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[10px] text-stone-400 font-bold">Showing {filtered.length} products</span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-4">Image</th>
                  <th className="p-4">Product / SKU</th>
                  <th className="p-4">Material</th>
                  <th className="p-4 text-right">Retail / Wholesale</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-center">AI 360 View</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filtered.map((product) => {
                  const generating = generatingViewsMap[product.id] || false;
                  return (
                    <tr key={product.id} className="hover:bg-stone-50/50">
                      <td className="p-4">
                        <img 
                          src={product.originalImage} 
                          alt="List thumbnail" 
                          className="w-10 h-10 object-contain bg-white border border-stone-200 rounded p-0.5" 
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-stone-900 block leading-tight">{product.name}</span>
                        <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">SKU: {product.sku} | HSN: {product.hsnCode}</span>
                      </td>
                      <td className="p-4 capitalize">{product.material.replace('_', ' ')}</td>
                      <td className="p-4 text-right font-medium">
                        <span className="block text-stone-900 font-bold">₹{product.discountPrice || product.retailPrice}</span>
                        <span className="block text-[10px] text-stone-400 font-semibold">Wholesale: ₹{product.wholesalePrice}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                          product.stockQuantity <= product.lowStockThreshold 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-stone-100 text-stone-800'
                        }`}>
                          Qty: {product.stockQuantity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => triggerAiViews(product)}
                          disabled={generating}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                            product.has360 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-copper/5 text-copper border-copper/25 hover:bg-copper/15'
                          }`}
                        >
                          {generating ? (
                            <RotateCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {product.has360 ? 'Regenerate' : 'Generate AI Views'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEdit(product)}
                            className="p-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1.5 bg-stone-100 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. GOOGLE DRIVE IMPORT DRAWER REMOVED */}

    </div>
  );
}
