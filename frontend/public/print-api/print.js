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
  ensureBuiltinSingleTemplates();
  migrateStoredLayouts();
  const templateSelect = $("templateSelect");
  if (templateSelect) {
    templateSelect.innerHTML = "";
  }
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
  $("designPrintBackgroundGraphics")?.addEventListener("change", syncPrintBackgroundGraphicsControls);
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

  const controls = [
    "paperSelect", "paperWidth", "paperHeight",
    "summaryVariant", "summaryFormat", "columnCount", "rowsPerColumn", "summaryFont",
    "summaryLineGap", "pageMargin", "columnGap", "summaryVertical",
  ].map($).filter(Boolean);

  loadAllSamples();
  await loadServerTemplates();
  if ($("templateSelect")?.options?.length) {
    applyTemplate();
  } else {
    render();
  }
  loadRitualOptions();
  loadDedicationTypeOptions();
  applyLaunchParams();
}

function render() {
  syncPrintSize();
  if (!state.isDesignerPage && !$("templateSelect").options.length) {
    $("preview").innerHTML = '<div class="empty">未读取到已同步模板，请先在主窗口同步服务器模板。</div>';
    $("statusText").textContent = "未读取到已同步模板";
    $("pageText").textContent = "";
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

init();
