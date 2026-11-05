import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, DollarSign, ShoppingBag, ArrowLeft, Calendar, Clock, PlusCircle, Sun, Moon } from 'lucide-react';
import axios from 'axios';

export default function CustomerProfile({ customerId, onBack, currentUser, isDarkMode, setIsDarkMode }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Payment Collection Modal State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomerProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/customers/${customerId}`);
      if (res.data.success) {
        setCustomer(res.data.customer);
      }
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, [customerId]);

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/customers/collect`, {
        customerId: customer.id,
        amountPaid: collectAmount,
        paymentMethod,
        notes,
        userId: currentUser?.id
      });

      if (res.data.success) {
        alert(res.data.message);
        setShowCollectModal(false);
        setCollectAmount('');
        setNotes('');
        fetchCustomerProfile(); // Refresh profile and due totals
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record payment collection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={`p-10 text-center ${isDarkMode ? 'text-slate-400 bg-slate-950 min-h-screen' : 'text-slate-600 bg-slate-100 min-h-screen'}`}>Loading customer profile...</div>;
  }

  if (!customer) {
    return <div className={`p-10 text-center ${isDarkMode ? 'text-rose-400 bg-slate-950 min-h-screen' : 'text-rose-600 bg-slate-100 min-h-screen'}`}>Customer profile not found.</div>;
  }

  const totalSpent = customer.sales.reduce(
    (acc, s) => acc + parseFloat(s.totalAmount || 0), 
    0
  );

  const currentDues = parseFloat(customer.totalDues || 0);

  return (
    <div className={`min-h-screen p-6 font-sans space-y-6 transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      
      {/* Top Navigation Bar */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border shadow-lg ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Ledger
        </button>

        <div className="flex items-center gap-3">
          {setIsDarkMode && (
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          )}

          <button
            onClick={() => setShowCollectModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow transition"
          >
            <PlusCircle className="w-4 h-4" /> Collect Due Payment (*Baki*)
          </button>
        </div>
      </div>

      {/* Customer Info Header Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-6 rounded-2xl border shadow-lg md:col-span-1 space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{customer.name}</h2>
              <p className="text-xs text-indigo-400 font-mono">{customer.phone}</p>
            </div>
          </div>

          <div className={`space-y-2 pt-2 border-t text-sm ${isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> {customer.address || 'No address provided'}</p>
            <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> Joined: {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Financial Overview Stats */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-6 rounded-2xl border shadow-lg flex flex-col justify-between ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Current Due (*Baki*)</span>
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-3xl font-extrabold ${currentDues > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                ৳{currentDues.toFixed(2)}
              </span>
              {currentDues > 0 && (
                <button 
                  onClick={() => setShowCollectModal(true)}
                  className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-bold transition"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>

          <div className={`p-6 rounded-2xl border shadow-lg flex flex-col justify-between ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Lifetime Purchases</span>
            <div className="mt-4">
              <span className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                ৳{parseFloat(totalSpent || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border shadow-lg flex flex-col justify-between ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Orders</span>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-indigo-400">
                {customer.sales.length} Invoices
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Purchase History */}
      <div className={`p-6 rounded-2xl border shadow-lg space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 border-b pb-3 ${isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
          <ShoppingBag className="w-5 h-5 text-indigo-400" /> Invoice Purchase History
        </h2>

        <div className="space-y-4">
          {customer.sales.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No purchases recorded yet.</p>
          ) : (
            customer.sales.map(sale => (
              <div key={sale.id} className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex flex-wrap items-center justify-between border-b pb-3 gap-2 ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-bold">{sale.invoiceNo}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {new Date(sale.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Payment Method: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{sale.paymentMethod}</strong></span>
                    <span className="text-emerald-500">Total: ৳{parseFloat(sale.totalAmount || 0).toFixed(2)}</span>
                    <span className="text-rose-500">Due: ৳{parseFloat(sale.dueAmount || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sale.items.map(item => (
                    <div key={item.id} className={`p-2.5 rounded-lg border flex justify-between items-center text-xs ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div>
                        <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.product?.name || 'Hardware Product'}</p>
                        <p className="text-slate-500">৳{item.unitPrice} × {item.quantity}</p>
                      </div>
                      <span className="font-bold text-indigo-400">৳{parseFloat(item.subTotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Due Payment History */}
      <div className={`p-6 rounded-2xl border shadow-lg space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 border-b pb-3 ${isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
          <DollarSign className="w-5 h-5 text-emerald-400" /> Due Collection History (*Baki* Payments)
        </h2>

        {customer.duePayments.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No due payments collected yet.</p>
        ) : (
          <div className="space-y-2">
            {customer.duePayments.map(payment => (
              <div key={payment.id} className={`p-3.5 rounded-xl border flex justify-between items-center text-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <p className="font-bold text-emerald-500">+ ৳{parseFloat(payment.amountPaid || 0).toFixed(2)} Collected</p>
                  <p className="text-xs text-slate-500">{payment.notes || 'Counter due collection'} ({payment.paymentMethod})</p>
                </div>
                <span className="text-xs text-slate-500">{new Date(payment.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Collect Due Money */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-2xl w-full max-w-md shadow-2xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-700/30">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Collect Money (*Baki*)
              </h3>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-sm font-semibold">{customer.name} ({customer.phone})</p>
              <p className="text-xs text-rose-500">Current Outstanding Due: ৳{currentDues.toFixed(2)}</p>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Collected Amount (৳) *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 rounded-lg text-sm font-semibold border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:ring-2 focus:ring-indigo-500' : 'bg-white border-slate-300 text-slate-950 focus:ring-2 focus:ring-indigo-500'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:ring-2 focus:ring-indigo-500' : 'bg-white border-slate-300 text-slate-950 focus:ring-2 focus:ring-indigo-500'}`}
                >
                  <option value="CASH">Cash</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Notes / Receipt Ref</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid via bKash personal"
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:ring-2 focus:ring-indigo-500' : 'bg-white border-slate-300 text-slate-950 focus:ring-2 focus:ring-indigo-500'}`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCollectModal(false)}
                  className={`w-1/2 py-2.5 text-sm font-semibold rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 text-slate-700'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition shadow"
                >
                  {submitting ? 'Saving...' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}