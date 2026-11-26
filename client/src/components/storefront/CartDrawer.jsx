import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  User,
  MapPin,
  AlertTriangle,
} from "lucide-react";

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  setCartItems,
  customerId,
  isDarkMode,
  onOrderSuccess, // <--- Added callback prop to open the invoice modal directly
}) {
  // Checkout Customer Inputs
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Delivery Zone & Payment State
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // OTP Verification State
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDeliveryZones();
      fetchSystemSettings();
    }
  }, [isOpen]);

  // Fetch Delivery Zones dynamically on open
  const fetchDeliveryZones = async () => {
    try {
      const backendUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/ecommerce/delivery-zones`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setDeliveryZones(data);
        setSelectedZoneId(data[0].id); // Auto-select first zone
      }
    } catch (err) {
      console.error("Failed to load dynamic delivery zones:", err);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const backendUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/ecommerce/settings`);
      const data = await res.json();
      setRequireOtp(!!data.requireOrderOtpVerify);
    } catch (err) {
      console.error("Failed to load system settings:", err);
    }
  };

  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId);
  const shippingCharge = selectedZone ? Number(selectedZone.charge) : 60;

  // Calculate subtotal accounting for quantity and custom lengths
  const subTotal = cartItems.reduce((acc, item) => {
    const unitPrice = Number(item.sellingPrice);
    const lengthMultiplier = item.customLength ? Number(item.customLength) : 1;
    return acc + unitPrice * item.quantity * lengthMultiplier;
  }, 0);

  const grandTotal = subTotal + (cartItems.length > 0 ? shippingCharge : 0);

  const updateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const handleSendOtp = async () => {
    if (!customerName || !customerPhone || !deliveryAddress) {
      alert(
        "Please complete Customer Name, Phone Number, and Delivery Address.",
      );
      return;
    }

    if (
      selectedZone &&
      paymentMethod === "CASH" &&
      !selectedZone.allowCashOnDelivery
    ) {
      alert(
        `Cash on Delivery is disabled for ${selectedZone.name}. Please select an online payment method.`,
      );
      return;
    }

    if (requireOtp) {
      setIsSubmitting(true);
      try {
        const backendUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const res = await fetch(`${backendUrl}/api/ecommerce/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: customerPhone }),
        });
        const data = await res.json();
        if (data.success) {
          setOtpStep(true);
          alert(
            `OTP sent to ${customerPhone}! (Demo code: ${data.demoCode || "123456"})`,
          );
        } else {
          alert(`Failed to send OTP: ${data.error}`);
        }
      } catch (err) {
        alert("Error sending OTP code.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      executeCheckout();
    }
  };

  const executeCheckout = async () => {
    setIsSubmitting(true);
    try {
      const backendUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const payload = {
        customerId: customerId || null,
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        shippingCharge,
        paymentMethod,
        otpCode: requireOtp ? otpCode : null,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          customLength: item.customLength || null,
        })),
      };

      const res = await fetch(`${backendUrl}/api/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        // Clear cart & close drawer
        setCartItems([]);
        setOtpStep(false);
        onClose();

        // Trigger the invoice modal with the returned order data
        if (onOrderSuccess) {
          onOrderSuccess(data.order);
        } else {
          alert(`Order Placed Successfully! Invoice: ${data.order.invoiceNo}`);
        }
      } else {
        alert(`Checkout failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Network error during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div
        className={`w-full max-w-md h-full flex flex-col shadow-2xl transition-colors ${isDarkMode ? "bg-slate-900 text-slate-100 border-l border-slate-800" : "bg-white text-slate-900"}`}
      >
        {/* Drawer Header */}
        <div
          className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-sm uppercase tracking-wider">
              Your Shopping Cart
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm">
              Your cart is empty.
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border flex items-center justify-between ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-xs">{item.name}</h4>
                  <div className="text-[11px] text-amber-500 font-bold mt-0.5">
                    ৳{Number(item.sellingPrice).toFixed(2)} per {item.unit}
                    {item.customLength && (
                      <span className="ml-1 text-slate-400 font-normal">
                        ({item.customLength} {item.unit} length)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center border rounded-lg overflow-hidden ${isDarkMode ? "border-slate-800" : "border-slate-300"}`}
                  >
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="px-2 py-0.5 text-xs font-bold hover:bg-amber-600 hover:text-white"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="px-2 py-0.5 text-xs font-bold hover:bg-amber-600 hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => updateQuantity(item.id, -item.quantity)}
                    className="text-rose-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        {cartItems.length > 0 && (
          <div
            className={`p-4 border-t space-y-3 ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}
          >
            {!otpStep ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="01711XXXXXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <textarea
                      rows="2"
                      placeholder="House, Road, Area, Thana..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Select Delivery Zone
                    </label>
                    <select
                      value={selectedZoneId}
                      onChange={(e) => setSelectedZoneId(e.target.value)}
                      className={`w-full p-2 text-xs rounded-xl border ${
                        isDarkMode
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-slate-300"
                      }`}
                    >
                      {deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} (৳{Number(zone.charge).toFixed(0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className={`w-full p-2 text-xs rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                    >
                      <option value="CASH">Cash On Delivery</option>
                      <option value="BKASH">bKash Online</option>
                      <option value="NAGAD">Nagad Online</option>
                    </select>
                  </div>
                </div>

                {/* Cash On Delivery Warning */}
                {selectedZone &&
                  paymentMethod === "CASH" &&
                  !selectedZone.allowCashOnDelivery && (
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-500 text-[11px]">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Cash on delivery is unavailable for {selectedZone.name}.
                      </span>
                    </div>
                  )}

                {/* Order Financial Calculation */}
                <div
                  className={`space-y-1 text-xs pt-2 border-t ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-600"}`}
                >
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Shipping Fee ({selectedZone?.name || "Standard"})
                    </span>
                    <span>৳{shippingCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-amber-500 pt-1">
                    <span>Total</span>
                    <span>৳{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow"
                >
                  {isSubmitting
                    ? "Processing..."
                    : requireOtp
                      ? "Verify Phone (SMS OTP)"
                      : "Confirm Order"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Step 2: OTP Verification Window */
              <div className="space-y-3 py-4 text-center">
                <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold">SMS Verification Required</h3>
                <p className="text-xs text-slate-400">
                  Enter the 6-digit OTP code sent to{" "}
                  <span className="text-amber-500 font-mono font-bold">
                    {customerPhone}
                  </span>
                </p>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className={`w-40 text-center mx-auto tracking-widest text-lg font-mono font-bold py-2 rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300"}`}
                />

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setOtpStep(false)}
                    className="w-1/2 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={executeCheckout}
                    disabled={isSubmitting || otpCode.length < 4}
                    className="w-1/2 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow"
                  >
                    {isSubmitting ? "Verifying..." : "Verify & Complete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}