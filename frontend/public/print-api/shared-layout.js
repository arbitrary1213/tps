
function migrateLegacyVariantVisibility(visibility) {
  const migrated = { ...visibility };
  if (Object.prototype.hasOwnProperty.call(migrated, "blessing_bodhisattva")) {
    migrated.layout_one = migrated.blessing_bodhisattva;
    delete migrated.blessing_bodhisattva;
  }
  if (Object.prototype.hasOwnProperty.call(migrated, "blessing_person")) {
    migrated.layout_two = migrated.blessing_person;
    delete migrated.blessing_person;
  }
  return migrated;
}

async function persistTemplateMutation(options = {}) {
  const {
    syncTemplate = false,
    localMessage = "",
    syncingMessage = "",
    successMessage = "",
    failureMessage = "",
  } = options;
  const layoutKey = currentLayoutKey();
  saveLayouts();
  if (layoutKey.startsWith("custom_")) saveCustomTemplatesToStorage();

  const shouldSync = syncTemplate && canSyncServerTemplates();
  if (!shouldSync) {
    markTemplateSavedLocally();
    if (localMessage) $("statusText").textContent = localMessage;
    return;
  }

  markTemplateSyncing();
  if (syncingMessage) $("statusText").textContent = syncingMessage;
  try {
    await syncCurrentTemplateToServer();
    if (successMessage) $("statusText").textContent = successMessage;
  } catch (error) {
    console.error("同步模板失败", error);
    if (failureMessage) $("statusText").textContent = failureMessage;
  }
}

function loadRemoteTemplateIds() {
  try {
    return JSON.parse(safeStorageGet("tabletPrintRemoteIds") || "{}");
  } catch {
    return {};
  }
}

function saveRemoteTemplateIds() {
  safeStorageSet("tabletPrintRemoteIds", JSON.stringify(state.remoteTemplateIds));
}

function authToken() {
  return safeStorageGet("token") || "";
}

function authHeaders() {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function canSyncServerTemplates() {
  return !isDesktopRuntime() || Boolean(authToken());
}

function authFetchOptions(options = {}) {
  return {
    credentials: "include",
    ...options,
  };
}

function isDesktopRuntime() {
  return Boolean(window.templeDesktop);
}

async function listDesktopRows(entityType) {
  if (!isDesktopRuntime() || !window.templeDesktop?.listLocalRows) return [];
  const rows = await window.templeDesktop.listLocalRows(entityType);
  return Array.isArray(rows) ? rows : [];
}

async function upsertDesktopRows(entityType, rows) {
  if (!isDesktopRuntime() || !window.templeDesktop?.upsertLocalRows) return { count: 0 };
  return window.templeDesktop.upsertLocalRows(entityType, rows);
}

async function fetchJson(url, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const timeout = options.timeout || 0;
  const controller = timeout ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : undefined;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      credentials: "include",
      ...options,
      headers,
      ...(controller ? { signal: controller.signal } : {}),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.success === false) {
      throw new Error(json.error || `请求失败：${response.status}`);
    }
    return json.data ?? json;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function normalizeListResponse(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function setBusy(message) {
  $("statusText").textContent = message;
}

function setWorkflowStatus() {
  if ($("dataSourceValue")) $("dataSourceValue").textContent = workflowStatus.dataSource;
  if ($("templateSourceValue")) $("templateSourceValue").textContent = workflowStatus.templateSource;
}

function setLaunchSourceStatus(value) {
  workflowStatus.launchSource = value;
  setWorkflowStatus();
}

function setDataSourceStatus(value) {
  workflowStatus.dataSource = value;
  setWorkflowStatus();
}

function setTemplateStatus(source, sync) {
  workflowStatus.templateSource = source;
  workflowStatus.templateSync = sync;
  setWorkflowStatus();
}

function setStorageModelStatus(value) {
  workflowStatus.storageModel = value;
  setWorkflowStatus();
}

function markTemplateSavedLocally() {
  setTemplateStatus(isDesktopRuntime() ? "桌面本地模板" : "浏览器本地配置", "仅本机已保存");
}

function markTemplateSyncing() {
  setTemplateStatus(isDesktopRuntime() ? "桌面本地模板" : "服务器模板", "正在同步");
}

function markTemplateSynced() {
  setTemplateStatus(isDesktopRuntime() ? "本地已同步模板" : "服务器模板", isDesktopRuntime() ? "本地数据库已保存" : "服务器已保存");
}

function markTemplateSyncFailed() {
  setTemplateStatus(isDesktopRuntime() ? "桌面本地模板" : "浏览器本地配置", isDesktopRuntime() ? "本地数据库同步失败" : "服务器同步失败");
}

function renderDebugInfo() {
}

async function loadServerTemplates() {
  if (isDesktopRuntime()) {
    try {
      const localTemplates = dedupeTemplateRecords(await listDesktopRows("plaque_template"));
      localTemplates
        .filter((template) => template?.elements?.source === "tablet-print")
        .forEach(importServerTemplate);

      if (authToken()) {
        try {
          const serverTemplates = dedupeTemplateRecords(
            await fetchJson("/api/plaque-templates?pageSize=200", authFetchOptions({ headers: authHeaders(), allowDesktopApi: true, timeout: 8000 }))
          );
          const localMap = new Map(localTemplates.map((lt) => [templateRecordLogicalId(lt), lt]));
          for (const st of serverTemplates) {
            if (st?.elements?.source !== "tablet-print") continue;
            const logicalId = templateRecordLogicalId(st);
            const existingLocal = localMap.get(logicalId);
            if (!existingLocal || (st.updatedAt && (!existingLocal.updatedAt || st.updatedAt > existingLocal.updatedAt))) {
              await upsertDesktopRows("plaque_template", [{
                id: st.id,
                name: st.name,
                type: st.type,
                backgroundImage: st.backgroundImage || "",
                elements: st.elements,
                updatedAt: st.updatedAt || new Date().toISOString(),
              }]);
            }
            importServerTemplate(st);
          }
        } catch (serverError) {
          console.warn("拉取服务器模板失败，使用本地模板:", serverError);
        }
      }

      if (pruneObsoleteSingleTemplates()) {
        saveRemoteTemplateIds();
      }
      dedupeTemplatesByNameAndGroup();
      saveLayouts();
      saveCustomTemplatesToStorage();
      setTemplateStatus(localTemplates.length ? "本地已同步模板" : "内置模板", localTemplates.length ? "本地已同步" : "未发现本地模板");
      if (!state.isDesignerPage && $("templateSelect")?.options?.length) applyTemplate();
    } catch (error) {
      setTemplateStatus("内置模板", "本地模板读取失败");
      console.warn("加载本地模板失败，继续使用内置模板:", error);
    }
    return;
  }

  try {
    const serverTemplates = dedupeTemplateRecords(await fetchJson("/api/plaque-templates?pageSize=200", authFetchOptions({ headers: authHeaders(), timeout: 8000 })));
    serverTemplates
      .filter((template) => template?.elements?.source === "tablet-print")
      .forEach(importServerTemplate);
    if (pruneObsoleteSingleTemplates()) {
      saveRemoteTemplateIds();
    }
    dedupeTemplatesByNameAndGroup();
    saveLayouts();
    saveCustomTemplatesToStorage();
    setTemplateStatus(serverTemplates.length ? "服务器模板" : "内置模板", serverTemplates.length ? "服务器已同步" : "服务器无模板");
    if (!state.isDesignerPage && $("templateSelect")?.options?.length) applyTemplate();
  } catch (error) {
    setTemplateStatus("本地/内置模板", "服务器模板读取失败");
    console.warn("加载服务器模板失败，继续使用本地模板:", error);
  }
}

function templateRecordLogicalId(record) {
  return String(record?.elements?.template?.id || record?.template?.id || record?.id || "").trim();
}

function templateRecordTimestamp(record) {
  return Date.parse(
    record?.elements?.layout?.updatedAt
    || record?.updatedAt
    || record?.elements?.updatedAt
    || record?.createdAt
    || ""
  ) || 0;
}

function dedupeTemplateRecords(records) {
  if (!Array.isArray(records)) return [];
  const latestByTemplateId = new Map();
  records.forEach((record) => {
    const logicalId = templateRecordLogicalId(record);
    if (!logicalId) return;
    const previous = latestByTemplateId.get(logicalId);
    if (!previous || templateRecordTimestamp(record) >= templateRecordTimestamp(previous)) {
      latestByTemplateId.set(logicalId, record);
    }
  });
  return Array.from(latestByTemplateId.values());
}

function migrateLocalTemplateId(oldId, newId) {
  if (oldId === newId) return;
  const idx = templates.findIndex((item) => item.id === oldId);
  if (idx >= 0) templates[idx] = { ...templates[idx], id: newId };
  if (state.layouts[oldId]) {
    state.layouts[newId] = state.layouts[oldId];
    delete state.layouts[oldId];
  }
  if (templateDefaults[oldId]) {
    templateDefaults[newId] = templateDefaults[oldId];
    delete templateDefaults[oldId];
  }
  if (state.remoteTemplateIds[oldId]) {
    state.remoteTemplateIds[newId] = state.remoteTemplateIds[oldId];
    delete state.remoteTemplateIds[oldId];
  }
  if (TEMPLATE_CATALOG[oldId]) {
    TEMPLATE_CATALOG[newId] = TEMPLATE_CATALOG[oldId];
    delete TEMPLATE_CATALOG[oldId];
  }
  if ($("templateSelect")?.value === oldId) $("templateSelect").value = newId;
  saveLayouts();
  saveRemoteTemplateIds();
}

function importServerTemplate(template) {
  const selectedId = $("templateSelect")?.value || "";
  const data = template.elements;
  if (!data?.template?.id) return;
  if (HIDDEN_LEGACY_TEMPLATE_IDS.has(data.template.id)) return;
  const localTemplate = {
    ...data.template,
    id: data.template.id,
    tabletType: normalizeImportedTabletType(data.template.tabletType),
    name: data.template.name || template.name || templateDisplayName(data.template),
  };
  const normalizedTemplate = normalizeCatalogTemplate(localTemplate);

  // Match by direct ID, then fall back to remoteTemplateIds mapping, then by name + dataGroup
  let index = templates.findIndex((item) => item.id === localTemplate.id);
  if (index < 0) {
    const mappedLocalId = Object.keys(state.remoteTemplateIds).find(
      (localId) => state.remoteTemplateIds[localId] === template.id
    );
    if (mappedLocalId) {
      migrateLocalTemplateId(mappedLocalId, localTemplate.id);
      index = templates.findIndex((item) => item.id === localTemplate.id);
    }
  }
  if (index < 0) {
    index = templates.findIndex((item) =>
      item.name === localTemplate.name && item.dataGroup === localTemplate.dataGroup
    );
    if (index >= 0) {
      migrateLocalTemplateId(templates[index].id, localTemplate.id);
    }
  }

  if (index >= 0) {
    templates[index] = { ...templates[index], ...normalizedTemplate };
  } else {
    templates.push(normalizedTemplate);
  }
  rebuildTemplateOptions(selectedId || localTemplate.id);
  if (data.defaults) templateDefaults[localTemplate.id] = data.defaults;
  if (data.layout) {
    const existingLayout = state.layouts[localTemplate.id];
    const existingRemoteId = state.remoteTemplateIds[localTemplate.id];
    const normalizedLayout = {
      ...data.layout,
      background: data.layout.background || data.template?.backgroundImage || template.backgroundImage || "",
    };
    if (!existingLayout || !existingRemoteId || existingRemoteId === template.id) {
      state.layouts[localTemplate.id] = normalizedLayout;
    } else {
      state.layouts[localTemplate.id] = {
        ...normalizedLayout,
        ...existingLayout,
        paper: normalizedLayout.paper || existingLayout.paper,
        positions: existingLayout.positions || data.layout.positions || {},
        styles: existingLayout.styles || data.layout.styles || {},
        sizes: existingLayout.sizes || data.layout.sizes || {},
        mappings: existingLayout.mappings || data.layout.mappings || {},
        staticFields: existingLayout.staticFields || data.layout.staticFields || [],
        summaryFieldToggles: existingLayout.summaryFieldToggles || data.layout.summaryFieldToggles || {},
        summary: existingLayout.summary || data.layout.summary,
        singleVariantKey: normalizeSingleVariantKey(existingLayout.singleVariantKey || data.layout.singleVariantKey || defaultSingleVariantKeyForTemplate(localTemplate)),
        background: existingLayout.background || normalizedLayout.background || "",
      };
    }
  }
  state.remoteTemplateIds[localTemplate.id] = template.id;
}

function exportCurrentTemplatePayload() {
  const template = currentTemplate();
  const layoutKey = currentLayoutKey();
  const layout = ensureLayout(layoutKey);
  const defaults = templateDefaults[layoutKey] || { positions: {}, styles: {}, sizes: {} };
  return {
    source: "tablet-print",
    version: 1,
    template: {
      id: layoutKey,
      name: template.name,
      category: template.category || "",
      mode: template.mode || state.mode,
      dataGroup: template.dataGroup || currentDataGroup(),
      width: Number($("paperWidth").value) || template.width,
      height: Number($("paperHeight").value) || template.height,
      font: template.font,
      vertical: state.mode === "summary" ? false : ($("singleVertical")?.checked ?? (ensureLayout(currentLayoutKey()).paper?.vertical ?? currentTemplate().vertical ?? true)),
      tabletType: state.mode === "summary"
        ? undefined
        : normalizeTabletType(template?.tabletType || template?.dataGroup || "blessing"),
      backgroundImage: layout.background || "",
    },
    defaults,
    layout: {
      ...layout,
      singleVariantKey: state.mode === "single"
        ? normalizeSingleVariantKey(layout.singleVariantKey || state.singleVariantKey || $("singleVariant")?.value || defaultSingleVariantKeyForTemplate(template))
        : layout.singleVariantKey,
    },
  };
}

async function syncCurrentTemplateToServer(skipRemoteSync = false) {
  const payload = exportCurrentTemplatePayload();
  const mappedRemoteId = state.remoteTemplateIds[payload.template.id];
  let remoteId = mappedRemoteId || "";
  const body = {
    name: payload.template.name,
    type: payload.template.dataGroup === "blessing" ? "LONGEVITY" : "DELIVERANCE",
    backgroundImage: payload.template.backgroundImage || payload.layout?.background || "",
    paperWidth: payload.template.width,
    paperHeight: payload.template.height,
    elements: payload,
  };

  if (isDesktopRuntime()) {
    if (authToken() && !skipRemoteSync) {
      if (remoteId) {
        await fetchJson(`/api/plaque-templates/${remoteId}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(body),
          allowDesktopApi: true,
          timeout: 10000,
        });
      } else {
        const response = await fetchJson("/api/plaque-templates", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(body),
          allowDesktopApi: true,
          timeout: 10000,
        });
        const created = response.data || response;
        if (created?.id) {
          remoteId = created.id;
          migrateLocalTemplateId(payload.template.id, created.id);
          state.remoteTemplateIds[created.id] = created.id;
          saveRemoteTemplateIds();
        }
      }
    }

    const localId = remoteId || payload.template.id;
    await upsertDesktopRows("plaque_template", [{
      id: localId,
      name: body.name,
      type: body.type,
      backgroundImage: body.backgroundImage,
      elements: payload,
      updatedAt: new Date().toISOString(),
    }]);
    return;
  }

  if (remoteId) {
    await fetchJson(`/api/plaque-templates/${remoteId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
      timeout: 10000,
    });
  } else {
    const response = await fetchJson("/api/plaque-templates", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      timeout: 10000,
    });
    const created = response.data || response;
    if (created?.id) {
      migrateLocalTemplateId(payload.template.id, created.id);
      state.remoteTemplateIds[created.id] = created.id;
      saveRemoteTemplateIds();
    }
  }
}

function migrateStoredLayouts() {
  let changed = false;

  ensureBuiltinSingleTemplates();

  HIDDEN_LEGACY_TEMPLATE_IDS.forEach((id) => {
    if (state.layouts[id]) {
      delete state.layouts[id];
      changed = true;
    }
    if (state.remoteTemplateIds[id]) {
      delete state.remoteTemplateIds[id];
      changed = true;
    }
  });

  if (state.layouts.summary && !state.layouts.a4summary) {
    state.layouts.a4summary = {
      ...state.layouts.summary,
      paper: state.layouts.summary.paper || summaryTemplatePaper(defaultSummaryTemplateId()),
      summary: normalizeSummarySettings(state.layouts.summary.summary),
    };
    delete state.layouts.summary;
    changed = true;
  }

  summaryTemplateIds().forEach((id) => {
    const layout = ensureLayout(id);
    if (!layout.paper) {
      layout.paper = summaryTemplatePaper(id);
      changed = true;
    }
    if (!layout.summary) {
      layout.summary = normalizeSummarySettings();
      changed = true;
    } else {
      const normalized = normalizeSummarySettings(layout.summary);
      if (JSON.stringify(normalized) !== JSON.stringify(layout.summary)) {
        layout.summary = normalized;
        changed = true;
      }
    }
    if (repairSummaryTemplateLayout(id)) changed = true;
  });

  if (pruneObsoleteSingleTemplates()) changed = true;

  if (changed) saveLayouts();
}

function normalizeSummarySettings(settings = {}) {
  return {
    dataGroup: settings.dataGroup || "deliverance",
    format: typeof settings.format === "string" ? settings.format : $("summaryFormat")?.value || "{{牌位主体}}\n{{阳上}}\n{{地址}}",
    columnCount: Number(settings.columnCount) || 3,
    rowsPerColumn: Number(settings.rowsPerColumn) || 18,
    fontSize: Number(settings.fontSize) || 22,
    lineGap: Number(settings.lineGap) || 8,
    pageMargin: Number(settings.pageMargin) || 14,
    columnGap: Number(settings.columnGap) || 8,
    vertical: Boolean(settings.vertical),
  };
}

function createSummaryLayoutDefaults(templateId) {
  return {
    positions: {},
    styles: {},
    sizes: {},
    background: "",
    mappings: {},
    staticFields: [],
    duplex: { enabled: false },
    backSide: createBlankSideLayout(),
    paper: summaryTemplatePaper(templateId),
    summary: normalizeSummarySettings(),
  };
}

function ensureLayout(type) {
  if (!state.layouts[type]) {
    state.layouts[type] = isSummaryTemplateId(type)
      ? createSummaryLayoutDefaults(type)
      : {
        positions: clone(templateDefaults[type]?.positions || {}),
        styles: clone(templateDefaults[type]?.styles || {}),
        sizes: clone(templateDefaults[type]?.sizes || {}),
        background: "",
        mappings: {},
      dynamicFields: [],
      singleVariantKey: defaultSingleVariantKeyForTemplate(templates.find((item) => item.id === type)),
      duplex: { enabled: false },
      backSide: createBlankSideLayout(),
    };
  }
  if (!state.layouts[type].positions) state.layouts[type].positions = {};
  if (!state.layouts[type].styles) state.layouts[type].styles = clone(templateDefaults[type]?.styles || {});
  if (!state.layouts[type].sizes) state.layouts[type].sizes = clone(templateDefaults[type]?.sizes || {});
  if (!state.layouts[type].mappings) state.layouts[type].mappings = {};
  if (!state.layouts[type].staticFields) state.layouts[type].staticFields = [];
  if (!state.layouts[type].dynamicFields) state.layouts[type].dynamicFields = [];
  if (!state.layouts[type].duplex) state.layouts[type].duplex = { enabled: false };
  if (!isSummaryTemplateId(type) && !state.layouts[type].singleVariantKey) {
    state.layouts[type].singleVariantKey = defaultSingleVariantKeyForTemplate(templates.find((item) => item.id === type));
  }
	if (isSummaryTemplateId(type)) {
		if (!state.layouts[type].paper) state.layouts[type].paper = summaryTemplatePaper(type);
		if (!state.layouts[type].summary) state.layouts[type].summary = normalizeSummarySettings();
	} else if (!state.layouts[type].paper) {
		const tpl = templates.find((item) => item.id === type);
		state.layouts[type].paper = {
			width: tpl?.width || 210,
			height: tpl?.height || 297,
			vertical: tpl?.vertical ?? true,
		};
	}
  if (state.layouts[type].backSide) normalizeSideLayout(state.layouts[type].backSide);
  if (isSummaryTemplateId(type) && repairSummaryTemplateLayout(type)) saveLayouts();
  return state.layouts[type];
}

function layoutSetValue(layout, bucket, key, value) {
  if (isEditingBackSide()) { layout[bucket][key] = value; return; }
  if (isSingleVariantFieldKey(key)) { setLayoutBucketValue(layout, bucket, key, value, currentSingleVariantKey()); return; }
  if (state.mode === "summary" && isSummaryFieldKey(key)) { setLayoutBucketValue(layout, bucket, key, value); return; }
  layout[bucket][key] = value;
}

function layoutValue(bucket, key, variantKey, backDefault, singleDefault, summaryFn) {
  if (isBackSideActive()) {
    const layout = backLayoutFor(currentLayoutKey());
    return layout[bucket][key] || (layout[bucket][key] = clone(backDefault));
  }
  const type = currentLayoutKey();
  const layout = ensureLayout(type);
  if (isSingleVariantFieldKey(key)) {
    const sv = state.renderSingleVariant || currentSingleVariantKey();
    const saved = getLayoutBucketValue(layout, bucket, key, sv);
    return saved || setLayoutBucketValue(layout, bucket, key, singleVariantDefaultValue(type, sv, bucket, key, singleDefault), sv);
  }
  const saved = getLayoutBucketValue(layout, bucket, key, variantKey);
  if (saved) return saved;
  const fallback = clone(
    state.mode === "summary" && isSummaryFieldKey(key)
      ? summaryFn(key, variantKey)
      : (templateDefaults[type]?.[bucket]?.[key] || singleDefault)
  );
  return (state.mode === "summary" && isSummaryFieldKey(key))
    ? setLayoutBucketValue(layout, bucket, key, fallback, variantKey)
    : (layout[bucket][key] = fallback);
}

const STYLE_DEFAULT = { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif", textAlign: "center", verticalAlign: "center", wrapMode: "anywhere" };

function positionFor(key, variantKey = currentSummaryVariantKey()) {
  return layoutValue("positions", key, variantKey, { x: 50, y: 50 }, { x: 50, y: 50 }, (k, vk) => summaryDefaultPosition(k, vk));
}

async function saveCurrentLayout() {
  const layoutKey = currentLayoutKey();
  const layout = ensureLayout(layoutKey);
  layout.updatedAt = new Date().toISOString();
  layout.paper = {
    width: Number($("paperWidth").value) || 210,
    height: Number($("paperHeight").value) || 297,
    vertical: $("singleVertical")?.checked ?? (ensureLayout(currentLayoutKey()).paper?.vertical ?? currentTemplate().vertical ?? true),
  };
  if (state.mode === "summary") {
    layout.summary = currentSummarySettings();
  } else {
    layout.singleVariantKey = normalizeSingleVariantKey(state.singleVariantKey || $("singleVariant")?.value || defaultSingleVariantKeyForTemplate(currentTemplate()));
  }
  layout.duplex = {
    ...(layout.duplex || {}),
    enabled: Boolean($("enableDuplex")?.checked),
  };
  if (layout.backSide) normalizeSideLayout(layout.backSide);
  layout.mappings = currentFieldMappings();
  state.layouts[layoutKey] = layout;
  saveLayouts();
  if (layoutKey.startsWith("custom_")) saveCustomTemplatesToStorage();
  const canSync = canSyncServerTemplates();
  if (canSync && isDesktopRuntime()) {
    if (!confirm("是否同步到服务器上？")) {
      markTemplateSavedLocally();
      $("statusText").textContent = "模板已保存到本机";
      try {
        await syncCurrentTemplateToServer(true);
        markTemplateSynced();
        state.layouts[layoutKey] = layout;
        saveLayouts();
        if (layoutKey.startsWith("custom_")) saveCustomTemplatesToStorage();
        $("statusText").textContent = "模板已保存到本地数据库";
      } catch (error) {
        markTemplateSyncFailed();
        console.error("保存本地模板失败", error);
        $("statusText").textContent = "保存失败";
      }
      return;
    }
  }
  if (canSync) {
    markTemplateSyncing();
  } else {
    markTemplateSavedLocally();
  }
  $("statusText").textContent = canSync ? "模板已保存，正在同步..." : "模板已保存到本机";
  if (!canSync) return;
  try {
    await syncCurrentTemplateToServer();
    markTemplateSynced();
    state.layouts[layoutKey] = layout;
    saveLayouts();
    if (layoutKey.startsWith("custom_")) saveCustomTemplatesToStorage();
    $("statusText").textContent = isDesktopRuntime() ? "模板已保存到本地数据库" : "模板已保存到服务器";
  } catch (error) {
    markTemplateSyncFailed();
    console.error("同步模板失败", error);
    $("statusText").textContent = isDesktopRuntime()
      ? "模板已保存到本机，但本地数据库同步失败"
      : "模板已保存到本机，但服务器同步失败";
  }
}

function resetCurrentLayout() {
  const type = currentLayoutKey();
  state.layouts[type] = {
    positions: clone(templateDefaults[type]?.positions || {}),
    styles: clone(templateDefaults[type]?.styles || {}),
    sizes: clone(templateDefaults[type]?.sizes || {}),
    background: "",
    mappings: {},
    singleVariantKey: defaultSingleVariantKeyForTemplate(templates.find((item) => item.id === type)),
    staticFields: [],
    dynamicFields: [],
    duplex: { enabled: false },
    backSide: createBlankSideLayout(),
  };
  const template = templates.find((item) => item.id === $("templateSelect").value) || templates[0];
  $("paperWidth").value = template.width;
  $("paperHeight").value = template.height;
  if ($("singleVertical")) $("singleVertical").checked = template.vertical;
  saveLayouts();
  $("bgInput").value = "";
  state.activeFieldKey = "";
  syncControlsFromSelectedTemplate();
  buildFieldMapping();
  buildStyleEditor();
  buildStaticVisibilityControls();
  render();
}

function styleFor(key, variantKey = currentSummaryVariantKey()) {
  return layoutValue("styles", key, variantKey, STYLE_DEFAULT, STYLE_DEFAULT,
    () => ({ fontSize: Number($("summaryFont").value) || 22, color: "#16110d", fontFamily: "SimSun, serif", textAlign: "left", verticalAlign: "center", wrapMode: "anywhere" }));
}

function sizeFor(key, variantKey = currentSummaryVariantKey()) {
  return layoutValue("sizes", key, variantKey, { w: 24, h: 12 }, { w: 20, h: 20 }, (k) => summaryDefaultSize(k));
}

function bindDragHandles() {
  document.querySelectorAll("[data-edit-key]").forEach((element) => {
    element.addEventListener("click", selectFieldFromCanvas);
    element.addEventListener("pointerdown", startDrag);
    element.addEventListener("contextmenu", handleFieldContextMenu);
    element.addEventListener("dblclick", handleFieldDoubleClick);
  });
  document.querySelectorAll("[data-drag-surface]").forEach((surface) => {
    surface.addEventListener("contextmenu", handleSurfaceContextMenu);
  });
  document.querySelectorAll("[data-resize-key]").forEach((handle) => {
    handle.addEventListener("pointerdown", startResize);
  });
}

function dynamicFieldDefinitionByKey(key, variantKey = currentContextVariantKey()) {
  const layout = currentEditableLayout();
  return (layout.dynamicFields || []).find((field) => field.key === key && staticFieldVisibleInVariant(field, variantKey)) || null;
}

function selectFieldFromCanvas(event) {
  const key = event.currentTarget?.dataset?.editKey || "";
  if (!key) return;
  state.activeFieldKey = key;
  if ($("styleField")) {
    $("styleField").value = key;
    syncStyleInputs();
  } else {
    syncSelectedFieldHighlight();
  }
  renderDebugInfo();
}

function currentSelectedFieldKey() {
  const highlightedFieldKey = document.querySelector(".editable-field.is-selected")?.dataset?.editKey || "";
  if (highlightedFieldKey) return highlightedFieldKey;
  const styleFieldValue = $("styleField")?.value || "";
  if (styleFieldValue) return styleFieldValue;
  return state.activeFieldKey || "";
}

function currentSelectedStaticField() {
  const layout = currentEditableLayout();
  const staticFields = layout.staticFields || [];
  const candidates = [
    $("styleField")?.value || "",
    state.activeFieldKey || "",
    document.querySelector(".editable-field.is-selected")?.dataset?.editKey || "",
  ].filter(Boolean);
  const key = candidates.find((candidate) => staticFields.some((field) => field.key === candidate));
  return key ? staticFields.find((field) => field.key === key) || null : null;
}

function currentContextVariantKey() {
  if (state.mode === "single") return currentSingleVariantKey();
  if (state.mode === "summary") return currentSummaryVariantKey();
  return "";
}

function isStaticFieldKey(key) {
  if (!key) return false;
  const layout = currentEditableLayout();
  return (layout.staticFields || []).some((field) => field.key === key);
}

function ensureFieldContextMenu() {
  if ($("fieldContextMenu")) return;
  const menu = document.createElement("div");
  menu.id = "fieldContextMenu";
  menu.className = "field-context-menu";
  menu.hidden = true;
  menu.innerHTML = `
    <button type="button" data-menu-action="copy">复制</button>
    <button type="button" data-menu-action="paste">粘贴</button>
    <button type="button" data-menu-action="delete">删除</button>
    <button type="button" data-menu-action="edit">编辑</button>
  `;
  menu.addEventListener("click", handleFieldContextMenuAction);
  document.body.appendChild(menu);
}

function openFieldContextMenu(key, clientX, clientY, options = {}) {
  const menu = $("fieldContextMenu");
  if (!menu) return;
  const {
    kind = "field",
    pastePosition = null,
  } = options;
  if (kind === "field" && !key) return;
  state.contextMenu = {
    visible: true,
    kind,
    key,
    x: clientX,
    y: clientY,
    pastePosition,
  };
  menu.querySelectorAll("[data-menu-action]").forEach((button) => {
    button.hidden = false;
    button.disabled = false;
  });
  if (kind === "surface") {
    menu.querySelector('[data-menu-action="copy"]').hidden = true;
    menu.querySelector('[data-menu-action="delete"]').hidden = true;
    menu.querySelector('[data-menu-action="edit"]').hidden = true;
  }
  menu.hidden = false;
  menu.querySelector('[data-menu-action="paste"]').disabled = !state.fieldClipboard;
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    const left = Math.min(clientX, Math.max(8, window.innerWidth - rect.width - 8));
    const top = Math.min(clientY, Math.max(8, window.innerHeight - rect.height - 8));
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  });
}

function closeFieldContextMenu() {
  state.contextMenu.visible = false;
  state.contextMenu.kind = "field";
  state.contextMenu.key = "";
  state.contextMenu.pastePosition = null;
  const menu = $("fieldContextMenu");
  if (!menu) return;
  menu.hidden = true;
}

function handleGlobalPointerDismiss(event) {
  if (!state.contextMenu.visible) return;
  if (event.target?.closest?.("#fieldContextMenu")) return;
  closeFieldContextMenu();
}

function handleFieldContextMenuAction(event) {
  const button = event.target.closest("[data-menu-action]");
  if (!button) return;
  const action = button.dataset.menuAction;
  const key = state.contextMenu.key || currentSelectedFieldKey();
  const contextKind = state.contextMenu.kind;
  const pastePosition = state.contextMenu.pastePosition;
  closeFieldContextMenu();
  if (action === "paste") {
    pasteClipboardToField(contextKind === "surface" ? "" : key, pastePosition);
    return;
  }
  if (!key) return;
  if (action === "copy") copyFieldByKey(key);
  if (action === "delete") deleteSelectedField(key);
  if (action === "edit") editFieldByKey(key);
}

function canvasFieldSnapshot(key) {
  if (!key) return null;
  const isStatic = isStaticFieldKey(key);
  const dynamicField = dynamicFieldDefinitionByKey(key);
  const layout = currentEditableLayout();
  const variantKey = currentContextVariantKey();
  const snapshot = {
    kind: isStatic ? "static" : "dynamic",
    key,
    mode: state.mode,
    side: state.editSide,
    variantKey,
    position: clone(positionFor(key, variantKey)),
    size: clone(sizeFor(key, variantKey)),
    style: clone(normalizeFieldStyle(styleFor(key, variantKey))),
  };
  if (isStatic) {
    const field = (layout.staticFields || []).find((item) => item.key === key);
    snapshot.text = field?.text || "";
    snapshot.variantVisibility = clone(field?.variantVisibility || {});
  } else if (dynamicField) {
    snapshot.text = dynamicField.label || "";
    snapshot.sourceKey = dynamicField.sourceKey || dynamicField.key;
    snapshot.variantVisibility = clone(dynamicField.variantVisibility || {});
  } else {
    const builtin = state.mode === "summary"
      ? summaryFieldDefinitions().find((field) => field.key === key)
      : currentTabletType().fields.find((field) => field.key === key);
    snapshot.text = builtin?.label || key;
    snapshot.sourceKey = key;
  }
  return snapshot;
}

function copyFieldByKey(key) {
  const snapshot = canvasFieldSnapshot(key);
  if (!snapshot) return false;
  state.fieldClipboard = snapshot;
  state.activeFieldKey = key;
  if ($("styleField")) {
    $("styleField").value = key;
    syncStyleInputs();
  } else {
    syncSelectedFieldHighlight();
  }
  $("statusText").textContent = snapshot.kind === "static" ? "已复制静态字段" : "已复制动态字段";
  return true;
}

function copySelectedField() {
  const key = currentSelectedFieldKey();
  if (!key) {
    alert("请先选中字段");
    return;
  }
  copyFieldByKey(key);
}

function flashFieldSelection(key) {
  if (!key) return;
  requestAnimationFrame(() => {
    const element = document.querySelector(`.editable-field[data-edit-key="${CSS.escape(key)}"]`);
    if (!element) return;
    element.classList.remove("is-flashed");
    void element.offsetWidth;
    element.classList.add("is-flashed");
    window.setTimeout(() => {
      element.classList.remove("is-flashed");
    }, 520);
  });
}

function pasteToSelectedField() {
  const key = currentSelectedFieldKey();
  if (!key && state.fieldClipboard?.kind !== "static") {
    alert("请先选中目标字段");
    return;
  }
  pasteClipboardToField(key);
}

function offsetFieldPosition(position, size, delta = 1) {
  const nextX = clamp((Number(position?.x) || 0) + delta, 0, Math.max(0, 100 - (Number(size?.w) || 0)));
  const nextY = clamp((Number(position?.y) || 0) + delta, 0, Math.max(0, 100 - (Number(size?.h) || 0)));
  return {
    x: Math.round(nextX * 10) / 10,
    y: Math.round(nextY * 10) / 10,
  };
}

function pointerPositionInSurface(surface, clientX, clientY, size = { w: 24, h: 12 }) {
  const rect = surface.getBoundingClientRect();
  const width = Number(size?.w) || 24;
  const height = Number(size?.h) || 12;
  const x = clamp(((clientX - rect.left) / rect.width) * 100 - (width / 2), 0, Math.max(0, 100 - width));
  const y = clamp(((clientY - rect.top) / rect.height) * 100 - (height / 2), 0, Math.max(0, 100 - height));
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

function applyFieldPlacement(layout, key, nextPlacement) {
  const nextPosition = clone(nextPlacement.position || { x: 50, y: 50 });
  const nextSize = clone(nextPlacement.size || { w: 24, h: 12 });
  const nextStyle = clone(nextPlacement.style || normalizeFieldStyle());
  layoutSetValue(layout, "positions", key, nextPosition);
  layoutSetValue(layout, "sizes", key, nextSize);
  layoutSetValue(layout, "styles", key, nextStyle);
}

function pasteClipboardToField(targetKey = "", pastePosition = null) {
  const clipboard = state.fieldClipboard;
  if (!clipboard) {
    alert("请先复制字段");
    return false;
  }
  const layout = currentEditableLayout();
  if (clipboard.kind === "static") {
    const key = `static_${Date.now()}`;
    const field = { key, text: clipboard.text || "静态字段" };
    if (!isEditingBackSide()) {
      if (state.mode === "single") {
        field.variantVisibility = clone(clipboard.variantVisibility || {});
        singleVariantPresetsForCurrentType().forEach((variant) => {
          if (field.variantVisibility[variant.key] === undefined) field.variantVisibility[variant.key] = false;
        });
        field.variantVisibility[currentSingleVariantKey()] = true;
      } else if (state.mode === "summary") {
        field.variantVisibility = clone(clipboard.variantVisibility || {});
        summaryVariantPresetsFor().forEach((variant) => {
          if (field.variantVisibility[variant.key] === undefined) field.variantVisibility[variant.key] = false;
        });
        field.variantVisibility[currentSummaryVariantKey()] = true;
      }
    }
    layout.staticFields.push(field);
    applyFieldPlacement(layout, key, {
      position: pastePosition || offsetFieldPosition(clipboard.position, clipboard.size, 1.5),
      size: clipboard.size,
      style: clipboard.style,
    });
    state.activeFieldKey = key;
    saveLayouts();
    buildStyleEditor();
    buildStaticVisibilityControls();
    if ($("styleField")) {
      $("styleField").value = key;
      syncStyleInputs();
    }
    render();
    flashFieldSelection(key);
    $("statusText").textContent = "已粘贴静态字段";
    return true;
  }

  if (pastePosition) {
    const key = `dynamic_${Date.now()}`;
    const layout = currentEditableLayout();
    const field = {
      key,
      label: clipboard.text || "动态字段",
      sourceKey: clipboard.sourceKey || clipboard.key,
      variantVisibility: {},
    };
    if (!isEditingBackSide()) {
      if (state.mode === "single") {
        singleVariantPresetsForCurrentType().forEach((variant) => {
          field.variantVisibility[variant.key] = variant.key === currentSingleVariantKey();
        });
      } else if (state.mode === "summary") {
        summaryVariantPresetsFor().forEach((variant) => {
          field.variantVisibility[variant.key] = variant.key === currentSummaryVariantKey();
        });
      }
    }
    layout.dynamicFields.push(field);
    applyFieldPlacement(layout, key, {
      position: pastePosition,
      size: clipboard.size,
      style: clipboard.style,
    }, { isStatic: false });
    state.activeFieldKey = key;
    saveLayouts();
    buildFieldMapping();
    buildStyleEditor();
    buildStaticVisibilityControls();
    if ($("styleField")) {
      $("styleField").value = key;
      syncStyleInputs();
    }
    render();
    flashFieldSelection(key);
    $("statusText").textContent = "已粘贴动态字段";
    return true;
  }

  const key = targetKey || currentSelectedFieldKey();
  if (!key) {
    alert("请先选中目标字段");
    return false;
  }
  state.activeFieldKey = key;
  applyFieldPlacement(layout, key, {
    position: clipboard.position,
    size: clipboard.size,
    style: clipboard.style,
  }, { isStatic: isStaticFieldKey(key) });
  saveLayouts();
  buildStyleEditor();
  if ($("styleField")) {
    $("styleField").value = key;
    syncStyleInputs();
  }
  render();
  flashFieldSelection(key);
  $("statusText").textContent = "已粘贴字段样式";
  return true;
}

function deleteFieldScopedValue(layout, bucket, key) {
  if (!layout?.[bucket]) return;
  delete layout[bucket][key];
  const variantKey = currentContextVariantKey();
  if (state.mode === "single" && variantKey) {
    delete layout[bucket][singleVariantStorageKey(key, variantKey)];
    return;
  }
  if (state.mode === "summary" && isSummaryFieldKey(key) && variantKey) {
    delete layout[bucket][summaryVariantStorageKey(key, variantKey)];
  }
}

function resetDynamicFieldByKey(key) {
  if (!key) return;
  const layout = currentEditableLayout();
  deleteFieldScopedValue(layout, "positions", key);
  deleteFieldScopedValue(layout, "sizes", key);
  deleteFieldScopedValue(layout, "styles", key);
  deleteFieldScopedValue(layout, "mappings", key);
  state.activeFieldKey = key;
  saveLayouts();
  buildStyleEditor();
  if ($("styleField")) {
    $("styleField").value = key;
    syncStyleInputs();
  }
  render();
  $("statusText").textContent = "已重置动态字段";
}

function handleFieldContextMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  const key = event.currentTarget?.dataset?.editKey || "";
  if (!key) return;
  state.activeFieldKey = key;
  if ($("styleField")) {
    $("styleField").value = key;
    syncStyleInputs();
  } else {
    syncSelectedFieldHighlight();
  }
  openFieldContextMenu(key, event.clientX, event.clientY);
}

function handleSurfaceContextMenu(event) {
  if (event.target?.closest?.("[data-edit-key]")) return;
  event.preventDefault();
  const surface = event.currentTarget;
  const clipboard = state.fieldClipboard;
  const pastePosition = clipboard
    ? pointerPositionInSurface(surface, event.clientX, event.clientY, clipboard.size)
    : null;
  openFieldContextMenu("", event.clientX, event.clientY, {
    kind: "surface",
    pastePosition,
  });
}

function handleFieldDoubleClick(event) {
  const key = event.currentTarget?.dataset?.editKey || "";
  editFieldByKey(key);
}

function editFieldByKey(key) {
  if (!key) return;
  state.activeFieldKey = key;
  if ($("styleField")) {
    $("styleField").value = key;
    syncStyleInputs();
  } else {
    syncSelectedFieldHighlight();
  }
  if (isStaticFieldKey(key)) {
    editStaticFieldText(key);
    return;
  }
  $("fieldFontSize")?.focus();
  $("statusText").textContent = "已选中动态字段，可直接修改样式";
}

function editSelectedStaticField() {
  const key = currentSelectedFieldKey();
  if (!key) {
    alert("请先选中字段");
    return;
  }
  editFieldByKey(key);
}

function deleteSelectedStaticField() {
  const key = currentSelectedFieldKey();
  if (!key) {
    alert("请先选中字段");
    return;
  }
  deleteSelectedField(key);
}

function deleteSelectedField(key = currentSelectedFieldKey()) {
  if (!key) return;
  if (isStaticFieldKey(key)) {
    deleteFieldByKey(key);
    return;
  }
  resetDynamicFieldByKey(key);
}

function startDrag(event) {
  if (event.button !== 0) return;
  if (event.target.closest(".resize-handle")) return;
  const element = event.currentTarget;
  const tablet = element.closest("[data-drag-surface]");
  if (!tablet) return;
  state.activeFieldKey = element.dataset.editKey || "";
  if ($("styleField")) {
    $("styleField").value = state.activeFieldKey;
    syncStyleInputs();
  } else {
    syncSelectedFieldHighlight();
  }
  element.setPointerCapture(event.pointerId);
  const tabletRect = tablet.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  state.interaction = {
    type: "move",
    key: element.dataset.editKey,
    element,
    tablet,
    offsetX: event.clientX - elementRect.left,
    offsetY: event.clientY - elementRect.top,
    widthPct: (elementRect.width / tabletRect.width) * 100,
    heightPct: (elementRect.height / tabletRect.height) * 100,
  };
  element.classList.add("dragging");
  element.addEventListener("pointermove", moveField);
  element.addEventListener("pointerup", endInteraction, { once: true });
  element.addEventListener("pointercancel", endInteraction, { once: true });
  renderDebugInfo();
}

function startResize(event) {
  if (event.button !== 0) return;
  event.stopPropagation();
  const handle = event.currentTarget;
  const element = handle.closest("[data-edit-key]");
  const tablet = element?.closest("[data-drag-surface]");
  if (!element || !tablet) return;
  handle.setPointerCapture(event.pointerId);
  const rect = tablet.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  state.interaction = {
    type: "resize",
    key: handle.dataset.resizeKey,
    element,
    handle,
    tablet,
    startX: event.clientX,
    startY: event.clientY,
    startW: (elementRect.width / rect.width) * 100,
    startH: (elementRect.height / rect.height) * 100,
  };
  element.classList.add("resizing");
  handle.addEventListener("pointermove", resizeField);
  handle.addEventListener("pointerup", endInteraction, { once: true });
  handle.addEventListener("pointercancel", endInteraction, { once: true });
}

function moveField(event) {
  if (!state.interaction || state.interaction.type !== "move") return;
  const rect = state.interaction.tablet.getBoundingClientRect();
  const x = clamp(
    ((event.clientX - state.interaction.offsetX - rect.left) / rect.width) * 100,
    0,
    100 - state.interaction.widthPct
  );
  const y = clamp(
    ((event.clientY - state.interaction.offsetY - rect.top) / rect.height) * 100,
    0,
    100 - state.interaction.heightPct
  );
  state.interaction.element.style.left = `${x}%`;
  state.interaction.element.style.top = `${y}%`;
  const layout = currentEditableLayout();
  const nextPos = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  layoutSetValue(layout, "positions", state.interaction.key, nextPos);
}

function resizeField(event) {
  if (!state.interaction || state.interaction.type !== "resize") return;
  const rect = state.interaction.tablet.getBoundingClientRect();
  const deltaW = ((event.clientX - state.interaction.startX) / rect.width) * 100;
  const deltaH = ((event.clientY - state.interaction.startY) / rect.height) * 100;
  const width = clamp(state.interaction.startW + deltaW, 4, 96);
  const height = Math.max(state.interaction.startH + deltaH, 4);
  state.interaction.element.style.width = `${width}%`;
  state.interaction.element.style.height = `${height}%`;
  const layout = currentEditableLayout();
  const nextSize = { w: Math.round(width * 10) / 10, h: Math.round(height * 10) / 10 };
  layoutSetValue(layout, "sizes", state.interaction.key, nextSize);
  fitField(state.interaction.element);
}

function currentLayoutKey() {
  if (state.mode === "summary") return $("templateSelect").value || defaultSummaryTemplateId();
  const templateId = $("templateSelect").value;
  if (templateId) return templateId;
  return currentTemplate()?.id || defaultSingleTemplateIdForGroup("blessing");
}

function summaryTemplateIds() {
  return Array.from(SUMMARY_TEMPLATE_IDS);
}

function defaultSummaryTemplateId() {
  return summaryTemplateIds()[0] || "cmp6uyyk10003bjnjsqkn2uwn";
}

function defaultSingleTemplateIdForGroup(group) {
  return group === "blessing" ? "cmp6vaj3l000gbjnjoak9q9wx" : "cmozm19an001ahmbwqm8nmi1q";
}

function isBlessingGroup(group) {
  return group === "blessing";
}

function dataGroupLabel(group) {
  return isBlessingGroup(group) ? "延生禄位" : "超度牌位";
}

function dataGroupLoadLabel(group) {
  return isBlessingGroup(group) ? "延生" : "往生/超度";
}

function dataGroupForPlaqueType(plaqueType) {
  return plaqueType === "LONGEVITY" ? "blessing" : "deliverance";
}

function tabletTypeForPlaqueType(plaqueType) {
  if (plaqueType === "LONGEVITY") return "blessing";
  if (plaqueType === "REBIRTH") return "deliverance";
  if (plaqueType === "DELIVERANCE") return "deliverance";
  return "";
}

function summaryTemplateById(templateId) {
  return templates.find((item) => item.id === templateId && isSummaryTemplate(item)) || null;
}

function summaryTemplatePaper(templateId) {
  const template = summaryTemplateById(templateId) || summaryTemplateById(defaultSummaryTemplateId());
  return {
    width: template?.width || 210,
    height: template?.height || 297,
    vertical: false,
  };
}

function summaryTemplatePaperPreset(templateId) {
  const paper = summaryTemplatePaper(templateId);
  return paperPresetForSize(paper.width, paper.height);
}

function isSummaryTemplate(template) {
  const catalog = TEMPLATE_CATALOG[template?.id || ""];
  if (catalog) return catalog.mode === "summary";
  return SUMMARY_TEMPLATE_IDS.has(template.id) || template.mode === "summary";
}

function inferTemplateDataGroup(templateData) {
  const fields = (templateData.fields || []).map((field) => unscopedFieldKey(field.key));
  const blessingKeys = new Set(tabletTypes.blessing.fields.map((field) => field.key));
  return fields.some((key) => blessingKeys.has(key)) ? "blessing" : "deliverance";
}

function currentSummarySettings() {
  return {
    dataGroup: currentDataGroup(),
    variantKey: currentSummaryVariantKey(),
    format: $("summaryFormat").value,
    columnCount: Number($("columnCount").value) || 3,
    rowsPerColumn: Number($("rowsPerColumn").value) || 18,
    fontSize: Number($("summaryFont").value) || 22,
    lineGap: Number($("summaryLineGap").value) || 0,
    pageMargin: Number($("pageMargin").value) || 0,
    columnGap: Number($("columnGap").value) || 0,
    vertical: $("summaryVertical").checked,
  };
}

function applySavedSummarySettings(settings) {
  if (!settings) return;
  refreshSummaryVariantOptions();
  if (typeof settings.format === "string" && $("summaryFormat")) $("summaryFormat").value = settings.format;
  if (settings.columnCount && $("columnCount")) $("columnCount").value = settings.columnCount;
  if (settings.rowsPerColumn && $("rowsPerColumn")) $("rowsPerColumn").value = settings.rowsPerColumn;
  if (settings.fontSize && $("summaryFont")) $("summaryFont").value = settings.fontSize;
  if (settings.lineGap !== undefined && $("summaryLineGap")) $("summaryLineGap").value = settings.lineGap;
  if (settings.pageMargin !== undefined && $("pageMargin")) $("pageMargin").value = settings.pageMargin;
  if (settings.columnGap !== undefined && $("columnGap")) $("columnGap").value = settings.columnGap;
  if (settings.vertical !== undefined && $("summaryVertical")) $("summaryVertical").checked = settings.vertical;
  if (settings.variantKey && Array.from($("summaryVariant")?.options || []).some((option) => option.value === settings.variantKey)) {
    $("summaryVariant").value = settings.variantKey;
  }
  if ($("summaryFormat")) state.lastSummaryDefault = $("summaryFormat").value;
}

function clone(valueToClone) {
  return JSON.parse(JSON.stringify(valueToClone));
}

function endInteraction(event) {
  if (!state.interaction) return;
  if (state.interaction.type === "move") {
    state.interaction.element.releasePointerCapture(event.pointerId);
    state.interaction.element.classList.remove("dragging");
    state.interaction.element.removeEventListener("pointermove", moveField);
  }
  if (state.interaction.type === "resize") {
    state.interaction.handle.releasePointerCapture(event.pointerId);
    state.interaction.element.classList.remove("resizing");
    state.interaction.handle.removeEventListener("pointermove", resizeField);
  }
  fitAllFields();
  saveLayouts();
  state.interaction = null;
}

function nudgeSelectedField(direction, step = 0.2) {
  const key = currentSelectedFieldKey();
  if (!key) return false;
  const layout = currentEditableLayout();
  const variantKey = currentContextVariantKey();
  const size = sizeFor(key, variantKey);
  const currentPosition = clone(positionFor(key, variantKey));
  const delta = {
    ArrowUp: { x: 0, y: -step },
    ArrowDown: { x: 0, y: step },
    ArrowLeft: { x: -step, y: 0 },
    ArrowRight: { x: step, y: 0 },
  }[direction];
  if (!delta) return false;
  const nextPosition = {
    x: Math.round(clamp(currentPosition.x + delta.x, 0, Math.max(0, 100 - (size.w || 0))) * 10) / 10,
    y: Math.round(clamp(currentPosition.y + delta.y, 0, Math.max(0, 100 - (size.h || 0))) * 10) / 10,
  };
  applyFieldPlacement(layout, key, {
    position: nextPosition,
    size,
    style: styleFor(key, variantKey),
  }, { isStatic: isStaticFieldKey(key) });
  saveLayouts();
  render();
  return true;
}

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName || "";
  if (event.key === "Escape") { closeFieldContextMenu(); return; }
  if (event.key === "Delete" || event.key === "Backspace") {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
    const key = currentSelectedFieldKey();
    if (!key) return;
    event.preventDefault();
    state.activeFieldKey = key;
    deleteSelectedField(key);
    return;
  }
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "c") {
    const key = currentSelectedFieldKey();
    if (!key) return;
    event.preventDefault();
    copyFieldByKey(key);
    return;
  }
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "v") {
    if (!state.fieldClipboard) return;
    event.preventDefault();
    pasteClipboardToField(currentSelectedFieldKey());
    return;
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    if (!currentSelectedFieldKey()) return;
    event.preventDefault();
    nudgeSelectedField(event.key, event.shiftKey ? 1 : 0.2);
  }
});

function deleteFieldByKey(key) {
  if (!key) return;
  const layout = currentEditableLayout();
  const staticIndex = layout.staticFields.findIndex((field) => field.key === key);
  if (staticIndex >= 0) {
    layout.staticFields.splice(staticIndex, 1);
  }
  const dynamicIndex = (layout.dynamicFields || []).findIndex((field) => field.key === key);
  if (dynamicIndex >= 0) {
    layout.dynamicFields.splice(dynamicIndex, 1);
  }
  if (layout.positions?.[key]) delete layout.positions[key];
  if (layout.sizes?.[key]) delete layout.sizes[key];
  if (layout.styles?.[key]) delete layout.styles[key];
  if (layout.mappings?.[key]) delete layout.mappings[key];
  if (isSingleVariantFieldKey(key)) {
    singleVariantPresetsForCurrentType().forEach((variant) => {
      const scoped = singleVariantStorageKey(key, variant.key);
      if (layout.positions?.[scoped]) delete layout.positions[scoped];
      if (layout.sizes?.[scoped]) delete layout.sizes[scoped];
      if (layout.styles?.[scoped]) delete layout.styles[scoped];
      if (layout.mappings?.[scoped]) delete layout.mappings[scoped];
    });
  }
  if (state.mode === "summary" && isSummaryFieldKey(key)) {
    const scoped = summaryVariantStorageKey(key);
    if (layout.positions?.[scoped]) delete layout.positions[scoped];
    if (layout.sizes?.[scoped]) delete layout.sizes[scoped];
    if (layout.styles?.[scoped]) delete layout.styles[scoped];
    if (layout.mappings?.[scoped]) delete layout.mappings[scoped];
  }
  state.activeFieldKey = "";
  saveLayouts();
  buildStyleEditor();
  buildStaticVisibilityControls();
  render();
}

function editStaticFieldText(key) {
  const layout = currentEditableLayout();
  const target = layout.staticFields.find((field) => field.key === key);
  if (!target) return;
  const nextText = window.prompt("修改静态字段", target.text || "");
  if (nextText === null) return;
  target.text = String(nextText).trim();
  state.activeFieldKey = key;
  if (state.mode === "summary") {
    if ($("summaryStaticFieldText")) $("summaryStaticFieldText").value = target.text;
  } else if ($("staticFieldText")) {
    $("staticFieldText").value = target.text;
  }
  saveLayouts();
  buildStyleEditor();
  buildStaticVisibilityControls();
  if ($("styleField")) {
    $("styleField").value = key;
    syncStyleInputs();
  }
  render();
}

function fitAllFields() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".editable-field").forEach(fitField);
      resolve();
    });
  });
}

function waitForNextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForPrintPreviewReady() {
  await waitForNextFrame();
  await waitForNextFrame();
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
    }
  }
}

function fitField(field) {
  const content = field.querySelector(".field-content");
  const flow = field.querySelector(".field-flow");
  if (!content) return;
  if (flow) {
    flow.style.transform = "";
    flow.style.transformOrigin = "center center";
  }
  const baseFont = Number(field.dataset.baseFont) || Number.parseFloat(field.style.fontSize) || 18;
  field.style.fontSize = `${baseFont}px`;
  if (!isOverflowing(content)) {
    field.classList.toggle("auto-shrunk", false);
    return;
  }
  let lo = 1;
  let hi = baseFont;
  let best = baseFont;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    field.style.fontSize = `${mid}px`;
    if (isOverflowing(content)) {
      hi = mid - 1;
    } else {
      best = mid;
      lo = mid + 1;
    }
  }
  field.style.fontSize = `${best}px`;
  if (flow && isOverflowing(content)) {
    const scaleX = content.clientWidth > 0 && content.scrollWidth > 0 ? content.clientWidth / content.scrollWidth : 1;
    const scaleY = content.clientHeight > 0 && content.scrollHeight > 0 ? content.clientHeight / content.scrollHeight : 1;
    const scale = Math.max(0.05, Math.min(scaleX, scaleY, 1));
    flow.style.transform = `scale(${scale})`;
  }
  field.classList.toggle("auto-shrunk", best < baseFont);
}

function isOverflowing(element) {
  return element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1;
}

function formatSummary(row) {
  return $("summaryFormat").value.replace(/\{\{([^}]+)\}\}/g, (_, key) => value(row, key.trim()));
}

function formatSummaryColumn(row) {
  const maxLines = Number($("rowsPerColumn").value) || 18;
  const lines = formatSummary(row)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);
  return Array.from({ length: maxLines }, (_, index) => (
    `<div class="summary-item">${escapeHtml(lines[index] || "")}</div>`
  )).join("");
}

function sheetVars() {
  const paperWidthEl = $("paperWidth");
  const paperHeightEl = $("paperHeight");
  const template = currentTemplate();
  const width = (paperWidthEl ? Number(paperWidthEl.value) : 0) || template?.width || 210;
  const height = Math.max((paperHeightEl ? Number(paperHeightEl.value) : 0) || template?.height || 297, 1);
  return `--paper-w:${width}mm; --paper-h:${height}mm;`;
}

function syncPrintSize() {
  const paperWidthEl = $("paperWidth");
  const paperHeightEl = $("paperHeight");
  const template = currentTemplate();
  const width = (paperWidthEl ? Number(paperWidthEl.value) : 0) || template?.width || 210;
  const height = Math.max((paperHeightEl ? Number(paperHeightEl.value) : 0) || template?.height || 297, 1);
  document.documentElement.style.setProperty("--print-w", `${width}mm`);
  document.documentElement.style.setProperty("--print-h", `${height}mm`);

  let pageSizeStyle = document.getElementById("printPageSize");
  if (!pageSizeStyle) {
    pageSizeStyle = document.createElement("style");
    pageSizeStyle.id = "printPageSize";
    document.head.appendChild(pageSizeStyle);
  }
  pageSizeStyle.textContent = `@page { size: ${width}mm ${height}mm; margin: 0; }`;
}

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

function escapeHtml(valueToEscape) {
  return String(valueToEscape)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function togglePanel(panel) {
  if (!panel) return;
  const workspace = panel.closest(".workspace");
  const isLeft = panel.classList.contains("controls");
  const collapsed = panel.classList.toggle("collapsed");
  if (workspace) {
    workspace.classList.toggle("left-collapsed", isLeft && collapsed);
    workspace.classList.toggle("right-collapsed", !isLeft && collapsed);
  }
  const arrow = panel.querySelector(".panel-toggle");
  if (arrow) {
    arrow.innerHTML = isLeft
      ? (collapsed ? "&#9654;" : "&#9664;")
      : (collapsed ? "&#9664;" : "&#9654;");
  }
  savePanelStates();
}

function savePanelStates() {
  const leftPanel = document.querySelector(".panel.controls");
  const rightPanel = document.querySelector(".panel.data-panel");
  safeStorageSet("panelStates", JSON.stringify({
    leftCollapsed: leftPanel?.classList.contains("collapsed") || false,
    rightCollapsed: rightPanel?.classList.contains("collapsed") || false,
  }));
}

function restorePanelStates() {
  try {
    const stored = safeStorageGet("panelStates");
    if (!stored) return;
    const states = JSON.parse(stored);
    const leftPanel = document.querySelector(".panel.controls");
    const rightPanel = document.querySelector(".panel.data-panel");
    const workspace = document.querySelector(".workspace");
    if (states.leftCollapsed && leftPanel && workspace) {
      leftPanel.classList.add("collapsed");
      workspace.classList.add("left-collapsed");
      const arrow = leftPanel.querySelector(".panel-toggle");
      if (arrow) arrow.innerHTML = "&#9654;";
    }
    if (states.rightCollapsed && rightPanel && workspace) {
      rightPanel.classList.add("collapsed");
      workspace.classList.add("right-collapsed");
      const arrow = rightPanel.querySelector(".panel-toggle");
      if (arrow) arrow.innerHTML = "&#9664;";
    }
  } catch (e) {
    // ignore
  }
}

function renderFieldSelection(templateType = "blessing") {
  const container = document.getElementById("fieldSelection");
  container.innerHTML = "";

  const groups = templateType === "deliverance"
    ? [{ name: "往生牌位模板", dataGroup: "deliverance", fields: tabletTypes.deliverance.fields }]
    : [{ name: "延生禄位模板", dataGroup: "blessing", fields: tabletTypes.blessing.fields }];

  groups.forEach(group => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "field-group";

    const title = document.createElement("div");
    title.className = "field-group-title";
    title.textContent = group.name;
    groupDiv.appendChild(title);

    group.fields.forEach(field => {
      const label = document.createElement("label");
      label.className = "checkbox";
      label.innerHTML = `
        <input type="checkbox" class="field-checkbox" value="${field.key}" data-group="${group.name}" data-data-group="${group.dataGroup}">
        ${field.label}
      `;
      groupDiv.appendChild(label);
    });

    container.appendChild(groupDiv);
  });
}

function applyNewTemplateCategory(category) {
  const dataGroupSelect = document.getElementById("newTemplateDataGroup");
  const fieldSelection = document.getElementById("fieldSelection");
  const fieldset = fieldSelection?.closest("fieldset");
  const modeSelect = document.getElementById("newTemplateMode");
  const modeLabel = document.getElementById("newTemplateModeLabel");
  const verticalCheckbox = document.getElementById("newTemplateVertical");

  const isSummary = category === "summary";
  const fixedDataGroup = category === "blessing_doc" ? "blessing" : category === "deliverance_doc" ? "deliverance" : null;

  if (dataGroupSelect) {
    dataGroupSelect.disabled = Boolean(fixedDataGroup);
    if (fixedDataGroup) dataGroupSelect.value = fixedDataGroup;
    dataGroupSelect.hidden = isSummary;
  }
  if (fieldset) fieldset.hidden = isSummary;
  if (modeSelect && modeLabel) {
    modeSelect.value = "preset";
    modeLabel.hidden = isSummary;
  }
  if (verticalCheckbox) {
    verticalCheckbox.parentElement.hidden = isSummary;
  }

  if (!isSummary) {
    renderFieldSelection(fixedDataGroup || dataGroupSelect?.value || "blessing");
  }
}

function createCustomTemplate() {
  const name = document.getElementById("newTemplateName").value.trim();
  if (!name) {
    alert("请输入模板名称");
    return;
  }

  if (templates.some(t => t.name === name)) {
    alert("模板名称已存在");
    return;
  }

  const category = document.getElementById("newTemplateCategory")?.value || "plaque";
  const dataGroupSelect = document.getElementById("newTemplateDataGroup");
  const dataGroup = category === "blessing_doc" ? "blessing"
    : category === "deliverance_doc" ? "deliverance"
    : dataGroupSelect?.value || "blessing";
  const width = parseInt(document.getElementById("newTemplateWidth").value) || 90;
  const height = parseInt(document.getElementById("newTemplateHeight").value) || 260;
  const vertical = document.getElementById("newTemplateVertical").checked;
  const createMode = document.getElementById("newTemplateMode")?.value || "preset";
  const id = "custom_" + Date.now();

  if (category === "summary") {
    const newTemplate = {
      id,
      name,
      category,
      width,
      height,
      font: Number($("summaryFont").value) || 22,
      vertical: false,
      mode: "summary",
      dataGroup,
    };
    templates.push(newTemplate);
    state.layouts[id] = {
      ...createSummaryLayoutDefaults(id),
      paper: { width, height, vertical: false },
      summary: currentSummarySettings(),
    };

    saveLayouts();
    saveCustomTemplatesToStorage();
    rebuildTemplateOptions(id);
    document.getElementById("newTemplateDialog").close();
    applyTemplate();
    return;
  }

  const selectedFields = [];
  document.querySelectorAll(".field-checkbox:checked").forEach(cb => {
    selectedFields.push({
      key: cb.value,
      dataGroup: cb.dataset.dataGroup,
    });
  });

  if (createMode === "manual" && selectedFields.length === 0) {
    alert("请至少选择一个字段");
    return;
  }

  const newTemplate = {
    id,
    name,
    category,
    width,
    height,
    font: 22,
    vertical,
    dataGroup,
    tabletType: "custom",
    fieldKeys: createMode === "manual"
      ? Array.from(new Set(selectedFields.map((field) => field.key)))
      : defaultSingleFieldKeysForGroup(dataGroup),
  };

  templates.push(newTemplate);

  templateDefaults[id] = createMode === "manual"
    ? {
        positions: {},
        styles: {},
        sizes: {}
      }
    : createSinglePresetTemplateDefaults(newTemplate.dataGroup);
  state.layouts[id] = {
    positions: clone(templateDefaults[id].positions || {}),
    styles: clone(templateDefaults[id].styles || {}),
    sizes: clone(templateDefaults[id].sizes || {}),
    background: "",
    mappings: {},
    singleVariantKey: normalizeSingleVariantKey(singleVariantPresetsByType[newTemplate.dataGroup]?.[0]?.key || state.singleVariantKey || singleVariantPresets[0].key),
    staticFields: [],
    duplex: { enabled: false },
    backSide: createBlankSideLayout(),
    paper: { width, height, vertical },
  };

  if (createMode === "manual") {
    const defaultX = 50;
    const defaultY = 30;
    let yOffset = 0;

    selectedFields.forEach((field) => {
      const fieldKey = field.key;
      templateDefaults[id].positions[fieldKey] = {
        x: defaultX,
        y: defaultY + yOffset
      };
      templateDefaults[id].styles[fieldKey] = {
        fontSize: 18,
        color: "#16110d",
        fontFamily: "SimSun, serif"
      };
      templateDefaults[id].sizes[fieldKey] = {
        w: 20,
        h: 20
      };
      state.layouts[id].positions[fieldKey] = clone(templateDefaults[id].positions[fieldKey]);
      state.layouts[id].styles[fieldKey] = clone(templateDefaults[id].styles[fieldKey]);
      state.layouts[id].sizes[fieldKey] = clone(templateDefaults[id].sizes[fieldKey]);
      yOffset += 8;
    });
  }

  saveCustomTemplatesToStorage();
  saveLayouts();
  persistTemplateMutation({
    syncTemplate: true,
    localMessage: "模板已保存到本机",
    syncingMessage: "正在同步模板...",
    successMessage: isDesktopRuntime() ? "模板已保存到本地数据库" : "模板已保存到服务器",
    failureMessage: isDesktopRuntime() ? "模板已保存到本机，但本地数据库同步失败" : "模板已保存到本机，但服务器同步失败",
  });
  rebuildTemplateOptions(id);
  document.getElementById("newTemplateDialog").close();
  applyTemplate();
}

function saveCustomTemplatesToStorage() {
  const customTemplates = templates
    .filter(t => t.id.startsWith("custom_"))
    .map(t => {
      const layout = state.layouts[t.id];
      return {
        id: t.id,
        name: t.name,
        category: t.category || "",
        mode: t.mode || "single",
        dataGroup: t.dataGroup,
        width: layout?.paper?.width || t.width,
        height: layout?.paper?.height || t.height,
        vertical: layout?.paper?.vertical ?? t.vertical,
        fieldKeys: resolveTemplateFieldKeys(t),
        singleVariantKey: normalizeSingleVariantKey(layout?.singleVariantKey || defaultSingleVariantKeyForTemplate(t)),
        summary: layout?.summary,
        staticFields: layout?.staticFields || [],
        duplex: layout?.duplex,
        backSide: layout?.backSide,
        fields: Object.keys(templateDefaults[t.id]?.positions || {})
          .filter(key => !key.startsWith("static_"))
          .map(key => ({
          key,
          position: templateDefaults[t.id].positions[key],
          style: templateDefaults[t.id].styles[key],
          size: templateDefaults[t.id].sizes[key]
        }))
      };
    });
  safeStorageSet("customTemplates", JSON.stringify(customTemplates));
}

function loadCustomTemplatesFromStorage(options = {}) {
  try {
    const stored = safeStorageGet("customTemplates");
    if (!stored) return;

    const customTemplates = JSON.parse(stored);
    let changed = false;
    customTemplates.forEach(ct => {
      if (HIDDEN_LEGACY_TEMPLATE_IDS.has(ct.id)) {
        changed = true;
        return;
      }
      const mode = ct.mode || (ct.summary || !(ct.fields || []).length ? "summary" : "single");
      if (ct.mode !== mode) changed = true;
      if (!templates.some(t => t.id === ct.id)) {
        templates.push({
          id: ct.id,
          name: ct.name,
          category: ct.category || "",
          width: ct.width,
          height: ct.height,
          font: 22,
          vertical: ct.vertical,
          mode,
          dataGroup: ct.dataGroup || inferTemplateDataGroup(ct),
          tabletType: mode === "summary" ? undefined : "custom",
          fieldKeys: Array.isArray(ct.fieldKeys) && ct.fieldKeys.length
            ? ct.fieldKeys.map((key) => unscopedFieldKey(key)).filter(Boolean)
            : undefined,
        });

        templateDefaults[ct.id] = {
          positions: {},
          styles: {},
          sizes: {}
        };

        (ct.fields || []).forEach((field) => {
          const fieldKey = field.key;
          templateDefaults[ct.id].positions[fieldKey] = field.position || { x: 50, y: 30 };
          templateDefaults[ct.id].styles[fieldKey] = field.style || { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif" };
          templateDefaults[ct.id].sizes[fieldKey] = field.size || { w: 20, h: 20 };
        });

        if (ct.staticFields?.length) {
          const layout = ensureLayout(ct.id);
          layout.staticFields = ct.staticFields;
        }
        if (ct.singleVariantKey) {
          const layout = ensureLayout(ct.id);
          layout.singleVariantKey = normalizeSingleVariantKey(ct.singleVariantKey);
        }
        if (ct.duplex || ct.backSide) {
          const layout = ensureLayout(ct.id);
          layout.duplex = ct.duplex || { enabled: false };
          layout.backSide = normalizeSideLayout(ct.backSide || createBlankSideLayout());
        }

        if (mode === "summary") {
          const normalizedSummary = normalizeSummarySettings(ct.summary);
          if (JSON.stringify(normalizedSummary) !== JSON.stringify(ct.summary || {})) changed = true;
          const existingLayout = state.layouts[ct.id] || {};
          state.layouts[ct.id] = {
            ...existingLayout,
            positions: existingLayout.positions || {},
            styles: existingLayout.styles || {},
            sizes: existingLayout.sizes || {},
            background: existingLayout.background || ct.background || "",
            staticFields: existingLayout.staticFields || ct.staticFields || [],
            paper: {
              width: Number(ct.width) || 210,
              height: Number(ct.height) || 297,
              vertical: false,
            },
            summary: normalizedSummary,
          };
          if (repairSummaryTemplateLayout(ct.id)) changed = true;
        }

        rebuildTemplateOptions($("templateSelect")?.value || ct.id);
      }
    });
    if (changed) saveCustomTemplatesToStorage();
    if (changed) saveLayouts();
  } catch (e) {
    console.error("加载自定义模板失败:", e);
  }
}

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`读取本地存储失败: ${key}`, error);
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`写入本地存储失败: ${key}`, error);
    return false;
  }
}

