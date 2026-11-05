import React, { useState, useEffect } from 'react';
import { Users, Search, DollarSign, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import CustomerProfile from './CustomerProfile';

export default function CustomerLedger({ currentUser, isDarkMode, setIsDarkMode }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Navigation State to view customer profile
  const [activeCustomerId, setActiveCustomerId] = useState(null);

  // Payment Collection Modal State
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch customers with dynamic search and pagination
  const fetchCustomers = async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/customers`, {
        params: { page, limit, search: searchQuery }
      });
      if (res.data.success) {
        setCustomers(res.data.customers);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced dynamic search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCustomers(1, search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle page changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchCustomers(newPage, search);
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomerForPayment) return;

    setSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/customers/collect`, {
        customerId: selectedCustomerForPayment.id,
        amountPaid: collectAmount,
        paymentMethod,
        notes,
        userId: currentUser?.id
      });

      if (res.data.success) {
        alert(res.data.message);
        setSelectedCustomerForPayment(null);
        setCollectAmount('');
        setNotes('');
        fetchCustomers(currentPage, search);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to collect payment.');
    } finally {
      setSubmitting(false);
    }
  };

  // If a customer profile is selected, render CustomerProfile view
  if (activeCustomerId) {
    return (
      <CustomerProfile 
        customerId={activeCustomerId} 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode} 
        onBack={() => {
          setActiveCustomerId(null);
          fetchCustomers(currentPage, search);
        }} 
      />
    );
  }

  return (
    <div className={`min-h-[calc(100vh-5rem)] p-3 md:p-6 font-sans space-y-4 md:space-y-6 transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Header */}
      <div className={`p-4 md:p-6 rounded-2xl shadow-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" /> Customer Credit Ledger (*Baki*)
          </h1>
          <p className={`text-xs md:text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Click any customer row to view purchase history and payment profile.</p>
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className={`p-4 rounded-xl border shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs md:text-sm border focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
          />
        </div>
        <p className={`text-xs md:text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Total Customers Found: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{totalCount}</strong>
        </p>
      </div>

      {/* Customers Table (Responsive Card layout on mobile, Table on desktop) */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading customer ledgers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className={`border-b uppercase font-semibold text-[10px] md:text-xs ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>
                <tr>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Total Due (*Baki*)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-slate-500">No customers found matching your search.</td>
                  </tr>
                ) : (
                  customers.map(customer => {
                    const dueValue = parseFloat(customer.totalDues || 0);
                    const hasDue = dueValue > 0;
                    return (
                      <tr 
                        key={customer.id} 
                        className={`transition cursor-pointer ${isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}
                        onClick={() => setActiveCustomerId(customer.id)}
                      >
                        <td className={`px-4 py-3.5 font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {customer.name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-indigo-500">{customer.phone}</td>
                        <td className={`px-4 py-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{customer.address || 'N/A'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${hasDue ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                            ৳{dueValue.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveCustomerId(customer.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition border inline-flex items-center gap-1 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => setSelectedCustomerForPayment(customer)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow"
                          >
                            Collect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className={`p-4 border-t flex items-center justify-between gap-4 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <span className="text-xs">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border text-xs font-semibold transition disabled:opacity-30 ${isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-300 hover:bg-slate-100'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border text-xs font-semibold transition disabled:opacity-30 ${isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-300 hover:bg-slate-100'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {selectedCustomerForPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-2xl w-full max-w-md shadow-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-700/30">
              <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" /> Collect Due Payment (*Baki*)
              </h3>
              <button onClick={() => setSelectedCustomerForPayment(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
              <p className="text-xs md:text-sm font-bold">{selectedCustomerForPayment.name} ({selectedCustomerForPayment.phone})</p>
              <p className="text-xs text-rose-500 font-semibold">Current Due Balance: ৳{parseFloat(selectedCustomerForPayment.totalDues || 0).toFixed(2)}</p>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Collection Amount (৳) *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 rounded-lg text-xs md:text-sm border font-bold focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs md:text-sm border font-semibold ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                >
                  <option value="CASH">Cash</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Collection Notes / Reference</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid via bKash merchant"
                  className={`w-full px-3 py-2 rounded-lg text-xs md:text-sm border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedCustomerForPayment(null)}
                  className={`w-1/2 py-2.5 text-xs md:text-sm font-semibold rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold rounded-xl disabled:opacity-50 transition shadow"
                >
                  {submitting ? 'Recording...' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}