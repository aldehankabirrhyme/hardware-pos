import React, { useState, useEffect } from "react";
import { ShoppingCart, Search, Package } from "lucide-react";
import { Link } from 'react-router-dom';

export default function StorefrontCatalog({ onAddToCart, isDarkMode }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/ecommerce/products`,
      );
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  if (loading)
    return (
      <div className={`p-12 text-center ${isDarkMode ? "text-slate-400 bg-slate-950" : "text-slate-500 bg-slate-100"} min-h-screen`}>
        Loading hardware store catalog...
      </div>
    );

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Hardware Store Online
            </h1>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Quality tools, building materials, and hardware delivered to your door.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools, pipes, cement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs md:text-sm ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" 
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div>
                <div className={`h-48 relative flex items-center justify-center ${isDarkMode ? "bg-slate-950" : "bg-slate-100"}`}>
                  {product.imageUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${product.imageUrl}`}
                      alt={product.name}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-slate-500" />
                  )}
                  {product.isFeatured && (
                    <span className="absolute top-2 left-2 bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                    {product.category?.name || "Hardware"}
                  </span>
                  <h3 className={`font-semibold mt-1 line-clamp-2 text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-lg font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                      ৳{Number(product.sellingPrice).toFixed(2)}
                    </span>
                    <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      per {product.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex flex-col gap-2">
                <Link
                  to={`/products/${product.id}`}
                  className={`w-full py-2 px-4 rounded-xl font-semibold text-center transition text-xs border ${
                    isDarkMode 
                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" 
                      : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  View Details
                </Link>

                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.stockQuantity <= 0}
                  className={`w-full py-2 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition text-xs shadow ${
                    product.stockQuantity > 0
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : isDarkMode ? "bg-slate-800 text-slate-600 cursor-not-allowed" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {product.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}