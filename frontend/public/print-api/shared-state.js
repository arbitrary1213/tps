
const state = {
  isDesignerPage: false,
  mode: "single",
  datasets: {
    blessing: [],
    deliverance: [],
  },
  pageIndex: 0,
  restorePageIndex: 0,
  layouts: loadLayouts(),
  interaction: null,
  lastSummaryDefault: "",
  remoteTemplateIds: loadRemoteTemplateIds(),
  selectedRowIds: {
    blessing: new Set(),
    deliverance: new Set(),
  },
  activeFieldKey: "",
  editSide: "front",
  renderSide: "",
  renderSingleVariant: "",
  singleVariantKey: singleVariantPresets[0].key,
  singleVariantManualOverride: false,
  fieldClipboard: null,
  contextMenu: {
    visible: false,
    kind: "field",
    key: "",
    x: 0,
    y: 0,
    pastePosition: null,
  },
};

const $ = (id) => document.getElementById(id);

function isBuiltinSingleTemplateId(templateId) {
  return BUILTIN_SINGLE_TEMPLATE_IDS.has(templateId);
}

function isBuiltinSingleTemplate(template) {
  return isBuiltinSingleTemplateId(template?.id || "");
}

function isAllowedSingleTemplate(template) {
  if (!template || isSummaryTemplate(template)) return true;
  if (CATALOG_SINGLE_TEMPLATE_IDS.has(template.id)) return true;
  if (isBuiltinSingleTemplate(template)) return true;
	  if (state.remoteTemplateIds[template.id]) return true;
  return Boolean(template?.id?.startsWith("custom_"));
}

function normalizeCatalogTemplate(template) {
  const catalog = TEMPLATE_CATALOG[template?.id || ""];
  if (!catalog) return template;
  return {
    ...template,
    name: catalog.name,
    mode: catalog.mode,
    dataGroup: catalog.dataGroup,
    tabletType: catalog.mode === "summary" ? undefined : catalog.dataGroup,
  };
}

function ensureBuiltinSingleTemplates() {
  BUILTIN_SINGLE_TEMPLATES.forEach((builtinTemplate) => {
    const existingIndex = templates.findIndex((item) => item.id === builtinTemplate.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = {
        ...templates[existingIndex],
        ...builtinTemplate,
      };
    } else {
      templates.push({ ...builtinTemplate });
    }
  });
}

function pruneObsoleteSingleTemplates() {
  const removedIds = [];
  for (let index = templates.length - 1; index >= 0; index -= 1) {
    const template = templates[index];
    if (!template?.id) continue;
    if (isSummaryTemplate(template)) continue;
    if (isAllowedSingleTemplate(template)) continue;
    removedIds.push(template.id);
    templates.splice(index, 1);
  }

  if (!removedIds.length) return false;

  removedIds.forEach((templateId) => {
    delete templateDefaults[templateId];
    delete state.layouts[templateId];
    delete state.remoteTemplateIds[templateId];
  });

  const currentSelectedId = $("templateSelect")?.value || "";
  const fallbackTemplateId = templates.find((template) => !isSummaryTemplate(template))?.id
    || defaultSingleTemplateIdForGroup("blessing");

  rebuildTemplateOptions(
    removedIds.includes(currentSelectedId) ? fallbackTemplateId : currentSelectedId
  );

  return true;
}

function dedupeTemplatesByNameAndGroup() {
  const seen = new Map();
  const removedIds = [];
  for (let index = templates.length - 1; index >= 0; index -= 1) {
    const template = templates[index];
    if (!template?.id) continue;
    const key = `${template.name || ""}__${template.dataGroup || ""}`;
    const existing = seen.get(key);
    if (existing) {
      if (state.remoteTemplateIds[template.id] && !state.remoteTemplateIds[existing]) {
        migrateLocalTemplateId(existing, template.id);
        seen.set(key, template.id);
      } else {
        removedIds.push(template.id);
        templates.splice(index, 1);
      }
    } else {
      seen.set(key, template.id);
    }
  }

  if (!removedIds.length) return;

  removedIds.forEach((templateId) => {
    delete templateDefaults[templateId];
    delete state.layouts[templateId];
    delete state.remoteTemplateIds[templateId];
  });

  const currentSelectedId = $("templateSelect")?.value || "";
  if (removedIds.includes(currentSelectedId) && templates.length) {
    $("templateSelect").value = templates[0].id;
  }
  rebuildTemplateOptions($("templateSelect")?.value || "");
}

function defaultSingleVariantKeyForGroup(group = currentDataGroup()) {
  return singleVariantPresetsByType[group]?.[0]?.key || singleVariantPresets[0].key;
}

function defaultSingleVariantKeyForTemplate(template = currentTemplate()) {
  const group = template?.dataGroup || currentDataGroup();
  return defaultSingleVariantKeyForGroup(group);
}

const controls = [
  "templateSelect", "paperSelect", "paperWidth", "paperHeight", "singleVariant",
  "singleFont", "singleOffsetY", "singleVertical",
  "styleField", "fieldFontSize", "fieldColor", "fieldFontFamily", "fieldTextAlign", "fieldVerticalAlign", "fieldWrapMode", "staticFieldText",
  "showBg", "enableDuplex", "designPrintBackgroundGraphics",
  "summaryVariant", "summaryFormat", "columnCount", "rowsPerColumn", "summaryFont",
  "summaryLineGap", "pageMargin", "columnGap", "summaryVertical",
].map($).filter(Boolean);

