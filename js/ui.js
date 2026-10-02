/**
 * UI Controller & Rendering Engine
 * Handles tabs, modals, notifications, dashboard cards, history tables, and monthly reports
 */
const UI = {
  activeTab: 'dashboard',
  currentEditingId: null,
  /**
   * Initialize UI icons and event hooks
   */
  init() {
    this.initLucideIcons();
    this.populateCategorySelects();
    this.populatePaymentSelects();
    this.populateMonthYearSelectors();
    this.updateConnectionStatusBadge();
  },
  /**
   * Render Lucide icons
   */
  initLucideIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },
  /**
   * Switch active navigation tab
   */
  switchTab(tabId) {
    this.activeTab = tabId;
    // Update tab content visibility
    const views = document.querySelectorAll('.tab-view');
    views.forEach(v => {
      if (v.id === `tab-${tabId}`) {
        v.classList.remove('hidden');
      } else {
        v.classList.add('hidden');
      }
    });
    // Update active state in desktop header navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('text-blue-600', 'bg-blue-50', 'font-semibold');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
      } else {
        btn.classList.remove('text-blue-600', 'bg-blue-50', 'font-semibold');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    });
    // Update active state in mobile bottom navigation
    const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
    mobileNavButtons.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('text-blue-600', 'font-bold');
        btn.classList.remove('text-slate-500');
      } else {
        btn.classList.remove('text-blue-600', 'font-bold');
        btn.classList.add('text-slate-500');
      }
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Refresh charts if switching to dashboard
    if (tabId === 'dashboard') {
      setTimeout(() => {
        window.ChartManager.updateAllCharts();
      }, 50);
    } else if (tabId === 'history') {
      this.renderHistoryTable();
    } else if (tabId === 'reports') {
      this.renderMonthlyReport();
    }
    this.initLucideIcons();
  },
  /**
   * Show Toast Notification
   */
  showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white transform transition-all duration-300 translate-y-3 opacity-0 text-sm font-medium z-50 ${
      type === 'success' ? 'bg-emerald-600' :
      type === 'error' ? 'bg-rose-600' :
      type === 'warning' ? 'bg-amber-600' : 'bg-slate-800'
    }`;
    const iconName = type === 'success' ? 'check-circle' :
                     type === 'error' ? 'alert-triangle' :
                     type === 'warning' ? 'alert-circle' : 'info';
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
      <span class="flex-1">${message}</span>
      <button class="opacity-75 hover:opacity-100 transition-opacity ml-2" onclick="this.parentElement.remove()">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;
    container.appendChild(toast);
    this.initLucideIcons();
    // Trigger animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-3', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  /**
   * Populate category selects and chips
   */
  populateCategorySelects() {
    const select = document.getElementById('expenseCategory');
    const filterSelect = document.getElementById('filterCategory');
    const editSelect = document.getElementById('editExpenseCategory');
    const optionsHtml = window.CATEGORIES.map(c => 
      `<option value="${c.name}">${c.name}</option>`
    ).join('');
    if (select) {
      select.innerHTML = '<option value="" disabled selected>Select Category...</option>' + optionsHtml;
    }
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Categories</option>' + optionsHtml;
    }
    if (editSelect) {
      editSelect.innerHTML = optionsHtml;
    }
  },
  /**
   * Populate payment method selects
   */
  populatePaymentSelects() {
    const select = document.getElementById('expensePaymentMethod');
    const filterSelect = document.getElementById('filterPaymentMethod');
    const editSelect = document.getElementById('editExpensePaymentMethod');
    const optionsHtml = window.PAYMENT_METHODS.map(p => 
      `<option value="${p.name}">${p.name}</option>`
    ).join('');
    if (select) {
      select.innerHTML = optionsHtml;
      select.value = 'UPI'; // Sensible default
    }
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Payment Methods</option>' + optionsHtml;
    }
    if (editSelect) {
      editSelect.innerHTML = optionsHtml;
    }
  },
  /**
   * Populate Month & Year selector for Monthly Reports
   */
  populateMonthYearSelectors() {
    const monthSelect = document.getElementById('reportMonthSelect');
    const yearSelect = document.getElementById('reportYearSelect');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();
    if (monthSelect) {
      monthSelect.innerHTML = monthNames.map((m, idx) => 
        `<option value="${m}" ${idx === currentMonthIdx ? 'selected' : ''}>${m}</option>`
      ).join('');
    }
    if (yearSelect) {
      const years = [currentYear - 1, currentYear, currentYear + 1];
      yearSelect.innerHTML = years.map(y => 
        `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`
      ).join('');
    }
  },
  /**
   * Quick Expense button clicked (+ Petrol, + Food, etc.)
   */
  handleQuickExpense(categoryName) {
    this.switchTab('add-expense');
    const catSelect = document.getElementById('expenseCategory');
    if (catSelect) {
      catSelect.value = categoryName;
    }
    // Default date to today
    const dateInput = document.getElementById('expenseDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    // Focus on amount for immediate numeric entry
    const amountInput = document.getElementById('expenseAmount');
    if (amountInput) {
      setTimeout(() => {
        amountInput.focus();
        amountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  },
  /**
   * Render Dashboard Statistics & Cards
   */
  renderDashboard() {
    const expenses = window.DataStore.getExpenses();
    const stats = window.DataStore.calculateStats(expenses);
    // Main KPI cards
    const todayEl = document.getElementById('statTodayTotal');
    const weekEl = document.getElementById('statWeekTotal');
    const monthEl = document.getElementById('statMonthTotal');
    const countEl = document.getElementById('statTotalCount');
    const avgEl = document.getElementById('statAvgDaily');
    const highEl = document.getElementById('statHighest');
    const highDescEl = document.getElementById('statHighestDesc');
    if (todayEl) todayEl.textContent = window.DataStore.formatINR(stats.todayTotal);
    if (weekEl) weekEl.textContent = window.DataStore.formatINR(stats.thisWeekTotal);
    if (monthEl) monthEl.textContent = window.DataStore.formatINR(stats.thisMonthTotal);
    if (countEl) countEl.textContent = stats.totalCount;
    if (avgEl) avgEl.textContent = window.DataStore.formatINR(stats.averageDaily);
    if (highEl) highEl.textContent = window.DataStore.formatINR(stats.highestExpense.amount);
    if (highDescEl) {
      highDescEl.textContent = stats.highestExpense.amount > 0 ? 
        `${stats.highestExpense.category} • ${stats.highestExpense.description || 'No desc'}` : 
        'No transactions yet';
    }
    // Render Category-wise summary cards
    this.renderCategoryCards(stats);
    // Render Recent 5 Transactions in dashboard
    this.renderRecentTransactions(expenses);
    // Refresh charts
    window.ChartManager.updateAllCharts();
  },
  /**
   * Render Category-wise summary cards with progress bars
   */
  renderCategoryCards(stats) {
    const container = document.getElementById('categoryCardsContainer');
    if (!container) return;
    const entries = Object.entries(stats.categoryTotals)
      .sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-8 text-center text-slate-400">
          No category expenses recorded yet.
        </div>
      `;
      return;
    }
    const totalExpense = entries.reduce((s, e) => s + e[1], 0);
    container.innerHTML = entries.map(([category, amount]) => {
      const catMeta = window.CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase()) || {
        icon: 'tag',
        color: '#64748b',
        bg: '#f8fafc'
      };
      const percentage = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
      return `
        <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: ${catMeta.bg}; color: ${catMeta.color};">
                <i data-lucide="${catMeta.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-slate-800">${category}</h4>
                <span class="text-xs text-slate-500">${percentage}% of total</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-base font-bold text-slate-900">${window.DataStore.formatINR(amount)}</span>
            </div>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div class="h-2 rounded-full transition-all duration-500" style="width: ${percentage}%; background-color: ${catMeta.color};"></div>
          </div>
        </div>
      `;
    }).join('');
    this.initLucideIcons();
  },
  /**
   * Render Recent Transactions on the Dashboard
   */
  renderRecentTransactions(expenses) {
    const container = document.getElementById('recentTransactionsContainer');
    if (!container) return;
    const recent = expenses.slice(0, 5);
    if (recent.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
          <p>No expenses added yet. Tap "+ Add Expense" to start!</p>
        </div>
      `;
      this.initLucideIcons();
      return;
    }
    container.innerHTML = recent.map(exp => {
      const catMeta = window.CATEGORIES.find(c => c.name.toLowerCase() === (exp.category || '').toLowerCase()) || {
        icon: 'tag',
        color: '#64748b',
        bg: '#f8fafc'
      };
      return `
        <div class="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-100 last:border-b-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: ${catMeta.bg}; color: ${catMeta.color};">
              <i data-lucide="${catMeta.icon}" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-800 line-clamp-1">${exp.description || exp.category}</p>
              <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>${window.DataStore.formatDateDisplay(exp.date)}</span>
                <span>•</span>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">${exp.paymentMethod}</span>
                ${exp.vendor ? `<span>•</span> <span class="truncate max-w-[120px]">${exp.vendor}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="text-right flex-shrink-0 ml-3">
            <div class="text-sm font-bold text-slate-900">${window.DataStore.formatINR(exp.amount)}</div>
            ${exp.receipt ? `
              <button onclick="UI.viewReceipt('${exp.receipt}')" class="text-[11px] text-blue-600 hover:underline flex items-center gap-1 justify-end mt-0.5">
                <i data-lucide="paperclip" class="w-3 h-3"></i> Receipt
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    this.initLucideIcons();
  },
  /**
   * Render Filtered Expense History Table & Cards
   */
  renderHistoryTable() {
    const expenses = window.DataStore.getExpenses();
    const tableBody = document.getElementById('historyTableBody');
    const mobileCards = document.getElementById('historyMobileCards');
    const countBadge = document.getElementById('historyCountBadge');
    const totalBadge = document.getElementById('historyTotalBadge');
    // Get filter values
    const searchVal = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();
    const categoryVal = document.getElementById('filterCategory')?.value || '';
    const paymentVal = document.getElementById('filterPaymentMethod')?.value || '';
    const dateFilterVal = document.getElementById('filterDateRange')?.value || 'all';
    const sortBy = document.getElementById('historySortBy')?.value || 'date-desc';
    // Apply filtering
    let filtered = expenses.filter(exp => {
      // Search text match (desc, vendor, category, notes)
      if (searchVal) {
        const d = (exp.description || '').toLowerCase();
        const v = (exp.vendor || '').toLowerCase();
        const c = (exp.category || '').toLowerCase();
        const n = (exp.notes || '').toLowerCase();
        if (!d.includes(searchVal) && !v.includes(searchVal) && !c.includes(searchVal) && !n.includes(searchVal)) {
          return false;
        }
      }
      // Category filter
      if (categoryVal && exp.category !== categoryVal) {
        return false;
      }
      // Payment filter
      if (paymentVal && exp.paymentMethod !== paymentVal) {
        return false;
      }
      // Date range filter
      if (dateFilterVal !== 'all' && exp.date) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (dateFilterVal === 'today' && exp.date !== todayStr) {
          return false;
        }
        if (dateFilterVal === 'this-month') {
          const parts = exp.date.split('-');
          if (parseInt(parts[0], 10) !== now.getFullYear() || parseInt(parts[1], 10) !== (now.getMonth() + 1)) {
            return false;
          }
        }
        if (dateFilterVal === 'this-week') {
          const dayOfWeek = now.getDay();
          const dist = (dayOfWeek + 6) % 7;
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - dist);
          startOfWeek.setHours(0, 0, 0, 0);
          const parts = exp.date.split('-');
          const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          if (expDate < startOfWeek || expDate > now) {
            return false;
          }
        }
      }
      return true;
    });
    // Apply Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp);
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp);
      }
      if (sortBy === 'amount-desc') {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === 'amount-asc') {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });
    // Calculate totals for filtered list
    const filteredTotal = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    if (countBadge) countBadge.textContent = `${filtered.length} expenses`;
    if (totalBadge) totalBadge.textContent = `Total: ${window.DataStore.formatINR(filteredTotal)}`;
    if (filtered.length === 0) {
      const emptyState = `
        <div class="text-center py-12 text-slate-400">
          <i data-lucide="filter-x" class="w-12 h-12 mx-auto mb-3 opacity-40"></i>
          <p class="font-medium text-slate-600">No matching expenses found</p>
          <p class="text-xs text-slate-400 mt-1">Try resetting the search or category filters</p>
        </div>
      `;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="7">${emptyState}</td></tr>`;
      if (mobileCards) mobileCards.innerHTML = emptyState;
      this.initLucideIcons();
      return;
    }
    // Desktop Table Rows
    if (tableBody) {
      tableBody.innerHTML = filtered.map(exp => {
        const catMeta = window.CATEGORIES.find(c => c.name.toLowerCase() === (exp.category || '').toLowerCase()) || {
          icon: 'tag',
          color: '#64748b',
          bg: '#f8fafc'
        };
        return `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
            <td class="px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap font-medium">
              ${window.DataStore.formatDateDisplay(exp.date)}
            </td>
            <td class="px-4 py-3.5 whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style="background-color: ${catMeta.bg}; color: ${catMeta.color};">
                <i data-lucide="${catMeta.icon}" class="w-3.5 h-3.5"></i>
                ${exp.category}
              </span>
            </td>
            <td class="px-4 py-3.5 text-sm text-slate-900 font-medium">
              <div>${exp.description || '—'}</div>
              ${exp.notes ? `<div class="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">${exp.notes}</div>` : ''}
            </td>
            <td class="px-4 py-3.5 text-sm font-bold text-slate-900 whitespace-nowrap">
              ${window.DataStore.formatINR(exp.amount)}
            </td>
            <td class="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
              <span class="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-700">${exp.paymentMethod}</span>
            </td>
            <td class="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
              ${exp.vendor || '—'}
            </td>
            <td class="px-4 py-3.5 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-1.5">
                ${exp.receipt ? `
                  <button onclick="UI.viewReceipt('${exp.receipt}')" title="View Receipt" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <i data-lucide="paperclip" class="w-4 h-4"></i>
                  </button>
                ` : ''}
                <button onclick="UI.openEditModal('${exp.id || exp.timestamp}')" title="Edit Expense" class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="UI.confirmDeleteExpense('${exp.id || exp.timestamp}')" title="Delete Expense" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
    // Mobile Cards View
    if (mobileCards) {
      mobileCards.innerHTML = filtered.map(exp => {
        const catMeta = window.CATEGORIES.find(c => c.name.toLowerCase() === (exp.category || '').toLowerCase()) || {
          icon: 'tag',
          color: '#64748b',
          bg: '#f8fafc'
        };
        return `
          <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: ${catMeta.bg}; color: ${catMeta.color};">
                  <i data-lucide="${catMeta.icon}" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-800 text-sm">${exp.description || exp.category}</h4>
                  <p class="text-xs text-slate-500 mt-0.5">${window.DataStore.formatDateDisplay(exp.date)} &bull; ${exp.paymentMethod}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-base font-bold text-slate-900">${window.DataStore.formatINR(exp.amount)}</span>
              </div>
            </div>
            ${(exp.vendor || exp.notes) ? `
              <div class="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 space-y-1">
                ${exp.vendor ? `<div><span class="font-semibold text-slate-700">Vendor:</span> ${exp.vendor}</div>` : ''}
                ${exp.notes ? `<div><span class="font-semibold text-slate-700">Notes:</span> ${exp.notes}</div>` : ''}
              </div>
            ` : ''}
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span class="px-2 py-0.5 rounded font-medium text-slate-700 bg-slate-100">${exp.category}</span>
              <div class="flex items-center gap-2">
                ${exp.receipt ? `
                  <button onclick="UI.viewReceipt('${exp.receipt}')" class="px-2.5 py-1 text-blue-600 font-medium hover:bg-blue-50 rounded-lg flex items-center gap-1">
                    <i data-lucide="paperclip" class="w-3.5 h-3.5"></i> Receipt
                  </button>
                ` : ''}
                <button onclick="UI.openEditModal('${exp.id || exp.timestamp}')" class="px-2.5 py-1 text-slate-700 font-medium hover:bg-slate-100 rounded-lg flex items-center gap-1">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
                </button>
                <button onclick="UI.confirmDeleteExpense('${exp.id || exp.timestamp}')" class="px-2.5 py-1 text-rose-600 font-medium hover:bg-rose-50 rounded-lg flex items-center gap-1">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    this.initLucideIcons();
  },
  /**
   * Render Monthly Report View
   */
  renderMonthlyReport() {
    const expenses = window.DataStore.getExpenses();
    const monthSelect = document.getElementById('reportMonthSelect');
    const yearSelect = document.getElementById('reportYearSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'October';
    const selectedYear = yearSelect ? parseInt(yearSelect.value, 10) : 2026;
    // Filter expenses matching selected month and year
    const monthlyExpenses = expenses.filter(exp => {
      // Check month property or date string
      if (exp.month && exp.month.toLowerCase() === selectedMonth.toLowerCase()) {
        if (!exp.year || parseInt(exp.year, 10) === selectedYear) return true;
      }
      if (exp.date) {
        const parts = exp.date.split('-');
        const expYear = parseInt(parts[0], 10);
        const expMonthIdx = parseInt(parts[1], 10) - 1;
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        if (expYear === selectedYear && monthNames[expMonthIdx].toLowerCase() === selectedMonth.toLowerCase()) {
          return true;
        }
      }
      return false;
    });
    let total = 0;
    const categoryTotals = {};
    const dailyTotals = {};
    let highest = { amount: 0, category: '—', description: '', date: '' };
    monthlyExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      total += amt;
      const cat = exp.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      if (exp.date) {
        dailyTotals[exp.date] = (dailyTotals[exp.date] || 0) + amt;
      }
      if (amt > highest.amount) {
        highest = {
          amount: amt,
          category: cat,
          description: exp.description || '',
          date: exp.date
        };
      }
    });
    const activeDaysCount = Object.keys(dailyTotals).length;
    const avgDaily = activeDaysCount > 0 ? Math.round(total / activeDaysCount) : 0;
    // Update Report Summary Cards
    const totalEl = document.getElementById('reportTotalExpense');
    const countEl = document.getElementById('reportTransactionCount');
    const avgEl = document.getElementById('reportAvgDaily');
    const highestEl = document.getElementById('reportHighestExpense');
    if (totalEl) totalEl.textContent = window.DataStore.formatINR(total);
    if (countEl) countEl.textContent = monthlyExpenses.length;
    if (avgEl) avgEl.textContent = window.DataStore.formatINR(avgDaily);
    if (highestEl) highestEl.textContent = window.DataStore.formatINR(highest.amount);
    // Render Category Breakdown list
    const catContainer = document.getElementById('reportCategoryBreakdown');
    if (catContainer) {
      const catEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
      if (catEntries.length === 0) {
        catContainer.innerHTML = '<div class="text-sm text-slate-400 py-4 text-center">No expenses in this month.</div>';
      } else {
        catContainer.innerHTML = catEntries.map(([cat, amt]) => {
          const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
          const catMeta = window.CATEGORIES.find(c => c.name.toLowerCase() === cat.toLowerCase()) || {
            color: '#64748b',
            icon: 'tag'
          };
          return `
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-800 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${catMeta.color};"></span>
                  ${cat}
                </span>
                <div class="text-right">
                  <span class="font-bold text-slate-900">${window.DataStore.formatINR(amt)}</span>
                  <span class="text-xs text-slate-500 ml-1.5">(${pct}%)</span>
                </div>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="h-2 rounded-full" style="width: ${pct}%; background-color: ${catMeta.color};"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
    // Render Daily Breakdown list
    const dailyContainer = document.getElementById('reportDailyBreakdown');
    if (dailyContainer) {
      const dailyEntries = Object.entries(dailyTotals).sort((a, b) => new Date(b[0]) - new Date(a[0]));
      if (dailyEntries.length === 0) {
        dailyContainer.innerHTML = '<div class="text-sm text-slate-400 py-4 text-center">No daily activity.</div>';
      } else {
        dailyContainer.innerHTML = dailyEntries.map(([dStr, amt]) => `
          <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0 text-sm">
            <span class="text-slate-700 font-medium">${window.DataStore.formatDateDisplay(dStr)}</span>
            <span class="font-bold text-slate-900">${window.DataStore.formatINR(amt)}</span>
          </div>
        `).join('');
      }
    }
    this.initLucideIcons();
  },
  /**
   * Export Monthly Report as CSV
   */
  downloadMonthlyReportCsv() {
    const expenses = window.DataStore.getExpenses();
    const monthSelect = document.getElementById('reportMonthSelect');
    const yearSelect = document.getElementById('reportYearSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'October';
    const selectedYear = yearSelect ? parseInt(yearSelect.value, 10) : 2026;
    const monthlyExpenses = expenses.filter(exp => {
      if (exp.month && exp.month.toLowerCase() === selectedMonth.toLowerCase()) {
        if (!exp.year || parseInt(exp.year, 10) === selectedYear) return true;
      }
      return false;
    });
    if (monthlyExpenses.length === 0) {
      this.showToast('No expenses found for this month to download.', 'warning');
      return;
    }
    let csvContent = 'Timestamp,Date,Category,Description,Amount,Payment Method,Vendor,Notes,Receipt,Month,Year\n';
    monthlyExpenses.forEach(e => {
      const row = [
        `"${e.timestamp || ''}"`,
        `"${e.date || ''}"`,
        `"${e.category || ''}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.amount || 0,
        `"${e.paymentMethod || ''}"`,
        `"${(e.vendor || '').replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
        `"${e.receipt || ''}"`,
        `"${e.month || ''}"`,
        e.year || selectedYear
      ];
      csvContent += row.join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Expense_Report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`Downloaded CSV for ${selectedMonth} ${selectedYear}`, 'success');
  },
  /**
   * Print / Save as PDF the Monthly Report
   */
  printMonthlyReport() {
    window.print();
  },
  /**
   * Open Edit Modal
   */
  openEditModal(id) {
    const expenses = window.DataStore.getExpenses();
    const exp = expenses.find(e => e.id === id || e.timestamp === id);
    if (!exp) return;
    this.currentEditingId = id;
    document.getElementById('editExpenseDate').value = exp.date || '';
    document.getElementById('editExpenseCategory').value = exp.category || 'Other';
    document.getElementById('editExpenseDescription').value = exp.description || '';
    document.getElementById('editExpenseAmount').value = exp.amount || '';
    document.getElementById('editExpensePaymentMethod').value = exp.paymentMethod || 'UPI';
    document.getElementById('editExpenseVendor').value = exp.vendor || '';
    document.getElementById('editExpenseNotes').value = exp.notes || '';
    const modal = document.getElementById('editExpenseModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },
  /**
   * Close Edit Modal
   */
  closeEditModal() {
    this.currentEditingId = null;
    const modal = document.getElementById('editExpenseModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },
/**
   * Confirm and restore demo/sample data
   */
  confirmResetDemoData() {
    const confirmed = confirm(
      'Reset Demo Data?\n\n' +
      'This will replace your current locally saved expenses with the original demo data.\n\n' +
      'Your Google Sheet data will NOT be deleted.'
    );
    if (!confirmed) return;
    window.DataStore.resetToSampleData();
    this.renderDashboard();
    this.renderHistoryTable();
    if (typeof this.renderMonthlyReport === 'function') {
      this.renderMonthlyReport();
    }
    this.showToast(
      'Demo data has been restored successfully.',
      'success'
    );
  },
  /**
   * Confirm and delete all locally saved expense data
   */
  confirmDeleteAllData() {
    const confirmed = confirm(
      'Delete ALL Saved Data?\n\n' +
      'This will permanently remove all expense records saved in this browser.\n\n' +
      'This action cannot be undone.\n\n' +
      'Your Google Sheet data will NOT be deleted.'
    );
    if (!confirmed) return;
    const success = window.DataStore.clearAllExpenses();
    if (!success) {
      this.showToast('Failed to delete saved data.', 'error');
      return;
    }
    this.renderDashboard();
    this.renderHistoryTable();
    if (typeof this.renderMonthlyReport === 'function') {
      this.renderMonthlyReport();
    }
    this.showToast(
      'All locally saved expense data has been deleted.',
      'success'
    );
  },
  /**
   * Confirm and delete one expense
   */
  confirmDeleteExpense(id) {
    const confirmed = confirm(
      'Delete this expense?\n\n' +
      'This action cannot be undone.'
    );
    if (!confirmed) return;
    const success = window.DataStore.deleteExpense(id);
    if (success) {
      this.showToast('Expense deleted successfully.', 'success');
      this.renderDashboard();
      this.renderHistoryTable();
      this.renderMonthlyReport();
    } else {
      this.showToast('Failed to delete expense.', 'error');
    }
  },
  /**
   * View Receipt Modal
   */
  viewReceipt(receiptUrl) {
    if (!receiptUrl) return;
    const modal = document.getElementById('receiptModal');
    const container = document.getElementById('receiptPreviewContainer');
    if (receiptUrl.startsWith('http')) {
      container.innerHTML = `
        <div class="text-center p-4">
          <p class="text-sm text-slate-600 mb-3">Receipt is stored on Google Drive:</p>
          <a href="${receiptUrl}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow">
            <i data-lucide="external-link" class="w-4 h-4"></i> Open in Google Drive
          </a>
        </div>
      `;
    } else {
      // Base64 image
      container.innerHTML = `<img src="${receiptUrl}" class="max-w-full max-h-[70vh] rounded-xl object-contain mx-auto shadow-md" alt="Expense Receipt" />`;
    }
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    this.initLucideIcons();
  },
  /**
   * Close Receipt Modal
   */
  closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },
  /**
   * Open Settings Modal
   */
  openSettingsModal() {
    const config = window.ConfigManager.getConfig();
    document.getElementById('settingsSheetId').value = config.googleSheetId || '';
    document.getElementById('settingsScriptUrl').value = config.appsScriptUrl || '';
    document.getElementById('settingsEmail').value = config.emailAddress || '';
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },
  /**
   * Close Settings Modal
   */
  closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },
  /**
   * Open Setup Guide Modal
   */
  openSetupGuideModal() {
    const modal = document.getElementById('setupGuideModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },
  /**
   * Close Setup Guide Modal
   */
  closeSetupGuideModal() {
    const modal = document.getElementById('setupGuideModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },
  /**
   * Update the connection status pill in header
   */
  updateConnectionStatusBadge() {
    const badge = document.getElementById('headerConnectionBadge');
    if (!badge) return;
    const isConfigured = window.ConfigManager.isConfigured();
    if (isConfigured) {
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-xs font-semibold text-emerald-700">Google Sheet Active</span>
      `;
      badge.className = 'inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full cursor-pointer hover:bg-emerald-100 transition-colors';
    } else {
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
        <span class="text-xs font-medium text-amber-700">Local Mode (Click to Connect Sheet)</span>
      `;
      badge.className = 'inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full cursor-pointer hover:bg-amber-100 transition-colors';
    }
  }
};
window.UI = UI;
