const STORAGE_KEY = "naklady-smen-profiles-v1";
const LEGACY_STORAGE_KEY = "naklady-smen-web-v1";

const profileStore = loadProfileStore();
let state = getActiveProfile();
const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  setDefaults();
  render();
  registerServiceWorker();
});

function cacheElements() {
  Object.assign(els, {
    tabs: [...document.querySelectorAll(".tabbar button")],
    views: [...document.querySelectorAll(".view")],
    headerTitle: document.querySelector("#headerTitle"),
    headerSubtitle: document.querySelector("#headerSubtitle"),
    overviewTitle: document.querySelector("#overviewTitle"),
    monthDisplayButton: document.querySelector("#monthDisplayButton"),
    newOverviewButton: document.querySelector("#newOverviewButton"),
    exportPdfButton: document.querySelector("#exportPdfButton"),
    monthPicker: document.querySelector("#monthPicker"),
    metricIncome: document.querySelector("#metricIncome"),
    metricKm: document.querySelector("#metricKm"),
    metricFuel: document.querySelector("#metricFuel"),
    metricTaxes: document.querySelector("#metricTaxes"),
    metricCosts: document.querySelector("#metricCosts"),
    metricProfit: document.querySelector("#metricProfit"),
    metricHourly: document.querySelector("#metricHourly"),
    profitChart: document.querySelector("#profitChart"),
    overviewList: document.querySelector("#overviewList"),
    shiftList: document.querySelector("#shiftList"),
    historySortSelect: document.querySelector("#historySortSelect"),
    addShiftButton: document.querySelector("#addShiftButton"),
    shiftDialog: document.querySelector("#shiftDialog"),
    shiftDetailDialog: document.querySelector("#shiftDetailDialog"),
    shiftForm: document.querySelector("#shiftForm"),
    shiftDialogTitle: document.querySelector("#shiftDialogTitle"),
    shiftDetailTitle: document.querySelector("#shiftDetailTitle"),
    shiftDetailGrid: document.querySelector("#shiftDetailGrid"),
    shiftDetailMap: document.querySelector("#shiftDetailMap"),
    closeShiftDetailButton: document.querySelector("#closeShiftDetailButton"),
    deleteShiftButton: document.querySelector("#deleteShiftButton"),
    settingsForm: document.querySelector("#settingsForm"),
    profileSelect: document.querySelector("#profileSelect"),
    profileNameInput: document.querySelector("#profileNameInput"),
    newProfileButton: document.querySelector("#newProfileButton"),
    deleteProfileButton: document.querySelector("#deleteProfileButton"),
    themeSelect: document.querySelector("#themeSelect"),
    wallpaperInput: document.querySelector("#wallpaperInput"),
    clearWallpaperButton: document.querySelector("#clearWallpaperButton"),
    backupInput: document.querySelector("#backupInput"),
    backupStatus: document.querySelector("#backupStatus"),
    monthlyShiftCount: document.querySelector("#monthlyShiftCount"),
    averageShiftIncome: document.querySelector("#averageShiftIncome"),
    taxGrid: document.querySelector("#taxGrid"),
    pdfInput: document.querySelector("#pdfInput"),
    pdfStatus: document.querySelector("#pdfStatus"),
    manualPdfDate: document.querySelector("#manualPdfDate"),
    manualPdfKm: document.querySelector("#manualPdfKm"),
    saveManualPdfButton: document.querySelector("#saveManualPdfButton"),
    earningsInput: document.querySelector("#earningsInput"),
    ocrStatus: document.querySelector("#ocrStatus"),
    manualEarningsDate: document.querySelector("#manualEarningsDate"),
    manualIncome: document.querySelector("#manualIncome"),
    manualHours: document.querySelector("#manualHours"),
    saveManualEarningsButton: document.querySelector("#saveManualEarningsButton"),
    downloadBackupButton: document.querySelector("#downloadBackupButton"),
    preferencesButton: document.querySelector("#preferencesButton"),
    preferencesDialog: document.querySelector("#preferencesDialog"),
    closePreferencesButton: document.querySelector("#closePreferencesButton"),
  });
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  els.monthPicker.addEventListener("change", () => {
    ensureOverview(els.monthPicker.value);
    saveState();
    render();
  });
  els.monthDisplayButton.addEventListener("click", () => {
    els.monthPicker.showPicker?.();
    if (!els.monthPicker.showPicker) els.monthPicker.click();
  });
  els.newOverviewButton.addEventListener("click", createOverview);
  els.exportPdfButton.addEventListener("click", exportCurrentOverviewPdf);
  els.addShiftButton.addEventListener("click", createOverview);
  els.historySortSelect.addEventListener("change", updateHistorySort);
  els.shiftForm.addEventListener("submit", saveShiftFromDialog);
  els.closeShiftDetailButton.addEventListener("click", () => els.shiftDetailDialog.close());
  els.deleteShiftButton.addEventListener("click", deleteSelectedShift);
  els.settingsForm.addEventListener("input", updateSettings);
  els.profileSelect.addEventListener("change", switchProfile);
  els.profileNameInput.addEventListener("input", updateProfile);
  els.newProfileButton.addEventListener("click", createProfile);
  els.deleteProfileButton.addEventListener("click", deleteProfile);
  els.themeSelect.addEventListener("change", updateAppearance);
  els.wallpaperInput.addEventListener("change", updateWallpaper);
  els.clearWallpaperButton.addEventListener("click", clearWallpaper);
  els.backupInput.addEventListener("change", importBackup);
  els.monthlyShiftCount.addEventListener("input", updateBusinessEstimate);
  els.averageShiftIncome.addEventListener("input", updateBusinessEstimate);
  els.pdfInput.addEventListener("change", handlePdfImport);
  els.earningsInput.addEventListener("change", handleEarningsImport);
  els.saveManualPdfButton.addEventListener("click", saveManualKilometers);
  els.saveManualEarningsButton.addEventListener("click", saveManualEarnings);
  els.downloadBackupButton.addEventListener("click", exportData);
  els.preferencesButton.addEventListener("click", openPreferences);
  els.closePreferencesButton.addEventListener("click", () => els.preferencesDialog.close());
}

function setDefaults() {
  const today = toDateInput(new Date());
  const month = today.slice(0, 7);
  els.monthPicker.value = month;
  els.manualPdfDate.value = today;
  els.manualEarningsDate.value = today;
  fillSettingsForm();
  fillProfileForm();
  fillHistorySort();
  els.monthlyShiftCount.value = state.business?.monthlyShiftCount ?? 20;
  els.averageShiftIncome.value = state.business?.averageShiftIncome
    ? formatInputNumber(state.business.averageShiftIncome, 2)
    : "";
}

function loadProfileStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.profiles?.length) return normalizeStore(saved);
  } catch {
    // Fall through to migration/defaults.
  }

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacy) {
      const profile = normalizeProfile({
        ...legacy,
        id: crypto.randomUUID(),
        profile: {
          profileName: legacy.profile?.profileName || legacy.profile?.appName || "Můj profil",
        },
      });
      return { activeProfileId: profile.id, profiles: [profile] };
    }
  } catch {
    // Fall through to defaults.
  }

  const profile = createDefaultProfile("Můj profil");
  return { activeProfileId: profile.id, profiles: [profile] };
}

function normalizeStore(store) {
  const profiles = (store.profiles || []).map((item, index) => normalizeProfile(item, `Profil ${index + 1}`));
  if (!profiles.length) {
    const profile = createDefaultProfile("Můj profil");
    return { activeProfileId: profile.id, profiles: [profile] };
  }
  const activeProfileId = profiles.some((item) => item.id === store.activeProfileId)
    ? store.activeProfileId
    : profiles[0].id;
  return { activeProfileId, profiles };
}

function normalizeProfile(profileData, fallbackName = "Můj profil") {
  return {
    id: profileData.id || crypto.randomUUID(),
    shifts: Array.isArray(profileData.shifts) ? profileData.shifts : [],
    overviews: Array.isArray(profileData.overviews) ? profileData.overviews : [],
    settings: {
      consumption: profileData.settings?.consumption ?? 10,
      fuelPrice: profileData.settings?.fuelPrice ?? 39,
      fixed: profileData.settings?.fixed || {
        social: 0,
        health: 0,
        sickness: 0,
        pension: 0,
        tax: 0,
      },
    },
    business: {
      monthlyShiftCount: profileData.business?.monthlyShiftCount ?? 20,
      averageShiftIncome: profileData.business?.averageShiftIncome ?? 0,
    },
    profile: {
      profileName: profileData.profile?.profileName || profileData.profile?.appName || fallbackName,
    },
    appearance: {
      theme: profileData.appearance?.theme || "system",
      wallpaper: profileData.appearance?.wallpaper || "",
    },
    preferences: {
      historySort: profileData.preferences?.historySort || "desc",
    },
  };
}

function createDefaultProfile(profileName) {
  return normalizeProfile({
    id: crypto.randomUUID(),
    profile: { profileName },
    shifts: [
      {
        id: crypto.randomUUID(),
        date: toDateInput(new Date()),
        title: "Ukázková směna",
        kilometers: 86.4,
        hours: 7.5,
        income: 2350,
        notes: "Ukázková data, můžeš je smazat.",
        routeStops: [],
      },
    ],
  }, profileName);
}

function getActiveProfile() {
  return profileStore.profiles.find((item) => item.id === profileStore.activeProfileId) || profileStore.profiles[0];
}

function saveState() {
  profileStore.activeProfileId = state.id;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profileStore));
}

function switchView(viewName) {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  els.views.forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
}

function openPreferences() {
  fillProfileForm();
  setStatus(els.backupStatus, backupHelpText());
  els.preferencesDialog.showModal();
}

function fillSettingsForm() {
  const { settings } = state;
  els.settingsForm.elements.consumption.value = settings.consumption;
  els.settingsForm.elements.fuelPrice.value = settings.fuelPrice;
}

function fillHistorySort() {
  els.historySortSelect.value = state.preferences?.historySort || "desc";
}

function updateHistorySort() {
  state.preferences = {
    ...(state.preferences || {}),
    historySort: els.historySortSelect.value === "asc" ? "asc" : "desc",
  };
  saveState();
  render();
}

function profile() {
  const savedProfile = state.profile || {};
  state.profile = {
    profileName: savedProfile.profileName || savedProfile.appName || "Můj profil",
  };
  return state.profile;
}

function fillProfileForm() {
  const current = profile();
  els.profileSelect.innerHTML = profileStore.profiles
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(profileLabel(item))}</option>`)
    .join("");
  els.profileSelect.value = state.id;
  els.profileNameInput.value = current.profileName;
  els.themeSelect.value = appearance().theme;
}

function profileLabel(profileData) {
  return profileData.profile?.profileName || "Můj profil";
}

function updateProfile() {
  state.profile = {
    profileName: els.profileNameInput.value.trim() || "Můj profil",
  };
  saveState();
  fillProfileForm();
  render();
}

function switchProfile() {
  const selected = profileStore.profiles.find((item) => item.id === els.profileSelect.value);
  if (!selected) return;
  state = selected;
  profileStore.activeProfileId = state.id;
  fillSettingsForm();
  fillProfileForm();
  fillHistorySort();
  applyAppearance();
  els.monthlyShiftCount.value = state.business?.monthlyShiftCount ?? 20;
  els.averageShiftIncome.value = state.business?.averageShiftIncome
    ? formatInputNumber(state.business.averageShiftIncome, 2)
    : "";
  saveState();
  render();
}

function createProfile() {
  const profileNumber = profileStore.profiles.length + 1;
  const nextProfile = createDefaultProfile(`Profil ${profileNumber}`);
  profileStore.profiles.push(nextProfile);
  state = nextProfile;
  profileStore.activeProfileId = state.id;
  fillSettingsForm();
  fillProfileForm();
  fillHistorySort();
  applyAppearance();
  els.monthlyShiftCount.value = state.business.monthlyShiftCount;
  els.averageShiftIncome.value = "";
  saveState();
  render();
}

function deleteProfile() {
  if (!window.confirm("Smazat vybraný profil i jeho data?")) return;

  if (profileStore.profiles.length === 1) {
    const replacement = createDefaultProfile("Můj profil");
    profileStore.profiles = [replacement];
    state = replacement;
  } else {
    profileStore.profiles = profileStore.profiles.filter((item) => item.id !== state.id);
    state = profileStore.profiles[0];
  }

  profileStore.activeProfileId = state.id;
  fillSettingsForm();
  fillProfileForm();
  fillHistorySort();
  applyAppearance();
  els.monthlyShiftCount.value = state.business.monthlyShiftCount;
  els.averageShiftIncome.value = state.business.averageShiftIncome
    ? formatInputNumber(state.business.averageShiftIncome, 2)
    : "";
  saveState();
  render();
}

function updateSettings() {
  const form = els.settingsForm.elements;
  state.settings = {
    consumption: numberValue(form.consumption.value),
    fuelPrice: numberValue(form.fuelPrice.value),
    fixed: state.settings.fixed || { social: 0, health: 0, sickness: 0, pension: 0, tax: 0 },
  };
  saveState();
  render();
}

function appearance() {
  state.appearance = {
    theme: state.appearance?.theme || "system",
    wallpaper: state.appearance?.wallpaper || "",
  };
  return state.appearance;
}

function updateAppearance() {
  const current = appearance();
  current.theme = els.themeSelect.value || "system";
  saveState();
  applyAppearance();
}

async function updateWallpaper() {
  const file = els.wallpaperInput.files?.[0];
  if (!file) return;

  try {
    appearance().wallpaper = await imageFileToWallpaper(file);
    els.wallpaperInput.value = "";
    saveState();
    applyAppearance();
  } catch {
    els.wallpaperInput.value = "";
  }
}

function clearWallpaper() {
  appearance().wallpaper = "";
  els.wallpaperInput.value = "";
  saveState();
  applyAppearance();
}

function applyAppearance() {
  const current = appearance();
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const theme = current.theme === "system" ? (prefersDark ? "dark" : "light") : current.theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.setProperty("--wallpaper", current.wallpaper ? `url("${current.wallpaper}")` : "none");
  document.body.classList.toggle("has-wallpaper", Boolean(current.wallpaper));
}

function imageFileToWallpaper(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Tapetu se nepovedlo načíst."));
    };
    image.src = url;
  });
}

function updateBusinessEstimate() {
  state.business = {
    monthlyShiftCount: numberValue(els.monthlyShiftCount.value),
    averageShiftIncome: numberValue(els.averageShiftIncome.value),
  };
  saveState();
  render();
}

function render() {
  applyAppearance();
  const currentProfile = profile();
  els.headerTitle.textContent = currentProfile.profileName;
  els.headerSubtitle.textContent = "Profil";
  document.title = "Náklady Směn";

  const month = els.monthPicker.value || toDateInput(new Date()).slice(0, 7);
  if (ensureOverview(month)) saveState();
  els.overviewTitle.textContent = "Přehled";
  els.monthDisplayButton.textContent = formatShortMonthLabel(month);
  const monthShifts = state.shifts
    .filter((shift) => shift.date?.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));
  const totals = calculateMonthTotals(month);
  const profit = totals.income - totals.cost;

  els.metricIncome.textContent = formatMoney(totals.income);
  els.metricKm.textContent = formatKm(totals.km);
  els.metricFuel.textContent = formatMoney(totals.fuel);
  els.metricTaxes.textContent = formatMoney(totals.taxes);
  els.metricCosts.textContent = formatMoney(totals.cost);
  els.metricProfit.textContent = formatMoney(profit);
  els.metricHourly.textContent = totals.hours > 0 ? formatMoney(profit / totals.hours) : "Bez hodin";
  els.metricProfit.closest("article").classList.toggle("positive", profit >= 0);
  els.metricProfit.closest("article").classList.toggle("negative", profit < 0);
  els.metricHourly.closest("article").classList.toggle("positive", profit >= 0);
  els.metricHourly.closest("article").classList.toggle("negative", profit < 0);

  els.overviewList.innerHTML = renderDashboardShiftTiles(monthShifts);
  els.profitChart.innerHTML = renderProfitChart(monthShifts);
  els.shiftList.innerHTML = renderOverviewHistoryCards(getOverviewMonths());
  renderTaxEstimate();
  bindDashboardShiftTiles();
  bindOverviewHistoryCards();
}

function renderTaxEstimate() {
  const averageIncome = numberValue(els.averageShiftIncome.value) || averageIncomePerShift();
  const monthlyShiftCount = numberValue(els.monthlyShiftCount.value) || 0;
  if (!els.averageShiftIncome.value && averageIncome > 0) {
    els.averageShiftIncome.placeholder = formatInputNumber(averageIncome, 2);
  }

  const estimate = calculateBusinessEstimate(averageIncome, monthlyShiftCount);
  const month = els.monthPicker.value || toDateInput(new Date()).slice(0, 7);
  const monthHours = totalHoursForMonth(month);
  const osvcHourly = monthHours > 0 ? estimate.monthlyReserve / monthHours : 0;
  els.taxGrid.innerHTML = [
    ["Měsíční obrat", formatMoney(estimate.monthlyRevenue)],
    ["Roční obrat", formatMoney(estimate.annualRevenue)],
    ["Paušální výdaje 80 %", formatMoney(estimate.flatExpenses)],
    ["Základ po výdajích", formatMoney(estimate.profitBase)],
    ["Daň z příjmů", formatMoney(estimate.incomeTax)],
    ["Důchodové / sociální", formatMoney(estimate.socialInsurance)],
    ["Zdravotní VOZP", formatMoney(estimate.healthInsurance)],
    ["Odkládat / měsíc", formatMoney(estimate.monthlyReserve)],
    ["OSVČ / odjetá h", monthHours > 0 ? formatMoney(osvcHourly) : "Bez hodin"],
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function averageIncomePerShift() {
  const paidShifts = state.shifts.filter((shift) => shift.income > 0);
  if (!paidShifts.length) return 0;
  return paidShifts.reduce((sum, shift) => sum + shift.income, 0) / paidShifts.length;
}

function calculateBusinessEstimate(shiftIncome, monthlyShiftCount) {
  const monthlyRevenue = shiftIncome * monthlyShiftCount;
  const annualRevenue = monthlyRevenue * 12;
  const flatExpenses = Math.min(annualRevenue * 0.8, 1600000);
  const profitBase = Math.max(0, annualRevenue - flatExpenses);
  const incomeTax = calculateIncomeTax(profitBase);
  const socialInsurance = Math.max(profitBase * 0.55 * 0.292, 5720 * 12);
  const healthInsurance = Math.max(profitBase * 0.5 * 0.135, 3306 * 12);
  const monthlyReserve = (incomeTax + socialInsurance + healthInsurance) / 12;

  return {
    monthlyRevenue,
    annualRevenue,
    flatExpenses,
    profitBase,
    incomeTax,
    socialInsurance,
    healthInsurance,
    monthlyReserve,
  };
}

function calculateIncomeTax(taxBase) {
  const threshold = 48967 * 36;
  const lower = Math.min(taxBase, threshold) * 0.15;
  const higher = Math.max(0, taxBase - threshold) * 0.23;
  return lower + higher;
}

function renderShiftCards(shifts) {
  if (!shifts.length) return `<div class="empty">Žádné směny</div>`;

  return shifts
    .map((shift) => {
      const breakdown = getBreakdown(shift);
      const mapUrl = routeMapUrl(shift.routeStops || []);
      return `
        <article class="shift-card" data-id="${shift.id}">
          <div class="shift-top">
            <div>
              <h3>${escapeHtml(shift.title)}</h3>
              <p class="meta">${formatDate(shift.date)} · ${formatKm(shift.kilometers)} · ${formatHours(shift.hours)}</p>
            </div>
            <div class="profit">
              <strong>${formatMoney(shift.income)}</strong>
              <span class="meta">výdělek</span>
            </div>
          </div>
          ${mapUrl ? `<a class="map-link" href="${mapUrl}" target="_blank" rel="noopener">Mapa celého dne</a>` : ""}
          <div class="breakdown">
            <div><span>Příjem</span><strong>${formatMoney(shift.income)}</strong></div>
            <div><span>Palivo</span><strong>${formatMoney(breakdown.fuelCost)}</strong></div>
            <div><span>Kilometry</span><strong>${formatKm(shift.kilometers)}</strong></div>
            <div><span>Hodiny</span><strong>${formatHours(shift.hours)}</strong></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function createOverview() {
  const currentMonth = els.monthPicker.value || toDateInput(new Date()).slice(0, 7);
  ensureOverview(currentMonth);
  const month = nextAvailableMonthValue(currentMonth);
  ensureOverview(month);
  els.monthPicker.value = month;
  switchView("overview");
  saveState();
  render();
}

function ensureOverview(month) {
  state.overviews = Array.isArray(state.overviews) ? state.overviews : [];
  if (!state.overviews.some((item) => item.month === month)) {
    state.overviews.push({
      month,
      createdAt: new Date().toISOString(),
    });
    return true;
  }
  return false;
}

function getOverviewMonths() {
  const months = new Set((state.overviews || []).map((item) => item.month));
  state.shifts.forEach((shift) => {
    if (shift.date) months.add(shift.date.slice(0, 7));
  });
  const currentMonth = els.monthPicker.value || toDateInput(new Date()).slice(0, 7);
  months.add(currentMonth);
  const direction = state.preferences?.historySort === "asc" ? "asc" : "desc";
  return [...months].sort((a, b) => direction === "asc" ? a.localeCompare(b) : b.localeCompare(a));
}

function renderOverviewHistoryCards(months) {
  if (!months.length) return `<div class="empty">Žádné přehledy</div>`;

  return months.map((month) => {
    const totals = calculateMonthTotals(month);
    const profit = totals.income - totals.cost;
    return `
      <article class="overview-history-card" data-month="${month}">
        <div class="shift-top">
          <div>
            <h3>${formatMonthLabel(month)}</h3>
            <p class="meta">Kliknutím otevřeš přehled</p>
          </div>
          <div class="profit">
            <strong>${formatMoney(profit)}</strong>
            <span class="meta">zisk</span>
          </div>
        </div>
        <div class="breakdown">
          <div><span>OSVČ</span><strong>${formatMoney(totals.taxes)}</strong></div>
          <div><span>Benzín</span><strong>${formatMoney(totals.fuel)}</strong></div>
          <div><span>Obrat</span><strong>${formatMoney(totals.income)}</strong></div>
          <div><span>Hodiny</span><strong>${formatHours(totals.hours)}</strong></div>
        </div>
        <button class="danger small delete-overview-button" data-month="${month}" type="button">Smazat přehled</button>
      </article>
    `;
  }).join("");
}

function bindOverviewHistoryCards() {
  document.querySelectorAll(".overview-history-card").forEach((card) => {
    card.addEventListener("click", () => {
      els.monthPicker.value = card.dataset.month;
      ensureOverview(card.dataset.month);
      switchView("overview");
      saveState();
      render();
    });
  });

  document.querySelectorAll(".delete-overview-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteOverview(button.dataset.month);
    });
  });
}

function deleteOverview(month) {
  if (!window.confirm(`Smazat přehled ${formatMonthLabel(month)} včetně jeho směn?`)) return;

  state.overviews = (state.overviews || []).filter((item) => item.month !== month);
  state.shifts = state.shifts.filter((shift) => !shift.date?.startsWith(month));
  if (els.monthPicker.value === month) {
    const nextMonth = getOverviewMonths().find((item) => item !== month) || toDateInput(new Date()).slice(0, 7);
    els.monthPicker.value = nextMonth;
    ensureOverview(nextMonth);
  }
  saveState();
  render();
}

function calculateMonthTotals(month) {
  return state.shifts
    .filter((shift) => shift.date?.startsWith(month))
    .reduce(
      (acc, shift) => {
        const breakdown = getBreakdown(shift);
        acc.km += shift.kilometers;
        acc.hours += shift.hours;
        acc.fuel += breakdown.fuelCost;
        acc.taxes += breakdown.osvcShare;
        acc.cost += breakdown.totalCost;
        acc.income += shift.income;
        return acc;
      },
      { km: 0, hours: 0, fuel: 0, taxes: 0, cost: 0, income: 0 }
    );
}

function renderProfitChart(shifts) {
  const points = shifts
    .filter((shift) => shift.hours > 0)
    .map((shift) => {
      const breakdown = getBreakdown(shift);
      return {
        date: shift.date,
        value: breakdown.profitPerHour ?? 0,
      };
    });

  if (!points.length) return `<div class="empty chart-empty">Graf se zobrazí po doplnění hodin a výdělku.</div>`;

  const max = Math.max(...points.map((point) => Math.max(0, point.value)), 1);
  return `
    <div class="chart-bars" style="--chart-count: ${points.length}">
      ${points.map((point) => {
        const height = Math.max(6, Math.round((Math.max(0, point.value) / max) * 100));
        return `
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="height: ${height}%"></div>
            <strong>${formatMoney(point.value)}</strong>
            <span>${formatShortDate(point.date)}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function exportCurrentOverviewPdf() {
  const month = els.monthPicker.value || toDateInput(new Date()).slice(0, 7);
  const monthShifts = state.shifts
    .filter((shift) => shift.date?.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));
  const totals = calculateMonthTotals(month);
  const profit = totals.income - totals.cost;
  const html = buildOverviewPdfHtml(month, monthShifts, totals, profit);
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    window.alert("Prohlížeč zablokoval otevření exportu. Povol vyskakovací okna a zkus Export PDF znovu.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 250);
}

function buildOverviewPdfHtml(month, shifts, totals, profit) {
  const title = `Přehled ${formatMonthLabel(month)}`;
  const rows = shifts.length
    ? shifts.map((shift) => {
      const breakdown = getBreakdown(shift);
      return `
        <tr>
          <td>${escapeHtml(formatDate(shift.date))}</td>
          <td>${escapeHtml(shift.title)}</td>
          <td class="num">${formatMoney(shift.income)}</td>
          <td class="num">${formatKm(shift.kilometers)}</td>
          <td class="num">${formatHours(shift.hours)}</td>
          <td class="num">${formatMoney(breakdown.fuelCost)}</td>
        </tr>
      `;
    }).join("")
    : `<tr><td colspan="6">Žádné směny v tomto měsíci.</td></tr>`;

  return `<!doctype html>
    <html lang="cs">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 28px; color: #111; font: 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          .meta { margin: 0 0 22px; color: #555; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 22px; }
          .box { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
          .box span { display: block; color: #666; font-size: 11px; text-transform: uppercase; }
          .box strong { display: block; margin-top: 4px; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; }
          th { font-size: 11px; text-transform: uppercase; color: #555; }
          .num { text-align: right; white-space: nowrap; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">${escapeHtml(profile().profileName)} · exportováno ${escapeHtml(formatDate(toDateInput(new Date())))}</p>
        <section class="summary">
          <div class="box"><span>Obrat</span><strong>${formatMoney(totals.income)}</strong></div>
          <div class="box"><span>Náklady OSVČ</span><strong>${formatMoney(totals.taxes)}</strong></div>
          <div class="box"><span>Náklady benzín</span><strong>${formatMoney(totals.fuel)}</strong></div>
          <div class="box"><span>Zisk</span><strong>${formatMoney(profit)}</strong></div>
          <div class="box"><span>Hodiny</span><strong>${formatHours(totals.hours)}</strong></div>
          <div class="box"><span>Kilometry</span><strong>${formatKm(totals.km)}</strong></div>
        </section>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Směna</th>
              <th class="num">Výdělek</th>
              <th class="num">Km</th>
              <th class="num">Hodiny</th>
              <th class="num">Palivo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`;
}

function renderDashboardShiftTiles(shifts) {
  const addTile = `
    <button class="dashboard-shift dashboard-shift-add" id="dashboardAddShiftButton" type="button" aria-label="Nahrát data směny">
      <span>+</span>
    </button>
  `;
  if (!shifts.length) return `${addTile}<div class="empty">Žádné směny</div>`;

  return addTile + shifts
    .map((shift) => `
      <button class="dashboard-shift" data-id="${shift.id}" type="button">
        <span>${formatShortDate(shift.date)}</span>
      </button>
    `)
    .join("");
}

function bindDashboardShiftTiles() {
  document.querySelector("#dashboardAddShiftButton")?.addEventListener("click", openShiftImport);

  document.querySelectorAll(".dashboard-shift").forEach((tile) => {
    if (!tile.dataset.id) return;
    tile.addEventListener("click", () => {
      const shift = state.shifts.find((item) => item.id === tile.dataset.id);
      if (shift) openShiftDetailDialog(shift);
    });
  });
}

function openShiftImport() {
  switchView("import");
  setStatus(els.pdfStatus, "Vyber PDF s kilometry směny.");
  els.pdfInput.click();
}

function bindShiftCards() {
  document.querySelectorAll(".shift-card").forEach((card) => {
    card.addEventListener("click", () => {
      const shift = state.shifts.find((item) => item.id === card.dataset.id);
      if (shift) openShiftDialog(shift);
    });
  });

  document.querySelectorAll(".map-link").forEach((link) => {
    link.addEventListener("click", (event) => event.stopPropagation());
  });
}

function openShiftDetailDialog(shift) {
  const breakdown = getBreakdown(shift);
  const mapUrl = routeMapUrl(shift.routeStops || []);
  els.shiftDetailTitle.textContent = formatDate(shift.date);
  els.shiftDetailGrid.innerHTML = [
    ["Výdělek", formatMoney(shift.income)],
    ["Kilometry", formatKm(shift.kilometers)],
    ["Hodiny", formatHours(shift.hours)],
    ["Palivo", formatMoney(breakdown.fuelCost)],
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");

  els.shiftDetailMap.hidden = !mapUrl;
  if (mapUrl) els.shiftDetailMap.href = mapUrl;
  els.shiftDetailDialog.showModal();
}

function getBreakdown(shift) {
  const fuelLiters = (shift.kilometers * state.settings.consumption) / 100;
  const fuelCost = fuelLiters * state.settings.fuelPrice;
  const osvcShare = osvcCostShare(shift);
  const totalCost = fuelCost + osvcShare;
  const profit = shift.income - totalCost;

  return {
    fuelLiters,
    fuelCost,
    osvcShare,
    osvcCostPerHour: shift.hours > 0 ? osvcShare / shift.hours : null,
    totalCost,
    profit,
    profitPerHour: shift.hours > 0 ? profit / shift.hours : null,
  };
}

function osvcCostShare(shift) {
  if (!shift.hours) return 0;
  const month = shift.date.slice(0, 7);
  const monthHours = totalHoursForMonth(month);
  if (!monthHours) return 0;
  const estimate = calculateBusinessEstimate(
    numberValue(els.averageShiftIncome.value) || averageIncomePerShift(),
    numberValue(els.monthlyShiftCount.value) || 0
  );
  return (estimate.monthlyReserve / monthHours) * shift.hours;
}

function totalHoursForMonth(month) {
  return state.shifts
    .filter((shift) => shift.date?.startsWith(month))
    .reduce((sum, shift) => sum + (shift.hours || 0), 0);
}

function openShiftDialog(shift = null) {
  els.shiftDialogTitle.textContent = shift ? "Upravit směnu" : "Nová směna";
  els.deleteShiftButton.hidden = !shift;
  const form = els.shiftForm.elements;
  form.id.value = shift?.id || "";
  form.date.value = shift?.date || toDateInput(new Date());
  form.title.value = shift?.title || "";
  form.kilometers.value = shift?.kilometers ?? 0;
  form.hours.value = shift?.hours ?? 0;
  form.income.value = shift?.income ?? 0;
  form.notes.value = shift?.notes || "";
  els.shiftDialog.showModal();
}

function saveShiftFromDialog(event) {
  if (event.submitter?.value !== "save") return;
  event.preventDefault();
  const form = els.shiftForm.elements;
  const shift = {
    id: form.id.value || crypto.randomUUID(),
    date: form.date.value,
    title: form.title.value.trim() || "Směna",
    kilometers: numberValue(form.kilometers.value),
    hours: numberValue(form.hours.value),
    income: numberValue(form.income.value),
    notes: form.notes.value.trim(),
    routeStops: state.shifts.find((item) => item.id === form.id.value)?.routeStops || [],
  };
  const existingIndex = state.shifts.findIndex((item) => item.id === shift.id);
  if (existingIndex >= 0) state.shifts[existingIndex] = shift;
  else state.shifts.push(shift);
  saveState();
  render();
  els.shiftDialog.close();
}

function deleteSelectedShift() {
  const id = els.shiftForm.elements.id.value;
  state.shifts = state.shifts.filter((shift) => shift.id !== id);
  saveState();
  render();
  els.shiftDialog.close();
}

function saveManualKilometers() {
  const date = els.manualPdfDate.value || toDateInput(new Date());
  const kilometers = numberValue(els.manualPdfKm.value);
  if (!kilometers) {
    setStatus(els.pdfStatus, "Zadej kilometry.");
    return;
  }
  upsertDailyShift(date, { kilometers }, "Kilometry z PDF");
  els.manualPdfKm.value = "";
  setStatus(els.pdfStatus, "Kilometry uloženy.");
}

function saveManualEarnings() {
  const date = els.manualEarningsDate.value || toDateInput(new Date());
  const income = numberValue(els.manualIncome.value);
  const hours = numberValue(els.manualHours.value);
  if (!income) {
    setStatus(els.ocrStatus, "Zadej výdělek.");
    return;
  }
  applyDailyEarnings(date, income, hours || null);
  els.manualIncome.value = "";
  els.manualHours.value = "";
  setStatus(els.ocrStatus, "Výdělek uložen.");
}

async function handlePdfImport() {
  const file = els.pdfInput.files?.[0];
  if (!file) return;
  setStatus(els.pdfStatus, "Čtu PDF...");
  try {
    const data = await file.arrayBuffer();

    let imported = parseRideHistoryRows(await extractPdfPositionedText(data));

    if (!imported.length) {
      await ensureScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      let text = "";
      const positionedItems = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
        positionedItems.push(...content.items.map((item) => ({
          text: item.str,
          x: item.transform?.[4] || 0,
          y: item.transform?.[5] || 0,
        })));
      }
      imported = parseRideHistoryRows(positionedItems);
      if (!imported.length) imported = parsePdfText(text);
    }

    if (!imported.length) throw new Error("Nenalezeny kilometry.");
    imported.forEach((shift) => upsertDailyShift(shift.date, shift, "PDF import"));
    const trips = imported.reduce((sum, item) => sum + (item.tripCount || 1), 0);
    setStatus(els.pdfStatus, `Uloženo: ${imported.length} den, ${trips} jízd, ${formatKm(imported.reduce((sum, item) => sum + item.kilometers, 0))}`);
  } catch (error) {
    setStatus(els.pdfStatus, "PDF se nepovedlo přečíst. Zadej km ručně.");
  } finally {
    els.pdfInput.value = "";
  }
}

async function handleEarningsImport() {
  const file = els.earningsInput.files?.[0];
  if (!file) return;
  setStatus(els.ocrStatus, "Čtu screenshot...");
  try {
    await ensureScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
    const result = await Tesseract.recognize(file, "ces+eng");
    const text = result.data.text || "";
    const income = detectIncome(text);
    if (!income) throw new Error("Výdělek nenalezen.");
    const hours = detectHours(text);
    const detectedDate = detectDate(text);
    const date = detectedDate || els.manualEarningsDate.value || toDateInput(new Date());
    els.manualEarningsDate.value = date;
    els.manualIncome.value = formatInputNumber(income, 2);
    if (hours) els.manualHours.value = formatInputNumber(hours, 2);
    setStatus(els.ocrStatus, `Našla jsem: ${formatMoney(income)}${hours ? `, ${formatHours(hours)}` : ""}${detectedDate ? `, datum ${formatDate(date)}` : ""}. Zkontroluj a klikni Zapsat výdělek.`);
  } catch (error) {
    setStatus(els.ocrStatus, "Screenshot se nepovedlo přečíst. Zadej výdělek ručně.");
  } finally {
    els.earningsInput.value = "";
  }
}

function parsePdfText(text) {
  const lines = text.split(/\n| {2,}/).map((line) => line.trim()).filter(Boolean);
  const parsed = [];
  for (const line of lines) {
    const km = detectKilometers(line);
    const date = detectDate(line);
    if (km && date) parsed.push({ date, kilometers: km });
  }
  const total = detectKilometers(text);
  if (!parsed.length && total) parsed.push({ date: toDateInput(new Date()), kilometers: total });
  return parsed;
}

async function extractPdfPositionedText(arrayBuffer) {
  if (!("DecompressionStream" in window)) return [];

  const binary = bytesToBinary(new Uint8Array(arrayBuffer));
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const items = [];
  let match;

  while ((match = streamPattern.exec(binary))) {
    try {
      const rawBytes = binaryToBytes(match[1]);
      const inflated = await inflateBytes(rawBytes);
      const content = new TextDecoder("windows-1252").decode(inflated);
      items.push(...parsePdfDrawingText(content));
    } catch {
      // Some PDF streams may not be Flate-compressed text streams.
    }
  }

  return items;
}

function parsePdfDrawingText(content) {
  const items = [];
  const textPattern = /1 0 0 1\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Tm[\s\S]*?\(((?:\\.|[^\\)])*)\)Tj/g;
  let match;

  while ((match = textPattern.exec(content))) {
    items.push({
      text: decodePdfString(match[3]),
      x: Number(match[1]),
      y: Number(match[2]),
    });
  }

  return items;
}

async function inflateBytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function bytesToBinary(bytes) {
  let output = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    output += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return output;
}

function binaryToBytes(binary) {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function decodePdfString(text) {
  return text
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

function parseRideHistoryRows(items) {
  const rowStarts = items
    .filter((item) => item.x >= 35 && item.x <= 55 && item.text.toLowerCase().includes("slu"))
    .map((item) => item.y)
    .sort((a, b) => b - a);

  const trips = rowStarts.map((rowY) => {
    const startDate = cellText(items, rowY, 88, 144);
    const startTime = cellText(items, rowY - 8, 88, 144);
    const durationMinutes = numberFromText(cellText(items, rowY, 196, 252));
    const kilometers = numberFromText(cellText(items, rowY, 250, 306));
    const from = cleanAddress(cellBlockText(items, rowY, 308, 387));
    const to = cleanAddress(cellBlockText(items, rowY, 389, 468));
    const date = normalizeDate(startDate);

    if (!date || !kilometers) return null;
    return {
      date,
      kilometers,
      hours: durationMinutes ? durationMinutes / 60 : 0,
      startTime,
      from,
      to,
    };
  }).filter(Boolean);

  const byDate = new Map();
  for (const trip of trips) {
    const current = byDate.get(trip.date) || {
      date: trip.date,
      title: "Jízdy z PDF",
      kilometers: 0,
      hours: 0,
      tripCount: 0,
      notes: "Import z PDF historie jízd",
      routeStops: [],
    };
    current.kilometers += trip.kilometers;
    current.hours += trip.hours;
    current.tripCount += 1;
    current.routeStops = appendRouteStops(current.routeStops, trip.from, trip.to);
    byDate.set(trip.date, current);
  }

  return [...byDate.values()].map((shift) => ({
    ...shift,
    kilometers: round(shift.kilometers, 1),
    hours: round(shift.hours, 2),
    notes: `Import z PDF historie jízd: ${shift.tripCount} jízd`,
  }));
}

function cellText(items, rowY, minX, maxX) {
  return items
    .filter((item) => Math.abs(item.y - rowY) <= 3 && item.x >= minX && item.x < maxX)
    .sort((a, b) => a.x - b.x)
    .map((item) => item.text)
    .join(" ")
    .trim();
}

function cellBlockText(items, rowY, minX, maxX) {
  return items
    .filter((item) => item.y <= rowY + 3 && item.y >= rowY - 24 && item.x >= minX && item.x < maxX)
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map((item) => item.text)
    .join(" ")
    .trim();
}

function appendRouteStops(existing, from, to) {
  const stops = [...existing];
  [from, to].filter(Boolean).forEach((stop) => {
    if (stops[stops.length - 1] !== stop) stops.push(stop);
  });
  return stops;
}

function applyDailyEarnings(date, income, hours) {
  const sameDay = state.shifts.filter((shift) => shift.date === date);
  if (!sameDay.length) {
    state.shifts.push({
      id: crypto.randomUUID(),
      date,
      title: "Výdělek dne",
      kilometers: 0,
      hours: hours || 0,
      income,
      notes: "Vytvořeno z importu výdělku",
      routeStops: [],
    });
  } else {
    const totalKm = sameDay.reduce((sum, shift) => sum + shift.kilometers, 0);
    sameDay.forEach((shift) => {
      const share = totalKm > 0 ? shift.kilometers / totalKm : 1 / sameDay.length;
      shift.income = income * share;
      if (hours) shift.hours = hours * share;
    });
  }
  saveState();
  render();
}

function upsertDailyShift(date, values, title) {
  let shift = state.shifts.find((item) => item.date === date);
  if (!shift) {
    shift = {
      id: crypto.randomUUID(),
      date,
      title,
      kilometers: 0,
      hours: 0,
      income: 0,
      notes: "",
      routeStops: [],
    };
    state.shifts.push(shift);
  }
  Object.assign(shift, values);
  saveState();
  render();
}

function detectKilometers(text) {
  const match = text.match(/(\d+(?:[,.]\d+)?)\s*km/i) || text.match(/km\s*:?\s*(\d+(?:[,.]\d+)?)/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}

function numberFromText(text) {
  const match = String(text).match(/(\d+(?:[,.]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) : null;
}

function normalizeDate(text) {
  const match = String(text).match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
  if (!match) return null;
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  return `${year}-${String(match[2]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
}

function cleanAddress(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\bCzechia\b/gi, "Cesko")
    .trim();
}

function routeMapUrl(stops) {
  const cleanStops = [...new Set((stops || []).map(cleanAddress).filter(Boolean))];
  if (cleanStops.length < 2) return "";

  const origin = cleanStops[0];
  const destination = cleanStops[cleanStops.length - 1];
  const waypoints = cleanStops.slice(1, -1).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function detectIncome(text) {
  const foodoraIncome = detectFoodoraIncome(text);
  if (foodoraIncome) return foodoraIncome;

  const scored = [...text.split(/\n/).flatMap((line, index, lines) => {
    const context = [lines[index - 1], line, lines[index + 1]].filter(Boolean).join(" ");
    const numbers = [...line.matchAll(/(\d{1,6}(?:\s\d{3})*(?:\s*[,.]\s*\d{1,2})?)\s*(?:kc|kč|czk|czkč)?/gi)];
    return numbers.map((match) => {
      const lower = line.toLowerCase();
      const lowerContext = context.toLowerCase();
      let score = 0;
      const value = normalizeCurrencyValue(parseLocalizedNumber(match[1]));
      const hasCurrency = /kč|kc|czk/i.test(line);
      if (lowerContext.includes("výdělek") || lowerContext.includes("vydelek") || lowerContext.includes("earn")) score += 8;
      if (lowerContext.includes("zisk") || lowerContext.includes("příjem") || lowerContext.includes("prijem")) score += 6;
      if (lowerContext.includes("celkem") || lowerContext.includes("total") || lowerContext.includes("dnes")) score += 5;
      if (hasCurrency) score += 4;
      if (lower.includes("km")) score -= 5;
      if (lowerContext.includes("objedn") || lowerContext.includes("order") || lowerContext.includes("delivery")) score -= 4;
      if (lowerContext.includes("hod") || lowerContext.includes("hour") || lowerContext.includes("čas") || lowerContext.includes("cas")) score -= 3;
      if (!hasCurrency && score < 6) score -= 4;
      if (value > 20000) score -= 5;
      return { value, score };
    });
  })].filter((item) => item.value >= 50);
  scored.sort((a, b) => b.score - a.score || b.value - a.value);
  return scored[0]?.value || null;
}

function detectHours(text) {
  const foodoraHours = detectFoodoraHours(text);
  if (foodoraHours) return foodoraHours;

  const matches = [...text.matchAll(/(\d{1,2})\s*[:.]\s*([0-5]\d)\s*(?:h|hod|hours?)?/gi)];
  const decimal = [...text.matchAll(/(\d{1,2}(?:[,.]\d{1,2})?)\s*(?:h|hod|hodin|hours?)/gi)];
  const values = [
    ...matches.map((match) => Number(match[1]) + Number(match[2]) / 60),
    ...decimal.map((match) => Number(match[1].replace(",", "."))),
  ].filter((value) => value > 0 && value <= 24);
  return values[0] || null;
}

function detectDate(text) {
  const foodoraDate = detectFoodoraDate(text);
  if (foodoraDate) return foodoraDate;

  const match = text.match(/(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?/);
  if (!match) return null;
  const year = match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : new Date().getFullYear();
  return `${year}-${String(match[2]).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
}

function detectFoodoraIncome(text) {
  const compactText = text
    .replace(/(\d)\s+([,.])\s+(\d)/g, "$1$2$3")
    .replace(/(\d)\s+(?=\d{3}(?:[,.]\d{1,2})?\s*(?:kč|kc|czk))/gi, "$1");
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const candidates = [];

  lines.forEach((line, index) => {
    const context = [lines[index - 1], line, lines[index + 1]].filter(Boolean).join(" ").toLowerCase();
    const amounts = [...line.matchAll(/(\d{1,6}(?:\s\d{3})*(?:\s*[,.]\s*\d{1,2})?)\s*(?:kč|kc|czk)/gi)];

    amounts.forEach((match) => {
      const value = normalizeCurrencyValue(parseLocalizedNumber(match[1]));
      let score = 0;
      if (context.includes("hodinov")) score -= 20;
      if (context.includes("průměr") || context.includes("prumer")) score -= 20;
      if (context.includes("zakázek") || context.includes("zakazek")) score += 8;
      if (context.match(/\b(po|ut|út|st|ct|čt|pa|pá|so|ne)\b/)) score += 8;
      if (value >= 500) score += 5;
      candidates.push({ value, score });
    });
  });

  if (!candidates.length) {
    const directAmounts = [...compactText.matchAll(/(\d{3,6}(?:[,.]\d{1,2})?)\s*(?:kč|kc|czk)/gi)]
      .map((match) => ({ value: normalizeCurrencyValue(parseLocalizedNumber(match[1])), score: 1 }));
    candidates.push(...directAmounts);
  }

  candidates.sort((a, b) => b.score - a.score || b.value - a.value);
  return candidates[0]?.value || null;
}

function detectFoodoraHours(text) {
  const match = text.match(/(\d{1,2})\s*h(?:odin(?:y)?)?\s*(\d{1,2})?\s*m?/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  if (hours <= 0 || hours > 24 || minutes > 59) return null;
  return hours + minutes / 60;
}

function detectFoodoraDate(text) {
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const candidates = [];

  lines.forEach((line, index) => {
    const match = line.match(/\b(?:po|ut|út|st|ct|čt|pa|pá|so|ne)\s+(\d{1,2})[. ]+\s*(\d{1,2})\./i);
    if (!match) return;

    const context = [line, lines[index + 1], lines[index + 2]].filter(Boolean).join(" ").toLowerCase();
    let score = 0;
    if (context.includes("kč") || context.includes("kc")) score += 6;
    if (context.includes("zakázek") || context.includes("zakazek")) score += 6;
    if (line.includes("-")) score -= 8;
    candidates.push({ day: match[1], month: match[2], score });
  });

  candidates.sort((a, b) => b.score - a.score);
  const match = candidates[0];
  if (!match) return null;
  const year = new Date().getFullYear();
  return `${year}-${String(match.month).padStart(2, "0")}-${String(match.day).padStart(2, "0")}`;
}

function parseLocalizedNumber(value) {
  return Number(String(value).replace(/\s/g, "").replace(",", "."));
}

function normalizeCurrencyValue(value) {
  if (value >= 50000) return value / 100;
  return value;
}

function formatInputNumber(value, decimals = 2) {
  return round(value, decimals).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: false,
  });
}

function ensureScript(src, module = false) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some((script) => script.src === src)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    if (module) script.type = "module";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function exportData() {
  const backup = {
    app: "NakladySmen",
    version: 1,
    exportedAt: new Date().toISOString(),
    store: profileStore,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fileName = `zaloha-${slugify(profile().profileName)}-${toDateInput(new Date())}.json`;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  setStatus(els.backupStatus, `Záloha stažena: ${fileName}. Hledej ji ve složce Stažené/Downloads, případně tam, kam máš v prohlížeči nastavené ukládání. Zpět ji nahraješ přes ozubené kolečko -> Záloha -> Nahrát zálohu.`);
  els.preferencesDialog.showModal();
}

async function importBackup() {
  const file = els.backupInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const restored = parseBackupStore(parsed);
    if (!window.confirm("Nahrát zálohu? Aktuální profily v tomto zařízení se přepíšou.")) {
      els.backupInput.value = "";
      return;
    }

    profileStore.profiles = restored.profiles;
    profileStore.activeProfileId = restored.activeProfileId;
    state = getActiveProfile();
    saveState();
    fillSettingsForm();
    fillProfileForm();
    els.monthlyShiftCount.value = state.business?.monthlyShiftCount ?? 20;
    els.averageShiftIncome.value = state.business?.averageShiftIncome
      ? formatInputNumber(state.business.averageShiftIncome, 2)
      : "";
    applyAppearance();
    render();
    setStatus(els.backupStatus, `Záloha nahrána: ${profileStore.profiles.length} profilů.`);
  } catch {
    setStatus(els.backupStatus, "Záloha se nepovedla načíst.");
  } finally {
    els.backupInput.value = "";
  }
}

function parseBackupStore(parsed) {
  if (parsed?.store?.profiles) return normalizeStore(parsed.store);
  if (parsed?.profiles) return normalizeStore(parsed);
  if (parsed?.shifts || parsed?.settings || parsed?.business) {
    const profileData = normalizeProfile(parsed, parsed.profile?.profileName || "Importovaný profil");
    return { activeProfileId: profileData.id, profiles: [profileData] };
  }
  throw new Error("Neplatná záloha.");
}

function backupHelpText() {
  return "Zálohy se po stažení ukládají do složky Stažené/Downloads, případně tam, kam máš v prohlížeči nastavené ukládání. Obnovíš je tady: Záloha -> Nahrát zálohu.";
}

function setStatus(element, text) {
  element.textContent = text;
}

function numberValue(value) {
  return Number(String(value || 0).replace(",", ".")) || 0;
}

function toDateInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatKm(value) {
  return `${(value || 0).toFixed(1)} km`;
}

function formatHours(value) {
  return value > 0 ? `${value.toFixed(2)} h` : "0 h";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium" }).format(new Date(value));
}

function formatMonthLabel(value) {
  const [year, month] = String(value).split("-").map(Number);
  return new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function formatShortMonthLabel(value) {
  const [year, month] = String(value).split("-").map(Number);
  const monthName = new Intl.DateTimeFormat("cs-CZ", { month: "long" }).format(new Date(year, month - 1, 1));
  return `${monthName} ${String(year).slice(-2)}`;
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric" }).format(new Date(value));
}

function nextMonthValue(value) {
  const [year, month] = String(value).split("-").map(Number);
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function nextAvailableMonthValue(value) {
  let month = nextMonthValue(value);
  const existing = new Set(getOverviewMonths());
  while (existing.has(month)) month = nextMonthValue(month);
  return month;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function slugify(value) {
  return String(value || "export")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "export";
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
