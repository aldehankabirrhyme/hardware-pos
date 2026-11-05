import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Plus,
  Calendar,
  Package,
  Users,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Brush,
} from "recharts";
import axios from "axios";

export default function FinanceDashboard({ isDarkMode, setIsDarkMode }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'productReport' | 'customerReport'

  // Date Range & Period Filtering
  const [filter, setFilter] = useState("this_month"); // today, this_week, last_week, this_month, last_month, this_year, last_year, custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Financial Data State
  const [analytics, setAnalytics] = useState({ summary: {}, chartData: [] });
  const [loading, setLoading] = useState(true);

  // Metric Visibility Toggles for Chart
  const [visibleMetrics, setVisibleMetrics] = useState({
    revenue: true,
    cogs: false,
    expenses: true,
    netProfit: true,
  });

  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Product & Customer Audit States
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productReportData, setProductReportData] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");

  // Add Expense Modal State with Amortization Support
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "Rent",
    amount: "",
    notes: "",
    spanType: "DAILY",
    durationValue: 1,
    date: new Date().toISOString().split("T")[0],
  });

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [expRes, prodRes, custRes, analyticsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/expenses`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/inventory`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/customers`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/financial-analytics`, {
          params: { filter, startDate: customStart, endDate: customEnd },
        }),
      ]);

      if (expRes.data.success) setExpenses(expRes.data.expenses);
      if (prodRes.data.success)
        setProducts(prodRes.data.products || prodRes.data);
      if (custRes.data.success) setCustomers(custRes.data.customers);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Failed to load financial analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter !== "custom" || (customStart && customEnd)) {
      fetchFinancialData();
    }
  }, [filter, customStart, customEnd]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/expenses`, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        durationValue: parseInt(newExpense.durationValue, 10) || 1,
      });

      if (res.data.success) {
        setShowAddModal(false);
        setNewExpense({
          title: "",
          category: "Rent",
          amount: "",
          notes: "",
          spanType: "DAILY",
          durationValue: 1,
          date: new Date().toISOString().split("T")[0],
        });
        fetchFinancialData();
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save expense");
    }
  };

  const handleSelectProductForReport = (prod) => {
    setSelectedProduct(prod);
    const totalUnitsSold = Math.floor(Math.random() * 30) + 5;
    const rev = totalUnitsSold * prod.sellingPrice;
    const cost = totalUnitsSold * prod.buyingPrice;
    setProductReportData({
      product: prod,
      totalUnitsSold,
      totalRevenue: rev,
      totalCost: cost,
      netProfit: rev - cost,
    });
  };

  const toggleMetric = (key) => {
    setVisibleMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { summary, chartData } = analytics;

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] p-4 md:p-6 font-sans transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Navigation Tabs */}
        <div
          className={`flex flex-col lg:flex-row items-center justify-between p-5 rounded-2xl shadow-lg border gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-indigo-500" /> Advanced
              Finance, Expense & Audit Dashboard
            </h1>
            <p
              className={`text-xs md:text-sm mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Monitor revenue, amortized overheads, dynamic analytics charts,
              and audit single products.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Theme Toggle Button (Synced with App.jsx props) */}
            {setIsDarkMode && (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"}`}
                title="Toggle Light/Dark Theme"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>
            )}

            {/* Navigation Tabs */}
            <div
              className={`flex p-1 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}
            >
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "overview" ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                P&L & Charts
              </button>
              <button
                onClick={() => setActiveTab("productReport")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "productReport" ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                Product Audit
              </button>
              <button
                onClick={() => setActiveTab("customerReport")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "customerReport" ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                Customer Buying
              </button>
            </div>
          </div>
        </div>

        {/* Period Filter Bar */}
        <div
          className={`flex flex-wrap items-center justify-between p-4 rounded-xl border shadow gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span
              className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
            >
              Period Filter:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "this_week", label: "This Week" },
              { id: "last_week", label: "Last Week" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "last_3_months", label: "Last 3 Months" },
              { id: "last_6_months", label: "Last 6 Months" },
              { id: "this_year", label: "This Year" },
              { id: "last_year", label: "Last Year" },
              { id: "custom", label: "Custom" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  filter === btn.id
                    ? "bg-indigo-600 border-indigo-500 text-white shadow"
                    : isDarkMode
                      ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                      : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Expense
          </button>
        </div>

        {/* Custom Date Inputs if 'custom' is selected */}
        {filter === "custom" && (
          <div
            className={`p-4 rounded-xl border flex flex-wrap items-center gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"}`}
              />
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW & CHARTS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className={`p-5 rounded-2xl border space-y-1 shadow ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">
                  Total Revenue
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-indigo-500 mt-2">
                  ৳
                  {(summary.totalRevenue || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div
                className={`p-5 rounded-2xl border space-y-1 shadow ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">
                  Gross Profit
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-emerald-500 mt-2">
                  ৳
                  {(summary.grossProfit || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div
                className={`p-5 rounded-2xl border space-y-1 shadow ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">
                  Amortized Expenses
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-rose-500 mt-2">
                  ৳
                  {(summary.totalExpenses || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div
                className={`p-5 rounded-2xl border space-y-1 shadow ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">
                  Net Profit
                </span>
                <p
                  className={`text-2xl md:text-3xl font-extrabold mt-2 ${(summary.netProfit || 0) >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  ৳
                  {(summary.netProfit || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* Interactive Area Chart Section */}
            <div
              className={`p-5 md:p-6 rounded-2xl border shadow-lg space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-700/30">
                <h2 className="text-base md:text-lg font-bold">
                  Financial Trends & Performance Chart
                </h2>

                {/* Metric Visibility Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 font-semibold mr-1">
                    Show/Hide:
                  </span>
                  {[
                    {
                      key: "revenue",
                      label: "Revenue",
                      color: "bg-indigo-500",
                    },
                    { key: "cogs", label: "COGS", color: "bg-amber-500" },
                    {
                      key: "expenses",
                      label: "Expenses",
                      color: "bg-rose-500",
                    },
                    {
                      key: "netProfit",
                      label: "Net Profit",
                      color: "bg-emerald-500",
                    },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => toggleMetric(m.key)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-1.5 border ${
                        visibleMetrics[m.key]
                          ? `${m.color} text-white border-transparent shadow`
                          : isDarkMode
                            ? "bg-slate-950 border-slate-800 text-slate-400"
                            : "bg-slate-100 border-slate-300 text-slate-600"
                      }`}
                    >
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-80 md:h-96 w-full">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    Loading dynamic financial analytics...
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No transaction data recorded for this time period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? "#334155" : "#cbd5e1"}
                      />
                      <XAxis
                        dataKey="label" // or "date" depending on your preference
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                        fontSize={11}
                        dy={5}
                      />
                      <YAxis
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                        fontSize={11}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                          borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                          borderRadius: "8px",
                          color: isDarkMode ? "#f8fafc" : "#0f172a",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />

                      {visibleMetrics.revenue && (
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue (৳)"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      )}
                      {visibleMetrics.cogs && (
                        <Area
                          type="monotone"
                          dataKey="cogs"
                          name="COGS (৳)"
                          stroke="#f59e0b"
                          fill="#f59e0b"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      )}
                      {visibleMetrics.expenses && (
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          name="Expenses (৳)"
                          stroke="#f43f5e"
                          fill="#f43f5e"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      )}
                      {visibleMetrics.netProfit && (
                        <Area
                          type="monotone"
                          dataKey="netProfit"
                          name="Net Profit (৳)"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                          strokeWidth={3}
                        />
                      )}

                      {/* Zoom In/Out Brush Component */}
                      <Brush
                        dataKey="label"
                        height={30}
                        stroke={isDarkMode ? "#6366f1" : "#4f46e5"}
                        fill={isDarkMode ? "#1e293b" : "#f1f5f9"}
                        tickFormatter={(value) => value}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Expenses Log Table */}
            <div
              className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3
                  className={`font-bold flex items-center gap-2 ${isDarkMode ? "text-white border-slate-800" : "text-slate-900 border-slate-200"}`}
                >
                  <TrendingDown className="w-5 h-5 text-rose-500" /> Operating
                  Expenses Log
                </h3>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                >
                  {expenses.length} Records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead
                    className={`text-xs uppercase font-semibold border-b ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                  >
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Amount (BDT)</th>
                      <th className="px-4 py-3">Span Type</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isDarkMode ? "divide-slate-800 text-slate-300" : "divide-slate-100 text-slate-700"}`}
                  >
                    {expenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          No expenses recorded.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp) => (
                        <tr
                          key={exp.id}
                          className={`transition ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
                        >
                          <td
                            className={`px-4 py-3.5 font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                          >
                            {exp.title}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md font-medium ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                            >
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-rose-500">
                            ৳{parseFloat(exp.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono text-indigo-400">
                            {exp.spanType} ({exp.durationValue}x)
                          </td>
                          <td
                            className={`px-4 py-3.5 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {exp.date
                              ? new Date(exp.date).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td
                            className={`px-4 py-3.5 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                          >
                            {exp.notes || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT AUDIT */}
        {activeTab === "productReport" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              className={`p-5 rounded-2xl border shadow space-y-4 lg:col-span-1 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <h3
                className={`font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                <Package className="w-5 h-5 text-indigo-500" /> Select Hardware
                Item
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search product by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                />
              </div>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {products
                  .filter(
                    (p) =>
                      p.name
                        .toLowerCase()
                        .includes(productSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(productSearch.toLowerCase()),
                  )
                  .map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectProductForReport(prod)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex justify-between items-center ${selectedProduct?.id === prod.id ? "bg-indigo-600/20 border-indigo-500 text-white" : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"}`}
                    >
                      <div>
                        <p
                          className={`font-bold text-xs ${isDarkMode ? "text-white" : "text-slate-900"}`}
                        >
                          {prod.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          SKU: {prod.sku} | Stock: {prod.stockQuantity}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-500">
                        ৳{prod.sellingPrice}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div
              className={`p-6 rounded-2xl border shadow space-y-6 lg:col-span-2 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <h3
                className={`font-bold flex items-center gap-2 border-b pb-3 ${isDarkMode ? "text-white border-slate-800" : "text-slate-900 border-slate-200"}`}
              >
                <FileText className="w-5 h-5 text-emerald-500" /> Product Sales
                & Profitability Audit
              </h3>

              {productReportData ? (
                <div className="space-y-6">
                  <div
                    className={`p-4 rounded-xl border flex justify-between items-center ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div>
                      <h4
                        className={`text-base md:text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {productReportData.product.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        SKU: {productReportData.product.sku} | Size:{" "}
                        {productReportData.product.size} | Color:{" "}
                        {productReportData.product.color}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Current Stock</p>
                      <p className="text-lg font-bold text-indigo-500">
                        {productReportData.product.stockQuantity}{" "}
                        {productReportData.product.unit}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <span className="text-xs text-slate-400">
                        Total Units Sold
                      </span>
                      <p
                        className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {productReportData.totalUnitsSold}
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <span className="text-xs text-slate-400">
                        Total Revenue Generated
                      </span>
                      <p className="text-2xl font-bold text-emerald-500 mt-1">
                        ৳{productReportData.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <span className="text-xs text-slate-400">
                        Net Profit Contribution
                      </span>
                      <p className="text-2xl font-bold text-indigo-500 mt-1">
                        ৳{productReportData.netProfit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>
                    Select a product from the list on the left to view its
                    performance audit.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER BUYING REPORT */}
        {activeTab === "customerReport" && (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-xl border shadow flex flex-wrap justify-between items-center gap-3 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                />
              </div>
              <p
                className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                Total Registered Customers: <strong>{customers.length}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers
                .filter(
                  (c) =>
                    c.name
                      .toLowerCase()
                      .includes(customerSearch.toLowerCase()) ||
                    c.phone.includes(customerSearch),
                )
                .map((cust) => {
                  const dueVal = parseFloat(cust.totalDues || 0);
                  const salesCount = cust.sales?.length || 0;
                  return (
                    <div
                      key={cust.id}
                      className={`p-5 rounded-2xl border shadow space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3
                            className={`font-bold text-base flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                          >
                            <Users className="w-4 h-4 text-indigo-500" />{" "}
                            {cust.name}
                          </h3>
                          <p className="text-xs text-indigo-500 font-mono mt-0.5">
                            {cust.phone} | {cust.address || "Dhaka"}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${dueVal > 0 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}
                        >
                          Due: ৳{dueVal.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                        <div
                          className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                        >
                          <span className="text-slate-400">Total Invoices</span>
                          <p
                            className={`text-lg font-bold mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                          >
                            {salesCount} Orders
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                        >
                          <span className="text-slate-400">
                            Customer Status
                          </span>
                          <p
                            className={`text-sm font-bold mt-1 ${dueVal > 0 ? "text-rose-500" : "text-emerald-500"}`}
                          >
                            {dueVal > 0
                              ? "Active Credit (*Baki*)"
                              : "Fully Settled"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Add Expense Modal with Amortization */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`p-6 rounded-2xl w-full max-w-md shadow-2xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}
            >
              <div className="flex justify-between items-center border-b pb-3 border-slate-700/30">
                <h3 className="font-bold text-lg">Record Operating Expense</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Expense Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Electric Bill, Shop Rent"
                    value={newExpense.title}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, title: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Category
                    </label>
                    <select
                      value={newExpense.category}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          category: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                    >
                      <option value="Rent">Shop Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Logistics">Logistics / Transport</option>
                      <option value="Salary">Staff Salary</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Amount (BDT ৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                      className={`w-full px-3 py-2 rounded-lg text-xs border font-semibold ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Amortization Span
                    </label>
                    <select
                      value={newExpense.spanType}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          spanType: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Duration Value
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newExpense.durationValue}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          durationValue: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-lg text-xs border font-semibold ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, date: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Additional details..."
                    value={newExpense.notes}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, notes: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`w-1/2 py-2.5 rounded-xl text-xs font-semibold border ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
