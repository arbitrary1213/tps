const templates = [
  { id: "cmp6uyyk10003bjnjsqkn2uwn", name: "延生通名", width: 297, height: 420, vertical: true, mode: "summary", dataGroup: "blessing" },
  { id: "cmowl79v5000a2rdgs4czs9bo", name: "往生通名", width: 297, height: 420, vertical: true, mode: "summary", dataGroup: "deliverance" },
  { id: "cmoz9dtgc015wcyyxjcwqcumq", name: "红牒", width: 420, height: 297, vertical: true, mode: "single", dataGroup: "blessing" },
  { id: "cmp6vaj3l000gbjnjoak9q9wx", name: "延生禄位", width: 125, height: 360, vertical: true, mode: "single", dataGroup: "blessing" },
  { id: "92171e1d-e697-46df-bfcc-4cb8f9a29661", name: "红壳", width: 125, height: 360, vertical: true, mode: "single", dataGroup: "blessing" },
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
	  cmp805m5q004mtv6zrijpw91y: { name: "牒壳反面", groupLabel: "牌位模版", groupOrder: 1, order: 3, mode: "single", dataGroup: "blessing" },
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
