/**
 * Daily Expense Tracker - Main Application Logic
 * Wires events, handles form validation, manages duplicate protection, and synchronizes with Google Apps Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  window.UI.init();

  // Set default date in expense form to today's date
  const todayStr = new Date().toISOString().split('T')[0];
  const expenseDateInput = document.getElementById('expenseDate');
  if (expenseDateInput) {
    expenseDateInput.value = todayStr;
  }

  // Initial dashboard and charts render
  window.UI.renderDashboard();

  // Setup form submission
  setupExpenseForm();

  // Setup edit form submission
  setupEditExpenseForm();

  // Setup settings form & test connection
  setupSettingsHandlers();

  // Setup navigation tabs
  setupNavigationHandlers();

  // Setup filters & search
  setupHistoryFilters();

  // Setup receipt file preview
  setupReceiptHandlers();

  // Setup quick action buttons
  setupQuickActionButtons();

  // Setup monthly report buttons
  setupReportActions();
});

/**
 * 1. Main Expense Entry Form Handler
 * Validates inputs, prevents duplicate submissions, stores locally, and syncs to Google Sheets & Email
 */
function setupExpenseForm() {
  const form = document.getElementById('expenseForm');
  const saveBtn = document.getElementById('saveExpenseBtn');
  const receiptInput = document.getElementById('expenseReceipt');
  const receiptPreview = document.getElementById('receiptInputPreview');

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Prevent accidental duplicate submissions
    if (isSubmitting) return;

    // Extract form values
    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value.trim();
    const amountVal = document.getElementById('expenseAmount').value.trim();
    const paymentMethod = document.getElementById('expensePaymentMethod').value;
    const vendor = document.getElementById('expenseVendor').value.trim();
    const notes = document.getElementById('expenseNotes').value.trim();

    // Strict Validation
    if (!date) {
      window.UI.showToast('Please select a valid date.', 'error');
      document.getElementById('expenseDate').focus();
      return;
    }

    if (!category) {
      window.UI.showToast('Please select an expense category.', 'error');
      document.getElementById('expenseCategory').focus();
      return;
    }

    const amount = parseFloat(amountVal);
    if (isNaN(amount) || amount <= 0) {
      window.UI.showToast('Please enter a valid amount greater than ₹0.', 'error');
      document.getElementById('expenseAmount').focus();
      return;
    }

    // Set submitting state
    isSubmitting = true;
    saveBtn.disabled = true;
    const originalBtnHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Saving Expense...
    `;

    try {
      // Process receipt image file if present
      let receiptBase64 = '';
      if (receiptInput && receiptInput.files && receiptInput.files[0]) {
        receiptBase64 = await readFileAsBase64(receiptInput.files[0]);
      }

      const expenseRecord = {
        date,
        category,
        description,
        amount,
        paymentMethod,
        vendor,
        notes,
        receipt: receiptBase64
      };

      // 1. Save locally for instant optimistic UI
      const savedExpense = window.DataStore.addExpense(expenseRecord);

      // 2. Sync to Google Sheets and send email notification if configured
      let remoteMessage = '';
      if (window.ConfigManager.isConfigured()) {
        try {
          const apiResp = await window.ApiClient.submitExpense({
            ...expenseRecord,
            timestamp: savedExpense.timestamp
          });

          if (apiResp.success) {
            if (apiResp.data && apiResp.data.receiptUrl) {
              window.DataStore.updateExpense(savedExpense.id, { receipt: apiResp.data.receiptUrl });
            }
            if (apiResp.emailSent) {
              remoteMessage = ' & email notification sent!';
            }
          }
        } catch (apiErr) {
          console.warn('Google Sheet submission warning:', apiErr);
        }
      }

      // Confirmation message as required: "Expense saved successfully."
      window.UI.showToast(`Expense saved successfully.${remoteMessage}`, 'success');

      // Reset Form fields
      form.reset();
      document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('expensePaymentMethod').value = 'UPI';
      if (receiptPreview) {
        receiptPreview.classList.add('hidden');
        receiptPreview.src = '';
      }

      // Refresh Dashboard and History
      window.UI.renderDashboard();
      window.UI.renderHistoryTable();
      window.UI.renderMonthlyReport();

      // Switch back to dashboard after save
      setTimeout(() => {
        window.UI.switchTab('dashboard');
      }, 500);

    } catch (err) {
      console.error('Error saving expense:', err);
      window.UI.showToast(`Error saving expense: ${err.message}`, 'error');
    } finally {
      isSubmitting = false;
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalBtnHtml;
      window.UI.initLucideIcons();
    }
  });
}

/**
 * 2. Edit Expense Modal Form Handler
 */
function setupEditExpenseForm() {
  const form = document.getElementById('editExpenseForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = window.UI.currentEditingId;
    if (!id) return;

    const date = document.getElementById('editExpenseDate').value;
    const category = document.getElementById('editExpenseCategory').value;
    const description = document.getElementById('editExpenseDescription').value.trim();
    const amountVal = document.getElementById('editExpenseAmount').value.trim();
    const paymentMethod = document.getElementById('editExpensePaymentMethod').value;
    const vendor = document.getElementById('editExpenseVendor').value.trim();
    const notes = document.getElementById('editExpenseNotes').value.trim();

    const amount = parseFloat(amountVal);
    if (isNaN(amount) || amount <= 0) {
      window.UI.showToast('Please enter a valid amount.', 'error');
      return;
    }

    const updated = window.DataStore.updateExpense(id, {
      date,
      category,
      description,
      amount,
      paymentMethod,
      vendor,
      notes
    });

    if (updated) {
      // Sync update to Google Sheets if configured
      if (window.ConfigManager.isConfigured()) {
        window.ApiClient.updateExpense(updated).catch(e => console.warn('Remote update failed:', e));
      }

      window.UI.showToast('Expense updated successfully.', 'success');
      window.UI.closeEditModal();
      window.UI.renderDashboard();
      window.UI.renderHistoryTable();
      window.UI.renderMonthlyReport();
    }
  });
}

/**
 * 3. Settings & Google Sheets Connection Handlers
 */
function setupSettingsHandlers() {
  const saveBtn = document.getElementById('saveSettingsBtn');
  const testBtn = document.getElementById('testConnectionBtn');
  const testStatus = document.getElementById('testConnectionStatus');

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const sheetId = document.getElementById('settingsSheetId').value.trim();
      const scriptUrl = document.getElementById('settingsScriptUrl').value.trim();
      const email = document.getElementById('settingsEmail').value.trim();

      window.ConfigManager.saveConfig({
        googleSheetId: sheetId,
        appsScriptUrl: scriptUrl,
        emailAddress: email
      });

      window.UI.updateConnectionStatusBadge();
      window.UI.showToast('Settings saved successfully!', 'success');
      window.UI.closeSettingsModal();
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const scriptUrl = document.getElementById('settingsScriptUrl').value.trim();
      const sheetId = document.getElementById('settingsSheetId').value.trim();

      if (!scriptUrl) {
        testStatus.innerHTML = '<span class="text-rose-600 text-xs font-semibold">Please enter your Apps Script Web App URL first.</span>';
        return;
      }

      testBtn.disabled = true;
      testStatus.innerHTML = '<span class="text-blue-600 text-xs font-semibold animate-pulse">Testing connection to Google Sheets...</span>';

      const result = await window.ApiClient.testConnection(scriptUrl, sheetId);
      testBtn.disabled = false;

      if (result.success) {
        testStatus.innerHTML = `<span class="text-emerald-600 text-xs font-semibold">✓ ${result.message || 'Connected successfully to Google Apps Script!'}</span>`;
      } else {
        testStatus.innerHTML = `<span class="text-rose-600 text-xs font-semibold">✕ ${result.error || 'Connection failed'}</span>`;
      }
    });
  }
}

/**
 * 4. Navigation & Tab Switching
 */
function setupNavigationHandlers() {
  // Desktop header navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      if (tab) window.UI.switchTab(tab);
    });
  });

  // Mobile bottom navigation buttons
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      if (tab) window.UI.switchTab(tab);
    });
  });
}

/**
 * 5. History Table Filters & Search
 */
function setupHistoryFilters() {
  const searchInput = document.getElementById('historySearch');
  const catFilter = document.getElementById('filterCategory');
  const payFilter = document.getElementById('filterPaymentMethod');
  const dateFilter = document.getElementById('filterDateRange');
  const sortBy = document.getElementById('historySortBy');

  const refreshHistory = () => {
    window.UI.renderHistoryTable();
  };

  if (searchInput) searchInput.addEventListener('input', debounce(refreshHistory, 250));
  if (catFilter) catFilter.addEventListener('change', refreshHistory);
  if (payFilter) payFilter.addEventListener('change', refreshHistory);
  if (dateFilter) dateFilter.addEventListener('change', refreshHistory);
  if (sortBy) sortBy.addEventListener('change', refreshHistory);
}

/**
 * 6. Receipt File Upload & Instant Preview
 */
function setupReceiptHandlers() {
  const fileInput = document.getElementById('expenseReceipt');
  const previewImg = document.getElementById('receiptInputPreview');
  const removeBtn = document.getElementById('removeReceiptBtn');

  if (fileInput && previewImg) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          window.UI.showToast('Receipt file size exceeds 5MB limit.', 'error');
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          previewImg.classList.remove('hidden');
          if (removeBtn) removeBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        fileInput.value = '';
        previewImg.src = '';
        previewImg.classList.add('hidden');
        removeBtn.classList.add('hidden');
      });
    }
  }
}

/**
 * 7. Quick Expense Action Buttons
 * + Petrol, + Food, + Travel, + Shopping, + Bills, + Other
 */
function setupQuickActionButtons() {
  document.querySelectorAll('.quick-expense-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      if (category) {
        window.UI.handleQuickExpense(category);
      }
    });
  });

  // Daily Summary Now button
  const dailySummaryBtn = document.getElementById('sendDailySummaryBtn');
  if (dailySummaryBtn) {
    dailySummaryBtn.addEventListener('click', async () => {
      const config = window.ConfigManager.getConfig();
      if (!config.appsScriptUrl || !config.emailAddress) {
        window.UI.showToast('Please configure Google Apps Script URL and Email in Settings first.', 'warning');
        window.UI.openSettingsModal();
        return;
      }

      dailySummaryBtn.disabled = true;
      dailySummaryBtn.innerHTML = '<span class="inline-block animate-spin mr-1">⌛</span> Sending...';
      
      const today = new Date().toISOString().split('T')[0];
      const res = await window.ApiClient.sendDailySummary(today, config.emailAddress);
      
      dailySummaryBtn.disabled = false;
      dailySummaryBtn.innerHTML = '<i data-lucide="mail" class="w-4 h-4 mr-1.5"></i> Send Daily Summary Now';
      window.UI.initLucideIcons();

      if (res.success) {
        window.UI.showToast('Daily expense summary email sent successfully!', 'success');
      } else {
        window.UI.showToast(`Failed to send summary: ${res.message || res.error}`, 'error');
      }
    });
  }

  // Pull / Sync from Google Sheets button
  const syncBtn = document.getElementById('syncGoogleSheetBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      if (!window.ConfigManager.isConfigured()) {
        window.UI.showToast('Configure your Google Apps Script Web App URL first.', 'warning');
        window.UI.openSettingsModal();
        return;
      }

      syncBtn.disabled = true;
      syncBtn.innerHTML = '<span class="inline-block animate-spin mr-1">🔄</span> Syncing...';

      const res = await window.ApiClient.fetchExpenses();
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 mr-1.5"></i> Sync from Sheet';
      window.UI.initLucideIcons();

      if (res.success && Array.isArray(res.expenses)) {
        window.DataStore.syncFromRemote(res.expenses);
        window.UI.showToast(`Synced ${res.expenses.length} expenses from Google Sheet!`, 'success');
        window.UI.renderDashboard();
        window.UI.renderHistoryTable();
        window.UI.renderMonthlyReport();
      } else {
        window.UI.showToast(`Sync failed: ${res.error || res.message}`, 'error');
      }
    });
  }
}

/**
 * 8. Monthly Report Action Handlers
 */
function setupReportActions() {
  const monthSelect = document.getElementById('reportMonthSelect');
  const yearSelect = document.getElementById('reportYearSelect');
  const downloadCsvBtn = document.getElementById('downloadMonthlyReportBtn');
  const emailReportBtn = document.getElementById('emailMonthlyReportBtn');

  if (monthSelect) monthSelect.addEventListener('change', () => window.UI.renderMonthlyReport());
  if (yearSelect) yearSelect.addEventListener('change', () => window.UI.renderMonthlyReport());

  if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener('click', () => {
      window.UI.downloadMonthlyReportCsv();
    });
  }

  if (emailReportBtn) {
    emailReportBtn.addEventListener('click', async () => {
      const config = window.ConfigManager.getConfig();
      if (!config.appsScriptUrl || !config.emailAddress) {
        window.UI.showToast('Please configure Google Apps Script URL and Email in Settings first.', 'warning');
        window.UI.openSettingsModal();
        return;
      }

      const selectedMonth = monthSelect ? monthSelect.value : 'October';
      const selectedYear = yearSelect ? yearSelect.value : '2026';

      emailReportBtn.disabled = true;
      emailReportBtn.innerHTML = '<span class="inline-block animate-spin mr-1">⌛</span> Sending...';

      const res = await window.ApiClient.sendMonthlyReport(selectedMonth, selectedYear, config.emailAddress);

      emailReportBtn.disabled = false;
      emailReportBtn.innerHTML = '<i data-lucide="mail" class="w-4 h-4 mr-1.5"></i> Email Monthly Report';
      window.UI.initLucideIcons();

      if (res.success) {
        window.UI.showToast(`Monthly report for ${selectedMonth} ${selectedYear} emailed successfully!`, 'success');
      } else {
        window.UI.showToast(`Failed to send report: ${res.message || res.error}`, 'error');
      }
    });
  }
}

/**
 * Read File as Data URL (Base64)
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Debounce utility
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
