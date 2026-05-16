const templates = [
  { id: "cmp6uyyk10003bjnjsqkn2uwn", name: "延生通名", width: 297, height: 420, vertical: true, mode: "summary", dataGroup: "blessing" },
  { id: "cmowl79v5000a2rdgs4czs9bo", name: "往生通名", width: 297, height: 420, vertical: true, mode: "summary", dataGroup: "blessing" },
  { id: "cmoz9dtgc015wcyyxjcwqcumq", name: "红牒", width: 420, height: 297, vertical: true, mode: "summary", dataGroup: "blessing" },
  { id: "cmp6vaj3l000gbjnjoak9q9wx", name: "延生禄位", width: 125, height: 360, vertical: true, mode: "summary", dataGroup: "blessing" },
  { id: "92171e1d-e697-46df-bfcc-4cb8f9a29661", name: "红壳", width: 125, height: 360, vertical: true, mode: "summary", dataGroup: "blessing" },
  { id: "cmp15pgnz000op0s9vkqcx9wt", name: "黄壳", width: 125, height: 360, vertical: true, mode: "single", dataGroup: "deliverance" },
  { id: "cmozm19an001ahmbwqm8nmi1q", name: "超度牌位", width: 125, height: 360, vertical: true, mode: "single", dataGroup: "deliverance" },
  { id: "cmoy8qpet023lp6guzs8mne81", name: "黄牒", width: 420, height: 297, vertical: true, mode: "single", dataGroup: "deliverance" },
];

const HIDDEN_LEGACY_TEMPLATE_IDS = new Set(["deliveranceDetail", "deliveranceSimple", "rebirth", "a4summary", "a3summary", "blessing", "deliverance"]);
const BUILTIN_TEMPLATE_IDS = new Set([
  "cmp6vaj3l000gbjnjoak9q9wx", "cmozm19an001ahmbwqm8nmi1q",
  "cmoz9dtgc015wcyyxjcwqcumq", "92171e1d-e697-46df-bfcc-4cb8f9a29661",
  "cmoy8qpet023lp6guzs8mne81", "cmp15pgnz000op0s9vkqcx9wt",
  "cmp6uyyk10003bjnjsqkn2uwn", "cmowl79v5000a2rdgs4czs9bo",
]);
const BUILTIN_SINGLE_TEMPLATE_IDS = new Set(["cmp6vaj3l000gbjnjoak9q9wx", "cmozm19an001ahmbwqm8nmi1q"]);
const TEMPLATE_CATALOG = {
  cmp6vaj3l000gbjnjoak9q9wx: { name: "延生禄位", groupLabel: "牌位模版", groupOrder: 1, order: 1, mode: "single", dataGroup: "blessing" },
  cmozm19an001ahmbwqm8nmi1q: { name: "往生牌位", groupLabel: "牌位模版", groupOrder: 1, order: 2, mode: "single", dataGroup: "deliverance" },
  cmoz9dtgc015wcyyxjcwqcumq: { name: "延生｜红牒", groupLabel: "延生牒模版", groupOrder: 2, order: 1, mode: "single", dataGroup: "blessing" },
  "92171e1d-e697-46df-bfcc-4cb8f9a29661": { name: "延生｜红壳", groupLabel: "延生牒模版", groupOrder: 2, order: 2, mode: "single", dataGroup: "blessing" },
  cmoy8qpet023lp6guzs8mne81: { name: "往生｜黄牒", groupLabel: "往生牒模版", groupOrder: 3, order: 1, mode: "single", dataGroup: "deliverance" },
  cmp15pgnz000op0s9vkqcx9wt: { name: "往生｜黄壳", groupLabel: "往生牒模版", groupOrder: 3, order: 2, mode: "single", dataGroup: "deliverance" },
  cmp6uyyk10003bjnjsqkn2uwn: { name: "延生通名", groupLabel: "汇总多列模版", groupOrder: 4, order: 1, mode: "summary", dataGroup: "blessing" },
  cmowl79v5000a2rdgs4czs9bo: { name: "往生通名", groupLabel: "汇总多列模版", groupOrder: 4, order: 2, mode: "summary", dataGroup: "deliverance" },
};
const TEMPLATE_CATEGORIES = {
  plaque: { label: "牌位模版", groupOrder: 1 },
  blessing_doc: { label: "延生牒模版", groupOrder: 2 },
  deliverance_doc: { label: "往生牒模版", groupOrder: 3 },
  summary: { label: "汇总多列模版", groupOrder: 4 },
  text_doc: { label: "文牒模版", groupOrder: 5 },
};

const CATALOG_SINGLE_TEMPLATE_IDS = new Set(
  Object.entries(TEMPLATE_CATALOG)
    .filter(([, item]) => item.mode === "single")
    .map(([id]) => id)
);

const templateDefaults = {
  cmp15pgnz000op0s9vkqcx9wt: {
    positions: { subject: { x: 50, y: 30 }, yangshang: { x: 50, y: 38 }, "single_variant_blessing_bodhisattva__subject": { x: 43.8, y: 63.5 }, "single_variant_blessing_bodhisattva__yangshang": { x: 37, y: 69.4 }, "single_variant_blessing_bodhisattva__static_1778501141180": { x: 36.9, y: 65.4 }, "single_variant_blessing_bodhisattva__static_1778501160565": { x: 37.4, y: 81.2 }, "single_variant_blessing_bodhisattva__static_1778501368780": { x: 38.6, y: 25 } },
    styles: { subject: { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif" }, yangshang: { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif" }, "single_variant_blessing_bodhisattva__subject": { fontSize: 30, wrapMode: "anywhere", textAlign: "center", fontFamily: "KaiTi, STKaiti, serif", verticalAlign: "center" }, "single_variant_blessing_bodhisattva__yangshang": { fontSize: 20, wrapMode: "anywhere", textAlign: "center", fontFamily: "KaiTi, STKaiti, serif", verticalAlign: "center" }, "single_variant_blessing_bodhisattva__static_1778501141180": { fontSize: 20, wrapMode: "anywhere", textAlign: "center", fontFamily: "KaiTi, STKaiti, serif", verticalAlign: "center" }, "single_variant_blessing_bodhisattva__static_1778501160565": { fontSize: 18, wrapMode: "anywhere", textAlign: "center", fontFamily: "KaiTi, STKaiti, serif", verticalAlign: "center" }, "single_variant_blessing_bodhisattva__static_1778501368780": { fontSize: 50, wrapMode: "anywhere", textAlign: "center", fontFamily: "KaiTi, STKaiti, serif", verticalAlign: "center" } },
    sizes: { subject: { h: 20, w: 20 }, yangshang: { h: 20, w: 20 }, "single_variant_blessing_bodhisattva__subject": { h: 20, w: 14.3 }, "single_variant_blessing_bodhisattva__yangshang": { h: 11.7, w: 6.4 }, "single_variant_blessing_bodhisattva__static_1778501141180": { h: 4, w: 5.7 }, "single_variant_blessing_bodhisattva__static_1778501160565": { h: 4, w: 6.2 }, "single_variant_blessing_bodhisattva__static_1778501368780": { h: 15.5, w: 23.5 } },
  },
  cmozm19an001ahmbwqm8nmi1q: {
    positions: { ritual: { x: 50, y: 50 }, address: { x: 78.4, y: 18.6 }, subject: { x: 34.4, y: 29.4 }, yangshang: { x: 5.6, y: 53.4 }, printSerial: { x: 78, y: 92 } },
    styles: { ritual: { fontSize: 18, textAlign: "center", color: "#16110d", fontFamily: "SimSun, serif" }, address: { fontSize: 17, textAlign: "center", color: "#16110d", fontFamily: "SimSun, serif" }, subject: { fontSize: 60, textAlign: "center", color: "#16110d", fontFamily: "SimSun, serif" }, yangshang: { fontSize: 17, textAlign: "center", color: "#16110d", fontFamily: "SimSun, serif" }, printSerial: { fontSize: 12, textAlign: "center", color: "#7a1c1d", fontFamily: "Microsoft YaHei, sans-serif" } },
    sizes: { ritual: { h: 20, w: 20 }, address: { h: 45, w: 12 }, subject: { h: 39, w: 29.1 }, yangshang: { h: 22.3, w: 22.6 }, printSerial: { h: 6, w: 18 } },
  },
  cmoy8qpet023lp6guzs8mne81: {
    positions: { age: { x: 50, y: 50 }, wish: { x: 65.4, y: 62.8 }, zodiac: { x: 50, y: 50 }, address: { x: 78.2, y: 12.7 }, subject: { x: 54.2, y: 31.9 }, believer: { x: 65, y: 61.3 }, birthday: { x: 62.9, y: 64.5 }, yangshang: { x: 74.2, y: 31.6 }, static_1778314005753: { x: 82.5, y: 26.8 }, static_1778314051577: { x: 54.4, y: 12.9 }, static_1778378378270: { x: 16.9, y: 20.4 }, static_1778378435092: { x: 16.9, y: 45.3 }, static_1778378460620: { x: 16.9, y: 53.6 }, static_1778379124748: { x: 39.4, y: 26.8 }, clone_subject_1778379239115: { x: 20.5, y: 24.6 } },
    styles: { age: { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif" }, wish: { fontSize: 18, textAlign: "center", color: "#16110d", fontFamily: "SimSun, serif" }, zodiac: { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif" }, address: { fontSize: 25, textAlign: "left", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, subject: { fontSize: 30, textAlign: "left", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, believer: { fontSize: 18, textAlign: "center", color: "#16110d", fontFamily: "SimSun, serif" }, birthday: { fontSize: 18, textAlign: "center", color: "#16110d", fontFamily: "SimSun, serif" }, yangshang: { fontSize: 25, textAlign: "left", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, static_1778314005753: { fontSize: 25, textAlign: "left", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, static_1778314051577: { fontSize: 30, textAlign: "center", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, static_1778378378270: { fontSize: 24, textAlign: "center", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, static_1778378435092: { fontSize: 25, textAlign: "center", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, static_1778378460620: { fontSize: 25, textAlign: "center", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, static_1778379124748: { fontSize: 60, textAlign: "left", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" }, clone_subject_1778379239115: { fontSize: 25, textAlign: "center", color: "#16110d", fontFamily: "KaiTi, STKaiti, serif" } },
    sizes: { age: { h: 20, w: 20 }, wish: { h: 20, w: 20 }, zodiac: { h: 20, w: 20 }, address: { h: 61.9, w: 4.3 }, subject: { h: 57.9, w: 4.7 }, believer: { h: 20, w: 20 }, birthday: { h: 20, w: 20 }, yangshang: { h: 43.9, w: 4 }, static_1778314005753: { h: 21.1, w: 4 }, static_1778314051577: { h: 18.5, w: 4.2 }, static_1778378378270: { h: 12.8, w: 4 }, static_1778378435092: { h: 5.7, w: 4 }, static_1778378460620: { h: 6, w: 4 }, static_1778379124748: { h: 62.4, w: 6.6 }, clone_subject_1778379239115: { h: 14.3, w: 4 } },
  },
};

const tabletTypes = {
  blessing: {
    name: "延生禄位模板",
    fields: [
      { key: "code", label: "编码", aliases: ["编码", "编号", "code"] },
      { key: "subject", label: "牌位主体", aliases: ["牌位主体", "主体", "姓名", "名称"] },
      { key: "believer", label: "信人", aliases: ["信人", "阳上", "阳上人"] },
      { key: "age", label: "年龄", aliases: ["年龄", "岁数"] },
      { key: "zodiac", label: "属相", aliases: ["属相", "生肖"] },
      { key: "birthday", label: "生日", aliases: ["生日", "生日年月日", "出生年月日", "出生日期", "生辰"] },
      { key: "address", label: "地址", aliases: ["地址", "住址"] },
      { key: "wish", label: "祈福语", aliases: ["祈福语", "祈愿", "备注"] },
    ],
  },
  deliverance: {
    name: "往生牌位模板",
    fields: [
      { key: "code", label: "编码", aliases: ["编码", "编号", "code"] },
      { key: "subject", label: "牌位主体", aliases: ["牌位主体", "主体", "姓名", "名称"] },
      { key: "deceasedInfo", label: "亡者信息", aliases: ["亡者信息", "亡者", "亡者二", "第二亡者"] },
      { key: "deceasedPrimary", label: "亡者", aliases: ["亡者", "第一亡者", "亡者1", "亡者一", "亡者姓名1", "亡者姓名"] },
      { key: "deceasedSecondary", label: "亡者二", aliases: ["亡者二", "第二亡者", "亡者2", "亡者姓名2", "附名亡者"] },
      { key: "yinGeng", label: "亡者阴庚", aliases: ["亡者阴庚", "阴庚", "亡者阴庚", "yinGeng"] },
      { key: "yinGeng2", label: "亡者二阴庚", aliases: ["亡者二阴庚", "亡者二阴庚", "yinGeng2"] },
      { key: "age", label: "年龄", aliases: ["年龄", "岁数"] },
      { key: "birthday", label: "亡者生日", aliases: ["亡者生日", "生日", "出生日期", "生辰", "亡者生日"] },
      { key: "deathday", label: "亡者忌日", aliases: ["亡者忌日", "忌日", "往生日", "死亡日期", "亡者忌日"] },
      { key: "birthday2", label: "亡者二生日", aliases: ["亡者二生日", "亡者二生日", "birthday2"] },
      { key: "deathday2", label: "亡者二忌日", aliases: ["亡者二忌日", "亡者二忌日", "deathday2"] },
      { key: "yangshang", label: "阳上", aliases: ["阳上", "阳上人", "信人"] },
      { key: "address", label: "地址", aliases: ["地址", "住址"] },
      { key: "wish", label: "寄语", aliases: ["寄语", "祈福语", "祈愿", "备注"] },
    ],
  },
};

const summaryVariantPresets = {
  blessing: [
    {
      key: "blessing_bodhisattva",
      label: "版式一",
      match: "bodhisattva",
      fields: ["summary_subject", "summary_believer", "summary_address"],
    },
    {
      key: "blessing_person",
      label: "版式二",
      match: "person",
      fields: ["summary_subject", "summary_age", "summary_zodiac", "summary_birthday", "summary_address"],
    },
  ],
  deliverance: [
    {
      key: "deliverance_default",
      label: "版式一",
      match: "default",
      fields: ["summary_subject", "summary_yangshang", "summary_address"],
    },
    {
      key: "deliverance_detail",
      label: "版式二",
      match: "detail",
      fields: ["summary_subject", "summary_deceased", "summary_yinGeng", "summary_birthday", "summary_deathday", "summary_yangshang", "summary_address"],
    },
    {
      key: "deliverance_full",
      label: "版式三",
      match: "full",
      fields: ["summary_subject", "summary_deceased", "summary_yinGeng", "summary_birthday", "summary_deathday", "summary_deceased2", "summary_yinGeng2", "summary_birthday2", "summary_deathday2", "summary_yangshang", "summary_address"],
    },
  ],
};

const singleVariantPresets = [
  { key: "layout_one", label: "版式一" },
  { key: "layout_two", label: "版式二" },
  { key: "layout_three", label: "版式三" },
];

const singleVariantPresetsByType = {
  blessing: [
    { key: "layout_one", label: "版式一" },
    { key: "layout_two", label: "版式二" },
  ],
  deliverance: [
    { key: "layout_one", label: "版式一" },
    { key: "layout_two", label: "版式二" },
    { key: "layout_three", label: "版式三" },
  ],
};

const singleVariantFieldKeysByType = {
  blessing: {
    layout_one: ["subject", "believer", "age", "zodiac", "birthday", "address", "wish"],
    layout_two: ["subject", "age", "zodiac", "birthday", "address", "wish"],
  },
  deliverance: {
    layout_one: ["subject", "yangshang", "address"],
    layout_two: ["subject", "deceasedPrimary", "yinGeng", "birthday", "deathday", "yangshang", "address", "wish"],
    layout_three: ["subject", "deceasedPrimary", "yinGeng", "birthday", "deathday", "deceasedSecondary", "yinGeng2", "birthday2", "deathday2", "yangshang", "address", "wish"],
  },
};

const singleVariantLayoutDefaults = {
  blessing: {
    layout_one: {
      positions: {
        subject: { x: 50, y: 27 },
        believer: { x: 82, y: 18 },
        age: { x: 71, y: 18 },
        zodiac: { x: 60, y: 18 },
        birthday: { x: 49, y: 18 },
        address: { x: 22, y: 24 },
        wish: { x: 50, y: 74 },
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
    layout_two: {
      positions: {
        subject: { x: 50, y: 27 },
        age: { x: 82, y: 18 },
        zodiac: { x: 71, y: 18 },
        birthday: { x: 60, y: 18 },
        address: { x: 22, y: 24 },
        wish: { x: 50, y: 74 },
      },
      sizes: {
        subject: { w: 28, h: 42 },
        age: { w: 9, h: 32 },
        zodiac: { w: 9, h: 32 },
        birthday: { w: 9, h: 38 },
        address: { w: 11, h: 45 },
        wish: { w: 58, h: 18 },
      },
    },
  },
  deliverance: {
    layout_one: {
      positions: {
        subject: { x: 50, y: 27 },
        yangshang: { x: 22, y: 20 },
        address: { x: 16, y: 37 },
      },
      sizes: {
        subject: { w: 28, h: 44 },
        yangshang: { w: 11, h: 42 },
        address: { w: 11, h: 45 },
      },
    },
    layout_two: {
      positions: {
        subject: { x: 50, y: 27 },
        deceasedPrimary: { x: 84, y: 14 },
        yinGeng: { x: 73, y: 14 },
        birthday: { x: 62, y: 18 },
        deathday: { x: 51, y: 18 },
        yangshang: { x: 22, y: 20 },
        address: { x: 16, y: 37 },
        wish: { x: 48, y: 74 },
      },
      sizes: {
        subject: { w: 28, h: 44 },
        deceasedPrimary: { w: 10, h: 14 },
        yinGeng: { w: 9, h: 14 },
        birthday: { w: 9, h: 36 },
        deathday: { w: 9, h: 36 },
        yangshang: { w: 11, h: 42 },
        address: { w: 11, h: 45 },
        wish: { w: 56, h: 18 },
      },
    },
    layout_three: {
      positions: {
        subject: { x: 50, y: 27 },
        deceasedPrimary: { x: 84, y: 14 },
        deceasedSecondary: { x: 72, y: 14 },
        yinGeng: { x: 84, y: 26 },
        yinGeng2: { x: 72, y: 26 },
        birthday: { x: 84, y: 36 },
        birthday2: { x: 72, y: 36 },
        deathday: { x: 84, y: 46 },
        deathday2: { x: 72, y: 46 },
        yangshang: { x: 22, y: 20 },
        address: { x: 16, y: 37 },
        wish: { x: 48, y: 74 },
      },
      sizes: {
        subject: { w: 28, h: 44 },
        deceasedPrimary: { w: 10, h: 14 },
        deceasedSecondary: { w: 10, h: 14 },
        yinGeng: { w: 10, h: 12 },
        yinGeng2: { w: 10, h: 12 },
        birthday: { w: 10, h: 10 },
        birthday2: { w: 10, h: 10 },
        deathday: { w: 10, h: 10 },
        deathday2: { w: 10, h: 10 },
        yangshang: { w: 11, h: 42 },
        address: { w: 11, h: 45 },
        wish: { w: 56, h: 18 },
      },
    },
  },
};

const BUILTIN_SINGLE_TEMPLATES = [];

const SUMMARY_TEMPLATE_IDS = new Set(["cmp6uyyk10003bjnjsqkn2uwn", "cmowl79v5000a2rdgs4czs9bo"]);

const legacySingleVariantKeyMap = {
  blessing_bodhisattva: "layout_one",
  blessing_person: "layout_two",
};

const SINGLE_TABLE_FIELDS = {
  blessing: ["编码", "牌位主体", "信人", "年龄", "属相", "生日", "地址", "祈福语"],
  deliverance: ["编码", "牌位主体", "亡者", "亡者阴庚", "亡者生日", "亡者忌日", "亡者二", "亡者二阴庚", "亡者二生日", "亡者二忌日", "阳上", "寄语", "地址"],
};

const PDFJS_VERSION = "3.11.174";
const PDFJS_SCRIPT_CANDIDATES = [
  "/vendor/pdfjs/pdf.min.js",
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
];
const PDFJS_WORKER_CANDIDATES = [
  "/vendor/pdfjs/pdf.worker.min.js",
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
];
const PDF_PRINT_DPI = 200;

const SUMMARY_LAYOUT_REPAIR_VERSION = 3;
const APP_BUILD = "2026-05-11-2240";
const launchParams = new URLSearchParams(window.location.search);
const launchPrintPreviewMode = launchParams.get("preview") === "1" || launchParams.get("printPreview") === "1";
const templateDesignerMode = launchParams.get("desktopWindow") === "template-designer" || launchParams.get("designer") === "1";

const workflowStatus = {
  launchSource: "模板设计页",
  runtime: "网页端",
  dataSource: "尚未导入",
  templateSource: "内置模板",
  templateSync: "未检查",
  storageModel: "服务器主库 + 桌面缓存 + 浏览器配置",
};

if (launchPrintPreviewMode) {
  document.documentElement.classList.add("print-preview-mode");
  document.body?.classList.add("print-preview-mode");
}

const sampleData = {
  blessing: [
  { "牌位主体": "张三", "信人": "张三", "年龄": "四十八岁", "属相": "属龙", "生日": "1978年正月初三", "地址": "本市东街一号", "祈福语": "消灾延寿 福慧增长" },
  { "牌位主体": "谢释迦摩尼佛", "信人": "王五", "年龄": "", "属相": "", "生日": "", "地址": "本市南街二号", "祈福语": "身体康泰 所求如意" },
  ],
  deliverance: [
  { "编码": "000001", "牌位主体": "地基主", "亡者": "", "第一亡者": "", "阴庚": "", "亡者阴庚": "", "亡者生日": "", "亡者忌日": "", "亡者二": "", "第二亡者": "", "亡者二阴庚": "", "亡者二生日": "", "亡者二忌日": "", "阳上": "陈氏家人", "生日": "", "忌日": "", "寄语": "", "地址": "本市东街一号", "亡者信息": "" },
  { "编码": "000002", "牌位主体": "李四", "亡者": "李四", "第一亡者": "李四", "阴庚": "戊午年正月初三日建生", "亡者阴庚": "戊午年正月初三日建生", "亡者生日": "1978-01-15", "亡者忌日": "2020-03-15", "亡者二": "", "第二亡者": "", "亡者二阴庚": "", "亡者二生日": "", "亡者二忌日": "", "阳上": "李四家人", "生日": "1978-01-15", "忌日": "2020-03-15", "寄语": "蒙佛接引 莲品增上", "地址": "本市南街五号", "亡者信息": "李四" },
  { "编码": "000003", "牌位主体": "赵六 李四", "亡者": "赵六", "第一亡者": "赵六", "阴庚": "甲午年三月十二日建生", "亡者阴庚": "甲午年三月十二日建生", "亡者生日": "1954-04-15", "亡者忌日": "2010-08-20", "亡者二": "李四", "第二亡者": "李四", "亡者二阴庚": "丙申年九月初九日建生", "亡者二生日": "1956-10-12", "亡者二忌日": "2015-12-03", "阳上": "赵李两家后人", "生日": "1954-04-15", "忌日": "2010-08-20", "寄语": "早登极乐 莲品增上", "地址": "本市北街四号", "亡者信息": "赵六\\n李四" },
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
  "showBg", "enableDuplex", "designPrintBackgroundGraphics", "printBackgroundGraphics",
  "summaryVariant", "summaryFormat", "columnCount", "rowsPerColumn", "summaryFont",
  "summaryLineGap", "pageMargin", "columnGap", "summaryVertical",
].map($).filter(Boolean);

async function init() {
  workflowStatus.runtime = isDesktopRuntime() ? "桌面端" : "网页端";
  if (launchParams.get("plaqueId") || launchParams.get("plaqueIds")) {
    workflowStatus.launchSource = "牌位管理入口";
  } else if (launchPrintPreviewMode) {
    workflowStatus.launchSource = "打印预览入口";
  } else if (templateDesignerMode) {
    workflowStatus.launchSource = "模板设计页";
  } else {
    workflowStatus.launchSource = "打印中心";
  }
  setWorkflowStatus();

  console.log("[DEBUG] init start, templateDesignerMode:", templateDesignerMode, "isDesktopRuntime:", isDesktopRuntime(), "templates.length:", templates.length);
  templates.forEach((template, index) => {
    templates[index] = normalizeCatalogTemplate(template);
  });
  ensureBuiltinSingleTemplates();
  migrateStoredLayouts();
  console.log("[DEBUG] after migrateStoredLayouts, templates.length:", templates.length);
  const templateSelect = $("templateSelect");
  if (templateDesignerMode) {
    rebuildTemplateOptions();
  } else if (templateSelect) {
    templateSelect.innerHTML = "";
  }

  loadCustomTemplatesFromStorage();
  console.log("[DEBUG] after loadCustomTemplatesFromStorage, templates.length:", templates.length, "select.options.length:", $("templateSelect")?.options?.length);

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  $("sampleBtn").addEventListener("click", () => loadRows(sampleData[currentDataGroup()]));
  $("pasteBtn").addEventListener("click", () => loadRows(parseDelimited($("pasteInput").value)));
  $("loadSystemDataBtn").addEventListener("click", loadSystemPlaquesFromFilters);
  $("selectAllRowsBtn").addEventListener("click", selectAllCurrentRows);
  $("clearSelectedRowsBtn").addEventListener("click", clearSelectedRows);
  $("fileInput").addEventListener("change", handleFile);
  $("bgInput").addEventListener("change", handleBackground);
  $("clearBgBtn")?.addEventListener("click", clearBackground);
  $("saveTemplateBtn").addEventListener("click", saveCurrentLayout);
  $("resetTemplateBtn").addEventListener("click", resetCurrentLayout);
  $("printBtn").addEventListener("click", printAll);
  $("printSettingsPrintBtn")?.addEventListener("click", printAll);
  $("printSettingsSystemDialogBtn")?.addEventListener("click", printWithSystemDialog);
  $("printSettingsCancelBtn")?.addEventListener("click", () => window.close());
  $("designPrintBackgroundGraphics")?.addEventListener("change", syncPrintBackgroundGraphicsControls);
  $("printBackgroundGraphics")?.addEventListener("change", syncPrintBackgroundGraphicsControls);
  $("printPrinterSelect")?.addEventListener("change", loadPaperSizesForSelectedPrinter);
  $("printPaperSize")?.addEventListener("change", applySelectedPrintPaperSize);
  loadDesktopPrinters();
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
  $("pasteFieldBtn")?.addEventListener("click", pasteToSelectedField);
  $("editStaticFieldBtn")?.addEventListener("click", editSelectedStaticField);
  $("deleteStaticFieldBtn")?.addEventListener("click", deleteSelectedStaticField);
  $("deleteTemplateBtn")?.addEventListener("click", deleteCurrentTemplate);
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

  document.getElementById("confirmNewTemplate")?.addEventListener("click", createCustomTemplate);
  $("summaryVariant")?.addEventListener("change", () => {
    handleSummaryVariantChange();
  });
  relocateSharedStyleEditor();
  loadAllSamples();
  await loadServerTemplates();
  console.log("[DEBUG] after loadServerTemplates, templates.length:", templates.length, "select.options.length:", $("templateSelect")?.options?.length, "templateDesignerMode:", templateDesignerMode);
  if (templateDesignerMode || $("templateSelect")?.options?.length) {
    applyTemplate();
  } else {
    console.warn("[DEBUG] no templates to apply, rendering empty");
    render();
  }
  loadRitualOptions();
  loadDedicationTypeOptions();
  applyLaunchParams();
}

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
  renderTable();
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
    $("paperSelect").value = "custom";
  }
  const deleteBtn = $("deleteTemplateBtn");
  if (deleteBtn) deleteBtn.style.display = BUILTIN_TEMPLATE_IDS.has(template.id) ? "none" : "";
  render();
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
  console.log("[DEBUG] rebuildTemplateOptions called, select:", select, "templates.length:", templates.length);
  if (!select) { console.warn("[DEBUG] rebuildTemplateOptions: templateSelect element not found in DOM"); return; }
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
  console.log("[DEBUG] rebuildTemplateOptions done, options count:", select.options.length, "selectedId:", selectedId, "templates[0]:", templates[0]?.id);
  if (selectedId && Array.from(select.options).some((option) => option.value === selectedId)) {
    select.value = selectedId;
  } else if (templates[0]) {
    select.value = templates[0].id;
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
  const detectedKey = normalizeSingleVariantKey(row?.__variant || "");
  const selectedKey = normalizeSingleVariantKey(layout.singleVariantKey || state.singleVariantKey || presets[0].key);
  const shouldFollowDetected = detectedKey && !state.singleVariantManualOverride;
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
  if (remoteId && canSyncServerTemplates()) {
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
  if (!$("showBg")?.checked) return false;
  if (!forPrint) return true;
  return $("printBackgroundGraphics")?.checked ?? true;
}

function syncPrintBackgroundGraphicsControls(event = null) {
  const source = event?.target || $("designPrintBackgroundGraphics") || $("printBackgroundGraphics");
  const checked = source?.checked ?? true;
  ["designPrintBackgroundGraphics", "printBackgroundGraphics"].forEach((id) => {
    const control = $(id);
    if (control && control.checked !== checked) control.checked = checked;
  });
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
      batches = await Promise.all(plaqueTypes.map((plaqueType) => fetchJson(`/api/plaques?${new URLSearchParams({
        plaqueType,
        ...(status ? { status } : {}),
        ...(keyword ? { keyword } : {}),
        ...(ritualId ? { ritualId } : {}),
      }).toString()}`, {
        headers: authHeaders(),
      })));
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

  const group = dataGroupForPlaqueType(type);
  const targetMode = launchMode === "summary" ? "summary" : "single";
  if (state.mode !== targetMode) setMode(targetMode);
  setDataSourceStatus("牌位管理选中数据");
  applyLaunchTemplate(templateId);

  try {
    setBusy("正在载入牌位数据...");
    const selectedIds = new Set([plaqueId, ...plaqueIds].filter(Boolean));
    let plaques;
    if (isDesktopRuntime()) {
      plaques = (await listDesktopRows("plaques")).filter((plaque) => {
        if (selectedIds.size) return selectedIds.has(plaque.id);
        if (type && plaque.plaqueType !== type) return false;
        const status = $("systemStatus").value || "ACTIVE";
        return !status || plaque.status === status;
      });
    } else {
      const query = new URLSearchParams({
        ...(type ? { plaqueType: type } : {}),
        ...(!selectedIds.size && ($("systemStatus").value || "ACTIVE")
          ? { status: $("systemStatus").value || "ACTIVE" }
          : {}),
      });
      plaques = await fetchJson(`/api/plaques?${query.toString()}`, { headers: authHeaders() });
      if (selectedIds.size) plaques = plaques.filter((plaque) => selectedIds.has(plaque.id));
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
  }
}

function applyLaunchTemplate(templateId) {
  if (!templateId) return;
  const select = $("templateSelect");
  const matchingOption = Array.from(select.options).find((option) => {
    if (option.value === templateId) return true;
    return state.remoteTemplateIds[option.value] === templateId;
  });
  if (!matchingOption) {
    console.warn("未找到指定打印模板:", templateId);
    return;
  }
  select.value = matchingOption.value;
  applyTemplate();
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
    let settings = {};
    if (isDesktopRuntime()) {
      settings = await window.templeDesktop?.getCache?.("GET:/api/system/settings").then((cached) => cached?.value || {}).catch(() => ({}));
    } else {
      settings = await fetchJson("/api/system/settings");
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
  if ((forPrint || !templateDesignerMode) && detectedKey) {
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
  if (isEditingBackSide()) {
    $("fieldMapping").innerHTML = '<p class="hint">背面固定页不使用动态字段。</p>';
    return;
  }
  if (state.mode === "summary") {
    $("fieldMapping").innerHTML = "";
    buildSummaryFieldMapping();
    return;
  }
  const mapping = $("fieldMapping");
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
  if (!templateDesignerMode && !$("templateSelect").options.length) {
    $("preview").innerHTML = '<div class="empty">未读取到已同步模板，请先在主窗口同步服务器模板。</div>';
    $("statusText").textContent = "未读取到已同步模板";
    $("pageText").textContent = "";
    return;
  }
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
  const vertical = $("singleVertical").checked ? " vertical-text" : "";
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
      <span class="resize-handle" data-resize-key="${key}" aria-hidden="true"></span>
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
  await printRangeFrom(0, { systemDialog: false });
}

function enterPrintPreviewMode() {
  document.documentElement.classList.add("print-preview-mode");
  document.body.classList.add("print-preview-mode");
  syncPrintBackgroundGraphicsControls();
  syncPrintSize();
  render();
}

async function printFromPage() {
  const target = Number($("jumpPageInput")?.value) || state.pageIndex + 1;
  const startIndex = Math.max(target - 1, 0);
  await printRangeFrom(startIndex, { systemDialog: false });
}

async function printWithSystemDialog() {
  await printRangeFrom(0, { systemDialog: true });
}

async function printRangeFrom(startIndex = 0, options = {}) {
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
  bindDragHandles();
  await fitAllFields();
  await waitForPrintPreviewReady();
  if (window.templeDesktop?.printHtml) {
    const result = await window.templeDesktop.printHtml({
      html: buildDesktopPrintHtml($("preview").innerHTML),
      deviceName: $("printPrinterSelect")?.value || "",
      silent: !options.systemDialog,
      copies: Number($("printCopies")?.value) || 1,
      printBackground: $("printBackgroundGraphics")?.checked ?? true,
    }).catch((error) => ({ success: false, failureReason: error?.message || "打印失败" }));
    if (!result?.success && result?.failureReason) {
      alert(`打印失败：${result.failureReason}`);
    }
    restoreAfterPrint();
    return;
  }
  window.addEventListener("afterprint", restoreAfterPrint, { once: true });
  window.print();
}

async function loadDesktopPrinters() {
  const select = $("printPrinterSelect");
  if (!select || !window.templeDesktop?.listPrinters) return;
  const printers = await window.templeDesktop.listPrinters().catch(() => []);
  const current = select.value;
  select.innerHTML = '<option value="">系统默认打印机</option>';
  printers.forEach((printer) => {
    const option = document.createElement("option");
    option.value = printer.name;
    option.textContent = printer.displayName || printer.name;
    if (printer.description) {
      option.title = printer.description;
    }
    select.appendChild(option);
  });
  if (current && Array.from(select.options).some((option) => option.value === current)) {
    select.value = current;
  }
  await loadPaperSizesForSelectedPrinter();
}

async function loadPaperSizesForSelectedPrinter() {
  const select = $("printPaperSize");
  const printerName = $("printPrinterSelect")?.value || "";
  if (!select) return;

  const currentWidth = Number($("paperWidth").value) || 0;
  const currentHeight = Number($("paperHeight").value) || 0;
  select.innerHTML = '<option value="">按模板尺寸</option>';

  if (!printerName || !window.templeDesktop?.listPrinterPaperSizes) {
    appendFallbackPaperSizes(select);
    return;
  }

  const paperSizes = await window.templeDesktop.listPrinterPaperSizes(printerName).catch(() => []);
  const seen = new Set();
  paperSizes
    .filter((paper) => paper?.name && paper.widthMm > 0 && paper.heightMm > 0)
    .forEach((paper) => {
      const key = `${paper.name}:${paper.widthMm}:${paper.heightMm}`;
      if (seen.has(key)) return;
      seen.add(key);
      const option = document.createElement("option");
      option.value = `${paper.widthMm}x${paper.heightMm}`;
      option.textContent = `${paper.name} (${paper.widthMm} × ${paper.heightMm} mm)`;
      option.dataset.widthMm = String(paper.widthMm);
      option.dataset.heightMm = String(paper.heightMm);
      select.appendChild(option);
      if (Math.abs(paper.widthMm - currentWidth) < 1 && Math.abs(paper.heightMm - currentHeight) < 1) {
        select.value = option.value;
      }
    });

  if (select.options.length === 1) {
    appendFallbackPaperSizes(select);
  }
}

function appendFallbackPaperSizes(select) {
  [
    ["A4", 210, 297],
    ["A3", 297, 420],
    ["A5", 148, 210],
  ].forEach(([name, width, height]) => {
    const option = document.createElement("option");
    option.value = `${width}x${height}`;
    option.textContent = `${name} (${width} × ${height} mm)`;
    option.dataset.widthMm = String(width);
    option.dataset.heightMm = String(height);
    select.appendChild(option);
  });
}

function applySelectedPrintPaperSize() {
  const option = $("printPaperSize")?.selectedOptions?.[0];
  if (!option?.dataset?.widthMm || !option?.dataset?.heightMm) return;
  $("paperWidth").value = String(Number(option.dataset.widthMm));
  $("paperHeight").value = String(Number(option.dataset.heightMm));
  $("paperSelect").value = paperPresetForSize(Number($("paperWidth").value), Number($("paperHeight").value));
  syncPrintSize();
  render();
}

function buildDesktopPrintHtml(previewHtml) {
  const width = Number($("paperWidth").value) || 210;
  const height = Math.max(Number($("paperHeight").value) || 297, 1);
  const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((link) => `<link rel="stylesheet" href="${link.href}">`)
    .join("");
  const inlineStyles = Array.from(document.querySelectorAll("style"))
    .map((style) => `<style>${style.textContent || ""}</style>`)
    .join("");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  ${cssLinks}
  ${inlineStyles}
  <style>
    html, body { margin: 0; background: #fff; }
    body { display: block; }
    @page { size: ${width}mm ${height}mm; margin: 0; }
    .sheet { page-break-after: always; break-after: page; }
    .sheet:last-child { page-break-after: auto; break-after: auto; }
  </style>
</head>
<body>${previewHtml}</body>
</html>`;
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
  const rows = allCurrentRows();
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
  $("dataHint").textContent = `当前导入目标：${currentDataGroupName()}数据。延生和超度数据分开保存、分开预览、分开打印。`;
}

function applySummaryDefault(force = false) {
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
  if (isDesktopRuntime() && url.startsWith("/api/")) {
    const allowedPaths = ["/api/plaque-templates", "/api/auth/", "/api/system/settings"];
    if (!allowedPaths.some((prefix) => url.startsWith(prefix))) {
      throw new Error("桌面打印工具只读取本地数据库，请先在主窗口完成同步。");
    }
  }
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(url, { cache: "no-store", credentials: "include", ...options, headers });
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
      console.log("[DEBUG] loadServerTemplates desktop: localTemplates count:", localTemplates.length, "tablet-print count:", localTemplates.filter(t => t?.elements?.source === "tablet-print").length);
      localTemplates
        .filter((template) => template?.elements?.source === "tablet-print")
        .forEach(importServerTemplate);

      if (authToken()) {
        console.log("[DEBUG] loadServerTemplates desktop: auth token present, fetching from server");
        try {
          const serverTemplates = dedupeTemplateRecords(
            await fetchJson("/api/plaque-templates", authFetchOptions({ headers: authHeaders(), allowDesktopApi: true }))
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
      saveLayouts();
      saveCustomTemplatesToStorage();
      setTemplateStatus(localTemplates.length ? "本地已同步模板" : "内置模板", localTemplates.length ? "本地已同步" : "未发现本地模板");
      if (templateDesignerMode || $("templateSelect")?.options?.length) applyTemplate();
    } catch (error) {
      setTemplateStatus("内置模板", "本地模板读取失败");
      console.warn("加载本地模板失败，继续使用内置模板:", error);
    }
    return;
  }

  try {
    const serverTemplates = dedupeTemplateRecords(await fetchJson("/api/plaque-templates", authFetchOptions({ headers: authHeaders() })));
    console.log("[DEBUG] loadServerTemplates web: serverTemplates count:", serverTemplates.length, "tablet-print count:", serverTemplates.filter(t => t?.elements?.source === "tablet-print").length);
    serverTemplates
      .filter((template) => template?.elements?.source === "tablet-print")
      .forEach(importServerTemplate);
    if (pruneObsoleteSingleTemplates()) {
      saveRemoteTemplateIds();
    }
    saveLayouts();
    saveCustomTemplatesToStorage();
    setTemplateStatus(serverTemplates.length ? "服务器模板" : "内置模板", serverTemplates.length ? "服务器已同步" : "服务器无模板");
    if (templateDesignerMode || $("templateSelect")?.options?.length) applyTemplate();
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
  console.log("[DEBUG] importServerTemplate called, template.id:", template.id, "data.template.id:", data?.template?.id);
  if (!data?.template?.id) { console.warn("[DEBUG] importServerTemplate: no data.template.id, skipping"); return; }
  if (HIDDEN_LEGACY_TEMPLATE_IDS.has(data.template.id)) { console.log("[DEBUG] importServerTemplate: hidden legacy template, skipping"); return; }
  const localTemplate = {
    ...data.template,
    id: data.template.id,
    tabletType: normalizeImportedTabletType(data.template.tabletType),
    name: data.template.name || template.name || templateDisplayName(data.template),
  };
  const normalizedTemplate = normalizeCatalogTemplate(localTemplate);

  // Match by direct ID, then fall back to remoteTemplateIds mapping
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
      vertical: state.mode === "summary" ? false : $("singleVertical").checked,
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
        });
      } else {
        const response = await fetchJson("/api/plaque-templates", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(body),
          allowDesktopApi: true,
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
    });
  } else {
    const response = await fetchJson("/api/plaque-templates", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
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
  }
  if (state.layouts[type].backSide) normalizeSideLayout(state.layouts[type].backSide);
  if (isSummaryTemplateId(type) && repairSummaryTemplateLayout(type)) saveLayouts();
  return state.layouts[type];
}

function positionFor(key, variantKey = currentSummaryVariantKey()) {
  if (isBackSideActive()) {
    const layout = backLayoutFor(currentLayoutKey());
    if (layout.positions[key]) return layout.positions[key];
    layout.positions[key] = { x: 50, y: 50 };
    return layout.positions[key];
  }
  const type = currentLayoutKey();
  const layout = ensureLayout(type);
  if (isSingleVariantFieldKey(key)) {
    const singleVariant = state.renderSingleVariant || currentSingleVariantKey();
    const saved = getLayoutBucketValue(layout, "positions", key, singleVariant);
    if (saved) return saved;
    const fallback = singleVariantDefaultValue(type, singleVariant, "positions", key, { x: 50, y: 50 });
    return setLayoutBucketValue(layout, "positions", key, fallback, singleVariant);
  }
  const saved = getLayoutBucketValue(layout, "positions", key, variantKey);
  if (saved) return saved;
  const fallback = clone(
    state.mode === "summary" && isSummaryFieldKey(key)
      ? summaryDefaultPosition(key, variantKey)
      : (templateDefaults[type]?.positions?.[key] || { x: 50, y: 50 })
  );
  if (state.mode === "summary" && isSummaryFieldKey(key)) {
    return setLayoutBucketValue(layout, "positions", key, fallback, variantKey);
  }
  layout.positions[key] = fallback;
  return layout.positions[key];
}

async function saveCurrentLayout() {
  const layoutKey = currentLayoutKey();
  const layout = ensureLayout(layoutKey);
  layout.updatedAt = new Date().toISOString();
  layout.paper = {
    width: Number($("paperWidth").value) || 210,
    height: Number($("paperHeight").value) || 297,
    vertical: $("singleVertical").checked,
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
  $("singleVertical").checked = template.vertical;
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
  if (isBackSideActive()) {
    const layout = backLayoutFor(currentLayoutKey());
    if (layout.styles[key]) return layout.styles[key];
    layout.styles[key] = { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif", textAlign: "center", verticalAlign: "center", wrapMode: "anywhere" };
    return layout.styles[key];
  }
  const type = currentLayoutKey();
  const layout = ensureLayout(type);
  if (isSingleVariantFieldKey(key)) {
    const singleVariant = state.renderSingleVariant || currentSingleVariantKey();
    const saved = getLayoutBucketValue(layout, "styles", key, singleVariant);
    if (saved) return saved;
    const fallback = singleVariantDefaultValue(
      type,
      singleVariant,
      "styles",
      key,
      templateDefaults[type]?.styles?.[key] || { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif", textAlign: "center", verticalAlign: "center", wrapMode: "anywhere" }
    );
    return setLayoutBucketValue(layout, "styles", key, fallback, singleVariant);
  }
  const saved = getLayoutBucketValue(layout, "styles", key, variantKey);
  if (saved) return saved;
  const fallback = clone(
    state.mode === "summary" && isSummaryFieldKey(key)
      ? { fontSize: Number($("summaryFont").value) || 22, color: "#16110d", fontFamily: "SimSun, serif", textAlign: "left", verticalAlign: "center", wrapMode: "anywhere" }
      : (templateDefaults[type]?.styles?.[key] || { fontSize: 18, color: "#16110d", fontFamily: "SimSun, serif", textAlign: "center", verticalAlign: "center", wrapMode: "anywhere" })
  );
  if (state.mode === "summary" && isSummaryFieldKey(key)) {
    return setLayoutBucketValue(layout, "styles", key, fallback, variantKey);
  }
  layout.styles[key] = fallback;
  return layout.styles[key];
}

function sizeFor(key, variantKey = currentSummaryVariantKey()) {
  if (isBackSideActive()) {
    const layout = backLayoutFor(currentLayoutKey());
    if (layout.sizes[key]) return layout.sizes[key];
    layout.sizes[key] = { w: 24, h: 12 };
    return layout.sizes[key];
  }
  const type = currentLayoutKey();
  const layout = ensureLayout(type);
  if (isSingleVariantFieldKey(key)) {
    const singleVariant = state.renderSingleVariant || currentSingleVariantKey();
    const saved = getLayoutBucketValue(layout, "sizes", key, singleVariant);
    if (saved) return saved;
    const fallback = singleVariantDefaultValue(type, singleVariant, "sizes", key, { w: 20, h: 20 });
    return setLayoutBucketValue(layout, "sizes", key, fallback, singleVariant);
  }
  const saved = getLayoutBucketValue(layout, "sizes", key, variantKey);
  if (saved) return saved;
  const fallback = clone(
    state.mode === "summary" && isSummaryFieldKey(key)
      ? summaryDefaultSize(key)
      : (templateDefaults[type]?.sizes?.[key] || { w: 20, h: 20 })
  );
  if (state.mode === "summary" && isSummaryFieldKey(key)) {
    return setLayoutBucketValue(layout, "sizes", key, fallback, variantKey);
  }
  layout.sizes[key] = fallback;
  return layout.sizes[key];
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

function applyFieldPlacement(layout, key, nextPlacement, options = {}) {
  const { isStatic = false } = options;
  const nextPosition = clone(nextPlacement.position || { x: 50, y: 50 });
  const nextSize = clone(nextPlacement.size || { w: 24, h: 12 });
  const nextStyle = clone(nextPlacement.style || normalizeFieldStyle());
  if (isEditingBackSide()) {
    layout.positions[key] = nextPosition;
    layout.sizes[key] = nextSize;
    layout.styles[key] = nextStyle;
    return;
  }
  if (state.mode === "single") {
    setLayoutBucketValue(layout, "positions", key, nextPosition, currentSingleVariantKey());
    setLayoutBucketValue(layout, "sizes", key, nextSize, currentSingleVariantKey());
    setLayoutBucketValue(layout, "styles", key, nextStyle, currentSingleVariantKey());
    return;
  }
  if (state.mode === "summary" && !isStatic) {
    setLayoutBucketValue(layout, "positions", key, nextPosition, currentSummaryVariantKey());
    setLayoutBucketValue(layout, "sizes", key, nextSize, currentSummaryVariantKey());
    setLayoutBucketValue(layout, "styles", key, nextStyle, currentSummaryVariantKey());
    return;
  }
  layout.positions[key] = nextPosition;
  layout.sizes[key] = nextSize;
  layout.styles[key] = nextStyle;
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
    }, { isStatic: true });
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
  if (isEditingBackSide()) {
    layout.positions[state.interaction.key] = nextPos;
  } else if (isSingleVariantFieldKey(state.interaction.key)) {
    setLayoutBucketValue(layout, "positions", state.interaction.key, nextPos, currentSingleVariantKey());
  } else if (state.mode === "summary" && isSummaryFieldKey(state.interaction.key)) {
    setLayoutBucketValue(layout, "positions", state.interaction.key, nextPos);
  } else {
    layout.positions[state.interaction.key] = nextPos;
  }
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
  if (isEditingBackSide()) {
    layout.sizes[state.interaction.key] = nextSize;
  } else if (isSingleVariantFieldKey(state.interaction.key)) {
    setLayoutBucketValue(layout, "sizes", state.interaction.key, nextSize, currentSingleVariantKey());
  } else if (state.mode === "summary" && isSummaryFieldKey(state.interaction.key)) {
    setLayoutBucketValue(layout, "sizes", state.interaction.key, nextSize);
  } else {
    layout.sizes[state.interaction.key] = nextSize;
  }
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
  if (typeof settings.format === "string") $("summaryFormat").value = settings.format;
  if (settings.columnCount) $("columnCount").value = settings.columnCount;
  if (settings.rowsPerColumn) $("rowsPerColumn").value = settings.rowsPerColumn;
  if (settings.fontSize) $("summaryFont").value = settings.fontSize;
  if (settings.lineGap !== undefined) $("summaryLineGap").value = settings.lineGap;
  if (settings.pageMargin !== undefined) $("pageMargin").value = settings.pageMargin;
  if (settings.columnGap !== undefined) $("columnGap").value = settings.columnGap;
  if (settings.vertical !== undefined) $("summaryVertical").checked = settings.vertical;
  if (settings.variantKey && Array.from($("summaryVariant")?.options || []).some((option) => option.value === settings.variantKey)) {
    $("summaryVariant").value = settings.variantKey;
  }
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
  if (event.key === "Escape") {
    closeFieldContextMenu();
    return;
  }
  if (event.key !== "Delete" && event.key !== "Backspace") return;
  const tag = document.activeElement?.tagName || "";
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
  const key = currentSelectedFieldKey();
  if (!key) return;
  event.preventDefault();
  state.activeFieldKey = key;
  deleteSelectedField(key);
});

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName || "";
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
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  if (!currentSelectedFieldKey()) return;
  event.preventDefault();
  nudgeSelectedField(event.key, event.shiftKey ? 1 : 0.2);
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
  const width = Number($("paperWidth").value) || 210;
  const height = Math.max(Number($("paperHeight").value) || 297, 1);
  return `--paper-w:${width}mm; --paper-h:${height}mm;`;
}

function syncPrintSize() {
  const width = Number($("paperWidth").value) || 210;
  const height = Math.max(Number($("paperHeight").value) || 297, 1);
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

init();

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

