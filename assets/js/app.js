(function () {
  'use strict';

  const config = window.MERAMU_CONFIG;
  const state = {
    session: null,
    page: 'dashboard',
    deferredInstallPrompt: null,
    toastTimer: null,
    dashboardCounted: false,
    initialData: null,
    batches: [],
    itemMap: new Map(),
    stockMap: new Map(),
    batchSubmitting: false,
    fermentationSubmitting: false,
    finishSubmitting: false,
    selectedFermentationBatchId: '',
    selectedFinishBatchId: '',
    bottlings: [],
    bottlingSubmitting: false,
    selectedBottlingBatchId: '',
    selectedBottlingVariant: 'ORIGINAL',
    productionHistoryTab: 'semua',
    productionHistoryEntries: [],
    transactions: [],
    openingStockSubmitting: false,
    purchaseSubmitting: false,
    saleSubmitting: false,
    expenseSubmitting: false,
    stockUsageSubmitting: false,
    stockOpnameSubmitting: false,
    stockOpnameDraft: new Map(),
    selectedTransactionHistoryKey: '',
    selectedTransactionGroup: null,
    transactionVoidSubmitting: false,
    reportActiveTab: 'ringkasan',
    reportPeriodPreset: 'bulan-ini',
    reportData: null,
    reportLoaded: false,
    reportLoading: false,
    currentReportTable: null,
    stockDetailGroup: 'BAHAN',
    selectedStockItemCode: '',
    masterItemSubmitting: false,
    selectedMasterItemCode: '',
    masterItemAutoCode: true,
    appSettingsData: null,
    appSettingsLoaded: false,
    appSettingsLoading: false,
    appSettingsSaving: false,
    appSettingsActiveTab: 'profil',
    appUserSubmitting: false,
    selectedAppUsername: '',
    masterRecipeSubmitting: false,
    selectedMasterRecipeCode: '',
    masterRecipeAutoCode: true,
    backupSubmitting: false,
    serviceWorkerRegistration: null,
    updateAvailable: false,
    refreshingForUpdate: false,
    authExpiryHandled: false,
    selectedLabelBatchId: '',
    productionLabelStyle: null
  };

  const pageNames = {
    dashboard: 'Dashboard',
    produksi: 'Produksi',
    'riwayat-produksi': 'Riwayat Produksi',
    transaksi: 'Transaksi',
    'riwayat-transaksi': 'Riwayat Transaksi',
    laporan: 'Laporan Usaha',
    stok: 'Stok',
    'stok-detail': 'Rincian Stok',
    'master-item': 'Master Item & Harga',
    'master-resep': 'Master Resep',
    'label-print': 'Label Print',
    pengaturan: 'Pengaturan Aplikasi',
    lainnya: 'Lainnya'
  };

  const toastSymbols = { success: '✓', warning: '!', error: '×', info: 'i' };
  const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  });

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheSession();
    bindEvents();
    fillDynamicText();
    registerServiceWorker();
    monitorConnectivity();

    window.setTimeout(() => {
      document.getElementById('splashScreen')?.classList.add('is-hidden');
    }, 820);

    if (state.session) openApp();
    else openLogin();
  }

  function bindEvents() {
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('togglePassword')?.addEventListener('click', togglePassword);

    document.querySelectorAll('[data-page-target]').forEach((button) => {
      button.addEventListener('click', () => navigate(button.dataset.pageTarget));
    });

    document.querySelectorAll('[data-quick-page]').forEach((button) => {
      button.addEventListener('click', () => navigate(button.dataset.quickPage));
    });

    document.querySelectorAll('[data-open-reports]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openReportsPage);
    });
    document.querySelectorAll('[data-open-stock-group]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', () => openStockDetailPage(button.dataset.openStockGroup));
    });
    document.querySelectorAll('[data-open-master-items]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openMasterItemsPage);
    });
    document.querySelectorAll('[data-open-app-settings]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openAppSettingsPage);
    });
    document.querySelectorAll('[data-open-app-users]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openAppUsersPage);
    });
    document.querySelectorAll('[data-open-master-recipes]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openMasterRecipesPage);
    });
    document.querySelectorAll('[data-open-label-print]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openProductionLabelPage);
    });
    document.querySelectorAll('[data-back-label-print]').forEach((button) => {
      button.addEventListener('click', () => navigate('lainnya'));
    });
    document.getElementById('productionLabelBatchSelect')?.addEventListener('change', (event) => {
      state.selectedLabelBatchId = event.currentTarget.value;
      renderProductionLabelPreview();
    });
    document.getElementById('printProductionLabelButton')?.addEventListener('click', printProductionLabel58mm);
    [
      'productionLabelFontFamily',
      'productionLabelBodyFontSize',
      'productionLabelBrandFontSize',
      'productionLabelEstimateFontSize',
      'productionLabelRowGap',
      'productionLabelContentWidth',
      'productionLabelLogoSize',
      'productionLabelValueWeight',
      'productionLabelLogoPosition',
      'productionLabelValueAlign',
      'productionLabelSeparatorStyle',
      'productionLabelLabelCase'
    ].forEach((id) => {
      const element = document.getElementById(id);
      element?.addEventListener('input', handleProductionLabelStyleChange);
      element?.addEventListener('change', handleProductionLabelStyleChange);
    });
    document.getElementById('resetProductionLabelStyleButton')?.addEventListener('click', resetProductionLabelStyle);
    document.querySelectorAll('[data-open-activity-launcher]').forEach((button) => {
      button.addEventListener('click', openActivityLauncher);
    });
    document.getElementById('closeActivityLauncher')?.addEventListener('click', closeActivityLauncher);
    document.getElementById('activityLauncherBackdrop')?.addEventListener('click', closeActivityLauncher);
    document.getElementById('dashboardActivityHistoryButton')?.addEventListener('click', openDashboardHistory);

    bindModuleCardActions();

    document.getElementById('closeBatchForm')?.addEventListener('click', closeBatchForm);
    document.getElementById('batchSheetBackdrop')?.addEventListener('click', closeBatchForm);
    document.getElementById('batchForm')?.addEventListener('submit', handleBatchSubmit);
    document.getElementById('batchVolume')?.addEventListener('input', renderBatchRecipePreview);

    document.querySelectorAll('[data-open-batch-form]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openBatchForm);
    });
    document.querySelectorAll('[data-open-fermentation]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', () => openFermentationSheet());
    });
    document.querySelectorAll('[data-open-finish]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', () => openFinishSheet());
    });

    document.getElementById('closeFermentationSheet')?.addEventListener('click', closeFermentationSheet);
    document.getElementById('fermentationSheetBackdrop')?.addEventListener('click', closeFermentationSheet);
    document.getElementById('fermentationForm')?.addEventListener('submit', handleFermentationSubmit);
    document.getElementById('fermentationBatchSelect')?.addEventListener('change', handleFermentationBatchChange);
    document.getElementById('fermentationDate')?.addEventListener('change', renderFermentationSelection);

    document.getElementById('closeFinishSheet')?.addEventListener('click', closeFinishSheet);
    document.getElementById('finishSheetBackdrop')?.addEventListener('click', closeFinishSheet);
    document.getElementById('finishForm')?.addEventListener('submit', handleFinishSubmit);
    document.getElementById('finishBatchSelect')?.addEventListener('change', handleFinishBatchChange);
    document.getElementById('finishShrink')?.addEventListener('input', renderFinishVolume);

    document.querySelectorAll('[data-open-bottling]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', () => openBottlingSheet(button.dataset.openBottling));
    });
    document.getElementById('closeBottlingSheet')?.addEventListener('click', closeBottlingSheet);
    document.getElementById('bottlingSheetBackdrop')?.addEventListener('click', closeBottlingSheet);
    document.getElementById('bottlingForm')?.addEventListener('submit', handleBottlingSubmit);
    document.getElementById('bottlingBatchSelect')?.addEventListener('change', handleBottlingBatchChange);
    document.getElementById('bottlingVolume')?.addEventListener('input', renderBottlingPreview);
    document.getElementById('bottlingDate')?.addEventListener('change', renderBottlingPreview);
    document.getElementById('bottlingActualSugar')?.addEventListener('input', renderBottlingPreview);

    document.querySelectorAll('[data-open-production-history]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openProductionHistoryPage);
    });
    document.querySelectorAll('[data-back-production]').forEach((button) => {
      button.addEventListener('click', () => navigate('produksi'));
    });
    document.querySelectorAll('[data-history-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        state.productionHistoryTab = button.dataset.historyTab || 'semua';
        renderProductionHistory();
      });
    });
    ['productionHistorySearch', 'productionHistoryStartDate', 'productionHistoryEndDate', 'productionHistoryStatus']
      .forEach((id) => {
        const element = document.getElementById(id);
        const eventName = id === 'productionHistorySearch' ? 'input' : 'change';
        element?.addEventListener(eventName, renderProductionHistory);
      });
    document.getElementById('resetProductionHistoryFilters')?.addEventListener('click', resetProductionHistoryFilters);
    document.getElementById('closeProductionHistoryDetail')?.addEventListener('click', closeProductionHistoryDetail);
    document.getElementById('closeProductionHistoryDetailFooter')?.addEventListener('click', closeProductionHistoryDetail);
    document.getElementById('productionHistoryDetailBackdrop')?.addEventListener('click', closeProductionHistoryDetail);

    document.querySelectorAll('[data-open-opening-stock]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openOpeningStockSheet);
    });
    document.querySelectorAll('[data-open-purchase]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openPurchaseSheet);
    });

    document.getElementById('closeOpeningStockSheet')?.addEventListener('click', closeOpeningStockSheet);
    document.getElementById('openingStockSheetBackdrop')?.addEventListener('click', closeOpeningStockSheet);
    document.getElementById('openingStockForm')?.addEventListener('submit', handleOpeningStockSubmit);
    document.getElementById('addOpeningStockItem')?.addEventListener('click', () => addInventoryEntry('opening'));

    document.getElementById('closePurchaseSheet')?.addEventListener('click', closePurchaseSheet);
    document.getElementById('purchaseSheetBackdrop')?.addEventListener('click', closePurchaseSheet);
    document.getElementById('purchaseForm')?.addEventListener('submit', handlePurchaseSubmit);
    document.getElementById('addPurchaseItem')?.addEventListener('click', () => addInventoryEntry('purchase'));
    bindMoneyInput(document.getElementById('purchaseDiscount'), renderPurchaseTotals);
    bindMoneyInput(document.getElementById('purchaseShipping'), renderPurchaseTotals);

    document.querySelectorAll('[data-open-sale]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openSaleSheet);
    });
    document.getElementById('closeSaleSheet')?.addEventListener('click', closeSaleSheet);
    document.getElementById('saleSheetBackdrop')?.addEventListener('click', closeSaleSheet);
    document.getElementById('saleForm')?.addEventListener('submit', handleSaleSubmit);
    document.getElementById('addSaleItem')?.addEventListener('click', addSaleEntry);
    bindMoneyInput(document.getElementById('saleDiscount'), renderSaleTotals);
    bindMoneyInput(document.getElementById('saleShipping'), renderSaleTotals);

    document.querySelectorAll('[data-open-expense]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openExpenseSheet);
    });
    document.getElementById('closeExpenseSheet')?.addEventListener('click', closeExpenseSheet);
    document.getElementById('expenseSheetBackdrop')?.addEventListener('click', closeExpenseSheet);
    document.getElementById('expenseForm')?.addEventListener('submit', handleExpenseSubmit);
    bindMoneyInput(document.getElementById('expenseAmount'), renderExpensePreview);
    ['expenseDate', 'expenseCategory', 'expenseMethod', 'expenseTitle', 'expenseParty']
      .forEach((id) => {
        const element = document.getElementById(id);
        const eventName = element?.tagName === 'SELECT' || element?.type === 'date' ? 'change' : 'input';
        element?.addEventListener(eventName, renderExpensePreview);
      });

    document.querySelectorAll('[data-open-stock-usage]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openStockUsageSheet);
    });
    document.getElementById('closeStockUsageSheet')?.addEventListener('click', closeStockUsageSheet);
    document.getElementById('stockUsageSheetBackdrop')?.addEventListener('click', closeStockUsageSheet);
    document.getElementById('stockUsageForm')?.addEventListener('submit', handleStockUsageSubmit);
    document.getElementById('addStockUsageItem')?.addEventListener('click', addStockUsageEntry);

    document.querySelectorAll('[data-open-stock-opname]:not(.module-card)').forEach((button) => {
      button.addEventListener('click', openStockOpnameSheet);
    });
    document.getElementById('closeStockOpnameSheet')?.addEventListener('click', closeStockOpnameSheet);
    document.getElementById('stockOpnameSheetBackdrop')?.addEventListener('click', closeStockOpnameSheet);
    document.getElementById('stockOpnameForm')?.addEventListener('submit', handleStockOpnameSubmit);
    document.getElementById('stockOpnameCategory')?.addEventListener('change', renderStockOpnameRows);
    document.getElementById('stockOpnameSearch')?.addEventListener('input', renderStockOpnameRows);
    document.getElementById('stockOpnameDifferenceOnly')?.addEventListener('change', renderStockOpnameRows);
    document.getElementById('fillStockOpnameSystem')?.addEventListener('click', fillVisibleStockOpnameWithSystem);
    document.getElementById('clearStockOpnamePhysical')?.addEventListener('click', clearVisibleStockOpname);

    document.querySelectorAll('[data-back-transaction-history]').forEach((button) => {
      button.addEventListener('click', () => navigate('transaksi'));
    });
    ['transactionHistorySearch', 'transactionHistoryStartDate', 'transactionHistoryEndDate',
      'transactionHistoryType', 'transactionHistoryStatus', 'transactionHistoryMethod'].forEach((id) => {
      const element = document.getElementById(id);
      const eventName = element?.tagName === 'SELECT' || element?.type === 'date' ? 'change' : 'input';
      element?.addEventListener(eventName, renderTransactionHistory);
    });
    document.getElementById('resetTransactionHistoryFilters')?.addEventListener('click', resetTransactionHistoryFilters);
    document.getElementById('closeTransactionHistoryDetail')?.addEventListener('click', closeTransactionHistoryDetail);
    document.getElementById('closeTransactionHistoryDetailFooter')?.addEventListener('click', closeTransactionHistoryDetail);
    document.getElementById('transactionHistoryDetailBackdrop')?.addEventListener('click', closeTransactionHistoryDetail);
    document.getElementById('openTransactionVoidButton')?.addEventListener('click', openTransactionVoidSheet);
    document.getElementById('closeTransactionVoidSheet')?.addEventListener('click', closeTransactionVoidSheet);
    document.getElementById('cancelTransactionVoidButton')?.addEventListener('click', closeTransactionVoidSheet);
    document.getElementById('transactionVoidBackdrop')?.addEventListener('click', closeTransactionVoidSheet);
    document.getElementById('transactionVoidForm')?.addEventListener('submit', handleTransactionVoidSubmit);

    document.querySelectorAll('[data-report-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        state.reportActiveTab = button.dataset.reportTab || 'ringkasan';
        renderReportsPage();
      });
    });
    document.querySelectorAll('[data-report-preset]').forEach((button) => {
      button.addEventListener('click', () => applyReportPeriodPreset(button.dataset.reportPreset || 'bulan-ini'));
    });
    ['reportsStartDate', 'reportsEndDate', 'reportsCategory', 'reportsVariant', 'reportsMethod']
      .forEach((id) => {
        const element = document.getElementById(id);
        element?.addEventListener('change', () => {
          state.reportPeriodPreset = 'kustom';
          renderReportsPage();
        });
      });
    document.getElementById('resetReportsFilters')?.addEventListener('click', resetReportsFilters);
    document.getElementById('exportReportsCsv')?.addEventListener('click', exportCurrentReportCsv);
    document.getElementById('printReports')?.addEventListener('click', () => window.print());

    document.querySelectorAll('[data-back-stock-detail]').forEach((button) => {
      button.addEventListener('click', () => navigate('stok'));
    });
    document.getElementById('stockDetailSearch')?.addEventListener('input', renderStockDetailPage);
    document.getElementById('stockDetailStatus')?.addEventListener('change', renderStockDetailPage);
    document.getElementById('stockDetailCategory')?.addEventListener('change', renderStockDetailPage);
    document.getElementById('resetStockDetailFilters')?.addEventListener('click', resetStockDetailFilters);
    document.getElementById('stockDetailPrimaryAction')?.addEventListener('click', handleStockDetailPrimaryAction);

    document.getElementById('closeStockItemDetail')?.addEventListener('click', closeStockItemDetail);
    document.getElementById('closeStockItemDetailFooter')?.addEventListener('click', closeStockItemDetail);
    document.getElementById('stockItemDetailBackdrop')?.addEventListener('click', closeStockItemDetail);
    document.getElementById('editStockItemMasterButton')?.addEventListener('click', () => {
      const code = state.selectedStockItemCode;
      closeStockItemDetail(true);
      if (code) openMasterItemForm(code);
    });

    document.querySelectorAll('[data-back-master-items]').forEach((button) => {
      button.addEventListener('click', () => navigate('lainnya'));
    });
    document.getElementById('addMasterItemButton')?.addEventListener('click', () => openMasterItemForm());
    document.getElementById('masterItemSearch')?.addEventListener('input', renderMasterItemsPage);
    document.getElementById('masterItemTypeFilter')?.addEventListener('change', renderMasterItemsPage);
    document.getElementById('masterItemCategoryFilter')?.addEventListener('change', renderMasterItemsPage);
    document.getElementById('masterItemActiveFilter')?.addEventListener('change', renderMasterItemsPage);
    document.getElementById('resetMasterItemFilters')?.addEventListener('click', resetMasterItemFilters);

    document.getElementById('closeMasterItemSheet')?.addEventListener('click', closeMasterItemSheet);
    document.getElementById('masterItemSheetBackdrop')?.addEventListener('click', closeMasterItemSheet);
    document.getElementById('masterItemForm')?.addEventListener('submit', handleMasterItemSubmit);
    document.getElementById('masterItemType')?.addEventListener('change', handleMasterItemTypeChange);
    document.getElementById('masterItemCode')?.addEventListener('input', () => {
      state.masterItemAutoCode = false;
      const input = document.getElementById('masterItemCode');
      if (input) input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    });
    bindMoneyInput(document.getElementById('masterItemSellPrice'));

    document.querySelectorAll('[data-back-app-settings]').forEach((button) => {
      button.addEventListener('click', () => navigate('lainnya'));
    });
    document.querySelectorAll('[data-settings-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        state.appSettingsActiveTab = button.dataset.settingsTab || 'profil';
        renderAppSettingsTabs();
      });
    });
    document.getElementById('saveAppSettings')?.addEventListener('click', handleAppSettingsSubmit);
    document.getElementById('reloadAppSettings')?.addEventListener('click', () => loadAppSettings(true));
    document.getElementById('settingBottleMl')?.addEventListener('input', updateBottleCalculationPreview);
    ['settingBusinessName', 'settingBusinessLocation'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', renderBusinessIdentityPreview);
    });
    document.getElementById('syncAppCalendarButton')?.addEventListener('click', syncAppCalendar);
    document.getElementById('testAppCalendarButton')?.addEventListener('click', testAppCalendar);
    document.getElementById('addAppUserButton')?.addEventListener('click', () => openAppUserSheet());
    document.getElementById('closeAppUserSheet')?.addEventListener('click', closeAppUserSheet);
    document.getElementById('appUserSheetBackdrop')?.addEventListener('click', closeAppUserSheet);
    document.getElementById('appUserForm')?.addEventListener('submit', handleAppUserSubmit);
    document.getElementById('appUserRole')?.addEventListener('change', renderAppUserRoleGuide);
    document.getElementById('changeOwnPasswordButton')?.addEventListener('click', changeOwnPassword);
    document.getElementById('createBackupNowButton')?.addEventListener('click', createBackupNow);
    document.getElementById('installBackupScheduleButton')?.addEventListener('click', installBackupSchedule);
    document.getElementById('reloadSystemActivityButton')?.addEventListener('click', () => loadAppSettings(true));
    document.getElementById('applyAppUpdateButton')?.addEventListener('click', applyAppUpdate);
    document.getElementById('dismissAppUpdateButton')?.addEventListener('click', dismissAppUpdate);
    window.addEventListener('meramu:auth-expired', handleAuthExpired);

    document.querySelectorAll('[data-back-master-recipes]').forEach((button) => {
      button.addEventListener('click', () => navigate('lainnya'));
    });
    document.getElementById('addMasterRecipeButton')?.addEventListener('click', () => openMasterRecipeSheet());
    document.getElementById('masterRecipeSearch')?.addEventListener('input', renderMasterRecipesPage);
    document.getElementById('masterRecipeProcessFilter')?.addEventListener('change', renderMasterRecipesPage);
    document.getElementById('masterRecipeVariantFilter')?.addEventListener('change', renderMasterRecipesPage);
    document.getElementById('masterRecipeDirectionFilter')?.addEventListener('change', renderMasterRecipesPage);
    document.getElementById('masterRecipeActiveFilter')?.addEventListener('change', renderMasterRecipesPage);
    document.getElementById('resetMasterRecipeFilters')?.addEventListener('click', resetMasterRecipeFilters);
    document.getElementById('closeMasterRecipeSheet')?.addEventListener('click', closeMasterRecipeSheet);
    document.getElementById('masterRecipeSheetBackdrop')?.addEventListener('click', closeMasterRecipeSheet);
    document.getElementById('masterRecipeForm')?.addEventListener('submit', handleMasterRecipeSubmit);
    ['masterRecipeProcess', 'masterRecipeVariant', 'masterRecipeDirection', 'masterRecipeBasis']
      .forEach((id) => document.getElementById(id)?.addEventListener('change', updateMasterRecipeFormRules));
    document.getElementById('masterRecipeItem')?.addEventListener('change', updateMasterRecipeItemPreview);
    document.getElementById('masterRecipeQty')?.addEventListener('input', updateMasterRecipeItemPreview);
    document.getElementById('masterRecipeCode')?.addEventListener('input', () => {
      state.masterRecipeAutoCode = false;
      const input = document.getElementById('masterRecipeCode');
      if (input) input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAllSheets();
    });

    document.getElementById('logoutButton')?.addEventListener('click', logout);
    document.getElementById('mobileAvatar')?.addEventListener('click', () => navigate('lainnya'));
    document.getElementById('installButton')?.addEventListener('click', installApp);
    document.getElementById('dismissInstall')?.addEventListener('click', dismissInstall);

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      state.deferredInstallPrompt = event;
      showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      state.deferredInstallPrompt = null;
      document.getElementById('installBanner')?.setAttribute('hidden', '');
      showToast('MERAMU berhasil dipasang di perangkat.', 'success');
    });
  }

  function bindModuleCardActions() {
    document.querySelectorAll('.module-card').forEach((card) => {
      let hitbox = card.querySelector('.module-card-hitbox');

      if (!hitbox) {
        hitbox = document.createElement('span');
        hitbox.className = 'module-card-hitbox';
        hitbox.setAttribute('aria-hidden', 'true');
        card.appendChild(hitbox);
      }

      hitbox.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        runModuleCardAction(card);
      });

      // Tetap mendukung keyboard dan klik langsung pada elemen button.
      card.addEventListener('click', (event) => {
        if (event.target.closest('.module-card-hitbox')) return;
        event.preventDefault();
        runModuleCardAction(card);
      });
    });
  }

  function runModuleCardAction(card) {
    if (!card || card.disabled) return;

    animatePress(card);

    if (card.hasAttribute('data-open-batch-form')) {
      openBatchForm();
      return;
    }
    if (card.hasAttribute('data-open-fermentation')) {
      openFermentationSheet();
      return;
    }
    if (card.hasAttribute('data-open-finish')) {
      openFinishSheet();
      return;
    }
    if (card.hasAttribute('data-open-bottling')) {
      openBottlingSheet(card.dataset.openBottling);
      return;
    }
    if (card.hasAttribute('data-open-production-history')) {
      openProductionHistoryPage();
      return;
    }
    if (card.hasAttribute('data-open-opening-stock')) {
      openOpeningStockSheet();
      return;
    }
    if (card.hasAttribute('data-open-purchase')) {
      openPurchaseSheet();
      return;
    }
    if (card.hasAttribute('data-open-sale')) {
      openSaleSheet();
      return;
    }
    if (card.hasAttribute('data-open-expense')) {
      openExpenseSheet();
      return;
    }
    if (card.hasAttribute('data-open-stock-usage')) {
      openStockUsageSheet();
      return;
    }
    if (card.hasAttribute('data-open-stock-opname')) {
      openStockOpnameSheet();
      return;
    }
    if (card.hasAttribute('data-open-transaction-history')) {
      openTransactionHistoryPage();
      return;
    }
    if (card.hasAttribute('data-open-reports')) {
      openReportsPage();
      return;
    }
    if (card.hasAttribute('data-open-stock-group')) {
      openStockDetailPage(card.dataset.openStockGroup);
      return;
    }
    if (card.hasAttribute('data-open-master-items')) {
      openMasterItemsPage();
      return;
    }
    if (card.hasAttribute('data-open-app-settings')) {
      openAppSettingsPage();
      return;
    }
    if (card.hasAttribute('data-open-app-users')) {
      openAppUsersPage();
      return;
    }
    if (card.hasAttribute('data-open-master-recipes')) {
      openMasterRecipesPage();
      return;
    }
    if (card.hasAttribute('data-open-label-print')) {
      openProductionLabelPage();
      return;
    }

    const action = card.dataset.demoAction;
    if (action) {
      showToast(`${action} akan dibuat pada tahap modul berikutnya.`, 'info');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const errorElement = document.getElementById('loginError');
    const username = form.username.value.trim();
    const password = form.password.value;

    errorElement.textContent = '';
    if (!username || !password) {
      errorElement.textContent = 'Username dan password wajib diisi.';
      shakeElement(form);
      return;
    }

    setButtonLoading(submitButton, true, 'Menghubungkan...');

    try {
      const result = await window.MeramuAPI.request('login', { username, password }, { token: '' });
      state.session = { token: result.token, user: result.user, savedAt: Date.now() };
      localStorage.setItem(config.SESSION_KEY, JSON.stringify(state.session));
      form.reset();
      openApp();
      showToast('Login berhasil. Data MERAMU sedang dimuat.', 'success');
    } catch (error) {
      errorElement.textContent = error.message || 'Login gagal. Silakan coba lagi.';
      shakeElement(form);
    } finally {
      setButtonLoading(submitButton, false, 'Masuk');
    }
  }

  function togglePassword() {
    const field = document.getElementById('password');
    const button = document.getElementById('togglePassword');
    const showing = field.type === 'text';
    field.type = showing ? 'password' : 'text';
    button.setAttribute('aria-label', showing ? 'Tampilkan password' : 'Sembunyikan password');
    button.setAttribute('aria-pressed', String(!showing));
    animatePress(button);
  }

  function cacheSession() {
    try {
      const raw = localStorage.getItem(config.SESSION_KEY);
      state.session = raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(config.SESSION_KEY);
      state.session = null;
    }
  }

  function openLogin() {
    closeAllSheets(true);
    const loginView = document.getElementById('loginView');
    document.getElementById('appView')?.setAttribute('hidden', '');
    loginView?.removeAttribute('hidden');
    document.body.classList.remove('is-authenticated');
    restartClass(loginView, 'motion-login-enter');
  }

  function openApp() {
    const appView = document.getElementById('appView');
    document.getElementById('loginView')?.setAttribute('hidden', '');
    appView?.removeAttribute('hidden');
    document.body.classList.add('is-authenticated');
    restartClass(appView, 'motion-app-enter');

    applyUser();

    const savedStockGroup = String(
      localStorage.getItem(config.STOCK_DETAIL_GROUP_KEY) || 'BAHAN'
    ).toUpperCase();
    state.stockDetailGroup = ['BAHAN', 'KEMASAN', 'PRODUK'].includes(savedStockGroup)
      ? savedStockGroup
      : 'BAHAN';

    const lastPage = localStorage.getItem(config.LAST_PAGE_KEY);
    navigate(pageNames[lastPage] ? lastPage : 'dashboard', false);
    refreshAppData({ showToastOnError: true });
  }

  async function logout() {
    const token = state.session?.token || '';
    if (token) {
      window.MeramuAPI.request('logout', {}, { token }).catch(() => {});
    }

    localStorage.removeItem(config.SESSION_KEY);
    localStorage.removeItem(config.LAST_PAGE_KEY);
    localStorage.removeItem(config.STOCK_DETAIL_GROUP_KEY);
    state.session = null;
    state.page = 'dashboard';
    state.dashboardCounted = false;
    state.initialData = null;
    state.batches = [];
    state.bottlings = [];
    state.transactions = [];
    state.reportData = null;
    state.reportLoaded = false;
    state.reportLoading = false;
    state.currentReportTable = null;
    state.stockDetailGroup = 'BAHAN';
    state.selectedStockItemCode = '';
    state.selectedMasterItemCode = '';
    state.masterItemSubmitting = false;
    state.appSettingsData = null;
    state.appSettingsLoaded = false;
    state.appSettingsLoading = false;
    state.appSettingsSaving = false;
    state.selectedAppUsername = '';
    state.masterRecipeSubmitting = false;
    state.selectedMasterRecipeCode = '';
    state.backupSubmitting = false;
    state.authExpiryHandled = false;
    state.selectedLabelBatchId = '';
    state.productionLabelStyle = null;
    openLogin();
    showToast('Anda telah keluar dari aplikasi.', 'info');
  }

  function applyUser() {
    const user = state.session?.user || { name: 'Pengguna', role: 'USER' };
    const initial = getInitials(user.name || user.username);

    document.querySelectorAll('[data-user-name]').forEach((element) => {
      element.textContent = user.name || user.username;
    });
    document.querySelectorAll('[data-user-role]').forEach((element) => {
      element.textContent = formatRole(user.role);
    });
    document.querySelectorAll('[data-user-initial]').forEach((element) => {
      element.textContent = initial;
    });

    applyRoleAccess();
  }

  async function refreshAppData(options = {}) {
    if (!state.session?.token) return;

    setDashboardLoading(true);
    try {
      const initial = await window.MeramuAPI.request(
        'initial',
        {},
        {token: state.session.token, timeout: 45000}
      );

      let batches = Array.isArray(initial.batches) ? initial.batches : null;
      let bottlings = Array.isArray(initial.bottlings) ? initial.bottlings : null;
      let transactions = Array.isArray(initial.transactions) ? initial.transactions : null;

      // Kompatibilitas sementara bila backend lama masih aktif.
      if (!initial.bundled) {
        const fallbackResults = await Promise.all([
          window.MeramuAPI.request('batches', {}, {token: state.session.token}),
          window.MeramuAPI.request('bottlings', {}, {token: state.session.token}),
          window.MeramuAPI.request('transactions', {}, {token: state.session.token})
        ]);
        batches = Array.isArray(fallbackResults[0].data) ? fallbackResults[0].data : [];
        bottlings = Array.isArray(fallbackResults[1].data) ? fallbackResults[1].data : [];
        transactions = Array.isArray(fallbackResults[2].data) ? fallbackResults[2].data : [];
      }

      state.initialData = initial;
      state.batches = batches || [];
      state.bottlings = bottlings || [];
      state.transactions = transactions || [];
      state.reportLoaded = false;
      buildDataMaps();
      renderDashboard();
      renderBatchLists();
      renderBatchRecipePreview();
      populateFermentationBatchOptions();
      populateFinishBatchOptions();
      populateBottlingBatchOptions();
      renderBottlingHistory();
      renderProductionHistory();
      renderTransactionActivity();
      renderTransactionHistory();
      if (state.page === 'laporan') loadReportData(true);
      renderStockAttention();
      renderStockDetailPage();
      renderMasterItemsPage();
      renderMasterRecipesPage();
      renderProductionLabelPage();
      applyBusinessIdentity(state.initialData?.settings || {});
      if (state.page === 'pengaturan') loadAppSettings(true);
    } catch (error) {
      if (isSessionError(error)) {
        localStorage.removeItem(config.SESSION_KEY);
        state.session = null;
        openLogin();
        showToast('Sesi berakhir. Silakan masuk kembali.', 'warning');
        return;
      }

      renderDashboardError(error.message);
      if (options.showToastOnError) showToast(error.message || 'Data gagal dimuat.', 'error');
    } finally {
      setDashboardLoading(false);
    }
  }

  function buildDataMaps() {
    state.itemMap = new Map();
    state.stockMap = new Map();

    (state.initialData?.items || []).forEach((item) => {
      state.itemMap.set(String(item.code).toUpperCase(), item);
    });
    (state.initialData?.stock || []).forEach((item) => {
      state.stockMap.set(String(item.code).toUpperCase(), item);
    });
  }

  function dashboardRole() {
    return String(state.initialData?.dashboard?.role || currentApplicationRole() || 'ADMIN').toUpperCase();
  }

  function dashboardRoleName(role = dashboardRole()) {
    const labels = {
      ADMIN: 'Administrator',
      PRODUKSI: 'Produksi',
      KASIR: 'Kasir'
    };
    return labels[role] || formatRole(role);
  }

  function renderDashboard() {
    const data = state.initialData?.dashboard || {};
    renderDashboardHero(data);
    renderDashboardKpis(data);
    renderAttention(data);
    renderDashboardQuickActions();
    renderDashboardTrendChart(data);
    renderDashboardRecentActivities(data);
    renderDashboardProductStock(data);
    renderDashboardRanking(data);
    renderDashboardVariants(data);

    const generatedAt = data.generatedAt ? formatDateTime(data.generatedAt) : 'Baru diperbarui';
    setText('#dashboardGeneratedAt', `Sinkron ${generatedAt}`);
    state.dashboardCounted = true;
  }

  function renderDashboardHero(data) {
    const role = dashboardRole();
    const today = data.today || {};
    const month = data.month || {};
    const inventory = data.inventory || {};
    const production = data.production || {};
    const topProduct = Array.isArray(data.topProducts) && data.topProducts.length
      ? data.topProducts[0]
      : null;

    const configurations = {
      ADMIN: {
        kicker: 'Ringkasan usaha hari ini',
        title: 'Kinerja MERAMU hari ini',
        subtitle: 'Penjualan, laba, stok, dan produksi dalam satu pandangan.',
        valueLabel: 'Omzet hari ini',
        value: formatCurrency(today.sales),
        period: 'Hari ini',
        stats: [
          ['Laba operasional', formatCurrency(today.operatingProfit)],
          ['Pengeluaran', formatCurrency(today.expense)],
          ['Produk terjual', `${formatQuantity(today.productsSold)} unit`],
          ['Omzet bulan ini', formatCurrency(month.sales)]
        ]
      },
      PRODUKSI: {
        kicker: 'Kontrol produksi hari ini',
        title: 'Produksi dan fermentasi',
        subtitle: 'Prioritaskan batch, bottling, bahan, dan kemasan yang perlu ditangani.',
        valueLabel: 'Batch aktif',
        value: `${formatQuantity(production.activeBatches)} batch`,
        period: 'Operasional',
        stats: [
          ['Perlu dicek', `${formatQuantity(production.readyCheck)} batch`],
          ['Siap bottling', `${formatQuantity(production.readyBottling)} batch`],
          ['Hasil hari ini', `${formatQuantity(production.bottledToday)} unit`],
          ['Stok perlu perhatian', `${formatQuantity(toNumber(inventory.materialAttention) + toNumber(inventory.packagingAttention))} item`]
        ]
      },
      KASIR: {
        kicker: 'Ringkasan penjualan hari ini',
        title: 'Penjualan dan stok produk',
        subtitle: 'Pantau omzet, transaksi, produk terjual, dan ketersediaan produk.',
        valueLabel: 'Omzet hari ini',
        value: formatCurrency(today.sales),
        period: 'Hari ini',
        stats: [
          ['Transaksi', `${formatQuantity(today.saleTransactions)} invoice`],
          ['Produk terjual', `${formatQuantity(today.productsSold)} unit`],
          ['Stok produk', `${formatQuantity(inventory.productStock)} unit`],
          ['Terlaris bulan ini', topProduct?.name || 'Belum ada penjualan']
        ]
      }
    };

    const config = configurations[role] || configurations.ADMIN;
    setText('#dashboardHeroKicker', config.kicker);
    setText('#dashboardHeroTitle', config.title);
    setText('#dashboardHeroSubtitle', config.subtitle);
    setText('#dashboardHeroValueLabel', config.valueLabel);
    setText('#dashboardHeroValue', config.value);
    setText('#dashboardHeroPeriod', config.period);

    const hero = document.getElementById('dashboardRoleHero');
    if (hero) hero.dataset.role = role.toLowerCase();

    const stats = document.getElementById('dashboardHeroStats');
    if (stats) {
      stats.replaceChildren();
      config.stats.forEach(([label, value]) => {
        const item = document.createElement('div');
        const labelElement = document.createElement('span');
        labelElement.textContent = label;
        const valueElement = document.createElement('strong');
        valueElement.textContent = value;
        item.append(labelElement, valueElement);
        stats.append(item);
      });
    }
  }

  function dashboardKpiDefinitions(data) {
    const role = dashboardRole();
    const today = data.today || {};
    const inventory = data.inventory || {};
    const production = data.production || {};
    const topProduct = Array.isArray(data.topProducts) && data.topProducts.length
      ? data.topProducts[0]
      : null;

    if (role === 'PRODUKSI') {
      return [
        {label: 'Batch aktif', value: production.activeBatches, format: 'integer', note: 'Fermentasi dan siap proses', tone: 'green', action: 'production'},
        {label: 'Perlu cek', value: production.readyCheck, format: 'integer', note: 'Catat pH, Brix, aroma, rasa', tone: 'orange', action: 'fermentation'},
        {label: 'Siap bottling', value: production.readyBottling, format: 'integer', note: 'F1 selesai dan siap dibagi', tone: 'blue', action: 'bottling'},
        {label: 'Lewat hari ideal', value: production.overdue, format: 'integer', note: 'Perlu keputusan segera', tone: 'red', action: 'production'},
        {label: 'Bottling hari ini', value: production.bottlingToday, format: 'integer', note: `${formatQuantity(production.bottledToday)} hasil dicatat`, tone: 'purple', action: 'production-history'},
        {label: 'Bahan & kemasan', value: toNumber(inventory.materialAttention) + toNumber(inventory.packagingAttention), format: 'integer', note: 'Item menipis atau habis', tone: 'orange', action: 'stock'}
      ];
    }

    if (role === 'KASIR') {
      return [
        {label: 'Omzet hari ini', value: today.sales, format: 'currency', note: 'Total penjualan masuk', tone: 'green', action: 'sales'},
        {label: 'Transaksi', value: today.saleTransactions, format: 'integer', note: 'Invoice penjualan hari ini', tone: 'blue', action: 'transactions'},
        {label: 'Produk terjual', value: today.productsSold, format: 'integer', note: 'Botol atau unit terjual', tone: 'purple', action: 'transactions'},
        {label: 'Stok produk', value: inventory.productStock, format: 'integer', note: 'Produk dan starter tersedia', tone: 'green', action: 'product-stock'},
        {label: 'Produk perlu perhatian', value: inventory.productAttention, format: 'integer', note: 'Stok produk menipis atau habis', tone: 'red', action: 'product-stock'},
        {label: 'Produk terlaris', value: topProduct?.qty || 0, format: 'integer', note: topProduct?.name || 'Belum ada penjualan', tone: 'orange', action: 'transactions'}
      ];
    }

    return [
      {label: 'Omzet hari ini', value: today.sales, format: 'currency', note: `${formatQuantity(today.saleTransactions)} invoice`, tone: 'green', action: 'sales'},
      {label: 'Laba operasional', value: today.operatingProfit, format: 'currency', note: 'Omzet − HPP − pengeluaran', tone: today.operatingProfit < 0 ? 'red' : 'green', action: 'reports'},
      {label: 'Produk terjual', value: today.productsSold, format: 'integer', note: 'Jumlah unit hari ini', tone: 'blue', action: 'transactions'},
      {label: 'Nilai persediaan', value: inventory.stockValue, format: 'currency', note: `${formatQuantity(inventory.activeItems)} item aktif`, tone: 'purple', action: 'stock'},
      {label: 'Batch aktif', value: production.activeBatches, format: 'integer', note: `${formatQuantity(production.readyCheck + production.readyBottling)} perlu tindakan`, tone: 'orange', action: 'production'},
      {label: 'Bottling hari ini', value: production.bottlingToday, format: 'integer', note: `${formatQuantity(production.bottledToday)} hasil`, tone: 'blue', action: 'production-history'}
    ];
  }

  function renderDashboardKpis(data) {
    const container = document.getElementById('dashboardRoleKpiGrid');
    if (!container) return;

    const role = dashboardRole();
    setText('#dashboardKpiTitle', role === 'ADMIN' ? 'Ringkasan hari ini' : `Ringkasan ${dashboardRoleName(role)}`);
    setText(
      '#dashboardKpiCaption',
      role === 'ADMIN'
        ? 'Keuangan, persediaan, dan produksi terbaru.'
        : 'Informasi utama yang sesuai dengan tugas akun.'
    );

    container.replaceChildren();
    dashboardKpiDefinitions(data).forEach((metric) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `card dashboard-role-kpi-card tone-${metric.tone || 'green'}`;
      button.addEventListener('click', () => runDashboardNavigation(metric.action));

      const label = document.createElement('span');
      label.className = 'dashboard-role-kpi-label';
      label.textContent = metric.label;

      const value = document.createElement('strong');
      value.className = 'dashboard-role-kpi-value dashboard-live-value';
      value.textContent = metric.format === 'currency'
        ? formatCurrency(metric.value)
        : formatQuantity(metric.value);

      const note = document.createElement('small');
      note.textContent = metric.note;

      button.append(label, value, note);
      container.append(button);
    });
  }

  function runDashboardNavigation(action) {
    switch (action) {
      case 'reports':
        openReportsPage();
        break;
      case 'sales':
        openSaleSheet();
        break;
      case 'transactions':
        openTransactionHistoryPage();
        break;
      case 'production':
        navigate('produksi');
        break;
      case 'fermentation':
        openFermentationSheet();
        break;
      case 'bottling':
        openBottlingSheet('ORIGINAL');
        break;
      case 'production-history':
        openProductionHistoryPage();
        break;
      case 'product-stock':
        openStockDetailPage('PRODUK');
        break;
      case 'stock':
      default:
        navigate('stok');
        break;
    }
  }

  function dashboardActionDefinitions() {
    return [
      {
        id: 'batch',
        roles: ['ADMIN', 'PRODUKSI'],
        label: 'Buat Batch F1',
        note: 'Mulai fermentasi baru',
        tone: 'green',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M8 3h8M9 3v5l-4.5 8.2A3.2 3.2 0 0 0 7.3 21h9.4a3.2 3.2 0 0 0 2.8-4.8L15 8V3"/><path d="M8 15h8"/></svg>'
      },
      {
        id: 'fermentation',
        roles: ['ADMIN', 'PRODUKSI'],
        label: 'Cek Fermentasi',
        note: 'Catat pH dan Brix',
        tone: 'blue',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>'
      },
      {
        id: 'finish',
        roles: ['ADMIN', 'PRODUKSI'],
        label: 'Selesaikan F1',
        note: 'Catat hasil dan susut',
        tone: 'orange',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m5 12 4 4L19 6"/></svg>'
      },
      {
        id: 'bottling',
        roles: ['ADMIN', 'PRODUKSI'],
        label: 'Bottling',
        note: 'Kemas produk atau starter',
        tone: 'purple',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M9 3h6v4l2 3v10H7V10l2-3V3Z"/><path d="M9 7h6"/></svg>'
      },
      {
        id: 'purchase',
        roles: ['ADMIN'],
        label: 'Catat Pembelian',
        note: 'Tambah stok bahan dan kemasan',
        tone: 'blue',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 7h16v13H4z"/><path d="M8 7V5h8v2M8 12h8"/></svg>'
      },
      {
        id: 'sale',
        roles: ['ADMIN', 'KASIR'],
        label: 'Catat Penjualan',
        note: 'Kurangi stok dan catat omzet',
        tone: 'green',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 5.5h16v13H4z"/><path d="M4 9h16M8 14h3"/></svg>'
      },
      {
        id: 'expense',
        roles: ['ADMIN'],
        label: 'Catat Pengeluaran',
        note: 'Biaya operasional usaha',
        tone: 'red',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M5 7h14v12H5z"/><path d="M8 4h8v3M8 12h8"/></svg>'
      },
      {
        id: 'usage',
        roles: ['ADMIN', 'PRODUKSI'],
        label: 'Pemakaian Bahan',
        note: 'Rusak, tester, atau operasional',
        tone: 'orange',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 20c8 0 12-5 12-14-7 0-12 4-12 12"/><path d="M6 20c2-5 5-8 10-10"/></svg>'
      },
      {
        id: 'opname',
        roles: ['ADMIN'],
        label: 'Stok Opname',
        note: 'Sesuaikan stok fisik',
        tone: 'purple',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>'
      },
      {
        id: 'transaction-history',
        roles: ['KASIR'],
        label: 'Riwayat Penjualan',
        note: 'Periksa transaksi sebelumnya',
        tone: 'blue',
        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>'
      }
    ];
  }

  function dashboardActionsForRole() {
    const role = dashboardRole();
    return dashboardActionDefinitions().filter((action) => action.roles.includes(role));
  }

  function createDashboardActionButton(action, launcher = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = launcher
      ? `activity-launcher-card tone-${action.tone}`
      : `action-card dashboard-final-action-card tone-${action.tone}`;
    button.addEventListener('click', () => executeDashboardAction(action.id));

    const icon = document.createElement('span');
    icon.className = launcher ? 'activity-launcher-icon' : 'action-icon';
    icon.innerHTML = action.icon;

    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = action.label;
    const note = document.createElement('small');
    note.textContent = action.note;
    copy.append(title, note);

    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    button.append(icon, copy, chevron);
    return button;
  }

  function renderDashboardQuickActions() {
    const container = document.getElementById('dashboardActionGrid');
    if (!container) return;

    const actions = dashboardActionsForRole();
    setText('#dashboardActionCaption', `${actions.length} aktivitas tersedia untuk ${dashboardRoleName()}.`);
    container.replaceChildren();
    actions.forEach((action) => container.append(createDashboardActionButton(action)));
  }

  function executeDashboardAction(actionId) {
    closeActivityLauncher(true);

    switch (actionId) {
      case 'batch':
        openBatchForm();
        break;
      case 'fermentation':
        openFermentationSheet();
        break;
      case 'finish':
        openFinishSheet();
        break;
      case 'bottling':
        openBottlingSheet('ORIGINAL');
        break;
      case 'purchase':
        openPurchaseSheet();
        break;
      case 'sale':
        openSaleSheet();
        break;
      case 'expense':
        openExpenseSheet();
        break;
      case 'usage':
        openStockUsageSheet();
        break;
      case 'opname':
        openStockOpnameSheet();
        break;
      case 'transaction-history':
        openTransactionHistoryPage();
        break;
      default:
        showToast('Aktivitas tidak dikenali.', 'warning');
    }
  }

  function openActivityLauncher() {
    const container = document.getElementById('activityLauncherGrid');
    if (!container) return;

    const actions = dashboardActionsForRole();
    setText(
      '#activityLauncherSubtitle',
      `${actions.length} aktivitas tersedia untuk ${dashboardRoleName()}.`
    );

    container.replaceChildren();
    actions.forEach((action) => container.append(createDashboardActionButton(action, true)));
    openSheet('activityLauncherSheet', 'activityLauncherBackdrop');
  }

  function closeActivityLauncher(force = false) {
    closeSheet('activityLauncherSheet', 'activityLauncherBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function handleDashboardPriority(priority) {
    if (!priority) return;

    if (priority.action === 'STOCK') {
      openStockDetailPage(priority.group || 'BAHAN');
      return;
    }
    if (priority.action === 'FERMENTATION') {
      openFermentationSheet(priority.batchId || '');
      return;
    }
    if (priority.action === 'BOTTLING') {
      openBottlingSheet('ORIGINAL');
      return;
    }
    navigate('produksi');
  }

  function renderAttention(data) {
    const container = document.getElementById('dashboardAttentionList');
    if (!container) return;

    const priorities = Array.isArray(data.priorities) ? data.priorities.slice(0, 4) : [];
    setText('#dashboardAttentionCount', `${priorities.length} prioritas`);
    container.replaceChildren();

    if (!priorities.length) {
      const row = document.createElement('div');
      row.className = 'list-row dashboard-priority-safe';
      row.innerHTML = `
        <span class="list-icon">✓</span>
        <span class="list-copy">
          <strong>Operasional dalam kondisi aman</strong>
          <span>Belum ada stok atau batch yang membutuhkan tindakan.</span>
        </span>
      `;
      container.append(row);
      return;
    }

    priorities.forEach((priority) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `list-row dashboard-priority-row severity-${priority.severity || 'warning'}`;
      row.addEventListener('click', () => handleDashboardPriority(priority));

      const icon = document.createElement('span');
      icon.className = `list-icon ${priority.severity || 'warning'}`;
      icon.textContent = priority.kind === 'BATCH' ? 'B' : '!';

      const copy = document.createElement('span');
      copy.className = 'list-copy';
      const title = document.createElement('strong');
      title.textContent = priority.title;
      const note = document.createElement('span');
      note.textContent = priority.note;
      copy.append(title, note);

      const chevron = document.createElement('span');
      chevron.className = 'chevron';
      row.append(icon, copy, chevron);
      container.append(row);
    });
  }

  function dashboardTrendConfiguration(role = dashboardRole()) {
    if (role === 'PRODUKSI') {
      return {
        title: 'Produksi tujuh hari',
        caption: 'Hasil bottling dan Batch F1 baru.',
        firstLabel: 'Hasil bottling',
        secondLabel: 'Batch baru',
        firstKey: 'bottledOutput',
        secondKey: 'batchCreated',
        firstFormat: 'quantity',
        secondFormat: 'quantity'
      };
    }
    if (role === 'KASIR') {
      return {
        title: 'Penjualan tujuh hari',
        caption: 'Omzet dan produk yang terjual.',
        firstLabel: 'Omzet',
        secondLabel: 'Produk terjual',
        firstKey: 'sales',
        secondKey: 'productsSold',
        firstFormat: 'currency',
        secondFormat: 'quantity'
      };
    }
    return {
      title: 'Omzet dan laba operasional',
      caption: 'Perbandingan performa tujuh hari terakhir.',
      firstLabel: 'Omzet',
      secondLabel: 'Laba operasional',
      firstKey: 'sales',
      secondKey: 'profit',
      firstFormat: 'currency',
      secondFormat: 'currency'
    };
  }

  function renderDashboardTrendChart(data) {
    const container = document.getElementById('dashboardTrendChart');
    const legend = document.getElementById('dashboardTrendLegend');
    if (!container || !legend) return;

    const trend = Array.isArray(data.trend7Days) ? data.trend7Days : [];
    const config = dashboardTrendConfiguration();

    setText('#dashboardTrendTitle', config.title);
    setText('#dashboardTrendCaption', config.caption);

    legend.innerHTML = `
      <span><i class="series-primary"></i>${escapeHtml(config.firstLabel)}</span>
      <span><i class="series-secondary"></i>${escapeHtml(config.secondLabel)}</span>
    `;

    container.replaceChildren();

    if (!trend.length) {
      container.innerHTML = '<div class="dashboard-data-placeholder">Belum ada data tujuh hari.</div>';
      return;
    }

    const firstMax = Math.max(1, ...trend.map((entry) => Math.abs(toNumber(entry[config.firstKey]))));
    const secondMax = Math.max(1, ...trend.map((entry) => Math.abs(toNumber(entry[config.secondKey]))));

    trend.forEach((entry) => {
      const firstValue = toNumber(entry[config.firstKey]);
      const secondValue = toNumber(entry[config.secondKey]);

      const day = document.createElement('div');
      day.className = 'dashboard-chart-day';

      const bars = document.createElement('div');
      bars.className = 'dashboard-chart-bars';

      const firstBar = document.createElement('span');
      firstBar.className = 'dashboard-chart-bar series-primary';
      firstBar.style.height = `${Math.max(3, Math.abs(firstValue) / firstMax * 100)}%`;
      firstBar.title = `${config.firstLabel}: ${config.firstFormat === 'currency' ? formatCurrency(firstValue) : formatQuantity(firstValue)}`;

      const secondBar = document.createElement('span');
      secondBar.className = `dashboard-chart-bar series-secondary ${secondValue < 0 ? 'is-negative' : ''}`;
      secondBar.style.height = `${Math.max(3, Math.abs(secondValue) / secondMax * 100)}%`;
      secondBar.title = `${config.secondLabel}: ${config.secondFormat === 'currency' ? formatCurrency(secondValue) : formatQuantity(secondValue)}`;

      bars.append(firstBar, secondBar);

      const label = document.createElement('strong');
      label.textContent = entry.label || '-';

      const date = document.createElement('small');
      date.textContent = entry.dateLabel || '';

      day.append(bars, label, date);
      container.append(day);
    });
  }

  function dashboardActivityPrimaryValue(activity) {
    const role = dashboardRole();
    if (role !== 'PRODUKSI' && toNumber(activity.cashIn) > 0) {
      return {value: `+${formatCurrency(activity.cashIn)}`, tone: 'in'};
    }
    if (role === 'ADMIN' && toNumber(activity.cashOut) > 0) {
      return {value: `-${formatCurrency(activity.cashOut)}`, tone: 'out'};
    }
    if (toNumber(activity.qtyOut) > 0) {
      return {value: `-${formatQuantity(activity.qtyOut)} unit`, tone: 'out'};
    }
    if (toNumber(activity.qtyIn) > 0) {
      return {value: `+${formatQuantity(activity.qtyIn)} unit`, tone: 'in'};
    }
    return {value: activity.reference || '-', tone: 'neutral'};
  }

  function dashboardActivityDescription(activity) {
    const itemNames = Array.isArray(activity.itemNames) ? activity.itemNames : [];
    if (itemNames.length) return itemNames.join(', ');
    if (activity.party) return activity.party;
    if (activity.note) return activity.note;
    return activity.reference || 'Aktivitas MERAMU';
  }

  function openDashboardActivity(activity) {
    const type = String(activity?.type || '').toUpperCase();
    if (type === 'PENJUALAN' || type === 'PENGELUARAN' || type === 'PEMBELIAN' ||
        type === 'STOK_AWAL' || type === 'PEMAKAIAN' || type === 'STOK_OPNAME') {
      openTransactionHistoryPage();
      return;
    }
    openProductionHistoryPage();
  }

  function renderDashboardRecentActivities(data) {
    const container = document.getElementById('dashboardRecentActivityList');
    if (!container) return;

    const activities = Array.isArray(data.recentActivities) ? data.recentActivities : [];
    container.replaceChildren();

    if (!activities.length) {
      container.innerHTML = `
        <div class="dashboard-activity-empty">
          <strong>Belum ada aktivitas</strong>
          <span>Aktivitas terbaru akan muncul setelah transaksi atau produksi dicatat.</span>
        </div>
      `;
      return;
    }

    activities.slice(0, 7).forEach((activity) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'dashboard-recent-row';
      row.addEventListener('click', () => openDashboardActivity(activity));

      const icon = document.createElement('span');
      icon.className = `dashboard-recent-icon type-${String(activity.type || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      icon.innerHTML = transactionIcon(String(activity.type || '').toUpperCase());

      const copy = document.createElement('span');
      copy.className = 'dashboard-recent-copy';
      const title = document.createElement('strong');
      title.textContent = transactionTypeTitle(activity.type);
      const note = document.createElement('span');
      note.textContent = dashboardActivityDescription(activity);
      const meta = document.createElement('small');
      meta.textContent = `${activity.reference || '-'} · ${formatDateTime(activity.timestamp || activity.date)}`;
      copy.append(title, note, meta);

      const primary = dashboardActivityPrimaryValue(activity);
      const value = document.createElement('span');
      value.className = `dashboard-recent-value ${primary.tone}`;
      value.textContent = primary.value;

      const chevron = document.createElement('span');
      chevron.className = 'chevron';

      row.append(icon, copy, value, chevron);
      container.append(row);
    });
  }

  function openDashboardHistory() {
    dashboardRole() === 'PRODUKSI'
      ? openProductionHistoryPage()
      : openTransactionHistoryPage();
  }

  function productVariantMeta(item) {
    const name = String(item?.name || '').toUpperCase();
    if (name.includes('TELANG')) return {variant: 'telang', shortName: 'Telang'};
    if (name.includes('ROSELLA')) return {variant: 'rosella', shortName: 'Rosella'};
    if (name.includes('STARTER') || item?.type === 'INTERNAL') return {variant: 'starter', shortName: 'Starter'};
    return {variant: 'original', shortName: name.includes('ORIGINAL') ? 'Original' : item?.name || item?.code};
  }

  function renderDashboardProductStock(data = {}) {
    const container = document.getElementById('dashboardProductStockList');
    if (!container) return;

    const backendProducts = Array.isArray(data.inventory?.products)
      ? data.inventory.products
      : [];

    const products = backendProducts.length
      ? backendProducts
      : (state.initialData?.stock || [])
          .filter((item) => item.type === 'PRODUK' || item.type === 'INTERNAL');

    container.replaceChildren();

    if (!products.length) {
      container.innerHTML = '<div class="dashboard-product-loading">Belum ada produk pada Master Item.</div>';
      return;
    }

    products.slice(0, 6).forEach((item) => {
      const meta = productVariantMeta(item);
      const stock = toNumber(item.stock);
      const unit = item.unit || (item.type === 'INTERNAL' ? 'ml' : 'botol');
      const status = String(item.status || (stock <= 0 ? 'HABIS' : stock <= toNumber(item.minStock) ? 'MENIPIS' : 'AMAN')).toUpperCase();

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `dashboard-product-row variant-${meta.variant}`;
      button.addEventListener('click', () => openStockDetailPage('PRODUK'));

      const icon = document.createElement('span');
      icon.className = `dashboard-product-icon ${meta.variant}`;
      icon.innerHTML = item.type === 'INTERNAL'
        ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c3.5 4.4 6 7.2 6 10.3A6 6 0 0 1 6 13.3C6 10.2 8.5 7.4 12 3Z"/></svg>'
        : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6v4l2 3v10H7V10l2-3V3Z"/></svg>';

      const copy = document.createElement('span');
      copy.className = 'dashboard-product-copy';
      const name = document.createElement('strong');
      name.textContent = meta.shortName;
      const note = document.createElement('span');
      note.textContent = item.type === 'PRODUK'
        ? `Harga ${formatCurrency(item.sellPrice)}`
        : 'Starter untuk Batch F1';
      copy.append(name, note);

      const value = document.createElement('span');
      value.className = 'dashboard-product-value';
      const qty = document.createElement('strong');
      qty.textContent = `${formatQuantity(stock)} ${unit}`;
      const chip = document.createElement('span');
      chip.className = `dashboard-product-status ${status === 'HABIS' ? 'danger' : status === 'MENIPIS' ? 'warning' : 'success'}`;
      chip.textContent = statusTitle(status);
      value.append(qty, chip);

      const chevron = document.createElement('span');
      chevron.className = 'chevron';
      button.append(icon, copy, value, chevron);
      container.append(button);
    });
  }

  function renderDashboardRanking(data) {
    const container = document.getElementById('dashboardRankingList');
    if (!container) return;

    const role = dashboardRole();
    container.replaceChildren();

    if (role === 'PRODUKSI') {
      const inventory = data.inventory || {};
      setText('#dashboardRankingKicker', 'Kontrol persediaan');
      setText('#dashboardRankingTitle', 'Perhatian per kelompok');
      setText('#dashboardRankingCaption', 'Jumlah item menipis atau habis.');

      const groups = [
        {label: 'Bahan produksi', value: toNumber(inventory.materialAttention), group: 'BAHAN'},
        {label: 'Kemasan', value: toNumber(inventory.packagingAttention), group: 'KEMASAN'},
        {label: 'Produk & starter', value: toNumber(inventory.productAttention), group: 'PRODUK'}
      ];
      const max = Math.max(1, ...groups.map((entry) => entry.value));
      groups.forEach((entry, index) => {
        container.append(createDashboardRankingRow(
          index + 1,
          entry.label,
          `${formatQuantity(entry.value)} item`,
          entry.value / max * 100,
          () => openStockDetailPage(entry.group)
        ));
      });
      return;
    }

    setText('#dashboardRankingKicker', 'Penjualan bulan ini');
    setText('#dashboardRankingTitle', 'Produk terlaris');
    setText('#dashboardRankingCaption', 'Peringkat berdasarkan jumlah produk terjual.');

    const products = Array.isArray(data.topProducts) ? data.topProducts : [];
    if (!products.length) {
      container.innerHTML = '<div class="dashboard-data-placeholder">Belum ada penjualan pada bulan ini.</div>';
      return;
    }

    const maxQty = Math.max(1, ...products.map((product) => toNumber(product.qty)));
    products.forEach((product, index) => {
      container.append(createDashboardRankingRow(
        index + 1,
        product.name,
        `${formatQuantity(product.qty)} ${product.unit || 'unit'} · ${formatCurrency(product.revenue)}`,
        toNumber(product.qty) / maxQty * 100,
        openTransactionHistoryPage
      ));
    });
  }

  function createDashboardRankingRow(rank, label, value, percent, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dashboard-ranking-row';
    button.addEventListener('click', onClick);

    const rankElement = document.createElement('span');
    rankElement.className = 'dashboard-ranking-number';
    rankElement.textContent = rank;

    const copy = document.createElement('span');
    copy.className = 'dashboard-ranking-copy';
    const title = document.createElement('strong');
    title.textContent = label;
    const track = document.createElement('span');
    track.className = 'dashboard-ranking-track';
    const fill = document.createElement('i');
    fill.style.width = `${Math.max(2, Math.min(100, percent))}%`;
    track.append(fill);
    copy.append(title, track);

    const valueElement = document.createElement('span');
    valueElement.className = 'dashboard-ranking-value';
    valueElement.textContent = value;

    button.append(rankElement, copy, valueElement);
    return button;
  }

  function renderDashboardVariants(data) {
    const container = document.getElementById('dashboardVariantList');
    if (!container) return;

    const role = dashboardRole();
    container.replaceChildren();

    if (role === 'KASIR') {
      setText('#dashboardVariantKicker', 'Ketersediaan produk');
      setText('#dashboardVariantTitle', 'Stok per produk');
      setText('#dashboardVariantCaption', 'Perbandingan jumlah produk siap jual.');

      const products = Array.isArray(data.inventory?.products)
        ? data.inventory.products.filter((item) => item.type === 'PRODUK')
        : [];
      renderVariantRows(
        container,
        products.map((item) => ({
          label: productVariantMeta(item).shortName,
          value: toNumber(item.stock),
          unit: item.unit || 'botol',
          variant: productVariantMeta(item).variant
        })),
        () => openStockDetailPage('PRODUK')
      );
      return;
    }

    setText('#dashboardVariantKicker', 'Produksi bulan ini');
    setText('#dashboardVariantTitle', 'Hasil per varian');
    setText('#dashboardVariantCaption', 'Jumlah hasil bottling pada bulan berjalan.');

    const variants = Array.isArray(data.productionByVariant) ? data.productionByVariant : [];
    renderVariantRows(
      container,
      variants.map((entry) => ({
        label: recipeVariantLabel(entry.variant),
        value: toNumber(entry.output),
        unit: entry.unit || 'unit',
        variant: String(entry.variant || '').toLowerCase()
      })),
      openProductionHistoryPage
    );
  }

  function renderVariantRows(container, rows, onClick) {
    const meaningful = rows.filter((row) => row.label);
    if (!meaningful.length) {
      container.innerHTML = '<div class="dashboard-data-placeholder">Belum ada data untuk ditampilkan.</div>';
      return;
    }

    const max = Math.max(1, ...meaningful.map((row) => row.value));
    meaningful.forEach((row) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `dashboard-variant-row variant-${row.variant || 'original'}`;
      button.addEventListener('click', onClick);

      const dot = document.createElement('span');
      dot.className = 'dashboard-variant-dot';

      const copy = document.createElement('span');
      copy.className = 'dashboard-variant-copy';
      const title = document.createElement('strong');
      title.textContent = row.label;
      const track = document.createElement('span');
      track.className = 'dashboard-variant-track';
      const fill = document.createElement('i');
      fill.style.width = `${Math.max(2, row.value / max * 100)}%`;
      track.append(fill);
      copy.append(title, track);

      const value = document.createElement('span');
      value.className = 'dashboard-variant-value';
      value.textContent = `${formatQuantity(row.value)} ${row.unit}`;

      button.append(dot, copy, value);
      container.append(button);
    });
  }

  function renderBatchLists() {
    const active = state.batches
      .filter((batch) => {
        const status = String(batch['Status Batch'] || '').toUpperCase();
        return status && status !== 'HABIS';
      })
      .sort((a, b) => parseAnyDate(b['Tanggal F1']) - parseAnyDate(a['Tanggal F1']));

    renderBatchGrid(document.getElementById('dashboardBatchGrid'), active.slice(0, 3));
    renderBatchGrid(document.getElementById('productionBatchGrid'), active.slice(0, 3));
  }

  function renderBatchGrid(container, batches) {
    if (!container) return;
    container.replaceChildren();

    if (!batches.length) {
      const empty = document.createElement('div');
      empty.className = 'card empty-state';
      empty.innerHTML = '<div class="empty-state-icon">✓</div><h3>Belum ada batch aktif</h3><p>Buat Batch F1 untuk memulai alur produksi.</p>';
      container.append(empty);
      return;
    }

    batches.forEach((batch) => container.append(createBatchCard(batch)));
  }

  function createBatchCard(batch) {
    const day = Math.max(0, Math.round(toNumber(batch['Hari Ke'])));
    const status = String(batch['Status Batch'] || batch['Status Umur'] || 'FERMENTASI');
    const progress = Math.min(100, Math.max(4, (day / 14) * 100));
    const ph = batch['pH Akhir'] || batch['pH Awal'] || '-';
    const brix = batch['Brix Akhir'] || batch['Brix Awal'] || '-';

    const card = document.createElement('article');
    card.className = 'card batch-card batch-card-action';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Pantau ${batch['Batch ID'] || 'batch'}`);
    const openSelected = () => openFermentationSheet(batch['Batch ID']);
    card.addEventListener('click', openSelected);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSelected();
      }
    });

    const header = document.createElement('div');
    header.className = 'batch-card-header';
    const copy = document.createElement('div');
    const id = document.createElement('p');
    id.className = 'batch-id';
    id.textContent = batch['Batch ID'] || 'Batch';
    const date = document.createElement('span');
    date.className = 'batch-date';
    date.textContent = `${formatDate(batch['Tanggal F1'])} · ${formatQuantity(batch['Volume Batch (L)'])} liter`;
    copy.append(id, date);

    const chip = document.createElement('span');
    chip.className = `status-chip ${batchTone(status, day)}`;
    chip.textContent = day ? `Hari ke-${day}` : status;
    header.append(copy, chip);

    const bar = document.createElement('div');
    bar.className = 'batch-progress';
    const fill = document.createElement('span');
    fill.style.width = `${progress}%`;
    bar.append(fill);

    const meta = document.createElement('div');
    meta.className = 'batch-meta';
    meta.append(
      batchMeta('pH', formatQuantity(ph)),
      batchMeta('Brix', formatQuantity(brix)),
      batchMeta('Status', statusTitle(status))
    );

    card.append(header, bar, meta);
    return card;
  }

  function batchMeta(label, value) {
    const item = document.createElement('div');
    item.className = 'batch-meta-item';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = value;
    item.append(span, strong);
    return item;
  }

  function getMonitorableBatches() {
    return state.batches.filter((batch) => {
      const status = String(batch['Status Batch'] || '').toUpperCase();
      return status === 'FERMENTASI' || status === 'SIAP CEK';
    }).sort((a, b) => parseAnyDate(b['Tanggal F1']) - parseAnyDate(a['Tanggal F1']));
  }

  function populateFermentationBatchOptions(preferredId = '') {
    const select = document.getElementById('fermentationBatchSelect');
    if (!select) return;
    const batches = getMonitorableBatches();
    const selected = preferredId || state.selectedFermentationBatchId || select.value;
    select.replaceChildren();
    if (!batches.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Belum ada batch aktif';
      select.append(option);
      select.disabled = true;
      state.selectedFermentationBatchId = '';
      return;
    }
    select.disabled = false;
    batches.forEach((batch) => {
      const option = document.createElement('option');
      option.value = batch['Batch ID'];
      option.textContent = `${batch['Batch ID']} · Hari ke-${Math.round(toNumber(batch['Hari Ke']))} · ${formatQuantity(batch['Volume Batch (L)'])} L`;
      select.append(option);
    });
    select.value = batches.some((batch) => batch['Batch ID'] === selected) ? selected : batches[0]['Batch ID'];
    state.selectedFermentationBatchId = select.value;
  }

  function populateFinishBatchOptions(preferredId = '') {
    const select = document.getElementById('finishBatchSelect');
    if (!select) return;
    const batches = getMonitorableBatches();
    const selected = preferredId || state.selectedFinishBatchId || select.value;
    select.replaceChildren();
    if (!batches.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Belum ada batch yang dapat diselesaikan';
      select.append(option);
      select.disabled = true;
      state.selectedFinishBatchId = '';
      return;
    }
    select.disabled = false;
    batches.forEach((batch) => {
      const option = document.createElement('option');
      option.value = batch['Batch ID'];
      option.textContent = `${batch['Batch ID']} · Hari ke-${Math.round(toNumber(batch['Hari Ke']))} · ${formatQuantity(batch['Volume Batch (L)'])} L`;
      select.append(option);
    });
    select.value = batches.some((batch) => batch['Batch ID'] === selected) ? selected : batches[0]['Batch ID'];
    state.selectedFinishBatchId = select.value;
  }

  function getBatchById(batchId) {
    return state.batches.find((batch) => String(batch['Batch ID']) === String(batchId)) || null;
  }

  function openSheet(sheetId, backdropId) {
    closeAllSheets(true);
    const sheet = document.getElementById(sheetId);
    const backdrop = document.getElementById(backdropId);
    if (sheet) sheet.inert = false;
    if (backdrop) backdrop.inert = false;
    sheet?.classList.add('is-open');
    backdrop?.classList.add('is-open');
    sheet?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sheet-is-open');
  }

  function closeSheet(sheetId, backdropId) {
    const sheet = document.getElementById(sheetId);
    const backdrop = document.getElementById(backdropId);
    sheet?.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    sheet?.setAttribute('aria-hidden', 'true');
    if (sheet) sheet.inert = true;
    if (backdrop) backdrop.inert = true;
  }

  function closeAllSheets(force = false) {
    if (!force && (state.batchSubmitting || state.fermentationSubmitting || state.finishSubmitting || state.bottlingSubmitting || state.openingStockSubmitting || state.purchaseSubmitting || state.saleSubmitting || state.expenseSubmitting || state.stockUsageSubmitting || state.stockOpnameSubmitting || state.masterItemSubmitting || state.appSettingsSaving || state.appUserSubmitting || state.masterRecipeSubmitting)) return;
    closeSheet('batchFormSheet', 'batchSheetBackdrop');
    closeSheet('fermentationSheet', 'fermentationSheetBackdrop');
    closeSheet('finishSheet', 'finishSheetBackdrop');
    closeSheet('bottlingSheet', 'bottlingSheetBackdrop');
    closeSheet('productionHistoryDetailSheet', 'productionHistoryDetailBackdrop');
    closeSheet('openingStockSheet', 'openingStockSheetBackdrop');
    closeSheet('purchaseSheet', 'purchaseSheetBackdrop');
    closeSheet('saleSheet', 'saleSheetBackdrop');
    closeSheet('expenseSheet', 'expenseSheetBackdrop');
    closeSheet('stockUsageSheet', 'stockUsageSheetBackdrop');
    closeSheet('stockOpnameSheet', 'stockOpnameSheetBackdrop');
    closeSheet('transactionHistoryDetailSheet', 'transactionHistoryDetailBackdrop');
    closeSheet('transactionVoidSheet', 'transactionVoidBackdrop');
    closeSheet('stockItemDetailSheet', 'stockItemDetailBackdrop');
    closeSheet('masterItemSheet', 'masterItemSheetBackdrop');
    closeSheet('appUserSheet', 'appUserSheetBackdrop');
    closeSheet('masterRecipeSheet', 'masterRecipeSheetBackdrop');
    closeSheet('activityLauncherSheet', 'activityLauncherBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function openFermentationSheet(batchId = '') {
    if (!state.batches.length) {
      showToast('Belum ada batch aktif untuk dipantau.', 'warning');
      return;
    }
    populateFermentationBatchOptions(batchId);
    const select = document.getElementById('fermentationBatchSelect');
    if (!select || !select.value) {
      showToast('Belum ada batch aktif untuk dipantau.', 'warning');
      return;
    }
    const form = document.getElementById('fermentationForm');
    form?.reset();
    populateFermentationBatchOptions(batchId || select.value);
    document.getElementById('fermentationDate').value = localDateInputValue(new Date());
    document.getElementById('fermentationFormError').textContent = '';
    renderFermentationSelection();
    openSheet('fermentationSheet', 'fermentationSheetBackdrop');
  }

  function closeFermentationSheet(force = false) {
    if (state.fermentationSubmitting && !force) return;
    closeSheet('fermentationSheet', 'fermentationSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function handleFermentationBatchChange(event) {
    state.selectedFermentationBatchId = event.currentTarget.value;
    renderFermentationSelection();
  }

  function renderFermentationSelection() {
    const select = document.getElementById('fermentationBatchSelect');
    const batch = getBatchById(select?.value);
    const summary = document.getElementById('fermentationBatchSummary');
    const dayField = document.getElementById('fermentationDay');
    if (!batch || !summary) return;
    state.selectedFermentationBatchId = batch['Batch ID'];
    const checkDate = parseAnyDate(document.getElementById('fermentationDate')?.value || new Date());
    const start = parseAnyDate(batch['Tanggal F1']);
    const day = Math.max(0, Math.floor((dateOnlyTime(checkDate) - dateOnlyTime(start)) / 86400000));
    dayField.value = `Hari ke-${day}`;
    summary.innerHTML = workflowSummaryHtml(batch, day);
    renderFermentationTimeline(batch);
  }

  function renderFermentationTimeline(batch) {
    const container = document.getElementById('fermentationTimeline');
    const count = document.getElementById('fermentationLogCount');
    if (!container || !count) return;
    const logs = parseFermentationLogs(batch['Log Fermentasi JSON']);
    count.textContent = `${logs.length} catatan`;
    container.replaceChildren();
    if (!logs.length) {
      container.innerHTML = '<p class="recipe-empty">Belum ada riwayat pengecekan.</p>';
      return;
    }
    logs.slice().reverse().forEach((log) => {
      const item = document.createElement('article');
      item.className = 'timeline-item';
      const marker = document.createElement('span');
      marker.className = `timeline-marker ${String(log.stage).toUpperCase() === 'AKHIR' ? 'is-finish' : ''}`;
      const body = document.createElement('div');
      body.className = 'timeline-body';
      const head = document.createElement('div');
      head.className = 'timeline-head';
      const title = document.createElement('strong');
      title.textContent = String(log.stage).toUpperCase() === 'AKHIR' ? 'F1 diselesaikan' : `Pengecekan hari ke-${log.day ?? '-'}`;
      const date = document.createElement('span');
      date.textContent = formatDate(log.date);
      head.append(title, date);
      const metrics = document.createElement('p');
      const details = [];
      if (log.ph !== '' && log.ph !== undefined) details.push(`pH ${formatQuantity(log.ph)}`);
      if (log.brix !== '' && log.brix !== undefined) details.push(`Brix ${formatQuantity(log.brix)}`);
      if (log.aroma) details.push(`Aroma ${log.aroma}`);
      if (log.taste) details.push(`Rasa ${log.taste}`);
      metrics.textContent = details.join(' · ') || 'Pengecekan kondisi batch';
      body.append(head, metrics);
      if (log.note) {
        const note = document.createElement('small');
        note.textContent = log.note;
        body.append(note);
      }
      item.append(marker, body);
      container.append(item);
    });
  }

  async function handleFermentationSubmit(event) {
    event.preventDefault();
    if (state.fermentationSubmitting) return;
    const form = event.currentTarget;
    const error = document.getElementById('fermentationFormError');
    const button = document.getElementById('submitFermentationButton');
    error.textContent = '';
    if (!form.batchId.value || !form.date.value) {
      error.textContent = 'Batch dan tanggal pengecekan wajib diisi.';
      shakeElement(form);
      return;
    }
    const payload = {
      batchId: form.batchId.value, stage: 'CHECK', date: form.date.value,
      ph: form.ph.value === '' ? '' : toNumber(form.ph.value),
      brix: form.brix.value === '' ? '' : toNumber(form.brix.value),
      aroma: form.aroma.value, taste: form.taste.value,
      scoby: form.scoby.value, liquid: form.liquid.value,
      note: form.note.value.trim()
    };
    if (payload.ph === '' && payload.brix === '' && !payload.aroma && !payload.taste && !payload.scoby && !payload.liquid && !payload.note) {
      error.textContent = 'Isi minimal satu hasil pengecekan.';
      shakeElement(form);
      return;
    }
    state.fermentationSubmitting = true;
    setButtonLoading(button, true, 'Menyimpan pengecekan...');
    try {
      const result = await window.MeramuAPI.request('updateFermentation', payload, {token:state.session.token,timeout:45000});
      closeFermentationSheet(true);
      showToast(`${result.batchId} · pengecekan hari ke-${result.day} tersimpan.`, 'success');
      await refreshAppData({showToastOnError:false});
    } catch (err) {
      error.textContent = err.message || 'Pengecekan gagal disimpan.';
      shakeElement(form);
    } finally {
      state.fermentationSubmitting = false;
      setButtonLoading(button, false, 'Simpan Pengecekan');
    }
  }

  function openFinishSheet(batchId = '') {
    populateFinishBatchOptions(batchId);
    const select = document.getElementById('finishBatchSelect');
    if (!select || !select.value) {
      showToast('Belum ada batch yang dapat diselesaikan.', 'warning');
      return;
    }
    const form = document.getElementById('finishForm');
    form?.reset();
    populateFinishBatchOptions(batchId || select.value);
    document.getElementById('finishDate').value = localDateInputValue(new Date());
    document.getElementById('finishShrink').value = '0';
    document.getElementById('finishFormError').textContent = '';
    renderFinishSelection();
    openSheet('finishSheet', 'finishSheetBackdrop');
  }

  function closeFinishSheet(force = false) {
    if (state.finishSubmitting && !force) return;
    closeSheet('finishSheet', 'finishSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function handleFinishBatchChange(event) {
    state.selectedFinishBatchId = event.currentTarget.value;
    renderFinishSelection();
  }

  function renderFinishSelection() {
    const batch = getBatchById(document.getElementById('finishBatchSelect')?.value);
    const summary = document.getElementById('finishBatchSummary');
    if (!batch || !summary) return;
    state.selectedFinishBatchId = batch['Batch ID'];
    summary.innerHTML = workflowSummaryHtml(batch, Math.round(toNumber(batch['Hari Ke'])));
    document.getElementById('finishPh').value = batch['pH Akhir'] || batch['pH Awal'] || '';
    document.getElementById('finishBrix').value = batch['Brix Akhir'] || batch['Brix Awal'] || '';
    renderFinishVolume();
  }

  function renderFinishVolume() {
    const batch = getBatchById(document.getElementById('finishBatchSelect')?.value);
    if (!batch) return;
    const initial = toNumber(batch['Volume Batch (L)']);
    const shrink = Math.max(0, toNumber(document.getElementById('finishShrink')?.value));
    const net = Math.max(0, initial - shrink);
    document.getElementById('finishInitialVolume').textContent = `${formatQuantity(initial)} L`;
    document.getElementById('finishNetVolume').textContent = `${formatQuantity(net)} L`;
  }

  async function handleFinishSubmit(event) {
    event.preventDefault();
    if (state.finishSubmitting) return;
    const form = event.currentTarget;
    const error = document.getElementById('finishFormError');
    const button = document.getElementById('submitFinishButton');
    const batch = getBatchById(form.batchId.value);
    error.textContent = '';
    if (!batch || !form.date.value || form.ph.value === '' || form.brix.value === '') {
      error.textContent = 'Batch, tanggal, pH akhir, dan Brix akhir wajib diisi.';
      shakeElement(form);
      return;
    }
    const shrink = toNumber(form.shrink.value);
    const volume = toNumber(batch['Volume Batch (L)']);
    if (shrink < 0 || shrink > volume) {
      error.textContent = `Susut harus antara 0 dan ${formatQuantity(volume)} liter.`;
      shakeElement(form);
      return;
    }
    const payload = {
      batchId: form.batchId.value, date: form.date.value,
      ph: toNumber(form.ph.value), brix: toNumber(form.brix.value), shrink,
      aroma: form.aroma.value, taste: form.taste.value,
      note: form.note.value.trim()
    };
    state.finishSubmitting = true;
    setButtonLoading(button, true, 'Menyelesaikan F1...');
    try {
      const result = await window.MeramuAPI.request('finishBatch', payload, {token:state.session.token,timeout:45000});
      closeFinishSheet(true);
      const cancelled = toNumber(result.cancelledReminders);
      showToast(`${result.batchId} selesai. ${cancelled} pengingat mendatang dibatalkan.`, 'success');
      await refreshAppData({showToastOnError:false});
    } catch (err) {
      error.textContent = err.message || 'Batch gagal diselesaikan.';
      shakeElement(form);
    } finally {
      state.finishSubmitting = false;
      setButtonLoading(button, false, 'Selesaikan F1');
    }
  }

  function workflowSummaryHtml(batch, day) {
    const ph = batch['pH Akhir'] || batch['pH Awal'] || '-';
    const brix = batch['Brix Akhir'] || batch['Brix Awal'] || '-';
    return `<div class="workflow-summary-title"><strong>${escapeHtml(batch['Batch ID'])}</strong><span class="status-chip ${batchTone(batch['Status Batch'], day)}">Hari ke-${day}</span></div><div class="workflow-summary-grid"><div><span>Volume</span><strong>${formatQuantity(batch['Volume Batch (L)'])} L</strong></div><div><span>pH terbaru</span><strong>${formatQuantity(ph)}</strong></div><div><span>Brix terbaru</span><strong>${formatQuantity(brix)}</strong></div></div>`;
  }

  function parseFermentationLogs(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(String(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function dateOnlyTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  const bottlingVariantMeta = {
    ORIGINAL: {title:'Bottling Original', kicker:'Produksi F2', description:'Kemas F1 menjadi Kombucha Original.', tone:'original'},
    TELANG: {title:'Bottling Telang', kicker:'Produksi F2', description:'Kemas F1 dengan ekstrak bunga telang.', tone:'telang'},
    ROSELLA: {title:'Bottling Rosella', kicker:'Produksi F2', description:'Kemas F1 dengan ekstrak rosella.', tone:'rosella'},
    STARTER: {title:'Simpan Starter', kicker:'Sirkulasi Starter', description:'Simpan sebagian F1 untuk batch berikutnya.', tone:'starter'}
  };

  function getReadyBatches() {
    return state.batches.filter((batch) => {
      const status = String(batch['Status Batch'] || '').toUpperCase();
      return status === 'SIAP BOTTLING' && toNumber(batch['Sisa Volume (L)']) > 0;
    }).sort((a, b) => parseAnyDate(b['Tanggal Selesai F1']) - parseAnyDate(a['Tanggal Selesai F1']));
  }

  function populateBottlingBatchOptions(preferredId = '') {
    const select = document.getElementById('bottlingBatchSelect');
    if (!select) return;
    const batches = getReadyBatches();
    const selected = preferredId || state.selectedBottlingBatchId || select.value;
    select.replaceChildren();
    if (!batches.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Belum ada batch siap bottling';
      select.append(option);
      select.disabled = true;
      state.selectedBottlingBatchId = '';
      return;
    }
    select.disabled = false;
    batches.forEach((batch) => {
      const option = document.createElement('option');
      option.value = batch['Batch ID'];
      option.textContent = `${batch['Batch ID']} · sisa ${formatQuantity(batch['Sisa Volume (L)'])} L`;
      select.append(option);
    });
    select.value = batches.some((batch) => batch['Batch ID'] === selected) ? selected : batches[0]['Batch ID'];
    state.selectedBottlingBatchId = select.value;
  }

  function openBottlingSheet(variant = 'ORIGINAL', batchId = '') {
    const normalized = normalizeBottlingVariant(variant);
    const ready = getReadyBatches();
    if (!ready.length) {
      showToast('Belum ada batch berstatus Siap Bottling.', 'warning');
      return;
    }

    state.selectedBottlingVariant = normalized;
    const form = document.getElementById('bottlingForm');
    form?.reset();
    document.getElementById('bottlingVariant').value = normalized;
    document.getElementById('bottlingDate').value = localDateInputValue(new Date());
    document.getElementById('bottlingVolume').value = '1';
    document.getElementById('bottlingFormError').textContent = '';
    populateBottlingBatchOptions(batchId);
    applyBottlingVariantUi(normalized);
    renderBottlingPreview();
    openSheet('bottlingSheet', 'bottlingSheetBackdrop');
    window.setTimeout(() => document.getElementById('bottlingVolume')?.focus(), 260);
  }

  function closeBottlingSheet(force = false) {
    if (state.bottlingSubmitting && !force) return;
    closeSheet('bottlingSheet', 'bottlingSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function normalizeBottlingVariant(value) {
    const normalized = String(value || '').toUpperCase();
    return bottlingVariantMeta[normalized] ? normalized : 'ORIGINAL';
  }

  function applyBottlingVariantUi(variant) {
    const meta = bottlingVariantMeta[variant];
    const sheet = document.getElementById('bottlingSheet');
    document.getElementById('bottlingSheetTitle').textContent = meta.title;
    document.getElementById('bottlingSheetKicker').textContent = meta.kicker;
    document.getElementById('bottlingSheetDescription').textContent = meta.description;
    document.getElementById('submitBottlingButton').textContent = variant === 'STARTER' ? 'Simpan Starter' : `Simpan ${meta.title}`;
    document.getElementById('bottlingOutputLabel').textContent = variant === 'STARTER' ? 'Starter masuk' : 'Hasil produk';
    document.getElementById('bottlingExpiryBox').hidden = variant === 'STARTER';
    document.getElementById('bottlingSugarField').hidden = variant === 'STARTER';
    sheet.dataset.variant = variant;
  }

  function handleBottlingBatchChange(event) {
    state.selectedBottlingBatchId = event.currentTarget.value;
    renderBottlingPreview();
  }

  function getBottlingRecipes(variant) {
    return (state.initialData?.recipes || []).filter((recipe) =>
      recipe.active !== false &&
      String(recipe.process).toUpperCase() === 'BOTTLING' &&
      (String(recipe.variant).toUpperCase() === variant || String(recipe.variant).toUpperCase() === 'SEMUA')
    );
  }

  function calculateBottlingRecipeQty(recipe, volume, outputQty, actualSugar) {
    if (String(recipe.code).toUpperCase() === 'BB003' && actualSugar !== '') return actualSugar;
    return String(recipe.basis).toUpperCase() === 'PER_BOTOL'
      ? toNumber(recipe.qty) * outputQty
      : toNumber(recipe.qty) * volume;
  }

  function renderBottlingPreview() {
    const variant = normalizeBottlingVariant(document.getElementById('bottlingVariant')?.value || state.selectedBottlingVariant);
    const batch = getBatchById(document.getElementById('bottlingBatchSelect')?.value);
    const volume = toNumber(document.getElementById('bottlingVolume')?.value);
    const actualSugarInput = document.getElementById('bottlingActualSugar');
    const actualSugar = actualSugarInput?.value === '' ? '' : toNumber(actualSugarInput?.value);
    const recipes = getBottlingRecipes(variant);
    const inputs = recipes.filter((recipe) => String(recipe.direction).toUpperCase() === 'KELUAR');
    const outputs = recipes.filter((recipe) => String(recipe.direction).toUpperCase() === 'MASUK');
    const list = document.getElementById('bottlingRecipePreview');
    const status = document.getElementById('bottlingStockStatus');
    if (!list || !status) return;

    list.replaceChildren();
    if (!batch || volume <= 0) {
      list.innerHTML = '<p class="recipe-empty">Pilih batch dan masukkan volume.</p>';
      setBottlingStatus('neutral', 'Stok dan sisa batch akan diperiksa otomatis.');
      updateBottlingOutputs(variant, 0, 0, 0, '');
      return;
    }

    state.selectedBottlingBatchId = batch['Batch ID'];
    const remaining = toNumber(batch['Sisa Volume (L)']);
    const bottlesPerLiter = toNumber(state.initialData?.settings?.BOTTLES_PER_LITER) || 4;
    const outputQty = variant === 'STARTER' ? volume * 1000 : volume * bottlesPerLiter;
    const baseCost = volume * toNumber(batch['HPP F1/Liter']);
    let extraCost = 0;
    let shortages = 0;

    if (variant !== 'STARTER' && actualSugarInput && actualSugarInput.value === '') {
      const sugarRecipe = inputs.find((recipe) => String(recipe.code).toUpperCase() === 'BB003');
      if (sugarRecipe) actualSugarInput.placeholder = `${formatQuantity(toNumber(sugarRecipe.qty) * volume)} gram standar`;
    }

    inputs.forEach((recipe) => {
      const code = String(recipe.code).toUpperCase();
      const item = state.itemMap.get(code) || {};
      const stockItem = state.stockMap.get(code) || item;
      const qty = calculateBottlingRecipeQty(recipe, volume, outputQty, actualSugar);
      const available = toNumber(stockItem.stock);
      const enough = available >= qty;
      if (!enough) shortages += 1;
      extraCost += qty * toNumber(item.averageCost || stockItem.averageCost);

      const row = document.createElement('div');
      row.className = `recipe-row${enough ? '' : ' is-short'}`;
      const copy = document.createElement('div');
      copy.className = 'recipe-row-copy';
      const name = document.createElement('strong');
      name.textContent = item.name || stockItem.name || code;
      const detail = document.createElement('span');
      detail.textContent = `${code} · stok ${formatQuantity(available)} ${recipe.unit || item.unit || ''}`;
      copy.append(name, detail);
      const value = document.createElement('div');
      value.className = 'recipe-row-value';
      const required = document.createElement('strong');
      required.textContent = `${formatQuantity(qty)} ${recipe.unit || item.unit || ''}`;
      const stateText = document.createElement('span');
      stateText.textContent = enough ? 'CUKUP' : `KURANG ${formatQuantity(qty - available)}`;
      value.append(required, stateText);
      row.append(copy, value);
      list.append(row);
    });

    if (!inputs.length) {
      list.innerHTML = '<p class="recipe-empty">Tidak ada bahan tambahan untuk proses ini.</p>';
    }

    const totalCost = baseCost + extraCost;
    const unitCost = outputQty > 0 ? totalCost / outputQty : 0;
    const outputRecipe = outputs[0];
    const outputItem = outputRecipe ? state.itemMap.get(String(outputRecipe.code).toUpperCase()) : null;
    const expDate = variant === 'STARTER' ? '' : calculateExpiryDate(document.getElementById('bottlingDate')?.value);
    updateBottlingOutputs(variant, outputQty, totalCost, unitCost, expDate, outputItem?.name);

    document.getElementById('bottlingBatchSummary').innerHTML = bottlingBatchSummaryHtml(batch, remaining, volume);

    if (volume > remaining + 0.000001) {
      setBottlingStatus('danger', `Volume melebihi sisa batch ${formatQuantity(remaining)} liter.`);
    } else if (shortages > 0) {
      setBottlingStatus('danger', `${shortages} bahan atau kemasan belum mencukupi.`);
    } else {
      setBottlingStatus('success', `Siap diproses. Sisa batch setelah transaksi: ${formatQuantity(Math.max(0, remaining - volume))} liter.`);
    }
  }

  function bottlingBatchSummaryHtml(batch, remaining, used) {
    const after = Math.max(0, remaining - used);
    return `<div class="workflow-summary-title"><strong>${escapeHtml(batch['Batch ID'])}</strong><span class="status-chip success">Siap Bottling</span></div><div class="workflow-summary-grid"><div><span>Sisa tersedia</span><strong>${formatQuantity(remaining)} L</strong></div><div><span>HPP F1/liter</span><strong>${formatCurrency(batch['HPP F1/Liter'])}</strong></div><div><span>Sisa setelah proses</span><strong>${formatQuantity(after)} L</strong></div></div>`;
  }

  function updateBottlingOutputs(variant, outputQty, totalCost, unitCost, expiry, outputName = '') {
    document.getElementById('bottlingOutputQty').textContent = variant === 'STARTER'
      ? `${formatQuantity(outputQty)} ml`
      : `${formatQuantity(outputQty)} botol`;
    document.getElementById('bottlingEstimatedCost').textContent = formatCurrency(totalCost);
    document.getElementById('bottlingUnitCost').textContent = formatCurrency(unitCost);
    document.getElementById('bottlingExpiry').textContent = expiry || '-';
    const label = document.getElementById('bottlingOutputLabel');
    if (label && outputName) label.textContent = outputName;
  }

  function setBottlingStatus(type, message) {
    const element = document.getElementById('bottlingStockStatus');
    if (!element) return;
    element.dataset.status = type;
    element.textContent = message;
  }

  function calculateExpiryDate(value) {
    if (!value) return '';
    const date = parseAnyDate(value);
    const days = toNumber(state.initialData?.settings?.EXP_DAYS) || 25;
    date.setDate(date.getDate() + days);
    return formatDate(date);
  }

  function canCreateBottling() {
    const variant = normalizeBottlingVariant(document.getElementById('bottlingVariant')?.value);
    const batch = getBatchById(document.getElementById('bottlingBatchSelect')?.value);
    const volume = toNumber(document.getElementById('bottlingVolume')?.value);
    if (!batch || volume <= 0 || volume > toNumber(batch['Sisa Volume (L)']) + 0.000001) return false;
    const bottlesPerLiter = toNumber(state.initialData?.settings?.BOTTLES_PER_LITER) || 4;
    const outputQty = variant === 'STARTER' ? volume * 1000 : volume * bottlesPerLiter;
    const actualSugarField = document.getElementById('bottlingActualSugar');
    const actualSugar = actualSugarField?.value === '' ? '' : toNumber(actualSugarField?.value);
    return getBottlingRecipes(variant)
      .filter((recipe) => String(recipe.direction).toUpperCase() === 'KELUAR')
      .every((recipe) => {
        const stock = state.stockMap.get(String(recipe.code).toUpperCase());
        const qty = calculateBottlingRecipeQty(recipe, volume, outputQty, actualSugar);
        return toNumber(stock?.stock) >= qty;
      });
  }

  async function handleBottlingSubmit(event) {
    event.preventDefault();
    if (state.bottlingSubmitting) return;
    const form = event.currentTarget;
    const error = document.getElementById('bottlingFormError');
    const button = document.getElementById('submitBottlingButton');
    const variant = normalizeBottlingVariant(form.variant.value);
    error.textContent = '';

    if (!form.batchId.value || !form.date.value || toNumber(form.volume.value) <= 0) {
      error.textContent = 'Batch, tanggal, dan volume wajib diisi.';
      shakeElement(form);
      return;
    }
    if (!canCreateBottling()) {
      error.textContent = 'Sisa batch atau stok bahan belum mencukupi.';
      shakeElement(document.getElementById('bottlingRecipePreview'));
      return;
    }

    const payload = {
      batchId: form.batchId.value,
      date: form.date.value,
      variant,
      volume: toNumber(form.volume.value),
      actualSugar: variant === 'STARTER' || form.actualSugar.value === '' ? '' : toNumber(form.actualSugar.value),
      note: form.note.value.trim()
    };

    state.bottlingSubmitting = true;
    setButtonLoading(button, true, variant === 'STARTER' ? 'Menyimpan starter...' : 'Menyimpan bottling...');
    try {
      const result = await window.MeramuAPI.request('createBottling', payload, {token:state.session.token,timeout:45000});
      closeBottlingSheet(true);
      const resultText = variant === 'STARTER'
        ? `${formatQuantity(result.outputQty)} ml starter masuk ke stok.`
        : `${formatQuantity(result.outputQty)} botol ${variantTitle(variant)} masuk ke stok.`;
      showToast(`${result.bottlingId} berhasil. ${resultText}`, 'success');
      await refreshAppData({showToastOnError:false});
      navigate('produksi');
    } catch (err) {
      error.textContent = err.message || 'Proses bottling gagal disimpan.';
      shakeElement(form);
    } finally {
      state.bottlingSubmitting = false;
      const label = variant === 'STARTER' ? 'Simpan Starter' : `Simpan Bottling ${variantTitle(variant)}`;
      setButtonLoading(button, false, label);
    }
  }

  function variantTitle(variant) {
    return String(variant || '').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function renderBottlingHistory() {
    const container = document.getElementById('productionBottlingGrid');
    if (!container) return;
    container.replaceChildren();
    const rows = state.bottlings
      .slice()
      .sort((a, b) => parseAnyDate(b.Timestamp || b.Tanggal) - parseAnyDate(a.Timestamp || a.Tanggal))
      .slice(0, 3);
    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'card empty-state';
      empty.innerHTML = '<div class="empty-state-icon">✓</div><h3>Belum ada bottling</h3><p>Selesaikan F1 lalu proses produk atau starter.</p>';
      container.append(empty);
      return;
    }
    rows.forEach((row) => container.append(createBottlingHistoryCard(row)));
  }

  function createBottlingHistoryCard(row) {
    const variant = normalizeBottlingVariant(row.Varian);
    const card = document.createElement('article');
    card.className = `card bottling-history-card bottling-history-action variant-${variant.toLowerCase()}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Lihat detail ${row['Bottling ID'] || 'bottling'}`);
    const openDetail = () => openProductionHistoryDetail({
      type: variant === 'STARTER' ? 'starter' : 'bottling',
      tab: variant === 'STARTER' ? 'starter' : 'bottling',
      id: row['Bottling ID'] || '',
      batchId: row['Batch ID'] || '',
      date: parseAnyDate(row.Timestamp || row.Tanggal),
      title: variant === 'STARTER' ? 'Starter disimpan' : `Bottling ${variantTitle(variant)}`,
      subtitle: `${row['Bottling ID'] || ''} · ${row['Batch ID'] || ''}`,
      metric: `${formatQuantity(row.Hasil)} ${row['Satuan Hasil'] || (variant === 'STARTER' ? 'ml' : 'botol')}`,
      status: variant,
      filterKey: variant,
      searchText: '',
      raw: row
    });
    card.addEventListener('click', openDetail);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetail();
      }
    });
    const icon = document.createElement('div');
    icon.className = 'bottling-history-icon';
    icon.textContent = variant === 'STARTER' ? '◉' : '♧';
    const copy = document.createElement('div');
    copy.className = 'bottling-history-copy';
    const title = document.createElement('strong');
    title.textContent = variant === 'STARTER' ? 'Starter disimpan' : `Kombucha ${variantTitle(variant)}`;
    const meta = document.createElement('span');
    meta.textContent = `${row['Bottling ID']} · ${formatDate(row.Tanggal)} · ${row['Batch ID']}`;
    copy.append(title, meta);
    const value = document.createElement('div');
    value.className = 'bottling-history-value';
    const qty = document.createElement('strong');
    qty.textContent = `${formatQuantity(row.Hasil)} ${row['Satuan Hasil'] || (variant === 'STARTER' ? 'ml' : 'botol')}`;
    const hpp = document.createElement('span');
    hpp.textContent = `HPP ${formatCurrency(row['HPP per Hasil'])}`;
    value.append(qty, hpp);
    card.append(icon, copy, value);
    return card;
  }

  function openProductionHistoryPage() {
    state.productionHistoryTab = 'semua';
    navigate('riwayat-produksi');
    renderProductionHistory();
  }

  function resetProductionHistoryFilters() {
    const search = document.getElementById('productionHistorySearch');
    const start = document.getElementById('productionHistoryStartDate');
    const end = document.getElementById('productionHistoryEndDate');
    const status = document.getElementById('productionHistoryStatus');
    if (search) search.value = '';
    if (start) start.value = '';
    if (end) end.value = '';
    if (status) status.value = '';
    state.productionHistoryTab = 'semua';
    renderProductionHistory();
  }

  function buildProductionHistoryEntries() {
    const entries = [];

    state.batches.forEach((batch) => {
      const batchId = String(batch['Batch ID'] || '');
      const status = String(batch['Status Batch'] || batch['Status Umur'] || 'FERMENTASI').toUpperCase();
      const createdDate = parseAnyDate(batch.Timestamp || batch['Tanggal F1']);
      const volume = toNumber(batch['Volume Batch (L)']);

      entries.push({
        type: 'batch',
        tab: 'batch',
        id: batchId,
        batchId,
        date: createdDate,
        title: `Batch F1 ${batchId}`,
        subtitle: `${formatQuantity(volume)} liter · ${statusTitle(status)}`,
        metric: `${formatQuantity(toNumber(batch['Sisa Volume (L)']) || volume)} L`,
        status,
        filterKey: status,
        searchText: [
          batchId,
          status,
          batch.Catatan,
          batch['Dibuat Oleh']
        ].filter(Boolean).join(' ').toLowerCase(),
        raw: batch
      });

      const logs = parseFermentationLogs(batch['Log Fermentasi JSON']);
      logs.forEach((log, index) => {
        const stage = String(log.stage || 'CHECK').toUpperCase();
        const logDate = parseAnyDate(log.date || log.timestamp || batch['Tanggal F1']);
        const phText = log.ph === '' || log.ph === undefined ? '' : `pH ${formatQuantity(log.ph)}`;
        const brixText = log.brix === '' || log.brix === undefined ? '' : `Brix ${formatQuantity(log.brix)}`;
        const conditionText = [phText, brixText, log.aroma, log.taste].filter(Boolean).join(' · ');

        entries.push({
          type: 'fermentation',
          tab: 'fermentasi',
          id: log.id || `${batchId}-LOG-${index + 1}`,
          batchId,
          date: logDate,
          title: stage === 'AKHIR'
            ? `F1 ${batchId} diselesaikan`
            : `Pengecekan ${batchId} · Hari ke-${log.day ?? '-'}`,
          subtitle: conditionText || 'Catatan kondisi fermentasi',
          metric: stage === 'AKHIR' ? 'Selesai F1' : `Hari ${log.day ?? '-'}`,
          status: stage === 'AKHIR' ? 'SIAP BOTTLING' : 'PENGECEKAN',
          filterKey: status,
          searchText: [
            batchId,
            stage,
            log.aroma,
            log.taste,
            log.scoby,
            log.liquid,
            log.note,
            log.user
          ].filter(Boolean).join(' ').toLowerCase(),
          raw: log,
          parentBatch: batch
        });
      });
    });

    state.bottlings.forEach((row) => {
      const variant = normalizeBottlingVariant(row.Varian);
      const isStarter = variant === 'STARTER';
      const bottlingId = String(row['Bottling ID'] || '');
      const batchId = String(row['Batch ID'] || '');

      entries.push({
        type: isStarter ? 'starter' : 'bottling',
        tab: isStarter ? 'starter' : 'bottling',
        id: bottlingId,
        batchId,
        date: parseAnyDate(row.Timestamp || row.Tanggal),
        title: isStarter ? 'Starter disimpan' : `Bottling ${variantTitle(variant)}`,
        subtitle: `${bottlingId} · dari ${batchId}`,
        metric: `${formatQuantity(row.Hasil)} ${row['Satuan Hasil'] || (isStarter ? 'ml' : 'botol')}`,
        status: variant,
        filterKey: variant,
        searchText: [
          bottlingId,
          batchId,
          variant,
          row.Catatan,
          row['Dibuat Oleh'],
          row['Kode Produk']
        ].filter(Boolean).join(' ').toLowerCase(),
        raw: row
      });
    });

    return entries.sort((a, b) => b.date - a.date);
  }

  function renderProductionHistory() {
    const list = document.getElementById('productionHistoryList');
    if (!list) return;

    state.productionHistoryEntries = buildProductionHistoryEntries();
    renderProductionHistoryKpis();

    document.querySelectorAll('[data-history-tab]').forEach((button) => {
      const active = button.dataset.historyTab === state.productionHistoryTab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    const search = String(document.getElementById('productionHistorySearch')?.value || '').trim().toLowerCase();
    const startValue = document.getElementById('productionHistoryStartDate')?.value || '';
    const endValue = document.getElementById('productionHistoryEndDate')?.value || '';
    const filterKey = String(document.getElementById('productionHistoryStatus')?.value || '').toUpperCase();

    const startTime = startValue ? dateOnlyTime(parseAnyDate(startValue)) : null;
    const endDate = endValue ? parseAnyDate(endValue) : null;
    const endTime = endDate
      ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime()
      : null;

    const filtered = state.productionHistoryEntries.filter((entry) => {
      if (state.productionHistoryTab !== 'semua' && entry.tab !== state.productionHistoryTab) return false;
      if (search) {
        const searchable = `${entry.title} ${entry.subtitle} ${entry.metric} ${entry.searchText}`.toLowerCase();
        if (!searchable.includes(search)) return false;
      }
      if (filterKey && String(entry.filterKey || '').toUpperCase() !== filterKey) return false;
      const eventTime = entry.date.getTime();
      if (startTime !== null && eventTime < startTime) return false;
      if (endTime !== null && eventTime > endTime) return false;
      return true;
    });

    const count = document.getElementById('productionHistoryCount');
    const caption = document.getElementById('productionHistoryCaption');
    if (count) count.textContent = `${filtered.length} data`;
    if (caption) {
      caption.textContent = filtered.length
        ? `Menampilkan ${filtered.length} dari ${state.productionHistoryEntries.length} aktivitas.`
        : 'Tidak ada aktivitas yang cocok dengan filter.';
    }

    list.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'card empty-state production-history-empty';
      empty.innerHTML = '<div class="empty-state-icon">⌕</div><h3>Riwayat tidak ditemukan</h3><p>Ubah kata pencarian, tanggal, atau status.</p>';
      list.append(empty);
      return;
    }

    filtered.forEach((entry) => list.append(createProductionHistoryItem(entry)));
  }

  function renderProductionHistoryKpis() {
    const totalBatch = state.batches.length;
    const active = state.batches.filter((batch) => {
      const status = String(batch['Status Batch'] || '').toUpperCase();
      return status === 'FERMENTASI' || status === 'SIAP CEK';
    }).length;
    const ready = state.batches.filter((batch) =>
      String(batch['Status Batch'] || '').toUpperCase() === 'SIAP BOTTLING'
    ).length;
    const bottles = state.bottlings
      .filter((row) => normalizeBottlingVariant(row.Varian) !== 'STARTER')
      .reduce((sum, row) => sum + toNumber(row.Hasil), 0);
    const starter = state.bottlings
      .filter((row) => normalizeBottlingVariant(row.Varian) === 'STARTER')
      .reduce((sum, row) => sum + toNumber(row.Hasil), 0);

    setText('#historyTotalBatch', formatQuantity(totalBatch));
    setText('#historyActiveBatch', formatQuantity(active));
    setText('#historyReadyBatch', formatQuantity(ready));
    setText('#historyProductOutput', `${formatQuantity(bottles)} botol`);
    setText('#historyStarterOutput', `Starter ${formatQuantity(starter)} ml`);
  }

  function createProductionHistoryItem(entry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `card production-history-item history-type-${entry.type}`;
    button.addEventListener('click', () => openProductionHistoryDetail(entry));

    const icon = document.createElement('span');
    icon.className = `production-history-icon ${historyEntryTone(entry)}`;
    icon.innerHTML = historyEntryIcon(entry);

    const copy = document.createElement('span');
    copy.className = 'production-history-copy';

    const heading = document.createElement('span');
    heading.className = 'production-history-item-heading';
    const title = document.createElement('strong');
    title.textContent = entry.title;
    const chip = document.createElement('span');
    chip.className = `status-chip ${historyStatusTone(entry.status)}`;
    chip.textContent = historyStatusLabel(entry);
    heading.append(title, chip);

    const subtitle = document.createElement('span');
    subtitle.className = 'production-history-subtitle';
    subtitle.textContent = entry.subtitle;

    const meta = document.createElement('span');
    meta.className = 'production-history-meta';
    meta.textContent = `${formatDate(entry.date)} · ${entry.batchId || entry.id}`;

    copy.append(heading, subtitle, meta);

    const value = document.createElement('span');
    value.className = 'production-history-value';
    const metric = document.createElement('strong');
    metric.textContent = entry.metric;
    const detail = document.createElement('span');
    detail.textContent = 'Lihat detail';
    value.append(metric, detail);

    const chevron = document.createElement('span');
    chevron.className = 'chevron';

    button.append(icon, copy, value, chevron);
    return button;
  }

  function historyEntryTone(entry) {
    if (entry.type === 'starter') return 'starter';
    if (entry.type === 'bottling') return String(entry.status || '').toLowerCase();
    if (entry.type === 'fermentation') return 'fermentation';
    return 'batch';
  }

  function historyEntryIcon(entry) {
    if (entry.type === 'starter') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c3.5 4.4 6 7.2 6 10.3A6 6 0 0 1 6 13.3C6 10.2 8.5 7.4 12 3Z"/></svg>';
    }
    if (entry.type === 'bottling') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6v4l2 3v10H7V10l2-3V3Z"/></svg>';
    }
    if (entry.type === 'fermentation') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>';
    }
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3h8M9 3v5l-4.5 8.2A3.2 3.2 0 0 0 7.3 21h9.4a3.2 3.2 0 0 0 2.8-4.8L15 8V3"/><path d="M8 15h8"/></svg>';
  }

  function historyStatusTone(status) {
    const value = String(status || '').toUpperCase();
    if (value === 'HABIS' || value === 'ROSELLA') return 'danger';
    if (value === 'SIAP CEK' || value === 'PENGECEKAN' || value === 'ORIGINAL') return 'warning';
    if (value === 'TELANG') return 'info';
    return 'success';
  }

  function historyStatusLabel(entry) {
    if (entry.type === 'fermentation') {
      return entry.status === 'SIAP BOTTLING' ? 'F1 selesai' : 'Pengecekan';
    }
    if (entry.type === 'bottling') return variantTitle(entry.status);
    if (entry.type === 'starter') return 'Starter';
    return statusTitle(entry.status);
  }

  function openProductionHistoryDetail(entry) {
    const title = document.getElementById('productionHistoryDetailTitle');
    const kicker = document.getElementById('productionHistoryDetailKicker');
    const subtitle = document.getElementById('productionHistoryDetailSubtitle');
    const body = document.getElementById('productionHistoryDetailBody');
    if (!title || !kicker || !subtitle || !body) return;

    title.textContent = entry.title;
    kicker.textContent = historyDetailKicker(entry);
    subtitle.textContent = `${formatDate(entry.date)} · ${entry.batchId || entry.id}`;
    body.innerHTML = buildProductionHistoryDetailHtml(entry);
    openSheet('productionHistoryDetailSheet', 'productionHistoryDetailBackdrop');
  }

  function closeProductionHistoryDetail(force = false) {
    closeSheet('productionHistoryDetailSheet', 'productionHistoryDetailBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function historyDetailKicker(entry) {
    if (entry.type === 'batch') return 'Batch F1';
    if (entry.type === 'fermentation') return 'Pengecekan Fermentasi';
    if (entry.type === 'starter') return 'Simpan Starter';
    return 'Hasil Bottling';
  }

  function buildProductionHistoryDetailHtml(entry) {
    if (entry.type === 'batch') return buildBatchHistoryDetail(entry.raw);
    if (entry.type === 'fermentation') return buildFermentationHistoryDetail(entry);
    return buildBottlingHistoryDetail(entry.raw);
  }

  function buildBatchHistoryDetail(batch) {
    const batchId = String(batch['Batch ID'] || '');
    const logs = parseFermentationLogs(batch['Log Fermentasi JSON']);
    const related = state.bottlings.filter((row) => String(row['Batch ID'] || '') === batchId);
    const status = String(batch['Status Batch'] || batch['Status Umur'] || '-');
    const volume = toNumber(batch['Volume Batch (L)']);
    const shrink = toNumber(batch['Susut (L)']);
    const net = Math.max(0, volume - shrink);
    const remaining = toNumber(batch['Sisa Volume (L)']);

    return `
      <section class="history-detail-summary-card">
        <div class="history-detail-title-row">
          <div>
            <span>Batch ID</span>
            <strong>${escapeHtml(batchId)}</strong>
          </div>
          <span class="status-chip ${historyStatusTone(status)}">${escapeHtml(statusTitle(status))}</span>
        </div>
        <div class="history-detail-metrics">
          ${historyDetailMetric('Volume awal', `${formatQuantity(volume)} L`)}
          ${historyDetailMetric('Susut', `${formatQuantity(shrink)} L`)}
          ${historyDetailMetric('Volume bersih', `${formatQuantity(net)} L`)}
          ${historyDetailMetric('Sisa batch', `${formatQuantity(remaining)} L`)}
          ${historyDetailMetric('pH awal', formatQuantity(batch['pH Awal'] || '-'))}
          ${historyDetailMetric('pH akhir', formatQuantity(batch['pH Akhir'] || '-'))}
          ${historyDetailMetric('Brix awal', formatQuantity(batch['Brix Awal'] || '-'))}
          ${historyDetailMetric('Brix akhir', formatQuantity(batch['Brix Akhir'] || '-'))}
          ${historyDetailMetric('HPP F1', formatCurrency(batch['HPP F1 Total']))}
          ${historyDetailMetric('HPP/liter', formatCurrency(batch['HPP F1/Liter']))}
        </div>
      </section>

      ${historyDetailSection(
        'Waktu produksi',
        historyDetailRows([
          ['Tanggal F1', formatDate(batch['Tanggal F1'])],
          ['Tanggal selesai', batch['Tanggal Selesai F1'] ? formatDate(batch['Tanggal Selesai F1']) : '-'],
          ['Terakhir dicek', batch['Terakhir Dicek'] ? formatDateTime(batch['Terakhir Dicek']) : '-'],
          ['Dibuat oleh', batch['Dibuat Oleh'] || '-']
        ])
      )}

      ${buildHistoryLogsHtml(logs)}

      ${historyDetailSection(
        `Hasil dari batch ini (${related.length})`,
        related.length
          ? related.map((row) => historyRelatedBottlingHtml(row)).join('')
          : '<p class="history-detail-empty">Belum ada bottling atau starter dari batch ini.</p>'
      )}

      ${batch.Catatan ? historyDetailSection('Catatan batch', `<p class="history-detail-note">${escapeHtml(batch.Catatan)}</p>`) : ''}
    `;
  }

  function buildFermentationHistoryDetail(entry) {
    const log = entry.raw || {};
    const batch = entry.parentBatch || getBatchById(entry.batchId) || {};
    const conditions = [
      ['Hari fermentasi', `Hari ke-${log.day ?? '-'}`],
      ['pH', log.ph === '' || log.ph === undefined ? '-' : formatQuantity(log.ph)],
      ['Brix', log.brix === '' || log.brix === undefined ? '-' : formatQuantity(log.brix)],
      ['Aroma', log.aroma || '-'],
      ['Rasa', log.taste || '-'],
      ['Kondisi SCOBY', log.scoby || '-'],
      ['Kondisi cairan', log.liquid || '-'],
      ['Susut', log.shrink === '' || log.shrink === undefined ? '-' : `${formatQuantity(log.shrink)} L`]
    ];

    return `
      <section class="history-detail-summary-card">
        <div class="history-detail-title-row">
          <div>
            <span>Batch sumber</span>
            <strong>${escapeHtml(entry.batchId)}</strong>
          </div>
          <span class="status-chip ${historyStatusTone(entry.status)}">${escapeHtml(historyStatusLabel(entry))}</span>
        </div>
        <div class="history-detail-metrics">
          ${conditions.slice(0, 4).map(([label, value]) => historyDetailMetric(label, value)).join('')}
        </div>
      </section>

      ${historyDetailSection('Kondisi fermentasi', historyDetailRows(conditions.slice(4)))}

      ${historyDetailSection(
        'Pencatatan',
        historyDetailRows([
          ['Tanggal', formatDateTime(log.date || log.timestamp)],
          ['Petugas', log.user || batch['Dibuat Oleh'] || '-'],
          ['Tahap', String(log.stage || 'CHECK').toUpperCase()]
        ])
      )}

      ${log.note ? historyDetailSection('Catatan', `<p class="history-detail-note">${escapeHtml(log.note)}</p>`) : ''}
    `;
  }

  function buildBottlingHistoryDetail(row) {
    const variant = normalizeBottlingVariant(row.Varian);
    const isStarter = variant === 'STARTER';
    const batch = getBatchById(row['Batch ID']) || {};
    const ingredientJson = parseJsonArray(row['Kebutuhan Bahan JSON']);

    return `
      <section class="history-detail-summary-card detail-variant-${variant.toLowerCase()}">
        <div class="history-detail-title-row">
          <div>
            <span>${isStarter ? 'Starter ID' : 'Bottling ID'}</span>
            <strong>${escapeHtml(row['Bottling ID'] || '-')}</strong>
          </div>
          <span class="status-chip ${historyStatusTone(variant)}">${escapeHtml(variantTitle(variant))}</span>
        </div>
        <div class="history-detail-metrics">
          ${historyDetailMetric('Volume F1', `${formatQuantity(row['Volume F1 (L)'])} L`)}
          ${historyDetailMetric(isStarter ? 'Starter masuk' : 'Hasil botol', `${formatQuantity(row.Hasil)} ${row['Satuan Hasil'] || (isStarter ? 'ml' : 'botol')}`)}
          ${historyDetailMetric('HPP total', formatCurrency(row['HPP Total']))}
          ${historyDetailMetric('HPP/hasil', formatCurrency(row['HPP per Hasil']))}
          ${historyDetailMetric('Produk', row['Kode Produk'] || '-')}
          ${historyDetailMetric('EXP', row.EXP ? formatDate(row.EXP) : '-')}
        </div>
      </section>

      ${historyDetailSection(
        'Sumber produksi',
        historyDetailRows([
          ['Batch ID', row['Batch ID'] || '-'],
          ['Tanggal proses', formatDate(row.Tanggal)],
          ['Sisa batch saat ini', batch['Sisa Volume (L)'] === undefined ? '-' : `${formatQuantity(batch['Sisa Volume (L)'])} L`],
          ['Dibuat oleh', row['Dibuat Oleh'] || '-']
        ])
      )}

      ${historyDetailSection(
        'Biaya produksi',
        historyDetailRows([
          ['HPP F1 terpakai', formatCurrency(row['HPP F1 Terpakai'])],
          ['Biaya tambahan', formatCurrency(row['Biaya Bahan Tambahan'])],
          ['Gula aktual', row['Gula Aktual (gram)'] === '' || row['Gula Aktual (gram)'] === undefined ? '-' : `${formatQuantity(row['Gula Aktual (gram)'])} gram`]
        ])
      )}

      ${ingredientJson.length
        ? historyDetailSection(
            'Bahan dan kemasan',
            `<div class="history-ingredient-list">${ingredientJson.map((item) => `
              <div>
                <span>${escapeHtml(item.name || item.code || 'Bahan')}</span>
                <strong>${formatQuantity(item.qty)} ${escapeHtml(item.unit || '')}</strong>
              </div>
            `).join('')}</div>`
          )
        : ''}

      ${row.Catatan ? historyDetailSection('Catatan', `<p class="history-detail-note">${escapeHtml(row.Catatan)}</p>`) : ''}
    `;
  }

  function buildHistoryLogsHtml(logs) {
    if (!logs.length) {
      return historyDetailSection('Timeline fermentasi', '<p class="history-detail-empty">Belum ada catatan fermentasi.</p>');
    }

    return historyDetailSection(
      `Timeline fermentasi (${logs.length})`,
      `<div class="history-detail-timeline">${logs.slice().reverse().map((log) => {
        const stage = String(log.stage || 'CHECK').toUpperCase();
        const details = [];
        if (log.ph !== '' && log.ph !== undefined) details.push(`pH ${formatQuantity(log.ph)}`);
        if (log.brix !== '' && log.brix !== undefined) details.push(`Brix ${formatQuantity(log.brix)}`);
        if (log.aroma) details.push(`Aroma ${escapeHtml(log.aroma)}`);
        if (log.taste) details.push(`Rasa ${escapeHtml(log.taste)}`);

        return `
          <article class="history-detail-timeline-item">
            <span class="history-detail-timeline-dot ${stage === 'AKHIR' ? 'is-finish' : ''}"></span>
            <div>
              <div class="history-detail-timeline-head">
                <strong>${stage === 'AKHIR' ? 'F1 diselesaikan' : `Hari ke-${log.day ?? '-'}`}</strong>
                <span>${formatDate(log.date || log.timestamp)}</span>
              </div>
              <p>${details.join(' · ') || 'Pengecekan kondisi batch'}</p>
              ${log.note ? `<small>${escapeHtml(log.note)}</small>` : ''}
            </div>
          </article>
        `;
      }).join('')}</div>`
    );
  }

  function historyRelatedBottlingHtml(row) {
    const variant = normalizeBottlingVariant(row.Varian);
    return `
      <div class="history-related-row">
        <div>
          <strong>${variant === 'STARTER' ? 'Starter disimpan' : `Bottling ${escapeHtml(variantTitle(variant))}`}</strong>
          <span>${escapeHtml(row['Bottling ID'] || '')} · ${formatDate(row.Tanggal)}</span>
        </div>
        <strong>${formatQuantity(row.Hasil)} ${escapeHtml(row['Satuan Hasil'] || (variant === 'STARTER' ? 'ml' : 'botol'))}</strong>
      </div>
    `;
  }

  function historyDetailSection(title, content) {
    return `
      <section class="history-detail-section">
        <h3>${escapeHtml(title)}</h3>
        ${content}
      </section>
    `;
  }

  function historyDetailRows(rows) {
    return `<div class="history-detail-rows">${rows.map(([label, value]) => `
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value ?? '-'))}</strong>
      </div>
    `).join('')}</div>`;
  }

  function historyDetailMetric(label, value) {
    return `
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value ?? '-'))}</strong>
      </div>
    `;
  }

  function parseJsonArray(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(String(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function formatDateTime(value) {
    const date = parseAnyDate(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function formatMoneyInputValue(value) {
    const amount = Math.max(0, Math.round(toNumber(value)));
    return `Rp${new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0
    }).format(amount)}`;
  }

  function getMoneyInputValue(input) {
    if (!input) return 0;
    const datasetValue = Number(input.dataset.moneyValue);
    if (Number.isFinite(datasetValue)) return Math.max(0, datasetValue);

    const digits = String(input.value || '').replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  }

  function setMoneyInputValue(input, value) {
    if (!input) return;
    const amount = Math.max(0, Math.round(toNumber(value)));
    input.dataset.moneyValue = String(amount);
    input.value = formatMoneyInputValue(amount);
  }

  function bindMoneyInput(input, onChange) {
    if (!input || input.dataset.moneyBound === 'true') return;
    input.dataset.moneyBound = 'true';

    setMoneyInputValue(input, getMoneyInputValue(input));

    input.addEventListener('focus', () => {
      requestAnimationFrame(() => input.select());
    });

    input.addEventListener('input', () => {
      const digits = String(input.value || '').replace(/\D/g, '');
      const amount = digits ? Number(digits) : 0;
      input.dataset.moneyValue = String(amount);
      input.value = formatMoneyInputValue(amount);

      requestAnimationFrame(() => {
        const end = input.value.length;
        input.setSelectionRange(end, end);
      });

      if (typeof onChange === 'function') onChange();
    });

    input.addEventListener('blur', () => {
      setMoneyInputValue(input, getMoneyInputValue(input));
    });
  }

  function getStockOpnameSelectableItems() {
    return (state.initialData?.items || [])
      .filter((item) => item.active !== false && String(item.type || '').toUpperCase() !== 'LAINNYA')
      .sort((a, b) => {
        const categoryCompare = String(a.category || '').localeCompare(String(b.category || ''), 'id');
        if (categoryCompare !== 0) return categoryCompare;
        return String(a.name || '').localeCompare(String(b.name || ''), 'id');
      });
  }

  function openStockOpnameSheet() {
    const items = getStockOpnameSelectableItems();
    if (!items.length) {
      showToast('Master item belum tersedia.', 'warning');
      return;
    }

    document.getElementById('stockOpnameForm')?.reset();
    document.getElementById('stockOpnameDate').value = localDateInputValue(new Date());
    document.getElementById('stockOpnameReference').value = 'Dibuat otomatis saat disimpan';
    document.getElementById('stockOpnameUser').value = state.session?.name || state.session?.username || 'Administrator';
    document.getElementById('stockOpnameFormError').textContent = '';
    document.getElementById('stockOpnameSearch').value = '';
    document.getElementById('stockOpnameDifferenceOnly').checked = false;

    state.stockOpnameDraft = new Map();
    populateStockOpnameCategories();
    renderStockOpnameRows();
    openSheet('stockOpnameSheet', 'stockOpnameSheetBackdrop');
  }

  function closeStockOpnameSheet(force = false) {
    if (state.stockOpnameSubmitting && !force) return;
    closeSheet('stockOpnameSheet', 'stockOpnameSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function populateStockOpnameCategories() {
    const select = document.getElementById('stockOpnameCategory');
    if (!select) return;

    const selected = select.value;
    const categories = Array.from(new Set(
      getStockOpnameSelectableItems()
        .map((item) => String(item.category || '').trim())
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'id'));

    select.replaceChildren();

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Semua kategori';
    select.append(allOption);

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.append(option);
    });

    select.value = categories.includes(selected) ? selected : '';
  }

  function getFilteredStockOpnameItems() {
    const category = String(document.getElementById('stockOpnameCategory')?.value || '');
    const search = String(document.getElementById('stockOpnameSearch')?.value || '').trim().toLowerCase();
    const differenceOnly = Boolean(document.getElementById('stockOpnameDifferenceOnly')?.checked);

    return getStockOpnameSelectableItems().filter((item) => {
      if (category && String(item.category || '') !== category) return false;

      if (search) {
        const searchable = `${item.code} ${item.name} ${item.category} ${item.type}`.toLowerCase();
        if (!searchable.includes(search)) return false;
      }

      if (differenceOnly) {
        const draftValue = state.stockOpnameDraft.get(String(item.code).toUpperCase());
        if (draftValue === undefined || draftValue === '') return false;
        const difference = toNumber(draftValue) - getStockOpnameSystemQty(item.code);
        if (Math.abs(difference) < 0.000001) return false;
      }

      return true;
    });
  }

  function getStockOpnameSystemQty(code) {
    const stock = state.stockMap.get(String(code || '').toUpperCase());
    const item = state.itemMap.get(String(code || '').toUpperCase());
    return toNumber(stock?.stock ?? item?.stock);
  }

  function renderStockOpnameRows() {
    const container = document.getElementById('stockOpnameItems');
    if (!container) return;

    const items = getFilteredStockOpnameItems();
    container.replaceChildren();
    setText('#stockOpnameVisibleCount', `${items.length} item tampil`);

    if (!items.length) {
      container.innerHTML = '<div class="stock-opname-empty"><strong>Tidak ada item</strong><span>Ubah kategori, pencarian, atau filter selisih.</span></div>';
      renderStockOpnameSummary();
      return;
    }

    items.forEach((item) => {
      const code = String(item.code || '').toUpperCase();
      const systemQty = getStockOpnameSystemQty(code);
      const hasDraft = state.stockOpnameDraft.has(code);
      const draftValue = hasDraft ? state.stockOpnameDraft.get(code) : '';

      const row = document.createElement('article');
      row.className = 'stock-opname-entry-row';
      row.dataset.code = code;

      row.innerHTML = `
        <div class="stock-opname-item-copy">
          <span class="stock-opname-category">${escapeHtml(item.category || item.type || 'Item')}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(code)} · HPP ${formatCurrency(item.averageCost)}</small>
        </div>

        <div class="stock-opname-system-value">
          <span>Stok sistem</span>
          <strong>${formatQuantity(systemQty)}</strong>
          <small>${escapeHtml(item.unit || '')}</small>
        </div>

        <label class="stock-opname-physical-field">
          <span>Stok fisik</span>
          <span class="input-suffix-wrap">
            <input
              class="form-control stock-opname-physical-input"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              value="${hasDraft ? escapeHtml(String(draftValue)) : ''}"
              placeholder="-"
              aria-label="Stok fisik ${escapeHtml(item.name)}"
            >
            <span class="input-suffix">${escapeHtml(item.unit || 'unit')}</span>
          </span>
        </label>

        <div class="stock-opname-difference-value">
          <span>Selisih</span>
          <strong class="stock-opname-difference-number">Belum diisi</strong>
          <small class="stock-opname-difference-status">-</small>
        </div>

        <div class="stock-opname-value-difference">
          <span>Nilai selisih</span>
          <strong class="stock-opname-value-number">Rp0</strong>
          <small>Berdasarkan HPP</small>
        </div>
      `;

      const input = row.querySelector('.stock-opname-physical-input');
      input?.addEventListener('input', () => {
        const raw = input.value.trim();
        if (raw === '') state.stockOpnameDraft.delete(code);
        else state.stockOpnameDraft.set(code, raw);

        updateStockOpnameRow(row, item);
        renderStockOpnameSummary();

        if (document.getElementById('stockOpnameDifferenceOnly')?.checked) {
          window.clearTimeout(input._stockOpnameFilterTimer);
          input._stockOpnameFilterTimer = window.setTimeout(renderStockOpnameRows, 350);
        }
      });

      container.append(row);
      updateStockOpnameRow(row, item);
    });

    renderStockOpnameSummary();
  }

  function updateStockOpnameRow(row, item) {
    const code = String(item.code || '').toUpperCase();
    const systemQty = getStockOpnameSystemQty(code);
    const rawValue = state.stockOpnameDraft.get(code);
    const differenceElement = row.querySelector('.stock-opname-difference-number');
    const statusElement = row.querySelector('.stock-opname-difference-status');
    const valueElement = row.querySelector('.stock-opname-value-number');

    row.classList.remove('is-equal', 'is-surplus', 'is-shortage', 'is-unfilled');

    if (rawValue === undefined || rawValue === '') {
      row.classList.add('is-unfilled');
      if (differenceElement) differenceElement.textContent = 'Belum diisi';
      if (statusElement) statusElement.textContent = '-';
      if (valueElement) valueElement.textContent = 'Rp0';
      return;
    }

    const actualQty = Math.max(0, toNumber(rawValue));
    const difference = actualQty - systemQty;
    const valueDifference = difference * toNumber(item.averageCost);

    if (differenceElement) {
      differenceElement.textContent = `${formatSignedQuantity(difference)} ${item.unit || ''}`.trim();
    }
    if (valueElement) {
      valueElement.textContent = formatSignedCurrency(valueDifference);
    }

    if (Math.abs(difference) < 0.000001) {
      row.classList.add('is-equal');
      if (statusElement) statusElement.textContent = 'SESUAI';
    } else if (difference > 0) {
      row.classList.add('is-surplus');
      if (statusElement) statusElement.textContent = 'LEBIH';
    } else {
      row.classList.add('is-shortage');
      if (statusElement) statusElement.textContent = 'KURANG';
    }
  }

  function formatSignedQuantity(value) {
    const amount = toNumber(value);
    if (Math.abs(amount) < 0.000001) return '0';
    return `${amount > 0 ? '+' : '-'}${formatQuantity(Math.abs(amount))}`;
  }

  function formatSignedCurrency(value) {
    const amount = toNumber(value);
    if (Math.abs(amount) < 0.5) return 'Rp0';
    return `${amount > 0 ? '+' : '-'}${formatCurrency(Math.abs(amount))}`;
  }

  function getStockOpnameDraftDetails() {
    return Array.from(state.stockOpnameDraft.entries())
      .filter(([, value]) => value !== '')
      .map(([code, value]) => {
        const item = state.itemMap.get(code);
        const systemQty = getStockOpnameSystemQty(code);
        const actualQty = Math.max(0, toNumber(value));
        const difference = actualQty - systemQty;
        const valueDifference = difference * toNumber(item?.averageCost);

        return {
          code,
          item,
          systemQty,
          actualQty,
          difference,
          valueDifference
        };
      });
  }

  function renderStockOpnameSummary() {
    const details = getStockOpnameDraftDetails();
    const adjusted = details.filter((detail) => Math.abs(detail.difference) >= 0.000001);
    const surplus = adjusted.filter((detail) => detail.difference > 0);
    const shortage = adjusted.filter((detail) => detail.difference < 0);
    const netValue = adjusted.reduce((sum, detail) => sum + detail.valueDifference, 0);

    setText('#stockOpnameCounted', `${details.length} item`);
    setText('#stockOpnameAdjusted', `${adjusted.length} item`);
    setText('#stockOpnameSurplus', `${surplus.length} item`);
    setText('#stockOpnameShortage', `${shortage.length} item`);
    setText('#stockOpnameNetValue', formatSignedCurrency(netValue));

    const netElement = document.getElementById('stockOpnameNetValue');
    netElement?.classList.toggle('is-positive', netValue > 0.5);
    netElement?.classList.toggle('is-negative', netValue < -0.5);
  }

  function fillVisibleStockOpnameWithSystem() {
    const items = getFilteredStockOpnameItems();
    items.forEach((item) => {
      state.stockOpnameDraft.set(
        String(item.code || '').toUpperCase(),
        String(getStockOpnameSystemQty(item.code))
      );
    });
    renderStockOpnameRows();
  }

  function clearVisibleStockOpname() {
    const items = getFilteredStockOpnameItems();
    items.forEach((item) => {
      state.stockOpnameDraft.delete(String(item.code || '').toUpperCase());
    });
    renderStockOpnameRows();
  }

  function validateStockOpnameItems() {
    const details = getStockOpnameDraftDetails();

    if (!details.length) {
      throw new Error('Isi stok fisik minimal satu item.');
    }

    details.forEach((detail) => {
      if (!detail.item) throw new Error(`Item ${detail.code} tidak ditemukan.`);
      if (detail.actualQty < 0) {
        throw new Error(`Stok fisik ${detail.item.name} tidak boleh negatif.`);
      }
    });

    return details;
  }

  function requiresLargeStockOpnameConfirmation(details) {
    return details.some((detail) => {
      if (Math.abs(detail.difference) < 0.000001) return false;
      const ratio = detail.systemQty > 0
        ? Math.abs(detail.difference) / detail.systemQty
        : (detail.actualQty > 0 ? 1 : 0);
      return ratio >= 0.25 || Math.abs(detail.valueDifference) >= 100000;
    });
  }

  async function handleStockOpnameSubmit(event) {
    event.preventDefault();
    if (state.stockOpnameSubmitting) return;

    const error = document.getElementById('stockOpnameFormError');
    const button = document.getElementById('submitStockOpnameButton');
    error.textContent = '';

    try {
      const details = validateStockOpnameItems();
      const date = document.getElementById('stockOpnameDate')?.value;
      if (!date) throw new Error('Tanggal stok opname wajib diisi.');

      const adjusted = details.filter((detail) => Math.abs(detail.difference) >= 0.000001);
      if (requiresLargeStockOpnameConfirmation(adjusted)) {
        const confirmed = window.confirm(
          'Terdapat selisih stok yang cukup besar. Periksa kembali jumlah fisik sebelum melanjutkan.\n\nSimpan stok opname ini?'
        );
        if (!confirmed) return;
      }

      state.stockOpnameSubmitting = true;
      setButtonLoading(button, true, 'Menyimpan stok opname...');

      const categorySelect = document.getElementById('stockOpnameCategory');
      const category = categorySelect?.value || 'SEMUA KATEGORI';

      const result = await window.MeramuAPI.request('stockOpname', {
        date,
        category,
        items: details.map((detail) => ({
          code: detail.code,
          actualQty: detail.actualQty
        })),
        note: document.getElementById('stockOpnameNote')?.value.trim() || ''
      }, {
        token: state.session.token,
        timeout: 45000
      });

      closeStockOpnameSheet(true);

      if (result.adjustedItems > 0) {
        showToast(
          `${result.reference} tersimpan · ${result.adjustedItems} item dikoreksi · selisih ${formatSignedCurrency(result.totalValueDifference)}.`,
          'success'
        );
      } else {
        showToast(`${result.reference} selesai · seluruh stok yang dihitung sudah sesuai.`, 'success');
      }

      await refreshAppData({showToastOnError:false});
      navigate('stok');
    } catch (err) {
      error.textContent = err.message || 'Stok opname gagal disimpan.';
      shakeElement(document.getElementById('stockOpnameForm'));
    } finally {
      state.stockOpnameSubmitting = false;
      setButtonLoading(button, false, 'Simpan Stok Opname');
    }
  }

  function getStockUsageSelectableItems() {
    return (state.initialData?.items || [])
      .filter((item) => item.active !== false && String(item.type || '').toUpperCase() !== 'LAINNYA')
      .sort((a, b) => {
        const categoryCompare = String(a.category || '').localeCompare(String(b.category || ''), 'id');
        if (categoryCompare !== 0) return categoryCompare;
        return String(a.name || '').localeCompare(String(b.name || ''), 'id');
      });
  }

  function openStockUsageSheet() {
    if (!getStockUsageSelectableItems().length) {
      showToast('Master item belum tersedia.', 'warning');
      return;
    }

    document.getElementById('stockUsageForm')?.reset();
    document.getElementById('stockUsageDate').value = localDateInputValue(new Date());
    document.getElementById('stockUsageReference').value = 'Dibuat otomatis saat disimpan';
    document.getElementById('stockUsagePurpose').value = 'OPERASIONAL';
    document.getElementById('stockUsageUser').value = state.session?.name || state.session?.username || 'Administrator';
    document.getElementById('stockUsageFormError').textContent = '';

    const container = document.getElementById('stockUsageItems');
    container?.replaceChildren();
    addStockUsageEntry();
    renderStockUsageTotals();
    openSheet('stockUsageSheet', 'stockUsageSheetBackdrop');
  }

  function closeStockUsageSheet(force = false) {
    if (state.stockUsageSubmitting && !force) return;
    closeSheet('stockUsageSheet', 'stockUsageSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function addStockUsageEntry(values = {}) {
    const container = document.getElementById('stockUsageItems');
    if (!container) return;

    const items = getStockUsageSelectableItems();
    const row = document.createElement('article');
    row.className = 'stock-usage-entry-card';

    const options = [
      '<option value="">Pilih item</option>',
      ...items.map((item) => {
        const selected = String(values.code || '').toUpperCase() === String(item.code || '').toUpperCase()
          ? ' selected'
          : '';
        return `<option value="${escapeHtml(item.code)}"${selected}>${escapeHtml(item.code)} · ${escapeHtml(item.name)}</option>`;
      })
    ].join('');

    row.innerHTML = `
      <div class="stock-usage-entry-card-head">
        <div>
          <span class="stock-usage-entry-number">Item 1</span>
          <small>Persediaan keluar</small>
        </div>

        <button class="stock-usage-remove-button" type="button" aria-label="Hapus item">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14"/></svg>
        </button>
      </div>

      <div class="stock-usage-entry-fields">
        <div class="stock-usage-entry-item">
          <label class="form-field">
            <span class="form-label">Item</span>
            <select class="form-control stock-usage-item-select">${options}</select>
          </label>
          <div class="stock-usage-stock-info">
            <span class="stock-usage-stock-text">Pilih item untuk melihat stok dan HPP</span>
          </div>
        </div>

        <label class="form-field stock-usage-entry-qty">
          <span class="form-label">Jumlah</span>
          <span class="input-suffix-wrap">
            <input class="form-control stock-usage-qty-input" type="number" min="0.0001" step="0.01" inputmode="decimal" value="${values.qty ?? ''}" placeholder="0">
            <span class="input-suffix stock-usage-unit-text">unit</span>
          </span>
        </label>

        <div class="stock-usage-entry-hpp">
          <span>HPP rata-rata</span>
          <strong class="stock-usage-hpp-value">Rp0</strong>
        </div>

        <div class="stock-usage-entry-total">
          <span>Nilai keluar</span>
          <strong class="stock-usage-line-total">Rp0</strong>
        </div>
      </div>

      <div class="stock-usage-entry-status" data-status="neutral">
        Stok akan diperiksa otomatis.
      </div>
    `;

    const select = row.querySelector('.stock-usage-item-select');
    const qtyInput = row.querySelector('.stock-usage-qty-input');
    const removeButton = row.querySelector('.stock-usage-remove-button');

    select?.addEventListener('change', () => {
      applyStockUsageItemSelection(row);
      renderStockUsageTotals();
    });

    qtyInput?.addEventListener('input', () => {
      updateStockUsageEntry(row);
      renderStockUsageTotals();
    });

    removeButton?.addEventListener('click', () => {
      const rows = container.querySelectorAll('.stock-usage-entry-card');
      if (rows.length <= 1) {
        select.value = '';
        qtyInput.value = '';
        updateStockUsageEntry(row);
      } else {
        row.remove();
      }
      refreshStockUsageEntryNumbers();
      renderStockUsageTotals();
    });

    container.append(row);
    refreshStockUsageEntryNumbers();

    if (values.code) applyStockUsageItemSelection(row);
    updateStockUsageEntry(row);
    renderStockUsageTotals();

    window.setTimeout(() => select?.focus(), 30);
  }

  function refreshStockUsageEntryNumbers() {
    const container = document.getElementById('stockUsageItems');
    if (!container) return;

    container.querySelectorAll('.stock-usage-entry-card').forEach((row, index) => {
      const number = row.querySelector('.stock-usage-entry-number');
      if (number) number.textContent = `Item ${index + 1}`;
    });
  }

  function applyStockUsageItemSelection(row) {
    const code = String(row.querySelector('.stock-usage-item-select')?.value || '').toUpperCase();
    const item = state.itemMap.get(code);
    const stock = state.stockMap.get(code) || item;
    const unitText = row.querySelector('.stock-usage-unit-text');
    const stockText = row.querySelector('.stock-usage-stock-text');

    if (!item) {
      if (unitText) unitText.textContent = 'unit';
      if (stockText) stockText.textContent = 'Pilih item untuk melihat stok dan HPP';
      updateStockUsageEntry(row);
      return;
    }

    if (unitText) unitText.textContent = item.unit || 'unit';
    if (stockText) {
      stockText.textContent = `Stok ${formatQuantity(stock?.stock)} ${item.unit || ''} · HPP ${formatCurrency(item.averageCost)}`;
    }

    updateStockUsageEntry(row);
  }

  function updateStockUsageEntry(row) {
    const code = String(row.querySelector('.stock-usage-item-select')?.value || '').toUpperCase();
    const qty = Math.max(0, toNumber(row.querySelector('.stock-usage-qty-input')?.value));
    const item = state.itemMap.get(code);
    const stock = state.stockMap.get(code) || item;
    const available = toNumber(stock?.stock);
    const averageCost = toNumber(item?.averageCost);
    const lineCost = qty * averageCost;

    const hpp = row.querySelector('.stock-usage-hpp-value');
    const total = row.querySelector('.stock-usage-line-total');
    const status = row.querySelector('.stock-usage-entry-status');

    if (hpp) hpp.textContent = formatCurrency(averageCost);
    if (total) total.textContent = formatCurrency(lineCost);

    if (!status) return;

    if (!item) {
      status.dataset.status = 'neutral';
      status.textContent = 'Stok akan diperiksa otomatis.';
    } else if (qty <= 0) {
      status.dataset.status = 'neutral';
      status.textContent = `Tersedia ${formatQuantity(available)} ${item.unit || ''}.`;
    } else if (qty > available) {
      status.dataset.status = 'danger';
      status.textContent = `Stok kurang ${formatQuantity(qty - available)} ${item.unit || ''}.`;
    } else {
      status.dataset.status = 'success';
      status.textContent = `Stok cukup · sisa setelah pemakaian ${formatQuantity(available - qty)} ${item.unit || ''}.`;
    }
  }

  function collectStockUsageItems() {
    const container = document.getElementById('stockUsageItems');
    if (!container) return [];

    return Array.from(container.querySelectorAll('.stock-usage-entry-card')).map((row) => ({
      code: String(row.querySelector('.stock-usage-item-select')?.value || '').toUpperCase(),
      qty: toNumber(row.querySelector('.stock-usage-qty-input')?.value)
    }));
  }

  function validateStockUsageItems() {
    const items = collectStockUsageItems();

    if (!items.length || items.some((item) => !item.code || item.qty <= 0)) {
      throw new Error('Lengkapi item dan jumlah pemakaian.');
    }

    const codes = items.map((item) => item.code);
    if (new Set(codes).size !== codes.length) {
      throw new Error('Satu item tidak boleh dimasukkan lebih dari sekali.');
    }

    items.forEach((line) => {
      const stock = state.stockMap.get(line.code);
      const item = state.itemMap.get(line.code);
      const available = toNumber(stock?.stock);

      if (line.qty > available) {
        throw new Error(`Stok ${item?.name || line.code} hanya ${formatQuantity(available)} ${item?.unit || ''}.`);
      }
    });

    return items;
  }

  function renderStockUsageTotals() {
    const items = collectStockUsageItems().filter((item) => item.code && item.qty > 0);
    const totalCost = items.reduce((sum, line) => {
      const item = state.itemMap.get(line.code);
      return sum + (line.qty * toNumber(item?.averageCost));
    }, 0);

    setText('#stockUsageItemCount', formatQuantity(items.length));
    setText('#stockUsageTotalCost', formatCurrency(totalCost));
  }

  async function handleStockUsageSubmit(event) {
    event.preventDefault();
    if (state.stockUsageSubmitting) return;

    const error = document.getElementById('stockUsageFormError');
    const button = document.getElementById('submitStockUsageButton');
    error.textContent = '';

    try {
      const items = validateStockUsageItems();
      const date = document.getElementById('stockUsageDate')?.value;
      const purpose = document.getElementById('stockUsagePurpose')?.value || '';

      if (!date) throw new Error('Tanggal pemakaian wajib diisi.');
      if (!purpose) throw new Error('Tujuan pemakaian wajib dipilih.');

      state.stockUsageSubmitting = true;
      setButtonLoading(button, true, 'Menyimpan pemakaian...');

      const result = await window.MeramuAPI.request('stockUsage', {
        date,
        purpose,
        items,
        note: document.getElementById('stockUsageNote')?.value.trim() || ''
      }, {
        token: state.session.token,
        timeout: 45000
      });

      closeStockUsageSheet(true);
      showToast(`${result.reference} tersimpan · ${result.rows} item · nilai ${formatCurrency(result.totalCost)}.`, 'success');
      await refreshAppData({showToastOnError:false});
      navigate('transaksi');
    } catch (err) {
      error.textContent = err.message || 'Pemakaian bahan gagal disimpan.';
      shakeElement(document.getElementById('stockUsageForm'));
    } finally {
      state.stockUsageSubmitting = false;
      setButtonLoading(button, false, 'Simpan Pemakaian');
    }
  }

  function openExpenseSheet() {
    const form = document.getElementById('expenseForm');
    form?.reset();

    document.getElementById('expenseDate').value = localDateInputValue(new Date());
    document.getElementById('expenseReference').value = 'Dibuat otomatis saat disimpan';
    document.getElementById('expenseMethod').value = 'CASH';
    document.getElementById('expenseUser').value = state.session?.name || state.session?.username || 'Administrator';
    setMoneyInputValue(document.getElementById('expenseAmount'), 0);
    document.getElementById('expenseFormError').textContent = '';

    renderExpensePreview();
    openSheet('expenseSheet', 'expenseSheetBackdrop');
    window.setTimeout(() => document.getElementById('expenseCategory')?.focus(), 250);
  }

  function closeExpenseSheet(force = false) {
    if (state.expenseSubmitting && !force) return;
    closeSheet('expenseSheet', 'expenseSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function renderExpensePreview() {
    const categorySelect = document.getElementById('expenseCategory');
    const category = categorySelect?.value || '';
    const categoryLabel = categorySelect?.selectedOptions?.[0]?.textContent || 'Kategori belum dipilih';
    const title = document.getElementById('expenseTitle')?.value.trim() || 'Nama pengeluaran';
    const method = document.getElementById('expenseMethod')?.value || 'CASH';
    const date = document.getElementById('expenseDate')?.value;
    const amount = getMoneyInputValue(document.getElementById('expenseAmount'));

    setText('#expensePreviewCategory', category ? categoryLabel : 'Kategori belum dipilih');
    setText('#expensePreviewTitle', title);
    setText('#expensePreviewMeta', `${methodTitle(method)} · ${date ? formatDate(parseAnyDate(date)) : 'Pilih tanggal'}`);
    setText('#expensePreviewAmount', formatCurrency(amount));
  }

  async function handleExpenseSubmit(event) {
    event.preventDefault();
    if (state.expenseSubmitting) return;

    const error = document.getElementById('expenseFormError');
    const button = document.getElementById('submitExpenseButton');
    error.textContent = '';

    try {
      const date = document.getElementById('expenseDate')?.value;
      const category = document.getElementById('expenseCategory')?.value || '';
      const title = document.getElementById('expenseTitle')?.value.trim() || '';
      const amount = getMoneyInputValue(document.getElementById('expenseAmount'));
      const method = document.getElementById('expenseMethod')?.value || 'CASH';

      if (!date) throw new Error('Tanggal pengeluaran wajib diisi.');
      if (!category) throw new Error('Kategori pengeluaran wajib dipilih.');
      if (!title) throw new Error('Nama pengeluaran wajib diisi.');
      if (amount <= 0) throw new Error('Nominal pengeluaran harus lebih dari Rp0.');

      state.expenseSubmitting = true;
      setButtonLoading(button, true, 'Menyimpan pengeluaran...');

      const result = await window.MeramuAPI.request('expense', {
        date,
        category,
        title,
        amount,
        method,
        party: document.getElementById('expenseParty')?.value.trim() || '',
        note: document.getElementById('expenseNote')?.value.trim() || ''
      }, {
        token: state.session.token,
        timeout: 45000
      });

      closeExpenseSheet(true);
      showToast(`${result.reference} tersimpan · ${result.category} · ${formatCurrency(result.amount)}.`, 'success');
      await refreshAppData({showToastOnError:false});
      navigate('transaksi');
    } catch (err) {
      error.textContent = err.message || 'Pengeluaran gagal disimpan.';
      shakeElement(document.getElementById('expenseForm'));
    } finally {
      state.expenseSubmitting = false;
      setButtonLoading(button, false, 'Simpan Pengeluaran');
    }
  }

  function methodTitle(value) {
    const method = String(value || '').toUpperCase();
    const labels = {
      CASH: 'Cash',
      TRANSFER: 'Transfer',
      QRIS: 'QRIS',
      DEBIT: 'Debit',
      LAINNYA: 'Lainnya'
    };
    return labels[method] || statusTitle(method);
  }

  function getSaleProducts() {
    return (state.initialData?.items || [])
      .filter((item) => item.active !== false && String(item.type || '').toUpperCase() === 'PRODUK')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id'));
  }

  function openSaleSheet() {
    if (!getSaleProducts().length) {
      showToast('Belum ada produk jual aktif pada Master Item.', 'warning');
      return;
    }

    document.getElementById('saleForm')?.reset();
    document.getElementById('saleDate').value = localDateInputValue(new Date());
    document.getElementById('saleInvoice').value = 'Dibuat otomatis saat disimpan';
    document.getElementById('saleMethod').value = 'CASH';
    setMoneyInputValue(document.getElementById('saleDiscount'), 0);
    setMoneyInputValue(document.getElementById('saleShipping'), 0);
    document.getElementById('saleFormError').textContent = '';

    const container = document.getElementById('saleItems');
    container?.replaceChildren();
    addSaleEntry();
    renderSaleTotals();
    openSheet('saleSheet', 'saleSheetBackdrop');
  }

  function closeSaleSheet(force = false) {
    if (state.saleSubmitting && !force) return;
    closeSheet('saleSheet', 'saleSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function addSaleEntry(values = {}) {
    const container = document.getElementById('saleItems');
    if (!container) return;

    const products = getSaleProducts();
    const row = document.createElement('article');
    row.className = 'sale-entry-card';

    const options = [
      '<option value="">Pilih produk</option>',
      ...products.map((item) => {
        const selected = String(values.code || '').toUpperCase() === String(item.code || '').toUpperCase()
          ? ' selected'
          : '';
        return `<option value="${escapeHtml(item.code)}"${selected}>${escapeHtml(item.name)} · ${escapeHtml(item.code)}</option>`;
      })
    ].join('');

    row.innerHTML = `
      <div class="sale-entry-card-head">
        <div>
          <span class="sale-entry-number">Produk 1</span>
          <small>Penjualan</small>
        </div>

        <button class="sale-remove-button" type="button" aria-label="Hapus produk">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14"/></svg>
        </button>
      </div>

      <div class="sale-entry-fields">
        <div class="sale-entry-product">
          <label class="form-field">
            <span class="form-label">Produk</span>
            <select class="form-control sale-product-select">${options}</select>
          </label>
          <div class="sale-stock-info">
            <span class="sale-stock-text">Pilih produk untuk melihat stok</span>
          </div>
        </div>

        <label class="form-field sale-entry-qty">
          <span class="form-label">Jumlah</span>
          <span class="input-suffix-wrap">
            <input class="form-control sale-qty-input" type="number" min="1" step="1" inputmode="numeric" value="${values.qty ?? ''}" placeholder="0">
            <span class="input-suffix sale-unit-text">botol</span>
          </span>
        </label>

        <label class="form-field sale-entry-price">
          <span class="form-label">Harga jual</span>
          <input
            class="form-control sale-price-input money-input"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            value="${formatMoneyInputValue(values.unitPrice ?? 0)}"
            data-money-value="${toNumber(values.unitPrice ?? 0)}"
            placeholder="Rp0"
          >
        </label>

        <div class="sale-entry-total">
          <span>Subtotal</span>
          <strong class="sale-line-total">Rp0</strong>
          <small class="sale-line-profit">Laba Rp0</small>
        </div>
      </div>

      <div class="sale-entry-status" data-status="neutral">
        Stok akan diperiksa otomatis.
      </div>
    `;

    const select = row.querySelector('.sale-product-select');
    const qtyInput = row.querySelector('.sale-qty-input');
    const priceInput = row.querySelector('.sale-price-input');
    const removeButton = row.querySelector('.sale-remove-button');

    select?.addEventListener('change', () => {
      applySaleProductSelection(row);
      renderSaleTotals();
    });

    qtyInput?.addEventListener('input', () => {
      updateSaleEntry(row);
      renderSaleTotals();
    });

    bindMoneyInput(priceInput, () => {
      priceInput.dataset.manual = 'true';
      updateSaleEntry(row);
      renderSaleTotals();
    });

    removeButton?.addEventListener('click', () => {
      const rows = container.querySelectorAll('.sale-entry-card');
      if (rows.length <= 1) {
        select.value = '';
        qtyInput.value = '';
        setMoneyInputValue(priceInput, 0);
        delete priceInput.dataset.manual;
        updateSaleEntry(row);
      } else {
        row.remove();
      }
      refreshSaleEntryNumbers();
      renderSaleTotals();
    });

    container.append(row);
    refreshSaleEntryNumbers();

    if (values.code) applySaleProductSelection(row, false);
    updateSaleEntry(row);
    renderSaleTotals();

    window.setTimeout(() => select?.focus(), 30);
  }

  function refreshSaleEntryNumbers() {
    const container = document.getElementById('saleItems');
    if (!container) return;

    container.querySelectorAll('.sale-entry-card').forEach((row, index) => {
      const number = row.querySelector('.sale-entry-number');
      if (number) number.textContent = `Produk ${index + 1}`;
    });
  }

  function applySaleProductSelection(row, allowAutoPrice = true) {
    const code = String(row.querySelector('.sale-product-select')?.value || '').toUpperCase();
    const item = state.itemMap.get(code);
    const stock = state.stockMap.get(code) || item;
    const priceInput = row.querySelector('.sale-price-input');
    const unitText = row.querySelector('.sale-unit-text');
    const stockText = row.querySelector('.sale-stock-text');

    if (!item) {
      if (unitText) unitText.textContent = 'botol';
      if (stockText) stockText.textContent = 'Pilih produk untuk melihat stok';
      updateSaleEntry(row);
      return;
    }

    if (unitText) unitText.textContent = item.unit || 'botol';
    if (stockText) {
      stockText.textContent = `Stok ${formatQuantity(stock?.stock)} ${item.unit || ''} · HPP ${formatCurrency(item.averageCost)} · Harga master ${formatCurrency(item.sellPrice)}`;
    }

    if (allowAutoPrice && priceInput && !priceInput.dataset.manual) {
      setMoneyInputValue(priceInput, toNumber(item.sellPrice));
    }

    updateSaleEntry(row);
  }

  function updateSaleEntry(row) {
    const code = String(row.querySelector('.sale-product-select')?.value || '').toUpperCase();
    const qty = Math.max(0, toNumber(row.querySelector('.sale-qty-input')?.value));
    const unitPrice = Math.max(0, getMoneyInputValue(row.querySelector('.sale-price-input')));
    const item = state.itemMap.get(code);
    const stock = state.stockMap.get(code) || item;
    const available = toNumber(stock?.stock);
    const subtotal = qty * unitPrice;
    const hpp = qty * toNumber(item?.averageCost);
    const profit = subtotal - hpp;

    const total = row.querySelector('.sale-line-total');
    const profitElement = row.querySelector('.sale-line-profit');
    const status = row.querySelector('.sale-entry-status');

    if (total) total.textContent = formatCurrency(subtotal);
    if (profitElement) profitElement.textContent = `Laba ${formatCurrency(profit)}`;

    if (!status) return;

    if (!item) {
      status.dataset.status = 'neutral';
      status.textContent = 'Stok akan diperiksa otomatis.';
    } else if (qty <= 0) {
      status.dataset.status = 'neutral';
      status.textContent = `Tersedia ${formatQuantity(available)} ${item.unit || ''}.`;
    } else if (qty > available) {
      status.dataset.status = 'danger';
      status.textContent = `Stok kurang ${formatQuantity(qty - available)} ${item.unit || ''}.`;
    } else {
      status.dataset.status = 'success';
      status.textContent = `Stok cukup · sisa setelah penjualan ${formatQuantity(available - qty)} ${item.unit || ''}.`;
    }
  }

  function collectSaleItems() {
    const container = document.getElementById('saleItems');
    if (!container) return [];

    return Array.from(container.querySelectorAll('.sale-entry-card')).map((row) => ({
      code: String(row.querySelector('.sale-product-select')?.value || '').toUpperCase(),
      qty: toNumber(row.querySelector('.sale-qty-input')?.value),
      unitPrice: getMoneyInputValue(row.querySelector('.sale-price-input'))
    }));
  }

  function validateSaleItems() {
    const items = collectSaleItems();

    if (!items.length || items.some((item) => !item.code || item.qty <= 0 || item.unitPrice <= 0)) {
      throw new Error('Lengkapi produk, jumlah, dan harga jual.');
    }

    const codes = items.map((item) => item.code);
    if (new Set(codes).size !== codes.length) {
      throw new Error('Satu produk tidak boleh dimasukkan lebih dari sekali.');
    }

    items.forEach((line) => {
      const stock = state.stockMap.get(line.code);
      const available = toNumber(stock?.stock);
      if (line.qty > available) {
        const item = state.itemMap.get(line.code);
        throw new Error(`Stok ${item?.name || line.code} hanya ${formatQuantity(available)} ${item?.unit || ''}.`);
      }
    });

    return items;
  }

  function renderSaleTotals() {
    const items = collectSaleItems().filter((item) => item.code && item.qty > 0);
    const subtotal = items.reduce((sum, line) => sum + (line.qty * line.unitPrice), 0);
    const hpp = items.reduce((sum, line) => {
      const item = state.itemMap.get(line.code);
      return sum + (line.qty * toNumber(item?.averageCost));
    }, 0);
    const discount = Math.max(0, getMoneyInputValue(document.getElementById('saleDiscount')));
    const shipping = Math.max(0, getMoneyInputValue(document.getElementById('saleShipping')));
    const total = Math.max(0, subtotal - discount + shipping);
    const profit = total - hpp;

    setText('#saleSubtotal', formatCurrency(subtotal));
    setText('#saleDiscountValue', formatCurrency(discount));
    setText('#saleShippingValue', formatCurrency(shipping));
    setText('#saleGrandTotal', formatCurrency(total));
    setText('#saleHpp', formatCurrency(hpp));
    setText('#saleGrossProfit', formatCurrency(profit));
  }

  async function handleSaleSubmit(event) {
    event.preventDefault();
    if (state.saleSubmitting) return;

    const error = document.getElementById('saleFormError');
    const button = document.getElementById('submitSaleButton');
    error.textContent = '';

    try {
      const items = validateSaleItems();
      const date = document.getElementById('saleDate')?.value;
      const discount = Math.max(0, getMoneyInputValue(document.getElementById('saleDiscount')));
      const shipping = Math.max(0, getMoneyInputValue(document.getElementById('saleShipping')));
      const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);

      if (!date) throw new Error('Tanggal penjualan wajib diisi.');
      if (discount > subtotal) throw new Error('Diskon tidak boleh melebihi subtotal.');

      state.saleSubmitting = true;
      setButtonLoading(button, true, 'Menyimpan penjualan...');

      const result = await window.MeramuAPI.request('sale', {
        date,
        customer: document.getElementById('saleCustomer')?.value.trim() || '',
        method: document.getElementById('saleMethod')?.value || 'CASH',
        items,
        discount,
        shipping,
        note: document.getElementById('saleNote')?.value.trim() || ''
      }, {
        token: state.session.token,
        timeout: 45000
      });

      closeSaleSheet(true);
      showToast(`${result.invoice} tersimpan · total ${formatCurrency(result.total)} · laba ${formatCurrency(result.labaKotor)}.`, 'success');
      await refreshAppData({showToastOnError:false});
      navigate('transaksi');
    } catch (err) {
      error.textContent = err.message || 'Penjualan gagal disimpan.';
      shakeElement(document.getElementById('saleForm'));
    } finally {
      state.saleSubmitting = false;
      setButtonLoading(button, false, 'Simpan Penjualan');
    }
  }

  function getInventorySelectableItems() {
    return (state.initialData?.items || [])
      .filter((item) => item.active !== false && String(item.type || '').toUpperCase() !== 'LAINNYA')
      .sort((a, b) => {
        const categoryCompare = String(a.category || '').localeCompare(String(b.category || ''), 'id');
        if (categoryCompare !== 0) return categoryCompare;
        return String(a.name || '').localeCompare(String(b.name || ''), 'id');
      });
  }

  function openOpeningStockSheet() {
    if (!getInventorySelectableItems().length) {
      showToast('Master item belum tersedia.', 'warning');
      return;
    }

    document.getElementById('openingStockForm')?.reset();
    document.getElementById('openingStockDate').value = localDateInputValue(new Date());
    document.getElementById('openingStockFormError').textContent = '';
    resetInventoryEntries('opening');
    renderOpeningStockTotals();
    openSheet('openingStockSheet', 'openingStockSheetBackdrop');
  }

  function closeOpeningStockSheet(force = false) {
    if (state.openingStockSubmitting && !force) return;
    closeSheet('openingStockSheet', 'openingStockSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function openPurchaseSheet() {
    if (!getInventorySelectableItems().length) {
      showToast('Master item belum tersedia.', 'warning');
      return;
    }

    document.getElementById('purchaseForm')?.reset();
    document.getElementById('purchaseDate').value = localDateInputValue(new Date());
    setMoneyInputValue(document.getElementById('purchaseDiscount'), 0);
    setMoneyInputValue(document.getElementById('purchaseShipping'), 0);
    document.getElementById('purchaseMethod').value = 'CASH';
    document.getElementById('purchaseInvoice').value = 'Dibuat otomatis saat disimpan';
    document.getElementById('purchaseFormError').textContent = '';
    resetInventoryEntries('purchase');
    renderPurchaseTotals();
    openSheet('purchaseSheet', 'purchaseSheetBackdrop');
  }

  function closePurchaseSheet(force = false) {
    if (state.purchaseSubmitting && !force) return;
    closeSheet('purchaseSheet', 'purchaseSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function resetInventoryEntries(mode) {
    const container = document.getElementById(mode === 'opening' ? 'openingStockItems' : 'purchaseItems');
    if (!container) return;
    container.replaceChildren();
    addInventoryEntry(mode);
  }

  function addInventoryEntry(mode, values = {}) {
    const container = document.getElementById(mode === 'opening' ? 'openingStockItems' : 'purchaseItems');
    if (!container) return;

    const items = getInventorySelectableItems();
    const row = document.createElement('article');
    row.className = 'inventory-entry-card';
    row.dataset.inventoryMode = mode;

    const options = [
      '<option value="">Pilih item</option>',
      ...items.map((item) => {
        const selected = String(values.code || '').toUpperCase() === String(item.code || '').toUpperCase()
          ? ' selected'
          : '';
        return `<option value="${escapeHtml(item.code)}"${selected}>${escapeHtml(item.code)} · ${escapeHtml(item.name)}</option>`;
      })
    ].join('');

    row.innerHTML = `
      <div class="inventory-entry-card-head">
        <div>
          <span class="inventory-entry-number">Item 1</span>
          <small class="inventory-entry-mode-label">${mode === 'opening' ? 'Stok awal' : 'Pembelian'}</small>
        </div>

        <button class="inventory-remove-button" type="button" aria-label="Hapus item">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14"/></svg>
        </button>
      </div>

      <div class="inventory-entry-fields">
        <div class="inventory-entry-select">
          <label class="form-field">
            <span class="form-label">Item</span>
            <select class="form-control inventory-item-select">${options}</select>
          </label>
          <div class="inventory-entry-stock">
            <span class="inventory-stock-text">Pilih item untuk melihat stok</span>
          </div>
        </div>

        <label class="form-field inventory-entry-qty">
          <span class="form-label">Jumlah</span>
          <span class="input-suffix-wrap">
            <input class="form-control inventory-qty-input" type="number" min="0.0001" step="0.01" inputmode="decimal" value="${values.qty ?? ''}" placeholder="0">
            <span class="input-suffix inventory-unit-text">unit</span>
          </span>
        </label>

        <label class="form-field inventory-entry-cost">
          <span class="form-label">Harga satuan</span>
          <input
            class="form-control inventory-cost-input money-input"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            value="${formatMoneyInputValue(values.unitCost ?? 0)}"
            data-money-value="${toNumber(values.unitCost ?? 0)}"
            placeholder="Rp0"
          >
        </label>

        <div class="inventory-entry-total">
          <span>Nilai item</span>
          <strong class="inventory-line-total">Rp0</strong>
        </div>
      </div>
    `;

    const select = row.querySelector('.inventory-item-select');
    const qtyInput = row.querySelector('.inventory-qty-input');
    const costInput = row.querySelector('.inventory-cost-input');
    const removeButton = row.querySelector('.inventory-remove-button');

    select?.addEventListener('change', () => {
      applyInventoryItemSelection(row, mode);
      renderInventoryModeTotals(mode);
    });
    qtyInput?.addEventListener('input', () => {
      updateInventoryEntry(row);
      renderInventoryModeTotals(mode);
    });
    bindMoneyInput(costInput, () => {
      costInput.dataset.manual = 'true';
      updateInventoryEntry(row);
      renderInventoryModeTotals(mode);
    });
    removeButton?.addEventListener('click', () => {
      const rows = container.querySelectorAll('.inventory-entry-card');
      if (rows.length <= 1) {
        select.value = '';
        qtyInput.value = '';
        setMoneyInputValue(costInput, 0);
        delete costInput.dataset.manual;
        updateInventoryEntry(row);
      } else {
        row.remove();
      }
      refreshInventoryEntryNumbers(mode);
      renderInventoryModeTotals(mode);
    });

    container.append(row);
    refreshInventoryEntryNumbers(mode);
    if (values.code) applyInventoryItemSelection(row, mode, false);
    updateInventoryEntry(row);
    renderInventoryModeTotals(mode);

    window.setTimeout(() => select?.focus(), 30);
  }

  function refreshInventoryEntryNumbers(mode) {
    const container = document.getElementById(mode === 'opening' ? 'openingStockItems' : 'purchaseItems');
    if (!container) return;

    container.querySelectorAll('.inventory-entry-card').forEach((row, index) => {
      const number = row.querySelector('.inventory-entry-number');
      if (number) number.textContent = `Item ${index + 1}`;
    });
  }

  function applyInventoryItemSelection(row, mode, allowAutoCost = true) {
    const code = String(row.querySelector('.inventory-item-select')?.value || '').toUpperCase();
    const item = state.itemMap.get(code);
    const stock = state.stockMap.get(code) || item;
    const unitText = row.querySelector('.inventory-unit-text');
    const stockText = row.querySelector('.inventory-stock-text');
    const costInput = row.querySelector('.inventory-cost-input');

    if (!item) {
      if (unitText) unitText.textContent = 'unit';
      if (stockText) stockText.textContent = 'Pilih item untuk melihat stok';
      updateInventoryEntry(row);
      return;
    }

    if (unitText) unitText.textContent = item.unit || 'unit';
    if (stockText) {
      stockText.textContent = `Stok sekarang ${formatQuantity(stock?.stock)} ${item.unit || ''} · HPP ${formatCurrency(item.averageCost)}`;
    }

    if (allowAutoCost && costInput && !costInput.dataset.manual) {
      const suggestedCost = toNumber(item.lastBuyPrice) || toNumber(item.averageCost);
      setMoneyInputValue(costInput, suggestedCost > 0 ? Math.round(suggestedCost) : 0);
    }

    updateInventoryEntry(row);
  }

  function updateInventoryEntry(row) {
    const qty = Math.max(0, toNumber(row.querySelector('.inventory-qty-input')?.value));
    const cost = Math.max(0, getMoneyInputValue(row.querySelector('.inventory-cost-input')));
    const total = qty * cost;
    const totalElement = row.querySelector('.inventory-line-total');
    if (totalElement) totalElement.textContent = formatCurrency(total);
  }

  function renderInventoryModeTotals(mode) {
    if (mode === 'opening') renderOpeningStockTotals();
    else renderPurchaseTotals();
  }

  function collectInventoryItems(mode) {
    const container = document.getElementById(mode === 'opening' ? 'openingStockItems' : 'purchaseItems');
    if (!container) return [];

    return Array.from(container.querySelectorAll('.inventory-entry-card')).map((row) => ({
      code: String(row.querySelector('.inventory-item-select')?.value || '').toUpperCase(),
      qty: toNumber(row.querySelector('.inventory-qty-input')?.value),
      unitCost: getMoneyInputValue(row.querySelector('.inventory-cost-input'))
    }));
  }

  function validateInventoryItems(mode) {
    const items = collectInventoryItems(mode);
    if (!items.length || items.some((item) => !item.code || item.qty <= 0 || item.unitCost < 0)) {
      throw new Error('Lengkapi item, jumlah, dan harga satuan.');
    }

    const codes = items.map((item) => item.code);
    if (new Set(codes).size !== codes.length) {
      throw new Error('Satu item tidak boleh dimasukkan lebih dari sekali.');
    }

    return items;
  }

  function renderOpeningStockTotals() {
    const items = collectInventoryItems('opening').filter((item) => item.code && item.qty > 0);
    const total = items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
    setText('#openingStockItemCount', formatQuantity(items.length));
    setText('#openingStockTotalValue', formatCurrency(total));
  }

  function renderPurchaseTotals() {
    const items = collectInventoryItems('purchase').filter((item) => item.code && item.qty > 0);
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
    const discount = Math.max(0, getMoneyInputValue(document.getElementById('purchaseDiscount')));
    const shipping = Math.max(0, getMoneyInputValue(document.getElementById('purchaseShipping')));
    const total = Math.max(0, subtotal - discount + shipping);

    setText('#purchaseSubtotal', formatCurrency(subtotal));
    setText('#purchaseDiscountValue', formatCurrency(discount));
    setText('#purchaseShippingValue', formatCurrency(shipping));
    setText('#purchaseGrandTotal', formatCurrency(total));
  }

  async function handleOpeningStockSubmit(event) {
    event.preventDefault();
    if (state.openingStockSubmitting) return;

    const error = document.getElementById('openingStockFormError');
    const button = document.getElementById('submitOpeningStockButton');
    error.textContent = '';

    try {
      const items = validateInventoryItems('opening');
      const date = document.getElementById('openingStockDate')?.value;
      if (!date) throw new Error('Tanggal stok awal wajib diisi.');

      state.openingStockSubmitting = true;
      setButtonLoading(button, true, 'Menyimpan stok awal...');

      const result = await window.MeramuAPI.request('openingStock', {
        date,
        items,
        note: document.getElementById('openingStockNote')?.value.trim() || ''
      }, {
        token: state.session.token,
        timeout: 45000
      });

      closeOpeningStockSheet(true);
      showToast(`${result.reference} tersimpan · ${result.rows} item · ${formatCurrency(result.totalValue)}.`, 'success');
      await refreshAppData({showToastOnError:false});
      navigate('stok');
    } catch (err) {
      error.textContent = err.message || 'Stok awal gagal disimpan.';
      shakeElement(document.getElementById('openingStockForm'));
    } finally {
      state.openingStockSubmitting = false;
      setButtonLoading(button, false, 'Simpan Stok Awal');
    }
  }

  async function handlePurchaseSubmit(event) {
    event.preventDefault();
    if (state.purchaseSubmitting) return;

    const error = document.getElementById('purchaseFormError');
    const button = document.getElementById('submitPurchaseButton');
    error.textContent = '';

    try {
      const items = validateInventoryItems('purchase');
      const date = document.getElementById('purchaseDate')?.value;
      const supplier = document.getElementById('purchaseSupplier')?.value.trim() || '';
      const discount = Math.max(0, getMoneyInputValue(document.getElementById('purchaseDiscount')));
      const shipping = Math.max(0, getMoneyInputValue(document.getElementById('purchaseShipping')));
      const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);

      if (!date) throw new Error('Tanggal pembelian wajib diisi.');
      if (!supplier) throw new Error('Nama supplier wajib diisi.');
      if (subtotal <= 0) throw new Error('Subtotal pembelian harus lebih dari Rp0.');
      if (discount > subtotal) throw new Error('Diskon tidak boleh melebihi subtotal.');

      state.purchaseSubmitting = true;
      setButtonLoading(button, true, 'Menyimpan pembelian...');

      const result = await window.MeramuAPI.request('purchase', {
        date,
        supplier,
        method: document.getElementById('purchaseMethod')?.value || 'CASH',
        items,
        discount,
        shipping,
        note: document.getElementById('purchaseNote')?.value.trim() || ''
      }, {
        token: state.session.token,
        timeout: 45000
      });

      closePurchaseSheet(true);
      showToast(`${result.reference} tersimpan · total ${formatCurrency(result.total)}.`, 'success');
      await refreshAppData({showToastOnError:false});
      navigate('transaksi');
    } catch (err) {
      error.textContent = err.message || 'Pembelian gagal disimpan.';
      shakeElement(document.getElementById('purchaseForm'));
    } finally {
      state.purchaseSubmitting = false;
      setButtonLoading(button, false, 'Simpan Pembelian');
    }
  }

  function currentApplicationRole() {
    const role = String(state.session?.user?.role || '').toUpperCase();
    const aliases = {
      ADMINISTRATOR: 'ADMIN',
      SUPERADMIN: 'ADMIN',
      OWNER: 'ADMIN',
      PRODUCTION: 'PRODUKSI',
      CASHIER: 'KASIR'
    };
    return aliases[role] || role;
  }

  function isCurrentAppAdmin() {
    return currentApplicationRole() === 'ADMIN';
  }

  function allowedPagesForCurrentRole() {
    const role = currentApplicationRole();
    if (role === 'ADMIN') return Object.keys(pageNames);
    if (role === 'PRODUKSI') {
      return ['dashboard', 'produksi', 'riwayat-produksi', 'stok', 'stok-detail', 'label-print', 'lainnya', 'pengaturan'];
    }
    if (role === 'KASIR') {
      return ['dashboard', 'transaksi', 'riwayat-transaksi', 'stok', 'stok-detail', 'lainnya', 'pengaturan'];
    }
    return ['dashboard', 'lainnya', 'pengaturan'];
  }

  function canNavigateToPage(page) {
    return allowedPagesForCurrentRole().includes(page);
  }

  function applyRoleAccess() {
    const role = currentApplicationRole();
    const allowedPages = new Set(allowedPagesForCurrentRole());

    document.querySelectorAll('[data-page-target]').forEach((button) => {
      button.hidden = !allowedPages.has(button.dataset.pageTarget);
    });

    document.querySelectorAll('[data-open-master-items], [data-open-master-recipes], [data-open-app-users]').forEach((element) => {
      element.hidden = role !== 'ADMIN';
    });
    document.querySelectorAll('[data-open-reports]').forEach((element) => {
      element.hidden = role !== 'ADMIN';
    });
    document.querySelectorAll('[data-open-activity-launcher]').forEach((element) => {
      element.hidden = false;
    });

    document.querySelectorAll('[data-settings-admin]').forEach((element) => {
      if (element.matches('input, select, textarea, button')) element.disabled = role !== 'ADMIN';
      element.querySelectorAll?.('input, select, textarea, button').forEach((child) => {
        child.disabled = role !== 'ADMIN';
      });
      element.classList.toggle('is-admin-disabled', role !== 'ADMIN');
    });

    document.querySelectorAll('.module-card').forEach((card) => {
      if (role === 'ADMIN') {
        card.hidden = false;
        return;
      }

      let allowed = card.hasAttribute('data-open-app-settings');

      if (role === 'PRODUKSI') {
        allowed = allowed ||
          card.hasAttribute('data-open-batch-form') ||
          card.hasAttribute('data-open-fermentation') ||
          card.hasAttribute('data-open-finish') ||
          card.hasAttribute('data-open-bottling') ||
          card.hasAttribute('data-open-production-history') ||
          card.hasAttribute('data-open-label-print') ||
          card.hasAttribute('data-open-stock-group');
      }

      if (role === 'KASIR') {
        allowed = allowed ||
          card.hasAttribute('data-open-sale') ||
          card.hasAttribute('data-open-transaction-history') ||
          (
            card.hasAttribute('data-open-stock-group') &&
            String(card.dataset.openStockGroup || '').toUpperCase() === 'PRODUK'
          );
      }

      card.hidden = !allowed;
    });
  }

  function applyBusinessIdentity(settings) {
    const profile = settings?.profile || settings || {};
    const name = String(profile.businessName || profile.BUSINESS_NAME || 'MERAMU').trim() || 'MERAMU';
    const location = String(profile.businessLocation || profile.BUSINESS_LOCATION || 'Meramu Center').trim() || 'Meramu Center';

    document.querySelectorAll('[data-business-name]').forEach((element) => {
      element.textContent = name;
    });
    document.querySelectorAll('[data-business-location]').forEach((element) => {
      element.textContent = location;
    });
    document.title = `${resolvePageName(state.page)} · ${name}`;
  }

  function openAppSettingsPage() {
    navigate('pengaturan');
    renderAppSettingsTabs();
    loadAppSettings();
  }

  function renderAppSettingsTabs() {
    document.querySelectorAll('[data-settings-tab]').forEach((button) => {
      const active = button.dataset.settingsTab === state.appSettingsActiveTab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    document.querySelectorAll('[data-settings-panel]').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.settingsPanel === state.appSettingsActiveTab);
    });
  }

  async function loadAppSettings(force = false) {
    if (!state.session?.token || state.appSettingsLoading) return;
    if (state.appSettingsLoaded && !force) {
      renderAppSettings();
      return;
    }

    state.appSettingsLoading = true;
    setAppSettingsLoadStatus('Memuat pengaturan...', 'loading');

    try {
      const result = await window.MeramuAPI.request(
        'app-settings',
        {},
        {token: state.session.token, timeout: 45000}
      );
      state.appSettingsData = result;
      state.appSettingsLoaded = true;
      renderAppSettings();
      setAppSettingsLoadStatus(
        result.canEdit ? 'Pengaturan siap diedit' : 'Mode lihat · akses terbatas',
        result.canEdit ? 'success' : 'warning'
      );
    } catch (error) {
      setAppSettingsLoadStatus('Pengaturan gagal dimuat', 'error');
      showToast(error.message || 'Pengaturan aplikasi gagal dimuat.', 'error');
    } finally {
      state.appSettingsLoading = false;
    }
  }

  function setAppSettingsLoadStatus(message, tone = 'info') {
    const element = document.getElementById('appSettingsLoadStatus');
    if (!element) return;
    element.textContent = message;
    element.dataset.tone = tone;
  }

  function setFieldValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value === undefined || value === null ? '' : String(value);
  }

  function renderAppSettings() {
    const data = state.appSettingsData;
    if (!data?.settings) return;

    const settings = data.settings;
    const profile = settings.profile || {};
    const production = settings.production || {};
    const transactions = settings.transactions || {};
    const notifications = settings.notifications || {};
    const security = settings.security || {};
    const backup = settings.backup || {};
    const prefixes = transactions.prefixes || {};

    setFieldValue('settingBusinessName', profile.businessName);
    setFieldValue('settingBusinessLocation', profile.businessLocation);
    setFieldValue('settingOwnerName', profile.ownerName);
    setFieldValue('settingBusinessPhone', profile.phone);
    setFieldValue('settingBusinessAddress', profile.address);

    setFieldValue('settingBottleMl', production.bottleMl);
    setFieldValue('settingBottlesPerLiter', `${formatQuantity(production.bottlesPerLiter)} botol`);
    setFieldValue('settingF1MinDays', production.f1MinDays);
    setFieldValue('settingF1IdealDays', production.f1IdealDays);
    setFieldValue('settingExpirationDays', production.expirationDays);
    setFieldValue('settingStarterMl', production.starterMlPerLiter);
    setFieldValue('settingShrinkPercent', production.targetShrinkPercent);

    const activeMethods = new Set((transactions.paymentMethods || []).map((method) => String(method).toUpperCase()));
    document.querySelectorAll('#settingPaymentMethods input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = activeMethods.has(String(checkbox.value).toUpperCase());
    });

    setFieldValue('settingDefaultCustomer', transactions.defaultCustomer);
    setFieldValue('settingDefaultSupplier', transactions.defaultSupplier);
    setFieldValue('settingPrefixOpening', prefixes.opening);
    setFieldValue('settingPrefixPurchase', prefixes.purchase);
    setFieldValue('settingPrefixBatch', prefixes.batch);
    setFieldValue('settingPrefixBottling', prefixes.bottling);
    setFieldValue('settingPrefixSale', prefixes.sale);
    setFieldValue('settingPrefixExpense', prefixes.expense);
    setFieldValue('settingPrefixUsage', prefixes.usage);
    setFieldValue('settingPrefixOpname', prefixes.opname);

    const calendarEnabled = document.getElementById('settingCalendarEnabled');
    if (calendarEnabled) calendarEnabled.checked = Boolean(notifications.enabled);
    setFieldValue('settingCheckDays', (notifications.checkDays || []).join(', '));
    setFieldValue('settingEventTime', notifications.eventTime || '08:05');
    setFieldValue('settingPopupMinutes', notifications.popupMinutes || 5);
    setFieldValue('settingCalendarWebAppUrl', notifications.webAppUrl || '');
    setText('#settingCalendarReady', notifications.calendarReady ? 'SIAP' : 'BELUM SIAP');
    setText('#settingCalendarName', notifications.calendarName || 'MERAMU — Pengingat Produksi');
    setText('#settingCalendarSchedule', `Hari ${(notifications.checkDays || []).join(', ') || '-'}`);
    setText('#settingCalendarTimeSummary', `Pukul ${notifications.eventTime || '08:05'} WIB`);

    const allowNegative = document.getElementById('settingAllowNegativeStock');
    if (allowNegative) allowNegative.checked = Boolean(security.allowNegativeStock);
    setFieldValue('settingSessionHours', security.sessionHours || 6);
    setFieldValue('settingMaxLoginAttempts', security.maxLoginAttempts || 5);
    setFieldValue('settingLoginLockMinutes', security.loginLockMinutes || 15);

    const backupEnabled = document.getElementById('settingBackupEnabled');
    if (backupEnabled) backupEnabled.checked = backup.enabled !== false;
    setFieldValue('settingBackupFrequency', backup.frequency || 'DAILY');
    setFieldValue('settingBackupKeep', backup.keepCopies || 30);
    setFieldValue('settingBackupHour', backup.hour ?? 3);

    renderBusinessIdentityPreview();
    updateBottleCalculationPreview();
    renderAppSettingsUsers(data.users || []);
    renderAppSettingsSystem(data.system || {});
    applyBusinessIdentity(profile);
    applyRoleAccess();
  }

  function renderBusinessIdentityPreview() {
    setText(
      '#settingBusinessPreviewName',
      document.getElementById('settingBusinessName')?.value.trim() || 'MERAMU'
    );
    setText(
      '#settingBusinessPreviewLocation',
      document.getElementById('settingBusinessLocation')?.value.trim() || 'Meramu Center'
    );
  }

  function updateBottleCalculationPreview() {
    const bottleMl = Math.max(1, toNumber(document.getElementById('settingBottleMl')?.value));
    const bottles = Math.max(1, Math.floor(1000 / bottleMl));
    setFieldValue('settingBottlesPerLiter', `${formatQuantity(bottles)} botol`);
  }

  function collectAppSettingsPayload() {
    const paymentMethods = Array.from(
      document.querySelectorAll('#settingPaymentMethods input[type="checkbox"]:checked')
    ).map((checkbox) => checkbox.value);

    return {
      profile: {
        businessName: document.getElementById('settingBusinessName')?.value.trim() || '',
        businessLocation: document.getElementById('settingBusinessLocation')?.value.trim() || '',
        ownerName: document.getElementById('settingOwnerName')?.value.trim() || '',
        phone: document.getElementById('settingBusinessPhone')?.value.trim() || '',
        address: document.getElementById('settingBusinessAddress')?.value.trim() || ''
      },
      production: {
        bottleMl: toNumber(document.getElementById('settingBottleMl')?.value),
        f1MinDays: toNumber(document.getElementById('settingF1MinDays')?.value),
        f1IdealDays: toNumber(document.getElementById('settingF1IdealDays')?.value),
        expirationDays: toNumber(document.getElementById('settingExpirationDays')?.value),
        starterMlPerLiter: toNumber(document.getElementById('settingStarterMl')?.value),
        targetShrinkPercent: toNumber(document.getElementById('settingShrinkPercent')?.value)
      },
      transactions: {
        paymentMethods,
        defaultCustomer: document.getElementById('settingDefaultCustomer')?.value.trim() || '',
        defaultSupplier: document.getElementById('settingDefaultSupplier')?.value.trim() || '',
        prefixes: {
          opening: document.getElementById('settingPrefixOpening')?.value.trim() || '',
          purchase: document.getElementById('settingPrefixPurchase')?.value.trim() || '',
          batch: document.getElementById('settingPrefixBatch')?.value.trim() || '',
          bottling: document.getElementById('settingPrefixBottling')?.value.trim() || '',
          sale: document.getElementById('settingPrefixSale')?.value.trim() || '',
          expense: document.getElementById('settingPrefixExpense')?.value.trim() || '',
          usage: document.getElementById('settingPrefixUsage')?.value.trim() || '',
          opname: document.getElementById('settingPrefixOpname')?.value.trim() || ''
        }
      },
      notifications: {
        enabled: Boolean(document.getElementById('settingCalendarEnabled')?.checked),
        checkDays: String(document.getElementById('settingCheckDays')?.value || '')
          .split(/[,\s;]+/)
          .filter(Boolean)
          .map((day) => Number(day)),
        eventTime: document.getElementById('settingEventTime')?.value || '08:05',
        popupMinutes: toNumber(document.getElementById('settingPopupMinutes')?.value),
        webAppUrl: document.getElementById('settingCalendarWebAppUrl')?.value.trim() || ''
      },
      security: {
        allowNegativeStock: Boolean(document.getElementById('settingAllowNegativeStock')?.checked),
        sessionHours: toNumber(document.getElementById('settingSessionHours')?.value),
        maxLoginAttempts: toNumber(document.getElementById('settingMaxLoginAttempts')?.value),
        loginLockMinutes: toNumber(document.getElementById('settingLoginLockMinutes')?.value)
      },
      backup: {
        enabled: Boolean(document.getElementById('settingBackupEnabled')?.checked),
        frequency: document.getElementById('settingBackupFrequency')?.value || 'DAILY',
        keepCopies: toNumber(document.getElementById('settingBackupKeep')?.value),
        hour: toNumber(document.getElementById('settingBackupHour')?.value)
      }
    };
  }

  async function handleAppSettingsSubmit(event) {
    event?.preventDefault?.();
    if (!isCurrentAppAdmin() || state.appSettingsSaving) return;

    const errorElement = document.getElementById('appSettingsFormError');
    const button = document.getElementById('saveAppSettings');
    if (errorElement) errorElement.textContent = '';

    try {
      const payload = collectAppSettingsPayload();
      if (!payload.profile.businessName) throw new Error('Nama usaha wajib diisi.');
      if (!payload.profile.businessLocation) throw new Error('Nama lokasi wajib diisi.');
      if (!payload.transactions.paymentMethods.length) throw new Error('Minimal satu metode pembayaran harus dipilih.');

      state.appSettingsSaving = true;
      setButtonLoading(button, true, 'Menyimpan...');

      const result = await window.MeramuAPI.request(
        'updateAppSettings',
        payload,
        {token: state.session.token, timeout: 45000}
      );

      state.appSettingsData = result.data || state.appSettingsData;
      state.appSettingsLoaded = true;
      renderAppSettings();
      await refreshAppData({showToastOnError: false});
      showToast('Pengaturan aplikasi berhasil disimpan.', 'success');
    } catch (error) {
      if (errorElement) errorElement.textContent = error.message || 'Pengaturan gagal disimpan.';
      shakeElement(document.getElementById('appSettingsForm'));
    } finally {
      state.appSettingsSaving = false;
      setButtonLoading(button, false, 'Simpan Pengaturan');
    }
  }

  function renderAppSettingsUsers(users) {
    const container = document.getElementById('appSettingsUserList');
    if (!container) return;

    const safeUsers = Array.isArray(users) ? users : [];
    const active = safeUsers.filter((user) => user.active).length;
    const admins = safeUsers.filter((user) => user.active && user.role === 'ADMIN').length;
    const staff = safeUsers.filter((user) => user.active && user.role !== 'ADMIN').length;

    setText('#settingUserTotal', formatQuantity(safeUsers.length));
    setText('#settingUserActive', formatQuantity(active));
    setText('#settingUserAdmin', formatQuantity(admins));
    setText('#settingUserStaff', formatQuantity(staff));

    container.replaceChildren();

    if (!isCurrentAppAdmin()) {
      container.innerHTML = `
        <div class="card app-settings-user-empty">
          <h3>Akses pengguna dibatasi</h3>
          <p>Daftar pengguna hanya dapat dilihat dan diubah oleh Administrator.</p>
        </div>
      `;
      return;
    }

    if (!safeUsers.length) {
      container.innerHTML = '<div class="card empty-state"><p>Belum ada pengguna.</p></div>';
      return;
    }

    safeUsers.forEach((user) => {
      const card = document.createElement('article');
      card.className = `card app-settings-user-card ${user.active ? '' : 'is-inactive'}`;

      const identity = document.createElement('div');
      identity.className = 'app-settings-user-identity';

      const avatar = document.createElement('span');
      avatar.className = `app-settings-user-avatar role-${String(user.role || '').toLowerCase()}`;
      avatar.textContent = getInitials(user.name || user.username);

      const copy = document.createElement('div');
      const role = document.createElement('span');
      role.textContent = formatRole(user.role);
      const name = document.createElement('strong');
      name.textContent = user.name || user.username;
      const username = document.createElement('small');
      username.textContent = `@${user.username}`;
      copy.append(role, name, username);
      identity.append(avatar, copy);

      const status = document.createElement('span');
      status.className = `app-settings-user-status ${user.active ? 'is-active' : 'is-inactive'}`;
      status.textContent = user.active ? 'AKTIF' : 'NONAKTIF';

      const actions = document.createElement('div');
      actions.className = 'app-settings-user-actions';

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'btn btn-secondary';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => openAppUserSheet(user.username));

      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = user.active ? 'btn btn-danger-soft' : 'btn btn-primary';
      toggleButton.textContent = user.active ? 'Nonaktifkan' : 'Aktifkan';
      toggleButton.disabled = user.username === state.session?.user?.username;
      toggleButton.addEventListener('click', () => toggleAppUserActive(user));

      actions.append(editButton, toggleButton);
      card.append(identity, status, actions);
      container.append(card);
    });
  }

  function renderAppSettingsSystem(system) {
    setText('#settingFrontendVersion', window.MERAMU_CONFIG?.VERSION || '1.30.0');
    setText('#settingBackendVersion', system.backendVersion || '-');
    setText('#settingDatabaseStatus', system.databaseReady ? 'TERHUBUNG' : 'BERMASALAH');
    setText('#settingSpreadsheetName', system.spreadsheetName || 'Spreadsheet MERAMU');
    setText('#settingSystemItems', formatQuantity(system.activeItemCount));
    setText('#settingSystemItemsCaption', `${formatQuantity(system.itemCount)} total item`);
    setText('#settingSystemProduction', formatQuantity(toNumber(system.batchCount) + toNumber(system.bottlingCount)));
    setText('#settingSystemTransactions', formatQuantity(system.transactionRowCount));
    setText('#settingSystemWebAppUrl', system.webAppUrl || window.MERAMU_CONFIG?.API_URL || '-');
    setText('#settingSystemSpreadsheetId', system.spreadsheetId || 'Hanya Administrator');
    setText('#settingSystemTimezone', system.timezone || 'Asia/Jakarta');
    setText('#settingSystemGeneratedAt', system.generatedAt ? formatDateTime(system.generatedAt) : '-');

    renderBackupSystemStatus(system.backup || {});
    renderSystemHealth(system.health || {});
    renderSystemActivity(system.recentActivity || []);
    renderClientPwaHealth();
  }

  function setSystemPill(selector, text, tone = 'info') {
    const element = document.querySelector(selector);
    if (!element) return;
    element.textContent = text;
    element.dataset.tone = tone;
  }

  function renderBackupSystemStatus(backup) {
    setSystemPill(
      '#settingBackupTriggerStatus',
      backup.triggerReady ? 'JADWAL AKTIF' : 'BELUM AKTIF',
      backup.triggerReady ? 'success' : 'warning'
    );
    setText('#settingLastBackupName', backup.lastBackupFileName || 'Belum ada backup');
    setText(
      '#settingLastBackupTime',
      backup.lastBackupAt ? formatDateTime(backup.lastBackupAt) : 'Backup pertama belum dibuat'
    );
  }

  function renderSystemHealth(health) {
    if (!health || !Object.keys(health).length) {
      setSystemPill('#settingProductionStatus', 'AKSES TERBATAS', 'warning');
      return;
    }

    const ready = health.status === 'SIAP PRODUKSI';
    setSystemPill(
      '#settingProductionStatus',
      health.status || 'MEMERIKSA',
      ready ? 'success' : 'warning'
    );

    setText('#healthSheetsStatus', health.sheetsReady ? 'SIAP' : 'BERMASALAH');
    setText(
      '#healthSheetsCaption',
      health.missingSheets?.length
        ? `Kurang: ${health.missingSheets.join(', ')}`
        : '5 sheet inti tersedia'
    );
    setText('#healthActivityStatus', health.activityLogReady ? 'SIAP' : 'BELUM SIAP');
    setText('#healthCalendarStatus', health.calendarTriggerReady ? 'AKTIF' : 'TIDAK AKTIF');
    setText('#healthBackupStatus', health.backupTriggerReady ? 'AKTIF' : 'TIDAK AKTIF');

    setText(
      '#healthLastErrorStatus',
      health.lastErrorAt ? 'PERNAH TERJADI' : 'TIDAK ADA'
    );
    setText(
      '#healthLastErrorCaption',
      health.lastErrorAt
        ? `${formatDateTime(health.lastErrorAt)} · ${health.lastErrorMessage || 'Lihat Apps Script'}`
        : 'Belum ada error sistem tercatat'
    );

    const issues = document.getElementById('systemHealthIssues');
    const issueRows = Array.isArray(health.issues) ? health.issues : [];
    if (issues) {
      if (issueRows.length) {
        issues.hidden = false;
        issues.innerHTML = issueRows
          .map((issue) => `<span>${escapeHtml(issue)}</span>`)
          .join('');
      } else {
        issues.hidden = true;
        issues.replaceChildren();
      }
    }
  }

  function renderClientPwaHealth() {
    const controlled = Boolean(navigator.serviceWorker?.controller);
    const online = navigator.onLine !== false;
    setText('#healthPwaStatus', controlled ? 'AKTIF' : 'BELUM AKTIF');
    setText(
      '#healthPwaCaption',
      `${online ? 'Online' : 'Offline'} · cache ${window.MERAMU_CONFIG?.VERSION || '-'}`
    );
  }

  function renderSystemActivity(logs) {
    const container = document.getElementById('systemActivityList');
    if (!container) return;

    const entries = Array.isArray(logs) ? logs : [];
    container.replaceChildren();

    if (!entries.length) {
      container.innerHTML = `
        <div class="dashboard-data-placeholder">
          Belum ada log aktivitas. Aktivitas baru akan tercatat setelah backend V2.17 digunakan.
        </div>
      `;
      return;
    }

    entries.forEach((entry) => {
      const row = document.createElement('article');
      row.className = `system-activity-row status-${String(entry.status || '').toLowerCase()}`;

      const indicator = document.createElement('span');
      indicator.className = 'system-activity-indicator';
      indicator.textContent = String(entry.status || '').toUpperCase() === 'SUKSES' ? '✓' : '!';

      const copy = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = entry.activity || 'Aktivitas';
      const meta = document.createElement('span');
      meta.textContent = `${entry.username || 'system'} · ${formatRole(entry.role)} · ${formatDateTime(entry.timestamp)}`;
      const note = document.createElement('small');
      note.textContent = [entry.reference, entry.note].filter(Boolean).join(' · ') || '-';
      copy.append(title, meta, note);

      const status = document.createElement('span');
      status.className = 'system-activity-status';
      status.textContent = entry.status || 'INFO';

      row.append(indicator, copy, status);
      container.append(row);
    });
  }

  async function createBackupNow() {
    if (!isCurrentAppAdmin() || state.backupSubmitting) return;
    const button = document.getElementById('createBackupNowButton');

    try {
      state.backupSubmitting = true;
      setButtonLoading(button, true, 'Membuat backup...');

      const result = await window.MeramuAPI.request(
        'createBackupNow',
        {},
        {token: state.session.token, timeout: 120000, retries: 0}
      );

      showToast(`${result.fileName} berhasil dibuat.`, 'success');
      await loadAppSettings(true);
    } catch (error) {
      showToast(error.message || 'Backup gagal dibuat.', 'error');
    } finally {
      state.backupSubmitting = false;
      setButtonLoading(button, false, 'Buat Backup Sekarang');
    }
  }

  async function installBackupSchedule() {
    if (!isCurrentAppAdmin() || state.backupSubmitting) return;
    const button = document.getElementById('installBackupScheduleButton');

    try {
      state.backupSubmitting = true;
      setButtonLoading(button, true, 'Memasang jadwal...');

      const result = await window.MeramuAPI.request(
        'installBackupSchedule',
        {},
        {token: state.session.token, timeout: 60000}
      );

      showToast(result.message || 'Jadwal backup berhasil diperbarui.', 'success');
      await loadAppSettings(true);
    } catch (error) {
      showToast(error.message || 'Jadwal backup gagal dipasang.', 'error');
    } finally {
      state.backupSubmitting = false;
      setButtonLoading(button, false, 'Perbarui Jadwal');
    }
  }

  function appUserRoleDescription(role) {
    const descriptions = {
      ADMIN: ['Administrator', 'Akses penuh ke produksi, transaksi, stok, laporan, Master Item, pengguna, dan pengaturan.'],
      PRODUKSI: ['Produksi', 'Dapat mengelola Batch F1, fermentasi, bottling, pemakaian bahan, serta melihat stok.'],
      KASIR: ['Kasir', 'Dapat mencatat penjualan, melihat riwayat transaksi, dan memantau stok produk.']
    };
    return descriptions[String(role || '').toUpperCase()] || descriptions.PRODUKSI;
  }

  function renderAppUserRoleGuide() {
    const guide = document.getElementById('appUserRoleGuide');
    if (!guide) return;
    const [title, description] = appUserRoleDescription(document.getElementById('appUserRole')?.value);
    guide.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span>`;
  }

  function openAppUserSheet(username = '') {
    if (!isCurrentAppAdmin()) return;

    const users = state.appSettingsData?.users || [];
    const user = username
      ? users.find((entry) => entry.username === username)
      : null;

    document.getElementById('appUserForm')?.reset();
    document.getElementById('appUserFormError').textContent = '';
    state.selectedAppUsername = user?.username || '';

    const mode = user ? 'update' : 'create';
    setFieldValue('appUserMode', mode);
    setText('#appUserSheetTitle', user ? `Edit ${user.name}` : 'Tambah Pengguna');
    setText(
      '#appUserSheetSubtitle',
      user ? `@${user.username} · password dapat dibiarkan kosong.` : 'Buat akun sesuai tugas karyawan.'
    );
    setText('#submitAppUserButton', user ? 'Simpan Perubahan' : 'Simpan Pengguna');
    setText('#appUserPasswordLabel', user ? 'Password baru' : 'Password awal');
    setText('#appUserPasswordHelp', user ? 'Kosongkan bila password tidak diubah.' : 'Minimal enam karakter.');

    const usernameInput = document.getElementById('appUserUsername');
    const passwordInput = document.getElementById('appUserPassword');

    if (user) {
      usernameInput.value = user.username;
      usernameInput.readOnly = true;
      usernameInput.classList.add('inventory-readonly-control');
      setFieldValue('appUserName', user.name);
      setFieldValue('appUserRole', user.role);
      passwordInput.value = '';
      passwordInput.required = false;
      document.getElementById('appUserActive').checked = Boolean(user.active);
    } else {
      usernameInput.value = '';
      usernameInput.readOnly = false;
      usernameInput.classList.remove('inventory-readonly-control');
      setFieldValue('appUserName', '');
      setFieldValue('appUserRole', 'PRODUKSI');
      passwordInput.value = '';
      passwordInput.required = true;
      document.getElementById('appUserActive').checked = true;
    }

    renderAppUserRoleGuide();
    openSheet('appUserSheet', 'appUserSheetBackdrop');
    window.setTimeout(() => (user ? document.getElementById('appUserName') : usernameInput)?.focus(), 240);
  }

  function closeAppUserSheet(force = false) {
    if (state.appUserSubmitting && !force) return;
    closeSheet('appUserSheet', 'appUserSheetBackdrop');
    state.selectedAppUsername = '';
    document.body.classList.remove('sheet-is-open');
  }

  async function handleAppUserSubmit(event) {
    event.preventDefault();
    if (!isCurrentAppAdmin() || state.appUserSubmitting) return;

    const errorElement = document.getElementById('appUserFormError');
    const button = document.getElementById('submitAppUserButton');
    errorElement.textContent = '';

    try {
      const mode = document.getElementById('appUserMode')?.value || 'create';
      const payload = {
        username: document.getElementById('appUserUsername')?.value.trim().toLowerCase() || '',
        name: document.getElementById('appUserName')?.value.trim() || '',
        role: document.getElementById('appUserRole')?.value || 'PRODUKSI',
        password: document.getElementById('appUserPassword')?.value || '',
        active: Boolean(document.getElementById('appUserActive')?.checked)
      };

      if (!payload.username) throw new Error('Username wajib diisi.');
      if (!payload.name) throw new Error('Nama lengkap wajib diisi.');
      if (mode === 'create' && payload.password.length < 6) throw new Error('Password awal minimal enam karakter.');

      state.appUserSubmitting = true;
      setButtonLoading(button, true, mode === 'create' ? 'Membuat pengguna...' : 'Menyimpan...');

      const result = await window.MeramuAPI.request(
        mode === 'create' ? 'createAppUser' : 'updateAppUser',
        payload,
        {token: state.session.token, timeout: 45000}
      );

      state.appSettingsData.users = result.users || state.appSettingsData.users;
      renderAppSettingsUsers(state.appSettingsData.users);
      closeAppUserSheet(true);
      showToast(result.message || 'Pengguna berhasil disimpan.', 'success');
    } catch (error) {
      errorElement.textContent = error.message || 'Pengguna gagal disimpan.';
      shakeElement(document.getElementById('appUserForm'));
    } finally {
      state.appUserSubmitting = false;
      setButtonLoading(
        button,
        false,
        document.getElementById('appUserMode')?.value === 'create' ? 'Simpan Pengguna' : 'Simpan Perubahan'
      );
    }
  }

  async function toggleAppUserActive(user) {
    if (!isCurrentAppAdmin()) return;

    const nextActive = !user.active;
    const confirmed = window.confirm(
      `${nextActive ? 'Aktifkan' : 'Nonaktifkan'} akun ${user.name} (@${user.username})?`
    );
    if (!confirmed) return;

    try {
      const result = await window.MeramuAPI.request(
        'setAppUserActive',
        {username: user.username, active: nextActive},
        {token: state.session.token, timeout: 45000}
      );
      state.appSettingsData.users = result.users || state.appSettingsData.users;
      renderAppSettingsUsers(state.appSettingsData.users);
      showToast(result.message || 'Status pengguna berhasil diubah.', 'success');
    } catch (error) {
      showToast(error.message || 'Status pengguna gagal diubah.', 'error');
    }
  }

  async function changeOwnPassword() {
    const errorElement = document.getElementById('settingPasswordError');
    const button = document.getElementById('changeOwnPasswordButton');
    errorElement.textContent = '';

    const currentPassword = document.getElementById('settingCurrentPassword')?.value || '';
    const newPassword = document.getElementById('settingNewPassword')?.value || '';
    const confirmPassword = document.getElementById('settingConfirmPassword')?.value || '';

    try {
      if (!currentPassword) throw new Error('Password saat ini wajib diisi.');
      if (newPassword.length < 6) throw new Error('Password baru minimal enam karakter.');
      if (newPassword !== confirmPassword) throw new Error('Pengulangan password baru tidak sama.');

      setButtonLoading(button, true, 'Mengubah password...');
      const result = await window.MeramuAPI.request(
        'changeOwnPassword',
        {currentPassword, newPassword},
        {token: state.session.token, timeout: 45000}
      );

      ['settingCurrentPassword', 'settingNewPassword', 'settingConfirmPassword'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });
      showToast(result.message || 'Password berhasil diubah.', 'success');
    } catch (error) {
      errorElement.textContent = error.message || 'Password gagal diubah.';
    } finally {
      setButtonLoading(button, false, 'Ganti Password');
    }
  }

  async function syncAppCalendar() {
    if (!isCurrentAppAdmin()) return;
    const button = document.getElementById('syncAppCalendarButton');

    try {
      setButtonLoading(button, true, 'Menyinkronkan...');
      const result = await window.MeramuAPI.request(
        'syncAppCalendar',
        {},
        {token: state.session.token, timeout: 60000}
      );
      showToast(
        result.enabled === false
          ? result.message
          : `${result.message} ${result.result?.created || 0} pengingat baru dibuat.`,
        result.enabled === false ? 'warning' : 'success'
      );
      await loadAppSettings(true);
    } catch (error) {
      showToast(error.message || 'Kalender gagal disinkronkan.', 'error');
    } finally {
      setButtonLoading(button, false, 'Sinkronkan Kalender');
    }
  }

  async function testAppCalendar() {
    if (!isCurrentAppAdmin()) return;
    const button = document.getElementById('testAppCalendarButton');

    try {
      setButtonLoading(button, true, 'Membuat tes...');
      const result = await window.MeramuAPI.request(
        'testAppCalendar',
        {},
        {token: state.session.token, timeout: 60000}
      );
      showToast(
        `${result.message} Dijadwalkan ${formatDateTime(result.start)}.`,
        'success'
      );
      await loadAppSettings(true);
    } catch (error) {
      showToast(error.message || 'Tes kalender gagal dibuat.', 'error');
    } finally {
      setButtonLoading(button, false, 'Buat Tes Notifikasi');
    }
  }

  function openAppUsersPage() {
    state.appSettingsActiveTab = 'pengguna';
    navigate('pengaturan');
    renderAppSettingsTabs();
    loadAppSettings();
  }

  function openMasterRecipesPage() {
    if (!isCurrentAppAdmin()) {
      showToast('Hanya Administrator yang dapat mengelola Master Resep.', 'warning');
      return;
    }
    navigate('master-resep');
    renderMasterRecipesPage();
  }

  function recipeProcessLabel(process) {
    return String(process || '').toUpperCase() === 'F1' ? 'Batch F1' : 'Bottling';
  }

  function recipeVariantLabel(variant) {
    const labels = {
      SEMUA: 'Semua / F1',
      ORIGINAL: 'Original',
      TELANG: 'Telang',
      ROSELLA: 'Rosella',
      STARTER: 'Starter'
    };
    return labels[String(variant || '').toUpperCase()] || statusTitle(variant);
  }

  function recipeBasisLabel(basis) {
    return String(basis || '').toUpperCase() === 'PER_BOTOL'
      ? 'per botol'
      : 'per liter F1';
  }

  function recipeDirectionLabel(direction) {
    return String(direction || '').toUpperCase() === 'MASUK'
      ? 'Hasil Masuk'
      : 'Bahan Keluar';
  }

  function getMasterRecipeRows() {
    return Array.isArray(state.initialData?.recipes) ? state.initialData.recipes : [];
  }

  function getFilteredMasterRecipes() {
    const search = String(document.getElementById('masterRecipeSearch')?.value || '').trim().toLowerCase();
    const process = String(document.getElementById('masterRecipeProcessFilter')?.value || '').toUpperCase();
    const variant = String(document.getElementById('masterRecipeVariantFilter')?.value || '').toUpperCase();
    const direction = String(document.getElementById('masterRecipeDirectionFilter')?.value || '').toUpperCase();
    const activeFilter = String(document.getElementById('masterRecipeActiveFilter')?.value || '').toUpperCase();

    return getMasterRecipeRows()
      .filter((recipe) => {
        if (process && recipe.process !== process) return false;
        if (variant && recipe.variant !== variant) return false;
        if (direction && recipe.direction !== direction) return false;
        if (activeFilter === 'ACTIVE' && !recipe.active) return false;
        if (activeFilter === 'INACTIVE' && recipe.active) return false;

        if (search) {
          const item = state.itemMap.get(String(recipe.code || '').toUpperCase());
          const searchable = [
            recipe.recipeCode,
            recipe.process,
            recipe.variant,
            recipe.code,
            item?.name,
            item?.category,
            recipe.basis,
            recipe.direction,
            recipe.note
          ].filter(Boolean).join(' ').toLowerCase();
          if (!searchable.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const processOrder = {F1: 0, BOTTLING: 1};
        const variantOrder = {SEMUA: 0, ORIGINAL: 1, TELANG: 2, ROSELLA: 3, STARTER: 4};
        const processCompare = (processOrder[a.process] ?? 9) - (processOrder[b.process] ?? 9);
        if (processCompare !== 0) return processCompare;
        const variantCompare = (variantOrder[a.variant] ?? 9) - (variantOrder[b.variant] ?? 9);
        if (variantCompare !== 0) return variantCompare;
        if (a.direction !== b.direction) return a.direction === 'KELUAR' ? -1 : 1;
        return String(a.recipeCode).localeCompare(String(b.recipeCode), 'id');
      });
  }

  function resetMasterRecipeFilters() {
    ['masterRecipeSearch', 'masterRecipeProcessFilter', 'masterRecipeVariantFilter',
      'masterRecipeDirectionFilter', 'masterRecipeActiveFilter'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.value = '';
      });
    renderMasterRecipesPage();
  }

  function renderMasterRecipesPage() {
    const container = document.getElementById('masterRecipeGroups');
    if (!container) return;

    const allRows = getMasterRecipeRows();
    const filtered = getFilteredMasterRecipes();
    const active = allRows.filter((recipe) => recipe.active).length;
    const f1 = allRows.filter((recipe) => recipe.process === 'F1').length;
    const bottling = allRows.filter((recipe) => recipe.process === 'BOTTLING').length;
    const outputs = allRows.filter((recipe) => recipe.direction === 'MASUK').length;

    setText('#masterRecipeTotal', formatQuantity(allRows.length));
    setText('#masterRecipeActiveCount', formatQuantity(active));
    setText('#masterRecipeF1', formatQuantity(f1));
    setText('#masterRecipeBottling', formatQuantity(bottling));
    setText('#masterRecipeOutputs', formatQuantity(outputs));
    setText('#masterRecipeCount', `${filtered.length} baris`);
    setText(
      '#masterRecipeCaption',
      filtered.length
        ? `${filtered.length} dari ${allRows.length} baris resep ditampilkan.`
        : 'Tidak ada resep yang cocok dengan filter.'
    );

    container.replaceChildren();

    if (!filtered.length) {
      container.innerHTML = `
        <div class="card master-recipe-empty">
          <div class="empty-state-icon">⌕</div>
          <h3>Resep tidak ditemukan</h3>
          <p>Ubah pencarian atau filter, kemudian coba kembali.</p>
        </div>
      `;
      return;
    }

    const groups = new Map();
    filtered.forEach((recipe) => {
      const key = `${recipe.process}|${recipe.variant}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(recipe);
    });

    groups.forEach((recipes, key) => {
      const [process, variant] = key.split('|');
      container.append(createMasterRecipeGroup(process, variant, recipes));
    });
  }

  function createMasterRecipeGroup(process, variant, recipes) {
    const section = document.createElement('section');
    section.className = `card master-recipe-group process-${String(process).toLowerCase()}`;

    const header = document.createElement('div');
    header.className = 'master-recipe-group-header';

    const titleWrap = document.createElement('div');
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = recipeProcessLabel(process);
    const title = document.createElement('h3');
    title.textContent = recipeVariantLabel(variant);
    const caption = document.createElement('p');
    const activeCount = recipes.filter((recipe) => recipe.active).length;
    caption.textContent = `${recipes.length} baris · ${activeCount} aktif`;
    titleWrap.append(eyebrow, title, caption);

    const summary = document.createElement('div');
    summary.className = 'master-recipe-group-summary';
    const inputCount = recipes.filter((recipe) => recipe.direction === 'KELUAR').length;
    const outputCount = recipes.filter((recipe) => recipe.direction === 'MASUK').length;
    summary.innerHTML = `
      <span><strong>${inputCount}</strong> bahan keluar</span>
      <span><strong>${outputCount}</strong> hasil masuk</span>
    `;

    header.append(titleWrap, summary);

    const list = document.createElement('div');
    list.className = 'master-recipe-lines';
    recipes.forEach((recipe) => list.append(createMasterRecipeLine(recipe)));

    section.append(header, list);
    return section;
  }

  function createMasterRecipeLine(recipe) {
    const item = state.itemMap.get(String(recipe.code || '').toUpperCase()) || {};
    const line = document.createElement('article');
    line.className = `master-recipe-line ${recipe.active ? '' : 'is-inactive'} direction-${String(recipe.direction).toLowerCase()}`;

    const identity = document.createElement('div');
    identity.className = 'master-recipe-line-identity';

    const icon = document.createElement('span');
    icon.className = `master-recipe-line-icon ${masterItemTypeTone(item.type)}`;
    icon.innerHTML = masterItemTypeIcon(item.type);

    const copy = document.createElement('div');
    const direction = document.createElement('span');
    direction.className = `master-recipe-direction direction-${String(recipe.direction).toLowerCase()}`;
    direction.textContent = recipeDirectionLabel(recipe.direction);
    const name = document.createElement('strong');
    name.textContent = item.name || recipe.code;
    const meta = document.createElement('small');
    meta.textContent = `${recipe.recipeCode} · ${recipe.code} · ${item.category || 'Tanpa kategori'}`;
    copy.append(direction, name, meta);
    identity.append(icon, copy);

    const quantity = document.createElement('div');
    quantity.className = 'master-recipe-line-quantity';
    const quantityLabel = document.createElement('span');
    quantityLabel.textContent = 'Kebutuhan';
    const quantityValue = document.createElement('strong');
    quantityValue.textContent = `${formatQuantity(recipe.qty)} ${recipe.unit}`;
    const basis = document.createElement('small');
    basis.textContent = recipeBasisLabel(recipe.basis);
    quantity.append(quantityLabel, quantityValue, basis);

    const status = document.createElement('span');
    status.className = `master-recipe-status ${recipe.active ? 'is-active' : 'is-inactive'}`;
    status.textContent = recipe.active ? 'AKTIF' : 'NONAKTIF';

    const actions = document.createElement('div');
    actions.className = 'master-recipe-line-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn btn-secondary';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => openMasterRecipeSheet(recipe.recipeCode));

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = recipe.active ? 'btn btn-danger-soft' : 'btn btn-primary';
    toggleButton.textContent = recipe.active ? 'Nonaktifkan' : 'Aktifkan';
    toggleButton.addEventListener('click', () => toggleMasterRecipeActive(recipe));

    actions.append(editButton, toggleButton);
    line.append(identity, quantity, status, actions);
    return line;
  }

  function masterRecipeCodePrefix(process, variant) {
    if (String(process).toUpperCase() === 'F1') return 'RF1';
    const codes = {
      SEMUA: 'ALL',
      ORIGINAL: 'ORI',
      TELANG: 'TEL',
      ROSELLA: 'ROS',
      STARTER: 'STA'
    };
    return `RBT-${codes[String(variant || '').toUpperCase()] || 'GEN'}`;
  }

  function generateMasterRecipeCode(process, variant) {
    const prefix = masterRecipeCodePrefix(process, variant);
    const existing = new Set(getMasterRecipeRows().map((recipe) => recipe.recipeCode));
    let index = 1;
    let code;
    do {
      code = `${prefix}-${String(index).padStart(prefix === 'RF1' ? 3 : 2, '0')}`;
      index += 1;
    } while (existing.has(code));
    return code;
  }

  function renderMasterRecipeItemOptions(selectedCode = '') {
    const select = document.getElementById('masterRecipeItem');
    if (!select) return;

    const direction = String(document.getElementById('masterRecipeDirection')?.value || 'KELUAR').toUpperCase();
    const selected = String(selectedCode || select.value || '').toUpperCase();
    const currentRecipe = state.selectedMasterRecipeCode
      ? getMasterRecipeRows().find((recipe) => recipe.recipeCode === state.selectedMasterRecipeCode)
      : null;

    let items = (state.initialData?.items || [])
      .filter((item) => item.type !== 'LAINNYA')
      .filter((item) => item.active !== false || item.code === currentRecipe?.code);

    if (direction === 'MASUK') {
      items = items.filter((item) => ['PRODUK', 'INTERNAL'].includes(String(item.type).toUpperCase()));
    }

    items.sort((a, b) => {
      const typeCompare = String(a.type).localeCompare(String(b.type), 'id');
      if (typeCompare !== 0) return typeCompare;
      return String(a.name).localeCompare(String(b.name), 'id');
    });

    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pilih item';
    select.append(placeholder);

    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.code;
      option.textContent = `${item.code} · ${item.name} · ${item.unit}`;
      select.append(option);
    });

    select.value = items.some((item) => item.code === selected) ? selected : '';
  }

  function updateMasterRecipeFormRules() {
    const mode = document.getElementById('masterRecipeMode')?.value || 'create';
    const processInput = document.getElementById('masterRecipeProcess');
    const variantInput = document.getElementById('masterRecipeVariant');
    const directionInput = document.getElementById('masterRecipeDirection');
    const basisInput = document.getElementById('masterRecipeBasis');
    const codeInput = document.getElementById('masterRecipeCode');

    const process = String(processInput?.value || 'F1').toUpperCase();

    if (process === 'F1') {
      variantInput.value = 'SEMUA';
      variantInput.disabled = true;
      directionInput.value = 'KELUAR';
      directionInput.disabled = true;
      basisInput.value = 'PER_LITER';
      basisInput.disabled = true;
    } else {
      variantInput.disabled = false;
      directionInput.disabled = false;
      basisInput.disabled = false;
      if (variantInput.value === 'SEMUA' && directionInput.value === 'MASUK') {
        variantInput.value = 'ORIGINAL';
      }
      if (directionInput.value === 'MASUK' && variantInput.value === 'SEMUA') {
        variantInput.value = 'ORIGINAL';
      }
    }

    renderMasterRecipeItemOptions();

    if (mode === 'create' && state.masterRecipeAutoCode && codeInput) {
      codeInput.value = generateMasterRecipeCode(processInput.value, variantInput.value);
    }

    updateMasterRecipeItemPreview();
  }

  function updateMasterRecipeItemPreview() {
    const itemCode = String(document.getElementById('masterRecipeItem')?.value || '').toUpperCase();
    const item = state.itemMap.get(itemCode);
    const qty = toNumber(document.getElementById('masterRecipeQty')?.value);
    const basis = document.getElementById('masterRecipeBasis')?.value || 'PER_LITER';
    const direction = document.getElementById('masterRecipeDirection')?.value || 'KELUAR';

    setFieldValue('masterRecipeUnit', item?.unit || '');

    const preview = document.getElementById('masterRecipePreview');
    if (!preview) return;

    const title = preview.querySelector('strong');
    const detail = preview.querySelector('small');

    if (!item || qty <= 0) {
      if (title) title.textContent = 'Pilih item dan isi jumlah standar.';
      if (detail) detail.textContent = 'Contoh: 75 gram per 1 liter F1.';
      return;
    }

    if (title) {
      title.textContent = `${direction === 'MASUK' ? 'Hasilkan' : 'Gunakan'} ${formatQuantity(qty)} ${item.unit} ${item.name}`;
    }
    if (detail) {
      detail.textContent = basis === 'PER_BOTOL'
        ? 'Jumlah tersebut dihitung untuk setiap botol hasil.'
        : 'Jumlah tersebut dihitung untuk setiap 1 liter F1.';
    }
  }

  function openMasterRecipeSheet(recipeCode = '') {
    if (!isCurrentAppAdmin()) return;

    const recipe = recipeCode
      ? getMasterRecipeRows().find((row) => row.recipeCode === recipeCode)
      : null;

    document.getElementById('masterRecipeForm')?.reset();
    document.getElementById('masterRecipeFormError').textContent = '';
    state.selectedMasterRecipeCode = recipe?.recipeCode || '';
    state.masterRecipeAutoCode = !recipe;

    const mode = recipe ? 'update' : 'create';
    setFieldValue('masterRecipeMode', mode);
    setText('#masterRecipeSheetTitle', recipe ? `Edit ${recipe.recipeCode}` : 'Tambah Baris Resep');
    setText(
      '#masterRecipeSheetSubtitle',
      recipe
        ? `${recipeProcessLabel(recipe.process)} · ${recipeVariantLabel(recipe.variant)}`
        : 'Buat bahan keluar atau hasil masuk untuk produksi berikutnya.'
    );
    setText('#submitMasterRecipeButton', recipe ? 'Simpan Perubahan' : 'Simpan Baris Resep');

    const codeInput = document.getElementById('masterRecipeCode');

    if (recipe) {
      codeInput.value = recipe.recipeCode;
      codeInput.readOnly = true;
      codeInput.classList.add('inventory-readonly-control');
      setText('#masterRecipeCodeHelp', 'Kode resep tidak dapat diubah setelah dibuat.');

      setFieldValue('masterRecipeProcess', recipe.process);
      setFieldValue('masterRecipeVariant', recipe.variant);
      setFieldValue('masterRecipeDirection', recipe.direction);
      renderMasterRecipeItemOptions(recipe.code);
      setFieldValue('masterRecipeItem', recipe.code);
      setFieldValue('masterRecipeQty', recipe.qty);
      setFieldValue('masterRecipeBasis', recipe.basis);
      setFieldValue('masterRecipeUnit', recipe.unit);
      document.getElementById('masterRecipeActive').checked = Boolean(recipe.active);
      setFieldValue('masterRecipeNote', recipe.note);
      setText(
        '#masterRecipeSafetyNote',
        recipe.direction === 'MASUK'
          ? 'Satu varian bottling hanya boleh memiliki satu hasil masuk aktif.'
          : 'Perubahan jumlah berlaku pada proses produksi berikutnya.'
      );
    } else {
      codeInput.readOnly = false;
      codeInput.classList.remove('inventory-readonly-control');
      setFieldValue('masterRecipeProcess', 'F1');
      setFieldValue('masterRecipeVariant', 'SEMUA');
      setFieldValue('masterRecipeDirection', 'KELUAR');
      setFieldValue('masterRecipeQty', '');
      setFieldValue('masterRecipeBasis', 'PER_LITER');
      setFieldValue('masterRecipeUnit', '');
      document.getElementById('masterRecipeActive').checked = true;
      setFieldValue('masterRecipeNote', '');
      codeInput.value = generateMasterRecipeCode('F1', 'SEMUA');
      setText('#masterRecipeCodeHelp', 'Kode otomatis dapat disesuaikan sebelum disimpan.');
      setText(
        '#masterRecipeSafetyNote',
        'Satuan selalu mengikuti Master Item. Untuk satu varian bottling hanya boleh ada satu hasil masuk aktif.'
      );
    }

    updateMasterRecipeFormRules();

    if (recipe) {
      renderMasterRecipeItemOptions(recipe.code);
      setFieldValue('masterRecipeItem', recipe.code);
      updateMasterRecipeItemPreview();
    }

    openSheet('masterRecipeSheet', 'masterRecipeSheetBackdrop');
    window.setTimeout(() => document.getElementById('masterRecipeItem')?.focus(), 240);
  }

  function closeMasterRecipeSheet(force = false) {
    if (state.masterRecipeSubmitting && !force) return;
    closeSheet('masterRecipeSheet', 'masterRecipeSheetBackdrop');
    state.selectedMasterRecipeCode = '';
    document.body.classList.remove('sheet-is-open');
  }

  async function handleMasterRecipeSubmit(event) {
    event.preventDefault();
    if (!isCurrentAppAdmin() || state.masterRecipeSubmitting) return;

    const errorElement = document.getElementById('masterRecipeFormError');
    const button = document.getElementById('submitMasterRecipeButton');
    errorElement.textContent = '';

    try {
      const mode = document.getElementById('masterRecipeMode')?.value || 'create';
      const process = document.getElementById('masterRecipeProcess')?.value || 'F1';
      const variant = process === 'F1'
        ? 'SEMUA'
        : document.getElementById('masterRecipeVariant')?.value || 'ORIGINAL';
      const direction = process === 'F1'
        ? 'KELUAR'
        : document.getElementById('masterRecipeDirection')?.value || 'KELUAR';
      const basis = process === 'F1'
        ? 'PER_LITER'
        : document.getElementById('masterRecipeBasis')?.value || 'PER_LITER';

      const payload = {
        recipeCode: document.getElementById('masterRecipeCode')?.value.trim().toUpperCase() || '',
        process,
        variant,
        direction,
        code: document.getElementById('masterRecipeItem')?.value || '',
        qty: toNumber(document.getElementById('masterRecipeQty')?.value),
        basis,
        active: Boolean(document.getElementById('masterRecipeActive')?.checked),
        note: document.getElementById('masterRecipeNote')?.value.trim() || ''
      };

      if (!payload.recipeCode) throw new Error('Kode resep wajib diisi.');
      if (!payload.code) throw new Error('Item resep wajib dipilih.');
      if (payload.qty <= 0) throw new Error('Jumlah resep harus lebih dari 0.');

      state.masterRecipeSubmitting = true;
      setButtonLoading(button, true, mode === 'create' ? 'Membuat resep...' : 'Menyimpan...');

      const result = await window.MeramuAPI.request(
        mode === 'create' ? 'createMasterRecipe' : 'updateMasterRecipe',
        payload,
        {token: state.session.token, timeout: 45000}
      );

      if (state.initialData) state.initialData.recipes = result.recipes || state.initialData.recipes;
      closeMasterRecipeSheet(true);
      renderMasterRecipesPage();
      showToast(
        mode === 'create'
          ? `${result.recipe.recipeCode} berhasil dibuat.`
          : `${result.recipe.recipeCode} berhasil diperbarui.`,
        'success'
      );
      await refreshAppData({showToastOnError: false});
      navigate('master-resep');
    } catch (error) {
      errorElement.textContent = error.message || 'Master Resep gagal disimpan.';
      shakeElement(document.getElementById('masterRecipeForm'));
    } finally {
      state.masterRecipeSubmitting = false;
      setButtonLoading(
        button,
        false,
        document.getElementById('masterRecipeMode')?.value === 'create'
          ? 'Simpan Baris Resep'
          : 'Simpan Perubahan'
      );
    }
  }

  async function toggleMasterRecipeActive(recipe) {
    if (!isCurrentAppAdmin()) return;

    const nextActive = !recipe.active;
    const item = state.itemMap.get(String(recipe.code).toUpperCase());
    const confirmed = window.confirm(
      `${nextActive ? 'Aktifkan' : 'Nonaktifkan'} ${recipe.recipeCode} · ${item?.name || recipe.code}?\n\n` +
      (nextActive
        ? 'Baris ini akan langsung digunakan pada produksi berikutnya.'
        : 'Baris ini tidak akan digunakan sampai diaktifkan kembali.')
    );
    if (!confirmed) return;

    try {
      const result = await window.MeramuAPI.request(
        'setMasterRecipeActive',
        {recipeCode: recipe.recipeCode, active: nextActive},
        {token: state.session.token, timeout: 45000}
      );
      if (state.initialData) state.initialData.recipes = result.recipes || state.initialData.recipes;
      renderMasterRecipesPage();
      showToast(
        `${recipe.recipeCode} berhasil ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
        'success'
      );
    } catch (error) {
      showToast(error.message || 'Status resep gagal diubah.', 'error');
    }
  }

  function defaultProductionLabelStyle() {
    return {
      fontFamily: 'Arial, Helvetica, sans-serif',
      bodyFontSize: 10.5,
      brandFontSize: 16,
      estimateFontSize: 17,
      rowGap: 1.2,
      contentWidth: 52,
      logoSize: 13,
      valueWeight: 800,
      logoPosition: 'CENTER',
      valueAlign: 'RIGHT',
      separatorStyle: 'EQUAL',
      labelCase: 'NORMAL'
    };
  }

  function productionLabelStyleStorageKey() {
    return 'meramu_production_label_style_58mm';
  }

  function normalizeProductionLabelStyle(style) {
    const defaults = defaultProductionLabelStyle();
    const merged = {...defaults, ...(style || {})};
    const clamp = (value, min, max, fallback) => {
      const number = Number(value);
      return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
    };

    const allowedFonts = [
      'Arial, Helvetica, sans-serif',
      "'Courier New', Courier, monospace",
      'Verdana, Geneva, sans-serif',
      'Tahoma, Geneva, sans-serif',
      "'Trebuchet MS', Arial, sans-serif",
      'Georgia, serif'
    ];

    return {
      fontFamily: allowedFonts.includes(merged.fontFamily) ? merged.fontFamily : defaults.fontFamily,
      bodyFontSize: clamp(merged.bodyFontSize, 8, 16, defaults.bodyFontSize),
      brandFontSize: clamp(merged.brandFontSize, 12, 24, defaults.brandFontSize),
      estimateFontSize: clamp(merged.estimateFontSize, 12, 24, defaults.estimateFontSize),
      rowGap: clamp(merged.rowGap, 0.5, 3, defaults.rowGap),
      contentWidth: clamp(merged.contentWidth, 46, 54, defaults.contentWidth),
      logoSize: clamp(merged.logoSize, 8, 18, defaults.logoSize),
      valueWeight: [600, 700, 800, 900].includes(Number(merged.valueWeight))
        ? Number(merged.valueWeight)
        : defaults.valueWeight,
      logoPosition: ['LEFT', 'CENTER', 'RIGHT'].includes(merged.logoPosition)
        ? merged.logoPosition
        : defaults.logoPosition,
      valueAlign: ['LEFT', 'RIGHT'].includes(merged.valueAlign)
        ? merged.valueAlign
        : defaults.valueAlign,
      separatorStyle: ['EQUAL', 'DASH', 'SOLID'].includes(merged.separatorStyle)
        ? merged.separatorStyle
        : defaults.separatorStyle,
      labelCase: ['NORMAL', 'UPPERCASE'].includes(merged.labelCase)
        ? merged.labelCase
        : defaults.labelCase
    };
  }

  function ensureProductionLabelStyle() {
    if (state.productionLabelStyle) return state.productionLabelStyle;

    try {
      const raw = localStorage.getItem(productionLabelStyleStorageKey());
      state.productionLabelStyle = normalizeProductionLabelStyle(raw ? JSON.parse(raw) : null);
    } catch {
      state.productionLabelStyle = defaultProductionLabelStyle();
    }

    return state.productionLabelStyle;
  }

  function saveProductionLabelStyle() {
    try {
      localStorage.setItem(
        productionLabelStyleStorageKey(),
        JSON.stringify(state.productionLabelStyle)
      );
      setText('#productionLabelStyleStatus', 'Pengaturan tersimpan otomatis di perangkat ini.');
    } catch {
      setText('#productionLabelStyleStatus', 'Pengaturan aktif, tetapi browser tidak dapat menyimpannya.');
    }
  }

  function populateProductionLabelStyleControls() {
    const style = ensureProductionLabelStyle();
    setFieldValue('productionLabelFontFamily', style.fontFamily);
    setFieldValue('productionLabelBodyFontSize', style.bodyFontSize);
    setFieldValue('productionLabelBrandFontSize', style.brandFontSize);
    setFieldValue('productionLabelEstimateFontSize', style.estimateFontSize);
    setFieldValue('productionLabelRowGap', style.rowGap);
    setFieldValue('productionLabelContentWidth', style.contentWidth);
    setFieldValue('productionLabelLogoSize', style.logoSize);
    setFieldValue('productionLabelValueWeight', String(style.valueWeight));
    setFieldValue('productionLabelLogoPosition', style.logoPosition);
    setFieldValue('productionLabelValueAlign', style.valueAlign);
    setFieldValue('productionLabelSeparatorStyle', style.separatorStyle);
    setFieldValue('productionLabelLabelCase', style.labelCase);
  }

  function readProductionLabelStyleControls() {
    return normalizeProductionLabelStyle({
      fontFamily: document.getElementById('productionLabelFontFamily')?.value,
      bodyFontSize: document.getElementById('productionLabelBodyFontSize')?.value,
      brandFontSize: document.getElementById('productionLabelBrandFontSize')?.value,
      estimateFontSize: document.getElementById('productionLabelEstimateFontSize')?.value,
      rowGap: document.getElementById('productionLabelRowGap')?.value,
      contentWidth: document.getElementById('productionLabelContentWidth')?.value,
      logoSize: document.getElementById('productionLabelLogoSize')?.value,
      valueWeight: document.getElementById('productionLabelValueWeight')?.value,
      logoPosition: document.getElementById('productionLabelLogoPosition')?.value,
      valueAlign: document.getElementById('productionLabelValueAlign')?.value,
      separatorStyle: document.getElementById('productionLabelSeparatorStyle')?.value,
      labelCase: document.getElementById('productionLabelLabelCase')?.value
    });
  }

  function handleProductionLabelStyleChange() {
    state.productionLabelStyle = readProductionLabelStyleControls();
    saveProductionLabelStyle();
    applyProductionLabelStylePreview();
  }

  function resetProductionLabelStyle() {
    state.productionLabelStyle = defaultProductionLabelStyle();
    saveProductionLabelStyle();
    populateProductionLabelStyleControls();
    applyProductionLabelStylePreview();
    showToast('Tampilan label dikembalikan ke setelan awal.', 'success');
  }

  function productionLabelSeparatorText(style) {
    if (style.separatorStyle === 'DASH') return '--------------------';
    if (style.separatorStyle === 'SOLID') return '';
    return '====================';
  }

  function productionLabelAlignment(position) {
    if (position === 'LEFT') return 'left';
    if (position === 'RIGHT') return 'right';
    return 'center';
  }

  function applyProductionLabelStylePreview() {
    const style = ensureProductionLabelStyle();
    const label = document.getElementById('thermalProductionLabel');
    if (!label) return;

    const brand = document.getElementById('thermalLabelBrand');
    const logo = brand?.querySelector('img');
    const brandTitle = brand?.querySelector('strong');
    const rows = document.getElementById('thermalLabelRows');
    const estimateDate = document.querySelector('#thermalLabelEstimate strong');

    label.style.width = `${Math.min(58, style.contentWidth + 6)}mm`;
    label.style.fontFamily = style.fontFamily;
    label.style.fontSize = `${style.bodyFontSize}pt`;

    if (brand) brand.style.textAlign = productionLabelAlignment(style.logoPosition);
    if (logo) {
      logo.style.width = `${style.logoSize}mm`;
      logo.style.height = `${style.logoSize}mm`;
      logo.style.marginLeft = style.logoPosition === 'LEFT' ? '0' : 'auto';
      logo.style.marginRight = style.logoPosition === 'RIGHT' ? '0' : 'auto';
    }
    if (brandTitle) brandTitle.style.fontSize = `${style.brandFontSize}pt`;
    if (rows) rows.style.gap = `${style.rowGap}mm`;
    if (estimateDate) estimateDate.style.fontSize = `${style.estimateFontSize}pt`;

    label.querySelectorAll('.thermal-label-rows strong').forEach((element) => {
      element.style.fontWeight = String(style.valueWeight);
      element.style.textAlign = style.valueAlign.toLowerCase();
    });

    label.querySelectorAll('.thermal-label-rows span').forEach((element) => {
      element.style.textTransform = style.labelCase === 'UPPERCASE' ? 'uppercase' : 'none';
    });

    label.querySelectorAll('[data-label-separator]').forEach((element) => {
      element.textContent = productionLabelSeparatorText(style);
      element.classList.toggle('is-solid', style.separatorStyle === 'SOLID');
    });
  }

  function openProductionLabelPage() {
    if (!['ADMIN', 'PRODUKSI'].includes(currentApplicationRole())) {
      showToast('Label produksi hanya tersedia untuk Administrator dan Produksi.', 'warning');
      return;
    }

    navigate('label-print');
    renderProductionLabelPage();
  }

  function productionLabelBatches() {
    return [...(state.batches || [])]
      .filter((batch) => batch && batch['Batch ID'])
      .sort((a, b) => {
        const dateCompare = parseAnyDate(b.Timestamp || b['Tanggal F1']) -
          parseAnyDate(a.Timestamp || a['Tanggal F1']);
        if (dateCompare !== 0) return dateCompare;
        return String(b['Batch ID']).localeCompare(String(a['Batch ID']), 'id');
      });
  }

  function getSelectedProductionLabelBatch() {
    const batches = productionLabelBatches();
    if (!batches.length) return null;

    const selected = batches.find((batch) =>
      String(batch['Batch ID']) === String(state.selectedLabelBatchId)
    );

    return selected || batches[0];
  }

  function productionLabelEstimateDate(batch) {
    const existing = parseAnyDate(batch?.['Estimasi F2']);
    if (existing.getTime()) return existing;

    const start = parseAnyDate(batch?.['Tanggal F1']);
    if (!start.getTime()) return new Date(0);

    const fallbackDays = Math.max(
      1,
      Math.round(toNumber(state.initialData?.settings?.F1_IDEAL_DAYS || 8))
    );
    const estimate = new Date(start);
    estimate.setDate(estimate.getDate() + fallbackDays);
    return estimate;
  }

  function formatNumericDate(value) {
    const date = value instanceof Date ? value : parseAnyDate(value);
    if (!date?.getTime()) return '00/00/0000';

    const pad = (number) => String(number).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  function productionLabelData(batch) {
    if (!batch) {
      return {
        date: '00/00/0000',
        batchId: '-',
        volume: '-',
        ph: '-',
        brix: '-',
        starter: '-',
        estimate: '00/00/0000'
      };
    }

    const starter = batch['Starter (ml)'];
    return {
      date: formatNumericDate(batch['Tanggal F1']),
      batchId: String(batch['Batch ID'] || '-'),
      volume: `${formatQuantity(batch['Volume Batch (L)'])} L`,
      ph: batch['pH Awal'] === '' || batch['pH Awal'] === undefined
        ? '-'
        : formatQuantity(batch['pH Awal']),
      brix: batch['Brix Awal'] === '' || batch['Brix Awal'] === undefined
        ? '-'
        : formatQuantity(batch['Brix Awal']),
      starter: starter === '' || starter === undefined
        ? '-'
        : `${formatQuantity(starter)} ml`,
      estimate: formatNumericDate(productionLabelEstimateDate(batch))
    };
  }

  function renderProductionLabelPage() {
    const select = document.getElementById('productionLabelBatchSelect');
    if (!select) return;

    ensureProductionLabelStyle();
    populateProductionLabelStyleControls();
    applyProductionLabelStylePreview();

    const batches = productionLabelBatches();
    const current = getSelectedProductionLabelBatch();

    if (!state.selectedLabelBatchId && current) {
      state.selectedLabelBatchId = String(current['Batch ID']);
    }

    select.replaceChildren();

    if (!batches.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Belum ada batch produksi';
      select.append(option);
      select.disabled = true;
      document.getElementById('printProductionLabelButton').disabled = true;
      setText('#productionLabelStatus', 'BELUM ADA BATCH');
      renderProductionLabelPreview();
      return;
    }

    batches.forEach((batch) => {
      const option = document.createElement('option');
      option.value = String(batch['Batch ID']);
      option.textContent =
        `${batch['Batch ID']} · ${formatNumericDate(batch['Tanggal F1'])} · ` +
        `${formatQuantity(batch['Volume Batch (L)'])} L`;
      select.append(option);
    });

    const selectedExists = batches.some((batch) =>
      String(batch['Batch ID']) === String(state.selectedLabelBatchId)
    );
    if (!selectedExists) state.selectedLabelBatchId = String(batches[0]['Batch ID']);

    select.value = state.selectedLabelBatchId;
    select.disabled = false;
    document.getElementById('printProductionLabelButton').disabled = false;
    setText('#productionLabelStatus', 'SIAP DICETAK');
    renderProductionLabelPreview();
  }

  function renderProductionLabelPreview() {
    const batch = getSelectedProductionLabelBatch();
    const data = productionLabelData(batch);

    setText('#labelPrintDate', data.date);
    setText('#labelPrintBatchId', data.batchId);
    setText('#labelPrintVolume', data.volume);
    setText('#labelPrintPh', data.ph);
    setText('#labelPrintBrix', data.brix);
    setText('#labelPrintStarter', data.starter);
    setText('#labelPrintEstimate', data.estimate);

    setText('#productionLabelSummaryDate', data.date);
    setText('#productionLabelSummaryVolume', data.volume);
    setText('#productionLabelSummaryEstimate', data.estimate);
    setText('#productionLabelSummaryStarter', data.starter);
    applyProductionLabelStylePreview();
  }

  function productionLabelPrintDocument(data, logoUrl, style) {
    const separatorText = productionLabelSeparatorText(style);
    const separatorClass = style.separatorStyle === 'SOLID' ? 'separator solid' : 'separator';
    const logoAlign = productionLabelAlignment(style.logoPosition);
    const valueAlign = style.valueAlign.toLowerCase();
    const labelTransform = style.labelCase === 'UPPERCASE' ? 'uppercase' : 'none';
    const logoMarginLeft = style.logoPosition === 'LEFT' ? '0' : 'auto';
    const logoMarginRight = style.logoPosition === 'RIGHT' ? '0' : 'auto';

    return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Label Produksi ${escapeHtml(data.batchId)}</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: 58mm;
      min-width: 58mm;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
    }

    body {
      padding: 2.5mm 2mm 3mm;
      font-family: ${style.fontFamily};
      font-size: ${style.bodyFontSize}pt;
      line-height: 1.3;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .label {
      width: ${style.contentWidth}mm;
      max-width: 54mm;
      margin: 0 auto;
    }

    .brand {
      text-align: ${logoAlign};
    }

    .brand img {
      display: block;
      width: ${style.logoSize}mm;
      height: ${style.logoSize}mm;
      margin-top: 0;
      margin-right: ${logoMarginRight};
      margin-bottom: 1mm;
      margin-left: ${logoMarginLeft};
      object-fit: contain;
      filter: grayscale(1) contrast(1.35);
    }

    .brand strong {
      display: block;
      font-size: ${style.brandFontSize}pt;
      font-weight: 900;
      letter-spacing: .6mm;
    }

    .separator {
      overflow: hidden;
      margin: 1.6mm 0;
      font-family: "Courier New", monospace;
      font-size: 9.5pt;
      font-weight: 700;
      line-height: 1;
      text-align: center;
      white-space: nowrap;
    }

    .separator.solid {
      height: 0;
      border-top: 1px solid #000;
      font-size: 0;
    }

    .rows {
      display: grid;
      gap: ${style.rowGap}mm;
    }

    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: baseline;
      gap: 2mm;
    }

    .row span {
      min-width: 0;
      text-align: left;
      text-transform: ${labelTransform};
    }

    .row strong {
      max-width: 27mm;
      overflow-wrap: anywhere;
      text-align: ${valueAlign};
      font-weight: ${style.valueWeight};
    }

    .estimate {
      padding: .5mm 0;
      text-align: center;
    }

    .estimate span,
    .estimate strong {
      display: block;
    }

    .estimate span {
      font-size: 10pt;
      font-weight: 700;
    }

    .estimate strong {
      margin-top: 1.2mm;
      font-size: ${style.estimateFontSize}pt;
      font-weight: 900;
      letter-spacing: .4mm;
    }

    @media print {
      html,
      body {
        width: 58mm !important;
      }

      body {
        padding: 2.5mm 2mm 3mm !important;
      }
    }
  </style>
</head>
<body>
  <article class="label">
    <header class="brand">
      <img src="${escapeHtml(logoUrl)}" alt="Logo MERAMU">
      <strong>MERAMU</strong>
    </header>

    <div class="${separatorClass}">${escapeHtml(separatorText)}</div>

    <section class="rows">
      <div class="row"><span>Tanggal Produksi</span><strong>${escapeHtml(data.date)}</strong></div>
      <div class="row"><span>Batch ID</span><strong>${escapeHtml(data.batchId)}</strong></div>
      <div class="row"><span>Volume F1</span><strong>${escapeHtml(data.volume)}</strong></div>
      <div class="row"><span>pH Awal</span><strong>${escapeHtml(data.ph)}</strong></div>
      <div class="row"><span>Brix Awal</span><strong>${escapeHtml(data.brix)}</strong></div>
      <div class="row"><span>Air Starter</span><strong>${escapeHtml(data.starter)}</strong></div>
    </section>

    <div class="${separatorClass}">${escapeHtml(separatorText)}</div>

    <section class="estimate">
      <span>Estimasi Tanggal F2</span>
      <strong>${escapeHtml(data.estimate)}</strong>
    </section>

    <div class="${separatorClass}">${escapeHtml(separatorText)}</div>
  </article>
</body>
</html>`;
  }

  function printProductionLabel58mm() {
    const batch = getSelectedProductionLabelBatch();
    if (!batch) {
      showToast('Belum ada batch produksi yang dapat dicetak.', 'warning');
      return;
    }

    const data = productionLabelData(batch);
    const style = ensureProductionLabelStyle();
    const logoUrl = new URL('assets/images/logo-meramu.png', window.location.href).href;
    const printWindow = window.open('', '_blank', 'width=420,height=720');

    if (!printWindow) {
      showToast('Popup cetak diblokir browser. Izinkan popup untuk aplikasi MERAMU.', 'warning');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(productionLabelPrintDocument(data, logoUrl, style));
    printWindow.document.close();

    const runPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 180);
    };

    const image = printWindow.document.querySelector('img');
    if (image && !image.complete) {
      image.addEventListener('load', runPrint, {once: true});
      image.addEventListener('error', runPrint, {once: true});
      window.setTimeout(runPrint, 1200);
    } else {
      runPrint();
    }
  }

  function stockGroupConfig(group) {
    const normalized = String(group || 'BAHAN').toUpperCase();
    const configs = {
      BAHAN: {
        key: 'BAHAN',
        title: 'Stok Bahan',
        eyebrow: 'Bahan produksi',
        description: 'Teh, gula, air, telang, rosella, dan kebutuhan fermentasi.',
        listTitle: 'Daftar bahan',
        types: ['BAHAN'],
        actionLabel: 'Catat Pembelian',
        emptyText: 'Belum ada bahan aktif pada Master Item.'
      },
      KEMASAN: {
        key: 'KEMASAN',
        title: 'Stok Kemasan',
        eyebrow: 'Kemasan dan pengiriman',
        description: 'Botol, stiker, kardus, bubble wrap, dan perlengkapan pengemasan.',
        listTitle: 'Daftar kemasan',
        types: ['KEMASAN'],
        actionLabel: 'Catat Pembelian',
        emptyText: 'Belum ada kemasan aktif pada Master Item.'
      },
      PRODUK: {
        key: 'PRODUK',
        title: 'Stok Produk',
        eyebrow: 'Produk siap jual dan starter',
        description: 'Kombucha Original, Telang, Rosella, dan starter yang tersedia.',
        listTitle: 'Daftar produk dan starter',
        types: ['PRODUK', 'INTERNAL'],
        actionLabel: 'Catat Penjualan',
        emptyText: 'Belum ada produk atau starter aktif pada Master Item.'
      }
    };
    return configs[normalized] || configs.BAHAN;
  }

  function openStockDetailPage(group) {
    const stockConfig = stockGroupConfig(group);
    state.stockDetailGroup = stockConfig.key;
    localStorage.setItem(config.STOCK_DETAIL_GROUP_KEY, stockConfig.key);
    resetStockDetailFilters(false);
    navigate('stok-detail');
    renderStockDetailPage();
  }

  function resetStockDetailFilters(shouldRender = true) {
    const search = document.getElementById('stockDetailSearch');
    const status = document.getElementById('stockDetailStatus');
    const category = document.getElementById('stockDetailCategory');

    if (search) search.value = '';
    if (status) status.value = '';
    if (category) category.value = '';

    if (shouldRender) renderStockDetailPage();
  }

  function getStockSnapshotForItem(item) {
    const code = String(item?.code || '').toUpperCase();
    const stockRow = state.stockMap.get(code);
    const stock = toNumber(stockRow?.stock ?? item?.stock);
    const averageCost = toNumber(item?.averageCost ?? stockRow?.averageCost);
    const minStock = toNumber(item?.minStock ?? stockRow?.minStock);
    const status = item?.type === 'LAINNYA'
      ? 'N/A'
      : stock <= 0
        ? 'HABIS'
        : stock <= minStock
          ? 'MENIPIS'
          : 'AMAN';

    return {
      ...item,
      stock,
      minStock,
      averageCost,
      sellPrice: toNumber(item?.sellPrice ?? stockRow?.sellPrice),
      stockValue: stock * averageCost,
      status
    };
  }

  function getStockGroupItems(group = state.stockDetailGroup, includeInactive = false) {
    const config = stockGroupConfig(group);
    return (state.initialData?.items || [])
      .filter((item) => includeInactive || item.active !== false)
      .filter((item) => config.types.includes(String(item.type || '').toUpperCase()))
      .map(getStockSnapshotForItem)
      .sort((a, b) => {
        const statusOrder = {HABIS: 0, MENIPIS: 1, AMAN: 2, 'N/A': 3};
        const statusCompare = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
        if (statusCompare !== 0) return statusCompare;
        return String(a.name || '').localeCompare(String(b.name || ''), 'id');
      });
  }

  function populateStockDetailCategories(items) {
    const select = document.getElementById('stockDetailCategory');
    if (!select) return;

    const selected = select.value;
    const categories = Array.from(new Set(
      (items || []).map((item) => String(item.category || '').trim()).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'id'));

    select.replaceChildren();
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'Semua kategori';
    select.append(all);

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.append(option);
    });

    select.value = categories.includes(selected) ? selected : '';
  }

  function getFilteredStockDetailItems() {
    const allItems = getStockGroupItems();
    populateStockDetailCategories(allItems);

    const search = String(document.getElementById('stockDetailSearch')?.value || '').trim().toLowerCase();
    const status = String(document.getElementById('stockDetailStatus')?.value || '').toUpperCase();
    const category = String(document.getElementById('stockDetailCategory')?.value || '');

    return allItems.filter((item) => {
      if (status && item.status !== status) return false;
      if (category && String(item.category || '') !== category) return false;
      if (search) {
        const searchable = `${item.code} ${item.name} ${item.category} ${item.unit}`.toLowerCase();
        if (!searchable.includes(search)) return false;
      }
      return true;
    });
  }

  function renderStockDetailPage() {
    const container = document.getElementById('stockDetailList');
    if (!container) return;

    const config = stockGroupConfig(state.stockDetailGroup);
    const allItems = getStockGroupItems();
    const filteredItems = getFilteredStockDetailItems();

    setText('#stockDetailEyebrow', config.eyebrow);
    setText('#stockDetailTitle', config.title);
    setText('#stockDetailDescription', config.description);
    setText('#stockDetailListTitle', config.listTitle);
    setText('#stockDetailPrimaryAction', config.actionLabel);

    const stockValue = allItems.reduce((sum, item) => sum + item.stockValue, 0);
    const low = allItems.filter((item) => item.status === 'MENIPIS').length;
    const out = allItems.filter((item) => item.status === 'HABIS').length;

    setText('#stockDetailTotalItems', formatQuantity(allItems.length));
    setText('#stockDetailTotalCaption', `${filteredItems.length} item sesuai filter`);
    setText('#stockDetailStockValue', formatCurrency(stockValue));
    setText('#stockDetailLowItems', formatQuantity(low));
    setText('#stockDetailOutItems', formatQuantity(out));
    setText('#stockDetailCount', `${filteredItems.length} item`);
    setText(
      '#stockDetailListCaption',
      filteredItems.length
        ? `${filteredItems.length} dari ${allItems.length} item ditampilkan.`
        : 'Tidak ada item yang cocok dengan filter.'
    );

    container.replaceChildren();

    if (!filteredItems.length) {
      container.innerHTML = `
        <div class="card stock-detail-empty">
          <div class="empty-state-icon">□</div>
          <h3>Item tidak ditemukan</h3>
          <p>${escapeHtml(allItems.length ? 'Ubah pencarian, status, atau kategori.' : config.emptyText)}</p>
        </div>
      `;
      return;
    }

    filteredItems.forEach((item) => {
      container.append(createStockDetailCard(item));
    });
  }

  function createStockDetailCard(item) {
    const card = document.createElement('article');
    card.className = `card stock-detail-card status-${String(item.status || '').toLowerCase()}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Lihat detail stok ${item.name}`);

    const open = () => openStockItemDetail(item.code);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });

    const header = document.createElement('div');
    header.className = 'stock-detail-card-header';

    const identity = document.createElement('div');
    identity.className = 'stock-detail-card-identity';

    const icon = document.createElement('span');
    icon.className = `stock-detail-card-icon ${masterItemTypeTone(item.type)}`;
    icon.innerHTML = masterItemTypeIcon(item.type);

    const copy = document.createElement('div');
    copy.className = 'stock-detail-card-copy';

    const category = document.createElement('span');
    category.textContent = item.category || masterItemTypeLabel(item.type);

    const name = document.createElement('strong');
    name.textContent = item.name;

    const code = document.createElement('small');
    code.textContent = `${item.code} · ${item.unit}`;

    copy.append(category, name, code);
    identity.append(icon, copy);

    const status = document.createElement('span');
    status.className = `stock-detail-status status-${String(item.status || '').toLowerCase()}`;
    status.textContent = item.status;

    header.append(identity, status);

    const metrics = document.createElement('div');
    metrics.className = 'stock-detail-card-metrics';

    [
      ['Stok tersedia', `${formatQuantity(item.stock)} ${item.unit}`.trim()],
      ['Stok minimum', `${formatQuantity(item.minStock)} ${item.unit}`.trim()],
      ['HPP rata-rata', formatCurrency(item.averageCost)],
      ['Nilai stok', formatCurrency(item.stockValue)]
    ].forEach(([label, value]) => {
      const metric = document.createElement('div');
      const labelElement = document.createElement('span');
      labelElement.textContent = label;
      const valueElement = document.createElement('strong');
      valueElement.textContent = value;
      metric.append(labelElement, valueElement);
      metrics.append(metric);
    });

    const footer = document.createElement('div');
    footer.className = 'stock-detail-card-footer';

    const note = document.createElement('span');
    note.textContent = item.note || (
      item.type === 'PRODUK'
        ? `Harga jual ${formatCurrency(item.sellPrice)}`
        : 'Klik untuk melihat mutasi terbaru'
    );

    const action = document.createElement('span');
    action.className = 'stock-detail-card-action';
    action.innerHTML = 'Lihat detail <span class="chevron" aria-hidden="true"></span>';

    footer.append(note, action);
    card.append(header, metrics, footer);
    return card;
  }

  function handleStockDetailPrimaryAction() {
    if (state.stockDetailGroup === 'PRODUK') openSaleSheet();
    else openPurchaseSheet();
  }

  function getItemTransactionRows(code, limit = 15) {
    const normalized = String(code || '').toUpperCase();
    return (state.transactions || [])
      .filter((row) => String(row['Kode Item'] || '').toUpperCase() === normalized)
      .sort((a, b) => parseAnyDate(b.Timestamp || b.Tanggal) - parseAnyDate(a.Timestamp || a.Tanggal))
      .slice(0, limit);
  }

  function openStockItemDetail(code) {
    const item = state.itemMap.get(String(code || '').toUpperCase());
    if (!item) {
      showToast('Item tidak ditemukan pada Master Item.', 'warning');
      return;
    }

    state.selectedStockItemCode = String(item.code || '').toUpperCase();
    const snapshot = getStockSnapshotForItem(item);

    setText('#stockItemDetailKicker', `${masterItemTypeLabel(item.type)} · ${item.category || '-'}`);
    setText('#stockItemDetailTitle', item.name);
    setText('#stockItemDetailSubtitle', `${item.code} · ${snapshot.status} · ${snapshot.unit}`);

    const body = document.getElementById('stockItemDetailBody');
    if (body) body.innerHTML = buildStockItemDetail(snapshot);

    const editButton = document.getElementById('editStockItemMasterButton');
    if (editButton) editButton.hidden = !isMasterAdmin();

    openSheet('stockItemDetailSheet', 'stockItemDetailBackdrop');
  }

  function closeStockItemDetail(force = false) {
    closeSheet('stockItemDetailSheet', 'stockItemDetailBackdrop');
    if (!force) state.selectedStockItemCode = '';
    document.body.classList.remove('sheet-is-open');
  }

  function buildStockItemDetail(item) {
    const transactionRows = getItemTransactionRows(item.code);
    const priceMetric = masterItemPriceMetric(item);
    const transactionHtml = transactionRows.length
      ? transactionRows.map((row) => {
          const qtyIn = toNumber(row['Qty Masuk']);
          const qtyOut = toNumber(row['Qty Keluar']);
          const movement = qtyIn > 0
            ? `+${formatQuantity(qtyIn)} ${row.Satuan || item.unit}`
            : qtyOut > 0
              ? `-${formatQuantity(qtyOut)} ${row.Satuan || item.unit}`
              : '0';
          const tone = qtyIn > 0 ? 'in' : qtyOut > 0 ? 'out' : 'neutral';
          const value = toNumber(row['Nilai Stok Masuk']) > 0
            ? `+${formatCurrency(row['Nilai Stok Masuk'])}`
            : toNumber(row['Nilai Stok Keluar/HPP']) > 0
              ? `-${formatCurrency(row['Nilai Stok Keluar/HPP'])}`
              : 'Rp0';

          return `
            <article class="stock-item-mutation-row">
              <div class="stock-item-mutation-icon ${tone}">
                ${transactionIcon(String(row['Jenis Transaksi'] || '').toUpperCase())}
              </div>
              <div class="stock-item-mutation-copy">
                <strong>${escapeHtml(transactionTypeTitle(row['Jenis Transaksi']))}</strong>
                <span>${escapeHtml(row['Referensi ID'] || row['Transaksi ID'] || '-')} · ${escapeHtml(formatDateTime(row.Timestamp || row.Tanggal))}</span>
              </div>
              <div class="stock-item-mutation-value">
                <strong class="${tone}">${escapeHtml(movement)}</strong>
                <span>${escapeHtml(value)}</span>
              </div>
            </article>
          `;
        }).join('')
      : '<div class="stock-item-mutation-empty">Belum ada mutasi pada 1.000 jurnal terbaru.</div>';

    return `
      <section class="stock-item-detail-kpi-grid">
        <div class="status-${escapeHtml(String(item.status || '').toLowerCase())}">
          <span>Stok sekarang</span>
          <strong>${escapeHtml(formatQuantity(item.stock))} ${escapeHtml(item.unit || '')}</strong>
          <small>${escapeHtml(item.status)}</small>
        </div>
        <div>
          <span>Stok minimum</span>
          <strong>${escapeHtml(formatQuantity(item.minStock))} ${escapeHtml(item.unit || '')}</strong>
          <small>Batas perhatian</small>
        </div>
        <div>
          <span>HPP rata-rata</span>
          <strong>${escapeHtml(formatCurrency(item.averageCost))}</strong>
          <small>Biaya persediaan</small>
        </div>
        <div>
          <span>Nilai stok</span>
          <strong>${escapeHtml(formatCurrency(item.stockValue))}</strong>
          <small>Stok × HPP</small>
        </div>
        <div class="price-${escapeHtml(priceMetric.tone)}">
          <span>${escapeHtml(priceMetric.label)}</span>
          <strong>${escapeHtml(priceMetric.value)}</strong>
          <small>${escapeHtml(priceMetric.caption)}</small>
        </div>
      </section>

      <section class="stock-item-detail-section">
        <div class="stock-item-detail-section-heading">
          <div>
            <span class="sheet-kicker">Identitas item</span>
            <h3>Master persediaan</h3>
          </div>
          <span class="stock-detail-status status-${escapeHtml(String(item.status || '').toLowerCase())}">
            ${escapeHtml(item.status)}
          </span>
        </div>

        <div class="stock-item-detail-meta-grid">
          <div><span>Kode item</span><strong>${escapeHtml(item.code)}</strong></div>
          <div><span>Jenis</span><strong>${escapeHtml(masterItemTypeLabel(item.type))}</strong></div>
          <div><span>Kategori</span><strong>${escapeHtml(item.category || '-')}</strong></div>
          <div><span>Satuan</span><strong>${escapeHtml(item.unit || '-')}</strong></div>
          <div><span>Sumber harga</span><strong>${item.type === 'PRODUK' ? 'Master Item' : item.type === 'BAHAN' || item.type === 'KEMASAN' ? 'Pembelian terakhir' : 'HPP persediaan'}</strong></div>
          <div><span>Status item</span><strong>${item.active === false ? 'NONAKTIF' : 'AKTIF'}</strong></div>
        </div>
      </section>

      <section class="stock-item-detail-section">
        <div class="stock-item-detail-section-heading">
          <div>
            <span class="sheet-kicker">Riwayat terbaru</span>
            <h3>Mutasi persediaan</h3>
          </div>
          <span class="status-chip info">${transactionRows.length} baris</span>
        </div>
        <div class="stock-item-mutation-list">${transactionHtml}</div>
      </section>

      <section class="stock-item-detail-note">
        <span>Catatan Master Item</span>
        <p>${escapeHtml(item.note || 'Tidak ada catatan untuk item ini.')}</p>
      </section>
    `;
  }

  function openMasterItemsPage() {
    if (!isMasterAdmin()) {
      showToast('Hanya Administrator yang dapat membuka Master Item.', 'warning');
      return;
    }
    navigate('master-item');
    populateMasterItemFilters();
    renderMasterItemsPage();
  }

  function isMasterAdmin() {
    const role = String(state.session?.user?.role || '').toUpperCase();
    return ['ADMIN', 'ADMINISTRATOR', 'SUPERADMIN', 'OWNER'].includes(role);
  }

  function masterItemTypeLabel(type) {
    const labels = {
      BAHAN: 'Bahan',
      KEMASAN: 'Kemasan',
      PRODUK: 'Produk Jual',
      INTERNAL: 'Starter / Internal',
      LAINNYA: 'Sistem / Lainnya'
    };
    return labels[String(type || '').toUpperCase()] || statusTitle(type);
  }

  function masterItemTypeTone(type) {
    const tones = {
      BAHAN: 'is-material',
      KEMASAN: 'is-packaging',
      PRODUK: 'is-product',
      INTERNAL: 'is-internal',
      LAINNYA: 'is-system'
    };
    return tones[String(type || '').toUpperCase()] || 'is-system';
  }

  function masterItemTypeIcon(type) {
    const normalized = String(type || '').toUpperCase();
    if (normalized === 'PRODUK' || normalized === 'INTERNAL') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6v4l2 3v10H7V10l2-3V3Z"/></svg>';
    }
    if (normalized === 'KEMASAN') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/></svg>';
    }
    if (normalized === 'BAHAN') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 20c8 0 12-5 12-14-7 0-12 4-12 12"/><path d="M6 20c2-5 5-8 10-10"/></svg>';
    }
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>';
  }

  function populateMasterItemFilters() {
    const select = document.getElementById('masterItemCategoryFilter');
    if (!select) return;

    const selected = select.value;
    const categories = Array.from(new Set(
      (state.initialData?.items || [])
        .map((item) => String(item.category || '').trim())
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'id'));

    select.replaceChildren();
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'Semua kategori';
    select.append(all);

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.append(option);
    });

    select.value = categories.includes(selected) ? selected : '';
  }

  function resetMasterItemFilters() {
    const search = document.getElementById('masterItemSearch');
    const type = document.getElementById('masterItemTypeFilter');
    const category = document.getElementById('masterItemCategoryFilter');
    const active = document.getElementById('masterItemActiveFilter');

    if (search) search.value = '';
    if (type) type.value = '';
    if (category) category.value = '';
    if (active) active.value = '';
    renderMasterItemsPage();
  }

  function getFilteredMasterItems() {
    populateMasterItemFilters();

    const search = String(document.getElementById('masterItemSearch')?.value || '').trim().toLowerCase();
    const type = String(document.getElementById('masterItemTypeFilter')?.value || '').toUpperCase();
    const category = String(document.getElementById('masterItemCategoryFilter')?.value || '');
    const activeFilter = String(document.getElementById('masterItemActiveFilter')?.value || '').toUpperCase();

    return (state.initialData?.items || [])
      .map(getStockSnapshotForItem)
      .filter((item) => {
        if (type && String(item.type || '').toUpperCase() !== type) return false;
        if (category && String(item.category || '') !== category) return false;
        if (activeFilter === 'ACTIVE' && item.active === false) return false;
        if (activeFilter === 'INACTIVE' && item.active !== false) return false;
        if (activeFilter === 'ATTENTION' && !['HABIS', 'MENIPIS'].includes(item.status)) return false;

        if (search) {
          const searchable = `${item.code} ${item.name} ${item.type} ${item.category} ${item.unit} ${item.note}`.toLowerCase();
          if (!searchable.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.active !== b.active) return a.active === false ? 1 : -1;
        const typeCompare = String(a.type || '').localeCompare(String(b.type || ''), 'id');
        if (typeCompare !== 0) return typeCompare;
        return String(a.name || '').localeCompare(String(b.name || ''), 'id');
      });
  }

  function renderMasterItemsPage() {
    const container = document.getElementById('masterItemList');
    if (!container) return;

    const allItems = (state.initialData?.items || []).map(getStockSnapshotForItem);
    const filtered = getFilteredMasterItems();

    const active = allItems.filter((item) => item.active !== false).length;
    const inactive = allItems.length - active;
    const attention = allItems.filter((item) => item.active !== false && ['HABIS', 'MENIPIS'].includes(item.status)).length;
    const products = allItems.filter((item) => item.active !== false && item.type === 'PRODUK').length;

    setText('#masterItemTotal', formatQuantity(allItems.length));
    setText('#masterItemActiveCount', formatQuantity(active));
    setText('#masterItemInactive', formatQuantity(inactive));
    setText('#masterItemAttention', formatQuantity(attention));
    setText('#masterItemProducts', formatQuantity(products));
    setText('#masterItemCount', `${filtered.length} item`);
    setText(
      '#masterItemCaption',
      filtered.length
        ? `${filtered.length} dari ${allItems.length} item ditampilkan.`
        : 'Tidak ada item yang cocok dengan filter.'
    );

    container.replaceChildren();

    if (!filtered.length) {
      container.innerHTML = `
        <div class="card master-item-empty">
          <div class="empty-state-icon">□</div>
          <h3>Master Item tidak ditemukan</h3>
          <p>Ubah pencarian atau filter untuk menampilkan item lain.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      container.append(createMasterItemCard(item));
    });
  }

  function masterItemPriceMetric(item) {
    const type = String(item?.type || '').toUpperCase();

    if (type === 'BAHAN' || type === 'KEMASAN') {
      return {
        label: 'Harga beli terakhir',
        value: formatCurrency(item.lastBuyPrice),
        caption: 'Dari pembelian terakhir',
        tone: 'purchase'
      };
    }

    if (type === 'PRODUK') {
      return {
        label: 'Harga jual',
        value: formatCurrency(item.sellPrice),
        caption: 'Dipakai saat penjualan',
        tone: 'sale'
      };
    }

    return {
      label: 'Nilai stok',
      value: formatCurrency(item.stockValue),
      caption: 'Stok × HPP rata-rata',
      tone: 'value'
    };
  }

  function masterItemCardMetrics(item) {
    const type = String(item?.type || '').toUpperCase();
    const currentStock = ['Stok sekarang', `${formatQuantity(item.stock)} ${item.unit}`.trim(), 'current'];
    const minimumStock = ['Stok minimum', `${formatQuantity(item.minStock)} ${item.unit}`.trim(), 'minimum'];
    const averageCost = ['HPP rata-rata', formatCurrency(item.averageCost), 'hpp'];
    const priceMetric = masterItemPriceMetric(item);

    if (type === 'BAHAN' || type === 'KEMASAN') {
      return [
        currentStock,
        minimumStock,
        [priceMetric.label, priceMetric.value, priceMetric.tone],
        averageCost
      ];
    }

    return [
      currentStock,
      minimumStock,
      averageCost,
      [priceMetric.label, priceMetric.value, priceMetric.tone]
    ];
  }

  function createMasterItemCard(item) {
    const card = document.createElement('article');
    card.className = `card master-item-card ${item.active === false ? 'is-inactive' : ''}`;

    const header = document.createElement('div');
    header.className = 'master-item-card-header';

    const identity = document.createElement('div');
    identity.className = 'master-item-card-identity';

    const icon = document.createElement('span');
    icon.className = `master-item-card-icon ${masterItemTypeTone(item.type)}`;
    icon.innerHTML = masterItemTypeIcon(item.type);

    const copy = document.createElement('div');
    copy.className = 'master-item-card-copy';

    const type = document.createElement('span');
    type.textContent = `${masterItemTypeLabel(item.type)} · ${item.category || '-'}`;

    const name = document.createElement('strong');
    name.textContent = item.name;

    const meta = document.createElement('small');
    meta.textContent = `${item.code} · ${item.unit}`;

    copy.append(type, name, meta);
    identity.append(icon, copy);

    const badges = document.createElement('div');
    badges.className = 'master-item-card-badges';

    const activeBadge = document.createElement('span');
    activeBadge.className = `master-item-active-badge ${item.active === false ? 'is-inactive' : 'is-active'}`;
    activeBadge.textContent = item.active === false ? 'NONAKTIF' : 'AKTIF';

    const stockBadge = document.createElement('span');
    stockBadge.className = `stock-detail-status status-${String(item.status || '').toLowerCase()}`;
    stockBadge.textContent = item.status;

    badges.append(activeBadge);
    if (item.type !== 'LAINNYA') badges.append(stockBadge);
    header.append(identity, badges);

    const metrics = document.createElement('div');
    metrics.className = 'master-item-card-metrics';

    masterItemCardMetrics(item).forEach(([label, value, role]) => {
      const metric = document.createElement('div');
      metric.className = `master-item-card-metric metric-${role || 'neutral'}`;

      const labelElement = document.createElement('span');
      labelElement.textContent = label;

      const valueElement = document.createElement('strong');
      valueElement.textContent = value;

      metric.append(labelElement, valueElement);
      metrics.append(metric);
    });

    const footer = document.createElement('div');
    footer.className = 'master-item-card-footer';

    const note = document.createElement('span');
    note.textContent = item.note || 'Tidak ada catatan';

    const actions = document.createElement('div');
    actions.className = 'master-item-card-actions';

    const detailButton = document.createElement('button');
    detailButton.type = 'button';
    detailButton.className = 'btn btn-secondary master-item-small-button';
    detailButton.textContent = 'Detail Stok';
    detailButton.addEventListener('click', () => openStockItemDetail(item.code));

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn btn-secondary master-item-small-button';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => openMasterItemForm(item.code));

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = `btn master-item-small-button ${item.active === false ? 'btn-primary' : 'btn-secondary is-danger-action'}`;
    toggleButton.textContent = item.active === false ? 'Aktifkan' : 'Nonaktifkan';
    toggleButton.disabled = item.code === 'LN001';
    toggleButton.addEventListener('click', () => toggleMasterItemActive(item));

    actions.append(detailButton, editButton, toggleButton);
    footer.append(note, actions);

    card.append(header, metrics, footer);
    return card;
  }

  function generateMasterItemCode(type) {
    const prefixes = {
      BAHAN: 'BB',
      KEMASAN: 'PK',
      PRODUK: 'PR',
      INTERNAL: 'IN'
    };
    const prefix = prefixes[String(type || '').toUpperCase()] || 'IT';
    const usedNumbers = (state.initialData?.items || [])
      .map((item) => String(item.code || '').toUpperCase())
      .filter((code) => code.startsWith(prefix))
      .map((code) => Number(code.slice(prefix.length)))
      .filter(Number.isFinite);
    const next = (usedNumbers.length ? Math.max(...usedNumbers) : 0) + 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
  }

  function defaultMasterItemCategory(type) {
    const defaults = {
      BAHAN: 'Bahan Produksi',
      KEMASAN: 'Kemasan',
      PRODUK: 'Produk Jadi',
      INTERNAL: 'Starter'
    };
    return defaults[String(type || '').toUpperCase()] || 'Operasional';
  }

  function defaultMasterItemUnit(type) {
    const defaults = {
      BAHAN: 'gram',
      KEMASAN: 'pcs',
      PRODUK: 'botol',
      INTERNAL: 'ml'
    };
    return defaults[String(type || '').toUpperCase()] || 'unit';
  }

  function updateMasterItemPriceVisibility(type, mode = 'create') {
    const normalizedType = String(type || '').toUpperCase();
    const priceField = document.getElementById('masterItemSellPriceField');
    const priceInput = document.getElementById('masterItemSellPrice');
    const guidance = document.getElementById('masterItemPriceGuidance');

    const isProduct = normalizedType === 'PRODUK';

    if (priceField) {
      priceField.hidden = !isProduct;
      priceField.setAttribute('aria-hidden', isProduct ? 'false' : 'true');
    }
    if (priceInput) {
      priceInput.disabled = !isProduct;
      if (!isProduct && mode === 'create') setMoneyInputValue(priceInput, 0);
    }

    if (guidance) {
      if (isProduct) {
        guidance.dataset.tone = 'sale';
        guidance.textContent = 'Harga jual diisi untuk produk siap jual dan akan digunakan otomatis pada transaksi Penjualan. HPP tetap dihitung sistem.';
      } else if (normalizedType === 'BAHAN' || normalizedType === 'KEMASAN') {
        guidance.dataset.tone = 'purchase';
        guidance.textContent = 'Harga beli terakhir diperbarui otomatis dari transaksi Pembelian. HPP rata-rata dihitung dari nilai persediaan dan tidak diisi manual.';
      } else {
        guidance.dataset.tone = 'internal';
        guidance.textContent = 'Item internal tidak memakai harga jual. Nilainya mengikuti HPP rata-rata dari proses produksi atau transaksi persediaan.';
      }
    }
  }

  function openMasterItemForm(code = '') {
    if (!isMasterAdmin()) {
      showToast('Hanya Administrator yang dapat mengubah Master Item.', 'warning');
      return;
    }

    const form = document.getElementById('masterItemForm');
    form?.reset();
    setMoneyInputValue(document.getElementById('masterItemSellPrice'), 0);
    document.getElementById('masterItemFormError').textContent = '';

    const normalized = String(code || '').toUpperCase();
    const item = normalized ? state.itemMap.get(normalized) : null;
    state.selectedMasterItemCode = item?.code || '';
    state.masterItemAutoCode = !item;

    const mode = item ? 'update' : 'create';
    document.getElementById('masterItemMode').value = mode;
    setText('#masterItemSheetKicker', item ? 'Edit Master Item' : 'Tambah Master Item');
    setText('#masterItemSheetTitle', item ? item.name : 'Tambah Master Item');
    setText(
      '#masterItemSheetSubtitle',
      item ? `${item.code} · stok dan HPP tetap dihitung otomatis.` : 'Buat item baru tanpa mengisi stok secara langsung.'
    );
    setText('#submitMasterItemButton', item ? 'Simpan Perubahan' : 'Simpan Master Item');

    const codeInput = document.getElementById('masterItemCode');
    const nameInput = document.getElementById('masterItemName');
    const typeInput = document.getElementById('masterItemType');
    const categoryInput = document.getElementById('masterItemCategory');
    const unitInput = document.getElementById('masterItemUnit');
    const minInput = document.getElementById('masterItemMinStock');
    const activeInput = document.getElementById('masterItemActive');
    const noteInput = document.getElementById('masterItemNote');

    if (item) {
      codeInput.value = item.code;
      codeInput.readOnly = true;
      codeInput.classList.add('inventory-readonly-control');
      setText('#masterItemCodeHelp', 'Kode item tidak dapat diubah setelah dibuat.');

      nameInput.value = item.name || '';
      typeInput.value = item.type === 'LAINNYA' ? 'INTERNAL' : item.type;
      categoryInput.value = item.category || '';
      unitInput.value = item.unit || '';
      minInput.value = String(toNumber(item.minStock));
      setMoneyInputValue(document.getElementById('masterItemSellPrice'), item.sellPrice);
      activeInput.checked = item.active !== false;
      noteInput.value = item.note || '';

      const snapshot = getStockSnapshotForItem(item);
      setText('#masterItemCurrentStock', `${formatQuantity(snapshot.stock)} ${item.unit || ''}`.trim());
      setText('#masterItemAverageCost', formatCurrency(item.averageCost));
      setText('#masterItemLastBuyPrice', formatCurrency(item.lastBuyPrice));
      setText(
        '#masterItemSafetyNote',
        item.code === 'LN001'
          ? 'LN001 adalah item sistem dan tidak dapat dinonaktifkan.'
          : 'Item hanya dapat dinonaktifkan ketika stok sudah 0 dan tidak dipakai resep aktif.'
      );

      if (item.type === 'LAINNYA') {
        typeInput.disabled = true;
        activeInput.disabled = true;
      } else {
        typeInput.disabled = false;
        activeInput.disabled = false;
      }
    } else {
      const initialType = 'BAHAN';
      codeInput.readOnly = false;
      codeInput.classList.remove('inventory-readonly-control');
      codeInput.value = generateMasterItemCode(initialType);
      setText('#masterItemCodeHelp', 'Kode otomatis dapat disesuaikan sebelum item dibuat.');

      nameInput.value = '';
      typeInput.disabled = false;
      typeInput.value = initialType;
      categoryInput.value = defaultMasterItemCategory(initialType);
      unitInput.value = defaultMasterItemUnit(initialType);
      minInput.value = '0';
      activeInput.disabled = false;
      activeInput.checked = true;
      noteInput.value = '';

      setText('#masterItemCurrentStock', '0');
      setText('#masterItemAverageCost', 'Rp0');
      setText('#masterItemLastBuyPrice', 'Rp0');
      setText('#masterItemSafetyNote', 'Stok awal harus dicatat melalui menu Stok Awal atau Pembelian.');
    }

    updateMasterItemPriceVisibility(
      item?.type || typeInput.value || 'BAHAN',
      mode
    );

    openSheet('masterItemSheet', 'masterItemSheetBackdrop');
    window.setTimeout(() => nameInput?.focus(), 260);
  }

  function handleMasterItemTypeChange() {
    const mode = document.getElementById('masterItemMode')?.value || 'create';
    const type = document.getElementById('masterItemType')?.value || 'BAHAN';

    updateMasterItemPriceVisibility(type, mode);
    if (mode !== 'create') return;
    const codeInput = document.getElementById('masterItemCode');
    const categoryInput = document.getElementById('masterItemCategory');
    const unitInput = document.getElementById('masterItemUnit');

    if (state.masterItemAutoCode && codeInput) codeInput.value = generateMasterItemCode(type);
    if (categoryInput && !categoryInput.value.trim()) categoryInput.value = defaultMasterItemCategory(type);
    if (unitInput && !unitInput.value.trim()) unitInput.value = defaultMasterItemUnit(type);
  }

  function closeMasterItemSheet(force = false) {
    if (state.masterItemSubmitting && !force) return;
    closeSheet('masterItemSheet', 'masterItemSheetBackdrop');
    state.selectedMasterItemCode = '';
    document.body.classList.remove('sheet-is-open');
  }

  async function handleMasterItemSubmit(event) {
    event.preventDefault();
    if (state.masterItemSubmitting) return;

    const errorElement = document.getElementById('masterItemFormError');
    const button = document.getElementById('submitMasterItemButton');
    errorElement.textContent = '';

    try {
      const mode = document.getElementById('masterItemMode')?.value || 'create';
      const code = String(document.getElementById('masterItemCode')?.value || '').trim().toUpperCase();
      const name = String(document.getElementById('masterItemName')?.value || '').trim();
      const selectedExistingItem = state.selectedMasterItemCode
        ? state.itemMap.get(String(state.selectedMasterItemCode).toUpperCase())
        : null;
      const selectedType = String(document.getElementById('masterItemType')?.value || '').toUpperCase();
      const type = selectedExistingItem?.type === 'LAINNYA' ? 'LAINNYA' : selectedType;
      const category = String(document.getElementById('masterItemCategory')?.value || '').trim();
      const unit = String(document.getElementById('masterItemUnit')?.value || '').trim();
      const minStock = toNumber(document.getElementById('masterItemMinStock')?.value);
      const sellPrice = type === 'PRODUK'
        ? getMoneyInputValue(document.getElementById('masterItemSellPrice'))
        : 0;
      const active = Boolean(document.getElementById('masterItemActive')?.checked);
      const note = String(document.getElementById('masterItemNote')?.value || '').trim();

      if (!/^[A-Z][A-Z0-9-]{2,11}$/.test(code)) {
        throw new Error('Kode item harus 3–12 karakter dan hanya memakai huruf, angka, atau tanda hubung.');
      }
      if (name.length < 2) throw new Error('Nama item wajib diisi.');
      if (!category) throw new Error('Kategori wajib diisi.');
      if (!unit) throw new Error('Satuan wajib diisi.');
      if (minStock < 0) throw new Error('Stok minimum tidak boleh negatif.');

      state.masterItemSubmitting = true;
      setButtonLoading(button, true, mode === 'create' ? 'Membuat item...' : 'Menyimpan perubahan...');

      const result = await window.MeramuAPI.request(
        mode === 'create' ? 'createMasterItem' : 'updateMasterItem',
        {code, name, type, category, unit, minStock, sellPrice, active, note},
        {token: state.session.token, timeout: 45000}
      );

      closeMasterItemSheet(true);
      showToast(
        mode === 'create'
          ? `${result.item.code} · ${result.item.name} berhasil dibuat.`
          : `${result.item.code} · perubahan Master Item tersimpan.`,
        'success'
      );
      await refreshAppData({showToastOnError: false});
      navigate('master-item');
    } catch (error) {
      errorElement.textContent = error.message || 'Master Item gagal disimpan.';
      shakeElement(document.getElementById('masterItemForm'));
    } finally {
      state.masterItemSubmitting = false;
      setButtonLoading(
        button,
        false,
        document.getElementById('masterItemMode')?.value === 'create'
          ? 'Simpan Master Item'
          : 'Simpan Perubahan'
      );
    }
  }

  async function toggleMasterItemActive(item) {
    if (!isMasterAdmin()) return;
    const nextActive = item.active === false;
    const actionLabel = nextActive ? 'mengaktifkan' : 'menonaktifkan';

    const confirmed = window.confirm(
      `${nextActive ? 'Aktifkan' : 'Nonaktifkan'} ${item.code} · ${item.name}?\n\n` +
      (nextActive
        ? 'Item akan muncul kembali pada form transaksi.'
        : 'Item hanya dapat dinonaktifkan bila stok 0 dan tidak digunakan resep aktif.')
    );
    if (!confirmed) return;

    try {
      await window.MeramuAPI.request(
        'setMasterItemActive',
        {code: item.code, active: nextActive},
        {token: state.session.token, timeout: 45000}
      );
      showToast(`${item.code} berhasil ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
      await refreshAppData({showToastOnError: false});
      renderMasterItemsPage();
    } catch (error) {
      showToast(error.message || `Gagal ${actionLabel} item.`, 'error');
    }
  }

  function openReportsPage() {
    navigate('laporan');
    populateReportCategoryOptions();

    const startInput = document.getElementById('reportsStartDate');
    const endInput = document.getElementById('reportsEndDate');
    if (!startInput?.value && !endInput?.value) {
      applyReportPeriodPreset(state.reportPeriodPreset || 'bulan-ini', false);
    } else {
      renderReportsPage();
    }

    loadReportData();
  }

  async function loadReportData(force = false) {
    if (state.reportLoading) return;
    if (state.reportLoaded && !force) {
      renderReportsPage();
      return;
    }

    state.reportLoading = true;
    setReportsSourceStatus('Memuat jurnal laporan lengkap...', 'loading');

    try {
      const result = await window.MeramuAPI.request('reports', {
        limit: 10000
      }, {
        token: state.session.token,
        timeout: 45000
      });

      state.reportData = result.data || null;
      state.reportLoaded = true;

      const rows = toNumber(state.reportData?.returnedTransactionRows);
      const total = toNumber(state.reportData?.totalTransactionRows);
      const truncated = Boolean(state.reportData?.truncated);
      const text = truncated
        ? `${formatQuantity(rows)} dari ${formatQuantity(total)} baris jurnal`
        : `${formatQuantity(rows)} baris jurnal lengkap`;
      setReportsSourceStatus(text, truncated ? 'warning' : 'success');
    } catch (error) {
      state.reportData = {
        transactions: state.transactions,
        batches: state.batches,
        bottlings: state.bottlings,
        returnedTransactionRows: state.transactions.length,
        totalTransactionRows: state.transactions.length,
        truncated: true,
        generatedAt: new Date().toISOString()
      };
      state.reportLoaded = true;
      setReportsSourceStatus('Mode kompatibilitas · 1.000 jurnal terbaru', 'warning');
      showToast('Deploy Code.gs V2.12 agar laporan memuat hingga 10.000 baris jurnal.', 'warning');
    } finally {
      state.reportLoading = false;
      populateReportCategoryOptions();
      renderReportsPage();
    }
  }

  function setReportsSourceStatus(message, tone = 'info') {
    const element = document.getElementById('reportsSourceStatus');
    if (!element) return;
    element.textContent = message;
    element.dataset.tone = tone;
  }

  function populateReportCategoryOptions() {
    const select = document.getElementById('reportsCategory');
    if (!select) return;

    const selected = select.value;
    const categories = Array.from(new Set(
      (state.initialData?.items || [])
        .map((item) => String(item.category || '').trim())
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'id'));

    select.replaceChildren();

    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'Semua kategori';
    select.append(all);

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.append(option);
    });

    select.value = categories.includes(selected) ? selected : '';
  }

  function applyReportPeriodPreset(preset, shouldRender = true) {
    const now = new Date();
    let start = null;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'hari-ini':
        start = new Date(end);
        break;
      case '7-hari':
        start = new Date(end);
        start.setDate(start.getDate() - 6);
        break;
      case 'bulan-lalu':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'tahun-ini':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'semua':
        start = null;
        end = null;
        break;
      case 'bulan-ini':
      default:
        preset = 'bulan-ini';
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    state.reportPeriodPreset = preset;

    const startInput = document.getElementById('reportsStartDate');
    const endInput = document.getElementById('reportsEndDate');
    if (startInput) startInput.value = start ? localDateInputValue(start) : '';
    if (endInput) endInput.value = end ? localDateInputValue(end) : '';

    if (shouldRender) renderReportsPage();
  }

  function resetReportsFilters() {
    const category = document.getElementById('reportsCategory');
    const variant = document.getElementById('reportsVariant');
    const method = document.getElementById('reportsMethod');

    if (category) category.value = '';
    if (variant) variant.value = '';
    if (method) method.value = '';

    state.reportActiveTab = 'ringkasan';
    applyReportPeriodPreset('bulan-ini');
  }

  function readReportFilters() {
    return {
      startDate: reportDateBoundary(document.getElementById('reportsStartDate')?.value, false),
      endDate: reportDateBoundary(document.getElementById('reportsEndDate')?.value, true),
      category: String(document.getElementById('reportsCategory')?.value || ''),
      variant: String(document.getElementById('reportsVariant')?.value || '').toUpperCase(),
      method: String(document.getElementById('reportsMethod')?.value || '').toUpperCase()
    };
  }

  function reportDateBoundary(value, endOfDay = false) {
    if (!value) return null;
    const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getPreviousReportFilters(filters) {
    if (!filters.startDate || !filters.endDate) return null;

    const duration = filters.endDate.getTime() - filters.startDate.getTime() + 1;
    const previousEnd = new Date(filters.startDate.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration + 1);

    return {
      ...filters,
      startDate: previousStart,
      endDate: previousEnd
    };
  }

  function getReportTransactionsSource() {
    return Array.isArray(state.reportData?.transactions)
      ? state.reportData.transactions
      : state.transactions;
  }

  function getReportBatchesSource() {
    return Array.isArray(state.reportData?.batches)
      ? state.reportData.batches
      : state.batches;
  }

  function getReportBottlingsSource() {
    return Array.isArray(state.reportData?.bottlings)
      ? state.reportData.bottlings
      : state.bottlings;
  }

  function reportRowDate(row) {
    return parseAnyDate(row.Timestamp || row.Tanggal);
  }

  function reportEffectiveTransactionType(row) {
    const type = String(row?.['Jenis Transaksi'] || '').toUpperCase();
    if (type === 'PEMBATALAN') {
      return String(row?.['Jenis Asli'] || '').toUpperCase();
    }
    return type;
  }

  function reportTransactionSign(row) {
    return String(row?.['Jenis Transaksi'] || '').toUpperCase() === 'PEMBATALAN' ? -1 : 1;
  }

  function reportSaleRevenue(row) {
    if (reportEffectiveTransactionType(row) !== 'PENJUALAN') return 0;
    return reportTransactionSign(row) > 0
      ? toNumber(row.Pemasukan)
      : -toNumber(row.Pengeluaran);
  }

  function reportSaleHpp(row) {
    if (reportEffectiveTransactionType(row) !== 'PENJUALAN') return 0;
    return reportTransactionSign(row) > 0
      ? toNumber(row['Nilai Stok Keluar/HPP'])
      : -toNumber(row['Nilai Stok Masuk']);
  }

  function reportSaleQty(row) {
    if (reportEffectiveTransactionType(row) !== 'PENJUALAN') return 0;
    return reportTransactionSign(row) > 0
      ? toNumber(row['Qty Keluar'])
      : -toNumber(row['Qty Masuk']);
  }

  function reportExpenseValue(row) {
    if (reportEffectiveTransactionType(row) !== 'PENGELUARAN') return 0;
    return reportTransactionSign(row) > 0
      ? toNumber(row.Pengeluaran)
      : -toNumber(row.Pemasukan);
  }

  function reportUsageValue(row) {
    if (reportEffectiveTransactionType(row) !== 'PEMAKAIAN') return 0;
    return reportTransactionSign(row) > 0
      ? toNumber(row['Nilai Stok Keluar/HPP'])
      : -toNumber(row['Nilai Stok Masuk']);
  }

  function reportBatchDate(batch) {
    return parseAnyDate(batch.Timestamp || batch['Tanggal F1']);
  }

  function reportBottlingDate(row) {
    return parseAnyDate(row.Timestamp || row.Tanggal);
  }

  function reportVariantFromCode(code, name = '') {
    const normalizedCode = String(code || '').toUpperCase();
    const mapped = {
      PR001: 'ORIGINAL',
      PR002: 'TELANG',
      PR003: 'ROSELLA',
      PR004: 'STARTER'
    }[normalizedCode];
    if (mapped) return mapped;

    const text = String(name || '').toUpperCase();
    if (text.includes('TELANG')) return 'TELANG';
    if (text.includes('ROSELLA')) return 'ROSELLA';
    if (text.includes('STARTER')) return 'STARTER';
    if (text.includes('ORIGINAL')) return 'ORIGINAL';
    return '';
  }

  function reportRowMatchesFilters(row, filters) {
    const date = reportRowDate(row);
    if (filters.startDate && date < filters.startDate) return false;
    if (filters.endDate && date > filters.endDate) return false;

    if (filters.method) {
      const method = String(row.Metode || '-').toUpperCase();
      if (method !== filters.method) return false;
    }

    const code = String(row['Kode Item'] || '').toUpperCase();
    const item = state.itemMap.get(code);

    if (filters.category && String(item?.category || '') !== filters.category) {
      return false;
    }

    if (filters.variant) {
      const variant = reportVariantFromCode(code, row['Nama Item']);
      if (variant !== filters.variant) return false;
    }

    return true;
  }

  function reportBatchMatchesFilters(batch, filters) {
    const date = reportBatchDate(batch);
    if (filters.startDate && date < filters.startDate) return false;
    if (filters.endDate && date > filters.endDate) return false;
    return true;
  }

  function reportBottlingMatchesFilters(row, filters) {
    const date = reportBottlingDate(row);
    if (filters.startDate && date < filters.startDate) return false;
    if (filters.endDate && date > filters.endDate) return false;
    if (filters.variant && normalizeBottlingVariant(row.Varian) !== filters.variant) return false;
    return true;
  }

  function getFilteredCurrentInventory(filters) {
    return (state.initialData?.items || [])
      .filter((item) => item.active !== false && String(item.type || '').toUpperCase() !== 'LAINNYA')
      .filter((item) => {
        if (filters.category && String(item.category || '') !== filters.category) return false;
        if (filters.variant) {
          const variant = reportVariantFromCode(item.code, item.name);
          if (variant !== filters.variant) return false;
        }
        return true;
      })
      .map((item) => {
        const stockItem = state.stockMap.get(String(item.code || '').toUpperCase()) || item;
        const stock = toNumber(stockItem.stock);
        const averageCost = toNumber(item.averageCost || stockItem.averageCost);
        return {
          ...item,
          stock,
          averageCost,
          stockValue: stock * averageCost
        };
      });
  }

  function buildReportContext(filters = readReportFilters()) {
    const transactionRows = getReportTransactionsSource()
      .filter((row) => reportRowMatchesFilters(row, filters));
    const transactionGroups = aggregateTransactionRows(transactionRows);
    const saleRows = transactionRows.filter((row) => reportEffectiveTransactionType(row) === 'PENJUALAN');
    const expenseRows = transactionRows.filter((row) => reportEffectiveTransactionType(row) === 'PENGELUARAN');
    const usageRows = transactionRows.filter((row) => reportEffectiveTransactionType(row) === 'PEMAKAIAN');
    const opnameRows = transactionRows.filter((row) => reportEffectiveTransactionType(row) === 'STOK_OPNAME');

    const omzet = saleRows.reduce((sum, row) => sum + reportSaleRevenue(row), 0);
    const hpp = saleRows.reduce((sum, row) => sum + reportSaleHpp(row), 0);
    const expense = expenseRows.reduce((sum, row) => sum + reportExpenseValue(row), 0);
    const grossProfit = omzet - hpp;
    const operatingProfit = grossProfit - expense;
    const grossMargin = omzet > 0 ? grossProfit / omzet * 100 : 0;
    const operatingMargin = omzet > 0 ? operatingProfit / omzet * 100 : 0;

    const saleGroups = transactionGroups.filter((group) =>
      group.type === 'PENJUALAN' && group.status === 'AKTIF'
    );
    const salesQty = saleRows.reduce((sum, row) => sum + reportSaleQty(row), 0);
    const averageTransaction = saleGroups.length ? omzet / saleGroups.length : 0;

    const stockValueIn = transactionRows.reduce((sum, row) => sum + toNumber(row['Nilai Stok Masuk']), 0);
    const stockValueOut = transactionRows.reduce((sum, row) => sum + toNumber(row['Nilai Stok Keluar/HPP']), 0);
    const usageValue = usageRows.reduce((sum, row) => sum + reportUsageValue(row), 0);
    const opnameValue = opnameRows.reduce((sum, row) =>
      sum + toNumber(row['Nilai Stok Masuk']) - toNumber(row['Nilai Stok Keluar/HPP']), 0);

    const inventory = getFilteredCurrentInventory(filters);
    const inventoryValue = inventory.reduce((sum, item) => sum + item.stockValue, 0);
    const lowStock = inventory.filter((item) => item.stock > 0 && item.stock <= toNumber(item.minStock)).length;
    const outOfStock = inventory.filter((item) => item.stock <= 0).length;

    const batches = getReportBatchesSource()
      .filter((batch) => reportBatchMatchesFilters(batch, filters));
    const bottlings = getReportBottlingsSource()
      .filter((row) => reportBottlingMatchesFilters(row, filters));
    const productBottlings = bottlings.filter((row) => normalizeBottlingVariant(row.Varian) !== 'STARTER');
    const starterBottlings = bottlings.filter((row) => normalizeBottlingVariant(row.Varian) === 'STARTER');

    const batchVolume = batches.reduce((sum, batch) => sum + toNumber(batch['Volume Batch (L)']), 0);
    const shrinkVolume = batches.reduce((sum, batch) => sum + toNumber(batch['Susut (L)']), 0);
    const productVolume = batches.reduce((sum, batch) => sum + toNumber(batch['Volume Produk (L)']), 0);
    const bottleOutput = productBottlings.reduce((sum, row) => sum + toNumber(row.Hasil), 0);
    const starterOutput = starterBottlings.reduce((sum, row) => sum + toNumber(row.Hasil), 0);
    const productionCost = bottlings.reduce((sum, row) => sum + toNumber(row['HPP Total']), 0);
    const potentialValue = bottlings.reduce((sum, row) => sum + toNumber(row['Nilai Potensi']), 0);

    return {
      filters,
      transactionRows,
      transactionGroups,
      saleRows,
      expenseRows,
      usageRows,
      opnameRows,
      saleGroups,
      omzet,
      hpp,
      expense,
      grossProfit,
      operatingProfit,
      grossMargin,
      operatingMargin,
      salesQty,
      averageTransaction,
      stockValueIn,
      stockValueOut,
      usageValue,
      opnameValue,
      inventory,
      inventoryValue,
      lowStock,
      outOfStock,
      batches,
      bottlings,
      productBottlings,
      starterBottlings,
      batchVolume,
      shrinkVolume,
      productVolume,
      bottleOutput,
      starterOutput,
      productionCost,
      potentialValue
    };
  }

  function renderReportsPage() {
    const page = document.querySelector('[data-page="laporan"]');
    if (!page) return;

    populateReportCategoryOptions();

    document.querySelectorAll('[data-report-tab]').forEach((button) => {
      const active = button.dataset.reportTab === state.reportActiveTab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    document.querySelectorAll('[data-report-preset]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.reportPreset === state.reportPeriodPreset);
    });

    const filters = readReportFilters();
    const context = buildReportContext(filters);
    const previousFilters = getPreviousReportFilters(filters);
    const previous = previousFilters ? buildReportContext(previousFilters) : null;

    renderReportKpis(context, previous);
    renderReportTrend(context);
    renderReportBreakdown(context);
    renderReportTable(context);
    renderReportFootnote(context);
  }

  function reportChangeCaption(current, previous, format = 'currency') {
    if (!previous || Math.abs(toNumber(previous)) < 0.000001) {
      return 'Belum ada pembanding periode sebelumnya';
    }

    const change = (toNumber(current) - toNumber(previous)) / Math.abs(toNumber(previous)) * 100;
    const formatted = `${change >= 0 ? '+' : ''}${numberFormatter.format(change)}%`;
    return `${formatted} dibanding periode sebelumnya`;
  }

  function setReportKpi(index, data) {
    const card = document.querySelector(`[data-report-kpi-index="${index}"]`);
    if (!card) return;

    const label = card.querySelector('.reports-kpi-label');
    const value = card.querySelector('.reports-kpi-value');
    const caption = card.querySelector('.reports-kpi-caption');

    if (label) label.textContent = data.label;
    if (value) value.textContent = data.value;
    if (caption) caption.textContent = data.caption || '';

    card.dataset.tone = data.tone || 'neutral';
  }

  function renderReportKpis(context, previous) {
    let cards;

    if (state.reportActiveTab === 'penjualan') {
      const productSummary = buildSalesProductSummary(context.saleRows);
      const topProduct = productSummary[0];
      cards = [
        {
          label: 'Transaksi penjualan',
          value: formatQuantity(context.saleGroups.length),
          caption: reportChangeCaption(context.saleGroups.length, previous?.saleGroups.length, 'number'),
          tone: 'info'
        },
        {
          label: 'Produk terjual',
          value: `${formatQuantity(context.salesQty)} unit`,
          caption: reportChangeCaption(context.salesQty, previous?.salesQty, 'number'),
          tone: 'info'
        },
        {
          label: 'Omzet',
          value: formatCurrency(context.omzet),
          caption: reportChangeCaption(context.omzet, previous?.omzet),
          tone: 'success'
        },
        {
          label: 'Rata-rata transaksi',
          value: formatCurrency(context.averageTransaction),
          caption: 'Omzet dibagi jumlah invoice',
          tone: 'success'
        },
        {
          label: 'Produk terlaris',
          value: topProduct?.name || '-',
          caption: topProduct ? `${formatQuantity(topProduct.qty)} unit terjual` : 'Belum ada penjualan',
          tone: 'neutral'
        },
        {
          label: 'Laba kotor',
          value: formatCurrency(context.grossProfit),
          caption: `${numberFormatter.format(context.grossMargin)}% margin`,
          tone: context.grossProfit >= 0 ? 'success' : 'danger'
        }
      ];
    } else if (state.reportActiveTab === 'persediaan') {
      cards = [
        {
          label: 'Nilai stok saat ini',
          value: formatCurrency(context.inventoryValue),
          caption: `${context.inventory.length} item aktif`,
          tone: 'info'
        },
        {
          label: 'Nilai stok masuk',
          value: formatCurrency(context.stockValueIn),
          caption: 'Sesuai periode filter',
          tone: 'success'
        },
        {
          label: 'Nilai stok keluar',
          value: formatCurrency(context.stockValueOut),
          caption: 'Termasuk HPP dan pemakaian',
          tone: 'danger'
        },
        {
          label: 'Nilai pemakaian',
          value: formatCurrency(context.usageValue),
          caption: 'Barang keluar nonproduksi',
          tone: 'warning'
        },
        {
          label: 'Stok menipis',
          value: `${formatQuantity(context.lowStock)} item`,
          caption: `${formatQuantity(context.outOfStock)} item habis`,
          tone: context.lowStock || context.outOfStock ? 'warning' : 'success'
        },
        {
          label: 'Selisih opname',
          value: formatSignedCurrency(context.opnameValue),
          caption: 'Nilai koreksi bersih',
          tone: context.opnameValue < 0 ? 'danger' : context.opnameValue > 0 ? 'success' : 'neutral'
        }
      ];
    } else if (state.reportActiveTab === 'produksi') {
      const shrinkRate = context.batchVolume > 0 ? context.shrinkVolume / context.batchVolume * 100 : 0;
      cards = [
        {
          label: 'Batch F1',
          value: formatQuantity(context.batches.length),
          caption: `${formatQuantity(context.batchVolume)} liter volume awal`,
          tone: 'info'
        },
        {
          label: 'Susut fermentasi',
          value: `${formatQuantity(context.shrinkVolume)} L`,
          caption: `${numberFormatter.format(shrinkRate)}% dari volume awal`,
          tone: 'warning'
        },
        {
          label: 'Volume produk',
          value: `${formatQuantity(context.productVolume)} L`,
          caption: 'Volume F1 yang diproses',
          tone: 'success'
        },
        {
          label: 'Hasil bottling',
          value: `${formatQuantity(context.bottleOutput)} botol`,
          caption: `${context.productBottlings.length} proses bottling`,
          tone: 'success'
        },
        {
          label: 'Starter tersimpan',
          value: `${formatQuantity(context.starterOutput)} ml`,
          caption: `${context.starterBottlings.length} proses starter`,
          tone: 'info'
        },
        {
          label: 'HPP produksi',
          value: formatCurrency(context.productionCost),
          caption: `Potensi ${formatCurrency(context.potentialValue)}`,
          tone: 'neutral'
        }
      ];
    } else {
      cards = [
        {
          label: 'Omzet',
          value: formatCurrency(context.omzet),
          caption: reportChangeCaption(context.omzet, previous?.omzet),
          tone: 'success'
        },
        {
          label: 'HPP penjualan',
          value: formatCurrency(context.hpp),
          caption: reportChangeCaption(context.hpp, previous?.hpp),
          tone: 'warning'
        },
        {
          label: 'Laba kotor',
          value: formatCurrency(context.grossProfit),
          caption: `${numberFormatter.format(context.grossMargin)}% margin kotor`,
          tone: context.grossProfit >= 0 ? 'success' : 'danger'
        },
        {
          label: 'Pengeluaran operasional',
          value: formatCurrency(context.expense),
          caption: reportChangeCaption(context.expense, previous?.expense),
          tone: 'danger'
        },
        {
          label: 'Laba operasional',
          value: formatCurrency(context.operatingProfit),
          caption: reportChangeCaption(context.operatingProfit, previous?.operatingProfit),
          tone: context.operatingProfit >= 0 ? 'success' : 'danger'
        },
        {
          label: 'Margin operasional',
          value: `${numberFormatter.format(context.operatingMargin)}%`,
          caption: `${context.saleGroups.length} transaksi penjualan`,
          tone: context.operatingMargin >= 0 ? 'info' : 'danger'
        }
      ];
    }

    cards.forEach((card, index) => setReportKpi(index, card));
  }

  function buildReportTimeBuckets(context) {
    const filters = context.filters;
    const start = filters.startDate;
    const end = filters.endDate;
    const spanDays = start && end
      ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1)
      : 31;
    const mode = spanDays > 120 ? 'month' : spanDays > 45 ? 'week' : 'day';
    const buckets = new Map();

    function keyFor(date) {
      if (mode === 'month') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (mode === 'week') {
        const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const day = (copy.getDay() + 6) % 7;
        copy.setDate(copy.getDate() - day);
        return localDateInputValue(copy);
      }
      return localDateInputValue(date);
    }

    function labelFor(key) {
      const date = parseAnyDate(key);
      if (mode === 'month') {
        return new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(date);
      }
      if (mode === 'week') {
        return `Mgg ${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date)}`;
      }
      return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date);
    }

    function ensureBucket(date) {
      const key = keyFor(date);
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          label: labelFor(key),
          omzet: 0,
          hpp: 0,
          expense: 0,
          stockIn: 0,
          stockOut: 0,
          batchVolume: 0,
          bottlingVolume: 0
        });
      }
      return buckets.get(key);
    }

    context.transactionRows.forEach((row) => {
      const bucket = ensureBucket(reportRowDate(row));
      const type = reportEffectiveTransactionType(row);

      if (type === 'PENJUALAN') {
        bucket.omzet += reportSaleRevenue(row);
        bucket.hpp += reportSaleHpp(row);
      }
      if (type === 'PENGELUARAN') bucket.expense += reportExpenseValue(row);
      bucket.stockIn += toNumber(row['Nilai Stok Masuk']);
      bucket.stockOut += toNumber(row['Nilai Stok Keluar/HPP']);
    });

    context.batches.forEach((batch) => {
      ensureBucket(reportBatchDate(batch)).batchVolume += toNumber(batch['Volume Batch (L)']);
    });
    context.bottlings.forEach((row) => {
      ensureBucket(reportBottlingDate(row)).bottlingVolume += toNumber(row['Volume Digunakan (L)']);
    });

    return Array.from(buckets.values()).sort((a, b) => String(a.key).localeCompare(String(b.key)));
  }

  function renderReportTrend(context) {
    const buckets = buildReportTimeBuckets(context);
    let seriesA = [];
    let seriesB = [];
    let title = '';
    let kicker = '';
    let labelA = '';
    let labelB = '';

    if (state.reportActiveTab === 'persediaan') {
      title = 'Nilai stok masuk dan keluar';
      kicker = 'Mutasi persediaan';
      labelA = 'Stok masuk';
      labelB = 'Stok keluar';
      seriesA = buckets.map((bucket) => ({ label: bucket.label, value: bucket.stockIn }));
      seriesB = buckets.map((bucket) => ({ label: bucket.label, value: bucket.stockOut }));
    } else if (state.reportActiveTab === 'produksi') {
      title = 'Volume batch dan bottling';
      kicker = 'Tren produksi';
      labelA = 'Volume batch';
      labelB = 'Volume bottling';
      seriesA = buckets.map((bucket) => ({ label: bucket.label, value: bucket.batchVolume }));
      seriesB = buckets.map((bucket) => ({ label: bucket.label, value: bucket.bottlingVolume }));
    } else if (state.reportActiveTab === 'penjualan') {
      title = 'Omzet dan HPP penjualan';
      kicker = 'Tren penjualan';
      labelA = 'Omzet';
      labelB = 'HPP';
      seriesA = buckets.map((bucket) => ({ label: bucket.label, value: bucket.omzet }));
      seriesB = buckets.map((bucket) => ({ label: bucket.label, value: bucket.hpp }));
    } else {
      title = 'Omzet dan laba operasional';
      kicker = 'Tren laba rugi';
      labelA = 'Omzet';
      labelB = 'Laba operasional';
      seriesA = buckets.map((bucket) => ({ label: bucket.label, value: bucket.omzet }));
      seriesB = buckets.map((bucket) => ({
        label: bucket.label,
        value: bucket.omzet - bucket.hpp - bucket.expense
      }));
    }

    setText('#reportsTrendTitle', title);
    setText('#reportsTrendKicker', kicker);
    renderReportsLineChart(seriesA, seriesB, labelA, labelB);
  }

  function renderReportsLineChart(seriesA, seriesB, labelA, labelB) {
    const container = document.getElementById('reportsTrendChart');
    const legend = document.getElementById('reportsTrendLegend');
    if (!container || !legend) return;

    legend.innerHTML = `
      <span><i class="reports-legend-dot is-primary"></i>${escapeHtml(labelA)}</span>
      <span><i class="reports-legend-dot is-secondary"></i>${escapeHtml(labelB)}</span>
    `;

    const points = Math.max(seriesA.length, seriesB.length);
    const hasValue = [...seriesA, ...seriesB].some((item) => Math.abs(toNumber(item.value)) > 0.000001);

    if (!points || !hasValue) {
      container.innerHTML = '<div class="reports-empty-chart">Belum ada data pada periode ini.</div>';
      return;
    }

    const width = 760;
    const height = 280;
    const padding = { left: 58, right: 18, top: 24, bottom: 48 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const allValues = [...seriesA, ...seriesB].map((item) => toNumber(item.value));
    const minValue = Math.min(0, ...allValues);
    const maxValue = Math.max(1, ...allValues);
    const range = maxValue - minValue || 1;

    function x(index) {
      return padding.left + (points <= 1 ? innerWidth / 2 : index / (points - 1) * innerWidth);
    }

    function y(value) {
      return padding.top + (maxValue - value) / range * innerHeight;
    }

    function pathFor(series) {
      return series.map((item, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(toNumber(item.value)).toFixed(2)}`).join(' ');
    }

    const gridLines = Array.from({length: 5}, (_, index) => {
      const ratio = index / 4;
      const value = maxValue - ratio * range;
      const py = padding.top + ratio * innerHeight;
      return `
        <line x1="${padding.left}" y1="${py}" x2="${width - padding.right}" y2="${py}" class="reports-chart-grid-line"/>
        <text x="${padding.left - 9}" y="${py + 4}" text-anchor="end" class="reports-chart-axis-label">${escapeHtml(formatCompactReportNumber(value))}</text>
      `;
    }).join('');

    const labels = seriesA.map((item, index) => {
      const show = points <= 8 || index === 0 || index === points - 1 || index % Math.ceil(points / 7) === 0;
      return show
        ? `<text x="${x(index)}" y="${height - 17}" text-anchor="middle" class="reports-chart-axis-label">${escapeHtml(item.label)}</text>`
        : '';
    }).join('');

    const dotsA = seriesA.map((item, index) =>
      `<circle cx="${x(index)}" cy="${y(toNumber(item.value))}" r="3.5" class="reports-chart-dot is-primary"><title>${escapeHtml(item.label)} · ${escapeHtml(formatReportMetric(item.value, state.reportActiveTab === 'produksi' ? 'number' : 'currency'))}</title></circle>`
    ).join('');
    const dotsB = seriesB.map((item, index) =>
      `<circle cx="${x(index)}" cy="${y(toNumber(item.value))}" r="3.5" class="reports-chart-dot is-secondary"><title>${escapeHtml(item.label)} · ${escapeHtml(formatReportMetric(item.value, state.reportActiveTab === 'produksi' ? 'number' : 'currency'))}</title></circle>`
    ).join('');

    container.innerHTML = `
      <svg class="reports-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(labelA)} dan ${escapeHtml(labelB)}">
        ${gridLines}
        <line x1="${padding.left}" y1="${y(0)}" x2="${width - padding.right}" y2="${y(0)}" class="reports-chart-zero-line"/>
        <path d="${pathFor(seriesA)}" class="reports-chart-line is-primary"/>
        <path d="${pathFor(seriesB)}" class="reports-chart-line is-secondary"/>
        ${dotsA}
        ${dotsB}
        ${labels}
      </svg>
    `;
  }

  function formatCompactReportNumber(value) {
    const amount = Math.abs(toNumber(value));
    const sign = toNumber(value) < 0 ? '-' : '';
    if (amount >= 1000000000) return `${sign}${numberFormatter.format(amount / 1000000000)} M`;
    if (amount >= 1000000) return `${sign}${numberFormatter.format(amount / 1000000)} jt`;
    if (amount >= 1000) return `${sign}${numberFormatter.format(amount / 1000)} rb`;
    return `${sign}${numberFormatter.format(amount)}`;
  }

  function formatReportMetric(value, format = 'currency') {
    return format === 'currency' ? formatCurrency(value) : formatQuantity(value);
  }

  function buildSalesProductSummary(rows) {
    const map = new Map();

    rows.forEach((row) => {
      const code = String(row['Kode Item'] || '').toUpperCase();
      const key = code || String(row['Nama Item'] || 'Produk');
      if (!map.has(key)) {
        map.set(key, {
          code,
          name: row['Nama Item'] || state.itemMap.get(code)?.name || code || 'Produk',
          qty: 0,
          omzet: 0,
          hpp: 0,
          profit: 0
        });
      }

      const item = map.get(key);
      item.qty += reportSaleQty(row);
      item.omzet += reportSaleRevenue(row);
      item.hpp += reportSaleHpp(row);
      item.profit = item.omzet - item.hpp;
    });

    return Array.from(map.values())
      .filter((item) => item.qty > 0.000001 || item.omzet > 0.000001)
      .sort((a, b) => b.qty - a.qty || b.omzet - a.omzet);
  }

  function buildInventoryCategorySummary(items) {
    const map = new Map();
    items.forEach((item) => {
      const key = String(item.category || item.type || 'Tanpa kategori');
      if (!map.has(key)) map.set(key, {name: key, value: 0, qty: 0, items: 0});
      const entry = map.get(key);
      entry.value += item.stockValue;
      entry.qty += item.stock;
      entry.items += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }

  function buildProductionVariantSummary(rows) {
    const map = new Map();

    rows.forEach((row) => {
      const variant = normalizeBottlingVariant(row.Varian);
      if (!map.has(variant)) {
        map.set(variant, {
          name: variantTitle(variant),
          processes: 0,
          volume: 0,
          output: 0,
          cost: 0,
          potential: 0,
          unit: variant === 'STARTER' ? 'ml' : 'botol'
        });
      }

      const entry = map.get(variant);
      entry.processes += 1;
      entry.volume += toNumber(row['Volume Digunakan (L)']);
      entry.output += toNumber(row.Hasil);
      entry.cost += toNumber(row['HPP Total']);
      entry.potential += toNumber(row['Nilai Potensi']);
    });

    return Array.from(map.values()).sort((a, b) => b.output - a.output);
  }

  function buildPaymentMethodSummary(groups) {
    const map = new Map();

    groups.filter((group) =>
      group.type === 'PENJUALAN' && group.status === 'AKTIF'
    ).forEach((group) => {
      const key = String(group.method || 'LAINNYA').toUpperCase();
      if (!map.has(key)) map.set(key, {name: methodTitle(key), value: 0, count: 0});
      const entry = map.get(key);
      entry.value += group.cashIn;
      entry.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }

  function renderReportBreakdown(context) {
    let title = '';
    let kicker = '';
    let rows = [];
    let formatter = (value) => formatCurrency(value);

    if (state.reportActiveTab === 'persediaan') {
      title = 'Nilai stok per kategori';
      kicker = 'Komposisi persediaan';
      rows = buildInventoryCategorySummary(context.inventory)
        .slice(0, 7)
        .map((item) => ({
          label: item.name,
          value: item.value,
          meta: `${item.items} item · ${formatQuantity(item.qty)} satuan`
        }));
    } else if (state.reportActiveTab === 'produksi') {
      title = 'Output per varian';
      kicker = 'Komposisi produksi';
      rows = buildProductionVariantSummary(context.bottlings)
        .map((item) => ({
          label: item.name,
          value: item.output,
          meta: `${item.processes} proses · ${formatQuantity(item.volume)} L`
        }));
      formatter = (value) => formatQuantity(value);
    } else if (state.reportActiveTab === 'penjualan') {
      title = 'Produk paling laris';
      kicker = 'Peringkat penjualan';
      rows = buildSalesProductSummary(context.saleRows)
        .slice(0, 7)
        .map((item) => ({
          label: item.name,
          value: item.qty,
          meta: `${formatCurrency(item.omzet)} omzet`
        }));
      formatter = (value) => `${formatQuantity(value)} unit`;
    } else {
      title = 'Penjualan per metode';
      kicker = 'Komposisi pembayaran';
      rows = buildPaymentMethodSummary(context.transactionGroups)
        .map((item) => ({
          label: item.name,
          value: item.value,
          meta: `${item.count} transaksi`
        }));
    }

    setText('#reportsBreakdownTitle', title);
    setText('#reportsBreakdownKicker', kicker);
    renderReportsRanking(rows, formatter);
  }

  function renderReportsRanking(rows, formatter) {
    const container = document.getElementById('reportsBreakdownChart');
    if (!container) return;

    container.replaceChildren();

    if (!rows.length || rows.every((row) => toNumber(row.value) <= 0)) {
      container.innerHTML = '<div class="reports-empty-chart">Belum ada data untuk peringkat ini.</div>';
      return;
    }

    const max = Math.max(...rows.map((row) => toNumber(row.value)), 1);

    rows.forEach((row, index) => {
      const item = document.createElement('div');
      item.className = 'reports-ranking-item';

      const head = document.createElement('div');
      head.className = 'reports-ranking-head';

      const copy = document.createElement('div');
      copy.className = 'reports-ranking-copy';

      const number = document.createElement('span');
      number.className = 'reports-ranking-number';
      number.textContent = String(index + 1);

      const text = document.createElement('div');
      const label = document.createElement('strong');
      label.textContent = row.label;
      const meta = document.createElement('span');
      meta.textContent = row.meta || '';
      text.append(label, meta);
      copy.append(number, text);

      const value = document.createElement('strong');
      value.className = 'reports-ranking-value';
      value.textContent = formatter(row.value);

      head.append(copy, value);

      const track = document.createElement('div');
      track.className = 'reports-ranking-track';
      const bar = document.createElement('span');
      bar.style.width = `${Math.max(3, toNumber(row.value) / max * 100)}%`;
      track.append(bar);

      item.append(head, track);
      container.append(item);
    });
  }

  function reportBucketRows(context) {
    return buildReportTimeBuckets(context).map((bucket) => ({
      period: bucket.label,
      omzet: bucket.omzet,
      hpp: bucket.hpp,
      grossProfit: bucket.omzet - bucket.hpp,
      expense: bucket.expense,
      operatingProfit: bucket.omzet - bucket.hpp - bucket.expense
    }));
  }

  function renderReportTable(context) {
    let title = '';
    let kicker = '';
    let caption = '';
    let headers = [];
    let rows = [];

    if (state.reportActiveTab === 'penjualan') {
      title = 'Penjualan per produk';
      kicker = 'Rincian penjualan';
      caption = 'Jumlah, omzet, HPP, laba, dan margin setiap produk.';
      headers = ['Kode', 'Produk', 'Qty Terjual', 'Omzet', 'HPP', 'Laba Kotor', 'Margin'];
      rows = buildSalesProductSummary(context.saleRows).map((item) => [
        item.code || '-',
        item.name,
        `${formatQuantity(item.qty)} unit`,
        formatCurrency(item.omzet),
        formatCurrency(item.hpp),
        formatCurrency(item.profit),
        `${numberFormatter.format(item.omzet > 0 ? item.profit / item.omzet * 100 : 0)}%`
      ]);
    } else if (state.reportActiveTab === 'persediaan') {
      title = 'Nilai stok per item';
      kicker = 'Rincian persediaan';
      caption = 'Stok saat ini, HPP rata-rata, nilai persediaan, dan status minimum.';
      headers = ['Kode', 'Item', 'Kategori', 'Stok', 'HPP Rata-rata', 'Nilai Stok', 'Status'];
      rows = context.inventory
        .slice()
        .sort((a, b) => b.stockValue - a.stockValue)
        .map((item) => [
          item.code,
          item.name,
          item.category || item.type || '-',
          `${formatQuantity(item.stock)} ${item.unit || ''}`.trim(),
          formatCurrency(item.averageCost),
          formatCurrency(item.stockValue),
          item.stock <= 0 ? 'HABIS' : item.stock <= toNumber(item.minStock) ? 'MENIPIS' : 'AMAN'
        ]);
    } else if (state.reportActiveTab === 'produksi') {
      title = 'Rincian bottling dan starter';
      kicker = 'Rincian produksi';
      caption = 'Setiap proses bottling pada periode dan varian yang dipilih.';
      headers = ['Tanggal', 'Bottling ID', 'Batch ID', 'Varian', 'Volume F1', 'Hasil', 'HPP Total', 'HPP/Hasil', 'Nilai Potensi'];
      rows = context.bottlings
        .slice()
        .sort((a, b) => reportBottlingDate(b) - reportBottlingDate(a))
        .map((row) => [
          formatDate(row.Tanggal || row.Timestamp),
          row['Bottling ID'] || '-',
          row['Batch ID'] || '-',
          variantTitle(normalizeBottlingVariant(row.Varian)),
          `${formatQuantity(row['Volume Digunakan (L)'])} L`,
          `${formatQuantity(row.Hasil)} ${row['Satuan Hasil'] || ''}`.trim(),
          formatCurrency(row['HPP Total']),
          formatCurrency(row['HPP per Hasil']),
          formatCurrency(row['Nilai Potensi'])
        ]);
    } else {
      title = 'Laba rugi per periode';
      kicker = 'Rincian laba rugi';
      caption = 'Omzet dikurangi HPP dan pengeluaran operasional.';
      headers = ['Periode', 'Omzet', 'HPP', 'Laba Kotor', 'Pengeluaran', 'Laba Operasional'];
      rows = reportBucketRows(context).map((row) => [
        row.period,
        formatCurrency(row.omzet),
        formatCurrency(row.hpp),
        formatCurrency(row.grossProfit),
        formatCurrency(row.expense),
        formatCurrency(row.operatingProfit)
      ]);
    }

    setText('#reportsTableTitle', title);
    setText('#reportsTableKicker', kicker);
    setText('#reportsTableCaption', caption);
    setText('#reportsTableCount', `${rows.length} baris`);

    const head = document.getElementById('reportsTableHead');
    const body = document.getElementById('reportsTableBody');
    if (!head || !body) return;

    head.innerHTML = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>`;
    body.replaceChildren();

    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="${headers.length}" class="reports-table-empty">Belum ada data pada periode ini.</td></tr>`;
    } else {
      rows.slice(0, 500).forEach((row) => {
        const tr = document.createElement('tr');
        row.forEach((value) => {
          const td = document.createElement('td');
          td.textContent = String(value ?? '-');
          tr.append(td);
        });
        body.append(tr);
      });
    }

    state.currentReportTable = {
      title,
      headers,
      rows,
      filename: `MERAMU_${state.reportActiveTab}_${localDateInputValue(new Date())}.csv`
    };
  }

  function renderReportFootnote(context) {
    const element = document.getElementById('reportsFootnote');
    if (!element) return;

    const generated = state.reportData?.generatedAt
      ? formatDateTime(state.reportData.generatedAt)
      : formatDateTime(new Date());
    const range = [
      context.filters.startDate ? formatDate(context.filters.startDate) : 'awal data',
      context.filters.endDate ? formatDate(context.filters.endDate) : 'hari ini'
    ].join(' sampai ');

    element.textContent = `Periode ${range} · diperbarui ${generated} · ${formatQuantity(context.transactionRows.length)} baris jurnal sesuai filter.`;
  }

  function exportCurrentReportCsv() {
    const report = state.currentReportTable;
    if (!report?.headers?.length) {
      showToast('Belum ada tabel laporan untuk diekspor.', 'warning');
      return;
    }

    const lines = [
      [report.title],
      [],
      report.headers,
      ...report.rows
    ].map((row) => row.map(escapeCsvCell).join(','));

    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.filename || 'MERAMU_Laporan.csv';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast('Laporan CSV berhasil dibuat.', 'success');
  }

  function escapeCsvCell(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  function openTransactionHistoryPage() {
    navigate('riwayat-transaksi');
    renderTransactionHistory();
  }

  function resetTransactionHistoryFilters() {
    const search = document.getElementById('transactionHistorySearch');
    const start = document.getElementById('transactionHistoryStartDate');
    const end = document.getElementById('transactionHistoryEndDate');
    const type = document.getElementById('transactionHistoryType');
    const status = document.getElementById('transactionHistoryStatus');
    const method = document.getElementById('transactionHistoryMethod');

    if (search) search.value = '';
    if (start) start.value = '';
    if (end) end.value = '';
    if (type) type.value = '';
    if (status) status.value = '';
    if (method) method.value = '';
    renderTransactionHistory();
  }

  function transactionHistoryDateBoundary(value, endOfDay = false) {
    if (!value) return null;
    const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getFilteredTransactionHistoryGroups() {
    const search = String(document.getElementById('transactionHistorySearch')?.value || '').trim().toLowerCase();
    const type = String(document.getElementById('transactionHistoryType')?.value || '').toUpperCase();
    const status = String(document.getElementById('transactionHistoryStatus')?.value || '').toUpperCase();
    const method = String(document.getElementById('transactionHistoryMethod')?.value || '').toUpperCase();
    const startDate = transactionHistoryDateBoundary(
      document.getElementById('transactionHistoryStartDate')?.value,
      false
    );
    const endDate = transactionHistoryDateBoundary(
      document.getElementById('transactionHistoryEndDate')?.value,
      true
    );

    return aggregateTransactionRows(state.transactions).filter((group) => {
      if (search && !group.searchText.includes(search)) return false;
      if (type && group.type !== type) return false;
      if (status && group.status !== status) return false;
      if (method && String(group.method || '-').toUpperCase() !== method) return false;
      if (startDate && group.date < startDate) return false;
      if (endDate && group.date > endDate) return false;
      return true;
    });
  }

  function renderTransactionHistory() {
    const container = document.getElementById('transactionHistoryList');
    if (!container) return;

    const groups = getFilteredTransactionHistoryGroups();
    renderTransactionHistorySummary(groups);

    const caption = document.getElementById('transactionHistoryCaption');
    const count = document.getElementById('transactionHistoryCount');
    if (caption) {
      caption.textContent = groups.length
        ? `Menampilkan ${groups.length} transaksi dari ${aggregateTransactionRows(state.transactions).length} transaksi yang tersedia.`
        : 'Tidak ada transaksi yang cocok dengan filter.';
    }
    if (count) count.textContent = `${groups.length} transaksi`;

    container.replaceChildren();

    if (!groups.length) {
      container.innerHTML = `
        <div class="card transaction-history-empty">
          <div class="empty-state-icon">⌕</div>
          <h3>Transaksi tidak ditemukan</h3>
          <p>Ubah tanggal, jenis transaksi, metode pembayaran, atau kata pencarian.</p>
        </div>
      `;
      return;
    }

    groups.forEach((group) => {
      container.append(createTransactionHistoryCard(group));
    });
  }

  function renderTransactionHistorySummary(groups) {
    const summary = (groups || []).reduce((result, group) => {
      result.cashIn += group.cashIn;
      result.cashOut += group.cashOut;
      result.stockIn += group.stockValueIn;
      result.stockOut += group.stockValueOut;
      return result;
    }, {
      cashIn: 0,
      cashOut: 0,
      stockIn: 0,
      stockOut: 0
    });

    setText('#transactionHistoryTotal', formatQuantity(groups.length));
    setText('#transactionHistoryCashIn', formatCurrency(summary.cashIn));
    setText('#transactionHistoryCashOut', formatCurrency(summary.cashOut));
    setText('#transactionHistoryStockIn', formatCurrency(summary.stockIn));
    setText('#transactionHistoryStockOut', formatCurrency(summary.stockOut));
    setText(
      '#transactionHistoryCancelled',
      formatQuantity((groups || []).filter((group) => group.status === 'DIBATALKAN').length)
    );
  }

  function createTransactionHistoryCard(group) {
    const card = document.createElement('article');
    card.className = `card transaction-history-card tone-${transactionHistoryTone(group.type)} status-${String(group.status || 'aktif').toLowerCase()}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Lihat detail ${group.reference || transactionTypeTitle(group.type)}`);

    const openDetail = () => openTransactionHistoryDetail(group);
    card.addEventListener('click', openDetail);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetail();
      }
    });

    const header = document.createElement('div');
    header.className = 'transaction-history-card-header';

    const identity = document.createElement('div');
    identity.className = 'transaction-history-card-identity';

    const icon = document.createElement('span');
    icon.className = `transaction-history-card-icon ${transactionTone(group.type)}`.trim();
    icon.innerHTML = transactionIcon(group.type);

    const copy = document.createElement('div');
    copy.className = 'transaction-history-card-copy';

    const titleLine = document.createElement('div');
    titleLine.className = 'transaction-history-card-title-line';

    const title = document.createElement('strong');
    title.textContent = transactionTypeTitle(group.type);

    const chip = document.createElement('span');
    chip.className = `transaction-history-type-chip tone-${transactionHistoryTone(group.type)}`;
    chip.textContent = group.reference || 'Tanpa referensi';

    titleLine.append(title, chip);

    if (group.status !== 'AKTIF') {
      const statusChip = document.createElement('span');
      statusChip.className = `transaction-history-status-chip status-${String(group.status).toLowerCase()}`;
      statusChip.textContent = group.status === 'DIBATALKAN' ? 'DIBATALKAN' : 'JURNAL PEMBATALAN';
      titleLine.append(statusChip);
    }

    const subtitle = document.createElement('span');
    subtitle.textContent = [
      formatDateTime(group.date),
      group.method && group.method !== '-' ? methodTitle(group.method) : 'Tanpa arus kas',
      group.party
    ].filter(Boolean).join(' · ');

    copy.append(titleLine, subtitle);
    identity.append(icon, copy);

    const primary = document.createElement('div');
    primary.className = 'transaction-history-primary-value';

    if (group.cashIn > 0) {
      primary.classList.add('is-income');
      primary.innerHTML = `<span>Pemasukan</span><strong>+${escapeHtml(formatCurrency(group.cashIn))}</strong>`;
    } else if (group.cashOut > 0) {
      primary.classList.add('is-expense');
      primary.innerHTML = `<span>Pengeluaran</span><strong>-${escapeHtml(formatCurrency(group.cashOut))}</strong>`;
    } else if (group.stockValueIn > 0 && group.stockValueOut <= 0) {
      primary.classList.add('is-stock-in');
      primary.innerHTML = `<span>Stok masuk</span><strong>+${escapeHtml(formatCurrency(group.stockValueIn))}</strong>`;
    } else if (group.stockValueOut > 0) {
      primary.classList.add('is-stock-out');
      primary.innerHTML = `<span>Stok keluar</span><strong>-${escapeHtml(formatCurrency(group.stockValueOut))}</strong>`;
    } else {
      primary.innerHTML = `<span>Jurnal</span><strong>${group.rows.length} baris</strong>`;
    }

    header.append(identity, primary);

    const metrics = document.createElement('div');
    metrics.className = 'transaction-history-card-metrics';

    const metricData = [
      ['Item', `${group.uniqueItemCount} item`],
      ['Stok masuk', group.stockValueIn > 0 ? formatCurrency(group.stockValueIn) : 'Rp0'],
      ['Stok keluar/HPP', group.stockValueOut > 0 ? formatCurrency(group.stockValueOut) : 'Rp0']
    ];

    if (group.type === 'PENJUALAN') {
      metricData.push(['Laba kotor', formatCurrency(group.grossProfit)]);
    } else if (group.cashOut > 0) {
      metricData.push(['Kas keluar', formatCurrency(group.cashOut)]);
    } else if (group.cashIn > 0) {
      metricData.push(['Kas masuk', formatCurrency(group.cashIn)]);
    } else {
      metricData.push(['Petugas', group.createdBy || '-']);
    }

    metricData.forEach(([label, value]) => {
      const item = document.createElement('div');
      const labelElement = document.createElement('span');
      labelElement.textContent = label;
      const valueElement = document.createElement('strong');
      valueElement.textContent = value;
      item.append(labelElement, valueElement);
      metrics.append(item);
    });

    const footer = document.createElement('div');
    footer.className = 'transaction-history-card-footer';

    const itemPreview = document.createElement('span');
    const uniqueNames = Array.from(new Set(group.items.filter(Boolean)));
    itemPreview.textContent = uniqueNames.length > 3
      ? `${uniqueNames.slice(0, 3).join(', ')} +${uniqueNames.length - 3} item`
      : uniqueNames.join(', ') || 'Tanpa item persediaan';

    const detailAction = document.createElement('span');
    detailAction.className = 'transaction-history-detail-action';
    detailAction.innerHTML = 'Lihat detail <span class="chevron" aria-hidden="true"></span>';

    footer.append(itemPreview, detailAction);
    card.append(header, metrics, footer);
    return card;
  }

  function transactionHistoryTone(type) {
    const normalized = String(type || '').toUpperCase();
    if (normalized === 'PENJUALAN' || normalized === 'STOK_AWAL') return 'success';
    if (normalized === 'PEMBELIAN' || normalized === 'PENGELUARAN' || normalized === 'PEMAKAIAN') return 'warning';
    if (normalized === 'STOK_OPNAME' || normalized === 'PEMBATALAN') return 'danger';
    return 'info';
  }

  function openTransactionHistoryDetail(group) {
    if (!group) return;

    state.selectedTransactionHistoryKey = `${group.type}|${group.reference}`;
    state.selectedTransactionGroup = group;
    setText('#transactionHistoryDetailKicker', transactionTypeTitle(group.type));
    setText('#transactionHistoryDetailTitle', group.reference || 'Detail Transaksi');
    setText(
      '#transactionHistoryDetailSubtitle',
      `${formatDateTime(group.date)} · ${group.rows.length} baris jurnal`
    );

    const body = document.getElementById('transactionHistoryDetailBody');
    if (body) body.innerHTML = buildTransactionHistoryDetail(group);

    const voidButton = document.getElementById('openTransactionVoidButton');
    const canVoid = isCurrentAppAdmin() &&
      group.status === 'AKTIF' &&
      group.canVoid &&
      group.type !== 'PEMBATALAN';
    if (voidButton) {
      voidButton.hidden = !canVoid;
      voidButton.disabled = !canVoid;
    }

    openSheet('transactionHistoryDetailSheet', 'transactionHistoryDetailBackdrop');
  }

  function closeTransactionHistoryDetail(force = false) {
    closeSheet('transactionHistoryDetailSheet', 'transactionHistoryDetailBackdrop');
    state.selectedTransactionHistoryKey = '';
    state.selectedTransactionGroup = null;
    const voidButton = document.getElementById('openTransactionVoidButton');
    if (voidButton) voidButton.hidden = true;
    document.body.classList.remove('sheet-is-open');
  }

  function buildTransactionHistoryDetail(group) {
    const summaryMetrics = [
      ['Pemasukan', formatCurrency(group.cashIn), 'income'],
      ['Pengeluaran', formatCurrency(group.cashOut), 'expense'],
      ['Nilai stok masuk', formatCurrency(group.stockValueIn), 'stock-in'],
      ['Nilai stok keluar/HPP', formatCurrency(group.stockValueOut), 'stock-out']
    ];

    if (group.type === 'PENJUALAN') {
      summaryMetrics.push(['Laba kotor', formatCurrency(group.grossProfit), group.grossProfit >= 0 ? 'profit' : 'expense']);
    }

    const metricsHtml = summaryMetrics.map(([label, value, tone]) => `
      <div class="transaction-detail-metric tone-${escapeHtml(tone)}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `).join('');

    const metadata = [
      ['Jenis transaksi', transactionTypeTitle(group.type)],
      ['Nomor referensi', group.reference || '-'],
      ['Tanggal dan waktu', formatDateTime(group.date)],
      ['Metode', group.method && group.method !== '-' ? methodTitle(group.method) : 'Tanpa arus kas'],
      ['Pihak terkait', group.party || '-'],
      ['Dibuat oleh', group.createdBy || '-'],
      ['Status', group.status === 'DIBATALKAN'
        ? 'Dibatalkan'
        : group.status === 'PEMBATALAN'
          ? 'Jurnal Pembatalan'
          : 'Aktif']
    ];

    const metadataHtml = metadata.map(([label, value]) => `
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value || '-'))}</strong>
      </div>
    `).join('');

    const linesHtml = group.rows.map((row, index) => {
      const qtyIn = toNumber(row['Qty Masuk']);
      const qtyOut = toNumber(row['Qty Keluar']);
      const unit = row.Satuan || '';
      const movement = qtyIn > 0
        ? `+${formatQuantity(qtyIn)} ${unit}`.trim()
        : qtyOut > 0
          ? `-${formatQuantity(qtyOut)} ${unit}`.trim()
          : '-';
      const movementTone = qtyIn > 0 ? 'in' : qtyOut > 0 ? 'out' : 'neutral';
      const stockValue = toNumber(row['Nilai Stok Masuk']) > 0
        ? `+${formatCurrency(row['Nilai Stok Masuk'])}`
        : toNumber(row['Nilai Stok Keluar/HPP']) > 0
          ? `-${formatCurrency(row['Nilai Stok Keluar/HPP'])}`
          : 'Rp0';
      const cashMovement = toNumber(row.Pemasukan) > 0
        ? `+${formatCurrency(row.Pemasukan)}`
        : toNumber(row.Pengeluaran) > 0
          ? `-${formatCurrency(row.Pengeluaran)}`
          : 'Rp0';

      return `
        <article class="transaction-detail-line">
          <div class="transaction-detail-line-index">${index + 1}</div>

          <div class="transaction-detail-line-item">
            <span>${escapeHtml(row['Jenis Item'] || transactionTypeTitle(group.type))}</span>
            <strong>${escapeHtml(row['Nama Item'] || row['Kode Item'] || 'Jurnal transaksi')}</strong>
            <small>${escapeHtml(row['Kode Item'] || '-')} · ${escapeHtml(unit || 'tanpa satuan')}</small>
          </div>

          <div class="transaction-detail-line-cell">
            <span>Mutasi</span>
            <strong class="tone-${movementTone}">${escapeHtml(movement)}</strong>
          </div>

          <div class="transaction-detail-line-cell">
            <span>HPP per unit</span>
            <strong>${escapeHtml(formatCurrency(row['HPP/Harga Pokok per Unit']))}</strong>
          </div>

          <div class="transaction-detail-line-cell">
            <span>Harga jual/beli</span>
            <strong>${escapeHtml(formatCurrency(row['Harga Jual/Beli per Unit']))}</strong>
          </div>

          <div class="transaction-detail-line-cell">
            <span>Nilai stok</span>
            <strong>${escapeHtml(stockValue)}</strong>
          </div>

          <div class="transaction-detail-line-cell">
            <span>Arus kas</span>
            <strong>${escapeHtml(cashMovement)}</strong>
          </div>
        </article>
      `;
    }).join('');

    return `
      <section class="transaction-detail-summary-grid">
        ${metricsHtml}
      </section>

      <section class="transaction-detail-section">
        <div class="transaction-detail-section-heading">
          <div>
            <span class="sheet-kicker">Informasi transaksi</span>
            <h3>Identitas jurnal</h3>
          </div>
          <span class="transaction-detail-type-badge tone-${transactionHistoryTone(group.type)}">
            ${escapeHtml(transactionTypeTitle(group.type))}
          </span>
        </div>

        <div class="transaction-detail-meta-grid">
          ${metadataHtml}
        </div>
      </section>

      <section class="transaction-detail-section">
        <div class="transaction-detail-section-heading">
          <div>
            <span class="sheet-kicker">Rincian barang dan kas</span>
            <h3>${group.rows.length} baris jurnal</h3>
          </div>
        </div>

        <div class="transaction-detail-lines">
          ${linesHtml}
        </div>
      </section>

      <section class="transaction-detail-note">
        <span>Catatan</span>
        <p>${escapeHtml(group.note || 'Tidak ada catatan untuk transaksi ini.')}</p>
      </section>

      ${buildTransactionCancellationAudit(group)}
    `;
  }

  function buildTransactionCancellationAudit(group) {
    if (group.status === 'DIBATALKAN') {
      return `
        <section class="transaction-cancellation-audit is-cancelled">
          <span class="sheet-kicker">Audit pembatalan</span>
          <h3>Transaksi sudah dibatalkan</h3>
          <div class="transaction-cancellation-audit-grid">
            <div><span>Jurnal pembatalan</span><strong>${escapeHtml(group.cancellationReference || '-')}</strong></div>
            <div><span>Dibatalkan pada</span><strong>${escapeHtml(group.cancelledAt ? formatDateTime(group.cancelledAt) : '-')}</strong></div>
            <div><span>Dibatalkan oleh</span><strong>${escapeHtml(group.cancelledBy || '-')}</strong></div>
            <div><span>Alasan</span><strong>${escapeHtml(group.cancellationReason || '-')}</strong></div>
          </div>
        </section>
      `;
    }

    if (group.status === 'PEMBATALAN') {
      return `
        <section class="transaction-cancellation-audit is-reversal">
          <span class="sheet-kicker">Jurnal pembalik</span>
          <h3>Pembatalan transaksi</h3>
          <div class="transaction-cancellation-audit-grid">
            <div><span>Jenis asli</span><strong>${escapeHtml(transactionTypeTitle(group.originalType))}</strong></div>
            <div><span>Referensi asli</span><strong>${escapeHtml(group.originalReference || '-')}</strong></div>
            <div><span>Dibuat oleh</span><strong>${escapeHtml(group.createdBy || '-')}</strong></div>
            <div><span>Alasan</span><strong>${escapeHtml(group.cancellationReason || group.note || '-')}</strong></div>
          </div>
        </section>
      `;
    }

    if (isCurrentAppAdmin() && ['PRODUKSI_F1', 'BOTTLING'].includes(group.type)) {
      return `
        <section class="transaction-cancellation-audit is-limited">
          <span class="sheet-kicker">Koreksi produksi</span>
          <h3>Tidak dibatalkan dari jurnal transaksi</h3>
          <p>Produksi F1 dan Bottling berkaitan langsung dengan status Batch. Koreksi dilakukan melalui alur Produksi agar volume, hasil, dan status Batch tetap konsisten.</p>
        </section>
      `;
    }

    return '';
  }

  function transactionGroupPrimaryValue(group) {
    if (group.cashIn > 0) return `+${formatCurrency(group.cashIn)}`;
    if (group.cashOut > 0) return `-${formatCurrency(group.cashOut)}`;
    if (group.stockValueIn > 0) return `+${formatCurrency(group.stockValueIn)} stok`;
    if (group.stockValueOut > 0) return `-${formatCurrency(group.stockValueOut)} stok`;
    return `${group.rows.length} baris jurnal`;
  }

  function openTransactionVoidSheet() {
    const group = state.selectedTransactionGroup;
    if (!group || !isCurrentAppAdmin()) return;

    if (group.status !== 'AKTIF' || !group.canVoid) {
      showToast('Transaksi ini tidak dapat dibatalkan.', 'warning');
      return;
    }

    setText('#transactionVoidTitle', `Batalkan ${group.reference}`);
    setText(
      '#transactionVoidSubtitle',
      `${transactionTypeTitle(group.type)} · jurnal asli tetap tersimpan`
    );
    setText('#transactionVoidReference', group.reference || '-');
    setText('#transactionVoidType', transactionTypeTitle(group.type));
    setText('#transactionVoidDate', formatDateTime(group.date));
    setText('#transactionVoidValue', transactionGroupPrimaryValue(group));

    setFieldValue('transactionVoidReason', '');
    const confirmed = document.getElementById('transactionVoidConfirmed');
    const reentry = document.getElementById('transactionVoidReentry');
    if (confirmed) confirmed.checked = false;
    if (reentry) reentry.checked = true;
    setText('#transactionVoidError', '');

    closeSheet('transactionHistoryDetailSheet', 'transactionHistoryDetailBackdrop');
    openSheet('transactionVoidSheet', 'transactionVoidBackdrop');
    window.setTimeout(() => document.getElementById('transactionVoidReason')?.focus(), 220);
  }

  function closeTransactionVoidSheet(force = false) {
    if (state.transactionVoidSubmitting && !force) return;
    closeSheet('transactionVoidSheet', 'transactionVoidBackdrop');

    if (state.selectedTransactionGroup) {
      openSheet('transactionHistoryDetailSheet', 'transactionHistoryDetailBackdrop');
    } else {
      document.body.classList.remove('sheet-is-open');
    }
  }

  function reopenCorrectedTransactionForm(type) {
    switch (String(type || '').toUpperCase()) {
      case 'STOK_AWAL':
        openOpeningStockSheet();
        break;
      case 'PEMBELIAN':
        openPurchaseSheet();
        break;
      case 'PENJUALAN':
        openSaleSheet();
        break;
      case 'PENGELUARAN':
        openExpenseSheet();
        break;
      case 'PEMAKAIAN':
        openStockUsageSheet();
        break;
      case 'STOK_OPNAME':
        openStockOpnameSheet();
        break;
      default:
        navigate('riwayat-transaksi');
    }
  }

  async function handleTransactionVoidSubmit(event) {
    event.preventDefault();

    const group = state.selectedTransactionGroup;
    if (!group || !isCurrentAppAdmin() || state.transactionVoidSubmitting) return;

    const reason = String(document.getElementById('transactionVoidReason')?.value || '').trim();
    const confirmed = Boolean(document.getElementById('transactionVoidConfirmed')?.checked);
    const reopenForm = Boolean(document.getElementById('transactionVoidReentry')?.checked);
    const errorElement = document.getElementById('transactionVoidError');
    const button = document.getElementById('submitTransactionVoidButton');

    if (errorElement) errorElement.textContent = '';

    try {
      if (reason.length < 10) {
        throw new Error('Alasan pembatalan minimal 10 karakter.');
      }
      if (!confirmed) {
        throw new Error('Centang konfirmasi pembatalan terlebih dahulu.');
      }

      state.transactionVoidSubmitting = true;
      setButtonLoading(button, true, 'Membatalkan...');

      const result = await window.MeramuAPI.request(
        'voidTransaction',
        {
          type: group.type,
          reference: group.reference,
          reason,
          confirmed: true
        },
        {token: state.session.token, timeout: 60000}
      );

      closeSheet('transactionVoidSheet', 'transactionVoidBackdrop');
      closeSheet('transactionHistoryDetailSheet', 'transactionHistoryDetailBackdrop');
      state.selectedTransactionHistoryKey = '';
      state.selectedTransactionGroup = null;

      showToast(result.message || 'Transaksi berhasil dibatalkan.', 'success');
      await refreshAppData({showToastOnError: false});
      navigate('riwayat-transaksi');
      renderTransactionHistory();

      if (reopenForm) {
        window.setTimeout(() => reopenCorrectedTransactionForm(group.type), 260);
      }
    } catch (error) {
      if (errorElement) {
        errorElement.textContent = error.message || 'Transaksi gagal dibatalkan.';
      }
      shakeElement(document.getElementById('transactionVoidForm'));
    } finally {
      state.transactionVoidSubmitting = false;
      setButtonLoading(button, false, 'Batalkan Transaksi');
    }
  }

  function renderTransactionActivity() {
    const container = document.getElementById('transactionActivityList');
    if (!container) return;

    container.replaceChildren();
    const groups = aggregateTransactionRows(state.transactions).slice(0, 6);

    if (!groups.length) {
      container.innerHTML = '<div class="list-empty"><strong>Belum ada transaksi</strong><span>Stok awal, pembelian, produksi, dan penjualan akan muncul di sini.</span></div>';
      return;
    }

    groups.forEach((group) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'list-row transaction-activity-row';
      row.setAttribute('aria-label', `Lihat detail ${group.reference || transactionTypeTitle(group.type)}`);
      row.addEventListener('click', () => openTransactionHistoryDetail(group));

      const icon = document.createElement('span');
      icon.className = `list-icon ${transactionTone(group.type)}`;
      icon.innerHTML = transactionIcon(group.type);

      const copy = document.createElement('span');
      copy.className = 'list-copy';
      const title = document.createElement('strong');
      title.textContent = transactionTitle(group);
      const meta = document.createElement('span');
      meta.textContent = transactionSubtitle(group);
      copy.append(title, meta);

      const value = document.createElement('span');
      value.className = `list-value ${group.cashIn > 0 ? 'is-income' : group.cashOut > 0 ? 'is-expense' : ''}`;
      if (group.cashIn > 0) value.textContent = `+${formatCurrency(group.cashIn)}`;
      else if (group.cashOut > 0) value.textContent = `-${formatCurrency(group.cashOut)}`;
      else value.textContent = `${group.uniqueItemCount || group.rows.length} item`;

      row.append(icon, copy, value);
      container.append(row);
    });
  }

  function aggregateTransactionRows(rows) {
    const map = new Map();

    (rows || []).forEach((row) => {
      const type = String(row['Jenis Transaksi'] || '').toUpperCase();
      const reference = String(row['Referensi ID'] || row['Transaksi ID'] || '');
      const key = `${type}|${reference}`;

      if (!map.has(key)) {
        map.set(key, {
          type,
          reference,
          date: parseAnyDate(row.Timestamp || row.Tanggal),
          method: row.Metode || '',
          party: row.Pihak || '',
          note: row.Catatan || '',
          createdBy: row['Dibuat Oleh'] || '',
          status: String(row['Status Transaksi'] || 'AKTIF').toUpperCase(),
          cancellationReference: row['Pembatalan ID'] || '',
          cancellationReason: row['Alasan Pembatalan'] || '',
          cancelledAt: row['Dibatalkan Pada'] || '',
          cancelledBy: row['Dibatalkan Oleh'] || '',
          originalType: row['Jenis Asli'] || '',
          originalReference: row['Referensi Asli'] || '',
          canVoid: Boolean(row['Dapat Dibatalkan']),
          rows: [],
          items: [],
          itemCodes: [],
          itemTypes: [],
          qtyIn: 0,
          qtyOut: 0,
          cashIn: 0,
          cashOut: 0,
          stockValueIn: 0,
          stockValueOut: 0
        });
      }

      const group = map.get(key);
      group.rows.push(row);
      group.items.push(row['Nama Item'] || row['Kode Item'] || 'Item');
      group.itemCodes.push(row['Kode Item'] || '');
      group.itemTypes.push(row['Jenis Item'] || '');
      if (!group.note && row.Catatan) group.note = row.Catatan;
      if (!group.createdBy && row['Dibuat Oleh']) group.createdBy = row['Dibuat Oleh'];
      if (row['Status Transaksi']) group.status = String(row['Status Transaksi']).toUpperCase();
      if (row['Pembatalan ID']) group.cancellationReference = row['Pembatalan ID'];
      if (row['Alasan Pembatalan']) group.cancellationReason = row['Alasan Pembatalan'];
      if (row['Dibatalkan Pada']) group.cancelledAt = row['Dibatalkan Pada'];
      if (row['Dibatalkan Oleh']) group.cancelledBy = row['Dibatalkan Oleh'];
      if (row['Jenis Asli']) group.originalType = row['Jenis Asli'];
      if (row['Referensi Asli']) group.originalReference = row['Referensi Asli'];
      group.canVoid = group.canVoid || Boolean(row['Dapat Dibatalkan']);
      group.qtyIn += toNumber(row['Qty Masuk']);
      group.qtyOut += toNumber(row['Qty Keluar']);
      group.cashIn += toNumber(row.Pemasukan);
      group.cashOut += toNumber(row.Pengeluaran);
      group.stockValueIn += toNumber(row['Nilai Stok Masuk']);
      group.stockValueOut += toNumber(row['Nilai Stok Keluar/HPP']);
      if (parseAnyDate(row.Timestamp || row.Tanggal) > group.date) {
        group.date = parseAnyDate(row.Timestamp || row.Tanggal);
      }
    });

    return Array.from(map.values())
      .map((group) => {
        group.uniqueItemCount = new Set(group.itemCodes.filter(Boolean)).size || group.rows.length;
        group.grossProfit = group.type === 'PENJUALAN'
          ? group.cashIn - group.stockValueOut
          : 0;
        group.searchText = [
          group.type,
          transactionTypeTitle(group.type),
          group.reference,
          group.method,
          group.party,
          group.note,
          group.createdBy,
          group.status,
          group.cancellationReference,
          group.cancellationReason,
          group.originalType,
          group.originalReference,
          ...group.items,
          ...group.itemCodes,
          ...group.itemTypes
        ].filter(Boolean).join(' ').toLowerCase();
        return group;
      })
      .sort((a, b) => b.date - a.date);
  }

  function transactionTypeTitle(type) {
    const labels = {
      STOK_AWAL: 'Stok Awal',
      PEMBELIAN: 'Pembelian Bahan',
      PRODUKSI_F1: 'Produksi Batch F1',
      BOTTLING: 'Bottling',
      PENJUALAN: 'Penjualan',
      PENGELUARAN: 'Pengeluaran',
      PEMAKAIAN: 'Pemakaian Bahan',
      STOK_OPNAME: 'Stok Opname',
      KOREKSI: 'Koreksi Stok',
      PEMBATALAN: 'Pembatalan Transaksi'
    };
    return labels[String(type || '').toUpperCase()] || statusTitle(type);
  }

  function transactionTitle(group) {
    const labels = {
      STOK_AWAL: 'Stok awal',
      PEMBELIAN: 'Pembelian bahan',
      PRODUKSI_F1: 'Produksi Batch F1',
      BOTTLING: 'Bottling produk',
      PENJUALAN: 'Penjualan',
      PENGELUARAN: 'Pengeluaran',
      PEMAKAIAN: 'Pemakaian bahan',
      STOK_OPNAME: 'Stok opname',
      KOREKSI: 'Koreksi stok',
      PEMBATALAN: 'Pembatalan transaksi'
    };

    if (group.type === 'PENGELUARAN' && group.note) {
      const parts = String(group.note).split(' · ').filter(Boolean);
      const name = parts[1] || parts[0];
      if (name) return `Pengeluaran · ${name}`;
    }

    if (group.type === 'PEMAKAIAN' && group.note) {
      const parts = String(group.note).split(' · ').filter(Boolean);
      const purpose = parts[0] || 'Operasional';
      return `Pemakaian · ${statusTitle(purpose)}`;
    }

    if (group.type === 'STOK_OPNAME') {
      return `Stok opname · ${group.reference}`;
    }

    return `${labels[group.type] || statusTitle(group.type)} ${group.reference}`.trim();
  }

  function transactionSubtitle(group) {
    if (group.type === 'STOK_OPNAME') {
      const uniqueItems = Array.from(new Set(group.items.filter(Boolean)));
      const itemText = uniqueItems.length > 2
        ? `${uniqueItems.slice(0, 2).join(', ')} +${uniqueItems.length - 2} item`
        : uniqueItems.join(', ');
      const parts = String(group.note || '').split(' · ').filter(Boolean);
      const category = String(parts[0] || '').replace(/^OPNAME\s+/i, '');
      const details = [
        itemText,
        category && category !== 'SEMUA KATEGORI' ? statusTitle(category) : '',
        formatDate(group.date)
      ].filter(Boolean);
      return details.join(' · ');
    }

    if (group.type === 'PEMAKAIAN') {
      const uniqueItems = Array.from(new Set(group.items.filter(Boolean)));
      const itemText = uniqueItems.length > 2
        ? `${uniqueItems.slice(0, 2).join(', ')} +${uniqueItems.length - 2} item`
        : uniqueItems.join(', ');
      const parts = String(group.note || '').split(' · ').filter(Boolean);
      const details = [
        itemText,
        parts[1] || '',
        formatDate(group.date)
      ].filter(Boolean);
      return details.join(' · ');
    }

    if (group.type === 'PENGELUARAN') {
      const parts = String(group.note || '').split(' · ').filter(Boolean);
      const category = parts[0] || 'Operasional';
      const details = [
        category,
        group.party,
        group.method && group.method !== '-' ? methodTitle(group.method) : '',
        formatDate(group.date)
      ].filter(Boolean);
      return details.join(' · ');
    }

    const uniqueItems = Array.from(new Set(group.items.filter(Boolean)));
    const itemText = uniqueItems.length > 2
      ? `${uniqueItems.slice(0, 2).join(', ')} +${uniqueItems.length - 2} item`
      : uniqueItems.join(', ');
    const details = [
      itemText,
      group.party,
      group.method && group.method !== '-' ? group.method : '',
      formatDate(group.date)
    ].filter(Boolean);
    return details.join(' · ');
  }

  function transactionTone(type) {
    if (type === 'PEMBELIAN' || type === 'PENGELUARAN' || type === 'PEMAKAIAN') return 'warning';
    if (type === 'PENJUALAN') return 'info';
    if (type === 'STOK_OPNAME' || type === 'KOREKSI' || type === 'PEMBATALAN') return 'danger';
    return '';
  }

  function transactionIcon(type) {
    if (type === 'PEMBATALAN') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 7h10v10H7z"/><path d="m8 8 8 8M16 8l-8 8"/></svg>';
    }
    if (type === 'STOK_OPNAME') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h4"/><path d="m15 15 1.5 1.5L20 13"/></svg>';
    }
    if (type === 'PEMBELIAN') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5h2l2 11h10l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>';
    }
    if (type === 'STOK_AWAL') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>';
    }
    if (type === 'PENJUALAN') {
      return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5h16v13H4z"/><path d="M4 9h16M8 14h3"/></svg>';
    }
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/></svg>';
  }

  function renderStockAttention() {
    const container = document.getElementById('stockAttentionList');
    if (!container) return;

    container.replaceChildren();
    const rows = (state.initialData?.stock || [])
      .filter((item) => item.status === 'HABIS' || item.status === 'MENIPIS')
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'HABIS' ? -1 : 1;
        return toNumber(a.stock) - toNumber(b.stock);
      })
      .slice(0, 10);

    if (!rows.length) {
      container.innerHTML = '<div class="list-empty is-success"><strong>Semua stok aman</strong><span>Tidak ada item habis atau menipis saat ini.</span></div>';
      return;
    }

    rows.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'list-row stock-attention-row';

      const icon = document.createElement('span');
      icon.className = `list-icon ${item.status === 'HABIS' ? 'danger' : 'warning'}`;
      icon.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.5h.01"/></svg>';

      const copy = document.createElement('span');
      copy.className = 'list-copy';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const detail = document.createElement('span');
      detail.textContent = `${item.code} · minimum ${formatQuantity(item.minStock)} ${item.unit}`;
      copy.append(name, detail);

      const value = document.createElement('span');
      value.className = `list-value stock-status-value ${item.status === 'HABIS' ? 'is-out' : 'is-low'}`;
      value.innerHTML = `<strong>${formatQuantity(item.stock)} ${escapeHtml(item.unit)}</strong><small>${item.status}</small>`;

      row.append(icon, copy, value);
      container.append(row);
    });
  }

  function openBatchForm() {
    if (!state.initialData) {
      showToast('Data master masih dimuat. Tunggu sebentar lalu coba lagi.', 'warning');
      refreshAppData({ showToastOnError: true });
      return;
    }

    const form = document.getElementById('batchForm');
    if (!form) return;
    form.reset();
    document.getElementById('batchDate').value = localDateInputValue(new Date());
    document.getElementById('batchVolume').value = '10';
    document.getElementById('batchFormError').textContent = '';
    renderBatchRecipePreview();

    openSheet('batchFormSheet', 'batchSheetBackdrop');
    window.setTimeout(() => document.getElementById('batchVolume')?.focus(), 260);
  }

  function closeBatchForm(force = false) {
    if (state.batchSubmitting && !force) return;
    closeSheet('batchFormSheet', 'batchSheetBackdrop');
    document.body.classList.remove('sheet-is-open');
  }

  function renderBatchRecipePreview() {
    const container = document.getElementById('batchRecipePreview');
    const statusElement = document.getElementById('batchStockStatus');
    const costElement = document.getElementById('batchEstimatedCost');
    if (!container || !statusElement || !costElement) return;

    const volume = toNumber(document.getElementById('batchVolume')?.value);
    const recipes = (state.initialData?.recipes || []).filter((recipe) =>
      String(recipe.process).toUpperCase() === 'F1' &&
      String(recipe.direction).toUpperCase() === 'KELUAR' &&
      recipe.active !== false
    );

    container.replaceChildren();
    costElement.textContent = 'Rp0';

    if (!volume || volume <= 0) {
      container.innerHTML = '<p class="recipe-empty">Masukkan volume untuk melihat kebutuhan bahan.</p>';
      setRecipeStatus('neutral', 'Masukkan volume batch terlebih dahulu.');
      return;
    }

    if (!recipes.length) {
      container.innerHTML = '<p class="recipe-empty">Resep F1 belum ditemukan di database.</p>';
      setRecipeStatus('danger', 'Master resep F1 belum tersedia.');
      return;
    }

    let totalCost = 0;
    let allEnough = true;
    let shortageCount = 0;

    recipes.forEach((recipe) => {
      const code = String(recipe.code || '').toUpperCase();
      const item = state.itemMap.get(code) || {};
      const stockItem = state.stockMap.get(code) || item;
      const required = toNumber(recipe.qty) * volume;
      const available = toNumber(stockItem.stock);
      const enough = available >= required;
      const unit = recipe.unit || item.unit || '';
      const averageCost = toNumber(item.averageCost || stockItem.averageCost);

      totalCost += required * averageCost;
      if (!enough) {
        allEnough = false;
        shortageCount += 1;
      }

      const row = document.createElement('div');
      row.className = `recipe-row${enough ? '' : ' is-short'}`;

      const copy = document.createElement('div');
      copy.className = 'recipe-row-copy';
      const name = document.createElement('strong');
      name.textContent = item.name || stockItem.name || code;
      const detail = document.createElement('span');
      detail.textContent = `${code} · stok ${formatQuantity(available)} ${unit}`;
      copy.append(name, detail);

      const value = document.createElement('div');
      value.className = 'recipe-row-value';
      const requiredText = document.createElement('strong');
      requiredText.textContent = `${formatQuantity(required)} ${unit}`;
      const stateText = document.createElement('span');
      stateText.textContent = enough ? 'CUKUP' : `KURANG ${formatQuantity(required - available)}`;
      value.append(requiredText, stateText);

      row.append(copy, value);
      container.append(row);
    });

    costElement.textContent = formatCurrency(totalCost);
    if (allEnough) setRecipeStatus('success', `Stok cukup untuk membuat ${formatQuantity(volume)} liter F1.`);
    else setRecipeStatus('danger', `${shortageCount} bahan belum mencukupi. Batch belum dapat disimpan.`);
  }

  function setRecipeStatus(status, message) {
    const element = document.getElementById('batchStockStatus');
    if (!element) return;
    element.dataset.status = status;
    element.textContent = message;
  }

  function canCreateBatch(volume) {
    const recipes = (state.initialData?.recipes || []).filter((recipe) =>
      String(recipe.process).toUpperCase() === 'F1' &&
      String(recipe.direction).toUpperCase() === 'KELUAR' &&
      recipe.active !== false
    );
    return recipes.length > 0 && recipes.every((recipe) => {
      const stock = state.stockMap.get(String(recipe.code).toUpperCase());
      return toNumber(stock?.stock) >= toNumber(recipe.qty) * volume;
    });
  }

  async function handleBatchSubmit(event) {
    event.preventDefault();
    if (state.batchSubmitting) return;

    const form = event.currentTarget;
    const errorElement = document.getElementById('batchFormError');
    const submitButton = document.getElementById('submitBatchButton');
    const volume = toNumber(form.volume.value);

    errorElement.textContent = '';
    if (!form.date.value || volume <= 0) {
      errorElement.textContent = 'Tanggal dan volume batch wajib diisi.';
      shakeElement(form);
      return;
    }
    if (!canCreateBatch(volume)) {
      errorElement.textContent = 'Stok bahan belum cukup. Periksa daftar kebutuhan di atas.';
      shakeElement(document.getElementById('batchRecipePreview'));
      return;
    }

    const payload = {
      date: form.date.value,
      volume,
      phInitial: form.phInitial.value === '' ? '' : toNumber(form.phInitial.value),
      brixInitial: form.brixInitial.value === '' ? '' : toNumber(form.brixInitial.value),
      note: form.note.value.trim()
    };

    state.batchSubmitting = true;
    setButtonLoading(submitButton, true, 'Menyimpan batch...');

    try {
      const result = await window.MeramuAPI.request('createBatch', payload, { token: state.session.token, timeout: 45000 });
      closeBatchForm(true);

      const reminder = result.calendarReminder || {};
      if (reminder.ok === false) {
        showToast(`${result.batchId} tersimpan, tetapi pengingat Calendar gagal dibuat.`, 'warning');
      } else {
        showToast(`${result.batchId} berhasil dibuat dan pengingat dijadwalkan.`, 'success');
      }

      navigate('produksi');
      await refreshAppData({ showToastOnError: false });
    } catch (error) {
      if (isSessionError(error)) {
        closeBatchForm(true);
        localStorage.removeItem(config.SESSION_KEY);
        state.session = null;
        openLogin();
        showToast('Sesi berakhir. Silakan masuk kembali.', 'warning');
      } else {
        errorElement.textContent = error.message || 'Batch gagal disimpan.';
        shakeElement(form);
      }
    } finally {
      state.batchSubmitting = false;
      setButtonLoading(submitButton, false, 'Simpan & Jadwalkan Pengingat');
    }
  }

  function resolvePageName(page) {
    if (page === 'stok-detail') {
      return stockGroupConfig(state.stockDetailGroup).title;
    }
    return pageNames[page] || 'MERAMU';
  }

  function navigate(page, persist = true) {
    if (!pageNames[page]) return;
    if (state.session && !canNavigateToPage(page)) {
      page = 'dashboard';
      if (persist) showToast('Akun ini tidak memiliki akses ke halaman tersebut.', 'warning');
    }
    state.page = page;
    let activeSection = null;

    document.querySelectorAll('.page-section').forEach((section) => {
      const active = section.dataset.page === page;
      section.classList.toggle('is-active', active);
      if (active) activeSection = section;
    });

    const navigationPage = page === 'riwayat-produksi'
      ? 'produksi'
      : page === 'riwayat-transaksi'
        ? 'transaksi'
        : page === 'stok-detail'
          ? 'stok'
          : page === 'laporan' || page === 'master-item' || page === 'master-resep' || page === 'label-print' || page === 'pengaturan'
            ? 'lainnya'
            : page;

    document.querySelectorAll('[data-page-target]').forEach((button) => {
      const active = button.dataset.pageTarget === navigationPage;
      button.classList.toggle('is-active', active);
      if (active) {
        button.setAttribute('aria-current', 'page');
        restartClass(button, 'motion-nav-pop');
      } else {
        button.removeAttribute('aria-current');
        button.classList.remove('motion-nav-pop');
      }
    });

    if (activeSection) restartClass(activeSection, 'motion-page-enter');

    const resolvedPageName = resolvePageName(page);
    if (activeSection) activeSection.setAttribute('aria-label', resolvedPageName);

    document.querySelectorAll('[data-current-page]').forEach((element) => {
      element.textContent = resolvedPageName;
    });

    const businessName = document.querySelector('[data-business-name]')?.textContent?.trim() || 'MERAMU';
    document.title = `${resolvedPageName} · ${businessName}`;

    if (page === 'riwayat-produksi') renderProductionHistory();
    if (page === 'riwayat-transaksi') renderTransactionHistory();
    if (page === 'laporan') {
      populateReportCategoryOptions();
      renderReportsPage();
      loadReportData();
    }
    if (page === 'stok-detail') renderStockDetailPage();
    if (page === 'master-item') {
      populateMasterItemFilters();
      renderMasterItemsPage();
    }
    if (page === 'master-resep') {
      renderMasterRecipesPage();
    }
    if (page === 'label-print') {
      renderProductionLabelPage();
    }
    if (page === 'pengaturan') {
      renderAppSettingsTabs();
      loadAppSettings();
    }
    if (persist) localStorage.setItem(config.LAST_PAGE_KEY, page);
    document.querySelector('.app-main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateAnimatedValue(selector, value, format) {
    const element = document.querySelector(selector);
    if (!element) return;
    element.dataset.countValue = String(value);
    element.dataset.countFormat = format;
    animateNumber(element, value, format, 520);
  }

  function animateDashboardNumbers() {
    document.querySelectorAll('[data-count-up]').forEach((element) => {
      const target = Number(element.dataset.countValue || 0);
      animateNumber(element, target, element.dataset.countFormat || 'integer', 650);
    });
  }

  function animateNumber(element, target, format, duration) {
    if (!element || !Number.isFinite(target)) return;
    const startTime = performance.now();
    const formatter = createNumberFormatter(format);

    function frame(now) {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      element.textContent = formatter(Math.round(target * eased));
      if (elapsed < 1) requestAnimationFrame(frame);
      else restartClass(element, 'motion-count-done');
    }
    requestAnimationFrame(frame);
  }

  function createNumberFormatter(format) {
    if (format === 'currency') return (value) => formatCurrency(value);
    if (format === 'compact-currency') {
      return (value) => {
        if (value >= 1000000) return `Rp${(value / 1000000).toFixed(value % 1000000 ? 1 : 0).replace('.', ',')}JT`;
        if (value >= 1000) return `Rp${Math.round(value / 1000)}K`;
        return `Rp${numberFormatter.format(value)}`;
      };
    }
    return (value) => numberFormatter.format(value);
  }

  function setDashboardLoading(loading) {
    document.querySelectorAll('.dashboard-live-value')
      .forEach((element) => element.classList.toggle('skeleton', loading));

    ['dashboardRoleKpiGrid', 'dashboardTrendChart', 'dashboardRecentActivityList',
      'dashboardRankingList', 'dashboardVariantList']
      .forEach((id) => document.getElementById(id)?.classList.toggle('is-loading', loading));
  }

  function renderDashboardError(message) {
    const errorMessage = escapeHtml(message || 'Data gagal dimuat.');
    ['dashboardAttentionList', 'dashboardRoleKpiGrid', 'dashboardTrendChart',
      'dashboardRecentActivityList', 'dashboardRankingList', 'dashboardVariantList']
      .forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = `<div class="dashboard-data-error">${errorMessage}</div>`;
      });
  }

  function fillDynamicText() {
    const now = new Date();
    const greeting = getGreeting(now.getHours());
    const fullDate = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(now);

    document.querySelectorAll('[data-greeting]').forEach((element) => element.textContent = greeting);
    document.querySelectorAll('[data-current-date]').forEach((element) => element.textContent = fullDate);
    document.querySelectorAll('[data-app-version]').forEach((element) => element.textContent = `Versi ${config.VERSION}`);
  }

  function getGreeting(hour) {
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  }

  function getInitials(value = '') {
    return value.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'MR';
  }

  function formatRole(role = '') {
    const normalized = String(role || '').toUpperCase();
    if (normalized === 'ADMIN' || normalized === 'ADMINISTRATOR') return 'Administrator';
    if (normalized === 'OWNER') return 'Owner';
    if (normalized === 'PRODUKSI' || normalized === 'PRODUCTION') return 'Produksi';
    if (normalized === 'KASIR' || normalized === 'CASHIER') return 'Kasir';
    return role || 'Pengguna';
  }

  function setButtonLoading(button, loading, text) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
      button.replaceChildren();
      const wrap = document.createElement('span');
      wrap.className = 'button-loading-content';
      const spinner = document.createElement('span');
      spinner.className = 'button-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = text;
      wrap.append(spinner, label);
      button.append(wrap);
      return;
    }
    button.disabled = false;
    button.classList.remove('is-loading');
    button.setAttribute('aria-busy', 'false');
    button.innerHTML = button.dataset.originalHtml || text;
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const normalizedType = toastSymbols[type] ? type : 'info';
    toast.className = `toast toast-${normalizedType}`;
    toast.replaceChildren();
    const content = document.createElement('span');
    content.className = 'toast-content';
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = toastSymbols[normalizedType];
    const label = document.createElement('span');
    label.className = 'toast-message';
    label.textContent = message;
    content.append(icon, label);
    toast.append(content);
    toast.classList.add('is-visible');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
  }

  function monitorConnectivity() {
    const updateConnectivity = () => {
      const offline = navigator.onLine === false;
      const banner = document.getElementById('offlineBanner');

      if (banner) {
        if (offline) banner.removeAttribute('hidden');
        else banner.setAttribute('hidden', '');
      }

      renderClientPwaHealth();
    };

    window.addEventListener('offline', () => {
      updateConnectivity();
      showToast('Perangkat offline. Aktivitas baru belum dapat dikirim.', 'warning');
    });

    window.addEventListener('online', () => {
      updateConnectivity();
      showToast('Koneksi internet kembali tersedia.', 'success');
      if (state.session) refreshAppData({showToastOnError: false});
    });

    updateConnectivity();
  }

  function showInstallBanner() {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    document.getElementById('installBanner')?.removeAttribute('hidden');
  }

  async function installApp() {
    if (!state.deferredInstallPrompt) {
      showToast('Gunakan menu browser lalu pilih “Tambahkan ke Layar Utama”.', 'info');
      return;
    }
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    document.getElementById('installBanner')?.setAttribute('hidden', '');
  }

  function dismissInstall() {
    document.getElementById('installBanner')?.setAttribute('hidden', '');
  }

  function restartClass(element, className) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function animatePress(element) {
    if (!element) return;
    element.animate([
      { transform: 'scale(1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }
    ], { duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  }

  function shakeElement(element) {
    restartClass(element, 'motion-shake');
  }

  function showAppUpdateBanner() {
    state.updateAvailable = true;
    document.getElementById('appUpdateBanner')?.removeAttribute('hidden');
  }

  function dismissAppUpdate() {
    document.getElementById('appUpdateBanner')?.setAttribute('hidden', '');
  }

  function applyAppUpdate() {
    const registration = state.serviceWorkerRegistration;
    const waiting = registration?.waiting;

    state.refreshingForUpdate = true;
    document.getElementById('appUpdateBanner')?.setAttribute('hidden', '');

    if (waiting) {
      waiting.postMessage({type: 'SKIP_WAITING'});
      return;
    }

    window.location.reload();
  }

  function watchServiceWorkerRegistration(registration) {
    state.serviceWorkerRegistration = registration;

    if (registration.waiting && navigator.serviceWorker.controller) {
      showAppUpdateBanner();
    }

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;

      worker.addEventListener('statechange', () => {
        if (
          worker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          showAppUpdateBanner();
        }
      });
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      setText('#healthPwaStatus', 'TIDAK DIDUKUNG');
      return;
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      renderClientPwaHealth();
      if (state.refreshingForUpdate) {
        window.location.reload();
      }
    });

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `./service-worker.js?v=${encodeURIComponent(config.VERSION)}`,
          {updateViaCache: 'none'}
        );

        watchServiceWorkerRegistration(registration);
        await registration.update();
        renderClientPwaHealth();
      } catch {
        setText('#healthPwaStatus', 'BERMASALAH');
        setText('#healthPwaCaption', 'Service Worker gagal didaftarkan');
      }
    });
  }

  function handleAuthExpired(event) {
    if (state.authExpiryHandled) return;
    state.authExpiryHandled = true;

    localStorage.removeItem(config.SESSION_KEY);
    state.session = null;
    closeAllSheets(true);
    openLogin();
    showToast(event?.detail?.message || 'Sesi berakhir. Silakan masuk kembali.', 'warning');

    window.setTimeout(() => {
      state.authExpiryHandled = false;
    }, 1500);
  }

  function isSessionError(error) {
    return ['AUTH_EXPIRED', 'ACCOUNT_DISABLED'].includes(String(error?.code || '')) ||
      /sesi|login kembali|session/i.test(String(error?.message || ''));
  }

  function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  }

  function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = String(value ?? '').trim().replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value) {
    return currencyFormatter.format(toNumber(value)).replace(/\s/g, '');
  }

  function formatQuantity(value) {
    if (value === '-' || value === '') return '-';
    return numberFormatter.format(toNumber(value));
  }

  function parseAnyDate(value) {
    if (value instanceof Date) return value;
    if (!value) return new Date(0);
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;
    const match = String(value).match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    return new Date(0);
  }

  function formatDate(value) {
    const date = parseAnyDate(value);
    if (!date.getTime()) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  function localDateInputValue(date) {
    const pad = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function statusTitle(status) {
    return String(status || '-').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function batchTone(status, day) {
    const normalized = String(status).toUpperCase();
    if (normalized.includes('LEWAT') || day > 14) return 'danger';
    if (normalized.includes('SIAP')) return 'warning';
    if (normalized.includes('FERMENTASI')) return 'info';
    return 'success';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }
})();
