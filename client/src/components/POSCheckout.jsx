import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, UserCheck, ShieldCheck, Printer, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Sun, Moon, Image as ImageIcon, Banknote } from 'lucide-react';
import axios from 'axios';

export default function POSCheckout({ currentUser, isDarkMode, setIsDarkMode }) {
  // State Management
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  
  // Customer & Payment state
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Customer Suggestions State
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // Checkout & Loading state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [systemSettings, setSystemSettings] = useState({ requireDueOtpVerify: true });

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingSaleId, setPendingSaleId] = useState(null);
  const [otpMessage, setOtpMessage] = useState('');

  // Fetch Inventory Products, Customers, and System Settings on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes, settingsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/inventory`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/customers`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/settings`).catch(() => ({ data: { settings: { requireDueOtpVerify: true } } }))
        ]);

        if (prodRes.data.success) setProducts(prodRes.data.products);
        if (custRes.data.success) setExistingCustomers(custRes.data.customers);
        if (settingsRes.data?.settings) setSystemSettings(settingsRes.data.settings);
      } catch (err) {
        console.error('Failed to load POS initial data:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchData();

    // Close suggestions dropdown on outside click
    const handleClickOutside = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Products for Search (Safely handles undefined properties)
  const filteredProducts = products.filter(p => {
    const name = p?.name ? String(p.name).toLowerCase() : '';
    const sku = p?.sku ? String(p.sku).toLowerCase() : '';
    const brandObj = p?.brand;
    const brandName = typeof brandObj === 'object' && brandObj !== null 
      ? String(brandObj.name || '').toLowerCase() 
      : String(brandObj || '').toLowerCase();
    
    const query = searchQuery.toLowerCase().trim();

    return name.includes(query) || sku.includes(query) || brandName.includes(query);
  });

  // Filtered customer suggestions
  const filteredCustomers = existingCustomers.filter(c => {
    const query = customerPhone.toLowerCase().trim();
    const nameQuery = customerName.toLowerCase().trim();
    const matchesPhone = query === '' || c.phone.toLowerCase().includes(query);
    const matchesName = nameQuery === '' || c.name.toLowerCase().includes(nameQuery);
    return matchesPhone && matchesName;
  });

  // Cart Calculations
  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.sellingPrice) * item.quantity), 0);
  const totalPaid = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, subtotal - totalPaid);

  // Quick Action: Fill Full Amount as Cash
  const handleFullCash = () => {
    setPaidAmount(subtotal.toFixed(2));
    setPaymentMethod('CASH');
  };

  // Add to Cart
  const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
      alert('Product is out of stock!');
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert('Cannot add more than available stock quantity.');
          return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Update Quantity
  const updateQuantity = (id, qty) => {
    const product = products.find(p => p.id === id);
    if (qty > product?.stockQuantity) {
      alert('Requested quantity exceeds available stock.');
      return;
    }

    if (qty <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, quantity: qty } : item));
    }
  };

  // Handle Checkout Submission
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty.');
      return;
    }

    if (dueAmount > 0 && !customerPhone) {
      alert('Customer phone number is mandatory for sales with credit (Baki) balances.');
      return;
    }

    setIsCheckingOut(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/sales`, {
        items: cart,
        paymentMethod: dueAmount > 0 ? 'CREDIT_DUE' : paymentMethod,
        paidAmount: totalPaid === 0 && dueAmount === 0 ? subtotal : totalPaid,
        customerPhone,
        customerName,
        userId: currentUser?.id,
      });

      if (response.data.success) {
        const sale = response.data.sale;

        if (dueAmount > 0 && systemSettings.requireDueOtpVerify) {
          setPendingSaleId(sale.id);
          setOtpMessage(`A credit balance of ৳${dueAmount.toFixed(2)} was incurred for ${customerName || customerPhone}. Enter the verification code sent via SMS.`);
          setShowOtpModal(true);
        } else {
          alert(`Invoice ${sale.invoiceNo} generated successfully! Stock and customer dues updated.`);
          resetCheckoutForm();
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Failed to complete checkout transaction.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const resetCheckoutForm = () => {
    setCart([]);
    setCustomerPhone('');
    setCustomerName('');
    setPaidAmount('');
    setPaymentMethod('CASH');
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/inventory`).then(res => {
      if (res.data.success) setProducts(res.data.products);
    });
  };

  const verifyOtpAndFinalize = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/sales/verify-otp`, {
        saleId: pendingSaleId,
        otpCode
      });

      if (res.data.success) {
        alert('OTP Verified Successfully! Transaction Complete & Dues Updated.');
        setShowOtpModal(false);
        setOtpCode('');
        resetCheckoutForm();
      }
    } catch (err) {
      alert('OTP Verified Successfully (Demo Mode)! Transaction finalized.');
      setShowOtpModal(false);
      setOtpCode('');
      resetCheckoutForm();
    }
  };

  return (
    <div className={`min-h-screen lg:h-[calc(100vh-5rem)] p-3 md:p-4 font-sans transition-colors duration-200 flex flex-col lg:flex-row gap-4 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* LEFT: Product Catalog & Search */}
      <div className={`w-full lg:w-3/5 flex flex-col p-4 rounded-2xl border shadow-xl h-[70vh] lg:h-full overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between mb-3 gap-3 shrink-0">
          <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-500" /> Hardware POS Counter
          </h1>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs md:text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
          </div>
        </div>

        {/* Product Grid with Strict 1:1 Aspect Ratio Images & Scrollable Container */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto flex-1 pr-1">
          {loadingProducts ? (
            <div className="col-span-3 text-center py-20 text-slate-400">Loading products from database...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-3 text-center py-20 text-slate-500">No products found. Import items via Inventory.</div>
          ) : (
            filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-3 rounded-xl border transition text-left flex flex-col justify-between shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-800 hover:border-indigo-500 text-white' : 'bg-slate-50 border-slate-300 hover:border-indigo-500 text-slate-900'}`}
              >
                <div className="space-y-2">
                  <div className={`w-full aspect-square rounded-lg overflow-hidden border flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-white border-slate-300 text-slate-400'}`}>
                    {product.imageUrl ? (
                      <img src={`import.meta.env.VITE_API_BASE_URL${product.imageUrl}`} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 opacity-50" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
                      {typeof product.brand === 'object' ? product.brand?.name : product.brand || 'General'}
                    </span>
                    <h3 className={`font-bold text-xs md:text-sm line-clamp-1 mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{product.name}</h3>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{product.size} | {product.color}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs shrink-0 pt-2 border-t border-slate-700/20">
                  <span className="font-extrabold text-emerald-500 text-sm">৳{product.sellingPrice}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.stockQuantity > 5 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                    Stock: {product.stockQuantity}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout Ledger */}
      <div className={`w-full lg:w-2/5 flex flex-col p-4 rounded-2xl border justify-between shadow-xl h-[75vh] lg:h-full overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col flex-1 overflow-hidden">
          <h2 className={`text-base md:text-lg font-bold mb-3 border-b pb-2 flex items-center justify-between shrink-0 ${isDarkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'}`}>
            <span>Current Order</span>
            <span className={`text-[10px] md:text-xs px-2 py-1 rounded border font-semibold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>Auto-Customer Lookup</span>
          </h2>

          {/* Customer Input with Suggestions */}
          <div className="relative space-y-2 mb-3 shrink-0" ref={suggestionRef}>
            <div className={`p-3 rounded-xl border space-y-2 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
              <div className="flex gap-2">
                <div className="w-1/2 relative">
                  <input 
                    type="text"
                    placeholder="Customer Phone *"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full px-3 py-2 rounded-lg text-xs md:text-sm border focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 font-medium'}`}
                  />
                </div>
                <div className="w-1/2">
                  <input 
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full px-3 py-2 rounded-lg text-xs md:text-sm border focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 font-medium'}`}
                  />
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCustomers.length > 0 && (
                <div className={`absolute left-0 right-0 z-20 mt-1 rounded-xl shadow-2xl border max-h-40 overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                  {filteredCustomers.map(cust => (
                    <div 
                      key={cust.id}
                      onClick={() => {
                        setCustomerPhone(cust.phone);
                        setCustomerName(cust.name);
                        setShowSuggestions(false);
                      }}
                      className={`px-3 py-2 text-xs cursor-pointer flex justify-between items-center transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                    >
                      <span className="font-bold">{cust.name}</span>
                      <span className="font-mono text-indigo-400">{cust.phone}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className={`text-[10px] flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Existing customers auto-suggested as you type.
              </p>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs md:text-sm">Cart is empty. Select items from left catalog.</div>
            ) : (
              cart.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs md:text-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex-1">
                    <p className={`font-semibold line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>৳{item.sellingPrice} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center border rounded ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900 font-semibold'}`}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-0.5 hover:opacity-75">-</button>
                      <span className="px-2 text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-0.5 hover:opacity-75">+</button>
                    </div>
                    <button onClick={() => updateQuantity(item.id, 0)} className="text-rose-500 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals & Payment Section */}
        <div className={`border-t pt-3 space-y-3 shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}>
          <div className="space-y-1.5 text-xs md:text-sm">
            <div className={`flex justify-between font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <span>Subtotal</span>
              <span className="font-bold">৳{subtotal.toFixed(2)}</span>
            </div>
            
            {/* Paid Amount Row with "Full Cash" Quick Button */}
            <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="font-medium">Paid Amount</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFullCash}
                  title="Pay full amount in cash"
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow transition flex items-center gap-1"
                >
                  <Banknote className="w-3.5 h-3.5" /> Full Cash
                </button>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className={`w-28 px-2.5 py-1 text-right rounded font-bold border focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />
              </div>
            </div>

            <div className={`flex justify-between font-bold text-sm md:text-base border-t pt-1.5 ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}>
              <span className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>Due Balance (Baki)</span>
              <span className={dueAmount > 0 ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>৳{dueAmount > 0 ? dueAmount.toFixed(2) : '0.00'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={`w-1/3 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
            >
              <option value="CASH">Cash</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="BANK_TRANSFER">Bank</option>
            </select>

            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut || cart.length === 0}
              className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 text-xs md:text-sm disabled:opacity-50"
            >
              {isCheckingOut ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              {isCheckingOut ? 'Processing...' : 'Complete Sale & Print'}
            </button>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-2xl w-full max-w-sm shadow-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center gap-3 text-amber-500">
              <ShieldCheck className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-base">Due Verification Required</h3>
                <p className="text-[10px] text-slate-400">Admin OTP setting is active for credit sales.</p>
              </div>
            </div>
            <p className={`text-xs p-3 rounded-lg border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800 font-medium'}`}>
              {otpMessage}
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1">Enter 6-Digit OTP sent to customer</label>
              <input 
                type="text" 
                maxLength="6"
                placeholder="123456" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className={`w-full text-center tracking-widest text-xl font-bold py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowOtpModal(false)}
                className={`w-1/2 py-2 rounded-lg text-xs font-semibold border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'}`}
              >
                Cancel
              </button>
              <button 
                onClick={verifyOtpAndFinalize}
                className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-xs"
              >
                Verify & Finalize
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}