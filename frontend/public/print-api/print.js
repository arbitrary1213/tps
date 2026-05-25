async function init() {
  workflowStatus.runtime = isDesktopRuntime() ? "桌面端" : "网页端";
  if (launchParams.get("plaqueId") || launchParams.get("plaqueIds")) {
    workflowStatus.launchSource = "牌位管理入口";
  } else if (launchPrintPreviewMode) {
    workflowStatus.launchSource = "打印预览入口";
  } else {
    workflowStatus.launchSource = "打印中心";
  }
  setWorkflowStatus();

  templates.forEach((template, index) => {
    templates[index] = normalizeCatalogTemplate(template);
  });
  migrateStoredLayouts();
  rebuildTemplateOptions();
  loadCustomTemplatesFromStorage();

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  $("sampleBtn").addEventListener("click", () => loadRows(sampleData[currentDataGroup()]));
  $("pasteBtn").addEventListener("click", () => loadRows(parseDelimited($("pasteInput").value)));
  $("loadSystemDataBtn").addEventListener("click", loadSystemPlaquesFromFilters);
  $("openBelieverSearchBtn")?.addEventListener("click", toggleBelieverSearch);
  $("believerSearchInput")?.addEventListener("input", debounce(handleBelieverSearchInput, 300));
  $("selectAllRowsBtn").addEventListener("click", selectAllCurrentRows);
  $("clearSelectedRowsBtn").addEventListener("click", clearSelectedRows);
  $("fileInput").addEventListener("change", handleFile);
  $("applyManualInputBtn")?.addEventListener("click", applyManualInput);

  $("printBtn").addEventListener("click", printAll);
  $("previewPrintBtn")?.addEventListener("click", printAll);
  $("designPrintBackgroundGraphics")?.addEventListener("change", syncPrintBackgroundGraphicsControls);
  $("previewPrintBackgroundGraphics")?.addEventListener("change", () => {
    const mainCb = $("designPrintBackgroundGraphics");
    const previewCb = $("previewPrintBackgroundGraphics");
    if (mainCb) mainCb.checked = previewCb?.checked ?? true;
    syncPrintBackgroundGraphicsControls();
  });
  $("prevBtn").addEventListener("click", () => changePage(-1));
  $("nextBtn").addEventListener("click", () => changePage(1));
  $("jumpPageBtn").addEventListener("click", jumpToPage);
  $("printFromPageBtn").addEventListener("click", printFromPage);
  $("paperSelect")?.addEventListener("change", applyPaperPreset);
  $("templateSelect")?.addEventListener("change", applyTemplate);

  document.querySelectorAll(".panel-toggle").forEach((btn) => {
    btn.addEventListener("click", () => togglePanel(btn.closest(".panel")));
  });
  restorePanelStates();

  if (launchPrintPreviewMode) {
    document.documentElement.classList.add("print-preview-mode");
    document.body.classList.add("print-preview-mode");
  }

  var hasLaunchTemplateId = !!launchParams.get("templateId");
  var hasLaunchPlaqueIds = !!(launchParams.get("plaqueId") || launchParams.get("plaqueIds"));
  if (hasLaunchTemplateId && hasLaunchPlaqueIds) {
    setTemplateStatus("指定模板", "从入口直接加载模板");
  } else {
    await loadServerTemplates();
  }
  if (!hasLaunchPlaqueIds) {
    loadAllSamples();
  }
  if ($("templateSelect")?.options?.length) {
    applyTemplate();
  } else {
    render();
  }
  loadRitualOptions();
  loadDedicationTypeOptions();
  await applyLaunchParams();
}

function render() {
  syncPrintSize();
  syncPrintSettingsPanel();
  if (!state.isDesignerPage && (!$("templateSelect") || !$("templateSelect").options.length)) {
    $("preview").innerHTML = '<div class="empty">未读取到已同步模板，请先在主窗口同步服务器模板。</div>';
    $("statusText").textContent = "未读取到已同步模板";
    $("pageText").textContent = "";
    return;
  }
  var currentGroup = currentDataGroup();
  var currentData = state.datasets[currentGroup];
  var otherGroup = currentGroup === "blessing" ? "deliverance" : "blessing";
  var otherData = state.datasets[otherGroup];
  if ((!currentData || !currentData.length) && otherData && otherData.length) {
    var templateName = currentTemplate()?.name || currentTemplate()?.id || "当前模板";
    var otherGroupLabel = dataGroupLabel(otherGroup);
    var hint = "当前 <strong>" + escapeHtml(templateName) + "</strong> 属于「" + escapeHtml(dataGroupLabel(currentGroup)) + "」类别，但数据已加载在「" + escapeHtml(otherGroupLabel) + "」中（" + otherData.length + " 条）。<br>请在下方表格中切换到「" + escapeHtml(otherGroupLabel) + "」后重试，或重新导入数据。";
    $("preview").innerHTML = '<div class="empty" style="padding:40px;text-align:center;color:var(--muted);"><p style="font-size:14px;line-height:2;margin-bottom:8px;">' + hint + '</p></div>';
    $("statusText").textContent = "数据分组不匹配";
    $("pageText").textContent = "";
    buildManualInputFields();
    renderDebugInfo();
    return;
  }
  if (state.mode === "single") renderSingle();
  if (state.mode === "summary") renderSummary();
  buildManualInputFields();
  renderDebugInfo();
}

function renderSingle() {
  const rows = currentRows();
  const row = rows[state.pageIndex] || {};
  const total = Math.max(rows.length, 1);
  state.pageIndex = clamp(state.pageIndex, 0, total - 1);
  $("preview").innerHTML = singleSheet(row, state.editSide);
  const previousVariantKey = state.singleVariantKey;
  syncSingleVariantControls();
  if (previousVariantKey !== state.singleVariantKey) {
    buildFieldMapping();
    buildStyleEditor();
  }
  fitAllFields();
  $("statusText").textContent = rows.length ? `${currentTabletType().name}：${fieldValue(row, "subject") || `第 ${state.pageIndex + 1} 条`}` : "暂无数据";
  $("pageText").textContent = `第 ${state.pageIndex + 1} / ${total} 张`;
  syncJumpPageInput(total);
}

function renderSummary() {
  const rows = currentRows();
  const columns = Number($("columnCount").value) || 3;
  const pageSize = columns;
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  state.pageIndex = clamp(state.pageIndex, 0, totalPages - 1);
  const start = state.pageIndex * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  clampSummaryFieldsIntoView();
  $("preview").innerHTML = summarySheet(pageRows);
  fitAllFields();
  $("statusText").textContent = `${currentDataGroupName()}汇总：共 ${rows.length} 条`;
  $("pageText").textContent = `第 ${state.pageIndex + 1} / ${totalPages} 页`;
  syncJumpPageInput(totalPages);
}

function syncPrintSettingsPanel() {
  const panel = document.querySelector(".print-settings-panel");
  if (!panel || panel.style.display === "none") return;
  const template = currentTemplate();
  const paperW = $("paperWidth")?.value || 210;
  const paperH = $("paperHeight")?.value || 297;
  const ps = $("printSettingsPaper");
  const pt = $("printSettingsTemplate");
  const pcount = $("printSettingsPlaqueCount");
  const pstatus = $("printSettingsStatus");
  const rows = currentRows();
  if (ps) ps.textContent = `${$("paperSelect")?.value || "custom"} ${paperW}×${paperH}mm`;
  if (pt) pt.textContent = template ? templateDisplayName(template) : "--";
  if (pcount) pcount.textContent = rows.length ? `${rows.length} 条数据` : "";
  if (pstatus) {
    const st = $("statusText");
    pstatus.textContent = st ? st.textContent : "";
  }
  const previewCb = $("previewPrintBackgroundGraphics");
  const mainCb = $("designPrintBackgroundGraphics");
  if (previewCb && mainCb) previewCb.checked = mainCb.checked;
}

init().catch(function (error) {
  console.error("打印工具初始化失败:", error);
  var busyEl = document.getElementById("busyText");
  if (busyEl) busyEl.textContent = "初始化失败，请刷新页面重试";
  var previewEl = document.getElementById("preview");
  if (previewEl) {
    previewEl.innerHTML = '<div class="empty" style="padding:40px;text-align:center;color:var(--muted);"><p style="font-size:16px;margin-bottom:8px;">初始化失败</p><p style="font-size:13px;">请关闭页面后重试，或联系管理员。</p></div>';
  }
});
