(function () {
  "use strict";

  const DEPT_LIST = [
    { val: "eng", tc: "工程組", en: "Engineering Team" },
    { val: "site", tc: "施工組", en: "Construction Team" },
    { val: "sed", tc: "安全及環保組", en: "Safety & Environmental Dept" },
    { val: "hr", tc: "人力資源組", en: "Human Resources" },
    { val: "admin", tc: "行政組", en: "Administration" },
    { val: "it", tc: "資訊科技組", en: "Information Technology" },
    { val: "audit", tc: "營運審計組", en: "Operations Audit" }
  ];

  function getHKTTimestamp() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const hkt = new Date(utcMs + 8 * 3600000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${hkt.getFullYear()}-${pad(hkt.getMonth() + 1)}-${pad(hkt.getDate())} ${pad(hkt.getHours())}:${pad(hkt.getMinutes())}:${pad(hkt.getSeconds())}`;
  }

  function getCompactDate() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const hkt = new Date(utcMs + 8 * 3600000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${hkt.getFullYear()}${pad(hkt.getMonth() + 1)}${pad(hkt.getDate())}`;
  }

  function createInitialState() {
    return {
      step: 1,
      errorMsg: "",
      form: {
        applicantName: "陳大文",
        staffNo: "EMP-2026-0108",
        applicantEmail: "tai-man.chan@demo-enterprise.local",
        dept: "eng",
        managerEmail: "dept.manager@demo-enterprise.local",
        workDate: "2026-11-21",
        startTime: "22:00",
        endTime: "02:00",
        totalDays: "0.5",
        reason: "執行核心伺服器安全修補及非營運時段系統切換測試",
        picsAccepted: true
      },
      caseId: "",
      submitTimeHKT: "",
      directoryValid: true,
      statusCode: "MGR_PENDING",
      tiers: {
        mgr: { action: null, comment: "", time: "" },
        hr: { action: null, comment: "", time: "" },
        cod: { action: null, comment: "", time: "" }
      },
      draftComment: ""
    };
  }

  let state = createInitialState();
  let root = null;
  let stepperBar = null;

  function isEn() {
    return document.body.classList.contains("lang-en");
  }

  // Safe Unicode-escaped HTML sanitizer (immune to copy/paste entity decoding)
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/\u0026/g, "\u0026amp;")
      .replace(/\u003c/g, "\u0026lt;")
      .replace(/\u003e/g, "\u0026gt;")
      .replace(/\u0022/g, "\u0026quot;")
      .replace(/\u0027/g, "\u0026#39;");
  }

  function getDeptLabel(val) {
    const found = DEPT_LIST.find((d) => d.val === val);
    return found ? (isEn() ? found.en : found.tc) : val;
  }

  function getStatusBadgeHtml(code) {
    const en = isEn();
    if (code === "MGR_PENDING") {
      return `<span class="sp-pill sp-mgr">${en ? "Manager Review" : "主管審批中"}</span>`;
    }
    if (code === "HR_PENDING") {
      return `<span class="sp-pill sp-hr">${en ? "HR Review" : "HR審核中"}</span>`;
    }
    if (code === "COD_PENDING") {
      return `<span class="sp-pill sp-cod">${en ? "COD Review" : "COD審批中"}</span>`;
    }
    if (code === "APPROVED") {
      return `<span class="sp-pill sp-ok">${en ? "Approved & Archived" : "已批准歸檔"}</span>`;
    }
    return `<span class="sp-pill sp-rej">${en ? "Rejected" : "已駁回"}</span>`;
  }

  function getStatusText(code) {
    const en = isEn();
    const map = {
      MGR_PENDING: en ? "Manager Review (主管審批中)" : "主管審批中",
      HR_PENDING: en ? "HR Review (HR審核中)" : "HR審核中",
      COD_PENDING: en ? "COD Review (COD審批中)" : "COD審批中",
      APPROVED: en ? "Approved & Archived (已批准歸檔)" : "已批准歸檔",
      REJECTED: en ? "Rejected (已駁回)" : "已駁回"
    };
    return map[code] || code;
  }

  function updateStepper() {
    stepperBar.querySelectorAll(".step-pill").forEach((pill) => {
      const s = Number(pill.dataset.step);
      pill.classList.remove("current", "done");
      if (s === state.step) pill.classList.add("current");
      else if (s < state.step) pill.classList.add("done");
    });
  }

  function validateManagerEmail(email) {
    const trimmed = String(email || "").trim().toLowerCase();
    return /^[^\s@]+@(demo-enterprise\.local|example\.com)$/.test(trimmed);
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderStep1() {
    const en = isEn();
    const f = state.form;
    const deptOptions = DEPT_LIST.map((d) => {
      const sel = f.dept === d.val ? "selected" : "";
      return `<option value="${d.val}" ${sel}>${escapeHtml(en ? d.en : d.tc)}</option>`;
    }).join("");

    root.innerHTML = `
      <div class="sim-header-row">
        <h3>${en ? "📝 Stage 1: Microsoft Forms Submission (Demo-Form)" : "📝 第一階段：員工 Microsoft Forms 非營運時段申報"}</h3>
        <div class="preset-group">
          <button type="button" class="btn-mini" id="btnPresetValid">${en ? "✅ Load Valid Submission" : "✅ 填入正常申報示範"}</button>
          <button type="button" class="btn-mini warn-preset" id="btnPresetInvalid">${en ? "⚠️ Test Invalid Manager Email (Scope Guard)" : "⚠️ 測試無效主管電郵 (觸發 Scope 防呆)"}</button>
        </div>
      </div>

      <details class="expander expander-top">
        <summary>${en ? "ℹ️ Personal Information Collection Statement (PICS) & Statutory Notice" : "ℹ️ 收集個人資料聲明 (PICS) 與法規遵循告知"}</summary>
        <p class="expander-note">
          ${en
            ? "1. Purpose: Non-operating attendance verification, Cap. 57 statutory recordkeeping & ISO 45001 lone-working safety. 2. Directory Check: Manager email is validated against Entra ID; invalid emails trigger automated rejection. 3. Retention: Retained in SharePoint for 7 years."
            : "1. 收集目的：核實非營運時段出勤、履行《僱傭條例》Cap. 57 法定備查義務及 ISO 45001 職安監控。2. 防呆機制：系統透過 Entra ID 驗證主管電郵，無效電郵將自動攔截退回。3. 保存期限：歸檔後保存至少 7 年。"}
        </p>
      </details>

      <div class="sim-grid-3">
        <div class="sim-field">
          <label for="fName">${en ? "Applicant Name *" : "員工姓名 *"}</label>
          <input class="sim-input" id="fName" type="text" value="${escapeHtml(f.applicantName)}">
        </div>
        <div class="sim-field">
          <label for="fStaffNo">${en ? "Staff ID *" : "員工編號 *"}</label>
          <input class="sim-input" id="fStaffNo" type="text" value="${escapeHtml(f.staffNo)}">
        </div>
        <div class="sim-field">
          <label for="fDept">${en ? "Department *" : "組別 *"}</label>
          <select class="sim-select" id="fDept">${deptOptions}</select>
        </div>
      </div>

      <div class="sim-grid-3">
        <div class="sim-field">
          <label for="fAppEmail">${en ? "Applicant Corporate Email *" : "申請人公司電郵 *"}</label>
          <input class="sim-input" id="fAppEmail" type="email" value="${escapeHtml(f.applicantEmail)}">
        </div>
        <div class="sim-field">
          <label for="fMgrEmail">${en ? "Manager Email * (Valid: @demo-enterprise.local)" : "主管公司電郵 *（有效網域：@demo-enterprise.local）"}</label>
          <input class="sim-input" id="fMgrEmail" type="email" value="${escapeHtml(f.managerEmail)}">
        </div>
        <div class="sim-field">
          <label for="fWorkDate">${en ? "Attendance Date *" : "上班日期 *"}</label>
          <input class="sim-input" id="fWorkDate" type="date" value="${escapeHtml(f.workDate)}">
        </div>
      </div>

      <div class="sim-grid-3">
        <div class="sim-field">
          <label for="fStart">${en ? "Start Time *" : "開始時間 *"}</label>
          <input class="sim-input" id="fStart" type="time" value="${escapeHtml(f.startTime)}">
        </div>
        <div class="sim-field">
          <label for="fEnd">${en ? "End Time *" : "結束時間 *"}</label>
          <input class="sim-input" id="fEnd" type="time" value="${escapeHtml(f.endTime)}">
        </div>
        <div class="sim-field">
          <label for="fDays">${en ? "Total Days Claimed *" : "申報日數 *"}</label>
          <input class="sim-input" id="fDays" type="number" step="0.5" min="0.5" value="${escapeHtml(f.totalDays)}">
        </div>
      </div>

      <div class="sim-field">
        <label for="fReason">${en ? "Duty Reason & Safety Arrangement *" : "非營運時段上班原因及工作安排 *"}</label>
        <textarea class="sim-textarea" id="fReason">${escapeHtml(f.reason)}</textarea>
      </div>

      <div class="decl-box">
        <label class="decl-label">
          <input type="checkbox" id="fPics" ${f.picsAccepted ? "checked" : ""}>
          <span>${en ? "I have read and accepted the Personal Information Collection Statement (PICS) and confirm the details above are accurate. *" : "本人已閱讀並同意上述《收集個人資料聲明 (PICS)》，並確認所填寫之出勤申報資料屬實。 *"}</span>
        </label>
      </div>

      ${state.errorMsg ? `<div class="alert-box alert-warn alert-spaced">⚠️ ${escapeHtml(state.errorMsg)}</div>` : ""}

      <div class="action-bar">
        <span class="sim-hint">${en ? "Trigger: When a new response is submitted (M365 Forms)" : "觸發器：當提交新的回應時 (Microsoft Forms 標準連接器)"}</span>
        <button type="button" class="btn-primary" id="btnSubmitForm">${en ? "Submit Form & Trigger Power Automate ➔" : "提交表單並觸發 Power Automate ➔"}</button>
      </div>
    `;

    document.getElementById("fName").addEventListener("input", (e) => { state.form.applicantName = e.target.value; });
    document.getElementById("fStaffNo").addEventListener("input", (e) => { state.form.staffNo = e.target.value; });
    document.getElementById("fDept").addEventListener("change", (e) => { state.form.dept = e.target.value; });
    document.getElementById("fAppEmail").addEventListener("input", (e) => { state.form.applicantEmail = e.target.value; });
    document.getElementById("fMgrEmail").addEventListener("input", (e) => { state.form.managerEmail = e.target.value; });
    document.getElementById("fWorkDate").addEventListener("input", (e) => { state.form.workDate = e.target.value; });
    document.getElementById("fStart").addEventListener("input", (e) => { state.form.startTime = e.target.value; });
    document.getElementById("fEnd").addEventListener("input", (e) => { state.form.endTime = e.target.value; });
    document.getElementById("fDays").addEventListener("input", (e) => { state.form.totalDays = e.target.value; });
    document.getElementById("fReason").addEventListener("input", (e) => { state.form.reason = e.target.value; });
    document.getElementById("fPics").addEventListener("change", (e) => { state.form.picsAccepted = e.target.checked; });

    document.getElementById("btnPresetValid").addEventListener("click", () => {
      state = createInitialState();
      if (en) {
        state.form.applicantName = "Chan Tai Man";
        state.form.reason = "Core server security patching & non-operating cutover verification";
      }
      render();
    });

    document.getElementById("btnPresetInvalid").addEventListener("click", () => {
      state = createInitialState();
      if (en) {
        state.form.applicantName = "Lee Siu Ming";
        state.form.reason = "Weekend warehouse stocktake inspection";
      } else {
        state.form.applicantName = "李小明";
        state.form.reason = "週末倉庫盤點及設備點檢";
      }
      state.form.staffNo = "EMP-2026-0215";
      state.form.dept = "sed";
      state.form.managerEmail = "nonexistent.boss@external-typo.com";
      render();
    });

    document.getElementById("btnSubmitForm").addEventListener("click", () => {
      if (!state.form.applicantName.trim() || !state.form.staffNo.trim() || !state.form.managerEmail.trim() || !state.form.reason.trim()) {
        state.errorMsg = en
          ? "Please complete all required fields before submitting!"
          : "請先完整填寫所有必填欄位方可提交！";
        render();
        return;
      }

      const parsedDays = Number(state.form.totalDays);
      if (!String(state.form.totalDays).trim() || !Number.isFinite(parsedDays) || parsedDays <= 0) {
        state.errorMsg = en
          ? "Please enter a valid total days claimed (≥ 0.5)!"
          : "請輸入有效的申報日數（至少 0.5 日）！";
        render();
        return;
      }

      if (!state.form.picsAccepted) {
        state.errorMsg = en
          ? "Please check the PICS privacy declaration box!"
          : "請先勾選《收集個人資料聲明 (PICS)》同意方格！";
        render();
        return;
      }

      state.errorMsg = "";
      state.submitTimeHKT = getHKTTimestamp();
      state.caseId = `OT-${getCompactDate()}-108`;
      state.directoryValid = validateManagerEmail(state.form.managerEmail);
      state.tiers = {
        mgr: { action: null, comment: "", time: "" },
        hr: { action: null, comment: "", time: "" },
        cod: { action: null, comment: "", time: "" }
      };
      state.draftComment = "";

      if (!state.directoryValid) {
        state.statusCode = "REJECTED";
        state.tiers.mgr = {
          action: "Rejected",
          comment: en
            ? "System Auto-Reject (Scope Guard): Manager email not found in Entra ID directory."
            : "系統自動攔截 (Scope 防呆)：Entra ID 組織目錄查無此主管電郵。",
          time: state.submitTimeHKT
        };
      } else {
        state.statusCode = "MGR_PENDING";
      }

      state.step = 2;
      render();
      document.getElementById("simulatorSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function renderStep2() {
    const en = isEn();
    const f = state.form;

    if (!state.directoryValid) {
      root.innerHTML = `
        <div class="sim-header-row">
          <h3>${en ? "🛡️ Stage 2: Entra ID Directory Validation & Scope Exception Handler" : "🛡️ 第二階段：Entra ID 目錄核實與 Scope 異常防禦"}</h3>
          ${getStatusBadgeHtml(state.statusCode)}
        </div>

        <div class="alert-box alert-fail">
          🚨 ${en
            ? `Get user profile (V2) Failed for "${escapeHtml(f.managerEmail)}" — Exception Scope (runAfter: Failed) Triggered!`
            : `Get user profile (V2) 查詢失敗：「${escapeHtml(f.managerEmail)}」不存在於內部目錄 — 已觸發棕色 Scope 異常攔截分支！`}
        </div>

        <div class="tier-stack">
          <div class="tier-card rej-tier">
            <div class="tier-head">
              <span class="tier-title">${en ? "1. SharePoint Status Auto-Updated" : "1. SharePoint 核心清單狀態自動回寫"}</span>
              <span class="tier-meta">${escapeHtml(state.submitTimeHKT)} (HKT)</span>
            </div>
            <p class="tier-desc">
              ${en
                ? `Case <code>${escapeHtml(state.caseId)}</code> immediately marked as <strong>Rejected</strong> so no orphan approval hangs for 30 days.`
                : `案件 <code>${escapeHtml(state.caseId)}</code> 已在 3 秒內自動寫入為 <strong>已駁回</strong>，避免流程因無效電郵而掛起 30 天消耗系統資源。`}
            </p>
          </div>
          <div class="tier-card rej-tier">
            <div class="tier-head">
              <span class="tier-title">${en ? "2. Outlook Auto-Rejection Notice Dispatched" : "2. Outlook 自動發送退回公函給申報員工"}</span>
              <span class="tier-meta">To: ${escapeHtml(f.applicantEmail)}</span>
            </div>
            <p class="tier-desc">
              ${en
                ? "Applicant notified to verify the supervisor's corporate email address and resubmit, followed by safe flow Termination."
                : "已發信提示申請人核對主管正確公司電郵後重新申報，並執行 Terminate 安全終止工作流。"}
            </p>
          </div>
        </div>

        <div class="action-bar">
          <button type="button" class="btn-secondary" id="btnBackTo1">${en ? "⬅ Fix Manager Email & Resubmit" : "⬅ 返回修正主管電郵並重試"}</button>
          <button type="button" class="btn-primary" id="btnGoStep3">${en ? "Inspect SharePoint Audit Ledger ➔" : "檢視 SharePoint 審計看板與存證 ➔"}</button>
        </div>
      `;

      document.getElementById("btnBackTo1").addEventListener("click", () => {
        state.step = 1;
        render();
      });
      document.getElementById("btnGoStep3").addEventListener("click", () => {
        state.step = 3;
        render();
      });
      return;
    }

    const tierConfigs = [
      {
        key: "mgr",
        activeCode: "MGR_PENDING",
        title: en ? "Tier 1: Department Manager Approval" : "第 1 棒：部門主管業務審批",
        approver: f.managerEmail,
        nextCode: "HR_PENDING"
      },
      {
        key: "hr",
        activeCode: "HR_PENDING",
        title: en ? "Tier 2: HR Compliance Review" : "第 2 棒：人力資源組 (HR) 合規覆核",
        approver: "hr-compliance@demo-enterprise.local",
        nextCode: "COD_PENDING"
      },
      {
        key: "cod",
        activeCode: "COD_PENDING",
        title: en ? "Tier 3: Executive / COD Final Sign-Off" : "第 3 棒：高階營運主管 (COD) 最終批核",
        approver: "cod-office@demo-enterprise.local",
        nextCode: "APPROVED"
      }
    ];

    const tiersHtml = tierConfigs.map((tc) => {
      const tData = state.tiers[tc.key];
      const isCurrent = state.statusCode === tc.activeCode;
      let cardClass = "tier-card";
      if (isCurrent) cardClass += " active-tier";
      else if (tData.action === "Approved") cardClass += " done-tier";
      else if (tData.action === "Rejected") cardClass += " rej-tier";

      let bodyHtml = "";
      if (isCurrent) {
        bodyHtml = `
          <div class="tier-controls">
            <input class="sim-input" type="text" id="activeTierComment" value="${escapeHtml(state.draftComment)}" placeholder="${en ? "Enter review comments (optional)..." : "輸入簽批意見（選填）..."}">
            <button type="button" class="btn-approve" data-act="Approved" data-tier="${tc.key}" data-next="${tc.nextCode}">✅ ${en ? "Approve" : "批准 (Approve)"}</button>
            <button type="button" class="btn-reject" data-act="Rejected" data-tier="${tc.key}">❌ ${en ? "Reject" : "駁回 (Reject)"}</button>
          </div>`;
      } else if (tData.action) {
        bodyHtml = `
          <div class="tier-result">
            <strong>${tData.action === "Approved" ? "✅ Approved" : "❌ Rejected"}</strong> •
            <span>${escapeHtml(tData.time)} (HKT)</span> •
            <span>${en ? "Comment" : "意見"}：${escapeHtml(tData.comment || (en ? "Confirmed" : "同意批核"))}</span>
          </div>`;
      } else {
        bodyHtml = `<div class="tier-wait">${state.statusCode === "REJECTED" ? (en ? "Skipped (Workflow terminated at earlier tier)" : "已跳過（流程已於前一級駁回終止）") : (en ? "Waiting for previous tier sign-off..." : "等候上一級簽核完成後自動派發...")}</div>`;
      }

      return `
        <div class="${cardClass}">
          <div class="tier-head">
            <span class="tier-title">${tc.title}</span>
            <span class="tier-meta">${en ? "Assigned To" : "簽核人"}: <code>${escapeHtml(tc.approver)}</code></span>
          </div>
          ${bodyHtml}
        </div>`;
    }).join("");

    const isTerminal = state.statusCode === "APPROVED" || state.statusCode === "REJECTED";

    root.innerHTML = `
      <div class="sim-header-row">
        <h3>${en ? "⚡ Stage 2: Interactive 3-Tier Approvals State Machine" : "⚡ 第二階段：三級動態電子簽核控制台"}</h3>
        ${getStatusBadgeHtml(state.statusCode)}
      </div>

      <div class="alert-box alert-pass">
        ✅ ${en
          ? `Entra ID Directory Verified (${escapeHtml(f.managerEmail)}) • Case ID: ${escapeHtml(state.caseId)} • HKT Timestamp: ${escapeHtml(state.submitTimeHKT)} • Receipt Email Sent.`
          : `Entra ID 目錄核實通過 (${escapeHtml(f.managerEmail)}) • 單號：${escapeHtml(state.caseId)} • HKT 時間：${escapeHtml(state.submitTimeHKT)} • 已發送收件確認信。`}
      </div>

      <p class="sim-lead">
        ${en
          ? "Click Approve or Reject on each active M365 Approvals card below to simulate real-time SharePoint state progression:"
          : "請在下方亮起藍框的 M365 Approvals 簽核卡片中點擊「批准」或「駁回」，即時模擬三級狀態機推進："}
      </p>

      <div class="tier-stack">${tiersHtml}</div>

      ${isTerminal ? `
        <div class="alert-box ${state.statusCode === "APPROVED" ? "alert-pass" : "alert-fail"}">
          ${state.statusCode === "APPROVED"
            ? (en ? "🎉 All 3 Tiers Approved! Final closure notice sent to applicant & Cc HR archive mailbox." : "🎉 三級全線核准歸檔！系統已發送正式結案公函予申報員工，並自動副本抄送 (Cc) 人力資源組留存。")
            : (en ? "🛑 Request Rejected! Rejection notice sent to applicant and workflow closed." : "🛑 申請已駁回！系統已將駁回原因寫入 SharePoint 並發信通知申請人結案。")}
        </div>` : ""}

      <div class="action-bar">
        <button type="button" class="btn-secondary" id="btnBackTo1">${en ? "⬅ Back to Stage 1" : "⬅ 返回第一階段"}</button>
        <button type="button" class="btn-primary" id="btnGoStep3">${en ? "View SharePoint Audit Ledger & Receipt ➔" : "檢視 SharePoint 審計看板與存證 ➔"}</button>
      </div>
    `;

    const commentEl = document.getElementById("activeTierComment");
    if (commentEl) {
      commentEl.addEventListener("input", (e) => { state.draftComment = e.target.value; });
    }

    root.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const act = e.currentTarget.dataset.act;
        const tierKey = e.currentTarget.dataset.tier;
        const nextCode = e.currentTarget.dataset.next;
        const nowHKT = getHKTTimestamp();

        state.tiers[tierKey] = {
          action: act,
          comment: state.draftComment.trim() || (act === "Approved" ? (en ? "Approved as requested" : "核實無誤，同意批核") : (en ? "Insufficient justification" : "申報事由未符非營運時段標準")),
          time: nowHKT
        };
        state.draftComment = "";

        if (act === "Approved") {
          state.statusCode = nextCode;
        } else {
          state.statusCode = "REJECTED";
        }
        render();
      });
    });

    document.getElementById("btnBackTo1").addEventListener("click", () => {
      state.step = 1;
      render();
    });
    document.getElementById("btnGoStep3").addEventListener("click", () => {
      state.step = 3;
      render();
      document.getElementById("simulatorSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function buildAuditReceiptText() {
    const en = isEn();
    const f = state.form;
    const t = state.tiers;
    if (en) {
      return [
        "Enterprise Demo Framework - Non-Operating Time Attendance Audit Record",
        "Ref: DEMO-ATT-GOV-2026-V1 | SharePoint List: Demo_Non_Operating_OT",
        "======================================================================",
        `Case ID: ${state.caseId}`,
        `Final Status: ${getStatusText(state.statusCode)}`,
        `Submission Time (HKT): ${state.submitTimeHKT}`,
        `Applicant: ${f.applicantName} (${f.staffNo}) | Dept: ${getDeptLabel(f.dept)}`,
        `Applicant Email: ${f.applicantEmail}`,
        `Manager Email: ${f.managerEmail} [Entra ID Verified: ${state.directoryValid ? "YES" : "NO"}]`,
        `Attendance Schedule: ${f.workDate} | ${f.startTime} - ${f.endTime} (${f.totalDays} day(s))`,
        `Duty Reason: ${f.reason}`,
        "",
        "[Multi-Tier Approval Audit Trail]",
        `Tier 1 (Department Manager): ${t.mgr.action || "Pending"} | Time: ${t.mgr.time || "-"} | Comment: ${t.mgr.comment || "-"}`,
        `Tier 2 (HR Compliance): ${t.hr.action || "Pending"} | Time: ${t.hr.time || "-"} | Comment: ${t.hr.comment || "-"}`,
        `Tier 3 (Executive / COD): ${t.cod.action || "Pending"} | Time: ${t.cod.time || "-"} | Comment: ${t.cod.comment || "-"}`,
        "",
        "Retention Policy: Retained for 7 years in accordance with labor recordkeeping & ISO 27001 / 45001 controls."
      ].join("\n");
    }
    return [
      "Enterprise Demo Framework - 非營運時段考勤治理電子審計存證",
      "受控編號：DEMO-ATT-GOV-2026-V1 | SharePoint 清單：Demo_Non_Operating_OT",
      "======================================================================",
      `申報編號 (Title)：${state.caseId}`,
      `當前審核狀態 (Status)：${getStatusText(state.statusCode)}`,
      `提交時間 (HKT)：${state.submitTimeHKT}`,
      `申報員工：${f.applicantName} (${f.staffNo}) | 組別：${getDeptLabel(f.dept)}`,
      `申請人電郵：${f.applicantEmail}`,
      `主管公司電郵：${f.managerEmail} [Entra ID 目錄驗證：${state.directoryValid ? "通過" : "無效攔截"}]`,
      `出勤時段：${f.workDate} | ${f.startTime} - ${f.endTime}（共 ${f.totalDays} 日）`,
      `上班原因：${f.reason}`,
      "",
      "【三級動態審批審計軌跡 (Audit Trail)】",
      `第 1 棒（部門主管）：${t.mgr.action || "待處理"} | 時間：${t.mgr.time || "-"} | 意見：${t.mgr.comment || "-"}`,
      `第 2 棒（人力資源部）：${t.hr.action || "待處理"} | 時間：${t.hr.time || "-"} | 意見：${t.hr.comment || "-"}`,
      `第 3 棒（高階營運主管 COD）：${t.cod.action || "待處理"} | 時間：${t.cod.time || "-"} | 意見：${t.cod.comment || "-"}`,
      "",
      "留存聲明：本紀錄已寫入企業受控 SharePoint 清單，依勞工法規及 ISO 27001 / 45001 體系要求保留至少 7 年。"
    ].join("\n");
  }

  function renderStep3() {
    const en = isEn();
    const f = state.form;
    const t = state.tiers;
    const jsonPayload = JSON.stringify({
      listName: "Demo_Non_Operating_OT",
      Title: state.caseId,
      ApplicantName: f.applicantName,
      StaffNo: f.staffNo,
      Department: getDeptLabel(f.dept),
      ManagerEmail: f.managerEmail,
      DirectoryVerified: state.directoryValid,
      WorkDate: f.workDate,
      TimeRange: `${f.startTime} - ${f.endTime}`,
      TotalDays: Number(f.totalDays),
      Status: getStatusText(state.statusCode),
      ManagerAction: t.mgr.action,
      ManagerActionDate: t.mgr.time || null,
      HRAction: t.hr.action,
      HRActionDate: t.hr.time || null,
      CODAction: t.cod.action,
      CODActionDate: t.cod.time || null
    }, null, 2);

    const receiptFilename = `${state.caseId}_Audit_Receipt.txt`;

    root.innerHTML = `
      <div class="sim-header-row">
        <h3>${en ? "📊 Stage 3: SharePoint Audit Ledger & JSON Column Formatting" : "📊 第三階段：SharePoint 核心審計看板與電子存證"}</h3>
        <span class="role-badge">List: Demo_Non_Operating_OT</span>
      </div>

      <p class="sim-lead">
        ${en
          ? "Live preview of the SharePoint Online list row styled with <code>schemas/column-formatting.schema.json</code>:"
          : "以下即時還原 SharePoint Online 清單套用 <code>schemas/column-formatting.schema.json</code> 後的彩色狀態徽章效果："}
      </p>

      <div class="table-container ledger-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>${en ? "Applicant" : "員工姓名"}</th>
              <th>${en ? "Dept" : "組別"}</th>
              <th>${en ? "Schedule" : "出勤時段"}</th>
              <th>${en ? "Status (JSON Pill)" : "審核狀態 (JSON 渲染)"}</th>
              <th>${en ? "Audit Trail" : "簽核軌跡摘要"}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>${escapeHtml(state.caseId)}</code></td>
              <td>${escapeHtml(f.applicantName)}<br><span class="cell-sub">${escapeHtml(f.staffNo)}</span></td>
              <td>${escapeHtml(getDeptLabel(f.dept))}</td>
              <td>${escapeHtml(f.workDate)}<br><span class="cell-sub">${escapeHtml(f.startTime)}–${escapeHtml(f.endTime)} (${escapeHtml(f.totalDays)}d)</span></td>
              <td>${getStatusBadgeHtml(state.statusCode)}</td>
              <td class="cell-trail">
                T1: ${escapeHtml(t.mgr.action || "-")}<br>
                T2: ${escapeHtml(t.hr.action || "-")}<br>
                T3: ${escapeHtml(t.cod.action || "-")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="expander" open>
        <summary>${en ? "🔍 Inspect SharePoint Item JSON Payload (Governance-as-Code)" : "🔍 檢視 SharePoint 清單項目 JSON 結構 (Governance-as-Code)"}</summary>
        <div class="json-preview">${escapeHtml(jsonPayload)}</div>
      </details>

      <div class="download-wrap">
        <button type="button" class="btn-secondary full" id="btnDownloadReceipt">
          💾 ${en ? `Download Controlled Audit Receipt (${escapeHtml(receiptFilename)})` : `下載「${escapeHtml(receiptFilename)}」受控審計存證副本`}
        </button>
      </div>

      <div class="action-bar">
        <button type="button" class="btn-secondary" id="btnBackTo2">${en ? "⬅ Back to Approvals Console" : "⬅ 返回簽核控制台"}</button>
        <button type="button" class="btn-primary" id="btnResetSim">${en ? "🔄 Start New Simulation" : "🔄 重置模擬器並發起新申報"}</button>
      </div>
    `;

    document.getElementById("btnDownloadReceipt").addEventListener("click", () => {
      downloadTextFile(receiptFilename, buildAuditReceiptText());
    });

    document.getElementById("btnBackTo2").addEventListener("click", () => {
      state.step = 2;
      render();
    });

    document.getElementById("btnResetSim").addEventListener("click", () => {
      state = createInitialState();
      if (isEn()) {
        state.form.applicantName = "Chan Tai Man";
        state.form.reason = "Core server security patching & non-operating cutover verification";
      }
      render();
      document.getElementById("simulatorSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function render() {
    updateStepper();
    if (state.step === 1) renderStep1();
    else if (state.step === 2) renderStep2();
    else renderStep3();
  }

  function init() {
    root = document.getElementById("simAppRoot");
    stepperBar = document.getElementById("stepperBar");
    const langBtn = document.getElementById("langBtn");

    if (!root || !stepperBar || !langBtn) return;

    langBtn.addEventListener("click", () => {
      document.body.classList.toggle("lang-en");
      const en = isEn();
      document.documentElement.lang = en ? "en" : "zh-HK";
      if (en && state.form.applicantName === "陳大文") {
        state.form.applicantName = "Chan Tai Man";
        state.form.reason = "Core server security patching & non-operating cutover verification";
      } else if (!en && state.form.applicantName === "Chan Tai Man") {
        state.form.applicantName = "陳大文";
        state.form.reason = "執行核心伺服器安全修補及非營運時段系統切換測試";
      } else if (en && state.form.applicantName === "李小明") {
        state.form.applicantName = "Lee Siu Ming";
        state.form.reason = "Weekend warehouse stocktake inspection";
      } else if (!en && state.form.applicantName === "Lee Siu Ming") {
        state.form.applicantName = "李小明";
        state.form.reason = "週末倉庫盤點及設備點檢";
      }
      render();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
