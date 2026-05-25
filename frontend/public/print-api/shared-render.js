
function staticFieldsForCurrentContext(layout, variantKey = currentSingleVariantKey()) {
  const fields = layout?.staticFields || [];
  if ((state.mode === "single" || state.mode === "summary") && !isBackSideActive()) {
    return fields.filter((field) => staticFieldVisibleInVariant(field, variantKey));
  }
  return fields;
}

function staticFieldVisibleInVariant(field, variantKey = currentSingleVariantKey()) {
  if (!field || !variantKey) return true;
  if (!field.variantVisibility || typeof field.variantVisibility !== "object") return true;
  if (Object.prototype.hasOwnProperty.call(field.variantVisibility, variantKey)) {
    return field.variantVisibility[variantKey] !== false;
  }
  return field.variantVisibility[variantKey] !== false;
}

function setStaticFieldVariantVisibility(field, visible, variantKey = currentSingleVariantKey()) {
  if (!field.variantVisibility || typeof field.variantVisibility !== "object") field.variantVisibility = {};
  field.variantVisibility[variantKey] = Boolean(visible);
}

function singleVariantStorageKey(key, variantKey = currentSingleVariantKey()) {
  if (!shouldScopeSingleVariantField(key) || !variantKey) return key;
  return `single_variant_${variantKey}__${key}`;
}

function getLayoutBucketValue(layout, bucket, key, variantKey = currentSummaryVariantKey()) {
  if (!layout || !layout[bucket]) return undefined;
  const scopedKey = state.mode === "single"
    ? singleVariantStorageKey(key, variantKey)
    : summaryVariantStorageKey(key, variantKey);
  if (Object.prototype.hasOwnProperty.call(layout[bucket], scopedKey)) return layout[bucket][scopedKey];
  return layout[bucket][key];
}

function setLayoutBucketValue(layout, bucket, key, value, variantKey = currentSummaryVariantKey()) {
  if (!layout[bucket] || typeof layout[bucket] !== "object") layout[bucket] = {};
  const targetKey = state.mode === "single"
    ? singleVariantStorageKey(key, variantKey)
    : summaryVariantStorageKey(key, variantKey);
  layout[bucket][targetKey] = value;
  return layout[bucket][targetKey];
}

function mappingValueForField(layout, key, variantKey = currentSingleVariantKey()) {
  if (!layout?.mappings) return undefined;
  const scopedKey = shouldScopeSingleVariantField(key) ? singleVariantStorageKey(key, variantKey) : key;
  if (Object.prototype.hasOwnProperty.call(layout.mappings, scopedKey)) return layout.mappings[scopedKey];
  return layout.mappings[key];
}

function setMappingValueForField(layout, key, value, variantKey = currentSingleVariantKey()) {
  if (!layout.mappings || typeof layout.mappings !== "object") layout.mappings = {};
  const targetKey = shouldScopeSingleVariantField(key) ? singleVariantStorageKey(key, variantKey) : key;
  layout.mappings[targetKey] = value;
}

function firstRowValue(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (String(value || "").trim()) return String(value).trim();
  }
  return "";
}

function detectSummaryVariantForGroup(row, group = currentDataGroup()) {
  if (isBlessingGroup(group)) {
    const believer = firstRowValue(row, ["信人", "阳上", "阳上人", "believer", "yangshang", "yangShang"]);
    return believer ? "bodhisattva" : "person";
  }
  const deceased2 = firstRowValue(row, ["亡者二", "第二亡者", "deceasedSecondary", "deceasedName2"]);
  if (deceased2) return "full";
  const deceased = firstRowValue(row, ["亡者", "第一亡者", "deceasedPrimary", "deceasedName", "yinGeng", "阴庚", "亡者阴庚"]);
  if (deceased) return "detail";
  return "default";
}

function summaryVariantPresetForRow(row) {
  const presets = summaryVariantPresetsFor(currentDataGroup());
  const detected = row ? detectSummaryVariantForGroup(row, currentDataGroup()) : "";
  return presets.find((variant) => variant.match === detected) || presets[0];
}

const SUMMARY_FIELD_KEY_MAP = {
  subject: "summary_subject",
  believer: "summary_believer",
  age: "summary_age",
  zodiac: "summary_zodiac",
  birthday: "summary_birthday",
  address: "summary_address",
  wish: "summary_wish",
  deceasedPrimary: "summary_deceased",
  deceasedSecondary: "summary_deceased2",
  yinGeng: "summary_yinGeng",
  yinGeng2: "summary_yinGeng2",
  deathday: "summary_deathday",
  deathday2: "summary_deathday2",
  birthday2: "summary_birthday2",
  yangshang: "summary_yangshang",
};

function summaryFieldDefinitionsForGroup(group) {
  const type = tabletTypes[group] || tabletTypes.deliverance;
  return type.fields
    .filter((f) => SUMMARY_FIELD_KEY_MAP[f.key])
    .map((f) => ({ key: SUMMARY_FIELD_KEY_MAP[f.key], label: f.label, sourceKey: f.key }));
}

function summaryFieldDefinitions(group) {
  return summaryFieldDefinitionsForGroup(group || currentDataGroup());
}

function summaryFieldsForVariant(variantKey, row = null) {
  if (!variantKey) variantKey = currentSummaryVariantKey();
  const group = variantKey?.startsWith("blessing_") ? "blessing" : variantKey?.startsWith("deliverance_") ? "deliverance" : null;
  const presets = group ? (summaryVariantPresets[group] || summaryVariantPresetsFor()) : summaryVariantPresetsFor();
  const preset = presets.find((item) => item.key === variantKey) || summaryVariantPresetForRow(row) || presets[0];
  const toggles = state.layouts[summaryTemplateIds()[0]]?.summaryFieldToggles?.[variantKey] || {};
  const definitions = summaryFieldDefinitions();
  const map = new Map(definitions.map((field) => [field.key, field]));
  const builtins = (preset?.fields || [])
    .map((key) => map.get(key))
    .filter((field) => field && toggles[field.key] !== "off")
    .filter(Boolean);
  return builtins.concat(dynamicFieldsForCurrentContext(variantKey));
}

function summaryDefaultPosition(key, variantKey = currentSummaryVariantKey()) {
  const group = variantKey?.startsWith("blessing_")
    ? "blessing"
    : variantKey?.startsWith("deliverance_")
      ? "deliverance"
      : currentDataGroup();
  const fields = summaryFieldsForVariantByGroup(group, variantKey || summaryVariantPresetsForGroup(group)[0]?.key);
  const index = Math.max(fields.findIndex((field) => field.key === key), 0);
  const topMap = {
    summary_subject: 10,
    summary_deceased: 20,
    summary_yinGeng: 28,
    summary_believer: 32,
    summary_age: 22,
    summary_zodiac: 26,
    summary_birthday: 32,
    summary_deathday: 36,
    summary_yangshang: 44,
    summary_deceased2: 52,
    summary_yinGeng2: 58,
    summary_birthday2: 64,
    summary_deathday2: 70,
    summary_address: 58,
  };
  return { x: 10, y: topMap[key] ?? (10 + index * 20) };
}

function summaryDefaultSize(key) {
  if (key === "summary_subject") return { w: 80, h: 18 };
  if (key === "summary_address") return { w: 80, h: 28 };
  if (key.startsWith("summary_deceased") || key === "summary_deceased") return { w: 80, h: 14 };
  if (key === "summary_yinGeng" || key === "summary_yinGeng2") return { w: 80, h: 14 };
  if (key === "summary_birthday" || key === "summary_birthday2") return { w: 80, h: 14 };
  if (key === "summary_deathday" || key === "summary_deathday2") return { w: 80, h: 14 };
  return { w: 80, h: 14 };
}

function summaryDefaultStyle() {
  return {
    fontSize: 22,
    color: "#16110d",
    fontFamily: "SimSun, serif",
    textAlign: "left",
    verticalAlign: "center",
  };
}

function summaryVariantPresetsForGroup(group) {
  return summaryVariantPresets[group] || summaryVariantPresets.deliverance;
}

function summaryFieldsForVariantByGroup(group, variantKey) {
  const preset = summaryVariantPresetsForGroup(group).find((item) => item.key === variantKey) || summaryVariantPresetsForGroup(group)[0];
  const definitions = summaryFieldDefinitionsForGroup(group);
  const map = new Map(definitions.map((field) => [field.key, field]));
  return (preset?.fields || []).map((key) => map.get(key)).filter(Boolean);
}

function summaryTemplateDataGroup(templateId) {
  const template = summaryTemplateById(templateId);
  const layout = state.layouts[templateId] || {};
  return template?.dataGroup || layout.summary?.dataGroup || "deliverance";
}

function isSummaryTemplateId(templateId) {
  if (TEMPLATE_CATALOG[templateId]?.mode === "single") return false;
  if (TEMPLATE_CATALOG[templateId]?.mode === "summary") return true;
  const template = summaryTemplateById(templateId);
  if (template) return isSummaryTemplate(template);
  return Boolean(state.layouts[templateId]?.summary);
}

function repairSummaryTemplateLayout(templateId) {
  const layout = state.layouts[templateId];
  if (!layout || !isSummaryTemplateId(templateId)) return false;
  if (layout.summaryRepairVersion >= SUMMARY_LAYOUT_REPAIR_VERSION) return false;

  if (!layout.positions) layout.positions = {};
  if (!layout.sizes) layout.sizes = {};
  if (!layout.styles) layout.styles = {};
  if (!layout.staticFields) layout.staticFields = [];

  const group = summaryTemplateDataGroup(templateId);
  const summaryKeys = new Set(summaryFieldDefinitionsForGroup(group).map((field) => field.key));
  let changed = false;

  ["positions", "sizes", "styles"].forEach((bucket) => {
    Object.keys(layout[bucket]).forEach((savedKey) => {
      const baseKey = savedKey.includes("__") ? savedKey.split("__").pop() : savedKey;
      if (!summaryKeys.has(baseKey)) return;
      delete layout[bucket][savedKey];
      changed = true;
    });
  });

  summaryVariantPresetsForGroup(group).forEach((variant) => {
    summaryFieldsForVariantByGroup(group, variant.key).forEach((field) => {
      setLayoutBucketValue(layout, "positions", field.key, summaryDefaultPosition(field.key, variant.key), variant.key);
      setLayoutBucketValue(layout, "sizes", field.key, summaryDefaultSize(field.key), variant.key);
      setLayoutBucketValue(layout, "styles", field.key, summaryDefaultStyle(), variant.key);
      changed = true;
    });
  });

  layout.staticFields.forEach((field, index) => {
    const pos = layout.positions[field.key];
    const size = layout.sizes[field.key];
    const style = layout.styles[field.key];
    const invalidPos = !pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y) || pos.x < 0 || pos.x > 92 || pos.y < 0 || pos.y > 92;
    const invalidSize = !size || !Number.isFinite(size.w) || !Number.isFinite(size.h) || size.w < 4 || size.w > 90 || size.h < 4 || size.h > 60;
    if (invalidPos) {
      layout.positions[field.key] = { x: 10, y: 10 + index * 16 };
      changed = true;
    }
    if (invalidSize) {
      layout.sizes[field.key] = { w: 24, h: 12 };
      changed = true;
    }
    if (!style) {
      layout.styles[field.key] = summaryDefaultStyle();
      changed = true;
    }
  });

  layout.summaryRepairVersion = SUMMARY_LAYOUT_REPAIR_VERSION;
  return changed;
}

function refreshSummaryVariantOptions() {
  const select = $("summaryVariant");
  if (!select) return;
  const variants = summaryVariantPresetsFor();
  const previous = select.value;
  select.innerHTML = variants.map((variant) => (
    `<option value="${variant.key}">${escapeHtml(variant.label)}</option>`
  )).join("");
  select.value = variants.some((variant) => variant.key === previous)
    ? previous
    : (variants[0]?.key || "");
}

function plaqueToRow(plaque) {
  const subject = plaque.plaqueType === "LONGEVITY"
    ? (plaque.holderName || plaque.name || plaque.subject || "")
    : plaque.plaqueType === "DELIVERANCE"
      ? (plaque.dedicationType === "custom" ? plaque.customDedicationType : plaque.dedicationType) || plaque.deceasedName || plaque.name || plaque.subject || ""
      : (plaque.deceasedName || plaque.holderName || plaque.name || plaque.subject || "");
  const primaryDeceased = plaque.deceasedName || "";
  const secondaryDeceased = plaque.deceasedName2 || "";
  const deceasedInfo = [primaryDeceased, secondaryDeceased].filter(Boolean).join("\n");
  const ageValue = plaque.age || "";
  const wishValue = plaque.message || plaque.blessingText || "";
  return {
    "编码": plaque.code || "",
    "牌位主体": subject || plaque.holderName || plaque.deceasedName || plaque.dedicationType || plaque.customDedicationType || "",
    "信人": plaque.yangShang || "",
    "年龄": ageValue,
    "属相": plaque.zodiac || "",
    "生日": plaque.birthDate || "",
    "忌日": plaque.deathDate || "",
    "阳上": plaque.yangShang || "",
    "地址": plaque.address || "",
    "祈福语": wishValue,
    "寄语": wishValue,
    "亡者": primaryDeceased,
    "第一亡者": primaryDeceased,
    "亡者二": secondaryDeceased,
    "第二亡者": secondaryDeceased,
    "阴庚": plaque.yinGeng || "",
    "亡者阴庚": plaque.yinGeng || "",
    "亡者阴庚": plaque.yinGeng || "",
    "亡者二阴庚": plaque.yinGeng2 || "",
    "亡者二阴庚": plaque.yinGeng2 || "",
    "亡者生日": plaque.birthDate || "",
    "亡者生日": plaque.birthDate || "",
    "亡者忌日": plaque.deathDate || "",
    "亡者忌日": plaque.deathDate || "",
    "亡者二生日": plaque.birthDate2 || "",
    "亡者二生日": plaque.birthDate2 || "",
    "亡者二忌日": plaque.deathDate2 || "",
    "亡者二忌日": plaque.deathDate2 || "",
    "亡者信息": deceasedInfo,
    "电话": plaque.phone || "",
    "牌位类型": plaque.plaqueType || "",
    "分类细项": plaque.longevitySubtype || plaque.dedicationType || plaque.customDedicationType || "",
    "规格": plaque.size || "",
    "开始日期": plaque.startDate ? String(plaque.startDate).slice(0, 10) : "",
    "结束日期": plaque.endDate ? String(plaque.endDate).slice(0, 10) : "",
    "法会": plaque.ritual?.name || plaque.ritualName || "",
    "备注": plaque.remarks || "",
    id: plaque.id || "",
  };
}

function buildFieldMapping() {
  const mapping = $("fieldMapping");
  if (!mapping) return;
  if (isEditingBackSide()) {
    mapping.innerHTML = '<p class="hint">背面固定页不使用动态字段。</p>';
    return;
  }
  if (state.mode === "summary") {
    mapping.innerHTML = "";
    buildSummaryFieldMapping();
    return;
  }
  const type = currentTabletType();
  const layout = ensureLayout(currentLayoutKey());
  const fields = state.mode === "single" ? singleFieldsForVariant() : type.fields;
  mapping.innerHTML = fields.map((field) => `
    <label>
      ${field.label}
      <select data-field-key="${field.key}">
        ${fieldOptions(field.key, field.aliases, layout.mappings || {}, currentSingleVariantKey())}
      </select>
    </label>
  `).join("");
  mapping.querySelectorAll("select").forEach((select) => {
    select.addEventListener("input", () => {
      const nextLayout = ensureLayout(currentLayoutKey());
      setMappingValueForField(nextLayout, select.dataset.fieldKey, select.value, currentSingleVariantKey());
      saveLayouts();
      render();
    });
  });
}

function buildSummaryFieldMapping() {
  const wrap = $("summaryFieldMapping");
  if (!wrap) return;
  const variantKey = currentSummaryVariantKey();
  const layout = ensureLayout(currentLayoutKey());
  const mappings = layout.summaryFieldToggles || {};
  const variantToggles = mappings[variantKey] || {};
  const variantFieldKeys = new Set(summaryFieldsForVariant(variantKey).map((field) => field.key));
  const fields = summaryFieldDefinitions().filter((field) => variantFieldKeys.has(field.key));
  wrap.innerHTML = fields.map((field) => `
    <label>
      ${field.label}
      <select data-summary-toggle="${field.key}">
        <option value="use"${variantToggles[field.key] !== "off" ? " selected" : ""}>使用</option>
        <option value="off"${variantToggles[field.key] === "off" ? " selected" : ""}>不使用</option>
      </select>
    </label>
  `).join("");
  wrap.querySelectorAll("[data-summary-toggle]").forEach((select) => {
    select.addEventListener("input", () => {
      if (!layout.summaryFieldToggles) layout.summaryFieldToggles = {};
      if (!layout.summaryFieldToggles[variantKey]) layout.summaryFieldToggles[variantKey] = {};
      layout.summaryFieldToggles[variantKey][select.dataset.summaryToggle] = select.value === "off" ? "off" : "use";
      saveLayouts();
      buildSummaryFieldMapping();
      buildStyleEditor();
      render();
    });
  });
}

function buildStyleEditor() {
  const select = $("styleField");
  if (!select) return;
  const previous = state.activeFieldKey || select.value;
  const layout = currentEditableLayout();
  const fields = state.mode === "summary"
    ? summaryFieldsForVariant().concat(staticFieldsForCurrentContext(layout, currentSummaryVariantKey()).map((field) => ({
      key: field.key,
      label: `静态：${field.text}`,
    })))
    : (isEditingBackSide() ? [] : singleFieldsForVariant()).concat(staticFieldsForCurrentContext(layout).map((field) => ({
      key: field.key,
      label: `静态：${field.text}`,
    })));
  select.innerHTML = fields.map((field) => (
    `<option value="${field.key}">${escapeHtml(field.label)}</option>`
  )).join("");
  if (fields.some((field) => field.key === previous)) {
    select.value = previous;
  } else if (state.mode === "summary" && fields.some((field) => field.key === state.activeFieldKey)) {
    select.value = state.activeFieldKey;
  } else if (fields[0]) {
    select.value = fields[0].key;
  } else {
    select.value = "";
  }
  state.activeFieldKey = select.value || "";
  syncAlignmentOptions();
  syncStyleInputs();
  syncSelectedFieldHighlight();
}

function syncStyleInputs() {
  const styleField = $("styleField");
  const fieldFontSize = $("fieldFontSize");
  const fieldColor = $("fieldColor");
  const fieldFontFamily = $("fieldFontFamily");
  const fieldTextAlign = $("fieldTextAlign");
  const fieldVerticalAlign = $("fieldVerticalAlign");
  const fieldWrapMode = $("fieldWrapMode");
  if (!styleField || !fieldFontSize || !fieldColor || !fieldFontFamily || !fieldTextAlign || !fieldVerticalAlign || !fieldWrapMode) return;

  const currentKey = styleField.value || "subject";
  state.activeFieldKey = currentKey;
  if (!currentKey) return;
  const style = normalizeFieldStyle(styleFor(currentKey));
  fieldFontSize.value = style.fontSize;
  fieldColor.value = style.color;
  fieldFontFamily.value = style.fontFamily;
  syncAlignmentOptions();
  fieldTextAlign.value = style.textAlign || "center";
  fieldVerticalAlign.value = style.verticalAlign || "center";
  fieldWrapMode.value = style.wrapMode || "anywhere";
  if (currentKey === "subject" && $("singleFont")) $("singleFont").value = style.fontSize;
  syncSelectedFieldHighlight();
}

function syncSelectedFieldHighlight() {
  document.querySelectorAll(".editable-field").forEach((element) => {
    element.classList.toggle("is-selected", element.dataset.editKey === state.activeFieldKey);
  });
}

function currentFieldIsVertical() {
  if (state.mode === "summary") return $("summaryVertical")?.checked || false;
  return $("singleVertical")?.checked || false;
}

function syncAlignmentOptions() {
  const select = $("fieldTextAlign");
  if (!select) return;
  const currentValue = select.value || "center";
  select.replaceChildren(
    new Option("左对齐", "left"),
    new Option("居中", "center"),
    new Option("右对齐", "right"),
  );
  select.value = currentValue;
}

function updateSelectedFieldStyle() {
  const styleField = $("styleField");
  const fieldFontSize = $("fieldFontSize");
  const fieldColor = $("fieldColor");
  const fieldFontFamily = $("fieldFontFamily");
  const fieldTextAlign = $("fieldTextAlign");
  const fieldVerticalAlign = $("fieldVerticalAlign");
  const fieldWrapMode = $("fieldWrapMode");
  if (!styleField || !fieldFontSize || !fieldColor || !fieldFontFamily || !fieldTextAlign || !fieldVerticalAlign || !fieldWrapMode) return;

  const key = styleField.value || "";
  if (!key) return;
  const layout = currentEditableLayout();
  const nextStyle = {
    fontSize: Number(fieldFontSize.value) || 18,
    color: fieldColor.value || "#16110d",
    fontFamily: fieldFontFamily.value || "SimSun, serif",
    textAlign: fieldTextAlign.value || "center",
    verticalAlign: fieldVerticalAlign.value || "center",
    wrapMode: fieldWrapMode.value || "anywhere",
  };
  if ((state.mode === "summary" && isSummaryFieldKey(key)) || isSingleVariantFieldKey(key)) {
    setLayoutBucketValue(layout, "styles", key, nextStyle, state.mode === "single" ? currentSingleVariantKey() : currentSummaryVariantKey());
  } else {
    if (!layout.styles) layout.styles = {};
    layout.styles[key] = nextStyle;
  }
  if (key === "subject" && $("singleFont")) $("singleFont").value = nextStyle.fontSize;
  saveLayouts();
  syncStyleInputs();
  render();
}

function normalizeFieldStyle(style = {}) {
  return {
    fontSize: style.fontSize || 18,
    color: style.color || "#16110d",
    fontFamily: style.fontFamily || "SimSun, serif",
    textAlign: style.textAlign || "center",
    verticalAlign: style.verticalAlign || "center",
    wrapMode: style.wrapMode || "anywhere",
  };
}

function syncSubjectFontSize() {
  if (state.editSide === "back") return;
  const layout = ensureLayout(currentLayoutKey());
  const fallbackFontSize = Number(normalizeFieldStyle(styleFor("subject")).fontSize) || 36;
  const nextStyle = {
    ...styleFor("subject"),
    fontSize: Number($("singleFont")?.value) || fallbackFontSize,
  };
  if (shouldScopeSingleVariantField("subject")) {
    setLayoutBucketValue(layout, "styles", "subject", nextStyle, currentSingleVariantKey());
  } else {
    if (!layout.styles) layout.styles = {};
    layout.styles.subject = nextStyle;
  }
  if ($("styleField")?.value === "subject") syncStyleInputs();
  saveLayouts();
}

function addStaticField() {
  const text = $("staticFieldText").value.trim();
  if (!text) return;

  const layout = currentEditableLayout();
  const key = `static_${Date.now()}`;
  const field = { key, text };
  if (state.mode === "single" && state.editSide !== "back") {
    field.variantVisibility = {};
    singleVariantPresetsForCurrentType().forEach((variant) => {
      field.variantVisibility[variant.key] = variant.key === currentSingleVariantKey();
    });
  }
  layout.staticFields.push(field);
  const defaultPosition = { x: 50, y: 50 };
  const defaultSize = { w: 24, h: 12 };
  const defaultStyle = {
    fontSize: 18,
    color: "#16110d",
    fontFamily: "SimSun, serif",
    textAlign: "center",
    verticalAlign: "center",
    wrapMode: "anywhere",
  };
  if (state.mode === "single" && state.editSide !== "back") {
    setLayoutBucketValue(layout, "positions", key, defaultPosition, currentSingleVariantKey());
    setLayoutBucketValue(layout, "sizes", key, defaultSize, currentSingleVariantKey());
    setLayoutBucketValue(layout, "styles", key, defaultStyle, currentSingleVariantKey());
  } else {
    layout.positions[key] = defaultPosition;
    layout.sizes[key] = defaultSize;
    layout.styles[key] = defaultStyle;
  }
  $("staticFieldText").value = "";
  saveLayouts();
  buildStyleEditor();
  buildStaticVisibilityControls();
  $("styleField").value = key;
  syncStyleInputs();
  render();
}

function addSummaryStaticField() {
  if (state.mode !== "summary") return;
  const text = $("summaryStaticFieldText").value.trim();
  if (!text) return;

  const layout = currentEditableLayout();
  const key = `static_${Date.now()}`;
  const field = { key, text, variantVisibility: {} };
  summaryVariantPresetsFor().forEach((variant) => {
    field.variantVisibility[variant.key] = variant.key === currentSummaryVariantKey();
  });
  layout.staticFields.push(field);
  layout.positions[key] = { x: 8, y: 8 };
  layout.sizes[key] = { w: 28, h: 12 };
  layout.styles[key] = {
    fontSize: Number($("summaryFont").value) || 22,
    color: "#16110d",
    fontFamily: "SimSun, serif",
  };
  $("summaryStaticFieldText").value = "";
  saveLayouts();
  buildStyleEditor();
  $("styleField").value = key;
  syncStyleInputs();
  render();
}

function fieldOptions(key, aliases, savedMappings = {}, variantKey = currentSingleVariantKey()) {
  const fields = currentFields();
  const layout = { mappings: savedMappings };
  const saved = mappingValueForField(layout, key, variantKey);
  const dynamicField = dynamicFieldDefinitionByKey(key, variantKey);
  const sourceAliases = dynamicField?.sourceKey
    ? (state.mode === "summary"
      ? (summaryFieldDefinitions().find((field) => field.key === dynamicField.sourceKey)?.aliases || [])
      : (currentTabletType().fields.find((field) => field.key === dynamicField.sourceKey)?.aliases || []))
    : [];
  const aliasList = Array.isArray(aliases) && aliases.length ? aliases : sourceAliases;
  const matched = saved !== undefined ? saved : aliasList.find((name) => fields.includes(name)) || "";
  const options = ['<option value="">不使用</option>'].concat(fields.map((field) => (
    `<option value="${escapeHtml(field)}"${field === matched ? " selected" : ""}>${escapeHtml(field)}</option>`
  )));
  return options.join("");
}

function currentTabletType() {
  const template = currentTemplate();
  const group = template?.dataGroup || "blessing";
  if (state.mode === "summary") {
    return group === "blessing" ? tabletTypes.blessing : tabletTypes.deliverance;
  }
  const type = normalizeTabletType(template?.tabletType || template?.dataGroup || "blessing");
  if (type === "custom") {
    const group = template?.dataGroup === "deliverance" ? "deliverance" : "blessing";
    const baseFields = tabletTypes[group]?.fields || [];
    const allowedFieldKeys = new Set(resolveTemplateFieldKeys(template));
    const fields = baseFields.filter((field) => allowedFieldKeys.has(field.key));
    return {
      name: templateDisplayName(template) || "自定义模板",
      fields: fields.length ? fields : baseFields,
    };
  }
  return tabletTypes[type] || tabletTypes.blessing;
}

function normalizeTabletType(type) {
  if (type === "custom") return "custom";
  return type === "deliverance" ? "deliverance" : "blessing";
}

function normalizeImportedTabletType(type) {
  if (type === "custom") return "custom";
  if (type === "deliveranceDetail" || type === "deliveranceSimple") return "deliverance";
  return normalizeTabletType(type);
}

function unscopedFieldKey(key) {
  if (typeof key !== "string") return "";
  return key
    .replace(/^single_variant_[^_]+__/, "")
    .replace(/^summary_variant_[^_]+__/, "");
}

function defaultSingleFieldKeysForGroup(group) {
  const variants = Object.values(singleVariantFieldKeysByType[group] || {});
  return Array.from(new Set(variants.flatMap((fieldKeys) => fieldKeys || []).map((key) => unscopedFieldKey(key)).filter(Boolean)));
}

function resolveTemplateFieldKeys(template = currentTemplate()) {
  if (!template) return [];
  if (Array.isArray(template.fieldKeys) && template.fieldKeys.length) {
    return Array.from(new Set(template.fieldKeys.map((key) => unscopedFieldKey(key)).filter(Boolean)));
  }
  const storedKeys = Object.keys(templateDefaults[template.id]?.positions || {})
    .map((key) => unscopedFieldKey(key))
    .filter(Boolean);
  if (storedKeys.length) return Array.from(new Set(storedKeys));
  if (template.dataGroup) return defaultSingleFieldKeysForGroup(template.dataGroup);
  return [];
}

function singleVariantDefaultValue(type, variantKey, bucket, key, fallback) {
  const variantDefaults = singleVariantLayoutDefaults[type]?.[variantKey]?.[bucket];
  if (variantDefaults && Object.prototype.hasOwnProperty.call(variantDefaults, key)) {
    return clone(variantDefaults[key]);
  }
  const templateBucket = templateDefaults[type]?.[bucket];
  if (templateBucket && Object.prototype.hasOwnProperty.call(templateBucket, key)) {
    return clone(templateBucket[key]);
  }
  return clone(fallback);
}

function createSinglePresetTemplateDefaults(dataGroup) {
  const baseId = dataGroup === "deliverance" ? "deliverance" : "blessing";
  const variantPresets = singleVariantPresetsByType[dataGroup] || [];
  const positions = {};
  const styles = {};
  const sizes = {};
  variantPresets.forEach((variant) => {
    const fieldKeys = singleVariantFieldKeysByType[dataGroup]?.[variant.key] || [];
    fieldKeys.forEach((fieldKey) => {
      positions[singleVariantStorageKey(fieldKey, variant.key)] = singleVariantDefaultValue(baseId, variant.key, "positions", fieldKey, { x: 50, y: 50 });
      styles[singleVariantStorageKey(fieldKey, variant.key)] = singleVariantDefaultValue(baseId, variant.key, "styles", fieldKey, { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif", textAlign: "center", verticalAlign: "center", wrapMode: "anywhere" });
      sizes[singleVariantStorageKey(fieldKey, variant.key)] = singleVariantDefaultValue(baseId, variant.key, "sizes", fieldKey, { w: 20, h: 20 });
    });
  });
  return { positions, styles, sizes };
}

function defaultPaperForTemplateType(templateType) {
  if (templateType === "deliverance") {
    return { width: 100, height: 280, vertical: true };
  }
  return { width: 90, height: 260, vertical: true };
}

function renderTable() {
  const wrap = $("tableWrap");
  if (!wrap) return;
  const rows = allCurrentRows();
  const fields = currentFields();
  if (!rows.length) {
    wrap.innerHTML = '<p class="empty">还没有导入数据。</p>';
    updateSelectedRowsText();
    return;
  }
  const selected = state.selectedRowIds[currentDataGroup()];
  const head = `<th class="select-col">选择</th>${fields.map((field) => `<th>${escapeHtml(field)}</th>`).join("")}`;
  const indexedHead = head.replace("</th>", "</th><th class=\"row-index-col\">序号</th>");
  const body = rows.map((row, index) => (
    `<tr>
      <td class="select-col">
        <input type="checkbox" data-row-id="${escapeHtml(row.__rowId)}"${selected.has(row.__rowId) ? " checked" : ""}>
      </td>
      <td class="row-index-col">${index + 1}</td>
      ${fields.map((field) => `<td>${escapeHtml(row[field] || "")}</td>`).join("")}
    </tr>`
  )).join("");
  wrap.innerHTML = `<table><thead><tr>${indexedHead}</tr></thead><tbody>${body}</tbody></table>`;
  wrap.querySelectorAll("[data-row-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selected.add(checkbox.dataset.rowId);
      else selected.delete(checkbox.dataset.rowId);
      state.pageIndex = 0;
      updateSelectedRowsText();
      render();
    });
  });
  updateSelectedRowsText();
}

function render() {
  closeFieldContextMenu();
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
  if (state.isDesignerPage) bindDragHandles();
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
  if (state.isDesignerPage) bindDragHandles();
  fitAllFields();
  $("statusText").textContent = `${currentDataGroupName()}汇总：共 ${rows.length} 条`;
  $("pageText").textContent = `第 ${state.pageIndex + 1} / ${totalPages} 页`;
  syncJumpPageInput(totalPages);
}

function syncJumpPageInput(total) {
  const input = $("jumpPageInput");
  if (!input) return;
  input.max = String(Math.max(total, 1));
  input.value = String(state.pageIndex + 1);
}

function isBackSideActive() {
  return state.mode === "single" && (state.renderSide || state.editSide) === "back";
}

function isEditingBackSide() {
  return state.mode === "single" && state.editSide === "back";
}

function currentEditableLayout() {
  if (isEditingBackSide()) return backLayoutFor(currentLayoutKey());
  return ensureLayout(currentLayoutKey());
}

function backLayoutFor(layoutKey) {
  const layout = ensureLayout(layoutKey);
  if (!layout.backSide || typeof layout.backSide !== "object") {
    layout.backSide = createBlankSideLayout();
  }
  normalizeSideLayout(layout.backSide);
  return layout.backSide;
}

function createBlankSideLayout() {
  return {
    positions: {},
    styles: {},
    sizes: {},
    background: "",
    staticFields: [],
    dynamicFields: [],
  };
}

function normalizeSideLayout(layout) {
  if (!layout.positions) layout.positions = {};
  if (!layout.styles) layout.styles = {};
  if (!layout.sizes) layout.sizes = {};
  if (!layout.staticFields) layout.staticFields = [];
  if (!layout.dynamicFields) layout.dynamicFields = [];
  return layout;
}

function clampSummaryFieldsIntoView() {
  if (state.mode !== "summary") return;
  const layout = ensureLayout(currentLayoutKey());
  const variantKey = currentSummaryVariantKey();
  const summaryKeys = summaryFieldsForVariant(variantKey)
    .map((field) => field.key)
    .concat((layout.staticFields || []).map((field) => field.key));
  if (!summaryKeys.length) return;
  let changed = false;
  summaryKeys.forEach((key) => {
    const pos = positionFor(key, variantKey);
    const size = sizeFor(key, variantKey);
    if (!pos || !size) return;
    const nextX = clamp(pos.x, 0, Math.max(0, 100 - (size.w || 0)));
    const nextY = clamp(pos.y, 0, Math.max(0, 100 - (size.h || 0)));
    if (nextX !== pos.x || nextY !== pos.y) {
      if (isSummaryFieldKey(key)) {
        setLayoutBucketValue(layout, "positions", key, { ...pos, x: nextX, y: nextY }, variantKey);
      } else {
        layout.positions[key] = { ...pos, x: nextX, y: nextY };
      }
      changed = true;
    }
  });
  if (changed) saveLayouts();
}

function singleSheet(row, side = state.editSide, forPrint = false) {
  const previousRenderSide = state.renderSide;
  const previousSingleVariant = state.renderSingleVariant;
  state.renderSide = side;
  state.renderSingleVariant = side === "front" ? currentSingleVariantKey(row, forPrint) : "";
  const vertical = ($("singleVertical")?.checked ?? (ensureLayout(currentLayoutKey()).paper?.vertical ?? currentTemplate().vertical ?? true)) ? " vertical-text" : "";
  const type = currentDataGroup() === "blessing" ? "blessing" : "deliverance";
  const fields = singleFieldsForVariant(state.renderSingleVariant, row, forPrint);
  const layout = side === "back" ? backLayoutFor(currentLayoutKey()) : ensureLayout(currentLayoutKey());
  const singleFontValue = Number($("singleFont")?.value) || Number(normalizeFieldStyle(styleFor("subject")).fontSize) || 36;
  const singleOffsetYValue = Number($("singleOffsetY")?.value) || 0;
  const background = layout.background && shouldPrintTemplateBackground(forPrint)
    ? `<img class="template-bg" src="${layout.background}" alt="">`
    : "";
  if (side === "back") {
    const staticFields = staticFieldsForCurrentContext(layout).map((field) => (
      draggableField(field.key, `tablet-meta static-field${vertical}`, field.text)
    )).join("");
    const html = `
      <article class="sheet duplex-back-sheet" style="${sheetVars()} --single-font:${singleFontValue}px; --offset-y:${singleOffsetYValue};">
        ${background}
        <div class="tablet tablet-${type}" data-drag-surface="1">
          ${staticFields || (forPrint ? "" : '<div class="empty back-empty">背面固定页：可上传底图或添加静态字段</div>')}
        </div>
      </article>
    `;
    state.renderSide = previousRenderSide;
    state.renderSingleVariant = previousSingleVariant;
    return html;
  }
  const details = fields
    .filter((field) => field.key !== "subject")
    .map((field, index) => {
      const content = fieldValue(row, field.key);
      const display = content
        ? content
        : `<span class="field-placeholder">${escapeHtml(field.label)}</span>`;
      return draggableField(field.key, `tablet-meta meta-${field.key} meta-${index}${vertical}`, display, !content);
    }).join("");
  const subjectContent = fieldValue(row, "subject");
  const subjectLabel = fields.find((field) => field.key === "subject")?.label || "牌位主体";
  const staticFields = staticFieldsForCurrentContext(layout, state.renderSingleVariant || currentSingleVariantKey()).map((field) => (
    draggableField(field.key, `tablet-meta static-field${vertical}`, field.text)
  )).join("");
  const html = `
    <article class="sheet" style="${sheetVars()} --single-font:${singleFontValue}px; --offset-y:${singleOffsetYValue};">
      ${background}
      <div class="tablet tablet-${type}" data-drag-surface="1">
        ${draggableField("subject", `single-field single-name${vertical}`, subjectContent || subjectLabel, !subjectContent)}
        ${details}
        ${staticFields}
      </div>
    </article>
  `;
  state.renderSide = previousRenderSide;
  state.renderSingleVariant = previousSingleVariant;
  console.log("[singleSheet] html length:", html.length, "background:", !!background, "subject:", subjectContent?.substring(0, 20), "details:", fields.length - 1, "type:", type);
  return html;
}

function formatFieldDisplay(text, style, placeholder = false) {
  if (placeholder) return text;
  const raw = String(text || "");
  if ((style?.wrapMode || "anywhere") !== "break-word") {
    return escapeHtml(raw);
  }
  const normalized = raw
    .replace(/\s+/g, " ")
    .replace(/([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼港澳使领])\s+([A-Z])/g, "$1$2");
  const plateRegex = /([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼港澳使领][A-Z][A-Z0-9]{5,6})/g;
  const tokenRegex = /([A-Za-z0-9]+(?:[-./:][A-Za-z0-9]+)*(?:\s*[号幢栋棟座层樓楼室单元單元弄梯区區户戶号楼樓巷]*)?)/g;
  const fragments = [];
  let cursor = 0;
  let plateMatch;
  while ((plateMatch = plateRegex.exec(normalized)) !== null) {
    const [plate] = plateMatch;
    const start = plateMatch.index;
    if (start > cursor) {
      fragments.push({ type: "text", value: normalized.slice(cursor, start) });
    }
    fragments.push({ type: "plate", value: plate });
    cursor = start + plate.length;
  }
  if (cursor < normalized.length) {
    fragments.push({ type: "text", value: normalized.slice(cursor) });
  }

  let lastIndex = 0;
  let result = "";
  fragments.forEach((fragment) => {
    if (fragment.type === "plate") {
      result += `<span class="no-break-token license-token">${escapeHtml(fragment.value)}</span><wbr>`;
      return;
    }
    let match;
    lastIndex = 0;
    while ((match = tokenRegex.exec(fragment.value)) !== null) {
      const [fullMatch] = match;
      const start = match.index;
      if (start > lastIndex) {
        result += escapeHtml(fragment.value.slice(lastIndex, start));
      }
      if (/[A-Za-z0-9]/.test(fullMatch)) {
        result += `<span class="no-break-token">${escapeHtml(fullMatch.replace(/\s+/g, ""))}</span>`;
      } else {
        result += escapeHtml(fullMatch);
      }
      lastIndex = start + fullMatch.length;
    }
    if (lastIndex < fragment.value.length) {
      result += escapeHtml(fragment.value.slice(lastIndex));
    }
    tokenRegex.lastIndex = 0;
  });
  return result;
}

function draggableField(key, className, content, placeholder = false, variantKey = "") {
  const pos = positionFor(key, variantKey);
  const style = normalizeFieldStyle(styleFor(key, variantKey));
  const size = sizeFor(key, variantKey);
  const placeholderClass = placeholder ? " is-placeholder" : "";
  const align = alignmentStyle(style, className.includes("vertical-text"));
  const wrapStyle = wrapModeStyle(style?.wrapMode, className.includes("vertical-text"));
  const displayContent = formatFieldDisplay(content, style, placeholder);
  return `
    <div class="${className} editable-field${placeholderClass}" data-edit-key="${key}" data-wrap-mode="${style.wrapMode || "anywhere"}" data-base-font="${style.fontSize}" style="left:${pos.x}%; top:${pos.y}%; width:${size.w}%; height:${size.h}%; font-size:${style.fontSize}px; color:${style.color}; font-family:${style.fontFamily}; text-align:${align.textAlign};">
      <div class="field-content" style="text-align:${align.textAlign}; justify-content:${align.justifyContent}; align-items:${align.alignItems}; white-space:${wrapStyle.whiteSpace}; overflow-wrap:${wrapStyle.overflowWrap}; word-break:${wrapStyle.wordBreak};"><span class="field-flow">${displayContent}</span></div>
    </div>
  `;
}

function alignmentStyle(style, vertical = false) {
  const textAlign = style?.textAlign || "center";
  const verticalAlign = style?.verticalAlign || "center";
  const horizontalAlign = textAlign === "left" ? "flex-start" : (textAlign === "right" ? "flex-end" : "center");
  const verticalBlockAlign = verticalAlign === "start" ? "flex-start" : (verticalAlign === "end" ? "flex-end" : "center");
  if (vertical) {
    const verticalHorizontalAlign = textAlign === "left" ? "flex-end" : (textAlign === "right" ? "flex-start" : "center");
    return {
      textAlign: "center",
      justifyContent: verticalBlockAlign,
      alignItems: verticalHorizontalAlign,
    };
  }
  return {
    textAlign,
    justifyContent: horizontalAlign,
    alignItems: verticalBlockAlign,
  };
}

function wrapModeStyle(mode, vertical = false) {
  if (vertical) {
    if (mode === "nowrap") {
      return {
        whiteSpace: "nowrap",
        overflowWrap: "normal",
        wordBreak: "normal",
      };
    }
    if (mode === "normal") {
      return {
        whiteSpace: "pre-wrap",
        overflowWrap: "normal",
        wordBreak: "keep-all",
      };
    }
    return {
      whiteSpace: "normal",
      overflowWrap: mode === "anywhere" ? "anywhere" : "normal",
      wordBreak: mode === "break-word" ? "keep-all" : "normal",
    };
  }
  if (mode === "nowrap") {
    return {
      whiteSpace: "nowrap",
      overflowWrap: "normal",
      wordBreak: "normal",
    };
  }
  if (mode === "normal") {
    return {
      whiteSpace: "pre-wrap",
      overflowWrap: "normal",
      wordBreak: "keep-all",
    };
  }
  if (mode === "break-word") {
    return {
      whiteSpace: "normal",
      overflowWrap: "break-word",
      wordBreak: "keep-all",
    };
  }
  return {
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    wordBreak: "normal",
  };
}

function summarySheet(pageRows, forPrint = false) {
  const columns = Number($("columnCount").value) || 3;
  const layout = ensureLayout(currentLayoutKey());
  const verticalClass = $("summaryVertical").checked ? " vertical-text" : "";
  const pageMargin = Number($("pageMargin").value) || 0;
  const columnGap = Number($("columnGap").value) || 0;
  const background = layout.background && shouldPrintTemplateBackground(forPrint)
    ? `<img class="template-bg" src="${layout.background}" alt="">`
    : "";
  const selectedVariantKey = currentSummaryVariantKey();
  const preferredEditorRow = pageRows.find((row) => row && (summaryVariantPresetForRow(row)?.key || "") === selectedVariantKey) || pageRows[0] || null;
  const columnHtml = Array.from({ length: columns }, (_, columnIndex) => {
    const row = forPrint
      ? (pageRows[columnIndex] || null)
      : (columnIndex === 0 ? preferredEditorRow : null);
    const variantKey = forPrint
      ? (row ? (summaryVariantPresetForRow(row)?.key || selectedVariantKey) : selectedVariantKey)
      : selectedVariantKey;
    const visibleStaticFields = staticFieldsForCurrentContext(layout, variantKey);
    const staticFields = visibleStaticFields.map((field) => ({
      key: field.key,
      label: `静态：${field.text}`,
      text: field.text,
    }));
    const fields = (forPrint || columnIndex === 0)
      ? summaryFieldsForVariant(variantKey, row).concat(staticFields).map((field) => {
      const staticField = visibleStaticFields.find((item) => item.key === field.key);
      const text = staticField ? staticField.text : (row ? fieldValue(row, field.sourceKey) : "");
      const content = text
        ? escapeHtml(text)
        : `<span class="field-placeholder">${escapeHtml(field.label)}</span>`;
      return draggableField(field.key, `summary-field${verticalClass}`, content, !text, variantKey);
    }).join("")
      : "";
    const variantLabel = summaryVariantPresetsFor().find((item) => item.key === variantKey)?.label || "";
    return `
      <div class="summary-column summary-cell${row ? "" : " empty"}${!forPrint && columnIndex > 0 ? " summary-guide-column" : ""}${!forPrint && columnIndex === 0 ? " summary-editor-surface" : ""}"${!forPrint && columnIndex === 0 ? ' data-drag-surface="1"' : ""}>
        ${!forPrint && columnIndex === 0 && variantLabel ? `<div class="summary-variant-badge">${escapeHtml(variantLabel)}</div>` : ""}
        ${forPrint && row && variantLabel ? "" : ""}
        ${fields}
      </div>
    `;
  }).join("");
  return `
    <article class="sheet" style="${sheetVars()} --columns:${columns}; --page-margin:${pageMargin}; --column-gap:${columnGap}; --summary-font:${Number($("summaryFont").value) || 22}px;">
      ${background}
      <div class="summary-page summary-layout-grid${forPrint ? "" : " summary-edit-mode"}">${columnHtml}</div>
    </article>
  `;
}

async function printAll() {
  await printRangeFrom(0);
}

async function printFromPage() {
  const target = Number($("jumpPageInput")?.value) || state.pageIndex + 1;
  const startIndex = Math.max(target - 1, 0);
  await printRangeFrom(startIndex);
}

async function printRangeFrom(startIndex = 0) {
  syncPrintSize();
  state.restorePageIndex = state.pageIndex;
  if (state.mode === "single") {
    const allRows = currentRows().length ? currentRows() : [{}];
    const rows = allRows.slice(clamp(startIndex, 0, Math.max(allRows.length - 1, 0)));
    const layout = ensureLayout(currentLayoutKey());
    $("preview").innerHTML = rows.map((row) => {
      const front = singleSheet(row, "front", true);
      return layout.duplex?.enabled ? front + singleSheet(row, "back", true) : front;
    }).join("");
  } else {
    const rows = currentRows();
    const columns = Number($("columnCount").value) || 3;
    const pageSize = columns;
    const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
    const startPage = clamp(startIndex, 0, totalPages - 1);
    const pages = Array.from({ length: totalPages - startPage }, (_, offset) => {
      const start = (startPage + offset) * pageSize;
      return summarySheet(rows.slice(start, start + pageSize), true);
    });
    $("preview").innerHTML = pages.join("");
  }
  if (state.isDesignerPage) bindDragHandles();
  await fitAllFields();
  await waitForPrintPreviewReady();
  window.addEventListener("afterprint", restoreAfterPrint, { once: true });
  window.print();
}

function restoreAfterPrint() {
  state.pageIndex = state.restorePageIndex;
  render();
}

function jumpToPage() {
  const target = Number($("jumpPageInput")?.value) || 1;
  const maxIndex = state.mode === "summary"
    ? Math.max(Math.ceil(currentRows().length / (Number($("columnCount").value) || 3)), 1) - 1
    : Math.max(currentRows().length, 1) - 1;
  state.pageIndex = clamp(target - 1, 0, maxIndex);
  if (state.mode === "single") state.singleVariantManualOverride = false;
  render();
}

function changePage(delta) {
  state.pageIndex += delta;
  if (state.mode === "single") state.singleVariantManualOverride = false;
  render();
}

function value(row, field) {
  return field ? String(row[field] || "") : "";
}

function currentRows() {
  const rows = allCurrentRows() || [];
  const selected = state.selectedRowIds[currentDataGroup()];
  if (!selected.size) return rows;
  return rows.filter((row) => selected.has(row.__rowId));
}

function allCurrentRows() {
  return state.datasets[currentDataGroup()] || [];
}

function currentFields() {
  const configured = SINGLE_TABLE_FIELDS[currentDataGroup()];
  if (Array.isArray(configured) && configured.length) return configured;
  return Array.from(new Set(allCurrentRows().flatMap((row) => Object.keys(row))))
    .filter((field) => !field.startsWith("__") && field !== "id");
}

function selectAllCurrentRows() {
  const selected = state.selectedRowIds[currentDataGroup()];
  allCurrentRows().forEach((row) => selected.add(row.__rowId));
  state.pageIndex = 0;
  renderTable();
  render();
}

function clearSelectedRows() {
  state.selectedRowIds[currentDataGroup()].clear();
  state.pageIndex = 0;
  renderTable();
  render();
}

function updateSelectedRowsText() {
  const rows = allCurrentRows();
  const selected = state.selectedRowIds[currentDataGroup()];
  const text = selected.size
    ? `已选择 ${selected.size} / ${rows.length} 条`
    : rows.length ? `未选择时默认打印全部 ${rows.length} 条` : "未选择时默认打印全部";
  $("selectedRowsText").textContent = text;
}

function currentDataGroup() {
  const template = currentTemplate();
  if (template?.dataGroup) return template.dataGroup === "blessing" ? "blessing" : "deliverance";
  return normalizeTabletType(template?.tabletType || "blessing") === "blessing" ? "blessing" : "deliverance";
}

function currentDataGroupName() {
  return dataGroupLabel(currentDataGroup());
}

function loadAllSamples() {
  state.datasets.blessing = sampleData.blessing.map((row, index) => normalizeRow(row, "blessing", index));
  state.datasets.deliverance = sampleData.deliverance.map((row, index) => normalizeRow(row, "deliverance", index));
  state.pageIndex = 0;
  state.singleVariantManualOverride = false;
  buildFieldMapping();
  buildStyleEditor();
  renderTable();
  updateDataHint();
  applySummaryDefault(true);
  render();
}

function updateDataHint() {
  if ($("dataHint")) $("dataHint").textContent = `当前导入目标：${currentDataGroupName()}数据。延生和超度数据分开保存、分开预览、分开打印。`;
}

function applySummaryDefault(force = false) {
  if (!$("summaryFormat")) return;
  if (state.mode === "summary") refreshSummaryVariantOptions();
  const nextDefault = defaultSummaryFormat();
  if (force || !$("summaryFormat").value.trim() || $("summaryFormat").value === state.lastSummaryDefault) {
    $("summaryFormat").value = nextDefault;
  }
  state.lastSummaryDefault = nextDefault;
}

function defaultSummaryFormat() {
  const fields = summaryFieldDefinitions().map((field) => `{{${field.label}}}`);
  return fields.join("\n");
}

function resolveFieldNameForKey(key) {
  const dynamicField = dynamicFieldDefinitionByKey(key, state.renderSingleVariant || currentSingleVariantKey());
  if (dynamicField?.sourceKey) {
    return resolveFieldNameForKey(dynamicField.sourceKey);
  }
  const select = document.querySelector(`[data-field-key="${key}"]`);
  if (select) return select.value || "";
  const layout = ensureLayout(currentLayoutKey());
  const variantKey = state.renderSingleVariant || currentSingleVariantKey();
  const savedMapping = mappingValueForField(layout, key, variantKey);
  if (savedMapping !== undefined) {
    return savedMapping || "";
  }
  const field = singleFieldsForVariant().find((item) => item.key === key) || currentTabletType().fields.find((item) => item.key === key);
  if (!field) return "";
  const fields = currentFields();
  return field.aliases.find((name) => fields.includes(name)) || field.label;
}

function fieldValue(row, key) {
  if (isSummaryFieldKey(key)) {
    const definition = summaryFieldDefinitions().find((field) => field.key === key) || dynamicFieldDefinitionByKey(key, currentSummaryVariantKey());
    return definition ? fieldValue(row, definition.sourceKey) : "";
  }
  const dynamicField = dynamicFieldDefinitionByKey(key, state.renderSingleVariant || currentSingleVariantKey());
  if (dynamicField?.sourceKey) {
    return fieldValue(row, dynamicField.sourceKey);
  }
  const fieldName = resolveFieldNameForKey(key);
  return fieldName ? value(row, fieldName) : "";
}

function currentFieldMappings() {
  const layout = ensureLayout(currentLayoutKey());
  const mappings = { ...(layout.mappings || {}) };
  Array.from(document.querySelectorAll("[data-field-key]")).forEach((select) => {
    const key = select.dataset.fieldKey;
    const targetKey = shouldScopeSingleVariantField(key)
      ? singleVariantStorageKey(key, currentSingleVariantKey())
      : key;
    mappings[targetKey] = select.value;
  });
  return mappings;
}

function loadLayouts() {
  try {
    const parsed = JSON.parse(safeStorageGet("tabletPrintLayouts") || "{}");
    return migrateLegacySingleVariantLayouts(deserializeStoredLayouts(parsed));
  } catch {
    return {};
  }
}

function saveLayouts() {
  safeStorageSet("tabletPrintLayouts", JSON.stringify(serializeLayoutsForStorage(state.layouts)));
}

function migrateLegacySingleVariantLayouts(layouts) {
  if (!layouts || typeof layouts !== "object") return {};
  const migrated = {};
  Object.entries(layouts).forEach(([layoutId, layout]) => {
    if (!layout || typeof layout !== "object") {
      migrated[layoutId] = layout;
      return;
    }
    const nextLayout = clone(layout);
    if (nextLayout.singleVariantKey) {
      nextLayout.singleVariantKey = normalizeSingleVariantKey(nextLayout.singleVariantKey);
    }
    ["positions", "styles", "sizes", "mappings"].forEach((bucket) => {
      nextLayout[bucket] = migrateLegacyScopedKeys(nextLayout[bucket]);
    });
    if (Array.isArray(nextLayout.staticFields)) {
      nextLayout.staticFields = nextLayout.staticFields.map((field) => {
        if (!field || typeof field !== "object" || !field.variantVisibility || typeof field.variantVisibility !== "object") {
          return field;
        }
        return {
          ...field,
          variantVisibility: migrateLegacyVariantVisibility(field.variantVisibility),
        };
      });
    }
    migrated[layoutId] = nextLayout;
  });
  return migrated;
}

function migrateLegacyScopedKeys(bucket) {
  if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) return bucket;
  const migrated = {};
  Object.entries(bucket).forEach(([key, value]) => {
    let nextKey = key;
    nextKey = nextKey.replace(/^single_variant_blessing_bodhisattva__/, "single_variant_layout_one__");
    nextKey = nextKey.replace(/^single_variant_blessing_person__/, "single_variant_layout_two__");
    migrated[nextKey] = value;
  });
  return migrated;
}

function serializeLayoutsForStorage(layouts) {
  if (!layouts || typeof layouts !== "object") return {};
  const serialized = {};
  Object.entries(layouts).forEach(([layoutId, layout]) => {
    if (!layout || typeof layout !== "object") {
      serialized[layoutId] = layout;
      return;
    }
    const nextLayout = clone(layout);
    if (typeof nextLayout.background === "string" && nextLayout.background.startsWith("data:")) {
      delete nextLayout.background;
    }
    serialized[layoutId] = nextLayout;
  });
  return serialized;
}

function deserializeStoredLayouts(layouts) {
  if (!layouts || typeof layouts !== "object") return {};
  const restored = {};
  Object.entries(layouts).forEach(([layoutId, layout]) => {
    if (!layout || typeof layout !== "object") {
      restored[layoutId] = layout;
      return;
    }
    restored[layoutId] = {
      ...layout,
      background: typeof layout.background === "string" ? layout.background : "",
    };
  });
  return restored;
}
