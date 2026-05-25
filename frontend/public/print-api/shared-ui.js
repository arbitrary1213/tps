function handleSingleVariantChange() {
  if (state.mode !== "single") return;
  state.singleVariantKey = normalizeSingleVariantKey($("singleVariant")?.value || state.singleVariantKey);
  state.singleVariantManualOverride = true;
  if ($("singleVariant")) $("singleVariant").value = state.singleVariantKey;
  const layout = ensureLayout(currentLayoutKey());
  layout.singleVariantKey = state.singleVariantKey;
  const row = currentRows()[state.pageIndex];
  if (row) row.__singleVariant = currentSingleVariantKey();
  state.activeFieldKey = "";
  updateSingleVariantTabState();
  saveLayouts();
  if (currentLayoutKey().startsWith("custom_")) saveCustomTemplatesToStorage();
  buildFieldMapping();
  buildStyleEditor();
  buildStaticVisibilityControls();
  render();
}

function handleSummaryVariantChange() {
  if (state.mode !== "summary") return;
  state.activeFieldKey = "";
  buildSummaryFieldMapping();
  buildStyleEditor();
  buildStaticVisibilityControls();
  render();
}

function setMode(mode) {
  state.mode = mode;
  state.pageIndex = 0;
  if (mode !== "single") state.editSide = "front";
  if (mode === "summary" && !isSummaryTemplate(currentTemplate()) && $("templateSelect")) {
    $("templateSelect").value = defaultSummaryTemplateId();
  }
  if (mode === "single" && isSummaryTemplate(currentTemplate()) && $("templateSelect")) {
    $("templateSelect").value = defaultSingleTemplateIdForGroup("blessing");
  }
  syncControlsFromSelectedTemplate();
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  if ($("singleSettings")) $("singleSettings").hidden = mode !== "single";
  if ($("summarySettings")) $("summarySettings").hidden = mode !== "summary";
  if ($("duplexSettings")) $("duplexSettings").hidden = mode !== "single";
  syncSideButtons();
  relocateSharedStyleEditor();
  buildFieldMapping();
  buildStyleEditor();
  if (mode === "summary") renderTable();
  updateDataHint();
  applySummaryDefault();
  render();
}

function relocateSharedStyleEditor() {
  const editor = document.querySelector(".field-style-editor");
  const staticActions = $("sharedStaticFieldActions");
  const singleSettings = $("singleSettings");
  const summarySettings = $("summarySettings");
  if (!editor || !singleSettings || !summarySettings) return;

  if (state.mode === "summary") {
    const summaryStaticAnchor = summarySettings.querySelector(".static-field-actions-anchor");
    if (staticActions && summaryStaticAnchor && staticActions.parentElement !== summarySettings) {
      summarySettings.insertBefore(staticActions, summaryStaticAnchor);
    } else if (staticActions && summaryStaticAnchor && staticActions.nextElementSibling !== summaryStaticAnchor) {
      summarySettings.insertBefore(staticActions, summaryStaticAnchor);
    }
    const summaryAnchor = summarySettings.querySelector(".grid-2");
    if (summaryAnchor && editor.parentElement !== summarySettings) {
      summarySettings.insertBefore(editor, summaryAnchor);
    } else if (!summaryAnchor && editor.parentElement !== summarySettings) {
      summarySettings.appendChild(editor);
    }
    return;
  }

  const singleStaticTools = singleSettings.querySelector(".static-field-tools");
  if (staticActions && singleStaticTools && staticActions.parentElement !== singleSettings) {
    singleSettings.insertBefore(staticActions, singleStaticTools.nextSibling);
  } else if (staticActions && singleStaticTools && staticActions.previousElementSibling !== singleStaticTools) {
    singleSettings.insertBefore(staticActions, singleStaticTools.nextSibling);
  }
  const singleFontWrap = singleSettings.querySelector(".grid-2");
  if (singleFontWrap && editor.parentElement !== singleSettings) {
    singleSettings.insertBefore(editor, singleFontWrap);
  } else if (!singleFontWrap && editor.parentElement !== singleSettings) {
    singleSettings.appendChild(editor);
  }
}

function applyPaperPreset() {
  const value = $("paperSelect").value;
  if (value === "A3") {
    $("paperWidth").value = 297;
    $("paperHeight").value = 420;
  }
  if (value === "A4") {
    $("paperWidth").value = 210;
    $("paperHeight").value = 297;
  }
  if (value === "A5") {
    $("paperWidth").value = 148;
    $("paperHeight").value = 210;
  }
  render();
}

function applyTemplate() {
  try {
    const template = currentTemplate();
    ensureLayout(template.id);
    state.singleVariantManualOverride = false;
    if (isSummaryTemplate(template)) state.editSide = "front";
    syncControlsFromSelectedTemplate();
    if (isSummaryTemplate(template)) {
      setMode("summary");
      refreshSummaryVariantOptions();
      buildSummaryFieldMapping();
      buildStyleEditor();
      renderTable();
      updateDataHint();
    } else {
      setMode("single");
      const ps = $("paperSelect");
      if (ps) ps.value = "custom";
    }
    const deleteBtn = $("deleteTemplateBtn");
    if (deleteBtn) deleteBtn.style.display = BUILTIN_TEMPLATE_IDS.has(template.id) ? "none" : "";
    render();
  } catch (error) {
    console.error("applyTemplate 失败:", error);
  }
}

function currentTemplate() {
  return templates.find((item) => item.id === $("templateSelect").value) || templates[0];
}

function templateDisplayName(template) {
  if (!template?.id) return "";
  const catalog = TEMPLATE_CATALOG[template.id];
  if (catalog) return catalog.name;
  const builtinNames = {
    blessing: "延生禄位模板",
    deliverance: "往生牌位模板",
    a4summary: "延生通名",
    a3summary: "往生通名",
  };
  if (builtinNames[template.id]) return builtinNames[template.id];
  if (template?.id?.startsWith("custom_")) {
    const cat = TEMPLATE_CATEGORIES[template.category];
    if (cat && cat.label !== "牌位模版" && cat.label !== "汇总多列模版" && cat.label !== "文牒模版") {
      const dataLabel = template.dataGroup === "deliverance" ? "往生" : "延生";
      const baseName = template.name || template.id;
      return baseName.includes("｜") ? baseName : `${dataLabel}｜${baseName}`;
    }
    return template.name || template.id;
  }
  return template.name || template.id;
}

function templateGroupLabel(template) {
  const catalog = TEMPLATE_CATALOG[template?.id || ""];
  if (catalog) return catalog.groupLabel;
  if (template?.category) {
    const cat = TEMPLATE_CATEGORIES[template.category];
    if (cat) return cat.label;
  }
  if (isSummaryTemplate(template)) return "汇总多列模版";
  if (template?.id?.startsWith("custom_")) {
    return template.dataGroup === "deliverance" ? "往生牒模版" : "延生牒模版";
  }
  return "牌位模版";
}

function templateGroupOrder(template) {
  const catalog = TEMPLATE_CATALOG[template?.id || ""];
  if (catalog) return catalog.groupOrder;
  if (template?.category) {
    const cat = TEMPLATE_CATEGORIES[template.category];
    if (cat) return cat.groupOrder;
  }
  if (isSummaryTemplate(template)) return 4;
  if (template?.id?.startsWith("custom_")) {
    return template.dataGroup === "deliverance" ? 3 : 2;
  }
  return 1;
}

function templateOrderInGroup(template) {
  const catalog = TEMPLATE_CATALOG[template?.id || ""];
  if (catalog) return catalog.order;
  const order = {
    blessing: 1,
    deliverance: 2,
    a4summary: 1,
    a3summary: 2,
  };
  if (Object.prototype.hasOwnProperty.call(order, template?.id || "")) return order[template.id];
  return 99;
}

function ensureTemplateOptionGroup(select, label) {
  const safeLabel = String(label || "").trim() || "其他模板";
  let group = Array.from(select.children).find((item) => item.tagName === "OPTGROUP" && item.label === safeLabel);
  if (!group) {
    group = document.createElement("optgroup");
    group.label = safeLabel;
    select.appendChild(group);
  }
  return group;
}

function rebuildTemplateOptions(selectedId = $("templateSelect")?.value || "") {
  const select = $("templateSelect");
  if (!select) return;
  select.innerHTML = "";
  const sortedTemplates = [...templates].sort((left, right) => {
    const groupDelta = templateGroupOrder(left) - templateGroupOrder(right);
    if (groupDelta !== 0) return groupDelta;
    const orderDelta = templateOrderInGroup(left) - templateOrderInGroup(right);
    if (orderDelta !== 0) return orderDelta;
    return templateDisplayName(left).localeCompare(templateDisplayName(right), "zh-CN");
  });
  sortedTemplates.forEach((template) => {
    appendTemplateOption(template);
  });
  if (selectedId && Array.from(select.options).some((option) => option.value === selectedId)) {
    select.value = selectedId;
  } else if (sortedTemplates[0]) {
    select.value = sortedTemplates[0].id;
  }
}

function appendTemplateOption(template) {
  const select = $("templateSelect");
  if (!select || !template?.id || Array.from(select.options).some((option) => option.value === template.id)) return;
  const option = document.createElement("option");
  option.value = template.id;
  option.textContent = templateDisplayName(template);
  ensureTemplateOptionGroup(select, templateGroupLabel(template)).appendChild(option);
}

function syncControlsFromSelectedTemplate() {
  const template = currentTemplate();
  const layout = ensureLayout(template.id);
  const paperWidth = $("paperWidth");
  const paperHeight = $("paperHeight");
  const paperSelect = $("paperSelect");
  const summaryVariant = $("summaryVariant");
  const singleFont = $("singleFont");
  const singleVertical = $("singleVertical");
  const templateTypeLabel = $("templateTypeLabel");

  if (templateTypeLabel) {
    const cat = template?.category ? TEMPLATE_CATEGORIES[template.category] : null;
    if (cat && cat.label === "牌位模版") {
      templateTypeLabel.textContent = template?.dataGroup === "deliverance" ? "超度牌位模版" : "延生禄位模版";
    } else {
      templateTypeLabel.textContent = template?.dataGroup === "deliverance" ? "往生牌位模板" : "延生禄位模板";
    }
  }

  if (isSummaryTemplate(template)) {
    const paper = layout.paper || summaryTemplatePaper(template.id);
    if (paperWidth) paperWidth.value = paper.width;
    if (paperHeight) paperHeight.value = paper.height;
    if (paperSelect) paperSelect.value = summaryTemplatePaperPreset(template.id);
    applySavedSummarySettings(layout.summary);
    refreshSummaryVariantOptions();
    if (summaryVariant && layout.summary?.variantKey && Array.from(summaryVariant.options).some((option) => option.value === layout.summary.variantKey)) {
      summaryVariant.value = layout.summary.variantKey;
    }
    buildSummaryFieldMapping();
  } else {
    if (paperWidth) paperWidth.value = layout.paper?.width || template.width;
    if (paperHeight) paperHeight.value = layout.paper?.height || template.height;
    if (paperSelect && paperWidth && paperHeight) {
      paperSelect.value = paperPresetForSize(Number(paperWidth.value), Number(paperHeight.value));
    }
    state.singleVariantKey = normalizeSingleVariantKey(layout.singleVariantKey || $("singleVariant")?.value || state.singleVariantKey);
    if ($("singleVariant")) $("singleVariant").value = state.singleVariantKey;
    if (singleFont) singleFont.value = template.font;
    if (singleVertical) singleVertical.checked = layout.paper?.vertical ?? template.vertical;
    if ($("enableDuplex")) $("enableDuplex").checked = Boolean(layout.duplex?.enabled);
  }
  syncSideButtons();
}

function setEditSide(side) {
  const layout = ensureLayout(currentLayoutKey());
  if (side === "back" && !layout.duplex?.enabled) return;
  state.editSide = side === "back" ? "back" : "front";
  state.activeFieldKey = "";
  syncSideButtons();
  buildFieldMapping();
  buildStyleEditor();
  render();
}

function syncSideButtons() {
  const layout = state.mode === "single" ? ensureLayout(currentLayoutKey()) : null;
  const duplexEnabled = Boolean(layout?.duplex?.enabled);
  if (!duplexEnabled && state.editSide === "back") state.editSide = "front";
  document.querySelectorAll("[data-side]").forEach((button) => {
    button.classList.toggle("active", button.dataset.side === state.editSide);
    if (button.dataset.side === "back") button.disabled = state.mode !== "single" || !duplexEnabled;
  });
  if ($("fieldMapping")) $("fieldMapping").hidden = false;
  if ($("singleFont")) $("singleFont").closest("label").hidden = state.mode === "single" && state.editSide === "back";
  if ($("singleOffsetY")) $("singleOffsetY").closest("label").hidden = state.mode === "single" && state.editSide === "back";
  if ($("singleVertical")) $("singleVertical").closest("label").hidden = false;
  syncSingleVariantControls();
}

function syncSingleVariantControls() {
  const wrap = $("singleVariantWrap");
  if (!wrap) return;
  wrap.hidden = state.mode !== "single" || state.editSide === "back";
  const layout = ensureLayout(currentLayoutKey());
  const presets = singleVariantPresetsForCurrentType();
  const row = currentRows()[state.pageIndex];
  const detectedKey = row ? normalizeSingleVariantKey(row.__variant || "") : "";
  const selectedKey = normalizeSingleVariantKey(layout.singleVariantKey || state.singleVariantKey || presets[0].key);
  const shouldFollowDetected = row && detectedKey && !state.singleVariantManualOverride;
  state.singleVariantKey = shouldFollowDetected ? detectedKey : selectedKey;
  refreshSingleVariantOptions();
  if ($("singleVariant")) $("singleVariant").value = state.singleVariantKey || presets[0].key;
  updateSingleVariantTabState();
  if (row && state.mode === "single") {
    wrap.dataset.detectedVariant = detectedKey;
  } else {
    delete wrap.dataset.detectedVariant;
  }
  buildStaticVisibilityControls();
}

function refreshSingleVariantOptions() {
  const select = $("singleVariant");
  if (!select) return;
  const presets = singleVariantPresetsForCurrentType();
  const previous = normalizeSingleVariantKey(state.singleVariantKey || select.value);
  select.innerHTML = presets.map((variant) => (
    `<option value="${variant.key}">${escapeHtml(variant.label)}</option>`
  )).join("");
  select.value = presets.some((variant) => variant.key === previous)
    ? previous
    : presets[0].key;
  state.singleVariantKey = select.value;
  renderSingleVariantTabs();
}

function renderSingleVariantTabs() {
  const tabs = $("singleVariantTabs");
  const select = $("singleVariant");
  if (!tabs || !select) return;
  tabs.innerHTML = singleVariantPresetsForCurrentType().map((variant) => (
    `<button type="button" data-single-variant="${variant.key}" class="${select.value === variant.key ? "active" : ""}">${escapeHtml(variant.label)}</button>`
  )).join("");
}

function singleVariantPresetsForCurrentType() {
  const type = state.mode === "single"
    ? currentDataGroup()
    : normalizeTabletType(currentTemplate()?.tabletType || "blessing");
  return singleVariantPresetsByType[type] || singleVariantPresetsByType.blessing;
}

function variantPresetsForCurrentContext() {
  if (state.mode === "single") return singleVariantPresetsForCurrentType();
  if (state.mode === "summary") return summaryVariantPresetsFor();
  return [];
}

function updateSingleVariantTabState() {
  const select = $("singleVariant");
  document.querySelectorAll("[data-single-variant]").forEach((button) => {
    button.classList.toggle("active", button.dataset.singleVariant === select?.value);
  });
}

function handleSingleVariantTabClick(event) {
  const button = event.target.closest("[data-single-variant]");
  const select = $("singleVariant");
  if (!button || !select) return;
  event.preventDefault();
  event.stopPropagation();
  if (select.value === button.dataset.singleVariant) return;
  state.singleVariantKey = normalizeSingleVariantKey(button.dataset.singleVariant);
  select.value = state.singleVariantKey;
  updateSingleVariantTabState();
  handleSingleVariantChange();
}

function buildStaticVisibilityControls() {
  const singleWrap = $("singleStaticVisibility");
  const summaryWrap = $("summaryStaticVisibility");

  if (state.mode === "summary") {
    if (singleWrap) {
      singleWrap.hidden = true;
      singleWrap.innerHTML = "";
    }
    if (!summaryWrap) return;
    summaryWrap.hidden = false;
    const layout = ensureLayout(currentLayoutKey());
    const variantKey = currentSummaryVariantKey();
    const fields = layout.staticFields || [];
    if (!fields.length) {
      summaryWrap.innerHTML = '<p class="hint">当前汇总模板还没有静态字段。</p>';
      return;
    }
    summaryWrap.innerHTML = `
      <div class="static-visibility-title">当前版式静态字段显示</div>
      ${fields.map((field) => `
        <label class="checkbox">
          <input type="checkbox" data-summary-static-visibility="${escapeHtml(field.key)}"${staticFieldVisibleInVariant(field, variantKey) ? " checked" : ""}>
          ${escapeHtml(field.text || field.key)}
        </label>
      `).join("")}
    `;
    summaryWrap.querySelectorAll("[data-summary-static-visibility]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const key = checkbox.dataset.summaryStaticVisibility || "";
        const target = fields.find((field) => field.key === key);
        if (!target) return;
        setStaticFieldVariantVisibility(target, checkbox.checked, variantKey);
        state.activeFieldKey = key;
        saveLayouts();
        buildStyleEditor();
        buildStaticVisibilityControls();
        render();
      });
    });
    summaryWrap.querySelectorAll("label.checkbox").forEach((label) => {
      label.addEventListener("click", (event) => {
        if (event.target instanceof HTMLInputElement) return;
        const checkbox = label.querySelector("[data-summary-static-visibility]");
        const key = checkbox?.dataset.summaryStaticVisibility || "";
        if (!key) return;
        state.activeFieldKey = key;
        if ($("styleField")) {
          $("styleField").value = key;
          syncStyleInputs();
        } else {
          syncSelectedFieldHighlight();
        }
        buildStaticVisibilityControls();
        render();
      });
    });
    return;
  }

  if (summaryWrap) {
    summaryWrap.hidden = true;
    summaryWrap.innerHTML = "";
  }
  const wrap = singleWrap;
  if (!wrap) return;
  const enabled = state.mode === "single" && state.editSide !== "back";
  wrap.hidden = !enabled;
  if (!enabled) {
    wrap.innerHTML = "";
    return;
  }
  const layout = ensureLayout(currentLayoutKey());
  const variantKey = currentSingleVariantKey();
  const fields = layout.staticFields || [];
  if (!fields.length) {
    wrap.innerHTML = '<p class="hint">当前模板还没有静态字段。</p>';
    return;
  }
  wrap.innerHTML = `
    <div class="static-visibility-title">当前版式静态字段显示</div>
    ${fields.map((field) => `
      <label class="checkbox">
        <input type="checkbox" data-static-visibility="${escapeHtml(field.key)}"${staticFieldVisibleInVariant(field, variantKey) ? " checked" : ""}>
        ${escapeHtml(field.text || field.key)}
      </label>
    `).join("")}
  `;
  wrap.querySelectorAll("[data-static-visibility]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const target = fields.find((field) => field.key === checkbox.dataset.staticVisibility);
      if (!target) return;
      setStaticFieldVariantVisibility(target, checkbox.checked, variantKey);
      saveLayouts();
      buildStyleEditor();
      render();
    });
  });
}

function syncDuplexSetting() {
  if (state.mode !== "single") return;
  const layout = ensureLayout(currentLayoutKey());
  if (!layout.duplex) layout.duplex = {};
  layout.duplex.enabled = Boolean($("enableDuplex")?.checked);
  if (!layout.duplex.enabled && state.editSide === "back") {
    state.editSide = "front";
    syncSideButtons();
    buildFieldMapping();
    buildStyleEditor();
  }
  saveLayouts();
}

function paperPresetForSize(width, height) {
  if (width === 297 && height === 420) return "A3";
  if (width === 210 && height === 297) return "A4";
  if (width === 148 && height === 210) return "A5";
  return "custom";
}

async function deleteCurrentTemplate() {
  const template = currentTemplate();
  if (BUILTIN_TEMPLATE_IDS.has(template.id)) {
    alert("内置模板不能删除。");
    return;
  }

  if (!confirm(`确定删除模板“${template.name}”吗？`)) return;

  const nextTemplateId = isSummaryTemplate(template)
    ? defaultSummaryTemplateId()
    : defaultSingleTemplateIdForGroup(template.dataGroup);

  const index = templates.findIndex((item) => item.id === template.id);
  if (index >= 0) templates.splice(index, 1);
  delete templateDefaults[template.id];
  delete state.layouts[template.id];
  const remoteId = state.remoteTemplateIds[template.id];
  let serverDeleteFailed = false;
  if (remoteId && canSyncServerTemplates()) {
    try {
      await fetchJson(`/api/plaque-templates/${remoteId}`, {
        method: "DELETE",
        headers: authHeaders(),
        timeout: 8000,
      });
    } catch (error) {
      serverDeleteFailed = true;
      console.warn("删除服务器模板失败:", error);
    }
  }
  if (!serverDeleteFailed) {
    delete state.remoteTemplateIds[template.id];
    saveRemoteTemplateIds();
  }

  const option = Array.from($("templateSelect").options).find((item) => item.value === template.id);
  option?.remove();
  $("templateSelect").value = nextTemplateId;

  saveLayouts();
  saveCustomTemplatesToStorage();
  applyTemplate();
}

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => loadRows(parseDelimited(String(reader.result || "")));
  reader.readAsText(file, "utf-8");
}

function handleBackground(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (isPdfBackgroundFile(file)) {
    importPdfBackground(file)
      .catch((error) => {
        console.error("PDF background import failed:", error);
        alert(error.message || "PDF 底图导入失败");
      })
      .finally(() => {
        event.target.value = "";
      });
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    const webpDataUrl = await convertToWebP(String(reader.result || ""));
    const layout = currentEditableLayout();
    layout.background = webpDataUrl;
    $("showBg").checked = true;
    await persistTemplateMutation({
      syncTemplate: true,
      localMessage: "底图已保存到本机",
      syncingMessage: "正在保存底图...",
      successMessage: isDesktopRuntime() ? "底图已保存到本地数据库" : "底图已保存到服务器",
      failureMessage: isDesktopRuntime() ? "底图已保存到本机，但本地数据库同步失败" : "底图已保存到本机，但服务器同步失败",
    });
    render();
    event.target.value = "";
  };
  reader.onerror = () => {
    event.target.value = "";
  };
  reader.readAsDataURL(file);
}

function clearBackground() {
  const layout = currentEditableLayout();
  if (!layout.background) return;
  layout.background = "";
  $("bgInput").value = "";
  saveLayouts();
  persistTemplateMutation({
    syncTemplate: true,
    localMessage: "底图已清除",
    syncingMessage: "正在清除底图...",
    successMessage: isDesktopRuntime() ? "底图已从本地数据库清除" : "底图已从服务器清除",
    failureMessage: isDesktopRuntime() ? "底图已清除，但本地数据库同步失败" : "底图已清除，但服务器同步失败",
  });
  render();
}

function convertToWebP(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image/") || dataUrl.startsWith("data:image/webp")) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/webp", 0.8));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function isPdfBackgroundFile(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
}

function currentPdfjsLib() {
  return globalThis.pdfjsLib || globalThis["pdfjs-dist/build/pdf"] || null;
}

async function loadScriptOnce(src) {
  const existing = Array.from(document.scripts).find((script) => script.src === src);
  if (existing) {
    if (existing.dataset.loaded === "true") return;
    await new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function ensurePdfjsReady() {
  const existing = currentPdfjsLib();
  if (existing?.getDocument) {
    existing.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CANDIDATES[0];
    return existing;
  }

  let lastError = null;
  for (const src of PDFJS_SCRIPT_CANDIDATES) {
    try {
      await loadScriptOnce(src);
      const loaded = currentPdfjsLib();
      if (loaded?.getDocument) {
        loaded.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CANDIDATES[0];
        return loaded;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("PDF 预览组件加载失败");
}

function mmToPx(mm, dpi = PDF_PRINT_DPI) {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}

async function renderPdfFirstPageToDataUrl(file) {
  const pdfjsLib = await ensurePdfjsReady();
  const buffer = await file.arrayBuffer();
  let lastError = null;

  for (const workerSrc of PDFJS_WORKER_CANDIDATES) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      const loadingTask = pdfjsLib.getDocument({
        data: buffer,
        useWorkerFetch: true,
        isEvalSupported: false,
      });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = mmToPx(Number($("paperWidth").value) || 210);
      const targetHeight = mmToPx(Math.max(Number($("paperHeight").value) || 297, 1));
      const scale = Math.max(targetWidth / baseViewport.width, targetHeight / baseViewport.height);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      const pngUrl = canvas.toDataURL("image/png");
      if (pngUrl && pngUrl !== "data:,") return pngUrl;
      return canvas.toDataURL("image/png");
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("PDF 首张渲染失败");
}

async function importPdfBackground(file) {
  $("statusText").textContent = "正在导入 PDF 底图...";
  const dataUrl = await renderPdfFirstPageToDataUrl(file);
  const layout = currentEditableLayout();
  layout.background = dataUrl;
  $("showBg").checked = true;
  await persistTemplateMutation({
    syncTemplate: true,
    localMessage: "PDF 底图已保存到本机",
    syncingMessage: "正在保存 PDF 底图...",
    successMessage: isDesktopRuntime() ? "PDF 底图已保存到本地数据库" : "PDF 底图已保存到服务器",
    failureMessage: isDesktopRuntime() ? "PDF 底图已保存到本机，但本地数据库同步失败" : "PDF 底图已保存到本机，但服务器同步失败",
  });
  render();
}

function shouldPrintTemplateBackground(forPrint = false) {
  if ($("showBg") && !$("showBg").checked) return false;
  if (!forPrint) return true;
  return $("designPrintBackgroundGraphics")?.checked ?? true;
}

function syncPrintBackgroundGraphicsControls(event = null) {
  render();
}

