const templates = [
  { id: "blessing", name: "延生禄位", width: 90, height: 260, font: 36, vertical: true, tabletType: "blessing" },
  { id: "deliveranceDetail", name: "超度牌位 - 详细", width: 100, height: 280, font: 34, vertical: true, tabletType: "deliveranceDetail" },
  { id: "deliveranceSimple", name: "超度牌位 - 简版", width: 100, height: 260, font: 36, vertical: true, tabletType: "deliveranceSimple" },
  { id: "a4summary", name: "A4 汇总多列", width: 210, height: 297, font: 22, vertical: false },
  { id: "a3summary", name: "A3 汇总多列", width: 297, height: 420, font: 22, vertical: false },
];

const templateDefaults = {
  blessing: {
    positions: {
      subject: { x: 50, y: 27 },
      believer: { x: 82, y: 18 },
      age: { x: 71, y: 18 },
      zodiac: { x: 60, y: 18 },
      birthday: { x: 49, y: 18 },
      address: { x: 22, y: 24 },
      wish: { x: 50, y: 74 },
    },
    styles: {
      subject: { fontSize: 36, color: "#16110d", fontFamily: "SimSun, serif" },
      believer: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      age: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      zodiac: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      birthday: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      address: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      wish: { fontSize: 19, color: "#6e1517", fontFamily: "KaiTi, STKaiti, serif" },
    },
    sizes: {
      subject: { w: 28, h: 42 },
      believer: { w: 9, h: 36 },
      age: { w: 9, h: 32 },
      zodiac: { w: 9, h: 32 },
      birthday: { w: 9, h: 38 },
      address: { w: 11, h: 45 },
      wish: { w: 58, h: 18 },
    },
  },
  deliveranceDetail: {
    positions: {
      subject: { x: 50, y: 27 },
      yinGeng: { x: 84, y: 18 },
      birthday: { x: 73, y: 18 },
      deathday: { x: 62, y: 18 },
      yangshang: { x: 22, y: 20 },
      address: { x: 16, y: 37 },
    },
    styles: {
      subject: { fontSize: 34, color: "#16110d", fontFamily: "SimSun, serif" },
      yinGeng: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      birthday: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      deathday: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      yangshang: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      address: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
    },
    sizes: {
      subject: { w: 28, h: 44 },
      yinGeng: { w: 9, h: 36 },
      birthday: { w: 9, h: 36 },
      deathday: { w: 9, h: 36 },
      yangshang: { w: 11, h: 42 },
      address: { w: 11, h: 45 },
    },
  },
  deliveranceSimple: {
    positions: {
      subject: { x: 50, y: 27 },
      yangshang: { x: 25, y: 21 },
      address: { x: 17, y: 38 },
    },
    styles: {
      subject: { fontSize: 36, color: "#16110d", fontFamily: "SimSun, serif" },
      yangshang: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
      address: { fontSize: 17, color: "#16110d", fontFamily: "SimSun, serif" },
    },
    sizes: {
      subject: { w: 30, h: 44 },
      yangshang: { w: 12, h: 42 },
      address: { w: 12, h: 45 },
    },
  },
};

const tabletTypes = {
  blessing: {
    name: "延生禄位",
    fields: [
      { key: "subject", label: "牌位主体", aliases: ["牌位主体", "主体", "姓名", "名称"] },
      { key: "believer", label: "信人", aliases: ["信人", "阳上", "阳上人"] },
      { key: "age", label: "年龄", aliases: ["年龄", "岁数"] },
      { key: "zodiac", label: "生肖", aliases: ["生肖", "属相"] },
      { key: "birthday", label: "生日年月日", aliases: ["生日年月日", "生日", "出生年月日", "出生日期", "生辰"] },
      { key: "address", label: "地址", aliases: ["地址", "住址"] },
      { key: "wish", label: "祈福语", aliases: ["祈福语", "祈愿", "备注"] },
    ],
  },
  deliveranceDetail: {
    name: "超度牌位 - 详细",
    fields: [
      { key: "subject", label: "牌位主体", aliases: ["牌位主体", "主体", "姓名", "名称"] },
      { key: "yinGeng", label: "阴庚", aliases: ["阴庚", "亡者阴庚"] },
      { key: "birthday", label: "生日", aliases: ["生日", "出生日期", "生辰"] },
      { key: "deathday", label: "忌日", aliases: ["忌日", "往生日", "死亡日期"] },
      { key: "yangshang", label: "阳上", aliases: ["阳上", "阳上人", "信人"] },
      { key: "address", label: "地址", aliases: ["地址", "住址"] },
    ],
  },
  deliveranceSimple: {
    name: "超度牌位 - 简版",
    fields: [
      { key: "subject", label: "牌位主体", aliases: ["牌位主体", "主体", "姓名", "名称"] },
      { key: "yangshang", label: "阳上", aliases: ["阳上", "阳上人", "信人"] },
      { key: "address", label: "地址", aliases: ["地址", "住址"] },
    ],
  },
};

const sampleData = {
  blessing: [
  { "牌位主体": "张三延生禄位", "信人": "张三", "年龄": "四十八岁", "生肖": "属龙", "生日年月日": "1978年正月初三", "地址": "本市东街一号", "祈福语": "消灾延寿 福慧增长" },
  { "牌位主体": "李四延生禄位", "信人": "李四", "年龄": "五十二岁", "生肖": "属鼠", "生日年月日": "1974年二月初八", "地址": "本市南街二号", "祈福语": "身体康泰 所求如意" },
  ],
  deliverance: [
  { "牌位主体": "王五超度莲位", "信人": "王五", "年龄": "六十岁", "生肖": "属马", "地址": "本市西街三号", "祈福语": "离苦得乐 往生净土", "阳上": "王家眷属", "阴庚": "甲午年", "生日": "三月十二", "忌日": "八月初一" },
  { "牌位主体": "赵六超度莲位", "信人": "赵六", "年龄": "七十一岁", "生肖": "属蛇", "地址": "本市北街四号", "祈福语": "蒙佛接引 莲品增上", "阳上": "赵氏后人", "阴庚": "乙巳年", "生日": "四月十八", "忌日": "十月初二" },
  ],
};

const state = {
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
};

const $ = (id) => document.getElementById(id);

const controls = [
  "templateSelect", "paperSelect", "paperWidth", "paperHeight", "tabletType",
  "singleFont", "singleOffsetY", "singleVertical",
  "styleField", "fieldFontSize", "fieldColor", "fieldFontFamily", "staticFieldText",
  "showBg",
  "summaryDataGroup", "summaryFormat", "columnCount", "rowsPerColumn", "summaryFont",
  "summaryLineGap", "pageMargin", "columnGap", "summaryVertical",
].map($);

function init() {
  migrateStoredLayouts();
  templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    $("templateSelect").appendChild(option);
  });

  loadCustomTemplatesFromStorage();

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  $("sampleBtn").addEventListener("click", () => loadRows(sampleData[currentDataGroup()]));
  $("pasteBtn").addEventListener("click", () => loadRows(parseDelimited($("pasteInput").value)));
  $("loadBlessingDataBtn").addEventListener("click", () => loadSystemPlaques("blessing"));
  $("loadDeliveranceDataBtn").addEventListener("click", () => loadSystemPlaques("deliverance"));
  $("selectAllRowsBtn").addEventListener("click", selectAllCurrentRows);
  $("clearSelectedRowsBtn").addEventListener("click", clearSelectedRows);
  $("fileInput").addEventListener("change", handleFile);
  $("bgInput").addEventListener("change", handleBackground);
  $("saveTemplateBtn").addEventListener("click", saveCurrentLayout);
  $("resetTemplateBtn").addEventListener("click", resetCurrentLayout);
  $("printBtn").addEventListener("click", printAll);
  $("prevBtn").addEventListener("click", () => changePage(-1));
  $("nextBtn").addEventListener("click", () => changePage(1));
  $("paperSelect").addEventListener("change", applyPaperPreset);
  $("templateSelect").addEventListener("change", applyTemplate);
  $("addStaticFieldBtn").addEventListener("click", addStaticField);
  $("deleteTemplateBtn").addEventListener("click", deleteCurrentTemplate);

  document.getElementById("selectAllFields").addEventListener("click", () => {
    document.querySelectorAll(".field-checkbox").forEach(cb => cb.checked = true);
  });

  document.getElementById("deselectAllFields").addEventListener("click", () => {
    document.querySelectorAll(".field-checkbox").forEach(cb => cb.checked = false);
  });

  document.getElementById("newTemplateBtn").addEventListener("click", () => {
    renderFieldSelection();
    document.getElementById("newTemplateName").value = "";
    document.getElementById("newTemplateWidth").value = $("paperWidth").value || (state.mode === "summary" ? "210" : "90");
    document.getElementById("newTemplateHeight").value = $("paperHeight").value || (state.mode === "summary" ? "297" : "260");
    document.getElementById("newTemplateVertical").checked = state.mode !== "summary" && $("singleVertical").checked;
    document.getElementById("fieldSelection").closest("fieldset").hidden = state.mode === "summary";
    document.getElementById("newTemplateDialog").showModal();
  });

  document.getElementById("cancelNewTemplate").addEventListener("click", () => {
    document.getElementById("newTemplateDialog").close();
  });

  document.getElementById("newTemplateDialog").addEventListener("click", (e) => {
    if (e.target === document.getElementById("newTemplateDialog")) {
      document.getElementById("newTemplateDialog").close();
    }
  });

  controls.forEach((control) => control.addEventListener("input", () => {
    if (control.id === "tabletType" || control.id === "summaryDataGroup") {
      state.pageIndex = 0;
      buildFieldMapping();
      buildStyleEditor();
      renderTable();
      updateDataHint();
      applySummaryDefault(control.id === "summaryDataGroup");
      ensureLayout(currentLayoutKey());
    }
    if (control.id === "styleField") syncStyleInputs();
    if (["fieldFontSize", "fieldColor", "fieldFontFamily"].includes(control.id)) updateSelectedFieldStyle();
    if (control.id === "singleFont") syncSubjectFontSize();
    render();
  }));

  document.getElementById("confirmNewTemplate").addEventListener("click", createCustomTemplate);
  applyTemplate();
  loadAllSamples();
  loadServerTemplates();
  loadRitualOptions();
  loadDedicationTypeOptions();
  applyLaunchParams();
}

function setMode(mode) {
  state.mode = mode;
  state.pageIndex = 0;
  if (mode === "summary" && !isSummaryTemplate(currentTemplate())) {
    $("templateSelect").value = "a4summary";
  }
  if (mode === "single" && isSummaryTemplate(currentTemplate())) {
    $("templateSelect").value = $("tabletType").value || "blessing";
  }
  syncControlsFromSelectedTemplate();
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  $("singleSettings").hidden = mode !== "single";
  $("summarySettings").hidden = mode !== "summary";
  buildFieldMapping();
  buildStyleEditor();
  renderTable();
  updateDataHint();
  applySummaryDefault();
  render();
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
  const template = currentTemplate();
  const layout = ensureLayout(template.id);
  syncControlsFromSelectedTemplate();
  if (template.tabletType) $("tabletType").value = template.tabletType;
  if (isSummaryTemplate(template)) {
    setMode("summary");
    renderTable();
    updateDataHint();
  } else {
    setMode("single");
    $("paperSelect").value = "custom";
  }
  render();
}

function currentTemplate() {
  return templates.find((item) => item.id === $("templateSelect").value) || templates[0];
}

function syncControlsFromSelectedTemplate() {
  const template = currentTemplate();
  const layout = ensureLayout(template.id);
  $("paperWidth").value = layout.paper?.width || template.width;
  $("paperHeight").value = layout.paper?.height || template.height;
  $("paperSelect").value = paperPresetForSize(Number($("paperWidth").value), Number($("paperHeight").value));
  if (isSummaryTemplate(template)) {
    applySavedSummarySettings(layout.summary);
  } else {
    $("singleFont").value = template.font;
    $("singleVertical").checked = layout.paper?.vertical ?? template.vertical;
  }
}

function paperPresetForSize(width, height) {
  if (width === 297 && height === 420) return "A3";
  if (width === 210 && height === 297) return "A4";
  if (width === 148 && height === 210) return "A5";
  return "custom";
}

async function deleteCurrentTemplate() {
  const template = currentTemplate();
  if (!template.id.startsWith("custom_")) {
    alert("内置模板不能删除。");
    return;
  }

  if (!confirm(`确定删除模板“${template.name}”吗？`)) return;

  const nextTemplateId = isSummaryTemplate(template)
    ? "a4summary"
    : (template.dataGroup === "blessing" ? "blessing" : "deliveranceSimple");

  const index = templates.findIndex((item) => item.id === template.id);
  if (index >= 0) templates.splice(index, 1);
  delete templateDefaults[template.id];
  delete state.layouts[template.id];
  const remoteId = state.remoteTemplateIds[template.id];
  if (remoteId && authToken()) {
    try {
      await fetchJson(`/api/plaque-templates/${remoteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch (error) {
      console.warn("删除服务器模板失败:", error);
    }
  }
  delete state.remoteTemplateIds[template.id];
  saveRemoteTemplateIds();

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
  const reader = new FileReader();
  reader.onload = () => {
    const layout = ensureLayout(currentLayoutKey());
    layout.background = String(reader.result || "");
    $("showBg").checked = true;
    saveLayouts();
    render();
  };
  reader.readAsDataURL(file);
}

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
  state.datasets[group] = rows
    .filter((row) => Object.values(row).some((value) => String(value).trim()))
    .map((row, index) => normalizeRow(row, group, index));
  state.selectedRowIds[group].clear();
  state.pageIndex = 0;
  buildFieldMapping();
  buildStyleEditor();
  renderTable();
  updateDataHint();
  applySummaryDefault(true);
  render();
}

async function loadSystemPlaques(group) {
  const token = authToken();
  if (!token) {
    alert("请先登录后台系统，再读取系统牌位数据。");
    return;
  }

  const previousMode = state.mode;
  if (group === "blessing") {
    $("tabletType").value = "blessing";
    $("summaryDataGroup").value = "blessing";
  } else {
    if ($("tabletType").value === "blessing") $("tabletType").value = "deliveranceSimple";
    $("summaryDataGroup").value = "deliverance";
  }

  try {
    setBusy(`正在读取${group === "blessing" ? "延生" : "往生/超度"}数据...`);
    const selectedType = $("systemPlaqueType").value;
    const subtype = $("systemPlaqueSubtype").value;
    const allowedTypes = group === "blessing" ? ["LONGEVITY"] : ["REBIRTH", "DELIVERANCE"];
    const plaqueTypes = selectedType && allowedTypes.includes(selectedType) ? [selectedType] : allowedTypes;
    const status = $("systemStatus").value;
    const keyword = $("systemKeyword").value.trim();
    const ritualId = $("systemRitual").value;
    const batches = await Promise.all(plaqueTypes.map((plaqueType) => fetchJson(`/api/plaques?${new URLSearchParams({
      plaqueType,
      ...(status ? { status } : {}),
      ...(keyword ? { keyword } : {}),
      ...(ritualId ? { ritualId } : {}),
    }).toString()}`, {
      headers: authHeaders(),
    })));
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
    if (previousMode === "summary") $("summaryDataGroup").value = group;
    buildFieldMapping();
    buildStyleEditor();
    renderTable();
    updateDataHint();
    applySummaryDefault(true);
    render();
    setBusy(`已读取${rows.length}条${group === "blessing" ? "延生" : "往生/超度"}数据`);
  } catch (error) {
    console.error("读取系统数据失败:", error);
    alert(error.message || "读取系统数据失败");
    setBusy("读取系统数据失败");
  }
}

async function applyLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  const plaqueId = params.get("plaqueId");
  const type = params.get("type");
  if (!plaqueId && !type) return;
  if (!authToken()) return;

  const group = type === "LONGEVITY" ? "blessing" : "deliverance";
  if (state.mode !== "single") setMode("single");
  if (type === "LONGEVITY") {
    $("tabletType").value = "blessing";
  } else if (type === "REBIRTH") {
    $("tabletType").value = "deliveranceDetail";
  } else if (type === "DELIVERANCE") {
    $("tabletType").value = "deliveranceSimple";
  }
  $("summaryDataGroup").value = group;

  try {
    setBusy("正在载入牌位数据...");
    const query = new URLSearchParams({
      ...(type ? { plaqueType: type } : {}),
      ...(!plaqueId && ($("systemStatus").value || "ACTIVE")
        ? { status: $("systemStatus").value || "ACTIVE" }
        : {}),
    });
    const plaques = await fetchJson(`/api/plaques?${query.toString()}`, { headers: authHeaders() });
    const rows = plaques
      .map(plaqueToRow)
      .map((row, index) => normalizeRow(row, group, index));
    state.datasets[group] = rows;
    state.selectedRowIds[group].clear();
    if (plaqueId) state.selectedRowIds[group].add(plaqueId);
    state.pageIndex = Math.max(0, rows.findIndex((row) => row.__rowId === plaqueId));
    buildFieldMapping();
    buildStyleEditor();
    renderTable();
    updateDataHint();
    applySummaryDefault(true);
    render();
    setBusy(plaqueId ? "已载入当前牌位" : `已载入${rows.length}条数据`);
  } catch (error) {
    console.error("载入入口数据失败:", error);
    setBusy("载入入口数据失败");
  }
}

async function loadRitualOptions() {
  if (!authToken()) return;
  try {
    const rituals = await fetchJson("/api/rituals", { headers: authHeaders() });
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
    const settings = await fetchJson("/api/system/settings");
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
  return { ...row, __rowId: String(rowId) };
}

function plaqueToRow(plaque) {
  const subject = plaque.plaqueType === "LONGEVITY"
    ? (plaque.holderName ? `${plaque.holderName}延生禄位` : "")
    : (plaque.deceasedName ? `${plaque.deceasedName}超度莲位` : "");
  return {
    "牌位主体": subject || plaque.holderName || plaque.deceasedName || "",
    "信人": plaque.holderName || plaque.yangShang || "",
    "年龄": "",
    "生肖": plaque.zodiac || "",
    "生日年月日": plaque.birthDate || "",
    "生日": plaque.birthDate || "",
    "忌日": plaque.deathDate || "",
    "阴庚": "",
    "阳上": plaque.yangShang || "",
    "地址": plaque.address || "",
    "祈福语": plaque.blessingText || "",
    "电话": plaque.phone || "",
    "牌位类型": plaque.plaqueType || "",
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
  const type = currentTabletType();
  const layout = ensureLayout(currentLayoutKey());
  mapping.innerHTML = type.fields.map((field) => `
    <label>
      ${field.label}
      <select data-field-key="${field.key}">
        ${fieldOptions(field.key, field.aliases, layout.mappings || {})}
      </select>
    </label>
  `).join("");
  mapping.querySelectorAll("select").forEach((select) => {
    select.addEventListener("input", () => {
      const nextLayout = ensureLayout(currentLayoutKey());
      if (!nextLayout.mappings) nextLayout.mappings = {};
      nextLayout.mappings[select.dataset.fieldKey] = select.value;
      saveLayouts();
      render();
    });
  });
}

function buildStyleEditor() {
  const select = $("styleField");
  const previous = select.value;
  const staticFields = ensureLayout(currentLayoutKey()).staticFields.map((field) => ({
    key: field.key,
    label: `静态：${field.text}`,
  }));
  select.innerHTML = currentTabletType().fields.concat(staticFields).map((field) => (
    `<option value="${field.key}">${escapeHtml(field.label)}</option>`
  )).join("");
  if (currentTabletType().fields.concat(staticFields).some((field) => field.key === previous)) {
    select.value = previous;
  }
  syncStyleInputs();
}

function syncStyleInputs() {
  const style = styleFor($("styleField").value || "subject");
  $("fieldFontSize").value = style.fontSize;
  $("fieldColor").value = style.color;
  $("fieldFontFamily").value = style.fontFamily;
  if ($("styleField").value === "subject") $("singleFont").value = style.fontSize;
}

function updateSelectedFieldStyle() {
  const key = $("styleField").value || "subject";
  const layout = ensureLayout(currentLayoutKey());
  if (!layout.styles) layout.styles = {};
  layout.styles[key] = {
    fontSize: Number($("fieldFontSize").value) || 18,
    color: $("fieldColor").value || "#16110d",
    fontFamily: $("fieldFontFamily").value || "SimSun, serif",
  };
  if (key === "subject") $("singleFont").value = layout.styles[key].fontSize;
  saveLayouts();
}

function syncSubjectFontSize() {
  const layout = ensureLayout(currentLayoutKey());
  if (!layout.styles) layout.styles = {};
  layout.styles.subject = {
    ...styleFor("subject"),
    fontSize: Number($("singleFont").value) || 36,
  };
  if ($("styleField").value === "subject") syncStyleInputs();
  saveLayouts();
}

function addStaticField() {
  if (state.mode !== "single") return;
  const text = $("staticFieldText").value.trim();
  if (!text) return;

  const layout = ensureLayout(currentLayoutKey());
  const key = `static_${Date.now()}`;
  layout.staticFields.push({ key, text });
  layout.positions[key] = { x: 50, y: 50 };
  layout.sizes[key] = { w: 24, h: 12 };
  layout.styles[key] = {
    fontSize: 18,
    color: "#16110d",
    fontFamily: "SimSun, serif",
  };
  $("staticFieldText").value = "";
  saveLayouts();
  buildStyleEditor();
  $("styleField").value = key;
  syncStyleInputs();
  render();
}

function fieldOptions(key, aliases, savedMappings = {}) {
  const fields = currentFields();
  const hasSaved = Object.prototype.hasOwnProperty.call(savedMappings, key);
  const matched = hasSaved ? savedMappings[key] : aliases.find((name) => fields.includes(name)) || "";
  const options = ['<option value="">不使用</option>'].concat(fields.map((field) => (
    `<option value="${escapeHtml(field)}"${field === matched ? " selected" : ""}>${escapeHtml(field)}</option>`
  )));
  return options.join("");
}

function currentTabletType() {
  if (state.mode === "summary") {
    return $("summaryDataGroup").value === "blessing" ? tabletTypes.blessing : tabletTypes.deliveranceSimple;
  }
  const type = $("tabletType").value;
  if (type === "custom") {
    const templateId = $("templateSelect").value;
    const fields = Object.keys(templateDefaults[templateId]?.positions || {}).map(key => ({
      key,
      label: key,
      aliases: [key]
    }));
    return { name: "自定义模板", fields };
  }
  return tabletTypes[type] || tabletTypes.blessing;
}

function renderTable() {
  const wrap = $("tableWrap");
  const rows = allCurrentRows();
  const fields = currentFields();
  if (!rows.length) {
    wrap.innerHTML = '<p class="empty">还没有导入数据。</p>';
    updateSelectedRowsText();
    return;
  }
  const selected = state.selectedRowIds[currentDataGroup()];
  const head = `<th class="select-col">选择</th>${fields.map((field) => `<th>${escapeHtml(field)}</th>`).join("")}`;
  const body = rows.map((row) => (
    `<tr>
      <td class="select-col">
        <input type="checkbox" data-row-id="${escapeHtml(row.__rowId)}"${selected.has(row.__rowId) ? " checked" : ""}>
      </td>
      ${fields.map((field) => `<td>${escapeHtml(row[field] || "")}</td>`).join("")}
    </tr>`
  )).join("");
  wrap.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
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
  syncPrintSize();
  if (state.mode === "single") renderSingle();
  if (state.mode === "summary") renderSummary();
}

function renderSingle() {
  const rows = currentRows();
  const row = rows[state.pageIndex] || {};
  const total = Math.max(rows.length, 1);
  state.pageIndex = clamp(state.pageIndex, 0, total - 1);
  $("preview").innerHTML = singleSheet(row);
  bindDragHandles();
  fitAllFields();
  $("statusText").textContent = rows.length ? `${currentTabletType().name}：${fieldValue(row, "subject") || `第 ${state.pageIndex + 1} 条`}` : "暂无数据";
  $("pageText").textContent = `第 ${state.pageIndex + 1} / ${total} 张`;
}

function renderSummary() {
  const rows = currentRows();
  const columns = Number($("columnCount").value) || 3;
  const pageSize = columns;
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  state.pageIndex = clamp(state.pageIndex, 0, totalPages - 1);
  const start = state.pageIndex * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  $("preview").innerHTML = summarySheet(pageRows);
  $("statusText").textContent = `${currentDataGroupName()}汇总：共 ${rows.length} 条`;
  $("pageText").textContent = `第 ${state.pageIndex + 1} / ${totalPages} 页`;
}

function singleSheet(row) {
  const vertical = $("singleVertical").checked ? " vertical-text" : "";
  const type = $("tabletType").value;
  const fields = currentTabletType().fields;
  const layout = ensureLayout(currentLayoutKey());
  const background = layout.background && $("showBg").checked
    ? `<img class="template-bg" src="${layout.background}" alt="">`
    : "";
  const details = fields
    .filter((field) => field.key !== "subject")
    .map((field, index) => {
      const content = fieldValue(row, field.key);
      const display = content
        ? escapeHtml(content)
        : `<span class="field-placeholder">${escapeHtml(field.label)}</span>`;
      return draggableField(field.key, `tablet-meta meta-${field.key} meta-${index}${vertical}`, display, !content);
    }).join("");
  const subjectContent = fieldValue(row, "subject");
  const subjectLabel = fields.find((field) => field.key === "subject")?.label || "牌位主体";
  const staticFields = layout.staticFields.map((field) => (
    draggableField(field.key, `tablet-meta static-field${vertical}`, escapeHtml(field.text))
  )).join("");
  return `
    <article class="sheet" style="${sheetVars()} --single-font:${Number($("singleFont").value) || 36}px; --offset-y:${Number($("singleOffsetY").value) || 0};">
      ${background}
      <div class="tablet tablet-${type}">
        ${draggableField("subject", `single-field single-name${vertical}`, escapeHtml(subjectContent || subjectLabel), !subjectContent)}
        ${details}
        ${staticFields}
      </div>
    </article>
  `;
}

function draggableField(key, className, content, placeholder = false) {
  const pos = positionFor(key);
  const style = styleFor(key);
  const size = sizeFor(key);
  const placeholderClass = placeholder ? " is-placeholder" : "";
  return `
    <div class="${className} editable-field${placeholderClass}" data-edit-key="${key}" data-base-font="${style.fontSize}" style="left:${pos.x}%; top:${pos.y}%; width:${size.w}%; height:${size.h}%; font-size:${style.fontSize}px; color:${style.color}; font-family:${style.fontFamily};">
      <div class="field-content">${content}</div>
      <span class="resize-handle" data-resize-key="${key}" aria-hidden="true"></span>
    </div>
  `;
}

function summarySheet(pageRows) {
  const columns = Number($("columnCount").value) || 3;
  const layout = ensureLayout(currentLayoutKey());
  const background = layout.background && $("showBg").checked
    ? `<img class="template-bg" src="${layout.background}" alt="">`
    : "";
  const columnHtml = Array.from({ length: columns }, (_, columnIndex) => {
    const row = pageRows[columnIndex];
    return `<div class="summary-column">${row ? formatSummaryColumn(row) : ""}</div>`;
  }).join("");
  const vertical = $("summaryVertical").checked ? " vertical-summary" : "";
  return `
    <article class="sheet" style="${sheetVars()} --columns:${columns}; --rows-per-column:${Number($("rowsPerColumn").value) || 18}; --page-margin:${Number($("pageMargin").value) || 0}; --column-gap:${Number($("columnGap").value) || 0}; --line-gap:${Number($("summaryLineGap").value) || 0}; --summary-font:${Number($("summaryFont").value) || 22}px;">
      ${background}
      <div class="summary-page${vertical}">${columnHtml}</div>
    </article>
  `;
}

function printAll() {
  syncPrintSize();
  state.restorePageIndex = state.pageIndex;
  if (state.mode === "single") {
    const rows = currentRows().length ? currentRows() : [{}];
    $("preview").innerHTML = rows.map(singleSheet).join("");
  } else {
    const rows = currentRows();
    const columns = Number($("columnCount").value) || 3;
    const pageSize = columns;
    const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
    const pages = Array.from({ length: totalPages }, (_, pageIndex) => {
      const start = pageIndex * pageSize;
      return summarySheet(rows.slice(start, start + pageSize));
    });
    $("preview").innerHTML = pages.join("");
  }
  bindDragHandles();
  fitAllFields();
  window.addEventListener("afterprint", restoreAfterPrint, { once: true });
  window.print();
}

function restoreAfterPrint() {
  state.pageIndex = state.restorePageIndex;
  render();
}

function changePage(delta) {
  state.pageIndex += delta;
  render();
}

function value(row, field) {
  return field ? String(row[field] || "") : "";
}

function currentRows() {
  const rows = allCurrentRows();
  const selected = state.selectedRowIds[currentDataGroup()];
  if (!selected.size) return rows;
  return rows.filter((row) => selected.has(row.__rowId));
}

function allCurrentRows() {
  return state.datasets[currentDataGroup()] || [];
}

function currentFields() {
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
  if (state.mode === "summary") return $("summaryDataGroup").value || "deliverance";
  if ($("tabletType").value === "custom") return currentTemplate().dataGroup || "deliverance";
  return $("tabletType").value === "blessing" ? "blessing" : "deliverance";
}

function currentDataGroupName() {
  return currentDataGroup() === "blessing" ? "延生禄位" : "超度牌位";
}

function loadAllSamples() {
  state.datasets.blessing = sampleData.blessing;
  state.datasets.deliverance = sampleData.deliverance;
  state.pageIndex = 0;
  buildFieldMapping();
  buildStyleEditor();
  renderTable();
  updateDataHint();
  applySummaryDefault(true);
  render();
}

function updateDataHint() {
  $("dataHint").textContent = `当前导入目标：${currentDataGroupName()}数据。延生和超度数据分开保存、分开预览、分开打印。`;
}

function applySummaryDefault(force = false) {
  const nextDefault = defaultSummaryFormat();
  if (force || !$("summaryFormat").value.trim() || $("summaryFormat").value === state.lastSummaryDefault) {
    $("summaryFormat").value = nextDefault;
  }
  state.lastSummaryDefault = nextDefault;
}

function defaultSummaryFormat() {
  const fields = currentTabletType().fields.map((field) => `{{${field.label}}}`);
  return fields.join("\n");
}

function fieldValue(row, key) {
  const select = document.querySelector(`[data-field-key="${key}"]`);
  return select ? value(row, select.value) : "";
}

function currentFieldMappings() {
  return Array.from(document.querySelectorAll("[data-field-key]")).reduce((mappings, select) => {
    mappings[select.dataset.fieldKey] = select.value;
    return mappings;
  }, {});
}

function loadLayouts() {
  try {
    return JSON.parse(localStorage.getItem("tabletPrintLayouts") || "{}");
  } catch {
    return {};
  }
}

function saveLayouts() {
  localStorage.setItem("tabletPrintLayouts", JSON.stringify(state.layouts));
}

function loadRemoteTemplateIds() {
  try {
    return JSON.parse(localStorage.getItem("tabletPrintRemoteIds") || "{}");
  } catch {
    return {};
  }
}

function saveRemoteTemplateIds() {
  localStorage.setItem("tabletPrintRemoteIds", JSON.stringify(state.remoteTemplateIds));
}

function authToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders() {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(url, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(url, { cache: "no-store", ...options, headers });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `请求失败：${response.status}`);
  }
  return json.data ?? json;
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

async function loadServerTemplates() {
  if (!authToken()) return;
  try {
    const serverTemplates = await fetchJson("/api/plaque-templates", { headers: authHeaders() });
    serverTemplates
      .filter((template) => template?.elements?.source === "tablet-print")
      .forEach(importServerTemplate);
    saveLayouts();
    saveCustomTemplatesToStorage();
  } catch (error) {
    console.warn("加载服务器模板失败，继续使用本地模板:", error);
  }
}

function importServerTemplate(template) {
  const data = template.elements;
  if (!data?.template?.id) return;
  const localTemplate = {
    ...data.template,
    id: data.template.id,
    name: template.name || data.template.name,
  };
  const index = templates.findIndex((item) => item.id === localTemplate.id);
  if (index >= 0) {
    templates[index] = { ...templates[index], ...localTemplate };
  } else {
    templates.push(localTemplate);
    const option = document.createElement("option");
    option.value = localTemplate.id;
    option.textContent = localTemplate.name;
    $("templateSelect").appendChild(option);
  }
  if (data.defaults) templateDefaults[localTemplate.id] = data.defaults;
  if (data.layout) state.layouts[localTemplate.id] = data.layout;
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
      mode: template.mode || state.mode,
      dataGroup: template.dataGroup || currentDataGroup(),
      width: Number($("paperWidth").value) || template.width,
      height: Number($("paperHeight").value) || template.height,
      font: template.font,
      vertical: state.mode === "summary" ? false : $("singleVertical").checked,
      tabletType: state.mode === "summary" ? undefined : ($("tabletType").value === "custom" ? "custom" : $("tabletType").value),
    },
    defaults,
    layout,
  };
}

async function syncCurrentTemplateToServer() {
  if (!authToken()) return;
  const payload = exportCurrentTemplatePayload();
  const remoteId = state.remoteTemplateIds[payload.template.id];
  const body = {
    name: payload.template.name,
    type: payload.template.dataGroup === "blessing" ? "LONGEVITY" : "DELIVERANCE",
    backgroundImage: "",
    elements: payload,
  };

  if (remoteId) {
    await fetchJson(`/api/plaque-templates/${remoteId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  } else {
    const response = await fetchJson("/api/plaque-templates", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const created = response.data || response;
    if (created?.id) {
      state.remoteTemplateIds[payload.template.id] = created.id;
      saveRemoteTemplateIds();
    }
  }
}

function migrateStoredLayouts() {
  let changed = false;

  if (state.layouts.summary && !state.layouts.a4summary) {
    state.layouts.a4summary = {
      ...state.layouts.summary,
      paper: state.layouts.summary.paper || { width: 210, height: 297, vertical: false },
      summary: normalizeSummarySettings(state.layouts.summary.summary),
    };
    delete state.layouts.summary;
    changed = true;
  }

  ["a4summary", "a3summary"].forEach((id) => {
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    const layout = ensureLayout(id);
    if (!layout.paper) {
      layout.paper = { width: template.width, height: template.height, vertical: false };
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
  });

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

function ensureLayout(type) {
  if (!state.layouts[type]) {
    state.layouts[type] = {
      positions: clone(templateDefaults[type]?.positions || {}),
      styles: clone(templateDefaults[type]?.styles || {}),
      sizes: clone(templateDefaults[type]?.sizes || {}),
      background: "",
      mappings: {},
    };
  }
  if (!state.layouts[type].positions) state.layouts[type].positions = {};
  if (!state.layouts[type].styles) state.layouts[type].styles = clone(templateDefaults[type]?.styles || {});
  if (!state.layouts[type].sizes) state.layouts[type].sizes = clone(templateDefaults[type]?.sizes || {});
  if (!state.layouts[type].mappings) state.layouts[type].mappings = {};
  if (!state.layouts[type].staticFields) state.layouts[type].staticFields = [];
  return state.layouts[type];
}

function positionFor(key) {
  const type = currentLayoutKey();
  const layout = ensureLayout(type);
  if (!layout.positions[key]) {
    layout.positions[key] = clone(templateDefaults[type]?.positions?.[key] || { x: 50, y: 50 });
  }
  return layout.positions[key];
}

async function saveCurrentLayout() {
  const layout = ensureLayout(currentLayoutKey());
  layout.paper = {
    width: Number($("paperWidth").value) || 210,
    height: Number($("paperHeight").value) || 297,
    vertical: $("singleVertical").checked,
  };
  if (state.mode === "summary") {
    layout.summary = currentSummarySettings();
  }
  layout.mappings = currentFieldMappings();
  saveLayouts();
  if (currentLayoutKey().startsWith("custom_")) saveCustomTemplatesToStorage();
  try {
    await syncCurrentTemplateToServer();
    $("statusText").textContent = authToken() ? "模板已保存到服务器" : "模板已保存到本机";
  } catch (error) {
    console.error("同步服务器模板失败:", error);
    $("statusText").textContent = "模板已保存到本机，服务器同步失败";
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
    staticFields: [],
  };
  const template = templates.find((item) => item.id === $("templateSelect").value) || templates[0];
  $("paperWidth").value = template.width;
  $("paperHeight").value = template.height;
  $("singleVertical").checked = template.vertical;
  saveLayouts();
  $("bgInput").value = "";
  render();
}

function styleFor(key) {
  const type = currentLayoutKey();
  const layout = ensureLayout(type);
  if (!layout.styles[key]) {
    layout.styles[key] = clone(templateDefaults[type]?.styles?.[key] || { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif" });
  }
  return layout.styles[key];
}

function sizeFor(key) {
  const type = currentLayoutKey();
  const layout = ensureLayout(type);
  if (!layout.sizes[key]) {
    layout.sizes[key] = clone(templateDefaults[type]?.sizes?.[key] || { w: 20, h: 20 });
  }
  return layout.sizes[key];
}

function bindDragHandles() {
  document.querySelectorAll("[data-edit-key]").forEach((element) => {
    element.addEventListener("pointerdown", startDrag);
  });
  document.querySelectorAll("[data-resize-key]").forEach((handle) => {
    handle.addEventListener("pointerdown", startResize);
  });
}

function startDrag(event) {
  if (event.target.closest(".resize-handle")) return;
  const element = event.currentTarget;
  const tablet = element.closest(".tablet");
  if (!tablet) return;
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
}

function startResize(event) {
  event.stopPropagation();
  const handle = event.currentTarget;
  const element = handle.closest("[data-edit-key]");
  const tablet = element?.closest(".tablet");
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
  const layout = ensureLayout(currentLayoutKey());
  layout.positions[state.interaction.key] = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

function resizeField(event) {
  if (!state.interaction || state.interaction.type !== "resize") return;
  const rect = state.interaction.tablet.getBoundingClientRect();
  const deltaW = ((event.clientX - state.interaction.startX) / rect.width) * 100;
  const deltaH = ((event.clientY - state.interaction.startY) / rect.height) * 100;
  const width = clamp(state.interaction.startW + deltaW, 4, 96);
  const height = clamp(state.interaction.startH + deltaH, 4, 96);
  state.interaction.element.style.width = `${width}%`;
  state.interaction.element.style.height = `${height}%`;
  const layout = ensureLayout(currentLayoutKey());
  layout.sizes[state.interaction.key] = { w: Math.round(width * 10) / 10, h: Math.round(height * 10) / 10 };
  fitField(state.interaction.element);
}

function currentLayoutKey() {
  if (state.mode === "summary") return $("templateSelect").value || "summary";
  const templateId = $("templateSelect").value;
  if (templateId.startsWith("custom_")) return templateId;
  return $("tabletType").value;
}

function isSummaryTemplate(template) {
  return template.id === "a4summary" || template.id === "a3summary" || template.mode === "summary";
}

function inferTemplateDataGroup(templateData) {
  const fields = (templateData.fields || []).map((field) => field.key);
  const blessingKeys = new Set(tabletTypes.blessing.fields.map((field) => field.key));
  return fields.some((key) => blessingKeys.has(key)) ? "blessing" : "deliverance";
}

function currentSummarySettings() {
  return {
    dataGroup: $("summaryDataGroup").value || "deliverance",
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
  if (settings.dataGroup) $("summaryDataGroup").value = settings.dataGroup;
  if (typeof settings.format === "string") $("summaryFormat").value = settings.format;
  if (settings.columnCount) $("columnCount").value = settings.columnCount;
  if (settings.rowsPerColumn) $("rowsPerColumn").value = settings.rowsPerColumn;
  if (settings.fontSize) $("summaryFont").value = settings.fontSize;
  if (settings.lineGap !== undefined) $("summaryLineGap").value = settings.lineGap;
  if (settings.pageMargin !== undefined) $("pageMargin").value = settings.pageMargin;
  if (settings.columnGap !== undefined) $("columnGap").value = settings.columnGap;
  if (settings.vertical !== undefined) $("summaryVertical").checked = settings.vertical;
  state.lastSummaryDefault = $("summaryFormat").value;
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

function fitAllFields() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".editable-field").forEach(fitField);
  });
}

function fitField(field) {
  const content = field.querySelector(".field-content");
  if (!content) return;
  const baseFont = Number(field.dataset.baseFont) || Number.parseFloat(field.style.fontSize) || 18;
  let fontSize = baseFont;
  field.style.fontSize = `${fontSize}px`;
  const minFont = Math.max(8, Math.round(baseFont * 0.55));
  while (fontSize > minFont && isOverflowing(content)) {
    fontSize -= 1;
    field.style.fontSize = `${fontSize}px`;
  }
  field.classList.toggle("auto-shrunk", fontSize < baseFont);
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
  const width = Number($("paperWidth").value) || 210;
  const height = Number($("paperHeight").value) || 297;
  return `--paper-w:${width}mm; --paper-h:${height}mm;`;
}

function syncPrintSize() {
  const width = Number($("paperWidth").value) || 210;
  const height = Number($("paperHeight").value) || 297;
  document.documentElement.style.setProperty("--print-w", `${width}mm`);
  document.documentElement.style.setProperty("--print-h", `${height}mm`);

  let pageSizeStyle = document.getElementById("printPageSize");
  if (!pageSizeStyle) {
    pageSizeStyle = document.createElement("style");
    pageSizeStyle.id = "printPageSize";
    document.head.appendChild(pageSizeStyle);
  }
  pageSizeStyle.textContent = `@media print { @page { size: ${width}mm ${height}mm; margin: 0; } }`;
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

init();

function renderFieldSelection() {
  const container = document.getElementById("fieldSelection");
  container.innerHTML = "";

  const groups = [
    { name: "延生禄位", dataGroup: "blessing", fields: tabletTypes.blessing.fields },
    { name: "超度牌位 - 详细", dataGroup: "deliverance", fields: tabletTypes.deliveranceDetail.fields },
    { name: "超度牌位 - 简版", dataGroup: "deliverance", fields: tabletTypes.deliveranceSimple.fields }
  ];

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

  const width = parseInt(document.getElementById("newTemplateWidth").value) || 90;
  const height = parseInt(document.getElementById("newTemplateHeight").value) || 260;
  const vertical = document.getElementById("newTemplateVertical").checked;
  const id = "custom_" + Date.now();

  if (state.mode === "summary") {
    const newTemplate = {
      id,
      name,
      width,
      height,
      font: Number($("summaryFont").value) || 22,
      vertical: false,
      mode: "summary",
    };
    templates.push(newTemplate);
    state.layouts[id] = {
      positions: {},
      styles: {},
      sizes: {},
      background: "",
      paper: { width, height, vertical: false },
      summary: currentSummarySettings(),
    };

    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    document.getElementById("templateSelect").appendChild(option);
    document.getElementById("newTemplateDialog").close();
    document.getElementById("templateSelect").value = id;
    saveLayouts();
    saveCustomTemplatesToStorage();
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

  if (selectedFields.length === 0) {
    alert("请至少选择一个字段");
    return;
  }

  const newTemplate = {
    id,
    name,
    width,
    height,
    font: 22,
    vertical,
    dataGroup: selectedFields.some((field) => field.dataGroup === "blessing") ? "blessing" : "deliverance",
    tabletType: "custom"
  };

  templates.push(newTemplate);

  templateDefaults[id] = {
    positions: {},
    styles: {},
    sizes: {}
  };

  const defaultX = 50;
  const defaultY = 30;
  let yOffset = 0;

  selectedFields.forEach((field, index) => {
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
    yOffset += 8;
  });

  const option = document.createElement("option");
  option.value = id;
  option.textContent = name;
  document.getElementById("templateSelect").appendChild(option);

  document.getElementById("newTemplateDialog").close();

  document.getElementById("templateSelect").value = id;
  applyTemplate();

  saveCustomTemplatesToStorage();
}

function saveCustomTemplatesToStorage() {
  const customTemplates = templates
    .filter(t => t.id.startsWith("custom_"))
    .map(t => {
      const layout = state.layouts[t.id];
      return {
        id: t.id,
        name: t.name,
        mode: t.mode || "single",
        dataGroup: t.dataGroup,
        width: layout?.paper?.width || t.width,
        height: layout?.paper?.height || t.height,
        vertical: layout?.paper?.vertical ?? t.vertical,
        summary: layout?.summary,
        staticFields: layout?.staticFields || [],
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
  localStorage.setItem("customTemplates", JSON.stringify(customTemplates));
}

function loadCustomTemplatesFromStorage() {
  try {
    const stored = localStorage.getItem("customTemplates");
    if (!stored) return;

    const customTemplates = JSON.parse(stored);
    let changed = false;
    customTemplates.forEach(ct => {
      const mode = ct.mode || (ct.summary || !(ct.fields || []).length ? "summary" : "single");
      if (ct.mode !== mode) changed = true;
      if (!templates.some(t => t.id === ct.id)) {
        templates.push({
          id: ct.id,
          name: ct.name,
          width: ct.width,
          height: ct.height,
          font: 22,
          vertical: ct.vertical,
          mode,
          dataGroup: ct.dataGroup || inferTemplateDataGroup(ct),
          tabletType: mode === "summary" ? undefined : "custom"
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

        if (mode === "summary") {
          const normalizedSummary = normalizeSummarySettings(ct.summary);
          if (JSON.stringify(normalizedSummary) !== JSON.stringify(ct.summary || {})) changed = true;
          state.layouts[ct.id] = {
            ...(state.layouts[ct.id] || {}),
            positions: {},
            styles: {},
            sizes: {},
            background: state.layouts[ct.id]?.background || "",
            paper: {
              width: Number(ct.width) || 210,
              height: Number(ct.height) || 297,
              vertical: false,
            },
            summary: normalizedSummary,
          };
        }

        const option = document.createElement("option");
        option.value = ct.id;
        option.textContent = ct.name;
        document.getElementById("templateSelect").appendChild(option);
      }
    });
    if (changed) saveCustomTemplatesToStorage();
  } catch (e) {
    console.error("加载自定义模板失败:", e);
  }
}
