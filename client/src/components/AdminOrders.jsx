import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  MapPin,
  Phone,
  User,
  Eye,
  X,
  Printer,
  Ruler,
} from "lucide-react";
import axios from "axios";
import PrintableInvoice from "../components/PrintableInvoice"; // Ensure this matches your directory structure

export default function AdminOrders({ isDarkMode }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null); // Selected order for modal details
  const [printOrder, setPrintOrder] = useState(null); // Selected order for invoice printing

  const fetchOrders = async () => {
    try {
      const backendUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await axios.get(`${backendUrl}/api/ecommerce/admin/orders`);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error("Failed to load admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const backendUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await axios.put(
        `${backendUrl}/api/ecommerce/admin/orders/${orderId}/status`,
        {
          status: newStatus,
        },
      );
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update order status");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName || order.customer?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (order.customerPhone || order.customer?.phone || "").includes(
        searchQuery,
      );

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "ONLINE_PLACED":
        return (
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Placed
          </span>
        );
      case "PROCESSING":
        return (
          <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
            <Package className="w-3 h-3" /> Processing
          </span>
        );
      case "SHIPPED":
      case "ON_THE_WAY":
        return (
          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
            <Truck className="w-3 h-3" /> On The Way
          </span>
        );
      case "DELIVERED":
        return (
          <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case "CANCELLED":
      case "REJECTED":
      case "DELIVERY_FAILED":
        return (
          <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
            <XCircle className="w-3 h-3" /> {status.replace("_", " ")}
          </span>
        );
      default:
        return (
          <span className="bg-slate-500/10 text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div
        className={`p-12 text-center text-xs ${isDarkMode ? "text-slate-400 bg-slate-950" : "text-slate-600 bg-slate-100"} min-h-screen`}
      >
        Loading online orders...
      </div>
    );
  }

  const backendUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  return (
    <div
      className={`min-h-screen p-6 font-sans transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div
          className={`flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-2xl shadow-lg border gap-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                Online Store Orders & Deliveries
              </h1>
              <p
                className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                Manage parcel lifecycle, shipping statuses, and customer
                fulfillment.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search invoice, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border ${isDarkMode ? "bg-slate-950 border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-300"}`}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`p-2 rounded-xl text-xs border ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-300"}`}
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE_PLACED">Placed</option>
              <option value="PROCESSING">Processing</option>
              <option value="ON_THE_WAY">On The Way</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div
          className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`uppercase font-semibold border-b ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
              >
                <tr>
                  <th className="px-4 py-3">Invoice & Date</th>
                  <th className="px-4 py-3">Customer Info</th>
                  <th className="px-4 py-3">Delivery Address</th>
                  <th className="px-4 py-3">Items & Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? "divide-slate-800" : "divide-slate-200"}`}
              >
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-12 text-slate-500"
                    >
                      No online store orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={`transition cursor-pointer ${isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-amber-500">
                          {order.invoiceNo}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />{" "}
                          {order.customerName ||
                            order.customer?.name ||
                            "Guest"}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{" "}
                          {order.customerPhone ||
                            order.customer?.phone ||
                            "N/A"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="flex items-start gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {order.deliveryAddress || "No address specified"}
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-amber-500 font-mono">
                          ৳{Number(order.totalAmount).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {order.items?.length || 0} items (
                          {order.paymentMethod})
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(order.status)}
                      </td>
                      <td
                        className="px-4 py-3.5 text-right space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setPrintOrder(order)}
                          className={`p-1.5 rounded-lg transition ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-indigo-400" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"}`}
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className={`p-1.5 rounded-lg transition ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-amber-400" : "bg-slate-100 hover:bg-slate-200 text-amber-600"}`}
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          className={`p-1.5 rounded-lg text-xs font-semibold border ${
                            isDarkMode
                              ? "bg-slate-950 border-slate-700 text-white"
                              : "bg-slate-50 border-slate-300"
                          }`}
                        >
                          <option value="ONLINE_PLACED">Online Placed</option>
                          <option value="PENDING">Pending</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="ON_THE_WAY">On The Way</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="DELIVERY_FAILED">
                            Delivery Failed
                          </option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- ORDER DETAILS MODAL --- */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`p-6 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border space-y-6 ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b pb-4 border-slate-700/30">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg font-mono text-amber-500">
                      {selectedOrder.invoiceNo}
                    </h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Placed on:{" "}
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPrintOrder(selectedOrder);
                    }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Invoice
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Customer & Delivery Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Customer Information
                  </h4>
                  <div className="text-xs space-y-1">
                    <p>
                      <span className="text-slate-400">Name:</span>{" "}
                      <span className="font-semibold">
                        {selectedOrder.customerName ||
                          selectedOrder.customer?.name ||
                          "Guest"}
                      </span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="text-slate-400">Phone:</span>{" "}
                      <span className="font-mono font-semibold">
                        {selectedOrder.customerPhone ||
                          selectedOrder.customer?.phone ||
                          "N/A"}
                      </span>
                    </p>
                    {selectedOrder.customerEmail && (
                      <p className="flex items-center gap-1">
                        <span className="text-slate-400">Email:</span>{" "}
                        <span className="font-semibold">
                          {selectedOrder.customerEmail}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border space-y-2 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> Shipping & Payment
                  </h4>
                  <div className="text-xs space-y-1">
                    <p>
                      <span className="text-slate-400">Address:</span>{" "}
                      <span className="font-semibold">
                        {selectedOrder.deliveryAddress || "N/A"}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Method:</span>{" "}
                      <span className="font-semibold uppercase">
                        {selectedOrder.paymentMethod}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Shipping Fee:</span>{" "}
                      <span className="font-mono font-semibold">
                        ৳{Number(selectedOrder.shippingCharge || 0).toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Purchased Items Breakdown
                </h4>
                <div
                  className={`rounded-2xl border overflow-hidden ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                >
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`uppercase border-b font-semibold ${isDarkMode ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      <tr>
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-4 py-2.5">Unit Price</th>
                        <th className="px-4 py-2.5">Qty / Dimension</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${isDarkMode ? "divide-slate-800 text-slate-200" : "divide-slate-200 text-slate-700"}`}
                    >
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 flex items-center gap-3">
                            {item.product?.imageUrl ? (
                              <img
                                src={
                                  item.product.imageUrl.startsWith("http")
                                    ? item.product.imageUrl
                                    : `${backendUrl}${item.product.imageUrl}`
                                }
                                alt={item.product.name}
                                className="w-9 h-9 object-cover rounded-lg border border-slate-700 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold">
                                {item.product?.name || "Hardware Product"}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                SKU: {item.product?.sku || "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            ৳{Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold">
                              {item.quantity} {item.product?.unit || "pcs"}
                            </span>
                            {item.customLength && (
                              <p className="text-[11px] text-amber-500 flex items-center gap-1 mt-0.5">
                                <Ruler className="w-3 h-3" /> Custom length:{" "}
                                {item.customLength} {item.product?.unit || "m"}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-500">
                            ৳{Number(item.subTotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
              >
                <div>
                  <span className="text-xs text-slate-400">
                    Order Lifecycle Status:
                  </span>
                  <div className="mt-1">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) =>
                        handleStatusChange(selectedOrder.id, e.target.value)
                      }
                      className={`p-1.5 rounded-lg text-xs font-semibold border ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-700 text-white"
                          : "bg-slate-50 border-slate-300"
                      }`}
                    >
                      <option value="ONLINE_PLACED">Online Placed</option>
                      <option value="PENDING">Pending</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="ON_THE_WAY">On The Way</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="DELIVERY_FAILED">Delivery Failed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-xs text-slate-400">
                    Subtotal:{" "}
                    <span className="font-mono text-white">
                      ৳
                      {(
                        Number(selectedOrder.totalAmount) -
                        Number(selectedOrder.shippingCharge || 0)
                      ).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Shipping:{" "}
                    <span className="font-mono text-white">
                      ৳{Number(selectedOrder.shippingCharge || 0).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-base font-bold text-amber-500 font-mono">
                    Grand Total: ৳{Number(selectedOrder.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printable Invoice Modal Component */}
        <PrintableInvoice
          isOpen={!!printOrder}
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      </div>
    </div>
  );
}