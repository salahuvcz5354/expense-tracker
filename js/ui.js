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
        btn.classList.add(
          'text-blue-600',
          'bg-blue-50',
          'font-semibold'
        );
        btn.classList.remove(
          'text-slate-600',
          'hover:bg-slate-100'
        );
      } else {
        btn.classList.remove(
          'text-blue-600',
          'bg-blue-50',
          'font-semibold'
        );
        btn.classList.add(
          'text-slate-600',
          'hover:bg-slate-100'
        );
      }
    });

    // Update active state in mobile bottom navigation
    const mobileNavButtons =
      document.querySelectorAll('.mobile-nav-btn');

    mobileNavButtons.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add(
          'text-blue-600',
          'font-bold'
        );
        btn.classList.remove('text-slate-500');
      } else {
        btn.classList.remove(
          'text-blue-600',
          'font-bold'
        );
        btn.classList.add('text-slate-500');
      }
    });

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Refresh charts/reports when switching tabs
    if (tabId === 'dashboard') {
      setTimeout(() => {
        if (
          window.ChartManager &&
          typeof window.ChartManager.updateAllCharts === 'function'
        ) {
          window.ChartManager.updateAllCharts();
        }
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
  showToast(
    message,
    type = 'success',
    duration = 3500
  ) {
    const container =
      document.getElementById('toast-container');

    if (!container) return;

    const toast = document.createElement('div');

    toast.className =
      `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl ` +
      `text-white transform transition-all duration-300 ` +
      `translate-y-3 opacity-0 text-sm font-medium z-50 ` +
      `${
        type === 'success'
          ? 'bg-emerald-600'
          : type === 'error'
          ? 'bg-rose-600'
          : type === 'warning'
          ? 'bg-amber-600'
          : 'bg-slate-800'
      }`;

    const iconName =
      type === 'success'
        ? 'check-circle'
        : type === 'error'
        ? 'alert-triangle'
        : type === 'warning'
        ? 'alert-circle'
        : 'info';

    toast.innerHTML = `
      <i
        data-lucide="${iconName}"
        class="w-5 h-5 flex-shrink-0"
      ></i>

      <span class="flex-1">${message}</span>

      <button
        class="opacity-75 hover:opacity-100 transition-opacity ml-2"
        onclick="this.parentElement.remove()"
      >
        <i
          data-lucide="x"
          class="w-4 h-4"
        ></i>
      </button>
    `;

    container.appendChild(toast);

    this.initLucideIcons();

    // Trigger animate in
    requestAnimationFrame(() => {
      toast.classList.remove(
        'translate-y-3',
        'opacity-0'
      );

      toast.classList.add(
        'translate-y-0',
        'opacity-100'
      );
    });

    // Auto remove
    setTimeout(() => {
      toast.classList.remove(
        'translate-y-0',
        'opacity-100'
      );

      toast.classList.add(
        'translate-y-3',
        'opacity-0'
      );

      setTimeout(() => {
        if (toast && toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, duration);
  },

  /**
   * Populate category selects and chips
   */
  populateCategorySelects() {
    const select =
      document.getElementById('expenseCategory');

    const filterSelect =
      document.getElementById('filterCategory');

    const editSelect =
      document.getElementById('editExpenseCategory');

    if (!window.CATEGORIES) return;

    const optionsHtml = window.CATEGORIES
      .map(
        c =>
          `<option value="${c.name}">${c.name}</option>`
      )
      .join('');

    if (select) {
      select.innerHTML =
        '<option value="" disabled selected>Select Category...</option>' +
        optionsHtml;
    }

    if (filterSelect) {
      filterSelect.innerHTML =
        '<option value="">All Categories</option>' +
        optionsHtml;
    }

    if (editSelect) {
      editSelect.innerHTML = optionsHtml;
    }
  },

  /**
   * Populate payment method selects
   */
  populatePaymentSelects() {
    const select =
      document.getElementById('expensePaymentMethod');

    const filterSelect =
      document.getElementById('filterPaymentMethod');

    const editSelect =
      document.getElementById(
        'editExpensePaymentMethod'
      );

    if (!window.PAYMENT_METHODS) return;

    const optionsHtml = window.PAYMENT_METHODS
      .map(
        p =>
          `<option value="${p.name}">${p.name}</option>`
      )
      .join('');

    if (select) {
      select.innerHTML = optionsHtml;
      select.value = 'UPI';
    }

    if (filterSelect) {
      filterSelect.innerHTML =
        '<option value="">All Payment Methods</option>' +
        optionsHtml;
    }

    if (editSelect) {
      editSelect.innerHTML = optionsHtml;
    }
  },

  /**
   * Populate Month & Year selector for Monthly Reports
   */
  populateMonthYearSelectors() {
    const monthSelect =
      document.getElementById(
        'reportMonthSelect'
      );

    const yearSelect =
      document.getElementById(
        'reportYearSelect'
      );

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    const now = new Date();

    const currentMonthIdx =
      now.getMonth();

    const currentYear =
      now.getFullYear();

    if (monthSelect) {
      monthSelect.innerHTML =
        monthNames
          .map(
            (m, idx) =>
              `<option value="${m}" ${
                idx === currentMonthIdx
                  ? 'selected'
                  : ''
              }>${m}</option>`
          )
          .join('');
    }

    if (yearSelect) {
      const years = [
        currentYear - 1,
        currentYear,
        currentYear + 1
      ];

      yearSelect.innerHTML =
        years
          .map(
            y =>
              `<option value="${y}" ${
                y === currentYear
                  ? 'selected'
                  : ''
              }>${y}</option>`
          )
          .join('');
    }
  },

  /**
   * Quick Expense button clicked
   * (+ Petrol, + Food, etc.)
   */
  handleQuickExpense(categoryName) {
    this.switchTab('add-expense');

    const catSelect =
      document.getElementById(
        'expenseCategory'
      );

    if (catSelect) {
      catSelect.value = categoryName;
    }

    // Default date to today
    const dateInput =
      document.getElementById(
        'expenseDate'
      );

    if (
      dateInput &&
      !dateInput.value
    ) {
      dateInput.value =
        new Date()
          .toISOString()
          .split('T')[0];
    }

    // Focus on amount for immediate numeric entry
    const amountInput =
      document.getElementById(
        'expenseAmount'
      );

    if (amountInput) {
      setTimeout(() => {
        amountInput.focus();

        amountInput.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 150);
    }
  },

  /**
   * Render Dashboard Statistics & Cards
   */
  renderDashboard() {
    if (!window.DataStore) return;

    const expenses =
      window.DataStore.getExpenses();

    const stats =
      window.DataStore.calculateStats(
        expenses
      );

    // Main KPI cards
    const todayEl =
      document.getElementById(
        'statTodayTotal'
      );

    const weekEl =
      document.getElementById(
        'statWeekTotal'
      );

    const monthEl =
      document.getElementById(
        'statMonthTotal'
      );

    const countEl =
      document.getElementById(
        'statTotalCount'
      );

    const avgEl =
      document.getElementById(
        'statAvgDaily'
      );

    const highEl =
      document.getElementById(
        'statHighest'
      );

    const highDescEl =
      document.getElementById(
        'statHighestDesc'
      );

    if (todayEl) {
      todayEl.textContent =
        window.DataStore.formatINR(
          stats.todayTotal
        );
    }

    if (weekEl) {
      weekEl.textContent =
        window.DataStore.formatINR(
          stats.thisWeekTotal
        );
    }

    if (monthEl) {
      monthEl.textContent =
        window.DataStore.formatINR(
          stats.thisMonthTotal
        );
    }

    if (countEl) {
      countEl.textContent =
        stats.totalCount;
    }

    if (avgEl) {
      avgEl.textContent =
        window.DataStore.formatINR(
          stats.averageDaily
        );
    }

    if (highEl) {
      highEl.textContent =
        window.DataStore.formatINR(
          stats.highestExpense.amount
        );
    }

    if (highDescEl) {
      highDescEl.textContent =
        stats.highestExpense.amount > 0
          ? `${stats.highestExpense.category} • ${
              stats.highestExpense.description ||
              'No desc'
            }`
          : 'No transactions yet';
    }

    // Render Category-wise summary cards
    this.renderCategoryCards(stats);

    // Render Recent 5 Transactions in dashboard
    this.renderRecentTransactions(expenses);

    // Refresh charts
    if (
      window.ChartManager &&
      typeof window.ChartManager.updateAllCharts ===
        'function'
    ) {
      window.ChartManager.updateAllCharts();
    }
  },

  /**
   * Render Category-wise summary cards
   * with progress bars
   */
  renderCategoryCards(stats) {
    const container =
      document.getElementById(
        'categoryCardsContainer'
      );

    if (!container) return;

    const entries =
      Object.entries(
        stats.categoryTotals || {}
      ).sort(
        (a, b) => b[1] - a[1]
      );

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-8 text-center text-slate-400">
          No category expenses recorded yet.
        </div>
      `;

      return;
    }

    const totalExpense =
      entries.reduce(
        (s, e) => s + e[1],
        0
      );

    container.innerHTML =
      entries
        .map(
          ([category, amount]) => {
            const catMeta =
              window.CATEGORIES.find(
                c =>
                  c.name.toLowerCase() ===
                  category.toLowerCase()
              ) || {
                icon: 'tag',
                color: '#64748b',
                bg: '#f8fafc'
              };

            const percentage =
              totalExpense > 0
                ? (
                    (amount /
                      totalExpense) *
                    100
                  ).toFixed(1)
                : 0;

            return `
              <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">

                <div class="flex items-center justify-between mb-3">

                  <div class="flex items-center gap-2.5">

                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center"
                      style="
                        background-color: ${catMeta.bg};
                        color: ${catMeta.color};
                      "
                    >
                      <i
                        data-lucide="${catMeta.icon}"
                        class="w-5 h-5"
                      ></i>
                    </div>

                    <div>
                      <p class="text-sm font-bold text-slate-800">
                        ${category}
                      </p>

                      <p class="text-[10px] text-slate-400">
                        ${percentage}% of total
                      </p>
                    </div>

                  </div>

                  <span class="text-sm font-bold text-slate-900">
                    ${window.DataStore.formatINR(amount)}
                  </span>

                </div>

                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">

                  <div
                    class="h-2 rounded-full"
                    style="
                      width: ${percentage}%;
                      background-color: ${catMeta.color};
                    "
                  ></div>

                </div>

              </div>
            `;
          }
        )
        .join('');

    this.initLucideIcons();
  },

  /**
   * Render recent transactions
   */
  renderRecentTransactions(expenses) {
    const container =
      document.getElementById(
        'recentTransactionsContainer'
      );

    if (!container) return;

    const recent =
      [...expenses]
        .sort(
          (a, b) =>
            new Date(
              b.timestamp || b.date
            ) -
            new Date(
              a.timestamp || a.date
            )
        )
        .slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-sm">
          No recent transactions.
        </div>
      `;

      return;
    }

    container.innerHTML =
      recent
        .map(exp => {
          const catMeta =
            window.CATEGORIES.find(
              c =>
                c.name.toLowerCase() ===
                (exp.category || '')
                  .toLowerCase()
            ) || {
              icon: 'tag',
              color: '#64748b',
              bg: '#f8fafc'
            };

          return `
            <div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">

              <div class="flex items-center gap-3 min-w-0">

                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style="
                    background-color: ${catMeta.bg};
                    color: ${catMeta.color};
                  "
                >
                  <i
                    data-lucide="${catMeta.icon}"
                    class="w-4 h-4"
                  ></i>
                </div>

                <div class="min-w-0">

                  <p class="text-sm font-semibold text-slate-800 truncate">
                    ${exp.description || exp.category || 'Expense'}
                  </p>

                  <p class="text-[10px] text-slate-400">
                    ${exp.category || 'Other'} •
                    ${window.DataStore.formatDateDisplay(exp.date)}
                  </p>

                </div>

              </div>

              <span class="text-sm font-bold text-slate-900 flex-shrink-0 ml-3">
                ${window.DataStore.formatINR(exp.amount || 0)}
              </span>

            </div>
          `;
        })
        .join('');

    this.initLucideIcons();
  },

  /**
   * Render Expense History Table
   */
  renderHistoryTable() {
    const tbody =
      document.getElementById(
        'historyTableBody'
      );

    if (!tbody) return;

    const expenses =
      window.DataStore.getExpenses();

    const searchInput =
      document.getElementById(
        'historySearch'
      );

    const categoryFilter =
      document.getElementById(
        'filterCategory'
      );

    const paymentFilter =
      document.getElementById(
        'filterPaymentMethod'
      );

    const search =
      searchInput
        ? searchInput.value
            .trim()
            .toLowerCase()
        : '';

    const category =
      categoryFilter
        ? categoryFilter.value
        : '';

    const payment =
      paymentFilter
        ? paymentFilter.value
        : '';

    const filtered =
      expenses.filter(exp => {
        const matchesSearch =
          !search ||
          [
            exp.category,
            exp.description,
            exp.vendor,
            exp.notes
          ]
            .filter(Boolean)
            .some(value =>
              String(value)
                .toLowerCase()
                .includes(search)
            );

        const matchesCategory =
          !category ||
          exp.category === category;

        const matchesPayment =
          !payment ||
          exp.paymentMethod === payment;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesPayment
        );
      });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td
            colspan="100"
            class="py-12 text-center text-slate-400"
          >
            No expenses found.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML =
      filtered
        .sort(
          (a, b) =>
            new Date(
              b.timestamp || b.date
            ) -
            new Date(
              a.timestamp || a.date
            )
        )
        .map(exp => {
          const catMeta =
            window.CATEGORIES.find(
              c =>
                c.name.toLowerCase() ===
                (exp.category || '')
                  .toLowerCase()
            ) || {
              icon: 'tag',
              color: '#64748b',
              bg: '#f8fafc'
            };

          const expenseId =
            exp.id ||
            exp.timestamp;

          return `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">

              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                ${window.DataStore.formatDateDisplay(exp.date)}
              </td>

              <td class="px-4 py-3">
                <div class="flex items-center gap-2">

                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
                    style="
                      background-color: ${catMeta.bg};
                      color: ${catMeta.color};
                    "
                  >
                    <i
                      data-lucide="${catMeta.icon}"
                      class="w-4 h-4"
                    ></i>
                  </div>

                  <span class="text-sm font-medium text-slate-800">
                    ${exp.category || 'Other'}
                  </span>

                </div>
              </td>

              <td class="px-4 py-3 text-sm text-slate-600">
                ${exp.description || '-'}
              </td>

              <td class="px-4 py-3 text-sm text-slate-600">
                ${exp.vendor || '-'}
              </td>

              <td class="px-4 py-3 text-right">
                <span class="font-bold text-slate-900">
                  ${window.DataStore.formatINR(exp.amount || 0)}
                </span>
              </td>

              <td class="px-4 py-3 text-sm text-slate-600">
                ${exp.paymentMethod || '-'}
              </td>

              <td class="px-4 py-3">
                ${
                  exp.receipt
                    ? `
                      <button
                        onclick="UI.viewReceipt('${String(
                          exp.receipt
                        ).replace(/'/g, "\\'")}')"
                        class="text-blue-600 hover:text-blue-800"
                        title="View Receipt"
                      >
                        <i
                          data-lucide="receipt"
                          class="w-4 h-4"
                        ></i>
                      </button>
                    `
                    : '-'
                }
              </td>

              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">

                  <button
                    onclick="UI.openEditModal('${String(
                      expenseId
                    ).replace(/'/g, "\\'")}')"
                    class="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <i
                      data-lucide="pencil"
                      class="w-4 h-4"
                    ></i>
                  </button>

                  <button
                    onclick="UI.confirmDeleteExpense('${String(
                      expenseId
                    ).replace(/'/g, "\\'")}')"
                    class="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete"
                  >
                    <i
                      data-lucide="trash-2"
                      class="w-4 h-4"
                    ></i>
                  </button>

                </div>
              </td>

            </tr>
          `;
        })
        .join('');

    this.initLucideIcons();
  },

  /**
   * Render Monthly Report
   */
  renderMonthlyReport() {
    const expenses =
      window.DataStore.getExpenses();

    const monthSelect =
      document.getElementById(
        'reportMonthSelect'
      );

    const yearSelect =
      document.getElementById(
        'reportYearSelect'
      );

    const selectedMonth =
      monthSelect
        ? monthSelect.value
        : new Date().toLocaleString(
            'en-US',
            { month: 'long' }
          );

    const selectedYear =
      yearSelect
        ? parseInt(
            yearSelect.value,
            10
          )
        : new Date().getFullYear();

    const monthlyExpenses =
      expenses.filter(exp => {
        if (
          exp.month &&
          exp.month.toLowerCase() ===
            selectedMonth.toLowerCase()
        ) {
          if (
            !exp.year ||
            parseInt(exp.year, 10) ===
              selectedYear
          ) {
            return true;
          }
        }

        if (exp.date) {
          const d = new Date(exp.date);

          return (
            d.getFullYear() ===
              selectedYear &&
            d.toLocaleString(
              'en-US',
              { month: 'long' }
            ).toLowerCase() ===
              selectedMonth.toLowerCase()
          );
        }

        return false;
      });

    const total =
      monthlyExpenses.reduce(
        (sum, exp) =>
          sum +
          Number(exp.amount || 0),
        0
      );

    const count =
      monthlyExpenses.length;

    const average =
      count > 0
        ? total / count
        : 0;

    const totalEl =
      document.getElementById(
        'reportTotal'
      );

    const countEl =
      document.getElementById(
        'reportCount'
      );

    const averageEl =
      document.getElementById(
        'reportAverage'
      );

    if (totalEl) {
      totalEl.textContent =
        window.DataStore.formatINR(total);
    }

    if (countEl) {
      countEl.textContent =
        count;
    }

    if (averageEl) {
      averageEl.textContent =
        window.DataStore.formatINR(
          average
        );
    }

    // Category breakdown
    const categoryTotals = {};

    monthlyExpenses.forEach(exp => {
      const category =
        exp.category || 'Other';

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Number(exp.amount || 0);
    });

    const categoryContainer =
      document.getElementById(
        'reportCategoryBreakdown'
      );

    if (categoryContainer) {
      const entries =
        Object.entries(
          categoryTotals
        ).sort(
          (a, b) => b[1] - a[1]
        );

      if (entries.length === 0) {
        categoryContainer.innerHTML =
          `
            <div class="text-sm text-slate-400 py-4 text-center">
              No category activity.
            </div>
          `;
      } else {
        categoryContainer.innerHTML =
          entries
            .map(
              ([category, amount]) => {
                const percentage =
                  total > 0
                    ? (
                        (amount /
                          total) *
                        100
                      ).toFixed(1)
                    : 0;

                const catMeta =
                  window.CATEGORIES.find(
                    c =>
                      c.name
                        .toLowerCase() ===
                      category
                        .toLowerCase()
                  ) || {
                    icon: 'tag',
                    color: '#64748b',
                    bg: '#f8fafc'
                  };

                return `
                  <div class="py-3 border-b border-slate-100 last:border-b-0">

                    <div class="flex items-center justify-between mb-2">

                      <div class="flex items-center gap-2">

                        <div
                          class="w-8 h-8 rounded-lg flex items-center justify-center"
                          style="
                            background-color: ${catMeta.bg};
                            color: ${catMeta.color};
                          "
                        >
                          <i
                            data-lucide="${catMeta.icon}"
                            class="w-4 h-4"
                          ></i>
                        </div>

                        <span class="text-sm font-semibold text-slate-700">
                          ${category}
                        </span>

                      </div>

                      <div class="text-right">

                        <div class="text-sm font-bold text-slate-900">
                          ${window.DataStore.formatINR(amount)}
                        </div>

                        <div class="text-[10px] text-slate-400">
                          ${percentage}%
                        </div>

                      </div>

                    </div>

                    <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">

                      <div
                        class="h-2 rounded-full"
                        style="
                          width: ${percentage}%;
                          background-color: ${catMeta.color};
                        "
                      ></div>

                    </div>

                  </div>
                `;
              }
            )
            .join('');
      }
    }

    // Daily breakdown
    const dailyTotals = {};

    monthlyExpenses.forEach(exp => {
      const date =
        exp.date ||
        '';

      if (!date) return;

      dailyTotals[date] =
        (dailyTotals[date] || 0) +
        Number(exp.amount || 0);
    });

    const dailyContainer =
      document.getElementById(
        'reportDailyBreakdown'
      );

    if (dailyContainer) {
      const dailyEntries =
        Object.entries(
          dailyTotals
        ).sort(
          (a, b) =>
            new Date(b[0]) -
            new Date(a[0])
        );

      if (dailyEntries.length === 0) {
        dailyContainer.innerHTML =
          `
            <div class="text-sm text-slate-400 py-4 text-center">
              No daily activity.
            </div>
          `;
      } else {
        dailyContainer.innerHTML =
          dailyEntries
            .map(
              ([dStr, amt]) => `
                <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0 text-sm">

                  <span class="text-slate-700 font-medium">
                    ${window.DataStore.formatDateDisplay(dStr)}
                  </span>

                  <span class="font-bold text-slate-900">
                    ${window.DataStore.formatINR(amt)}
                  </span>

                </div>
              `
            )
            .join('');
      }
    }

    this.initLucideIcons();
  },

  /**
   * Export Monthly Report as CSV
   */
  downloadMonthlyReportCsv() {
    const expenses =
      window.DataStore.getExpenses();

    const monthSelect =
      document.getElementById(
        'reportMonthSelect'
      );

    const yearSelect =
      document.getElementById(
        'reportYearSelect'
      );

    const selectedMonth =
      monthSelect
        ? monthSelect.value
        : 'October';

    const selectedYear =
      yearSelect
        ? parseInt(
            yearSelect.value,
            10
          )
        : 2026;

    const monthlyExpenses =
      expenses.filter(exp => {
        if (
          exp.month &&
          exp.month.toLowerCase() ===
            selectedMonth.toLowerCase()
        ) {
          if (
            !exp.year ||
            parseInt(exp.year, 10) ===
              selectedYear
          ) {
            return true;
          }
        }

        return false;
      });

    if (
      monthlyExpenses.length === 0
    ) {
      this.showToast(
        'No expenses found for this month to download.',
        'warning'
      );

      return;
    }

    let csvContent =
      'Timestamp,Date,Category,Description,Amount,Payment Method,Vendor,Notes,Receipt,Month,Year\n';

    monthlyExpenses.forEach(e => {
      const row = [
        `"${e.timestamp || ''}"`,
        `"${e.date || ''}"`,
        `"${e.category || ''}"`,
        `"${(e.description || '').replace(
          /"/g,
          '""'
        )}"`,
        e.amount || 0,
        `"${e.paymentMethod || ''}"`,
        `"${(e.vendor || '').replace(
          /"/g,
          '""'
        )}"`,
        `"${(e.notes || '').replace(
          /"/g,
          '""'
        )}"`,
        `"${e.receipt || ''}"`,
        `"${e.month || ''}"`,
        e.year || selectedYear
      ];

      csvContent +=
        row.join(',') +
        '\n';
    });

    const blob =
      new Blob(
        [csvContent],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.setAttribute(
      'href',
      url
    );

    link.setAttribute(
      'download',
      `Expense_Report_${selectedMonth}_${selectedYear}.csv`
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    this.showToast(
      `Downloaded CSV for ${selectedMonth} ${selectedYear}`,
      'success'
    );
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
    const expenses =
      window.DataStore.getExpenses();

    const exp =
      expenses.find(
        e =>
          e.id === id ||
          e.timestamp === id
      );

    if (!exp) return;

    this.currentEditingId = id;

    const date =
      document.getElementById(
        'editExpenseDate'
      );

    const category =
      document.getElementById(
        'editExpenseCategory'
      );

    const description =
      document.getElementById(
        'editExpenseDescription'
      );

    const amount =
      document.getElementById(
        'editExpenseAmount'
      );

    const payment =
      document.getElementById(
        'editExpensePaymentMethod'
      );

    const vendor =
      document.getElementById(
        'editExpenseVendor'
      );

    const notes =
      document.getElementById(
        'editExpenseNotes'
      );

    if (date) {
      date.value = exp.date || '';
    }

    if (category) {
      category.value =
        exp.category || 'Other';
    }

    if (description) {
      description.value =
        exp.description || '';
    }

    if (amount) {
      amount.value =
        exp.amount || '';
    }

    if (payment) {
      payment.value =
        exp.paymentMethod || 'UPI';
    }

    if (vendor) {
      vendor.value =
        exp.vendor || '';
    }

    if (notes) {
      notes.value =
        exp.notes || '';
    }

    const modal =
      document.getElementById(
        'editExpenseModal'
      );

    if (modal) {
      modal.classList.remove(
        'hidden'
      );

      modal.classList.add(
        'flex'
      );
    }
  },

  /**
   * Close Edit Modal
   */
  closeEditModal() {
    this.currentEditingId = null;

    const modal =
      document.getElementById(
        'editExpenseModal'
      );

    if (modal) {
      modal.classList.add(
        'hidden'
      );

      modal.classList.remove(
        'flex'
      );
    }
  },

  /**
   * Confirm and restore demo/sample data
   */
  confirmResetDemoData() {
    const confirmed =
      confirm(
        'Reset Demo Data?\n\n' +
        'This will replace your current locally saved expenses with the original demo data.\n\n' +
        'Your Google Sheet data will NOT be deleted.'
      );

    if (!confirmed) {
      return;
    }

    if (
      !window.DataStore ||
      typeof window.DataStore.resetToSampleData !==
        'function'
    ) {
      this.showToast(
        'Unable to reset demo data.',
        'error'
      );

      return;
    }

    window.DataStore.resetToSampleData();

    this.renderDashboard();
    this.renderHistoryTable();

    if (
      typeof this.renderMonthlyReport ===
      'function'
    ) {
      this.renderMonthlyReport();
    }

    this.showToast(
      'Demo data has been restored successfully.',
      'success'
    );

    this.initLucideIcons();
  },

  /**
   * Confirm and delete all locally saved expense data
   */
  confirmDeleteAllData() {
    const confirmed =
      confirm(
        'Delete ALL Saved Data?\n\n' +
        'This will permanently remove all expense records saved in this browser.\n\n' +
        'This action cannot be undone.\n\n' +
        'Your Google Sheet data will NOT be deleted.'
      );

    if (!confirmed) {
      return;
    }

    if (
      !window.DataStore ||
      typeof window.DataStore.clearAllExpenses !==
        'function'
    ) {
      this.showToast(
        'Unable to delete saved data.',
        'error'
      );

      return;
    }

    const success =
      window.DataStore.clearAllExpenses();

    if (!success) {
      this.showToast(
        'Failed to delete saved data.',
        'error'
      );

      return;
    }

    this.renderDashboard();
    this.renderHistoryTable();

    if (
      typeof this.renderMonthlyReport ===
      'function'
    ) {
      this.renderMonthlyReport();
    }

    this.showToast(
      'All locally saved expense data has been deleted.',
      'success'
    );

    this.initLucideIcons();
  },

  /**
   * Confirm and delete one expense
   */
  confirmDeleteExpense(id) {
    const confirmed =
      confirm(
        'Delete this expense?\n\n' +
        'This action cannot be undone.'
      );

    if (!confirmed) {
      return;
    }

    if (
      !window.DataStore ||
      typeof window.DataStore.deleteExpense !==
        'function'
    ) {
      this.showToast(
        'Unable to delete expense.',
        'error'
      );

      return;
    }

    const success =
      window.DataStore.deleteExpense(id);

    if (success) {
      this.showToast(
        'Expense deleted successfully.',
        'success'
      );

      this.renderDashboard();
      this.renderHistoryTable();

      if (
        typeof this.renderMonthlyReport ===
        'function'
      ) {
        this.renderMonthlyReport();
      }
    } else {
      this.showToast(
        'Failed to delete expense.',
        'error'
      );
    }
  },

  /**
   * View Receipt Modal
   */
  viewReceipt(receiptUrl) {
    if (!receiptUrl) return;

    const modal =
      document.getElementById(
        'receiptModal'
      );

    const container =
      document.getElementById(
        'receiptPreviewContainer'
      );

    if (!container) return;

    if (
      receiptUrl.startsWith('http')
    ) {
      container.innerHTML = `
        <div class="text-center p-4">

          <p class="text-sm text-slate-600 mb-3">
            Receipt is stored on Google Drive:
          </p>

          <a
            href="${receiptUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow"
          >
            <i
              data-lucide="external-link"
              class="w-4 h-4"
            ></i>

            Open in Google Drive
          </a>

        </div>
      `;
    } else {
      // Base64 image
      container.innerHTML = `
        <img
          src="${receiptUrl}"
          class="max-w-full max-h-[70vh] rounded-xl object-contain mx-auto shadow-md"
          alt="Expense Receipt"
        />
      `;
    }

    if (modal) {
      modal.classList.remove(
        'hidden'
      );

      modal.classList.add(
        'flex'
      );
    }

    this.initLucideIcons();
  },

  /**
   * Close Receipt Modal
   */
  closeReceiptModal() {
    const modal =
      document.getElementById(
        'receiptModal'
      );

    if (modal) {
      modal.classList.add(
        'hidden'
      );

      modal.classList.remove(
        'flex'
      );
    }
  },

  /**
   * Open Settings Modal
   */
  openSettingsModal() {
    const config =
      window.ConfigManager.getConfig();

    const sheetId =
      document.getElementById(
        'settingsSheetId'
      );

    const scriptUrl =
      document.getElementById(
        'settingsScriptUrl'
      );

    const email =
      document.getElementById(
        'settingsEmail'
      );

    if (sheetId) {
      sheetId.value =
        config.googleSheetId || '';
    }

    if (scriptUrl) {
      scriptUrl.value =
        config.appsScriptUrl || '';
    }

    if (email) {
      email.value =
        config.emailAddress || '';
    }

    const modal =
      document.getElementById(
        'settingsModal'
      );

    if (modal) {
      modal.classList.remove(
        'hidden'
      );

      modal.classList.add(
        'flex'
      );
    }
  },

  /**
   * Close Settings Modal
   */
  closeSettingsModal() {
    const modal =
      document.getElementById(
        'settingsModal'
      );

    if (modal) {
      modal.classList.add(
        'hidden'
      );

      modal.classList.remove(
        'flex'
      );
    }
  },

  /**
   * Open Setup Guide Modal
   */
  openSetupGuideModal() {
    const modal =
      document.getElementById(
        'setupGuideModal'
      );

    if (modal) {
      modal.classList.remove(
        'hidden'
      );

      modal.classList.add(
        'flex'
      );
    }
  },

  /**
   * Close Setup Guide Modal
   */
  closeSetupGuideModal() {
    const modal =
      document.getElementById(
        'setupGuideModal'
      );

    if (modal) {
      modal.classList.add(
        'hidden'
      );

      modal.classList.remove(
        'flex'
      );
    }
  },

  /**
   * Update the connection status pill in header
   */
  updateConnectionStatusBadge() {
    const badge =
      document.getElementById(
        'headerConnectionBadge'
      );

    if (!badge) return;

    if (
      !window.ConfigManager ||
      typeof window.ConfigManager.isConfigured !==
        'function'
    ) {
      return;
    }

    const isConfigured =
      window.ConfigManager.isConfigured();

    if (isConfigured) {
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>

        <span class="text-xs font-semibold text-emerald-700">
          Google Sheet Active
        </span>
      `;

      badge.className =
        'inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full cursor-pointer hover:bg-emerald-100 transition-colors';
    } else {
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-500"></span>

        <span class="text-xs font-medium text-amber-700">
          Local Mode (Click to Connect Sheet)
        </span>
      `;

      badge.className =
        'inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full cursor-pointer hover:bg-amber-100 transition-colors';
    }
  }
};

window.UI = UI;
