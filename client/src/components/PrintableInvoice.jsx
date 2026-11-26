import React from 'react';
import { Printer, Download, X } from 'lucide-react';

export default function PrintableInvoice({ order, isOpen, onClose, shopDetails }) {
  if (!isOpen || !order) return null;

  const formatBDT = (val) => Number(val || 0).toFixed(2);

  // Reliable Print Trigger
  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-container');
    if (!printContent) {
      alert("Invoice container not found.");
      return;
    }

    const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    WindowPrt.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.invoiceNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; font-size: 12px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
            th, td { border-bottom: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f8f9fa; font-size: 11px; }
            .totals { float: right; width: 220px; margin-top: 10px; }
            .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
            .grand-total { font-weight: bold; border-top: 2px solid #111; border-bottom: 2px solid #111; padding: 5px 0; margin-top: 5px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    WindowPrt.document.close();
    WindowPrt.focus();
  };

  // Direct PDF Download / Save Trigger via Browser Print-to-PDF
  const handleDownloadPDF = () => {
    // Opens the print window pre-configured to save as PDF
    handlePrint();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
          <h3 className="font-bold text-xs text-slate-700 flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-600" /> Invoice Actions: #{order.invoiceNo}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area Container */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs bg-white" id="invoice-print-container">
          
          <div className="text-center space-y-1 border-b pb-3 border-slate-200">
            <h1 className="text-base font-extrabold uppercase tracking-tight">{shopDetails?.shopName || "Makkah Hardware & Tools"}</h1>
            <p className="text-[11px] text-slate-500">Wholesale & Retail Hardware, Sanitary & Electrical Goods</p>
            <p className="text-[11px] font-mono text-slate-600">Hotline: {shopDetails?.phone || "01700000000"} | Dhaka, Bangladesh</p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b pb-3 border-slate-200 text-[11px]">
            <div>
              <p><span className="text-slate-500">Invoice:</span> <span className="font-mono font-bold">#{order.invoiceNo}</span></p>
              <p><span className="text-slate-500">Date:</span> {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p><span className="text-slate-500">Customer:</span> {order.customerName || order.customer?.name || "Walk-in"}</p>
              <p><span className="text-slate-500">Phone:</span> {order.customerPhone || order.customer?.phone || "N/A"}</p>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
              <span className="font-semibold text-slate-500 block uppercase text-[10px]">Shipping Address:</span>
              <p className="font-medium text-slate-800 mt-0.5">{order.deliveryAddress}</p>
            </div>
          )}

          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-300 uppercase text-[10px] text-slate-500">
                <th className="py-1.5">Item</th>
                <th className="py-1.5 text-center">Qty</th>
                <th className="py-1.5 text-right">Price</th>
                <th className="py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2">
                    <p className="font-bold text-slate-900">{item.product?.name || "Hardware Item"}</p>
                    {item.customLength && <p className="text-[10px] text-indigo-600">Length: {item.customLength} {item.product?.unit || 'm'}</p>}
                  </td>
                  <td className="py-2 text-center font-mono">{item.quantity} {item.product?.unit || 'pcs'}</td>
                  <td className="py-2 text-right font-mono">৳{formatBDT(item.unitPrice)}</td>
                  <td className="py-2 text-right font-mono font-bold">৳{formatBDT(item.subTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-slate-300 pt-2 space-y-1 text-[11px] clear-both">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono">৳{formatBDT(order.totalAmount - (order.shippingCharge || 0))}</span>
            </div>
            {order.shippingCharge > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee</span>
                <span className="font-mono">৳{formatBDT(order.shippingCharge)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs border-t border-slate-200 pt-1.5">
              <span>Grand Total</span>
              <span className="font-mono text-indigo-600">৳{formatBDT(order.totalAmount)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 italic clear-both">
            Thank you for shopping with us!
          </div>

        </div>

        {/* Modal Footer Actions - Clear Print and Download Options */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Save as PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Now
          </button>
        </div>

      </div>
    </div>
  );
}