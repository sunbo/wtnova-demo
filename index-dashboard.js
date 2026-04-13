(function () {
  const PLACEHOLDER = "--";
  const DEPARTMENT_FILES = {
    finance: "财务部数据看板.html",
    product: "产品研发部数据看板.html",
    solution: "解决方案部数据看板.html",
    delivery: "交付部数据看板.html",
    hr: "人力资源数据看板.html"
  };
  const DEPARTMENT_TONES = {
    finance: "warn",
    product: "warn",
    solution: "good",
    delivery: "warn",
    hr: "risk"
  };
  const OVERVIEW_EDITOR_FILE = "经营数据卡片-编辑.html";

  const app = document.getElementById("app");
  let activeDetail = null;

  function safeNumber(value, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const normalized = Number(String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(normalized) ? normalized : fallback;
  }

  function safeText(value, fallback = PLACEHOLDER) {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    return text || fallback;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function tooltipAttr(value) {
    const text = safeText(value, "");
    return text ? ` title="${escapeHtml(text)}"` : "";
  }

  function composeTooltip() {
    return Array.prototype.slice.call(arguments)
      .map((item) => safeText(item, ""))
      .filter(Boolean)
      .join(" | ");
  }

  function renderTextTag(tagName, className, value, fallback = PLACEHOLDER) {
    const text = safeText(value, fallback);
    return `<${tagName} class="${className}"${tooltipAttr(text)}>${escapeHtml(text)}</${tagName}>`;
  }

  function formatWan(value) {
    const num = safeNumber(value, NaN);
    return Number.isFinite(num) ? `${Math.round(num).toLocaleString("zh-CN")}万` : PLACEHOLDER;
  }

  function formatPercent(value, digits = 0) {
    const num = safeNumber(value, NaN);
    return Number.isFinite(num) ? `${num.toFixed(digits)}%` : PLACEHOLDER;
  }

  function getAllDepartmentData() {
    return window.DashboardSync ? window.DashboardSync.getAllDepartmentData() : {};
  }

  function firstRiskSummary(data) {
    return data && Array.isArray(data.riskSummary) && data.riskSummary.length > 0 ? data.riskSummary[0] : null;
  }

  function severeRiskCategories(allData) {
    const categories = [];
    Object.values(allData).forEach((department) => {
      (department?.riskSummary || []).forEach((item) => {
        if (safeText(item.level, "") === "严重" && safeText(item.category, "") !== "") {
          categories.push(item.category);
        }
      });
    });
    return Array.from(new Set(categories));
  }

  function shortProductName(name) {
    const text = safeText(name, "");
    if (text.includes("PMS")) return "PMS";
    if (text.includes("OpenClaw")) return "OpenClaw";
    if (text.includes("供应链")) return "供应链";
    if (text.includes("客服")) return "客服平台";
    return text || PLACEHOLDER;
  }

  function take(array, count) {
    return Array.isArray(array) ? array.slice(0, count) : [];
  }

  function normalizeRiskLevel(level) {
    const text = safeText(level, "").toLowerCase();
    if (text === "high" || text === "高") return "high";
    if (text === "mid" || text === "medium" || text === "中") return "mid";
    return "low";
  }

  function placeholderMetrics(items) {
    return items.map((item) => ({ ...item, value: PLACEHOLDER, desc: PLACEHOLDER }));
  }

  function placeholderOverview() {
    return [
      { label: "企业现金安全垫", value: PLACEHOLDER, cls: "blue", desc: PLACEHOLDER },
      { label: "重点经营风险", value: PLACEHOLDER, cls: "amber", desc: PLACEHOLDER },
      { label: "重点项目绑定产品", value: PLACEHOLDER, cls: "purple", desc: PLACEHOLDER },
      { label: "交付项目总量", value: PLACEHOLDER, cls: "green", desc: PLACEHOLDER },
      { label: "覆盖部门", value: "5个", cls: "blue", desc: "财务 / 产品 / 交付 / 售前 / 人力" },
      { label: "产品侧在途商机", value: PLACEHOLDER, cls: "purple", desc: PLACEHOLDER },
      { label: "交付累计回款", value: PLACEHOLDER, cls: "green", desc: PLACEHOLDER },
      { label: "当前编制缺口", value: PLACEHOLDER, cls: "amber", desc: PLACEHOLDER }
    ];
  }

  function placeholderDepartments() {
    return {
      finance: {
        key: "finance",
        name: "财务情况",
        file: DEPARTMENT_FILES.finance,
        status: { text: PLACEHOLDER, tone: DEPARTMENT_TONES.finance },
        metrics: placeholderMetrics([{ label: "技术服务收入" }, { label: "净利润" }, { label: "可用资金" }, { label: "逾期应收" }]),
        bars: [
          { label: "收入", value: 0, display: PLACEHOLDER },
          { label: "毛利", value: 0, display: PLACEHOLDER },
          { label: "成本", value: 0, display: PLACEHOLDER },
          { label: "现金", value: 0, display: PLACEHOLDER }
        ],
        risks: [
          { title: PLACEHOLDER, desc: PLACEHOLDER, level: "low" },
          { title: PLACEHOLDER, desc: PLACEHOLDER, level: "low" },
          { title: PLACEHOLDER, desc: PLACEHOLDER, level: "low" }
        ]
      },
      product: {
        key: "product",
        name: "产品经营",
        file: DEPARTMENT_FILES.product,
        status: { text: PLACEHOLDER, tone: DEPARTMENT_TONES.product },
        metrics: placeholderMetrics([{ label: "路标达成率" }, { label: "在途商机" }, { label: "关联项目营收" }, { label: "高优 Bug" }]),
        roadmap: [
          { label: "PMS", value: 0, display: PLACEHOLDER },
          { label: "OpenClaw", value: 0, display: PLACEHOLDER },
          { label: "供应链", value: 0, display: PLACEHOLDER },
          { label: "客服平台", value: 0, display: PLACEHOLDER }
        ],
        bugs: [
          { label: "阻塞级", value: 0, max: 1, cls: "red", display: PLACEHOLDER },
          { label: "严重级", value: 0, max: 1, cls: "amber", display: PLACEHOLDER },
          { label: "一般级", value: 0, max: 1, cls: "cyan", display: PLACEHOLDER },
          { label: "关闭率", value: 0, max: 100, cls: "green", unit: "%", display: PLACEHOLDER }
        ],
        team: placeholderMetrics([{ label: "前端" }, { label: "后端" }, { label: "平均人效" }])
      },
      delivery: {
        key: "delivery",
        name: "项目交付",
        file: DEPARTMENT_FILES.delivery,
        status: { text: PLACEHOLDER, tone: DEPARTMENT_TONES.delivery },
        metrics: placeholderMetrics([{ label: "在建项目" }, { label: "交付利用率" }, { label: "累计回款" }, { label: "外采占比" }]),
        projects: [
          { title: PLACEHOLDER, meta: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER], tone: "good" },
          { title: PLACEHOLDER, meta: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER], tone: "warn" },
          { title: PLACEHOLDER, meta: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER], tone: "warn" },
          { title: PLACEHOLDER, meta: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER], tone: "risk" }
        ],
        resources: [
          { label: "APS", value: 0, display: PLACEHOLDER },
          { label: "MES", value: 0, display: PLACEHOLDER },
          { label: "风电", value: 0, display: PLACEHOLDER },
          { label: "PMO", value: 0, display: PLACEHOLDER },
          { label: "外包", value: 0, display: PLACEHOLDER },
          { label: "金航", value: 0, display: PLACEHOLDER }
        ]
      },
      solution: {
        key: "solution",
        name: "售前商机",
        file: DEPARTMENT_FILES.solution,
        status: { text: PLACEHOLDER, tone: DEPARTMENT_TONES.solution },
        metrics: placeholderMetrics([{ label: "年度收目标" }, { label: "年度签单目标" }, { label: "商机盘点" }]),
        donut: {
          total: PLACEHOLDER,
          subtitle: "已签合同",
          segments: [
            { label: "定制交付", value: 0, color: "#0052d9", display: PLACEHOLDER },
            { label: "资源整合", value: 0, color: "#2f7bff", display: PLACEHOLDER },
            { label: "产品/ODM", value: 0, color: "#79a8ff", display: PLACEHOLDER }
          ]
        },
        opportunities: [
          { title: PLACEHOLDER, desc: PLACEHOLDER },
          { title: PLACEHOLDER, desc: PLACEHOLDER },
          { title: PLACEHOLDER, desc: PLACEHOLDER },
          { title: PLACEHOLDER, desc: PLACEHOLDER },
          { title: PLACEHOLDER, desc: PLACEHOLDER }
        ]
      },
      hr: {
        key: "hr",
        name: "人力资源",
        file: DEPARTMENT_FILES.hr,
        status: { text: PLACEHOLDER, tone: DEPARTMENT_TONES.hr },
        metrics: placeholderMetrics([{ label: "在编总人数" }, { label: "招聘需求" }, { label: "编制缺口" }, { label: "Offer / 入职" }]),
        funnel: [
          { label: "需求发布", value: 0, text: PLACEHOLDER },
          { label: "简历储备", value: 0, text: PLACEHOLDER },
          { label: "一面推进", value: 0, text: PLACEHOLDER },
          { label: "Offer / 入职", value: 0, text: PLACEHOLDER }
        ],
        vacancies: [
          { title: PLACEHOLDER, desc: PLACEHOLDER, level: "high" },
          { title: PLACEHOLDER, desc: PLACEHOLDER, level: "mid" },
          { title: PLACEHOLDER, desc: PLACEHOLDER, level: "mid" },
          { title: PLACEHOLDER, desc: PLACEHOLDER, level: "low" }
        ]
      }
    };
  }

  function defaultOverviewState() {
    const revenueTarget = 4000;
    const revenueActual = 0;
    const profitTarget = 700;
    const profitActual = -44.2;
    const revenueRate = revenueTarget > 0 ? (revenueActual / revenueTarget) * 100 : 0;
    const profitRate = profitTarget > 0 ? (profitActual / profitTarget) * 100 : 0;

    return {
      charts: [
        {
          title: "收入达成率",
          targetLabel: "2026年收入目标",
          targetValue: "4000万",
          actualLabel: "年度收入合计",
          actualValue: "0万",
          rate: revenueRate,
          displayRate: `${revenueRate.toFixed(0)}%`
        },
        {
          title: "利润达成率",
          targetLabel: "2026年毛利润目标",
          targetValue: "700万",
          actualLabel: "年度毛利合计",
          actualValue: "-44.2万",
          rate: profitRate,
          displayRate: `${profitRate.toFixed(2)}%`
        }
      ],
      summaryTitle: "2月经营情况说明",
      summary: "本月公司还处于投入阶段，未形成收入；累计亏损53.72万元，主要源于营业成本（43.14万元）、管理费用（9.52万元）等固定支出。以下是2月收入和毛利的执行情况。",
      unitNote: "单位：万元，毛利率按 %",
      kpis: [
        {
          label: "收入",
          annualTarget: "4000",
          q1: "50",
          q2: "950",
          q3: "2000",
          q4: "1000",
          currentMonth: "0",
          accumulative: "0",
          quarterRate: "/",
          annualRate: "/",
          gap: "50",
          lastYear: "/",
          yoy: "/"
        },
        {
          label: "毛利润",
          annualTarget: "700",
          q1: "5",
          q2: "185",
          q3: "300",
          q4: "210",
          currentMonth: "-44.2",
          accumulative: "-44.2",
          quarterRate: "-884%",
          annualRate: "-6.31%",
          gap: "49.2",
          lastYear: "/",
          yoy: "/"
        },
        {
          label: "毛利率",
          annualTarget: "18%",
          q1: "10%",
          q2: "19%",
          q3: "15%",
          q4: "21%",
          currentMonth: "/",
          accumulative: "/",
          quarterRate: "/",
          annualRate: "/",
          gap: "/",
          lastYear: "/",
          yoy: "/"
        }
      ]
    };
  }

  function buildOverview() {
    const defaults = defaultOverviewState();
    const stored = window.DashboardSync ? window.DashboardSync.getStoredPageState("overview", null) : null;
    if (!stored) return defaults;
    return {
      charts: Array.isArray(stored.charts) && stored.charts.length ? stored.charts : defaults.charts,
      unitNote: safeText(stored.unitNote, defaults.unitNote),
      kpis: Array.isArray(stored.kpis) && stored.kpis.length ? stored.kpis : defaults.kpis,
      updateTime: safeText(stored.updateTime, ""),
      fileName: safeText(stored.fileName, "")
    };
  }

  function buildFinance(data, placeholder) {
    if (!data) return placeholder;
    const risks = take(data.riskData, 4).map((item) => ({
      title: safeText(item.title),
      desc: safeText(item.desc),
      level: normalizeRiskLevel(item.level)
    }));
    while (risks.length < 4) risks.push({ title: PLACEHOLDER, desc: PLACEHOLDER, level: "low" });
    return {
      ...placeholder,
      status: { text: safeText(firstRiskSummary(data)?.summary), tone: placeholder.status.tone },
      metrics: [
        { label: "技术服务收入", value: formatWan(data.profitData?.revenue?.value), desc: `同比 ${formatPercent(data.profitData?.revenue?.yoyChange, 1)}` },
        { label: "净利润", value: formatWan(data.profitData?.netProfit?.value), desc: `净利率 ${formatPercent(data.profitData?.netProfit?.rate, 1)}` },
        { label: "可用资金", value: formatWan(data.cashFlowData?.available), desc: `净现金流 ${safeNumber(data.cashFlowData?.netFlow) >= 0 ? "+" : ""}${formatWan(data.cashFlowData?.netFlow)}` },
        { label: "逾期应收", value: formatWan(data.receivableData?.overdue?.amount), desc: `占应收总额 ${formatPercent(data.receivableData?.overdue?.rate, 1)}` }
      ],
      bars: [
        { label: "收入", value: safeNumber(data.profitData?.revenue?.value), display: formatWan(data.profitData?.revenue?.value) },
        { label: "毛利", value: safeNumber(data.profitData?.grossProfit?.value), display: formatWan(data.profitData?.grossProfit?.value) },
        { label: "成本", value: safeNumber(data.profitData?.grossProfit?.cost), display: formatWan(data.profitData?.grossProfit?.cost) },
        { label: "现金", value: safeNumber(data.cashFlowData?.available), display: formatWan(data.cashFlowData?.available) }
      ],
      risks
    };
  }

  function buildProduct(data, placeholder) {
    if (!data) return placeholder;
    const upstreamRows = data.business?.upstreamRows || [];
    const downstreamRows = data.business?.downstreamRows || [];
    const qualityRows = data.quality?.rows || [];
    const teamRows = data.team?.rows || [];
    const totalBlocker = qualityRows.reduce((sum, item) => sum + safeNumber(item.blocker), 0);
    const totalMajor = qualityRows.reduce((sum, item) => sum + safeNumber(item.major), 0);
    const totalMinor = qualityRows.reduce((sum, item) => sum + safeNumber(item.minor), 0);
    const avgCloseRate = qualityRows.length ? Math.round(qualityRows.reduce((sum, item) => sum + safeNumber(item.closeRate), 0) / qualityRows.length) : 0;
    const totalPm = teamRows.reduce((sum, item) => sum + safeNumber(item.pm), 0);
    const totalFe = teamRows.reduce((sum, item) => sum + safeNumber(item.fe), 0);
    const totalBe = teamRows.reduce((sum, item) => sum + safeNumber(item.be), 0);
    const totalQa = teamRows.reduce((sum, item) => sum + safeNumber(item.qa), 0);
    const totalTeam = teamRows.reduce((sum, item) => sum + safeNumber(item.total, safeNumber(item.pm) + safeNumber(item.fe) + safeNumber(item.be) + safeNumber(item.qa)), 0);
    const avgEfficiency = teamRows.length ? Math.round(teamRows.reduce((sum, item) => sum + safeNumber(item.efficiency), 0) / teamRows.length) : 0;
    const roadmap = take(data.roadmap, 4).map((item) => ({ label: shortProductName(item.product), value: safeNumber(item.progress), display: `${safeNumber(item.progress)}%` }));
    while (roadmap.length < 4) roadmap.push({ label: PLACEHOLDER, value: 0, display: PLACEHOLDER });
    return {
      ...placeholder,
      status: { text: safeText(firstRiskSummary(data)?.summary), tone: placeholder.status.tone },
      metrics: [
        { label: "路标达成率", value: safeText((data.topMetrics || []).find((item) => item.label === "关键产品路标达成率")?.value), desc: safeText((data.topMetrics || []).find((item) => item.label === "关键产品路标达成率")?.desc) },
        { label: "在途商机", value: `${upstreamRows.reduce((sum, item) => sum + safeNumber(item.opportunityCount), 0)}个`, desc: `预计总额 ${formatWan(upstreamRows.reduce((sum, item) => sum + safeNumber(item.amount), 0))}` },
        { label: "关联项目营收", value: formatWan(downstreamRows.reduce((sum, item) => sum + safeNumber(item.revenue), 0)), desc: `${upstreamRows.reduce((sum, item) => sum + safeNumber(item.relatedProjects), 0)} 个重点项目绑定产品交付` },
        { label: "高优 Bug", value: `${totalBlocker + totalMajor}个`, desc: `阻塞 ${totalBlocker}，严重 ${totalMajor}` }
      ],
      roadmap,
      bugs: [
        { label: "阻塞级", value: totalBlocker, max: Math.max(totalBlocker + totalMajor + totalMinor, 1), cls: "red", display: String(totalBlocker) },
        { label: "严重级", value: totalMajor, max: Math.max(totalBlocker + totalMajor + totalMinor, 1), cls: "amber", display: String(totalMajor) },
        { label: "一般级", value: totalMinor, max: Math.max(totalBlocker + totalMajor + totalMinor, 1), cls: "cyan", display: String(totalMinor) },
        { label: "关闭率", value: avgCloseRate, max: 100, cls: "green", unit: "%", display: `${avgCloseRate}%` }
      ],
      team: [
        { label: "前端", value: `${totalFe}人`, desc: `产品经理 ${totalPm}人` },
        { label: "后端", value: `${totalBe}人`, desc: `QA ${totalQa}人` },
        { label: "平均人效", value: `${avgEfficiency}%`, desc: `总人数 ${totalTeam}人` }
      ]
    };
  }

  function buildDelivery(data, placeholder) {
    if (!data) return placeholder;
    const detailsMap = new Map((data.paymentData?.details || []).map((item) => [safeText(item.project, ""), item]));
    const projects = take(data.projectProgress?.projects, 4).map((item, index) => {
      const payment = detailsMap.get(safeText(item.name, ""));
      return {
        title: safeText(item.name),
        meta: [
          safeText(item.progress),
          item.risk ? `风险 ${safeText(item.risk)}` : "风险 无",
          payment?.nextDate ? `回款 ${safeText(payment.nextDate)}` : "回款 --"
        ],
        tone: item.risk ? (index === 0 ? "warn" : "risk") : "good"
      };
    });
    while (projects.length < 4) projects.push({ title: PLACEHOLDER, meta: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER], tone: "good" });

    const resources = take(data.resourceData?.distribution, 6).map((item) => ({
      label: safeText(item.project),
      value: safeNumber(item.days),
      display: String(safeNumber(item.days))
    }));
    while (resources.length < 6) resources.push({ label: PLACEHOLDER, value: 0, display: PLACEHOLDER });

    return {
      ...placeholder,
      status: { text: safeText(firstRiskSummary(data)?.summary), tone: placeholder.status.tone },
      metrics: [
        { label: "在建项目", value: `${(data.projectProgress?.projects || []).length}个`, desc: safeText(data.projectProgress?.overview) },
        { label: "交付利用率", value: formatPercent(data.resourceData?.utilization?.percentage), desc: safeText(data.resourceData?.utilization?.desc) },
        { label: "累计回款", value: formatWan(data.paymentData?.received), desc: `合同总额 ${formatWan(data.paymentData?.total)}` },
        { label: "外采占比", value: formatPercent(data.resourceData?.outsourcing?.percentage), desc: safeText(data.resourceData?.outsourcing?.desc) }
      ],
      projects,
      resources
    };
  }

  function buildSolution(data, placeholder) {
    if (!data) return placeholder;
    const target = data.targetData || {};
    const receivableParts = [
      { label: "定制交付", value: safeNumber(target.receivable?.custom) },
      { label: "资源整合", value: safeNumber(target.receivable?.resource) },
      { label: "产品/ODM", value: safeNumber(target.receivable?.product) }
    ].sort((a, b) => b.value - a.value);

    const opportunities = take(data.opportunities, 5).map((item) => ({
      title: safeText(item.name),
      desc: `${formatWan(item.amount)} | 赢单率 ${formatPercent(item.winRate)} | 预计 ${safeText(item.expectedDate)}`
    }));
    while (opportunities.length < 5) opportunities.push({ title: PLACEHOLDER, desc: PLACEHOLDER });

    return {
      ...placeholder,
      status: { text: safeText(firstRiskSummary(data)?.summary), tone: placeholder.status.tone },
      metrics: [
        { label: "年度收目标", value: formatWan(target.receivable?.total), desc: `${safeText(receivableParts[0]?.label)}占比最高` },
        { label: "年度签单目标", value: formatWan(target.signed?.total), desc: `已签合同 ${formatWan(target.contract?.total)}` },
        { label: "商机盘点", value: formatWan(target.opportunity?.total), desc: `已有 ${formatWan(target.opportunity?.existing)}，缺口 ${formatWan(target.opportunity?.gap)}` }
      ],
      donut: {
        total: formatWan(target.contract?.total),
        subtitle: "已签合同",
        segments: [
          { label: "定制交付", value: safeNumber(target.contract?.custom), color: "#0052d9", display: formatWan(target.contract?.custom) },
          { label: "资源整合", value: safeNumber(target.contract?.resource), color: "#2f7bff", display: formatWan(target.contract?.resource) },
          { label: "产品/ODM", value: safeNumber(target.contract?.product), color: "#79a8ff", display: formatWan(target.contract?.product) }
        ]
      },
      opportunities
    };
  }

  function buildHr(data, placeholder) {
    if (!data) return placeholder;
    const recruitments = data.recruitmentData || [];
    const events = data.employeeRelationsData?.events || [];
    const departments = (data.departmentData || []).slice().sort((a, b) => safeNumber(b.vacant) - safeNumber(a.vacant));
    const totalDemand = recruitments.reduce((sum, item) => sum + safeNumber(item.demand), 0);
    const totalResume = recruitments.reduce((sum, item) => sum + safeNumber(item.resume), 0);
    const totalFirst = recruitments.reduce((sum, item) => sum + safeNumber(item.firstInterview), 0);
    const totalOffer = recruitments.reduce((sum, item) => sum + safeNumber(item.offer), 0);
    const totalOnboarded = recruitments.reduce((sum, item) => sum + safeNumber(item.onboarded), 0);
    const totalVacant = departments.reduce((sum, item) => sum + safeNumber(item.vacant), 0);
    const totalHeadcount = safeNumber((events.find((item) => safeText(item.type, "") === "在编总人数") || {}).count);
    const maxVacancy = departments[0];
    const demandBase = Math.max(totalDemand, 1);
    const vacancies = take(departments, 4).map((item, index) => ({
      title: safeText(item.department),
      desc: `编制 ${safeNumber(item.totalPositions)} / 在编 ${safeNumber(item.currentStaff)}`,
      level: safeNumber(item.vacant) >= 3 ? "high" : index < 2 ? "mid" : "low"
    }));
    while (vacancies.length < 4) vacancies.push({ title: PLACEHOLDER, desc: PLACEHOLDER, level: "low" });

    return {
      ...placeholder,
      status: { text: safeText(firstRiskSummary(data)?.summary), tone: placeholder.status.tone },
      metrics: [
        { label: "在编总人数", value: `${totalHeadcount}人`, desc: "员工关系看板当前在编" },
        { label: "招聘需求", value: `${totalDemand}人`, desc: `共 ${recruitments.length} 个岗位在招` },
        { label: "编制缺口", value: `${totalVacant}人`, desc: maxVacancy ? `${safeText(maxVacancy.department)}缺口 ${safeNumber(maxVacancy.vacant)} 人最高` : PLACEHOLDER },
        { label: "Offer / 入职", value: `${totalOffer} / ${totalOnboarded}`, desc: `简历 ${totalResume} / 初面 ${totalFirst}` }
      ],
      funnel: [
        { label: "需求发布", value: totalDemand > 0 ? 100 : 0, text: `${recruitments.length} 岗位已发布` },
        { label: "简历储备", value: Math.round((totalResume / demandBase) * 100), text: `${totalResume} 份有效简历` },
        { label: "一面推进", value: Math.round((totalFirst / demandBase) * 100), text: totalFirst > 0 ? `已推进 ${totalFirst} 人` : "暂无实质推进" },
        { label: "Offer / 入职", value: Math.round((totalOnboarded / demandBase) * 100), text: `Offer ${totalOffer} / 入职 ${totalOnboarded}` }
      ],
      vacancies
    };
  }

  function buildViewModel() {
    const allData = getAllDepartmentData();
    const placeholders = placeholderDepartments();
    return {
      overview: buildOverview(allData),
      departments: {
        finance: buildFinance(allData.finance, placeholders.finance),
        product: buildProduct(allData.product, placeholders.product),
        solution: buildSolution(allData.solution, placeholders.solution),
        delivery: buildDelivery(allData.delivery, placeholders.delivery),
        hr: buildHr(allData.hr, placeholders.hr)
      }
    };
  }

  function getBarMax(items) {
    return Math.max(...items.map((item) => safeNumber(item.value)), 1);
  }

  function barChart(items, palette, variant = "") {
    const max = getBarMax(items);
    return `<div class="bars ${variant}">${items.map((item, idx) => `
      <div class="bar-item">
        <div class="num">${safeText(item.display, item.value)}${item.unit || ""}</div>
        <div class="bar" style="height:${Math.max((safeNumber(item.value) / max) * 100, safeNumber(item.value) > 0 ? 10 : 8)}%;background:${palette[idx % palette.length]}"></div>
        <div class="lab">${safeText(item.label)}</div>
      </div>
    `).join("")}</div>`;
  }

  function progressList(items, fillClass = "purple") {
    return `<div class="progress-list">${items.map((item) => `
      <div class="progress-row">
        <div class="lab">${safeText(item.label)}</div>
        <div class="track"><div class="fill ${fillClass}" style="width:${Math.max(0, Math.min(100, safeNumber(item.value)))}%"></div></div>
        <div class="num">${safeText(item.display, `${safeNumber(item.value)}%`)}</div>
      </div>
    `).join("")}</div>`;
  }

  function stackList(items) {
    return `<div class="stack-list">${items.map((item) => `
      <div class="stack-row">
        <div class="lab">${safeText(item.label)}</div>
        <div class="stack-track"><div class="fill stack-fill ${item.cls}" style="width:${safeNumber(item.max) > 0 ? (safeNumber(item.value) / safeNumber(item.max)) * 100 : 0}%"></div></div>
        <div class="num">${safeText(item.display, item.value)}${item.unit || ""}</div>
      </div>
    `).join("")}</div>`;
  }

  function donut(cfg) {
    const total = cfg.segments.reduce((sum, item) => sum + safeNumber(item.value), 0);
    let cursor = 0;
    const gradient = total > 0 ? cfg.segments.map((item) => {
      const start = (cursor / total) * 100;
      cursor += safeNumber(item.value);
      const end = (cursor / total) * 100;
      return `${item.color} ${start}% ${end}%`;
    }).join(",") : "#e6edf5 0 100%";

    return `<div class="donut-wrap">
      <div class="donut" style="background:conic-gradient(${gradient})">
        <div class="donut-core">
          <div class="big">${safeText(cfg.total)}</div>
          <div class="small">${safeText(cfg.subtitle)}</div>
        </div>
      </div>
      <div class="legend">${cfg.segments.map((item) => `
        <div class="legend-row">
          <span class="dot" style="background:${item.color}"></span>
          <span>${safeText(item.label)}</span>
          <strong>${safeText(item.display, formatWan(item.value))}</strong>
        </div>
      `).join("")}</div>
    </div>`;
  }

  function financeHtml(dept) {
    return `
      <div class="metric-grid-4">${dept.metrics.map((item) => `<div class="metric-box"${tooltipAttr(composeTooltip(item.label, item.value, item.desc))}><div class="label">${escapeHtml(item.label)}</div><div class="value">${escapeHtml(item.value)}</div>${renderTextTag("div", "desc text-ellipsis-2", item.desc)}</div>`).join("")}</div>
      <div class="viz-grid-2 finance-grid">
        <div class="viz-panel finance-chart-panel"><div class="viz-title">盈利与现金结构</div>${barChart(dept.bars, ["#0052d9", "#2f7bff", "#79a8ff", "#003a99"], "tall")}</div>
        <div class="viz-panel finance-risk-panel">
          <div class="viz-title">重点风险</div>
          <div class="risk-list">${dept.risks.map((item) => `<div class="risk-item${item.level === "high" ? " is-alert" : ""}"${tooltipAttr(composeTooltip(item.title, item.desc))}><div class="item-copy">${renderTextTag("strong", "text-ellipsis-1", item.title)}${renderTextTag("span", "text-ellipsis-1", item.desc)}</div><div class="risk-tag ${item.level}">${item.level === "high" ? "高" : item.level === "mid" ? "中" : "低"}</div></div>`).join("")}</div>
        </div>
      </div>`;
  }

  function productHtml(dept) {
    return `
      <div class="viz-grid-mix">
        <div class="viz-panel"><div class="viz-title">产品路标推进</div>${progressList(dept.roadmap, "purple")}</div>
        <div class="viz-panel"><div class="viz-title">团队与质量</div><div class="metric-grid-3">${dept.team.map((item) => `<div class="metric-box"${tooltipAttr(composeTooltip(item.label, item.value, item.desc))}><div class="label">${escapeHtml(item.label)}</div><div class="value">${escapeHtml(item.value)}</div>${renderTextTag("div", "desc text-ellipsis-2", item.desc)}</div>`).join("")}</div></div>
      </div>
      <div class="metric-grid-4">${dept.metrics.map((item) => `<div class="metric-box"${tooltipAttr(composeTooltip(item.label, item.value, item.desc))}><div class="label">${escapeHtml(item.label)}</div><div class="value">${escapeHtml(item.value)}</div>${renderTextTag("div", "desc text-ellipsis-2", item.desc)}</div>`).join("")}</div>
      <div class="viz-panel"><div class="viz-title">产品质量分布</div>${stackList(dept.bugs)}</div>`;
  }

  function deliveryHtml(dept) {
    return `
      <div class="metric-grid-4">${dept.metrics.map((item) => `<div class="metric-box"${tooltipAttr(composeTooltip(item.label, item.value, item.desc))}><div class="label">${escapeHtml(item.label)}</div><div class="value">${escapeHtml(item.value)}</div>${renderTextTag("div", "desc text-ellipsis-2", item.desc)}</div>`).join("")}</div>
      <div class="viz-grid-2 delivery-grid">
        <div class="viz-panel"><div class="viz-title">重点项目执行看板</div><div class="project-board">${dept.projects.map((item) => `<div class="project-row${item.tone === "risk" ? " is-alert" : ""}"${tooltipAttr(composeTooltip(item.title, (item.meta || []).join(" | ")))}><div class="main"><strong class="text-ellipsis-1"${tooltipAttr(item.title)}>${escapeHtml(item.title)}</strong><div class="inline-meta">${item.meta.map((meta) => `<span${tooltipAttr(meta)}>${escapeHtml(meta)}</span>`).join("")}</div></div><div class="project-tag ${item.tone}">${item.tone === "good" ? "正常" : item.tone === "warn" ? "关注" : "风险"}</div></div>`).join("")}</div></div>
        <div class="viz-panel delivery-chart"><div class="viz-title">资源投放分布</div>${barChart(dept.resources, ["#0052d9", "#2f7bff", "#4e8dff", "#79a8ff", "#003a99", "#b9d3ff"], "tall")}</div>
      </div>`;
  }

  function solutionHtml(dept) {
    const visibleOpportunities = dept.opportunities.slice(0, Math.max(0, dept.opportunities.length - 1));
    return `
      <div class="solution-layout">
        <div class="viz-grid-mix solution-top">
          <div class="viz-panel"><div class="viz-title">合同与收入结构</div>${donut(dept.donut)}</div>
          <div class="viz-panel"><div class="viz-title">关键商机</div><div class="opportunity-list">${visibleOpportunities.map((item) => `<div class="opportunity-item"${tooltipAttr(composeTooltip(item.title, item.desc))}><div class="item-copy">${renderTextTag("strong", "text-ellipsis-1", item.title)}${renderTextTag("span", "text-ellipsis-1", item.desc)}</div></div>`).join("")}</div></div>
        </div>
        <div class="metric-grid-3">${dept.metrics.map((item) => `<div class="metric-box"${tooltipAttr(composeTooltip(item.label, item.value, item.desc))}><div class="label">${escapeHtml(item.label)}</div><div class="value">${escapeHtml(item.value)}</div>${renderTextTag("div", "desc text-ellipsis-2", item.desc)}</div>`).join("")}</div>
      </div>`;
  }

  function hrHtml(dept) {
    return `
      <div class="metric-grid-4">${dept.metrics.map((item) => `<div class="metric-box"${tooltipAttr(composeTooltip(item.label, item.value, item.desc))}><div class="label">${escapeHtml(item.label)}</div><div class="value">${escapeHtml(item.value)}</div>${renderTextTag("div", "desc text-ellipsis-2", item.desc)}</div>`).join("")}</div>
      <div class="viz-grid-2 hr-lower">
        <div class="viz-panel hr-funnel-panel">
          <div class="viz-title">招聘漏斗</div>
          <div class="funnel-list">${dept.funnel.map((item, idx) => `<div class="funnel-row"><div class="lab">${item.label}</div><div class="track"><div class="fill ${idx === 0 ? "blue" : idx === 1 ? "amber" : "red"}" style="width:${Math.max(0, Math.min(100, safeNumber(item.value)))}%"></div></div><div class="num">${safeNumber(item.value)}%</div></div>`).join("")}</div>
          <div class="hr-focus-grid">${dept.funnel.map((item) => `<div class="list-item"${tooltipAttr(composeTooltip(item.label, item.text))}><div class="item-copy">${renderTextTag("strong", "text-ellipsis-1", item.label)}${renderTextTag("span", "text-ellipsis-2", item.text)}</div></div>`).join("")}</div>
        </div>
        <div class="viz-panel"><div class="viz-title">部门缺口分布</div><div class="vacancy-list">${dept.vacancies.map((item) => `<div class="vacancy-item${item.level === "high" ? " is-alert" : ""}"${tooltipAttr(composeTooltip(item.title, item.desc))}><div class="item-copy">${renderTextTag("strong", "text-ellipsis-1", item.title)}${renderTextTag("span", "text-ellipsis-1", item.desc)}</div><div class="vacancy-tag ${item.level}">${item.level === "high" ? "高" : item.level === "mid" ? "中" : "低"}</div></div>`).join("")}</div></div>
      </div>`;
  }

  function overviewDonutCard(item) {
    const fillRate = Math.max(0, Math.min(100, Math.abs(safeNumber(item.rate))));
    return `<div class="ops-donut-card">
      <div class="ops-donut-title">${escapeHtml(item.title)}</div>
      <div class="ops-donut-body">
        <div class="ops-donut-metrics">
          <div class="ops-metric-block"${tooltipAttr(composeTooltip(item.targetLabel, item.targetValue))}>
            <div class="ops-metric-label">${escapeHtml(item.targetLabel)}</div>
            <div class="ops-metric-value">${escapeHtml(item.targetValue)}</div>
          </div>
          <div class="ops-metric-block"${tooltipAttr(composeTooltip(item.actualLabel, item.actualValue))}>
            <div class="ops-metric-label">${escapeHtml(item.actualLabel)}</div>
            <div class="ops-metric-value">${escapeHtml(item.actualValue)}</div>
          </div>
        </div>
        <div class="ops-donut-ring" style="background:conic-gradient(var(--ops-danger) 0 ${fillRate}%, var(--ops-ring) ${fillRate}% 100%)">
          <div class="ops-donut-core">${escapeHtml(item.displayRate)}</div>
        </div>
      </div>
    </div>`;
  }

  function overviewKpiCell(value, extraClass = "") {
    const text = safeText(value, PLACEHOLDER);
    const isNegative = /^\s*-/.test(text);
    const className = ["ops-kpi-cell", extraClass, isNegative ? "is-negative" : ""].filter(Boolean).join(" ");
    return `<td class="${className}">${escapeHtml(text)}</td>`;
  }

  function overviewHtml(data) {
    return `<div class="overview-layout">
      <div class="ops-donut-grid">${(data.charts || []).map(overviewDonutCard).join("")}</div>
      <div class="ops-kpi-panel">
        <div class="ops-kpi-head">
          <div class="ops-kpi-title">核心KPI指标</div>
          <div class="ops-kpi-unit">${escapeHtml(safeText(data.unitNote, ""))}</div>
        </div>
        <div class="ops-kpi-table-wrap">
          <table class="ops-kpi-table">
            <thead>
              <tr>
                <th>KPI指标</th>
                <th>年度目标</th>
                <th>Q1目标</th>
                <th>Q2目标</th>
                <th>Q3目标</th>
                <th>Q4目标</th>
                <th>当月完成</th>
                <th>累计完成</th>
                <th>季度完成</th>
                <th>年度完成</th>
                <th>目标差距</th>
                <th>上年同期</th>
                <th>同比增长</th>
              </tr>
            </thead>
            <tbody>
              ${(data.kpis || []).map((row) => `<tr>
                ${overviewKpiCell(row.label, "is-label")}
                ${overviewKpiCell(row.annualTarget)}
                ${overviewKpiCell(row.q1)}
                ${overviewKpiCell(row.q2)}
                ${overviewKpiCell(row.q3)}
                ${overviewKpiCell(row.q4)}
                ${overviewKpiCell(row.currentMonth)}
                ${overviewKpiCell(row.accumulative)}
                ${overviewKpiCell(row.quarterRate)}
                ${overviewKpiCell(row.annualRate)}
                ${overviewKpiCell(row.gap)}
                ${overviewKpiCell(row.lastYear)}
                ${overviewKpiCell(row.yoy)}
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  function renderDeptCard(deptKey, dept, overviewItems) {
    const title = deptKey === "overview" ? "经营数据" : dept.name;
    const bodyMap = {
      overview: function () { return overviewHtml(overviewItems); },
      finance: function () { return financeHtml(dept); },
      product: function () { return productHtml(dept); },
      solution: function () { return solutionHtml(dept); },
      delivery: function () { return deliveryHtml(dept); },
      hr: function () { return hrHtml(dept); }
    };
    const statusHtml = deptKey === "overview" || !dept.status?.text ? "" : `<span class="status ${dept.status.tone}"${tooltipAttr(dept.status.text)}><span class="status-text">${escapeHtml(dept.status.text)}</span></span>`;
    const actionsHtml = deptKey !== "overview"
      ? `<div class="dept-actions">${statusHtml}<button class="more-btn" type="button" data-more="${dept.key}" aria-label="查看${dept.name}详情"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8"></path><path d="M9 8h7v7"></path></svg></button></div>`
      : `<div class="dept-actions"><button class="card-edit-btn" type="button" data-edit-overview aria-label="编辑经营数据卡片">编辑</button></div>`;
    return `<article class="dept-card ${deptKey === "overview" ? "overview" : dept.key}"><div class="dept-head"><div class="dept-title"><h3>${title}</h3></div>${actionsHtml}</div>${bodyMap[deptKey]()}</article>`;
  }

  function renderModal(viewModel) {
    if (!activeDetail) return "";
    const dept = viewModel.departments[activeDetail];
    if (!dept) return "";
    return `<div class="modal-overlay open" id="detail-modal"><div class="modal"><div class="modal-head"><div><div class="modal-title">${dept.name}详情</div></div><div class="modal-actions"><button class="modal-close" type="button" id="modal-close">×</button></div></div><div class="modal-frame"><iframe title="${dept.name}详情" src="./${dept.file}"></iframe></div></div></div>`;
  }

  function ensureBootstrapFrames() {
    if (document.getElementById("index-data-bootstrap")) return;
    const host = document.createElement("div");
    host.id = "index-data-bootstrap";
    host.style.position = "absolute";
    host.style.width = "0";
    host.style.height = "0";
    host.style.overflow = "hidden";
    host.style.opacity = "0";
    host.style.pointerEvents = "none";
    host.innerHTML = Object.values(DEPARTMENT_FILES).map((file) => `<iframe title="${file}" src="./${file}" tabindex="-1" aria-hidden="true"></iframe>`).join("");
    document.body.appendChild(host);
  }

  function bindEvents() {
    document.querySelectorAll("[data-edit-overview]").forEach((btn) => {
      btn.addEventListener("click", function () {
        window.open(`./${OVERVIEW_EDITOR_FILE}`, "_blank", "noopener,noreferrer");
      });
    });

    document.querySelectorAll("[data-more]").forEach((btn) => {
      btn.addEventListener("click", function () {
        activeDetail = btn.dataset.more;
        renderPage();
      });
    });

    const closeBtn = document.getElementById("modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        activeDetail = null;
        renderPage();
      });
    }

    const overlay = document.getElementById("detail-modal");
    if (overlay) {
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          activeDetail = null;
          renderPage();
        }
      });
    }
  }

  function renderPage() {
    const viewModel = buildViewModel();
    app.innerHTML = `
      <div class="topbar"><div class="crumb"><span class="current">经营数据看板</span></div></div>
      <section class="dept-grid">
        ${renderDeptCard("overview", { status: {} }, viewModel.overview)}
        ${renderDeptCard("finance", viewModel.departments.finance, viewModel.overview)}
        ${renderDeptCard("product", viewModel.departments.product, viewModel.overview)}
        ${renderDeptCard("solution", viewModel.departments.solution, viewModel.overview)}
        ${renderDeptCard("delivery", viewModel.departments.delivery, viewModel.overview)}
        ${renderDeptCard("hr", viewModel.departments.hr, viewModel.overview)}
      </section>
      ${renderModal(viewModel)}
    `;
    bindEvents();
  }

  if (window.DashboardSync) {
    window.DashboardSync.subscribe(function () {
      renderPage();
    });
  }

  ensureBootstrapFrames();
  renderPage();
})();
