import React from 'react';

export default function AddExpenseModal({ showAddModal, setShowAddModal, newExpense, setNewExpense, handleAddExpense, isDarkMode }) {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`p-6 rounded-2xl w-full max-w-md shadow-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="flex justify-between items-center border-b pb-3 border-slate-700/30">
          <h3 className="font-bold text-lg">Record Operating Expense</h3>
          <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleAddExpense} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Expense Title</label>
            <input
              type="text"
              placeholder="e.g. Electric Bill, Shop Rent"
              value={newExpense.title}
              onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="Rent">Shop Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Logistics">Logistics / Transport</option>
                <option value="Salary">Staff Salary</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Expense Channel</label>
              <select
                value={newExpense.channel || 'BOTH'}
                onChange={(e) => setNewExpense({ ...newExpense, channel: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="BOTH">Both (Shared)</option>
                <option value="POS">POS In-Store</option>
                <option value="ECOMMERCE">E-Commerce</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Amortization Span</label>
              <select
                value={newExpense.spanType}
                onChange={(e) => setNewExpense({ ...newExpense, spanType: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="LIFETIME">Lifetime (Non-Amortizing)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Duration Value</label>
              <input
                type="number"
                min="1"
                disabled={newExpense.spanType === 'LIFETIME'}
                value={newExpense.spanType === 'LIFETIME' ? 1 : newExpense.durationValue}
                onChange={(e) => setNewExpense({ ...newExpense, durationValue: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-xs border font-semibold ${newExpense.spanType === 'LIFETIME' ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Amount (BDT ৳)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-xs border font-semibold ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Start Date</label>
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Additional details..."
              value={newExpense.notes}
              onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className={`w-1/2 py-2.5 rounded-xl text-xs font-semibold border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
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
  );
}