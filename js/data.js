/**
 * Expense Data Manager
 * Handles local storage persistence, CRUD, statistics calculations, and sample data
 */

const CATEGORIES = [
  { id: 'Petrol / Fuel', name: 'Petrol / Fuel', icon: 'fuel', color: '#f59e0b', bg: '#fef3c7' },
  { id: 'Food', name: 'Food', icon: 'utensils', color: '#10b981', bg: '#d1fae5' },
  { id: 'Travel', name: 'Travel', icon: 'plane', color: '#3b82f6', bg: '#dbeafe' },
  { id: 'Shopping', name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', bg: '#fce7f3' },
  { id: 'Bills', name: 'Bills', icon: 'receipt', color: '#8b5cf6', bg: '#ede9fe' },
  { id: 'Medical', name: 'Medical', icon: 'activity', color: '#ef4444', bg: '#fee2e2' },
  { id: 'Rent / Home', name: 'Rent / Home', icon: 'home', color: '#6366f1', bg: '#e0e7ff' },
  { id: 'EMI / Loan', name: 'EMI / Loan', icon: 'credit-card', color: '#0284c7', bg: '#e0f2fe' },
  { id: 'Personal', name: 'Personal', icon: 'user', color: '#14b8a6', bg: '#ccfbf1' },
  { id: 'Business', name: 'Business', icon: 'briefcase', color: '#475569', bg: '#f1f5f9' },
  { id: 'Education', name: 'Education', icon: 'book-open', color: '#f97316', bg: '#ffedd5' },
  { id: 'Entertainment', name: 'Entertainment', icon: 'film', color: '#a855f7', bg: '#f3e8ff' },
  { id: 'Vehicle', name: 'Vehicle', icon: 'truck', color: '#06b6d4', bg: '#cffafe' },
  { id: 'Family', name: 'Family', icon: 'users', color: '#d97706', bg: '#fef3c7' },
  { id: 'Other', name: 'Other', icon: 'more-horizontal', color: '#64748b', bg: '#f8fafc' }
];

const PAYMENT_METHODS = [
  { id: 'Cash', name: 'Cash', icon: 'banknote' },
  { id: 'UPI', name: 'UPI', icon: 'smartphone' },
  { id: 'Debit Card', name: 'Debit Card', icon: 'credit-card' },
  { id: 'Credit Card', name: 'Credit Card', icon: 'credit-card' },
  { id: 'Bank Transfer', name: 'Bank Transfer', icon: 'building' },
  { id: 'Other', name: 'Other', icon: 'wallet' }
];

// Realistic sample expenses for out-of-the-box demonstration
const INITIAL_SAMPLE_EXPENSES = [
  {
    id: 'exp_1',
    timestamp: '2026-10-01 08:30:00',
    date: '2026-10-01',
    category: 'Petrol / Fuel',
    description: 'Petrol for bike',
    amount: 500,
    paymentMethod: 'UPI',
    vendor: 'BPCL Petrol Pump',
    notes: 'Full tank speed petrol',
    receipt: '',
    month: 'October',
    year: 2026
  },
  {
    id: 'exp_2',
    timestamp: '2026-10-01 13:15:00',
    date: '2026-10-01',
    category: 'Food',
    description: 'Lunch with team',
    amount: 450,
    paymentMethod: 'UPI',
    vendor: 'Bawarchi Restaurant',
    notes: 'Split with Rahul',
    receipt: '',
    month: 'October',
    year: 2026
  },
  {
    id: 'exp_3',
    timestamp: '2026-10-01 15:40:00',
    date: '2026-10-01',
    category: 'Travel',
    description: 'Auto rickshaw to client office',
    amount: 300,
    paymentMethod: 'Cash',
    vendor: 'Ola Auto',
    notes: 'Client meeting',
    receipt: '',
    month: 'October',
    year: 2026
  },
  {
    id: 'exp_4',
    timestamp: '2026-10-01 17:00:00',
    date: '2026-10-01',
    category: 'Shopping',
    description: 'Groceries for home',
    amount: 600,
    paymentMethod: 'Credit Card',
    vendor: 'Reliance Smart',
    notes: 'Vegetables and fruits',
    receipt: '',
    month: 'October',
    year: 2026
  },
  {
    id: 'exp_5',
    timestamp: '2026-09-30 19:20:00',
    date: '2026-09-30',
    category: 'Bills',
    description: 'Electricity bill',
    amount: 2400,
    paymentMethod: 'UPI',
    vendor: 'BESCOM',
    notes: 'September power bill',
    receipt: '',
    month: 'September',
    year: 2026
  },
  {
    id: 'exp_6',
    timestamp: '2026-09-28 10:00:00',
    date: '2026-09-28',
    category: 'Rent / Home',
    description: 'Monthly apartment rent',
    amount: 15000,
    paymentMethod: 'Bank Transfer',
    vendor: 'Landlord',
    notes: 'October rent advance',
    receipt: '',
    month: 'September',
    year: 2026
  },
  {
    id: 'exp_7',
    timestamp: '2026-09-25 14:10:00',
    date: '2026-09-25',
    category: 'Medical',
    description: 'Pharmacy medicines & vitamins',
    amount: 850,
    paymentMethod: 'Debit Card',
    vendor: 'Apollo Pharmacy',
    notes: 'Prescription refill',
    receipt: '',
    month: 'September',
    year: 2026
  },
  {
    id: 'exp_8',
    timestamp: '2026-09-22 18:30:00',
    date: '2026-09-22',
    category: 'Entertainment',
    description: 'Movie tickets & popcorn',
    amount: 950,
    paymentMethod: 'Credit Card',
    vendor: 'PVR Cinemas',
    notes: 'Weekend movie',
    receipt: '',
    month: 'September',
    year: 2026
  },
  {
    id: 'exp_9',
    timestamp: '2026-09-20 11:00:00',
    date: '2026-09-20',
    category: 'Vehicle',
    description: 'Bike routine service & oil change',
    amount: 2200,
    paymentMethod: 'UPI',
    vendor: 'Honda Service Center',
    notes: 'Engine oil and brake pads',
    receipt: '',
    month: 'September',
    year: 2026
  },
  {
    id: 'exp_10',
    timestamp: '2026-09-15 16:45:00',
    date: '2026-09-15',
    category: 'Food',
    description: 'Family buffet dinner',
    amount: 1800,
    paymentMethod: 'Credit Card',
    vendor: 'Barbeque Nation',
    notes: 'Family dinner celebration',
    receipt: '',
    month: 'September',
    year: 2026
  },
  {
    id: 'exp_11',
    timestamp: '2026-09-10 12:00:00',
    date: '2026-09-10',
    category: 'EMI / Loan',
    description: 'Car loan monthly EMI',
    amount: 8500,
    paymentMethod: 'Bank Transfer',
    vendor: 'HDFC Bank',
    notes: 'Monthly auto-debit',
    receipt: '',
    month: 'September',
    year: 2026
  },
  {
    id: 'exp_12',
    timestamp: '2026-09-05 09:30:00',
    date: '2026-09-05',
    category: 'Petrol / Fuel',
    description: 'Car fuel for road trip',
    amount: 3500,
    paymentMethod: 'Credit Card',
    vendor: 'HP Petrol Pump',
    notes: 'Highway trip full tank',
    receipt: '',
    month: 'September',
    year: 2026
  }
];

const DataStore = {
  /**
   * Format number in Indian Rupee format: ₹1,250 / ₹5,500 / ₹25,000 / ₹1,25,000
   */
  formatINR(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    const num = Math.round(Number(amount));
    const isNegative = num < 0;
    const absStr = Math.abs(num).toString();
    
    let lastThree = absStr.substring(absStr.length - 3);
    const otherNumbers = absStr.substring(0, absStr.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    return (isNegative ? '-₹' : '₹') + res;
  },

  /**
   * Format standard date YYYY-MM-DD to DD-MM-YYYY
   */
  formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  },

  /**
   * Get all expenses from localStorage or initialize with sample data
   */
  getExpenses() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to read expenses from storage', e);
    }
    // Initialize with sample data if empty
    this.saveExpenses(INITIAL_SAMPLE_EXPENSES);
    return [...INITIAL_SAMPLE_EXPENSES];
  },

  /**
   * Save expenses array to localStorage
   */
  saveExpenses(expenses) {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      return true;
    } catch (e) {
      console.error('Failed to save expenses to storage', e);
      return false;
    }
  },

  /**
   * Add a new expense record
   */
  addExpense(expenseData) {
    const expenses = this.getExpenses();
    
    // Parse date components
    const dateStr = expenseData.date || new Date().toISOString().split('T')[0];
    const parts = dateStr.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[dateObj.getMonth()];
    const yearVal = dateObj.getFullYear();

    const now = new Date();
    const timestampStr = expenseData.timestamp || 
      `${dateStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: timestampStr,
      date: dateStr,
      category: expenseData.category || 'Other',
      description: expenseData.description || '',
      amount: parseFloat(expenseData.amount) || 0,
      paymentMethod: expenseData.paymentMethod || 'UPI',
      vendor: expenseData.vendor || '',
      notes: expenseData.notes || '',
      receipt: expenseData.receipt || '',
      month: monthName,
      year: yearVal
    };

    // Prepend to top of list
    expenses.unshift(newExpense);
    this.saveExpenses(expenses);
    return newExpense;
  },

  /**
   * Update an existing expense
   */
  updateExpense(id, updatedData) {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === id || e.timestamp === id);
    if (index === -1) return null;

    // If date changed, recompute month and year
    let monthName = expenses[index].month;
    let yearVal = expenses[index].year;
    if (updatedData.date && updatedData.date !== expenses[index].date) {
      const parts = updatedData.date.split('-');
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      monthName = monthNames[dateObj.getMonth()];
      yearVal = dateObj.getFullYear();
    }

    expenses[index] = {
      ...expenses[index],
      ...updatedData,
      amount: updatedData.amount !== undefined ? parseFloat(updatedData.amount) : expenses[index].amount,
      month: monthName,
      year: yearVal
    };

    this.saveExpenses(expenses);
    return expenses[index];
  },

  /**
   * Delete an expense
   */
  deleteExpense(id) {
    const expenses = this.getExpenses();
    const filtered = expenses.filter(e => e.id !== id && e.timestamp !== id);
    if (filtered.length !== expenses.length) {
      this.saveExpenses(filtered);
      return true;
    }
    return false;
  },

  /**
   * Reset data to initial sample expenses
   */
  resetToSampleData() {
    this.saveExpenses(INITIAL_SAMPLE_EXPENSES);
    return [...INITIAL_SAMPLE_EXPENSES];
  },

  /**
   * Clear all local expense records
   */
  clearAllExpenses() {
    this.saveExpenses([]);
    return [];
  },

  /**
   * Merge or replace with records loaded from Google Sheets
   */
  syncFromRemote(remoteExpenses) {
    if (!Array.isArray(remoteExpenses)) return;
    this.saveExpenses(remoteExpenses);
  },

  /**
   * Calculate comprehensive statistics for dashboard, cards, and reports
   */
  calculateStats(expensesList = null) {
    const expenses = expensesList || this.getExpenses();
    
    // Determine today, current week, current month
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Week start (Monday)
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    let todayTotal = 0;
    let thisWeekTotal = 0;
    let thisMonthTotal = 0;
    let highestExpense = { amount: 0, category: 'None', description: '', date: '' };
    
    const categoryTotals = {};
    const paymentTotals = {};
    const dailyTotalsMap = {};
    const monthlyTotalsMap = {};

    expenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      const cat = exp.category || 'Other';
      const pm = exp.paymentMethod || 'Other';
      const dStr = exp.date || '';

      // Check highest
      if (amt > highestExpense.amount) {
        highestExpense = {
          amount: amt,
          category: cat,
          description: exp.description || '',
          date: dStr
        };
      }

      // Category aggregation
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

      // Payment method aggregation
      paymentTotals[pm] = (paymentTotals[pm] || 0) + amt;

      // Daily aggregation
      if (dStr) {
        dailyTotalsMap[dStr] = (dailyTotalsMap[dStr] || 0) + amt;
      }

      // Monthly aggregation
      const mLabel = exp.month ? `${exp.month} ${exp.year || currentYear}` : 'Other';
      monthlyTotalsMap[mLabel] = (monthlyTotalsMap[mLabel] || 0) + amt;

      // Today's total
      if (dStr === todayStr) {
        todayTotal += amt;
      }

      // This week total
      if (dStr) {
        const parts = dStr.split('-');
        const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (expDate >= startOfWeek && expDate <= now) {
          thisWeekTotal += amt;
        }
      }

      // This month total
      if (exp.month && exp.month.toLowerCase() === currentMonthName.toLowerCase() && 
          (!exp.year || Number(exp.year) === currentYear)) {
        thisMonthTotal += amt;
      } else if (dStr) {
        const parts = dStr.split('-');
        if (parseInt(parts[0], 10) === currentYear && parseInt(parts[1], 10) === (now.getMonth() + 1)) {
          // If month string wasn't matching, check date
          if (!exp.month) thisMonthTotal += amt;
        }
      }
    });

    // Total expense count
    const totalCount = expenses.length;

    // Average daily expense across active days
    const activeDays = Object.keys(dailyTotalsMap).length;
    const allExpensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const averageDaily = activeDays > 0 ? Math.round(allExpensesTotal / activeDays) : 0;

    return {
      todayTotal,
      thisWeekTotal,
      thisMonthTotal,
      totalCount,
      averageDaily,
      highestExpense,
      allExpensesTotal,
      categoryTotals,
      paymentTotals,
      dailyTotalsMap,
      monthlyTotalsMap,
      currentMonthName,
      currentYear
    };
  }
};

window.CATEGORIES = CATEGORIES;
window.PAYMENT_METHODS = PAYMENT_METHODS;
window.DataStore = DataStore;
