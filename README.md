# 🧾 Bara Kasir

A free, offline-first, open source Point of Sale (POS) Progressive Web App built for Indonesian Micro, Small, and Medium Enterprises (UMKM). All data is stored locally on the user's device — no server, no registration, no cost.

---

## ✨ Features

- **POS / Cashier** — Full cashier interface with cart, per-item & per-transaction discounts, payment method selection, and automatic change calculation
- **Open Bill** — Save transactions as open bills for later checkout, with customer name, table number, and remarks
- **Responsive Layout** — Mobile-first phone UI with landscape/tablet mode featuring side-by-side cashier (products + cart) and adaptive grid columns
- **Barcode Scanning** — Scan product barcodes via camera (supports EAN-13, EAN-8, UPC-A, UPC-E, Code-128, QR) or manual keyboard entry
- **Product Management** — Complete CRUD with categories, SKU (unique & required), units, photos, and barcode support
- **Stock Management** — Stock in (from suppliers) and stock out (damaged, lost, returned, etc.)
- **Automatic COGS (HPP)** — Cost of Goods Sold is automatically calculated using the weighted average method on each stock-in
- **Sales Reports** — 7/30 day sales charts, top products, total revenue & profit
- **Transaction History** — Browse completed transactions with open bill filter tabs
- **Supplier Management** — Manage supplier contacts and details
- **Backup & Restore** — Export/import all data as JSON, with automatic backup reminders
- **PWA** — Installable to home screen, fully offline with Service Worker (Workbox), supports any orientation
- **Onboarding** — Interactive tutorial for first-time users
- **Dark Mode** — Full dark theme support
- **Theme Customization** — Pick your preferred accent color

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Theming | next-themes (dark mode) |
| Database | IndexedDB via Dexie.js |
| Charts | Recharts |
| Routing | React Router DOM v6 |
| Forms & Validation | React Hook Form + Zod |
| State | @tanstack/react-query |
| Icons | Lucide React |
| Date | date-fns (id locale) |
| PWA | vite-plugin-pwa (Workbox) |
| Barcode | html5-qrcode (camera scanner + manual input) |
| Receipt | html2canvas (to PNG), Web Bluetooth Print |
| Font | Plus Jakarta Sans |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) v18+ (via [nvm](https://github.com/nvm-sh/nvm))
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/fadhillahrizkyakhbar/bara-kasir.git
cd bara-kasir

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be running at `http://localhost:8080`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── App.tsx                  # Root component & routing
├── main.tsx                 # Entry point
├── index.css                # Design tokens (HSL CSS variables)
├── lib/
│   ├── db.ts                # Dexie database schema, interfaces, seed data
│   ├── utils.ts             # Utility functions (cn, etc.)
│   ├── image-utils.ts       # Image compression utility
│   └── version-check.ts     # Version check webhook
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx    # Main layout (responsive: max-w-lg mobile, max-w-6xl tablet/landscape)
│   │   └── BottomNav.tsx    # Bottom nav (5 tabs, center cashier CTA)
│   ├── Onboarding.tsx       # First-run tutorial & store setup
│   ├── BackupReminder.tsx   # Backup reminder & export utility
│   ├── Receipt.tsx          # Receipt component (view, download, share, Bluetooth print)
│   ├── BarcodeScanner.tsx   # Barcode/QR scanner via camera (EAN, UPC, Code-128, QR)
│   ├── ThemeColorPicker.tsx # Accent color picker (8 presets)
│   └── ui/                  # shadcn/ui components (40+)
├── pages/
│   ├── Dashboard.tsx        # Home: stats, quick actions, low stock alerts
│   ├── Cashier.tsx          # POS / cashier (barcode scan input, camera scanner, side-by-side cart on landscape)
│   ├── Products.tsx         # Product CRUD
│   ├── Reports.tsx          # Sales reports & charts
│   ├── Settings.tsx         # Settings (store, payments, categories, backup)
│   ├── Supplier.tsx         # Supplier CRUD
│   ├── StockIn.tsx          # Stock in + COGS calculation
│   ├── StockOut.tsx         # Stock out
│   ├── StockReport.tsx      # Stock movement reports
│   ├── TransactionHistory.tsx # Transaction history with open bill filter tabs
│   └── NotFound.tsx         # 404 page
└── hooks/                   # Custom React hooks (usePWAInstall, useThemeColor, useIsMobile, useToast)
```

---

## 💾 Database

All data is stored locally in the browser using IndexedDB (via Dexie.js). No data is ever sent to any server.

### Tables

| Table | Description |
|-------|-------------|
| `categories` | Product categories (name, color, icon) |
| `products` | Master products (name, SKU, sell price, COGS, stock, unit) |
| `suppliers` | Supplier data |
| `stockIns` | Stock-in records |
| `stockOuts` | Stock-out records |
| `hppHistory` | COGS change audit trail |
| `paymentMethods` | Payment methods (Cash, Bank Transfer, QRIS, etc.) |
| `transactions` | Sales transactions (status: open/completed, customer name, table number, remarks) |
| `transactionItems` | Individual items within each transaction (with per-item notes) |
| `storeSettings` | Store settings & app state |

### COGS Calculation (Weighted Average)

When stock is received, COGS is automatically recalculated:

```
New COGS = ((Old Stock × Old COGS) + (New Qty × Buy Price)) / (Old Stock + New Qty)
```

---

## 💬 Feedback & Feature Requests

Got suggestions, feature ideas, or found a bug? Submit and vote on our board:

👉 **[barakasir.fider.io](https://barakasir.fider.io/)**

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### Guidelines

- All UI text is in **Bahasa Indonesia** (the app targets Indonesian users)
- Use existing `shadcn/ui` components from `src/components/ui/`
- All monetary values are stored as numbers representing Indonesian Rupiah (no decimals)
- Format numbers using `toLocaleString('id-ID')`
- New features must work fully offline (no API calls)
- Use `useLiveQuery()` from `dexie-react-hooks` for reactive data binding

---

## 📋 Roadmap

- [ ] Export reports to Excel/CSV
- [ ] Multi-language support (i18n)
- [ ] Manual COGS adjustment
- [ ] Receipt thermal printer via USB
- [ ] Customer management

---

## 📄 License

[MIT License](LICENSE)

---

## 🙏 Credits

Built with ❤️ for Indonesian small businesses.

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Dexie.js](https://dexie.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Recharts](https://recharts.org/)
