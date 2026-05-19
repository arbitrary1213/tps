async function init() {
  workflowStatus.runtime = isDesktopRuntime() ? "桌面端" : "网页端";
  workflowStatus.launchSource = "手动输入";
  setWorkflowStatus();

  templates.forEach((template, index) => {
    templates[index] = normalizeCatalogTemplate(template);
  });
  ensureBuiltinSingleTemplates();
  migrateStoredLayouts();
  rebuildTemplateOptions();
  loadCustomTemplatesFromStorage();

  $("templateSelect")?.addEventListener("change", () => {
    if ($("templateSelect")?.options?.length) applyTemplate();
  });
  $("singleVariant")?.addEventListener("change", handleSingleVariantChange);
  $("singleVariantTabs")?.addEventListener("click", handleSingleVariantTabClick);
  $("clearManualInputBtn")?.addEventListener("click", clearManualInput);
  $("printBtn")?.addEventListener("click", printAll);

  document.querySelectorAll(".panel-toggle").forEach((btn) => {
    btn.addEventListener("click", () => togglePanel(btn.closest(".panel")));
  });
  restorePanelStates();

  state.mode = "single";
  state.isDesignerPage = false;
  await loadServerTemplates();
  if ($("templateSelect")?.options?.length) applyTemplate();
}

function render() {
  syncPrintSize();
  if (!state.isDesignerPage && !$("templateSelect").options.length) {
    $("preview").innerHTML = '<div class="empty">未读取到已同步模板，请先在主窗口同步服务器模板。</div>';
    $("statusText").textContent = "未读取到已同步模板";
    $("pageText").textContent = "";
    return;
  }
  syncSingleVariantControls();
  renderSingle();
}

function renderSingle() {
  const rows = currentRows();
  const row = rows[0] || {};
  state.singleVariantKey = normalizeSingleVariantKey(state.singleVariantKey || currentSingleVariantKey());
  $("preview").innerHTML = singleSheet(row, "front");
  makeFieldsEditable();
  fitAllFields();
  $("statusText").textContent = "手动输入";
  $("pageText").textContent = "";
}

function makeFieldsEditable() {
  const sheet = $("preview").querySelector(".sheet");
  if (!sheet) return;
  sheet.querySelectorAll(".field-flow").forEach((span) => {
    span.contentEditable = "plaintext-only";
    span.addEventListener("input", updateManualRow);
    span.addEventListener("blur", updateManualRow);
  });
  sheet.querySelectorAll(".is-placeholder .field-flow").forEach((span) => {
    span.textContent = "";
  });
}

function updateManualRow() {
  const sheet = $("preview").querySelector(".sheet");
  if (!sheet) return;
  const row = {};
  sheet.querySelectorAll("[data-edit-key]").forEach((el) => {
    const key = el.dataset.editKey;
    if (!key) return;
    const flow = el.querySelector(".field-flow");
    if (!flow) return;
    const text = flow.textContent.trim();
    if (text) row[key] = text;
  });
  const group = currentDataGroup();
  if (!Object.values(row).some((v) => v)) {
    state.datasets[group] = [];
    state.selectedRowIds[group] = new Set();
    return;
  }
  const normalized = normalizeRow(row, group, 0);
  state.datasets[group] = [normalized];
  state.selectedRowIds[group] = new Set([normalized.__rowId]);
}

function clearManualInput() {
  const group = currentDataGroup();
  state.datasets[group] = [];
  state.selectedRowIds[group] = new Set();
  state.pageIndex = 0;
  state.singleVariantManualOverride = false;
  render();
}

init();
