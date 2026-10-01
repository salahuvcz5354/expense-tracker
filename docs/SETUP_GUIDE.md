# 📊 Google Sheets & Apps Script Setup Guide

Follow this simple, step-by-step guide to connect your **Daily Expense Tracker** to your own Google Sheet and enable real-time automatic syncing, receipt uploads to Google Drive, and instant email notifications.

---

## 🛠️ Step 1: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.new) and create a **New Blank Spreadsheet**.
2. Rename the spreadsheet to **`Daily Expenses`** (or any name you prefer).
3. Name the first sheet tab at the bottom **`Expenses`**.
4. In Row 1, add the following **11 Column Headers** exactly in order:

| Col | Column Header | Description | Example Value |
|---|---|---|---|
| **A** | `Timestamp` | System timestamp | `2026-10-01 17:30:00` |
| **B** | `Date` | Expense date | `2026-10-01` |
| **C** | `Category` | Category chosen | `Petrol / Fuel` |
| **D** | `Description` | Item or reason | `Petrol for bike` |
| **E** | `Amount` | Spent amount | `500` |
| **F** | `Payment Method` | Mode of payment | `UPI` |
| **G** | `Vendor` | Shop / Merchant / Person | `BPCL Pump` |
| **H** | `Notes` | Optional notes | `Full tank` |
| **I** | `Receipt` | Google Drive link | `https://drive.google.com/...` |
| **J** | `Month` | Auto-calculated month | `October` |
| **K** | `Year` | Auto-calculated year | `2026` |

> 💡 **Tip**: You can also use the auto-setup function in Google Apps Script (Step 4) which will generate and style these headers for you automatically!

---

## 📋 Step 2: Copy the Spreadsheet ID

Look at your browser's address bar when your Google Sheet is open:
```text
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                    SPREADSHEET ID
```
Copy the string between `/d/` and `/edit`. This is your `GOOGLE_SHEET_ID`.

---

## ⚡ Step 3: Open Google Apps Script

1. Inside your Google Sheet, click the top menu: **Extensions** → **Apps Script**.
2. A new tab will open with the Apps Script code editor.
3. Rename the project from "Untitled project" to **`Daily Expense Tracker API`** (top left).
4. Delete any code currently in the `Code.gs` file.
5. Open the [`google-apps-script/Code.gs`](file:///C:/Users/ACM/.gemini/antigravity/scratch/daily-expense-tracker/google-apps-script/Code.gs) file from this project and paste the entire code into the Apps Script editor.
6. Click the **💾 Save** icon (or press `Ctrl + S` / `Cmd + S`).

---

## 🎨 Step 4: Run Auto-Setup (Optional but Recommended)

1. In the Apps Script toolbar dropdown (where it says `myFunction` or `doGet`), select **`setupSheet`**.
2. Click **▶ Run**.
3. Google will ask for **Authorization**:
   - Click **Review permissions**.
   - Select your Google Account.
   - Click **Advanced** (at the bottom of the prompt).
   - Click **Go to Daily Expense Tracker API (unsafe)**.
   - Click **Allow**.
4. Go back to your Google Sheet: you will see all 11 columns created, styled with dark slate headers, frozen top row, and currency formatting!

---

## 🚀 Step 5: Deploy as Web App

1. In the top right corner of the Apps Script editor, click the blue **Deploy** button → **New deployment**.
2. Next to "Select type", click the **⚙️ gear icon** and choose **Web app**.
3. Configure the deployment settings:
   - **Description**: `Expense Tracker Production v1`
   - **Execute as**: **`Me (your_email@gmail.com)`**  *(Essential so it can write to your sheet and send emails)*
   - **Who has access**: **`Anyone`**  *(Crucial so your web app can submit expenses without complex OAuth popups)*
4. Click **Deploy**.
5. Copy the generated **Web App URL**. It looks like:
   ```text
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

---

## ⚙️ Step 6: Configure Your Web Application

1. Open the **Daily Expense Tracker** web application in your browser (`index.html`).
2. Click the **⚙️ Settings** icon in the header (or tap **Settings** in the mobile navigation).
3. Paste the following values:
   - **Google Sheet ID**: Your copied ID from Step 2
   - **Google Apps Script Web App URL**: Your copied URL from Step 5
   - **Email Address**: The email where you want to receive instant expense alerts and daily summaries
4. Click **Test Connection**. You should see a green badge: *"Connected successfully!"*
5. Click **Save Settings**.

---

## 🧪 Step 7: Test the Full Flow

1. On the web app, click **+ Add Expense** (or a quick button like **+ Petrol**).
2. Enter an amount (e.g., `500`), description (`Petrol for bike`), and vendor (`BPCL`).
3. Click the large **SAVE EXPENSE** button.
4. **Verify Frontend**: A green confirmation toast appears: *"Expense saved successfully."*
5. **Verify Google Sheet**: Open your Google Sheet — a new row is instantly added with the timestamp, category, amount, month, and year!
6. **Verify Email**: Open your inbox — you will have received an email with subject:
   `New Expense Added – ₹500 – Petrol` and the complete transaction breakdown with monthly total!
7. **Verify Dashboard & Charts**: Switch to the Dashboard tab — today's total, category donuts, daily chart, and history table are all updated in real time!

---

## ⏰ Step 8: Automatic Daily Expense Summary at 9:00 PM (Optional)

If you'd like an automated daily digest sent to your inbox every night:
1. In the Apps Script editor, select function **`createDailySummaryTrigger`**.
2. Click **▶ Run**.
3. Done! Apps Script will automatically trigger `sendDailyScheduledSummary` every evening at 9:00 PM IST with your daily expenditure recap!
4. You can also trigger this manually at any time by clicking **"Send Daily Summary Now"** on the Dashboard or Reports page.
