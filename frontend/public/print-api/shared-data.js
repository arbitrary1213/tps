function parseDelimited(text) {
  const clean = text.trim();
  if (!clean) return [];
  const delimiter = clean.includes("\t") ? "\t" : ",";
  const lines = clean.split(/\r?\n/).filter(Boolean);
  const headers = splitLine(lines[0], delimiter).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitLine(line, delimiter);
    return headers.reduce((row, header, index) => {
      row[header] = (values[index] || "").trim();
      return row;
    }, {});
  });
}

function splitLine(line, delimiter) {
  if (delimiter === "\t") return line.split("\t");
  const result = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && next === "\"") {
      value += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      result.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  result.push(value);
  return result;
}

function loadRows(rows) {
  const group = currentDataGroup();
  setDataSourceStatus("手动导入数据");
  state.datasets[group] = rows
    .filter((row) => Object.values(row).some((value) => String(value).trim()))
    .map((row, index) => normalizeRow(row, group, index));
  state.selectedRowIds[group].clear();
  state.pageIndex = 0;
  state.singleVariantManualOverride = false;
  buildFieldMapping();
  buildStyleEditor();
  renderTable();
  updateDataHint();
  applySummaryDefault(true);
  render();
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; fn.apply(this, args); }, delay);
  };
}

function toggleBelieverSearch() {
  const panel = $("believerSearchPanel");
  if (!panel) return;
  panel.hidden = !panel.hidden;
  if (!panel.hidden) {
    $("believerSearchInput").value = "";
    $("believerSearchResults").innerHTML = "";
    $("believerSearchInput").focus();
  }
}

async function handleBelieverSearchInput() {
  const keyword = $("believerSearchInput")?.value?.trim();
  const resultsDiv = $("believerSearchResults");
  if (!resultsDiv) return;
  if (!keyword || keyword.length < 1) {
    resultsDiv.innerHTML = "";
    return;
  }

  try {
    let devotees;
    if (isDesktopRuntime()) {
      devotees = (await listDesktopRows("devotees") || [])
        .filter((d) => {
          const searchLower = keyword.toLowerCase();
          return (d.name || "").toLowerCase().includes(searchLower) ||
            (d.phone || "").toLowerCase().includes(searchLower);
        })
        .slice(0, 20);
    } else {
      const response = await fetchJson(`/api/search/devotees?${new URLSearchParams({ keyword })}`, {
        headers: authHeaders(), timeout: 10000,
      });
      devotees = normalizeListResponse(response).slice(0, 20);
    }

    if (!devotees.length) {
      resultsDiv.innerHTML = '<div class="hint" style="padding:8px;">未找到匹配的信众</div>';
      return;
    }

    resultsDiv.innerHTML = devotees.map((d) => {
      const name = d.name || "未命名";
      const phone = d.phone || "";
      const label = phone ? `${name} (${phone})` : name;
      return `<button type="button" class="believer-result-item" data-devotee-id="${d.id}" style="display:block;width:100%;text-align:left;padding:6px 8px;border:none;background:none;cursor:pointer;border-radius:4px;">${escapeHtml(label)}</button>`;
    }).join("");

    resultsDiv.querySelectorAll(".believer-result-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        loadPlaquesByBeliever(btn.dataset.devoteeId, btn.textContent);
      });
    });
  } catch (error) {
    console.warn("搜索信众失败:", error);
    resultsDiv.innerHTML = '<div class="hint" style="padding:8px;color:var(--accent);">搜索失败，请重试</div>';
  }
}

async function loadPlaquesByBeliever(devoteeId, label) {
  const panel = $("believerSearchPanel");
  if (panel) panel.hidden = true;
  const group = currentDataGroup();

  try {
    setDataSourceStatus(`信人：${label || devoteeId}`);
    setBusy(`正在读取信人关联牌位...`);
    let rows;
    if (isDesktopRuntime()) {
      const localPlaques = await listDesktopRows("plaques");
      rows = localPlaques
        .filter((plaque) => plaque.devoteeId === devoteeId)
        .map(plaqueToRow)
        .map((row, index) => normalizeRow(row, group, index));
    } else {
      const response = await fetchJson(`/api/plaques?${new URLSearchParams({
        devoteeId,
        pageSize: "200",
      })}`, {
        headers: authHeaders(), timeout: 10000,
      });
      const plaques = normalizeListResponse(response);
      rows = plaques
        .map(plaqueToRow)
        .map((row, index) => normalizeRow(row, group, index));
    }
    state.datasets[group] = rows;
    state.selectedRowIds[group].clear();
    state.pageIndex = 0;
    state.singleVariantManualOverride = false;
    buildFieldMapping();
    buildStyleEditor();
    renderTable();
    updateDataHint();
    applySummaryDefault(true);
    render();
    setBusy(`已读取${rows.length}条信人关联数据`);
  } catch (error) {
    console.error("读取信人数据失败:", error);
    alert(error.message || "读取信人数据失败");
    setBusy("读取信人数据失败");
  }
}

function loadSystemPlaquesFromFilters() {
  const selectedType = $("systemPlaqueType").value;
  if (selectedType === "LONGEVITY") {
    loadSystemPlaques("blessing");
    return;
  }
  if (selectedType === "REBIRTH" || selectedType === "DELIVERANCE") {
    loadSystemPlaques("deliverance");
    return;
  }
  loadSystemPlaques(currentDataGroup());
}

async function loadSystemPlaques(group) {
  const previousMode = state.mode;

  try {
    setDataSourceStatus("系统牌位数据");
    setBusy(`正在读取${dataGroupLoadLabel(group)}数据...`);
    const selectedType = $("systemPlaqueType").value;
    const subtype = $("systemPlaqueSubtype").value;
    const allowedTypes = isBlessingGroup(group) ? ["LONGEVITY"] : ["REBIRTH", "DELIVERANCE"];
    const plaqueTypes = selectedType && allowedTypes.includes(selectedType) ? [selectedType] : allowedTypes;
    const status = $("systemStatus").value;
    const keyword = $("systemKeyword").value.trim();
    const ritualId = $("systemRitual").value;
    let batches;
    if (isDesktopRuntime()) {
      const localPlaques = await listDesktopRows("plaques");
      batches = plaqueTypes.map((plaqueType) => localPlaques.filter((plaque) => {
        if (plaque.plaqueType !== plaqueType) return false;
        if (status && plaque.status !== status) return false;
        if (ritualId && plaque.ritualId !== ritualId) return false;
        if (!keyword) return true;
        return [
          plaque.holderName,
          plaque.deceasedName,
          plaque.deceasedName2,
          plaque.yangShang,
          plaque.phone,
          plaque.address,
          plaque.dedicationType,
          plaque.customDedicationType,
        ].some((value) => String(value || "").includes(keyword));
      }));
    } else {
      const PAGE_SIZE = 200;
      async function fetchAllPlaques(extraParams) {
        const baseParams = {
          pageSize: String(PAGE_SIZE),
          ...(status ? { status } : {}),
          ...(keyword ? { keyword } : {}),
          ...(ritualId ? { ritualId } : {}),
          ...extraParams,
        };
        const firstUrl = `/api/plaques?${new URLSearchParams({ ...baseParams, page: "1" }).toString()}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        let firstResp;
        try {
          firstResp = await fetch(firstUrl, { cache: "no-store", credentials: "include", headers: authHeaders(), signal: controller.signal });
        } finally {
          clearTimeout(timer);
        }
        const firstJson = await firstResp.json();
        if (!firstResp.ok || firstJson.success === false) throw new Error(firstJson.error || `请求失败：${firstResp.status}`);
        const all = firstJson.data || [];
        const total = firstJson.total || all.length;
        if (total > PAGE_SIZE) {
          const totalPages = Math.ceil(total / PAGE_SIZE);
          const remaining = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              fetchJson(`/api/plaques?${new URLSearchParams({ ...baseParams, page: String(i + 2) }).toString()}`, { headers: authHeaders(), timeout: 10000 })
            )
          );
          all.push(...remaining.flat());
        }
        return all;
      }
      batches = await Promise.all(plaqueTypes.map((plaqueType) => fetchAllPlaques({ plaqueType })));
    }
    const rows = batches
      .map(normalizeListResponse)
      .flat()
      .filter(matchesSystemFilters)
      .filter((plaque) => matchesPlaqueSubtype(plaque, subtype))
      .map(plaqueToRow)
      .map((row, index) => normalizeRow(row, group, index));
    state.datasets[group] = rows;
    state.selectedRowIds[group].clear();
    state.pageIndex = 0;
    state.singleVariantManualOverride = false;
    buildFieldMapping();
    buildStyleEditor();
    renderTable();
    updateDataHint();
    applySummaryDefault(true);
    render();
    setBusy(`已读取${rows.length}条${dataGroupLoadLabel(group)}数据`);
  } catch (error) {
    console.error("读取系统数据失败:", error);
    alert(error.message || "读取系统数据失败");
    setBusy("读取系统数据失败");
  }
}

async function applyLaunchParams() {
  const params = launchParams;
  const plaqueId = params.get("plaqueId");
  const plaqueIds = (params.get("plaqueIds") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const type = params.get("type");
  const templateId = params.get("templateId");
  const launchMode = params.get("mode");
  const autoPrint = params.get("autoPrint") === "1";
  const printPreviewMode = launchPrintPreviewMode;
  if (!plaqueId && !plaqueIds.length && !type && !templateId) return;

  if (printPreviewMode) {
    document.documentElement.classList.add("print-preview-mode");
    document.body.classList.add("print-preview-mode");
  }

  const templateApplied = await applyLaunchTemplate(templateId);
  if (templateId && !templateApplied) {
    setTemplateStatus("未找到指定模板", "将使用默认模板，请手动切换");
  }
  const group = templateApplied ? currentDataGroup() : dataGroupForPlaqueType(type);
  const targetMode = launchMode === "summary" ? "summary" : "single";
  if (state.mode !== targetMode) setMode(targetMode);
  setDataSourceStatus("牌位管理选中数据");

  try {
    setBusy("正在载入牌位数据...");
    const selectedIds = new Set([plaqueId, ...plaqueIds].filter(Boolean));
    let plaques;
    if (isDesktopRuntime()) {
      const systemStatusEl = $("systemStatus");
      const statusValue = systemStatusEl ? (systemStatusEl.value || "ACTIVE") : "ACTIVE";
      plaques = (await listDesktopRows("plaques")).filter((plaque) => {
        if (selectedIds.size) return selectedIds.has(plaque.id);
        if (type && plaque.plaqueType !== type) return false;
        return !statusValue || plaque.status === statusValue;
      });
    } else {
      const systemStatusEl = $("systemStatus");
      const statusValue = systemStatusEl ? (systemStatusEl.value || "ACTIVE") : "ACTIVE";
      var queryParams = {};
      if (selectedIds.size) {
        queryParams = { ids: Array.from(selectedIds).join(",") };
      } else {
        if (type) queryParams.plaqueType = type;
        if (statusValue) queryParams.status = statusValue;
        queryParams.pageSize = "200";
      }
      var query = new URLSearchParams(queryParams);
      plaques = await fetchJson(`/api/plaques?${query.toString()}`, { headers: authHeaders(), timeout: 10000 });
    }
    const rows = plaques
      .map(plaqueToRow)
      .map((row, index) => normalizeRow(row, group, index));
    state.datasets[group] = rows;
    state.selectedRowIds[group].clear();
    selectedIds.forEach((id) => state.selectedRowIds[group].add(id));
    state.pageIndex = Math.max(0, rows.findIndex((row) => selectedIds.has(row.__rowId)));
    state.singleVariantManualOverride = false;
    buildFieldMapping();
    buildStyleEditor();
    renderTable();
    updateDataHint();
    applySummaryDefault(true);
    render();
    setBusy(selectedIds.size ? `已载入${rows.length}条选中牌位` : `已载入${rows.length}条数据`);
    if (printPreviewMode) {
      setBusy(selectedIds.size ? `打印预览：${rows.length}个牌位` : `打印预览：${rows.length}条数据`);
    }
    if (autoPrint && rows.length) {
      setTimeout(() => printAll(), 300);
    }
  } catch (error) {
    console.error("载入入口数据失败:", error);
    setBusy("载入入口数据失败");
    if ($("preview")) {
      $("preview").innerHTML = `<div class="empty" style="padding:40px;text-align:center;color:var(--muted);">
        <p style="font-size:16px;margin-bottom:8px;">数据加载失败</p>
        <p style="font-size:13px;">${escapeHtml(error.message || "无法读取牌位数据，请检查网络或重新登录")}</p>
        <p style="font-size:12px;margin-top:12px;">请关闭此页面后重试，或直接在打印工具中手动导入数据。</p>
      </div>`;
    }
  }
}

function buildManualInputFields() {
  const container = $("manualInputFields");
  if (!container) return;
  const type = currentTabletType();
  const fields = (type && type.fields) || [];
  const existingValues = {};
  container.querySelectorAll(".manual-field-input").forEach(function (el) {
    if (el.dataset.fieldKey) existingValues[el.dataset.fieldKey] = el.value;
  });
  container.innerHTML = fields.map(function (field) {
    const label = field.label || field.key;
    const savedValue = existingValues[field.key] || "";
    return '<label style="display:block; margin-bottom:4px;">' +
      '<span style="font-size:12px; color:var(--tea);">' + escapeHtml(label) + '</span>' +
      '<input class="manual-field-input" data-field-key="' + escapeHtml(field.key) + '" type="text" placeholder="' + escapeHtml(label) + '" value="' + escapeHtml(savedValue) + '" style="width:100%; box-sizing:border-box; margin-top:2px;">' +
      '</label>';
  }).join("") || '<p class="hint">请先选择模板</p>';
}

function applyManualInput() {
  const inputs = document.querySelectorAll(".manual-field-input");
  if (!inputs.length) { alert("请先选择模板"); return; }
  const row = {};
  inputs.forEach((input) => {
    const key = input.dataset.fieldKey;
    const value = input.value.trim();
    if (value) row[key] = value;
  });
  if (!Object.values(row).some((v) => v)) { alert("请至少填写一个字段"); return; }
  const group = currentDataGroup();
  const normalized = normalizeRow(row, group, 0);
  state.datasets[group] = [normalized];
  state.selectedRowIds[group] = new Set([normalized.__rowId]);
  state.pageIndex = 0;
  state.singleVariantManualOverride = false;
  buildFieldMapping();
  buildStyleEditor();
  renderTable();
  updateDataHint();
  render();
  setBusy(`手动输入：${Object.values(row).filter(Boolean).join(" / ")}`);
}

async function applyLaunchTemplate(templateId) {
  if (!templateId) { console.warn("applyLaunchTemplate: 未提供 templateId"); return false; }
  const select = $("templateSelect");

  function findMatchingOption() {
    return Array.from(select.options).find((opt) => {
      if (opt.value === templateId) return true;
      return state.remoteTemplateIds[opt.value] === templateId;
    });
  }

  var matchingOption = findMatchingOption();

  if (!matchingOption) {
    var directMatch = templates.find(function (t) { return t.id === templateId; });
    if (directMatch) {
      console.warn("模板在列表中但不在下拉选项中，重新构建选项:", templateId);
      rebuildTemplateOptions(templateId);
      select.value = templateId;
      applyTemplate();
      return true;
    }
    console.warn("模板未在本地缓存中，尝试从服务器获取:", templateId);
    try {
      var result = await fetchJson(
        "/api/plaque-templates/" + templateId,
        authFetchOptions({ headers: authHeaders(), timeout: 8000 })
      );
      var data = result;
      if (data && data.elements) {
        importServerTemplate(data);
        rebuildTemplateOptions();
        matchingOption = findMatchingOption();
      }
    } catch (err) {
      console.warn("从服务器获取模板失败:", templateId, err);
    }
  }

  if (!matchingOption) {
    console.warn("未找到指定打印模板，将为所有牌位使用默认模板:", templateId);
    return false;
  }
  select.value = matchingOption.value;
  applyTemplate();
  console.log("已应用启动模板:", matchingOption.value, matchingOption.textContent);
  return true;
}

async function refreshDesignerBackground() {
	var template = currentTemplate();
	var remoteId = state.remoteTemplateIds[template.id];
	if (!remoteId) return;
	try {
		var data = await fetchJson(
			"/api/plaque-templates/" + remoteId,
			authFetchOptions({ headers: authHeaders(), timeout: 8000 })
		);
		
		if (!data) return;
		var fullBg = data.backgroundImage
			|| (data.elements && data.elements.layout && data.elements.layout.background)
			|| (data.elements && data.elements.template && data.elements.template.backgroundImage)
			|| "";
		if (fullBg) {
			var layout = ensureLayout(template.id);
			layout.background = fullBg;
			render();
		}
	} catch (e) {
		console.warn("获取高清底图失败:", e);
	}
}

async function loadRitualOptions() {
  if (isDesktopRuntime()) {
    try {
      const rituals = await listDesktopRows("rituals");
      const select = $("systemRitual");
      rituals.forEach((ritual) => {
        const option = document.createElement("option");
        option.value = ritual.id;
        option.textContent = ritual.name || ritual.title || ritual.id;
        select.appendChild(option);
      });
    } catch (error) {
      console.warn("加载本地法会列表失败:", error);
    }
    return;
  }

  try {
    const rituals = await fetchJson("/api/rituals", { headers: authHeaders(), timeout: 8000 });
    const select = $("systemRitual");
    rituals.forEach((ritual) => {
      const option = document.createElement("option");
      option.value = ritual.id;
      option.textContent = ritual.name || ritual.title || ritual.id;
      select.appendChild(option);
    });
  } catch (error) {
    console.warn("加载法会列表失败:", error);
  }
}

async function loadDedicationTypeOptions() {
  try {
    let settings = {};
    if (isDesktopRuntime()) {
      settings = await window.templeDesktop?.getCache?.("GET:/api/system/settings").then((cached) => cached?.value || {}).catch(() => ({}));
    } else {
      settings = await fetchJson("/api/system/settings", { timeout: 8000 });
    }
    const types = String(settings?.dedicationTypes || "")
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean);
    const select = $("systemPlaqueSubtype");
    const existing = new Set(Array.from(select.options).map((option) => option.value));
    if (!types.length) return;
    const group = document.createElement("optgroup");
    group.label = "超度牌位主体预设";
    types.forEach((type) => {
      if (existing.has(type)) return;
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      group.appendChild(option);
    });
    if (group.children.length) select.appendChild(group);
  } catch (error) {
    console.warn("加载超度牌位主体预设失败:", error);
  }
}

function matchesSystemFilters(plaque) {
  const size = $("systemSize").value;
  if (size && plaque.size !== size) return false;

  const startDate = $("systemStartDate").value;
  const endDate = $("systemEndDate").value;
  if (!startDate && !endDate) return true;

  const plaqueStart = plaque.startDate ? String(plaque.startDate).slice(0, 10) : "";
  const plaqueEnd = plaque.endDate ? String(plaque.endDate).slice(0, 10) : "";
  const comparable = plaqueStart || plaqueEnd;
  if (!comparable) return false;
  if (startDate && comparable < startDate) return false;
  if (endDate && comparable > endDate) return false;
  return true;
}

function matchesPlaqueSubtype(plaque, subtype) {
  if (!subtype) return true;
  return plaque.longevitySubtype === subtype || plaque.dedicationType === subtype;
}

function normalizeRow(row, group, index) {
  const rowId = row.__rowId || row.id || `${group}_${Date.now()}_${index}`;
  const normalized = { ...row, __rowId: String(rowId) };
  normalized.__summaryVariant = detectSummaryVariantForGroup(normalized, group);
  normalized.__variant = detectSingleVariantForGroup(normalized, group);
  normalized.__singleVariant = normalized.__variant;
  return normalized;
}

function summaryVariantPresetsFor(group) {
  if (!group) group = currentDataGroup();
  return summaryVariantPresets[group] || summaryVariantPresets.deliverance;
}

function currentSummaryVariantKey() {
  return $("summaryVariant")?.value || summaryVariantPresetsFor()[0]?.key || "";
}

function isSummaryFieldKey(key) {
  return typeof key === "string" && key.startsWith("summary_");
}

function summaryVariantStorageKey(key, variantKey = currentSummaryVariantKey()) {
  if (!isSummaryFieldKey(key) || !variantKey) return key;
  return `summary_variant_${variantKey}__${key}`;
}

function isSingleVariantFieldKey(key) {
  return state.mode === "single" && !isBackSideActive() && typeof key === "string";
}

function shouldScopeSingleVariantField(key) {
  return state.mode === "single"
    && !isBackSideActive()
    && typeof key === "string"
    && Boolean(key);
}

function normalizeSingleVariantKey(key) {
  return legacySingleVariantKeyMap[key] || key || defaultSingleVariantKeyForGroup();
}

function currentSingleVariantBaseKey(row = null, forPrint = false) {
  if (state.mode !== "single") return "";
  const detectedKey = normalizeSingleVariantKey(row?.__variant || "");
  if ((forPrint || !state.isDesignerPage) && detectedKey) {
    return detectedKey;
  }
  return normalizeSingleVariantKey(state.singleVariantKey || $("singleVariant")?.value || singleVariantPresetsForCurrentType()[0].key);
}

function currentSingleVariantKey(row = null, forPrint = false) {
  if (state.mode !== "single") return "";
  return currentSingleVariantBaseKey(row, forPrint);
}

function singleFieldsForVariant(variantKey = currentSingleVariantKey(), row = null, forPrint = false) {
  return singleBaseFieldsForVariant(variantKey, row, forPrint).concat(dynamicFieldsForCurrentContext(variantKey));
}

function singleBaseFieldsForVariant(variantKey = currentSingleVariantKey(), row = null, forPrint = false) {
  const fields = currentTabletType().fields;
  if (state.mode !== "single") return fields;
  const type = currentDataGroup();
  const key = normalizeSingleVariantKey(forPrint && row ? currentSingleVariantKey(row, true) : variantKey);
  const fieldKeys = singleVariantFieldKeysByType[type]?.[key]
    || singleVariantFieldKeysByType[type]?.layout_one
    || [];
  const map = new Map(fields.map((field) => [field.key, field]));
  return fieldKeys.map((fieldKey) => map.get(fieldKey)).filter(Boolean);
}

function detectSingleVariantForGroup(row, group = currentDataGroup()) {
  if (group === "blessing") {
    const believer = firstRowValue(row, ["信人", "阳上", "阳上人", "believer", "yangshang", "yangShang"]);
    return believer ? "layout_one" : "layout_two";
  }

  const deceasedPrimary = firstRowValue(row, ["亡者", "第一亡者", "亡者姓名", "deceasedPrimary"]);
  const deceasedSecondary = firstRowValue(row, ["亡者二", "第二亡者", "附名亡者", "deceasedSecondary"]);
  const deceasedInfo = firstRowValue(row, ["亡者信息", "deceasedInfo"]);
  const normalizedLines = deceasedInfo
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const deceasedCount = deceasedSecondary
    ? 2
    : deceasedPrimary
      ? 1
      : (normalizedLines.length >= 2 ? 2 : normalizedLines.length >= 1 ? 1 : 0);
  if (deceasedCount >= 2) return "layout_three";
  if (deceasedCount >= 1) return "layout_two";
  return "layout_one";
}

function dynamicFieldsForCurrentContext(variantKey = currentContextVariantKey()) {
  const layout = currentEditableLayout();
  const fields = layout?.dynamicFields || [];
  return fields.filter((field) => staticFieldVisibleInVariant(field, variantKey));
}
