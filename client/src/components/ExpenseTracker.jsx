import React, { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Plus, Trash2, Calendar, DollarSign, PieChart, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function ExpenseTracker({ currentUser }) {
  const [report, setReport] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReportAndExpenses = async () => {
    setLoading(true);
    try {
      const [reportRes, expenseRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/daily-report?date=${selectedDate}`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/expenses`)
      ]);

      if (reportRes.data.success) {
        setReport(reportRes.data.report);
      }
      if (expenseRes.data.success) {
        setExpenses(expenseRes.data.expenses);
      }
    } catch (error) {
      console.error('Failed to load expense report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportAndExpenses();
  }, [selectedDate]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/expenses`, {
        title,
        category,
        amount,
        notes,
        userId: currentUser?.id
      });

      if (res.data.success) {
        setShowAddModal(false);
        setTitle('');
        setAmount('');
        setNotes('');
        fetchReportAndExpenses();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/expenses/${id}`);
      if (res.data.success) {
        fetchReportAndExpenses();
      }
    } catch (error) {
      alert('Failed to delete expense');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-7 h-7 text-indigo-400" /> Expense Tracking & Daily Profit Report
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Record daily shop overheads, analyze COGS, and audit net profit/loss.</p>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow transition text-sm"
          >
            <Plus className="w-4 h-4" /> Add New Expense
          </button>
        </div>
      </div>

      {/* Daily Profit Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <p className="text-2xl font-extrabold text-white mt-2">৳{parseFloat(report.totalRevenue || 0).toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">{report.totalSalesCount} transactions today</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost of Goods (COGS)</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-2">৳{parseFloat(report.totalCOGS || 0).toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">Buying price total</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <p className="text-2xl font-extrabold text-rose-400 mt-2">৳{parseFloat(report.totalExpenses || 0).toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">Shop overheads</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</span>
            <p className={`text-2xl font-extrabold mt-2 ${report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              ৳{parseFloat(report.netProfit || 0).toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">After COGS & expenses</p>
          </div>
        </div>
      )}

      {/* Expense History Table */}
      <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden space-y-4 p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-rose-400" /> Expense Log History
        </h2>

        {loading ? (
          <div className="p-6 text-center text-slate-400">Loading expense logs...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Expense Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount (৳)</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500">No expenses recorded yet.</td>
                </tr>
              ) : (
                expenses.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-bold text-white">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-rose-400">৳{parseFloat(item.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDeleteExpense(item.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-2xl w-[450px] shadow-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" /> Record New Shop Expense
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title *</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shop Rent / Electricity Bill"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Rent">Shop Rent</option>
                  <option value="Utility">Electricity & Utility</option>
                  <option value="Salary">Staff Salary</option>
                  <option value="Entertainment">Tea & Refreshments</option>
                  <option value="Transport">Transport & Carriage</option>
                  <option value="Maintenance">Shop Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (৳) *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Remarks</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid cash to landlord"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}