import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Upload,
  Plus,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Sun,
  Moon,
  Image as ImageIcon,
  Crop,
} from "lucide-react";
import Cropper from "react-easy-crop";
import axios from "axios";

// Helper function to create cropped image canvas blob
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = 600;
      canvas.height = 600;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        600,
        600,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        "image/webp",
        0.85,
      );
    };
    image.onerror = (error) => reject(error);
  });
};

export default function InventoryManager({ isDarkMode, setIsDarkMode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Theme State (Auto-syncs with system/device theme)
  // const [isDarkMode, setIsDarkMode] = useState(() => {
  //   const saved = localStorage.getItem('pos_theme');
  //   if (saved !== null) return saved === 'dark';
  //   return window.matchMedia('(prefers-color-scheme: dark)').matches;
  // });

  // useEffect(() => {
  //   localStorage.setItem('pos_theme', isDarkMode ? 'dark' : 'light');
  // }, [isDarkMode]);

  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // File upload state for Excel import
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Image Cropper States
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCropperModal, setShowCropperModal] = useState(false);

  // Form State for Add / Edit Product
  const initialFormState = {
    id: null,
    sku: "",
    name: "",
    size: "",
    color: "N/A",
    unit: "pieces",
    buyingPrice: "",
    sellingPrice: "",
    stockQuantity: "",
    reorderLevel: 5,
    imageUrl: null,
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Inventory Products from Database
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/inventory`,
      );
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setPreviewUrl(null);
    setCroppedImageBlob(null);
    setIsEditing(false);
    setShowProductModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product) => {
  setIsEditing(true);
  setFormData({
    id: product.id,
    sku: product.sku || '',
    name: product.name || '',
    categoryId: product.categoryId || '',
    brandId: product.brandId || '',
    size: product.size || '',
    color: product.color || '',
    unit: product.unit || 'pieces',
    buyingPrice: product.buyingPrice ?? '',
    sellingPrice: product.sellingPrice ?? '',
    stockQuantity: product.stockQuantity ?? '',
    reorderLevel: product.reorderLevel ?? 5,
    imageUrl: product.imageUrl || '',
    imageUrls: product.imageUrls || [],
    description: product.description || '',
    isPublished: product.isPublished ?? true,
    allowCustomLength: product.allowCustomLength ?? false
  });
  setPreviewUrl(product.imageUrl ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${product.imageUrl}` : '');
    setCroppedImageBlob(null);
    setIsEditing(true);
    setShowProductModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Image File Selection for Cropping
  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result);
        setShowCropperModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImageBlob(croppedBlob);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setShowCropperModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to crop image");
    }
  };

  // Submit Add or Edit Product with Image FormData
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key]);
        }
      });

      if (croppedImageBlob) {
        payload.append("image", croppedImageBlob, "product-image.webp");
      }

      const url = isEditing
        ? `${import.meta.env.VITE_API_BASE_URL}/api/inventory/${formData.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/inventory`;

      const method = isEditing ? "put" : "post";

      const res = await axios({
        method,
        url,
        data: payload,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setShowProductModal(false);
        fetchProducts();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/inventory/${id}`,
      );
      if (res.data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete product.");
    }
  };

  // Safe Search Filter Logic (never crashes on undefined/null values)
  const filteredProducts = products.filter((p) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;

    const name = p?.name ? String(p.name).toLowerCase() : "";
    const sku = p?.sku ? String(p.sku).toLowerCase() : "";

    // Safely extract brand name whether brand is an object or string
    const brandObj = p?.brand;
    const brandName =
      typeof brandObj === "object" && brandObj !== null
        ? String(brandObj.name || "").toLowerCase()
        : String(brandObj || "").toLowerCase();

    return (
      name.includes(query) || sku.includes(query) || brandName.includes(query)
    );
  });

  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= p.reorderLevel,
  ).length;

  // Handle Excel File Upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedExcelFile) return;

    setIsUploadingExcel(true);
    setStatusMessage("");

    const formDataPayload = new FormData();
    formDataPayload.append("file", selectedExcelFile);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/inventory/import-excel`,
        formDataPayload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        setStatusMessage(response.data.message);
        fetchProducts();
        setTimeout(() => {
          setShowImportModal(false);
          setStatusMessage("");
          setSelectedExcelFile(null);
        }, 1500);
      }
    } catch (error) {
      setStatusMessage(
        error.response?.data?.error || "Failed to import Excel file.",
      );
    } finally {
      setIsUploadingExcel(false);
    }
  };
  const handleBulkImagesUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  const bodyData = new FormData();
  // Field name MUST match 'images' in upload.array('images')
  files.forEach(file => bodyData.append('images', file));

  try {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    console.log('Sending upload request to:', `${backendUrl}/api/upload/product-images`);

    const res = await fetch(`${backendUrl}/api/upload/product-images`, {
      method: 'POST',
      body: bodyData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Server responded with error:', data);
      alert(`Upload error: ${data.error || 'Server error'}`);
      return;
    }

    if (data.galleryUrls) {
      setFormData(prev => ({
        ...prev,
        imageUrl: prev.imageUrl || data.thumbnailUrl,
        imageUrls: [...(prev.imageUrls || []), ...data.galleryUrls]
      }));
    }
  } catch (err) {
    console.error('Network failure during image upload:', err);
    alert('Upload failed: Could not connect to backend server.');
  }
};
  return (
    <div
      className={`min-h-screen p-4 md:p-6 font-sans transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Theme Switcher */}
        <div
          className={`flex flex-col lg:flex-row items-center justify-between p-6 rounded-2xl shadow-lg border gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-500" /> Inventory Master
              Catalog
            </h1>
            <p
              className={`text-xs md:text-sm mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Manage products, upload 1:1 ratio images, monitor stock warnings,
              and sync Excel sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"}`}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow transition text-xs md:text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Import Excel
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow transition text-xs md:text-sm"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-400 text-xs md:text-sm font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>
                <strong>{lowStockCount} items</strong> are below reorder
                threshold! Stock up to avoid checkout halts.
              </span>
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
              Reorder Warning
            </span>
          </div>
        )}

        {/* Search Bar */}
        <div
          className={`flex flex-wrap items-center justify-between p-4 rounded-xl border shadow-lg gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs md:text-sm border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
            />
          </div>
          <p
            className={`text-xs md:text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
          >
            Showing <strong>{filteredProducts.length}</strong> items
          </p>
        </div>

        {/* Product Inventory Table with Thumbnail Preview */}
        <div
          className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              Loading inventory catalog from database...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead
                  className={`border-b text-xs uppercase font-semibold ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <tr>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Brand / Color</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Buying Price</th>
                    <th className="px-4 py-3">Selling Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${isDarkMode ? "divide-slate-800 text-slate-300" : "divide-slate-100 text-slate-700"}`}
                >
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No products found in database. Click "Add Product" or
                        "Import Excel" to populate catalog.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((item) => {
                      const isLowStock =
                        item.stockQuantity <= item.reorderLevel;
                      return (
                        <tr
                          key={item.id}
                          className={`transition ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
                        >
                          {/* 1:1 Thumbnail */}
                          <td className="px-4 py-2">
                            {item.imageUrl ? (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL}${item.imageUrl}`}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-700 shadow-sm"
                              />
                            ) : (
                              <div
                                className={`w-10 h-10 rounded-lg border flex items-center justify-center ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-600" : "bg-slate-100 border-slate-300 text-slate-400"}`}
                              >
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-indigo-500 font-semibold">
                            {item.sku}
                          </td>
                          <td
                            className={`px-4 py-3.5 font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                          >
                            {item.name}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`text-xs px-2 py-0.5 rounded mr-1 ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                            >
                              {typeof item.brand === "object"
                                ? item.brand?.name
                                : item.brand || "Generic"}
                            </span>
                            {item.color && item.color !== "N/A" && (
                              <span className="text-xs text-slate-400">
                                ({item.color})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">{item.size}</td>
                          <td className="px-4 py-3.5 text-slate-400">
                            ৳{item.buyingPrice}
                          </td>
                          <td
                            className={`px-4 py-3.5 font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                          >
                            ৳{item.sellingPrice}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${isLowStock ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}
                            >
                              {item.stockQuantity} {item.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className={`p-1.5 rounded-lg transition inline-block ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white"}`}
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProduct(item.id, item.name)
                              }
                              className={`p-1.5 rounded-lg transition inline-block ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white"}`}
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`p-6 rounded-2xl w-full max-w-lg shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />{" "}
                {isEditing ? "Edit Hardware Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* --- E-Commerce & Advanced Product Settings Section --- */}
              <div className="border-b border-slate-700/50 pb-4 space-y-4">
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                  E-Commerce Storefront Settings
                </h3>

                {/* Store Visibility & Custom Length Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                  >
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPublished: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-amber-600 rounded border-slate-700 focus:ring-amber-500 bg-slate-900"
                    />
                    <label
                      htmlFor="isPublished"
                      className="text-xs font-semibold text-slate-300 cursor-pointer"
                    >
                      Publish on Public Storefront
                    </label>
                  </div>

                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                  >
                    <input
                      type="checkbox"
                      id="allowCustomLength"
                      checked={formData.allowCustomLength}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowCustomLength: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-amber-600 rounded border-slate-700 focus:ring-amber-500 bg-slate-900"
                    />
                    <label
                      htmlFor="allowCustomLength"
                      className="text-xs font-semibold text-slate-300 cursor-pointer"
                    >
                      Allow Buyer Custom Length/Size
                    </label>
                  </div>
                </div>

                {/* Rich Product Description for E-Commerce */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">
                    Web Product Description / Specifications
                  </label>
                  <textarea
                    rows="3"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleFormChange}
                    placeholder="Detailed specifications, usage instructions, or warranty details for website visitors..."
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>

                {/* Multiple Gallery Photos (Comma Separated URLs) */}
                {/* --- Multiple Image Direct Uploader --- */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">
                    Product Photos (Select Thumbnail & Gallery Images Together)
                  </label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="bulkImageUpload"
                      className="cursor-pointer bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow transition flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload Photos from Computer
                    </label>
                    <input
                      type="file"
                      id="bulkImageUpload"
                      multiple
                      accept="image/*"
                      onChange={handleBulkImagesUpload}
                      className="hidden"
                    />
                    <span className="text-xs text-slate-400">
                      {formData.imageUrls?.length
                        ? `${formData.imageUrls.length} photos uploaded`
                        : "No photos selected"}
                    </span>
                  </div>

                  {/* Image Previews & Thumbnail Selector */}
                  {formData.imageUrls && formData.imageUrls.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {formData.imageUrls.map((url, idx) => {
                        const isThumbnail = formData.imageUrl === url;
                        return (
                          <div
                            key={idx}
                            className={`relative group rounded-xl overflow-hidden border-2 ${isThumbnail ? "border-amber-500" : "border-slate-700"}`}
                          >
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${url}`}
                              alt="Product"
                              className="w-full h-20 object-cover"
                            />

                            {/* Badge indicating Primary Thumbnail */}
                            {isThumbnail ? (
                              <span className="absolute bottom-1 left-1 bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                Main
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    imageUrl: url,
                                  }))
                                }
                                className="absolute bottom-1 left-1 bg-slate-800/80 hover:bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                              >
                                Set Main
                              </button>
                            )}

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.imageUrls.filter(
                                  (_, i) => i !== idx,
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  imageUrls: updated,
                                  imageUrl:
                                    prev.imageUrl === url
                                      ? updated[0] || ""
                                      : prev.imageUrl,
                                }));
                              }}
                              className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shadow"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Primary Image Selection & 1:1 Preview */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Primary Thumbnail Image (1:1 Ratio)
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden ${isDarkMode ? "bg-slate-950 border-slate-700" : "bg-slate-100 border-slate-300"}`}
                  >
                    {previewUrl || formData.imageUrl ? (
                      <img
                        src={previewUrl || formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="productImageInput"
                        className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5"
                      >
                        <Crop className="w-4 h-4" /> Choose & Crop Image
                      </label>
                      <input
                        type="file"
                        id="productImageInput"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste image URL directly..."
                      value={formData.imageUrl || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. 6 Inch Nose Pliers"
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    SKU / Code
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleFormChange}
                    placeholder="Leave empty for auto-gen"
                    className={`w-full px-3 py-2 rounded-lg text-xs border font-mono ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleFormChange}
                    placeholder="e.g. 6 inc"
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleFormChange}
                    placeholder="e.g. Red"
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  >
                    <option value="pieces">pieces</option>
                    <option value="meter">meter</option>
                    <option value="kg">kg</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Buying Price (৳) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="buyingPrice"
                    required
                    value={formData.buyingPrice}
                    onChange={handleFormChange}
                    placeholder="140.00"
                    className={`w-full px-3 py-2 rounded-lg text-xs border font-semibold ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Selling Price (৳) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sellingPrice"
                    required
                    value={formData.sellingPrice}
                    onChange={handleFormChange}
                    placeholder="175.00"
                    className={`w-full px-3 py-2 rounded-lg text-xs border font-semibold ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Initial Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    required
                    value={formData.stockQuantity}
                    onChange={handleFormChange}
                    placeholder="25"
                    className={`w-full px-3 py-2 rounded-lg text-xs border font-semibold ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Reorder Level Warning
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleFormChange}
                    placeholder="5"
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className={`w-1/2 py-2.5 rounded-xl text-xs font-semibold border ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition flex justify-center items-center gap-2 shadow"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isEditing ? (
                    "Update Product"
                  ) : (
                    "Create Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1:1 Image Cropper Modal */}
      {showCropperModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base">
              Crop Product Image (1:1 Ratio)
            </h3>
            <div className="relative w-full h-64 bg-slate-950 rounded-xl overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCropperModal(false)}
                className="w-1/2 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel File Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`p-6 rounded-2xl w-full max-w-md shadow-2xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" /> Import
                Products from Excel
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p
              className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              Upload your <strong>Price List.xlsx</strong> or inventory CSV
              sheet to sync directly with PostgreSQL.
            </p>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center space-y-2 cursor-pointer ${isDarkMode ? "border-slate-700 bg-slate-950 hover:border-emerald-500" : "border-slate-300 bg-slate-50 hover:border-emerald-500"}`}
              >
                <Upload className="w-8 h-8 text-emerald-500 mx-auto" />
                <p
                  className={`text-xs md:text-sm font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                >
                  {selectedExcelFile
                    ? selectedExcelFile.name
                    : "Click to select Excel file here"}
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setSelectedExcelFile(e.target.files[0])}
                  className="hidden"
                  id="excelFileInput"
                />
                <label
                  htmlFor="excelFileInput"
                  className="text-xs text-indigo-500 font-semibold cursor-pointer block hover:underline"
                >
                  Browse File
                </label>
              </div>

              {statusMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {statusMessage}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className={`w-1/2 py-2.5 rounded-xl text-xs font-semibold border ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-300 text-slate-700"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedExcelFile || isUploadingExcel}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition flex justify-center items-center gap-2 shadow"
                >
                  {isUploadingExcel ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Start Importer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
