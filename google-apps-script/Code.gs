/**
 * =========================================================================
 * DAILY EXPENSE TRACKER - GOOGLE APPS SCRIPT BACKEND
 * =========================================================================
 * 
 * Features:
 * 1. Automatic Google Sheet row append with timestamp, month, and year calculation.
 * 2. Instant email notification on every new expense.
 * 3. Daily expense summary email generator (manual or scheduled trigger).
 * 4. Monthly expense report email generator.
 * 5. Full REST API endpoints (GET / POST) for adding, reading, updating, and deleting expenses.
 * 6. Optional Google Drive receipt storage for receipt image uploads.
 * 7. CORS and redirect friendly JSON responses.
 * =========================================================================
 */

// Configuration defaults (can be overridden via POST payload or Script Properties)
var CONFIG = {
  SHEET_NAME: "Expenses",
  DEFAULT_EMAIL: "", // Set your email address here or pass it from the app settings
  RECEIPTS_FOLDER_NAME: "Expense_Receipts",
  TIMEZONE: "Asia/Kolkata", // IST timezone
  CURRENCY_SYMBOL: "₹"
};

/**
 * Handle HTTP GET Requests
 * Used for testing connection, fetching expenses, or triggering email summaries
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "test";
  var sheetId = (e && e.parameter && e.parameter.sheetId) ? e.parameter.sheetId : null;

  try {
    var responseData = {};

    switch (action) {
      case "test":
      case "ping":
        responseData = {
          success: true,
          message: "Google Apps Script Web App is connected and running successfully!",
          timestamp: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss")
        };
        break;

      case "getExpenses":
        responseData = getAllExpenses(sheetId);
        break;

      case "sendDailySummary":
        var targetDate = e.parameter.date || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
        var recipientEmail = e.parameter.email || getTargetEmail();
        responseData = sendDailySummaryEmail(targetDate, recipientEmail, sheetId);
        break;

      case "sendMonthlyReport":
        var targetMonth = e.parameter.month; // e.g. "October" or "10"
        var targetYear = e.parameter.year || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy");
        var recipientEmail = e.parameter.email || getTargetEmail();
        responseData = sendMonthlyReportEmail(targetMonth, targetYear, recipientEmail, sheetId);
        break;

      default:
        responseData = {
          success: false,
          error: "Unknown GET action: " + action
        };
    }

    return createJsonResponse(responseData);
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * Handle HTTP POST Requests
 * Receives JSON payload to add, update, delete expenses, or trigger email reports
 */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var action = data.action || "addExpense";
    var sheetId = data.sheetId || null;
    var responseData = {};

    switch (action) {
      case "addExpense":
        responseData = handleAddExpense(data, sheetId);
        break;

      case "updateExpense":
        responseData = handleUpdateExpense(data, sheetId);
        break;

      case "deleteExpense":
        responseData = handleDeleteExpense(data, sheetId);
        break;

      case "sendDailySummary":
        var targetDate = data.date || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
        var recipientEmail = data.email || getTargetEmail();
        responseData = sendDailySummaryEmail(targetDate, recipientEmail, sheetId);
        break;

      case "sendMonthlyReport":
        var targetMonth = data.month;
        var targetYear = data.year || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy");
        var recipientEmail = data.email || getTargetEmail();
        responseData = sendMonthlyReportEmail(targetMonth, targetYear, recipientEmail, sheetId);
        break;

      case "test":
        responseData = {
          success: true,
          message: "POST Connection test successful!",
          timestamp: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss")
        };
        break;

      default:
        responseData = {
          success: false,
          error: "Unknown POST action: " + action
        };
    }

    return createJsonResponse(responseData);
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * Creates standardized CORS-compliant JSON response
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Gets the active spreadsheet or opens by ID
 */
function getSpreadsheet(sheetId) {
  if (sheetId && sheetId.trim() !== "") {
    try {
      return SpreadsheetApp.openById(sheetId.trim());
    } catch (e) {
      // Fallback to active spreadsheet if openById fails
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Gets or creates the "Expenses" worksheet with required columns
 */
function getExpensesSheet(sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    // If "Expenses" sheet doesn't exist, create it or use first sheet
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    initSheetHeaders(sheet);
  } else if (sheet.getLastRow() === 0) {
    initSheetHeaders(sheet);
  }
  
  return sheet;
}

/**
 * Initialize headers and format sheet
 */
function initSheetHeaders(sheet) {
  var headers = [
    "Timestamp",
    "Date",
    "Category",
    "Description",
    "Amount",
    "Payment Method",
    "Vendor",
    "Notes",
    "Receipt",
    "Month",
    "Year"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0f172a"); // Slate-900
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  // Format Amount column (Col 5) as currency
  sheet.getRange(2, 5, 1000, 1).setNumberFormat("₹#,##0.00");
  
  // Set column widths
  sheet.setColumnWidth(1, 170); // Timestamp
  sheet.setColumnWidth(2, 110); // Date
  sheet.setColumnWidth(3, 140); // Category
  sheet.setColumnWidth(4, 220); // Description
  sheet.setColumnWidth(5, 120); // Amount
  sheet.setColumnWidth(6, 140); // Payment Method
  sheet.setColumnWidth(7, 160); // Vendor
  sheet.setColumnWidth(8, 200); // Notes
  sheet.setColumnWidth(9, 180); // Receipt URL
  sheet.setColumnWidth(10, 110); // Month
  sheet.setColumnWidth(11, 80);  // Year
}

/**
 * Handle adding a new expense
 */
function handleAddExpense(data, sheetId) {
  var sheet = getExpensesSheet(sheetId);
  
  // Parse inputs
  var dateStr = data.date || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
  var category = data.category || "Other";
  var description = data.description || "";
  var amount = parseFloat(data.amount) || 0;
  var paymentMethod = data.paymentMethod || "UPI";
  var vendor = data.vendor || "";
  var notes = data.notes || "";
  var receiptInput = data.receipt || "";
  var userEmail = data.email || getTargetEmail();

  // Validate required fields
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be a valid positive number.");
  }
  if (!dateStr) {
    throw new Error("Date is required.");
  }

  // Handle receipt upload to Google Drive if base64 provided
  var receiptUrl = "";
  if (receiptInput) {
    if (receiptInput.indexOf("data:") === 0) {
      receiptUrl = saveReceiptToDrive(receiptInput, dateStr, category, amount);
    } else {
      receiptUrl = receiptInput;
    }
  }

  // Calculate Timestamp, Month, Year
  var timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  
  // Parse date components
  var dateParts = dateStr.split("-");
  var parsedDate = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var monthName = monthNames[parsedDate.getMonth()];
  var yearVal = parsedDate.getFullYear();

  // Format date display (DD-MM-YYYY)
  var displayDate = ("0" + parsedDate.getDate()).slice(-2) + "-" + 
                    ("0" + (parsedDate.getMonth() + 1)).slice(-2) + "-" + 
                    yearVal;

  // Append row
  var rowData = [
    timestamp,
    dateStr,
    category,
    description,
    amount,
    paymentMethod,
    vendor,
    notes,
    receiptUrl,
    monthName,
    yearVal
  ];
  sheet.appendRow(rowData);

  // Compute updated monthly total for the email notification
  var monthlyTotal = calculateMonthlyTotal(sheet, monthName, yearVal);

  // Send instant email notification
  var emailSent = false;
  var emailError = null;
  if (userEmail && userEmail.indexOf("@") !== -1) {
    try {
      sendExpenseNotificationEmail({
        email: userEmail,
        date: displayDate,
        category: category,
        description: description,
        amount: amount,
        paymentMethod: paymentMethod,
        vendor: vendor,
        notes: notes,
        receiptUrl: receiptUrl,
        monthlyTotal: monthlyTotal,
        monthName: monthName
      });
      emailSent = true;
    } catch (e) {
      emailError = e.toString();
    }
  }

  return {
    success: true,
    message: "Expense saved successfully.",
    rowId: sheet.getLastRow(),
    data: {
      timestamp: timestamp,
      date: dateStr,
      category: category,
      description: description,
      amount: amount,
      paymentMethod: paymentMethod,
      vendor: vendor,
      notes: notes,
      receiptUrl: receiptUrl,
      month: monthName,
      year: yearVal
    },
    monthlyTotal: monthlyTotal,
    emailSent: emailSent,
    emailError: emailError
  };
}

/**
 * Handle updating an existing expense
 */
function handleUpdateExpense(data, sheetId) {
  var sheet = getExpensesSheet(sheetId);
  var targetTimestamp = data.timestamp;
  var rowIndex = data.rowIndex; // 1-based sheet row index if known
  
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var foundRow = -1;

  if (rowIndex && rowIndex > 1 && rowIndex <= values.length) {
    foundRow = rowIndex;
  } else if (targetTimestamp) {
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == targetTimestamp) {
        foundRow = i + 1;
        break;
      }
    }
  }

  if (foundRow === -1) {
    throw new Error("Expense row not found for update.");
  }

  // Parse fields
  var dateStr = data.date || values[foundRow - 1][1];
  var category = data.category || values[foundRow - 1][2];
  var description = (data.description !== undefined) ? data.description : values[foundRow - 1][3];
  var amount = (data.amount !== undefined) ? parseFloat(data.amount) : values[foundRow - 1][4];
  var paymentMethod = data.paymentMethod || values[foundRow - 1][5];
  var vendor = (data.vendor !== undefined) ? data.vendor : values[foundRow - 1][6];
  var notes = (data.notes !== undefined) ? data.notes : values[foundRow - 1][7];
  var receiptUrl = (data.receipt !== undefined) ? data.receipt : values[foundRow - 1][8];

  if (receiptUrl && receiptUrl.indexOf("data:") === 0) {
    receiptUrl = saveReceiptToDrive(receiptUrl, dateStr, category, amount);
  }

  var dateParts = String(dateStr).split("-");
  var parsedDate = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var monthName = monthNames[parsedDate.getMonth()];
  var yearVal = parsedDate.getFullYear();

  // Update cells (preserving original timestamp at col 1)
  sheet.getRange(foundRow, 2).setValue(dateStr);
  sheet.getRange(foundRow, 3).setValue(category);
  sheet.getRange(foundRow, 4).setValue(description);
  sheet.getRange(foundRow, 5).setValue(amount);
  sheet.getRange(foundRow, 6).setValue(paymentMethod);
  sheet.getRange(foundRow, 7).setValue(vendor);
  sheet.getRange(foundRow, 8).setValue(notes);
  sheet.getRange(foundRow, 9).setValue(receiptUrl);
  sheet.getRange(foundRow, 10).setValue(monthName);
  sheet.getRange(foundRow, 11).setValue(yearVal);

  return {
    success: true,
    message: "Expense updated successfully.",
    rowIndex: foundRow
  };
}

/**
 * Handle deleting an expense
 */
function handleDeleteExpense(data, sheetId) {
  var sheet = getExpensesSheet(sheetId);
  var targetTimestamp = data.timestamp;
  var rowIndex = data.rowIndex;
  
  var values = sheet.getDataRange().getValues();
  var foundRow = -1;

  if (rowIndex && rowIndex > 1 && rowIndex <= values.length) {
    foundRow = rowIndex;
  } else if (targetTimestamp) {
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == targetTimestamp) {
        foundRow = i + 1;
        break;
      }
    }
  }

  if (foundRow === -1) {
    throw new Error("Expense row not found for deletion.");
  }

  sheet.deleteRow(foundRow);

  return {
    success: true,
    message: "Expense deleted successfully.",
    deletedRow: foundRow
  };
}

/**
 * Fetch all expenses from sheet
 */
function getAllExpenses(sheetId) {
  var sheet = getExpensesSheet(sheetId);
  var values = sheet.getDataRange().getValues();
  
  if (values.length <= 1) {
    return {
      success: true,
      expenses: []
    };
  }

  var headers = values[0];
  var expenses = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[1] && !row[4]) continue; // Skip empty rows

    // Format raw date if it's a Date object
    var dateVal = row[1];
    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, CONFIG.TIMEZONE, "yyyy-MM-dd");
    }

    expenses.push({
      rowIndex: i + 1,
      timestamp: String(row[0] || ""),
      date: String(dateVal || ""),
      category: String(row[2] || "Other"),
      description: String(row[3] || ""),
      amount: parseFloat(row[4]) || 0,
      paymentMethod: String(row[5] || "Cash"),
      vendor: String(row[6] || ""),
      notes: String(row[7] || ""),
      receipt: String(row[8] || ""),
      month: String(row[9] || ""),
      year: parseInt(row[10], 10) || 0
    });
  }

  return {
    success: true,
    totalCount: expenses.length,
    expenses: expenses
  };
}

/**
 * Calculate total expenses for a specific month and year
 */
function calculateMonthlyTotal(sheet, targetMonth, targetYear) {
  var values = sheet.getDataRange().getValues();
  var total = 0;
  for (var i = 1; i < values.length; i++) {
    var m = values[i][9];
    var y = values[i][10];
    var amt = parseFloat(values[i][4]) || 0;
    if (String(m).toLowerCase() === String(targetMonth).toLowerCase() && parseInt(y, 10) === parseInt(targetYear, 10)) {
      total += amt;
    }
  }
  return total;
}

/**
 * Format Indian Rupee currency: ₹1,250 / ₹1,25,000
 */
function formatRupee(amount) {
  var num = Math.round(amount);
  var str = num.toString();
  var lastThree = str.substring(str.length - 3);
  var otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  var res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return "₹" + res;
}

/**
 * Send Instant Email Notification on New Expense Added
 */
function sendExpenseNotificationEmail(params) {
  var formattedAmount = formatRupee(params.amount);
  var formattedMonthly = formatRupee(params.monthlyTotal);

  var subject = "New Expense Added – " + formattedAmount + " – " + params.category;
  
  var plainBody = 
    "New Expense Details:\n\n" +
    "Date: " + params.date + "\n" +
    "Category: " + params.category + "\n" +
    "Description: " + (params.description || "N/A") + "\n" +
    "Amount: " + formattedAmount + "\n" +
    "Payment Method: " + params.paymentMethod + "\n" +
    "Vendor: " + (params.vendor || "N/A") + "\n" +
    (params.notes ? "Notes: " + params.notes + "\n" : "") +
    (params.receiptUrl ? "Receipt Link: " + params.receiptUrl + "\n" : "") +
    "\nMonthly Total: " + formattedMonthly + "\n\n" +
    "Tracked with Daily Expense Tracker.";

  var htmlBody = 
    '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">' +
      '<div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:24px;text-align:center;color:#ffffff;">' +
        '<h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;">Expense Recorded</h1>' +
        '<p style="margin:0;font-size:14px;opacity:0.9;">Daily Expense Tracker</p>' +
      '</div>' +
      '<div style="padding:28px 24px;">' +
        '<div style="text-align:center;margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">' +
          '<div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Amount Spent</div>' +
          '<div style="font-size:32px;font-weight:800;color:#0f172a;">' + formattedAmount + '</div>' +
          '<div style="display:inline-block;margin-top:6px;padding:4px 12px;background:#e0f2fe;color:#0284c7;border-radius:20px;font-size:13px;font-weight:600;">' + params.category + '</div>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">' +
          '<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;width:38%;">Date</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;">' + params.date + '</td></tr>' +
          '<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Description</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;">' + (params.description || "—") + '</td></tr>' +
          '<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Payment Method</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;">' + params.paymentMethod + '</td></tr>' +
          '<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Vendor / Paid To</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;">' + (params.vendor || "—") + '</td></tr>' +
          (params.notes ? '<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Notes</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;">' + params.notes + '</td></tr>' : '') +
          (params.receiptUrl ? '<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Receipt</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;"><a href="' + params.receiptUrl + '" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:600;">View Uploaded Receipt &rarr;</a></td></tr>' : '') +
        '</table>' +
        '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="color:#166534;font-size:14px;font-weight:600;">Monthly Total (' + params.monthName + ')</span>' +
          '<span style="color:#15803d;font-size:18px;font-weight:800;">' + formattedMonthly + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="background:#f8fafc;padding:14px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">' +
        'Sent automatically via Daily Expense Tracker Web App &bull; Google Sheets' +
      '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: params.email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });
}

/**
 * Send Daily Expense Summary Email
 */
function sendDailySummaryEmail(targetDate, recipientEmail, sheetId) {
  if (!recipientEmail || recipientEmail.indexOf("@") === -1) {
    throw new Error("Valid email address is required for daily summary.");
  }

  var sheet = getExpensesSheet(sheetId);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    throw new Error("No expense records found in spreadsheet.");
  }

  // Parse target date formatted for display
  var targetParts = targetDate.split("-");
  var targetObj = new Date(parseInt(targetParts[0], 10), parseInt(targetParts[1], 10) - 1, parseInt(targetParts[2], 10));
  var displayDate = ("0" + targetObj.getDate()).slice(-2) + "-" + 
                    ("0" + (targetObj.getMonth() + 1)).slice(-2) + "-" + 
                    targetObj.getFullYear();
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var monthName = monthNames[targetObj.getMonth()];
  var yearVal = targetObj.getFullYear();

  var dailyTotal = 0;
  var transactionCount = 0;
  var categoryTotals = {};
  var transactionsList = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowDate = row[1];
    if (rowDate instanceof Date) {
      rowDate = Utilities.formatDate(rowDate, CONFIG.TIMEZONE, "yyyy-MM-dd");
    }

    if (String(rowDate) === String(targetDate)) {
      var amt = parseFloat(row[4]) || 0;
      var cat = String(row[2] || "Other");
      var desc = String(row[3] || "");
      var vdr = String(row[6] || "");

      dailyTotal += amt;
      transactionCount++;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

      transactionsList.push({
        category: cat,
        description: desc,
        amount: amt,
        vendor: vdr
      });
    }
  }

  var monthlyTotal = calculateMonthlyTotal(sheet, monthName, yearVal);

  // Build subject and body as specified in requirements
  var subject = "DAILY EXPENSE SUMMARY – " + displayDate + " – " + formatRupee(dailyTotal);

  var plainBody = 
    "DAILY EXPENSE SUMMARY\n\n" +
    "Date: " + displayDate + "\n\n" +
    "Total Expense: " + formatRupee(dailyTotal) + "\n\n";

  for (var c in categoryTotals) {
    plainBody += c + ": " + formatRupee(categoryTotals[c]) + "\n";
  }

  plainBody += "\nNumber of Transactions: " + transactionCount + "\n\n" +
    "Monthly Total: " + formatRupee(monthlyTotal) + "\n\n" +
    "Sent via Daily Expense Tracker";

  // HTML Body
  var catRows = "";
  for (var c in categoryTotals) {
    catRows += '<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;font-weight:600;">' + c + '</td>' +
      '<td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">' + formatRupee(categoryTotals[c]) + '</td></tr>';
  }

  var htmlBody = 
    '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">' +
      '<div style="background:#0f172a;padding:24px;text-align:center;color:#ffffff;">' +
        '<div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">End of Day Report</div>' +
        '<h1 style="margin:0;font-size:22px;font-weight:700;">DAILY EXPENSE SUMMARY</h1>' +
        '<p style="margin:6px 0 0 0;font-size:14px;color:#cbd5e1;">Date: ' + displayDate + '</p>' +
      '</div>' +
      '<div style="padding:28px 24px;">' +
        '<div style="background:#f8fafc;padding:20px;border-radius:10px;text-align:center;margin-bottom:24px;border:1px solid #e2e8f0;">' +
          '<div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Today\'s Total Expense</div>' +
          '<div style="font-size:34px;font-weight:800;color:#2563eb;margin:4px 0;">' + formatRupee(dailyTotal) + '</div>' +
          '<div style="font-size:13px;color:#64748b;">' + transactionCount + ' transaction' + (transactionCount !== 1 ? 's' : '') + ' recorded today</div>' +
        '</div>' +
        '<h3 style="font-size:15px;color:#0f172a;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px;">Category Breakdown</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">' +
          (catRows || '<tr><td style="padding:12px;text-align:center;color:#94a3b8;">No expenses recorded for today.</td></tr>') +
        '</table>' +
        '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="color:#166534;font-size:14px;font-weight:600;">Monthly Total (' + monthName + ')</span>' +
          '<span style="color:#15803d;font-size:18px;font-weight:800;">' + formatRupee(monthlyTotal) + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="background:#f8fafc;padding:14px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">' +
        'Daily Expense Tracker &bull; Auto-generated Daily Digest' +
      '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });

  return {
    success: true,
    message: "Daily summary email sent successfully.",
    date: displayDate,
    dailyTotal: dailyTotal,
    transactionCount: transactionCount,
    monthlyTotal: monthlyTotal
  };
}

/**
 * Send Monthly Expense Report Email
 */
function sendMonthlyReportEmail(targetMonth, targetYear, recipientEmail, sheetId) {
  if (!recipientEmail || recipientEmail.indexOf("@") === -1) {
    throw new Error("Valid email address is required for monthly report.");
  }

  var sheet = getExpensesSheet(sheetId);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    throw new Error("No expense records found.");
  }

  // Resolve target month name
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var monthName = targetMonth;
  if (!isNaN(parseInt(targetMonth, 10)) && parseInt(targetMonth, 10) >= 1 && parseInt(targetMonth, 10) <= 12) {
    monthName = monthNames[parseInt(targetMonth, 10) - 1];
  } else if (!targetMonth) {
    monthName = monthNames[new Date().getMonth()];
  }
  targetYear = parseInt(targetYear, 10) || new Date().getFullYear();

  var total = 0;
  var count = 0;
  var categoryTotals = {};
  var dailyTotals = {};
  var highestExpense = { amount: 0, category: "", description: "", date: "" };

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var m = String(row[9] || "");
    var y = parseInt(row[10], 10);

    if (m.toLowerCase() === monthName.toLowerCase() && y === targetYear) {
      var amt = parseFloat(row[4]) || 0;
      var cat = String(row[2] || "Other");
      var d = String(row[1] || "");

      total += amt;
      count++;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      dailyTotals[d] = (dailyTotals[d] || 0) + amt;

      if (amt > highestExpense.amount) {
        highestExpense = {
          amount: amt,
          category: cat,
          description: String(row[3] || ""),
          date: d
        };
      }
    }
  }

  // Calculate distinct active days
  var activeDaysCount = Object.keys(dailyTotals).length;
  var avgDaily = activeDaysCount > 0 ? (total / activeDaysCount) : 0;

  var subject = "Monthly Expense Report – " + monthName + " " + targetYear + " – " + formatRupee(total);

  var plainBody = 
    "MONTHLY EXPENSE REPORT: " + monthName.toUpperCase() + " " + targetYear + "\n\n" +
    "Total Expense: " + formatRupee(total) + "\n" +
    "Total Transactions: " + count + "\n" +
    "Average Daily Expense: " + formatRupee(avgDaily) + "\n" +
    "Highest Single Expense: " + formatRupee(highestExpense.amount) + " (" + highestExpense.category + " - " + highestExpense.description + ")\n\n" +
    "CATEGORY-WISE BREAKDOWN:\n";

  for (var c in categoryTotals) {
    var pct = total > 0 ? ((categoryTotals[c] / total) * 100).toFixed(1) : 0;
    plainBody += c + ": " + formatRupee(categoryTotals[c]) + " (" + pct + "%)\n";
  }

  // Format HTML rows
  var catRows = "";
  for (var c in categoryTotals) {
    var pct = total > 0 ? ((categoryTotals[c] / total) * 100).toFixed(1) : 0;
    catRows += '<tr>' +
      '<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e293b;">' + c + '</td>' +
      '<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;font-size:13px;">' + pct + '%</td>' +
      '<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#0f172a;">' + formatRupee(categoryTotals[c]) + '</td>' +
      '</tr>';
  }

  var htmlBody = 
    '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">' +
      '<div style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:26px;text-align:center;color:#ffffff;">' +
        '<div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Monthly Financial Overview</div>' +
        '<h1 style="margin:0;font-size:24px;font-weight:800;">' + monthName + ' ' + targetYear + ' Report</h1>' +
      '</div>' +
      '<div style="padding:28px 24px;">' +
        '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">' +
          '<div style="font-size:13px;color:#1d4ed8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total Monthly Expenditure</div>' +
          '<div style="font-size:36px;font-weight:800;color:#1e40af;margin:6px 0;">' + formatRupee(total) + '</div>' +
          '<div style="font-size:13px;color:#3b82f6;">' + count + ' total transactions</div>' +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-bottom:24px;">' +
          '<div style="flex:1;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;text-align:center;">' +
            '<div style="font-size:12px;color:#64748b;margin-bottom:2px;">Daily Average</div>' +
            '<div style="font-size:18px;font-weight:700;color:#0f172a;">' + formatRupee(avgDaily) + '</div>' +
          '</div>' +
          '<div style="flex:1;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;text-align:center;">' +
            '<div style="font-size:12px;color:#64748b;margin-bottom:2px;">Highest Expense</div>' +
            '<div style="font-size:18px;font-weight:700;color:#e11d48;">' + formatRupee(highestExpense.amount) + '</div>' +
          '</div>' +
        '</div>' +
        '<h3 style="font-size:15px;color:#0f172a;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px;">Category Breakdown</h3>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">' +
          (catRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">No expenses recorded for this month.</td></tr>') +
        '</table>' +
      '</div>' +
      '<div style="background:#f8fafc;padding:14px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">' +
        'Daily Expense Tracker &bull; Powered by Google Sheets & Apps Script' +
      '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });

  return {
    success: true,
    message: "Monthly report email sent successfully.",
    month: monthName,
    year: targetYear,
    total: total,
    count: count,
    avgDaily: avgDaily,
    highestExpense: highestExpense
  };
}

/**
 * Saves base64 receipt image to Google Drive folder and returns sharing URL
 */
function saveReceiptToDrive(dataUri, dateStr, category, amount) {
  try {
    var parts = dataUri.split(",");
    var meta = parts[0];
    var base64Data = parts[1];
    var mimeType = meta.split(";")[0].split(":")[1] || "image/jpeg";
    var ext = "jpg";
    if (mimeType.indexOf("png") !== -1) ext = "png";
    if (mimeType.indexOf("pdf") !== -1) ext = "pdf";

    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, "Receipt_" + dateStr + "_" + category + "_" + Math.round(amount) + "." + ext);

    // Get or create Receipts folder
    var folders = DriveApp.getFoldersByName(CONFIG.RECEIPTS_FOLDER_NAME);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(CONFIG.RECEIPTS_FOLDER_NAME);
    }

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("Failed to save receipt to Drive: " + err.toString());
    return "";
  }
}

/**
 * Get configured target email from script properties or fallback
 */
function getTargetEmail() {
  var prop = PropertiesService.getScriptProperties().getProperty("NOTIFICATION_EMAIL");
  if (prop && prop.indexOf("@") !== -1) return prop;
  if (CONFIG.DEFAULT_EMAIL && CONFIG.DEFAULT_EMAIL.indexOf("@") !== -1) return CONFIG.DEFAULT_EMAIL;
  try {
    return Session.getActiveUser().getEmail();
  } catch (e) {
    return "";
  }
}

/**
 * Run this function once from the Apps Script editor to setup the sheet structure
 */
function setupSheet() {
  var sheet = getExpensesSheet();
  initSheetHeaders(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast("Expenses Sheet initialized successfully!", "Done", 5);
}

/**
 * Run this function once from the Apps Script editor to automatically schedule
 * a daily expense summary email every evening at 9:00 PM IST
 */
function createDailySummaryTrigger() {
  // Delete existing triggers for sendDailyScheduledSummary to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendDailyScheduledSummary") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create new daily trigger at 21:00 (9:00 PM)
  ScriptApp.newTrigger("sendDailyScheduledSummary")
    .timeBased()
    .everyDays(1)
    .atHour(21)
    .inTimezone(CONFIG.TIMEZONE)
    .create();

  Logger.log("Daily summary trigger installed successfully for 9:00 PM IST.");
}

/**
 * Scheduled handler executed by the time-based trigger
 */
function sendDailyScheduledSummary() {
  var today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
  var email = getTargetEmail();
  if (email) {
    sendDailySummaryEmail(today, email, null);
  }
}
