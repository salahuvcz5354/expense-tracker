/**
 * Configuration & Persistent Settings Manager
 * Stores Google Sheet ID, Apps Script URL, and Email in localStorage
 */

const STORAGE_KEYS = {
  CONFIG: 'daily_expense_config',
  EXPENSES: 'daily_expense_records',
  PENDING_SYNC: 'daily_expense_pending_sync'
};

const DEFAULT_CONFIG = {
  googleSheetId: '',
  appsScriptUrl: '',
  emailAddress: '',
  currencySymbol: '₹',
  autoSync: true
};

const ConfigManager = {
  /**
   * Load configuration from localStorage or return defaults
   */
  getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to parse config from localStorage', e);
    }
    return { ...DEFAULT_CONFIG };
  },

  /**
   * Save configuration to localStorage
   */
  saveConfig(newConfig) {
    try {
      const current = this.getConfig();
      const updated = { ...current, ...newConfig };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
      return { success: true, config: updated };
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Check whether Google Apps Script Web App is configured
   */
  isConfigured() {
    const config = this.getConfig();
    return Boolean(config.appsScriptUrl && config.appsScriptUrl.trim().length > 10);
  },

  /**
   * Clear all configuration
   */
  clearConfig() {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
  }
};

window.ConfigManager = ConfigManager;
window.STORAGE_KEYS = STORAGE_KEYS;
