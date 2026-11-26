import React from 'react';
import { TrendingDown } from 'lucide-react';

export default function ExpensesTable({ expenses, isDarkMode }) {
  return (
    <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <TrendingDown className="w-5 h-5 text-rose-500" /> Operating Expenses Log
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
          {expenses.length} Records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`text-xs uppercase font-semibold border-b ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount (BDT)</th>
              <th className="px-4 py-3">Span Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
            {expenses.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-500">No expenses recorded.</td></tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className={`transition ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                  <td className={`px-4 py-3.5 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{exp.title}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{exp.category}</span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-rose-500">৳{parseFloat(exp.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-indigo-400">{exp.spanType} ({exp.durationValue}x)</td>
                  <td className={`px-4 py-3.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}</td>
                  <td className={`px-4 py-3.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{exp.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}