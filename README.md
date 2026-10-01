# 💰 Daily Expense Tracker (Google Sheets Integrated)

A modern, responsive, mobile-first Daily Expense Tracker web application built with clean HTML5, Tailwind CSS, Lucide Icons, and Chart.js, fully integrated with **Google Sheets** and **Google Apps Script** for automatic storage, real-time analytics, receipt management, and automated email notifications.

---

## ✨ Key Features

1. **Lightning-Fast Expense Entry (Mobile-First):**
   - Quick expense action buttons on Dashboard (`+ Petrol`, `+ Food`, `+ Travel`, `+ Shopping`, `+ Bills`, `+ Other`) for instant 5-second logging.
   - Comprehensive categories: *Petrol / Fuel, Food, Travel, Shopping, Bills, Medical, Rent / Home, EMI / Loan, Personal, Business, Education, Entertainment, Vehicle, Family, Other*.
   - Payment methods: *Cash, UPI, Debit Card, Credit Card, Bank Transfer, Other*.
   - Indian Rupee (₹) currency formatting (`₹1,250`, `₹18,500`, `₹1,25,000`).
   - Optional receipt photo/file upload with camera capture and Google Drive cloud storage.
   - Duplicate submission protection with live saving spinner and validation alerts.
   - Exact required confirmation message: *"Expense saved successfully."*

2. **Automated Google Sheets & Google Drive Integration:**
   - Every submitted expense automatically writes a new row in your private Google Sheet.
   - Column mapping: `Timestamp`, `Date`, `Category`, `Description`, `Amount`, `Payment Method`, `Vendor`, `Notes`, `Receipt`, `Month`, `Year`.
   - Automatic generation of `Timestamp`, `Month` (e.g., October), and `Year` (e.g., 2026).
   - Zero private credentials hardcoded in frontend — fully configurable in the UI Settings modal (`GOOGLE_SHEET_ID`, `GOOGLE_APPS_SCRIPT_WEB_APP_URL`, `EMAIL_ADDRESS`).
   - "Test Connection" button with live status feedback.
   - Offline & Local Storage fallback: Works immediately out-of-the-box with local caching and sample data.

3. **Interactive Financial Dashboard:**
   - **Today's Total Expense**
   - **This Week's Total Expense**
   - **This Month's Total Expense**
   - **Total Number of Expenses**
   - **Average Daily Expense**
   - **Highest Expense** (with category & description)
   - Category-wise summary cards with spend progress bars (e.g., *Petrol ₹4,500*, *Food ₹3,200*, *Travel ₹1,800*, *Shopping ₹2,500*, *Bills ₹4,000*).
   - Recent Transactions quick list.

4. **Interactive Real-Time Charts:**
   - **Daily Expense Chart:** Interactive trend line showing spending across recent active days.
   - **Monthly Expense Chart:** Month-by-month financial comparison bar chart.
   - **Category-wise Donut Chart:** Color-coded percentage breakdown of expenses.
   - **Payment Method Distribution:** Spending distribution across UPI, Cash, Cards, and Net Banking.

5. **Expense History & Management:**
   - Search by description, vendor, category, or notes.
   - Filter by Category, Payment Method, and Date Range (Today, This Week, This Month, All).
   - Sort by Date (Newest/Oldest) or Amount (High to Low / Low to High).
   - Edit and Delete records with automatic Google Sheet synchronization.
   - Receipt attachment preview modal.

6. **Monthly Financial Reports & Exports:**
   - Filter any month and year (e.g. October 2026).
   - Complete expenditure breakdown, transaction counts, daily averages, and peak expense.
   - **"Download CSV"** for Excel/Google Sheets.
   - **"Print / PDF Report"** with clean print-optimized layout.
   - **"Email Monthly Report"** for sending branded HTML summaries straight to your inbox.

7. **Automated Email Notifications:**
   - **Instant Expense Alert:** Sent whenever a new expense is logged:
     - **Subject:** `New Expense Added – ₹500 – Petrol`
     - **Body:** Formatted date, category, description, amount, payment method, vendor, notes, receipt link, and updated monthly total!
   - **Daily Expense Summary Email:** Triggerable manually via *"Send Daily Summary Now"* or automatically scheduled at 9:00 PM IST via Google Apps Script trigger.

---

## 📁 Project Directory Structure

```text
daily-expense-tracker/
├── index.html                    # Responsive single-page web application
├── css/
│   └── style.css                 # Custom styling, mobile touch optimization, print stylesheets
├── js/
│   ├── config.js                 # Configuration manager (Sheet ID, Apps Script URL, Email)
│   ├── data.js                   # Expense data model, CRUD, stats calculator, INR formatting
│   ├── api.js                    # Google Apps Script Web App API client (CORS & redirect safe)
│   ├── charts.js                 # Chart.js initialization & responsive updates
│   ├── ui.js                     # Tab routing, modals, toasts, tables, and reports
│   └── app.js                    # Form validation, duplicate protection, event bindings
├── google-apps-script/
│   ├── Code.gs                   # Complete Apps Script backend (REST endpoints, emails, Drive upload)
│   └── appsscript.json           # Apps Script manifest configuration
├── docs/
│   ├── SETUP_GUIDE.md            # Step-by-step Google Sheets & Apps Script deployment guide
│   └── GOOGLE_SHEET_TEMPLATE.csv # Sample CSV template with matching column headers
└── README.md                     # Documentation
```

---

## 🚀 How to Run the Application

1. **Directly in Browser:**
   - Simply double-click `index.html` to open it in Chrome, Edge, Safari, or Firefox.
   - No build step, no Node.js, and no web server installation required!

2. **Mobile Browser / Home Screen (PWA):**
   - Open `index.html` on your mobile phone (or host on GitHub Pages, Cloudflare Pages, Vercel, or Netlify).
   - In Safari (iOS): Tap the **Share** button &rarr; **Add to Home Screen**.
   - In Chrome (Android): Tap the **Three Dots** &rarr; **Add to Home screen** / **Install app**.
   - The app runs in fullscreen app mode with fast thumb navigation!

---

## 🛠️ Google Sheets & Apps Script Setup (Quick 5-Minute Setup)

### 1. Create Google Sheet
- Visit [Google Sheets (sheets.new)](https://sheets.new) and create a new spreadsheet named **`Daily Expenses`**.
- Rename the first sheet tab to **`Expenses`**.
- Row 1 headers:
  `Timestamp`, `Date`, `Category`, `Description`, `Amount`, `Payment Method`, `Vendor`, `Notes`, `Receipt`, `Month`, `Year`

### 2. Add Backend Code
- In Google Sheets, click **Extensions** &rarr; **Apps Script**.
- Paste the code from [`google-apps-script/Code.gs`](file:///C:/Users/ACM/.gemini/antigravity/scratch/daily-expense-tracker/google-apps-script/Code.gs).
- In the function dropdown, select **`setupSheet`** and click **▶ Run** to automatically initialize and style the headers!

### 3. Deploy Web App
- Click **Deploy** &rarr; **New deployment**.
- Select type: **Web app**.
- Execute as: **Me (your email)**.
- Who has access: **Anyone**.
- Click **Deploy** and copy the **Web App URL**.

### 4. Connect Web App
- Open `index.html` in your browser.
- Click **⚙️ Settings** (or the connection badge in the top bar).
- Paste your **Google Sheet ID**, **Apps Script Web App URL**, and **Email Address**.
- Click **Test Connection** &rarr; Verify green confirmation &rarr; Click **Save Settings**!

---

## 📧 Sample Email Notifications

### 1. Instant Expense Added Alert
```text
Subject: New Expense Added – ₹500 – Petrol

New Expense Details:

Date: 01-10-2026
Category: Petrol / Fuel
Description: Bike Petrol
Amount: ₹500
Payment Method: UPI
Vendor: BPCL Petrol Pump
Notes: Full tank speed petrol

Monthly Total: ₹18,500

Tracked with Daily Expense Tracker.
```

### 2. Daily Expense Summary Email
```text
Subject: DAILY EXPENSE SUMMARY – 01-10-2026 – ₹1,850

DAILY EXPENSE SUMMARY

Date: 01-10-2026

Total Expense: ₹1,850

Petrol / Fuel: ₹500
Food: ₹450
Travel: ₹300
Shopping: ₹600

Number of Transactions: 4

Monthly Total: ₹18,500

Sent via Daily Expense Tracker
```
