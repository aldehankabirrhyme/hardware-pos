import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import POSCheckout from "./components/POSCheckout";
import InventoryManager from "./components/InventoryManager";
import AdminSettings from "./components/AdminSettings";
import AdminOrders from "./components/AdminOrders";
import CustomerLedger from "./components/CustomerLedger";
import FinanceDashboard from "./components/FinanceDashboard";
import { Sun, Moon, Laptop, Menu, X, ShoppingBag } from "lucide-react";

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StorefrontCatalog from './components/storefront/StorefrontCatalog';
import ProductDetails from './components/storefront/ProductDetails';
import CartDrawer from './components/storefront/CartDrawer';
import PrintableInvoice from './components/PrintableInvoice'; // Invoice printer/downloader component

export default function App() {
  const [user, setUser] = useState(null);

  // Persistent Active Tab State
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("pos_active_tab") || "pos";
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // E-commerce Cart State & Invoice Modal State
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [printInvoiceOrder, setPrintInvoiceOrder] = useState(null);

  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  // Theme Mode Preference: 'auto' | 'dark' | 'light'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("pos_theme_mode") || "auto";
  });

  // Resolved Dark Mode boolean based on user preference or OS listener
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("pos_theme_mode") || "auto";
    if (savedMode === "dark") return true;
    if (savedMode === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Listen to OS changes when 'auto' mode is active
  useEffect(() => {
    localStorage.setItem("pos_theme_mode", themeMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      if (themeMode === "auto") {
        setIsDarkMode(mediaQuery.matches);
      } else {
        setIsDarkMode(themeMode === "dark");
      }
    };

    updateTheme();

    if (themeMode === "auto") {
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }
  }, [themeMode]);

  // Check if user is already logged in on initial page load
  useEffect(() => {
    const savedUser = localStorage.getItem("hardware_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Save active tab selection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("pos_active_tab", activeTab);
  }, [activeTab]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("hardware_user");
    localStorage.removeItem("pos_active_tab");
    setUser(null);
  };

  // Cycle through theme modes: auto -> dark -> light -> auto
  const cycleThemeMode = () => {
    if (themeMode === "auto") setThemeMode("dark");
    else if (themeMode === "dark") setThemeMode("light");
    else setThemeMode("auto");
  };

  return (
    <Router>
      <div
        className={`min-h-screen font-sans transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}
      >
        <Routes>
          {/* --- PUBLIC STOREFRONT ROUTES (Accessible by anyone without account) --- */}
          <Route path="/store" element={
            <StorefrontCatalog 
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode} 
              onAddToCart={handleAddToCart} 
            />
          } />
          
          <Route path="/products/:id" element={
            <ProductDetails 
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode} 
              onAddToCart={handleAddToCart} 
            />
          } />

          {/* --- ADMIN / POS DASHBOARD ROUTES --- */}
          <Route path="*" element={
            !user ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <div>
                {/* Top Navbar */}
                <header
                  className={`border-b px-4 md:px-6 py-3 md:py-4 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-md ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                >
                  <div className="flex items-center justify-between w-full lg:w-auto">
                    <h1 className="text-lg md:text-xl font-bold text-amber-500">
                      Hardware Shop POS
                    </h1>

                    {/* Mobile Menu & Theme Toggle Header Controls */}
                    <div className="flex items-center gap-2 lg:hidden">
                      <button
                        onClick={cycleThemeMode}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                        title={`Current Theme Mode: ${themeMode.toUpperCase()}`}
                      >
                        {themeMode === "auto" && <Laptop className="w-4 h-4" />}
                        {themeMode === "dark" && <Moon className="w-4 h-4" />}
                        {themeMode === "light" && <Sun className="w-4 h-4" />}
                        <span className="capitalize">{themeMode}</span>
                      </button>
                      <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`p-2 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                      >
                        {mobileMenuOpen ? (
                          <X className="w-5 h-5" />
                        ) : (
                          <Menu className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <nav
                    className={`w-full lg:w-auto flex-col lg:flex-row items-center gap-1.5 p-1.5 rounded-xl border shadow-inner ${mobileMenuOpen ? "flex" : "hidden lg:flex"} ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-200 border-slate-300"}`}
                  >
                    <button
                      onClick={() => {
                        setActiveTab("pos");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full lg:w-auto px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition text-center ${activeTab === "pos" ? "bg-amber-600 text-white shadow" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                    >
                      POS Counter
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("inventory");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full lg:w-auto px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition text-center ${activeTab === "inventory" ? "bg-amber-600 text-white shadow" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                    >
                      Inventory
                    </button>

                    {user.role === "ADMIN" && (
                      <>
                        <button
                          onClick={() => {
                            setActiveTab("settings");
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full lg:w-auto px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition text-center ${activeTab === "settings" ? "bg-indigo-600 text-white shadow" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                        >
                          Admin Settings
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("orders");
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full lg:w-auto px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition text-center ${activeTab === "orders" ? "bg-indigo-600 text-white shadow" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                        >
                          Orders Management
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("customer-ledger");
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full lg:w-auto px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition text-center ${activeTab === "customer-ledger" ? "bg-emerald-600 text-white shadow" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                        >
                          Customer Ledger
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("financial-dashboard");
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full lg:w-auto px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition text-center ${activeTab === "financial-dashboard" ? "bg-teal-600 text-white shadow" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                        >
                          Financial Dashboard
                        </button>
                      </>
                    )}

                    {/* Link to public store */}
                    <Link
                      to="/store"
                      className="w-full lg:w-auto px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition text-center bg-blue-600 text-white shadow flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" /> Storefront
                    </Link>
                  </nav>

                  {/* User Info & Theme Switcher */}
                  <div className="hidden lg:flex items-center gap-3">
                    <button
                      onClick={cycleThemeMode}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300"}`}
                      title="Click to cycle: Auto -> Dark -> Light"
                    >
                      {themeMode === "auto" && <Laptop className="w-4 h-4" />}
                      {themeMode === "dark" && <Moon className="w-4 h-4" />}
                      {themeMode === "light" && <Sun className="w-4 h-4" />}
                      <span className="capitalize">Theme: {themeMode}</span>
                    </button>

                    <span className={`text-xs md:text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {user.name}{" "}
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 font-bold ml-1">
                        {user.role}
                      </span>
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-xs md:text-sm font-semibold rounded-lg border border-red-500/30 transition"
                    >
                      Logout
                    </button>
                  </div>
                </header>

                {/* Main Content Area */}
                <main className="p-3 md:p-6">
                  {activeTab === "pos" && (
                    <POSCheckout
                      currentUser={user}
                      isDarkMode={isDarkMode}
                      setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
                    />
                  )}
                  {activeTab === "inventory" && (
                    <InventoryManager
                      isDarkMode={isDarkMode}
                      setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
                    />
                  )}
                  {activeTab === "settings" && (
                    <AdminSettings
                      currentUser={user}
                      isDarkMode={isDarkMode}
                      setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
                    />
                  )}
                  {activeTab === "orders" && (
                    <AdminOrders
                      currentUser={user}
                      isDarkMode={isDarkMode}
                      setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
                    />
                  )}
                  {activeTab === "customer-ledger" && (
                    <CustomerLedger
                      currentUser={user}
                      isDarkMode={isDarkMode}
                      setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
                    />
                  )}
                  {activeTab === "financial-dashboard" && (
                    <FinanceDashboard 
                      currentUser={user}
                      isDarkMode={isDarkMode}
                      setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
                    />
                  )}
                </main>
              </div>
            )
          } />
        </Routes>

        {/* Floating Cart Drawer with Order Success Callback */}
        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cartItems={cartItems} 
          setCartItems={setCartItems}
          isDarkMode={isDarkMode}
          onOrderSuccess={(completedOrder) => {
            setPrintInvoiceOrder(completedOrder);
          }}
        />

        {/* Printable Invoice Modal for Online Customers */}
        <PrintableInvoice 
          isOpen={!!printInvoiceOrder}
          order={printInvoiceOrder}
          onClose={() => setPrintInvoiceOrder(null)}
        />
      </div>
    </Router>
  );
}