/**
 * Google Apps Script Web App API Client
 * Handles communication between the frontend and Google Sheets / Apps Script backend
 */

const ApiClient = {
  /**
   * Helper to get active configuration
   */
  getConfig() {
    return window.ConfigManager ? window.ConfigManager.getConfig() : {};
  },

  /**
   * Test connection to Google Apps Script Web App
   */
  async testConnection(customUrl = null, customSheetId = null) {
    const config = this.getConfig();
    const url = customUrl || config.appsScriptUrl;
    const sheetId = customSheetId || config.googleSheetId;

    if (!url || !url.trim()) {
      return {
        success: false,
        error: 'Please enter a Google Apps Script Web App URL first.'
      };
    }

    try {
      // Build test URL with parameters
      const testUrl = new URL(url.trim());
      testUrl.searchParams.set('action', 'test');
      if (sheetId && sheetId.trim()) {
        testUrl.searchParams.set('sheetId', sheetId.trim());
      }

      const response = await fetch(testUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: data.success !== false,
        message: data.message || 'Connection established successfully!',
        data: data
      };
    } catch (err) {
      console.warn('GET test connection error, attempting POST fallback:', err);
      // Fallback test via POST
      try {
        const postResp = await fetch(url.trim(), {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({
            action: 'test',
            sheetId: sheetId ? sheetId.trim() : ''
          })
        });

        if (postResp.ok) {
          const postData = await postResp.json();
          return {
            success: true,
            message: postData.message || 'Connection verified via POST!',
            data: postData
          };
        }
      } catch (postErr) {
        // Fallback failed
      }

      return {
        success: false,
        error: `Connection test failed: ${err.message}. Please verify the Web App deployment is set to "Anyone" and permissions are granted.`
      };
    }
  },

  /**
   * Submit a new expense to Google Sheet & trigger instant email
   */
  async submitExpense(expenseData) {
    const config = this.getConfig();
    const url = config.appsScriptUrl;
    const sheetId = config.googleSheetId;
    const email = config.emailAddress;

    if (!url || !url.trim()) {
      return {
        success: false,
        offline: true,
        message: 'Google Apps Script URL not configured. Saved locally only.'
      };
    }

    const payload = {
      action: 'addExpense',
      sheetId: sheetId ? sheetId.trim() : '',
      email: email ? email.trim() : '',
      date: expenseData.date,
      category: expenseData.category,
      description: expenseData.description,
      amount: expenseData.amount,
      paymentMethod: expenseData.paymentMethod,
      vendor: expenseData.vendor,
      notes: expenseData.notes,
      receipt: expenseData.receipt || ''
    };

    try {
      const response = await fetch(url.trim(), {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // avoids preflight OPTIONS CORS issue
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Failed to submit expense to Google Apps Script:', err);
      return {
        success: false,
        error: err.message,
        message: 'Saved locally, but remote Google Sheet sync encountered an issue: ' + err.message
      };
    }
  },

  /**
   * Fetch all expenses from Google Sheet
   */
  async fetchExpenses() {
    const config = this.getConfig();
    const url = config.appsScriptUrl;
    const sheetId = config.googleSheetId;

    if (!url || !url.trim()) {
      return {
        success: false,
        message: 'Google Apps Script URL is not configured.'
      };
    }

    try {
      const fetchUrl = new URL(url.trim());
      fetchUrl.searchParams.set('action', 'getExpenses');
      if (sheetId && sheetId.trim()) {
        fetchUrl.searchParams.set('sheetId', sheetId.trim());
      }

      const response = await fetch(fetchUrl.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch expenses from Google Sheet:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  /**
   * Update an expense row in Google Sheet
   */
  async updateExpense(expenseData) {
    const config = this.getConfig();
    const url = config.appsScriptUrl;
    const sheetId = config.googleSheetId;

    if (!url || !url.trim()) return { success: false, message: 'Apps Script URL not set.' };

    const payload = {
      action: 'updateExpense',
      sheetId: sheetId ? sheetId.trim() : '',
      timestamp: expenseData.timestamp,
      rowIndex: expenseData.rowIndex,
      date: expenseData.date,
      category: expenseData.category,
      description: expenseData.description,
      amount: expenseData.amount,
      paymentMethod: expenseData.paymentMethod,
      vendor: expenseData.vendor,
      notes: expenseData.notes,
      receipt: expenseData.receipt
    };

    try {
      const response = await fetch(url.trim(), {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete an expense row from Google Sheet
   */
  async deleteExpense(timestamp, rowIndex = null) {
    const config = this.getConfig();
    const url = config.appsScriptUrl;
    const sheetId = config.googleSheetId;

    if (!url || !url.trim()) return { success: false, message: 'Apps Script URL not set.' };

    const payload = {
      action: 'deleteExpense',
      sheetId: sheetId ? sheetId.trim() : '',
      timestamp: timestamp,
      rowIndex: rowIndex
    };

    try {
      const response = await fetch(url.trim(), {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Trigger Daily Expense Summary Email
   */
  async sendDailySummary(targetDate = null, targetEmail = null) {
    const config = this.getConfig();
    const url = config.appsScriptUrl;
    const email = targetEmail || config.emailAddress;
    const date = targetDate || new Date().toISOString().split('T')[0];

    if (!url || !url.trim()) {
      return { success: false, message: 'Google Apps Script Web App URL is required to send emails.' };
    }
    if (!email || !email.trim()) {
      return { success: false, message: 'Recipient email address is required in Settings.' };
    }

    const payload = {
      action: 'sendDailySummary',
      sheetId: config.googleSheetId ? config.googleSheetId.trim() : '',
      date: date,
      email: email.trim()
    };

    try {
      const response = await fetch(url.trim(), {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Trigger Monthly Expense Report Email
   */
  async sendMonthlyReport(monthName, yearVal, targetEmail = null) {
    const config = this.getConfig();
    const url = config.appsScriptUrl;
    const email = targetEmail || config.emailAddress;

    if (!url || !url.trim()) {
      return { success: false, message: 'Google Apps Script Web App URL is required.' };
    }
    if (!email || !email.trim()) {
      return { success: false, message: 'Recipient email address is required.' };
    }

    const payload = {
      action: 'sendMonthlyReport',
      sheetId: config.googleSheetId ? config.googleSheetId.trim() : '',
      month: monthName,
      year: yearVal,
      email: email.trim()
    };

    try {
      const response = await fetch(url.trim(), {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

window.ApiClient = ApiClient;
