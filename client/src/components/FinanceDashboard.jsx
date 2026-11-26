import React, { useState, useEffect } from "react";
import { DollarSign, Plus, Calendar, Sun, Moon, Layers, Store, ShoppingBag } from "lucide-react";
import axios from "axios";

import FinanceKPIs from "./finance/FinanceKPIs";
import FinanceChart from "./finance/FinanceChart";
import ExpensesTable from "./finance/ExpensesTable";
import AddExpenseModal from "./finance/AddExpenseModal";

export default function FinanceDashboard({ isDarkMode, setIsDarkMode }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'productReport' | 'customerReport'

  const [filter, setFilter] = useState("this_month");
  const [channel, setChannel] = useState("ALL"); // 'ALL' | 'POS' | 'ECOMMERCE'
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [analytics, setAnalytics] = useState({ summary: {}, chartData: [] });
  const [loading, setLoading] = useState(true);

  const [visibleMetrics, setVisibleMetrics] = useState({
    revenue: true,
    cogs: false,
    expenses: true,
    netProfit: true,
  });

  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "Rent",
    amount: "",
    channel: "BOTH",
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
          params: { filter, channel, startDate: customStart, endDate: customEnd },
        }),
      ]);

      if (expRes.data.success) setExpenses(expRes.data.expenses);
      if (prodRes.data.success) setProducts(prodRes.data.products || prodRes.data);
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
  }, [filter, channel, customStart, customEnd]);

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
          channel: "BOTH",
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

  const toggleMetric = (key) => {
    setVisibleMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { summary, chartData } = analytics;

  return (
    <div className={`min-h-[calc(100vh-5rem)] p-4 md:p-6 font-sans transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`flex flex-col lg:flex-row items-center justify-between p-5 rounded-2xl shadow-lg border gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-indigo-500" /> Advanced Finance, Expense & Audit Dashboard
            </h1>
            <p className={`text-xs md:text-sm mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Monitor revenue, amortized overheads, channel profitability, and analytics charts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Channel View Toggle */}
            <div className={`flex p-1 rounded-xl border ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
              <button
                onClick={() => setChannel("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${channel === "ALL" ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Layers className="w-3.5 h-3.5 mr-1" /> All
              </button>
              <button
                onClick={() => setChannel("POS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${channel === "POS" ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Store className="w-3.5 h-3.5 mr-1" /> POS
              </button>
              <button
                onClick={() => setChannel("ECOMMERCE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${channel === "ECOMMERCE" ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                <ShoppingBag className="w-3.5 h-3.5 mr-1" /> E-Com
              </button>
            </div>

            {setIsDarkMode && (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"}`}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Period Filter Bar */}
        <div className={`flex flex-wrap items-center justify-between p-4 rounded-xl border shadow gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>Period Filter:</span>
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
                    : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
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

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <FinanceKPIs summary={summary} isDarkMode={isDarkMode} channel={channel} />
            <FinanceChart chartData={chartData} loading={loading} visibleMetrics={visibleMetrics} toggleMetric={toggleMetric} isDarkMode={isDarkMode} />
            <ExpensesTable expenses={expenses} isDarkMode={isDarkMode} />
          </div>
        )}

        <AddExpenseModal
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          newExpense={newExpense}
          setNewExpense={setNewExpense}
          handleAddExpense={handleAddExpense}
          isDarkMode={isDarkMode}
        />

      </div>
    </div>
  );
}