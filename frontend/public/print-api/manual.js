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
  $("applyManualInputBtn")?.addEventListener("click", applyManualInput);
  $("printBtn")?.addEventListener("click", printAll);

  document.querySelectorAll(".panel-toggle").forEach((btn) => {
    btn.addEventListener("click", () => togglePanel(btn.closest(".panel")));
  });
  restorePanelStates();

  state.mode = "single";
  await loadServerTemplates();
  if ($("templateSelect")?.options?.length) applyTemplate();
}

function render() {
  if (!state.isDesignerPage && !$("templateSelect").options.length) {
    $("preview").innerHTML = '<div class="empty">未读取到已同步模板，请先在主窗口同步服务器模板。</div>';
    $("statusText").textContent = "未读取到已同步模板";
    $("pageText").textContent = "";
    return;
  }
  renderSingle();
  buildManualInputFields();
}

function renderSingle() {
  const rows = currentRows();
  const row = rows[0] || {};
  $("preview").innerHTML = singleSheet(row, "front");
  fitAllFields();
  $("statusText").textContent = "手动输入";
  $("pageText").textContent = "";
}

init();
