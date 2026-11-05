import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import POSCheckout from "./components/POSCheckout";
import InventoryManager from "./components/InventoryManager";
import AdminSettings from "./components/AdminSettings";
import CustomerLedger from "./components/CustomerLedger";
import FinanceDashboard from "./components/FinanceDashboard";
import { Sun, Moon, Laptop, Menu, X } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);

  // Persistent Active Tab State
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("pos_active_tab") || "pos";
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // If user is NOT logged in, show the Login page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}
    >
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

        {/* Navigation Tabs (Desktop & Responsive Collapsible Drawer for Mobile) */}
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
        </nav>

        {/* User Info, Desktop Theme Mode Switcher & Logout */}
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

          <span
            className={`text-xs md:text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
          >
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

        {/* Mobile Logout Bar */}
        <div className="flex lg:hidden items-center justify-between w-full pt-2 border-t border-slate-700/30">
          <span
            className={`text-xs font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
          >
            {user.name}{" "}
            <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full border font-bold ml-1">
              {user.role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-xs font-semibold rounded-lg border border-red-500/30 transition"
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
        {activeTab === "settings" && <AdminSettings
          currentUser={user}
          isDarkMode={isDarkMode}
          setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
        />}
        {activeTab === "customer-ledger" && <CustomerLedger
          currentUser={user}
          isDarkMode={isDarkMode}
          setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
        />}
        {activeTab === "financial-dashboard" && <FinanceDashboard 
          currentUser={user}
          isDarkMode={isDarkMode}
          setIsDarkMode={(val) => setThemeMode(val ? "dark" : "light")}
        />}
      </main>
    </div>
  );
}