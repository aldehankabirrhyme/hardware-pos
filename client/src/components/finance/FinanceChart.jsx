import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Brush } from 'recharts';

export default function FinanceChart({ chartData, loading, visibleMetrics, toggleMetric, isDarkMode }) {
  const metricsList = [
    { key: 'revenue', label: 'Revenue', color: 'bg-indigo-500' },
    { key: 'cogs', label: 'COGS', color: 'bg-amber-500' },
    { key: 'expenses', label: 'Expenses', color: 'bg-rose-500' },
    { key: 'netProfit', label: 'Net Profit', color: 'bg-emerald-500' }
  ];

  return (
    <div className={`p-5 md:p-6 rounded-2xl border shadow-lg space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-700/30">
        <h2 className="text-base md:text-lg font-bold">Financial Trends & Performance Chart</h2>
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1">Show/Hide:</span>
          {metricsList.map(m => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold transition flex items-center gap-1.5 border ${
                visibleMetrics[m.key] 
                  ? `${m.color} text-white border-transparent shadow` 
                  : isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-80 md:h-96 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">Loading dynamic financial analytics...</div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">No transaction data recorded for this time period.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#cbd5e1'} />
              <XAxis dataKey="label" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={11} dy={5} />
              <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                  borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                  borderRadius: '8px',
                  color: isDarkMode ? '#f8fafc' : '#0f172a'
                }} 
              />
              <Legend verticalAlign="top" height={36} />

              {visibleMetrics.revenue && <Area type="monotone" dataKey="revenue" name="Revenue (৳)" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />}
              {visibleMetrics.cogs && <Area type="monotone" dataKey="cogs" name="COGS (৳)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />}
              {visibleMetrics.expenses && <Area type="monotone" dataKey="expenses" name="Expenses (৳)" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} strokeWidth={2} />}
              {visibleMetrics.netProfit && <Area type="monotone" dataKey="netProfit" name="Net Profit (৳)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={3} />}

              <Brush dataKey="label" height={30} stroke={isDarkMode ? '#6366f1' : '#4f46e5'} fill={isDarkMode ? '#1e293b' : '#f1f5f9'} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}