# 🛒 Hardware Shop POS & Inventory Management System

A production-ready, full-stack Point of Sale (POS) and business management web application built specifically for hardware retail shops. Designed with a lightning-fast React frontend and a hardened Node.js/Express/Prisma backend.

![Tech Stack](https://img.shields.io/badge/Tech-React_%7C_Node.js_%7C_Prisma_%7C_PostgreSQL-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Key Features

- **⚡ High-Speed POS Counter:** Rapid checkout workflow, cart calculations, barcode-ready item lookups, and multi-payment recording (Cash, bKash, Nagad, Bank).
- **📦 Advanced Inventory Management:** Real-time stock level tracking, low-stock alerts, thumbnail image support, and purchase/selling price management.
- **📒 Customer Ledger & Baki (Due) Tracking:** Track customer purchase histories, outstanding balances (*baki*), and record partial/full due collections with integrated receipt logging.
- **📱 SMS Notifications (Bangladesh Gateway):** Automated instant SMS alerts for sale invoices and due collections via local providers (e.g., Greenweb/BulkSMSBD).
- **📊 Financial Analytics Dashboard:** Multi-month financial filtering, expense breakdowns, and interactive Recharts visualizations with custom zoom brushes.
- **🎨 3-Way Theme Switcher:** Seamless Auto (Device OS preference), Dark, and Light mode options persisted across sessions via `localStorage`.
- **🔒 Enterprise-Grade Security:** Hardened with `helmet`, global & authentication rate limiters (`express-rate-limit`), CORS policies, and secure Prisma ORM queries.
- **👥 Role-Based Access Control:** Distinct Admin and Staff permissions for operational security and user management.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Node.js, Express.js, Axios
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Security:** Helmet, Express Rate Limit, bcryptjs

---

## 📁 Project Structure

```text
F:\hardWarePOS\
├── api/                   # Backend Node.js / Express server
│   ├── prisma/            # Database schema & migrations
│   ├── routes/            # API endpoints (inventory, sales, auth, etc.)
│   ├── utils/             # Helper utilities (SMS service, etc.)
│   └── server.js          # Main entry point with security middleware
└── client/                # Frontend React Vite application
    ├── src/
    │   ├── components/    # POSCheckout, InventoryManager, CustomerLedger, etc.
    │   ├── App.jsx        # Main router & theme provider state
    │   └── main.jsx
    └── package.json
