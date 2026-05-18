state.isDesignerPage = true;

async function init() {
  workflowStatus.runtime = isDesktopRuntime() ? "桌面端" : "网页端";
  workflowStatus.launchSource = "模板设计页";
  setWorkflowStatus();

  templates.forEach((template, index) => {
    templates[index] = normalizeCatalogTemplate(template);
  });
  ensureBuiltinSingleTemplates();
  migrateStoredLayouts();
  rebuildTemplateOptions();
  loadCustomTemplatesFromStorage();

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  $("printBtn").addEventListener("click", printAll);
  $("designPrintBackgroundGraphics")?.addEventListener("change", syncPrintBackgroundGraphicsControls);
  $("prevBtn").addEventListener("click", () => changePage(-1));
  $("nextBtn").addEventListener("click", () => changePage(1));
  $("jumpPageBtn").addEventListener("click", jumpToPage);
  $("printFromPageBtn").addEventListener("click", printFromPage);
  $("paperSelect")?.addEventListener("change", applyPaperPreset);
  $("templateSelect")?.addEventListener("change", applyTemplate);
  $("singleVariant")?.addEventListener("change", handleSingleVariantChange);
  $("singleVariantTabs")?.addEventListener("click", handleSingleVariantTabClick);
  $("addStaticFieldBtn")?.addEventListener("click", addStaticField);
  $("addSummaryStaticFieldBtn")?.addEventListener("click", addSummaryStaticField);
  $("copyFieldBtn")?.addEventListener("click", copySelectedField);
  $("editStaticFieldBtn")?.addEventListener("click", editSelectedStaticField);
  $("deleteStaticFieldBtn")?.addEventListener("click", deleteSelectedStaticField);
  $("showBg")?.addEventListener("change", render);
  $("enableDuplex")?.addEventListener("change", syncDuplexSetting);

  $("saveTemplateBtn").addEventListener("click", saveCurrentLayout);
  $("resetTemplateBtn").addEventListener("click", resetCurrentLayout);
  $("deleteTemplateBtn").addEventListener("click", deleteCurrentTemplate);
  $("bgInput").addEventListener("change", handleBackground);
  $("clearBgBtn")?.addEventListener("click", clearBackground);

  ensureFieldContextMenu();
  document.addEventListener("click", handleGlobalPointerDismiss);
  document.querySelectorAll(".panel-toggle").forEach((btn) => {
    btn.addEventListener("click", () => togglePanel(btn.closest(".panel")));
  });
  restorePanelStates();
  document.querySelectorAll("[data-side]").forEach((button) => {
    button.addEventListener("click", () => setEditSide(button.dataset.side || "front"));
  });

  document.getElementById("selectAllFields")?.addEventListener("click", () => {
    document.querySelectorAll(".field-checkbox").forEach(cb => cb.checked = true);
  });
  document.getElementById("deselectAllFields")?.addEventListener("click", () => {
    document.querySelectorAll(".field-checkbox").forEach(cb => cb.checked = false);
  });

  document.getElementById("newTemplateBtn")?.addEventListener("click", () => {
    const newTemplateCategory = document.getElementById("newTemplateCategory");
    const newTemplateDataGroup = document.getElementById("newTemplateDataGroup");
    const newTemplateName = document.getElementById("newTemplateName");
    const newTemplateWidth = document.getElementById("newTemplateWidth");
    const newTemplateHeight = document.getElementById("newTemplateHeight");
    const newTemplateMode = document.getElementById("newTemplateMode");
    const newTemplateVertical = document.getElementById("newTemplateVertical");
    const fieldSelection = document.getElementById("fieldSelection");
    const newTemplateModeLabel = document.getElementById("newTemplateModeLabel");
    const newTemplateDialog = document.getElementById("newTemplateDialog");
    const initialCategory = state.mode === "summary" ? "summary" : "plaque";
    const initialDataGroup = currentDataGroup();
    if (newTemplateCategory) newTemplateCategory.value = initialCategory;
    if (newTemplateDataGroup) newTemplateDataGroup.value = initialDataGroup;
    applyNewTemplateCategory(initialCategory);
    if (newTemplateName) newTemplateName.value = "";
    if (newTemplateWidth) newTemplateWidth.value = state.mode === "summary" ? ($("paperWidth")?.value || "210") : "90";
    if (newTemplateHeight) newTemplateHeight.value = state.mode === "summary" ? ($("paperHeight")?.value || "297") : "260";
    if (newTemplateMode) newTemplateMode.value = "preset";
    if (newTemplateVertical) newTemplateVertical.checked = initialCategory !== "summary";
    if (fieldSelection?.closest("fieldset")) fieldSelection.closest("fieldset").hidden = initialCategory === "summary";
    if (newTemplateModeLabel) newTemplateModeLabel.hidden = initialCategory === "summary";
    newTemplateDialog?.showModal?.();
  });

  document.getElementById("newTemplateCategory")?.addEventListener("change", (event) => {
    applyNewTemplateCategory(event.target?.value || "plaque");
  });
  document.getElementById("newTemplateDataGroup")?.addEventListener("change", (event) => {
    renderFieldSelection(event.target?.value || "blessing");
  });
  document.getElementById("newTemplateMode")?.addEventListener("change", (event) => {
    const mode = event.target?.value || "preset";
    const fieldSelection = document.getElementById("fieldSelection");
    if (fieldSelection?.closest("fieldset")) {
      fieldSelection.closest("fieldset").hidden = state.mode === "summary" || mode !== "manual";
    }
  });
  document.getElementById("cancelNewTemplate")?.addEventListener("click", () => {
    document.getElementById("newTemplateDialog")?.close?.();
  });
  document.getElementById("newTemplateDialog")?.addEventListener("click", (e) => {
    const dialog = document.getElementById("newTemplateDialog");
    if (e.target === dialog) {
      dialog?.close?.();
    }
  });
  document.getElementById("confirmNewTemplate")?.addEventListener("click", createCustomTemplate);
  $("summaryVariant")?.addEventListener("change", () => {
    handleSummaryVariantChange();
  });

  const controls = [
    "templateSelect", "paperSelect", "paperWidth", "paperHeight", "singleVariant",
    "singleFont", "singleOffsetY", "singleVertical",
    "styleField", "fieldFontSize", "fieldColor", "fieldFontFamily", "fieldTextAlign", "fieldVerticalAlign", "fieldWrapMode", "staticFieldText",
    "showBg", "enableDuplex", "designPrintBackgroundGraphics",
    "summaryVariant", "summaryFormat", "columnCount", "rowsPerColumn", "summaryFont",
    "summaryLineGap", "pageMargin", "columnGap", "summaryVertical",
  ].map($).filter(Boolean);

  controls.forEach((control) => control.addEventListener("input", () => {
    if (control.id === "summaryVariant") {
      handleSummaryVariantChange();
      return;
    }
    if (control.id === "singleVariant") {
      handleSingleVariantChange();
      return;
    }
    if (control.id === "styleField") syncStyleInputs();
    if (["fieldFontSize", "fieldColor", "fieldFontFamily", "fieldTextAlign", "fieldVerticalAlign", "fieldWrapMode"].includes(control.id)) updateSelectedFieldStyle();
    if (control.id === "singleFont") syncSubjectFontSize();
    if (control.id === "enableDuplex") syncDuplexSetting();
    render();
  }));

  relocateSharedStyleEditor();
  await loadServerTemplates();
  const launched = applyLaunchTemplate(launchParams.get("templateId"));
  if (!launched) applyTemplate();
}

function render() {
  closeFieldContextMenu();
  syncPrintSize();
  if (state.mode === "single") renderSingle();
  if (state.mode === "summary") renderSummary();
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
  bindDragHandles();
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
  bindDragHandles();
  fitAllFields();
  $("statusText").textContent = `${currentDataGroupName()}汇总：共 ${rows.length} 条`;
  $("pageText").textContent = `第 ${state.pageIndex + 1} / ${totalPages} 页`;
  syncJumpPageInput(totalPages);
}

init();
