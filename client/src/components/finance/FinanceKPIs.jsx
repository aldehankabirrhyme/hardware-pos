import React from 'react';

export default function FinanceKPIs({ summary, isDarkMode, channel }) {
  const formatBDT = (val) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cards = [
    { 
      label: channel === 'POS' ? 'POS Revenue' : channel === 'ECOMMERCE' ? 'E-Commerce Revenue' : 'Total Revenue', 
      value: `৳${formatBDT(channel === 'POS' ? summary.totalPosRevenue : channel === 'ECOMMERCE' ? summary.totalEcommerceRevenue : summary.totalRevenue)}`, 
      color: 'text-indigo-500',
      sub: channel === 'ALL' ? `POS: ৳${formatBDT(summary.totalPosRevenue)} | E-Com: ৳${formatBDT(summary.totalEcommerceRevenue)}` : null
    },
    { label: 'Gross Profit', value: `৳${formatBDT(summary.grossProfit)}`, color: 'text-emerald-500' },
    { label: 'Amortized / Total Expenses', value: `৳${formatBDT(summary.totalExpenses)}`, color: 'text-rose-500' },
    { label: 'Net Profit', value: `৳${formatBDT(summary.netProfit)}`, color: (summary.netProfit || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className={`p-5 rounded-2xl border space-y-1 shadow ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">{card.label}</span>
          <p className={`text-2xl md:text-3xl font-extrabold mt-2 ${card.color}`}>{card.value}</p>
          {card.sub && <p className="text-[10px] text-slate-400 font-mono mt-1">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}