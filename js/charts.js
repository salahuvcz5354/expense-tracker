/**
 * Interactive Charts Manager using Chart.js
 * Renders and updates:
 * 1. Daily Expense Chart
 * 2. Monthly Expense Chart
 * 3. Category-wise Donut Chart
 * 4. Payment Method Distribution Chart
 */

const ChartManager = {
  instances: {
    dailyChart: null,
    monthlyChart: null,
    categoryChart: null,
    paymentChart: null
  },

  chartColors: [
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#ef4444', // red
    '#6366f1', // indigo
    '#06b6d4', // cyan
    '#14b8a6', // teal
    '#f97316', // orange
    '#a855f7', // purple
    '#d97706', // amber-600
    '#64748b'  // slate
  ],

  /**
   * Initialize or update all charts with latest data
   */
  updateAllCharts() {
    const expenses = window.DataStore.getExpenses();
    const stats = window.DataStore.calculateStats(expenses);

    this.renderDailyChart(stats);
    this.renderMonthlyChart(stats);
    this.renderCategoryChart(stats);
    this.renderPaymentChart(stats);
  },

  /**
   * 1. Daily Expense Chart (Recent 14 days or days in current month)
   */
  renderDailyChart(stats) {
    const ctx = document.getElementById('dailyExpenseChart');
    if (!ctx) return;

    if (this.instances.dailyChart) {
      this.instances.dailyChart.destroy();
    }

    // Sort unique dates ascending
    const dateEntries = Object.entries(stats.dailyTotalsMap)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]));

    // Take recent 14 days or all if fewer
    const recentDates = dateEntries.slice(-14);

    const labels = recentDates.map(entry => {
      const parts = entry[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return entry[0];
    });

    const dataValues = recentDates.map(entry => entry[1]);

    const chartContext = ctx.getContext('2d');
    let gradient = null;
    try {
      gradient = chartContext.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
    } catch (e) {}

    this.instances.dailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{
          label: 'Daily Expense',
          data: dataValues.length > 0 ? dataValues : [0],
          borderColor: '#2563eb',
          backgroundColor: gradient || 'rgba(37, 99, 235, 0.15)',
          borderWidth: 3,
          pointBackgroundColor: '#1d4ed8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 14 },
            callbacks: {
              label: function(context) {
                return ' ' + window.DataStore.formatINR(context.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#64748b' }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { size: 11 },
              color: '#64748b',
              callback: function(val) {
                return '₹' + (val >= 1000 ? (val / 1000) + 'k' : val);
              }
            },
            beginAtZero: true
          }
        }
      }
    });
  },

  /**
   * 2. Monthly Expense Chart
   */
  renderMonthlyChart(stats) {
    const ctx = document.getElementById('monthlyExpenseChart');
    if (!ctx) return;

    if (this.instances.monthlyChart) {
      this.instances.monthlyChart.destroy();
    }

    const monthEntries = Object.entries(stats.monthlyTotalsMap);
    const labels = monthEntries.map(e => e[0]);
    const dataValues = monthEntries.map(e => e[1]);

    this.instances.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{
          label: 'Total Expenses',
          data: dataValues.length > 0 ? dataValues : [0],
          backgroundColor: '#3b82f6',
          hoverBackgroundColor: '#1d4ed8',
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            callbacks: {
              label: function(context) {
                return ' ' + window.DataStore.formatINR(context.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#64748b' }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { size: 11 },
              color: '#64748b',
              callback: function(val) {
                return '₹' + (val >= 1000 ? (val / 1000) + 'k' : val);
              }
            },
            beginAtZero: true
          }
        }
      }
    });
  },

  /**
   * 3. Category-wise Expense Pie/Donut Chart
   */
  renderCategoryChart(stats) {
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;

    if (this.instances.categoryChart) {
      this.instances.categoryChart.destroy();
    }

    // Sort categories by highest spend
    const catEntries = Object.entries(stats.categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    const labels = catEntries.map(e => e[0]);
    const dataValues = catEntries.map(e => e[1]);
    const backgroundColors = labels.map((cat, idx) => {
      const match = window.CATEGORIES.find(c => c.name.toLowerCase() === cat.toLowerCase());
      return match ? match.color : this.chartColors[idx % this.chartColors.length];
    });

    const totalExpense = dataValues.reduce((a, b) => a + b, 0);

    this.instances.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No Expenses'],
        datasets: [{
          data: dataValues.length > 0 ? dataValues : [1],
          backgroundColor: backgroundColors.length > 0 ? backgroundColors : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            callbacks: {
              label: function(context) {
                const val = context.parsed;
                const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${window.DataStore.formatINR(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  /**
   * 4. Payment Method Chart
   */
  renderPaymentChart(stats) {
    const ctx = document.getElementById('paymentMethodChart');
    if (!ctx) return;

    if (this.instances.paymentChart) {
      this.instances.paymentChart.destroy();
    }

    const payEntries = Object.entries(stats.paymentTotals)
      .sort((a, b) => b[1] - a[1]);

    const labels = payEntries.map(e => e[0]);
    const dataValues = payEntries.map(e => e[1]);
    const total = dataValues.reduce((a, b) => a + b, 0);

    const paymentColors = {
      'UPI': '#10b981',
      'Cash': '#f59e0b',
      'Credit Card': '#6366f1',
      'Debit Card': '#0ea5e9',
      'Bank Transfer': '#8b5cf6',
      'Other': '#64748b'
    };

    const backgroundColors = labels.map(p => paymentColors[p] || '#64748b');

    this.instances.paymentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{
          data: dataValues.length > 0 ? dataValues : [1],
          backgroundColor: backgroundColors.length > 0 ? backgroundColors : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            callbacks: {
              label: function(context) {
                const val = context.parsed;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${window.DataStore.formatINR(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
};

window.ChartManager = ChartManager;
