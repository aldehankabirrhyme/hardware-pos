import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Package, CheckCircle, ShieldAlert, Ruler } from 'lucide-react';

export default function ProductDetails({ onAddToCart, isDarkMode }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [customLength, setCustomLength] = useState('');
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/ecommerce/products/${id}`);
      const data = await res.json();
      setProduct(data);
      if (data.imageUrl) {
        setActiveImage(data.imageUrl);
      } else if (data.imageUrls && data.imageUrls.length > 0) {
        setActiveImage(data.imageUrls[0]);
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWithDetails = () => {
    if (!product) return;
    const cartItemData = {
      ...product,
      quantity,
      customLength: product.allowCustomLength ? Number(customLength) || 1 : null
    };
    onAddToCart(cartItemData);
  };

  if (loading) return (
    <div className={`p-12 text-center ${isDarkMode ? "text-slate-400 bg-slate-950" : "text-slate-500 bg-slate-100"} min-h-screen`}>
      Loading product details...
    </div>
  );

  if (!product) return (
    <div className={`p-12 text-center ${isDarkMode ? "text-rose-400 bg-slate-950" : "text-rose-500 bg-slate-100"} min-h-screen`}>
      Product not found.
    </div>
  );

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const allImages = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...(product.imageUrls || [])
  ];

  return (
    <div className={`min-h-screen px-4 py-8 transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      <div className="max-w-6xl mx-auto">
        <Link 
          to="/store" 
          className={`inline-flex items-center gap-2 text-xs font-semibold mb-6 transition ${isDarkMode ? "text-slate-400 hover:text-amber-400" : "text-slate-600 hover:text-amber-600"}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Storefront
        </Link>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8 rounded-3xl border shadow-sm ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className={`h-96 rounded-2xl flex items-center justify-center overflow-hidden border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              {activeImage ? (
                <img 
                  src={activeImage.startsWith('http') ? activeImage : `${backendUrl}${activeImage}`} 
                  alt={product.name} 
                  className="object-cover h-full w-full" 
                />
              ) : (
                <Package className="w-20 h-20 text-slate-500" />
              )}
            </div>

            {/* Thumbnail Gallery Row */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${activeImage === img ? 'border-amber-500 shadow-md' : isDarkMode ? 'border-slate-800 opacity-60 hover:opacity-100' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                  >
                    <img 
                      src={img.startsWith('http') ? img : `${backendUrl}${img}`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                  {product.category?.name || 'Hardware'} {product.brand ? `• ${product.brand.name}` : ''}
                </span>
                <span className={`text-xs font-mono font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  SKU: {product.sku}
                </span>
              </div>

              <h1 className={`text-2xl md:text-3xl font-bold mt-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {product.name}
              </h1>
              
              <div className="mt-4 flex items-baseline gap-3">
                <span className={`text-3xl font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                  ৳{Number(product.sellingPrice).toFixed(2)}
                </span>
                <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  per {product.unit}
                </span>
              </div>

              {/* Stock status badge */}
              <div className="mt-4 flex items-center gap-2">
                {product.stockQuantity > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> In Stock ({product.stockQuantity} {product.unit} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                    <ShieldAlert className="w-3.5 h-3.5" /> Out of Stock
                  </span>
                )}
              </div>

              <p className={`mt-6 text-xs md:text-sm leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                {product.description || 'No detailed description provided for this hardware item. High quality standard grade material suitable for construction and maintenance.'}
              </p>

              {/* Specifications */}
              <div className={`mt-6 grid grid-cols-2 gap-4 text-xs md:text-sm border-t pt-4 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                {product.size && <div><span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Size:</span> <span className="font-semibold">{product.size}</span></div>}
                {product.color && <div><span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Color:</span> <span className="font-semibold">{product.color}</span></div>}
                <div><span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Unit:</span> <span className="font-semibold">{product.unit}</span></div>
              </div>

              {/* Custom Length Input (If Enabled in Inventory) */}
              {product.allowCustomLength && (
                <div className={`mt-6 p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5 text-amber-500">
                    <Ruler className="w-4 h-4" /> Specify Custom Length / Dimension ({product.unit}):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={customLength}
                    onChange={(e) => setCustomLength(e.target.value)}
                    placeholder={`Enter required ${product.unit}...`}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart Action */}
            <div className={`mt-8 pt-4 border-t flex flex-col sm:flex-row items-center gap-4 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
              <div className={`flex items-center border rounded-xl overflow-hidden ${isDarkMode ? "border-slate-700 bg-slate-950" : "border-slate-300 bg-slate-50"}`}>
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className={`px-3.5 py-2.5 font-bold transition ${isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-200"}`}
                >-</button>
                <span className="px-4 py-2.5 font-bold text-xs">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className={`px-3.5 py-2.5 font-bold transition ${isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-200"}`}
                >+</button>
              </div>

              <button
                onClick={handleAddWithDetails}
                disabled={product.stockQuantity <= 0}
                className={`flex-1 w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition text-xs shadow ${
                  product.stockQuantity > 0
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : isDarkMode ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}