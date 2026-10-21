# 合規審計與數據管治架構 / Compliance & Data Governance Framework
## EnterpriseDemo-Attendance (Demo-Form) 企業內控與法規映射矩陣 / Internal Control & Regulatory Mapping

本文件詳細闡明 **企業非營運時段考勤治理架構展示（EnterpriseDemo-Attendance / 表格 Demo-Form）** 於資訊安全、個人資料私隱及勞工工時法規之控制機制。  
This document specifies the regulatory alignment, information security measures, and data privacy principles implemented in the **Enterprise Demo: Non-Operating Time Attendance System (Demo-Form)**.

---

### 1. 通用個人隱私保護條例映射 / General Data Privacy Regulations Mapping (e.g., HK PDPO, GDPR)

| 保障資料原則 (DPP Principle) | 系統落實機制 (Implementation in EnterpriseDemo) | 技術控制手段 (Technical Control) |
| :--- | :--- | :--- |
| **原則一：收集目的與方式**<br>*(DPP 1: Purpose & Manner)* | 僅收集核實非營運工時、補償結算與職安監控所必需之個人資料。<br>*PII collection is strictly limited to non-operating attendance verification, overtime compensation, and occupational safety.* | 透過 M365 組織內帳號強制登入，前端展示《收集個人資料聲明》(PICS)。<br>*Authenticated Forms access with embedded PICS notice.* |
| **原則二：準確性與保留期**<br>*(DPP 2: Accuracy & Retention)* | 填報主管電郵由系統向內部目錄即時核實；出勤與審批記錄按法定審計要求保存 7 年。<br>*Manager email is validated against the internal directory. Audit records are retained for 7 years.* | 目錄驗證與自動防呆攔截；SharePoint 版本管制與留存標籤。<br>*Automated directory query and error fallback via Scope; SharePoint retention.* |
| **原則三：資料的使用**<br>*(DPP 3: Use of Data)* | 審核數據僅限於指定部門主管、人力資源部及高階主管作內部批核，禁止二次運用。<br>*Records are restricted to designated managers, HR, and executives for authorized validation only.* | SharePoint 清單欄位層級權限控制（RBAC）；去識別化外部展示。<br>*Role-Based Access Control (RBAC) on core lists; external data minimization.* |
| **原則四：資料保安**<br>*(DPP 4: Data Security)* | 全鏈路傳輸採用 TLS 1.2+ 加密，靜態資料存儲於租戶私有雲，切斷公共通訊錄公開暴露風險。<br>*In-transit and at-rest encryption (TLS 1.2+ / AES-256) within the corporate tenant boundary.* | 移除所有訪客及匿名存取權限；僅授權內部用戶互動式簽核。<br>*Zero external/guest sharing; strictly internal Approvals cards.* |
| **原則五：資訊政策透明度**<br>*(DPP 5: Information Policy)* | 明確告知申請人資料收集類別、用途、保管責任單位及投訴/查詢途徑。<br>*Explicit communication of data handling, retention policies, and HR contact points.* | 於系統前端及代碼倉庫公開提供合規說明文件。<br>*Open disclosure via `docs/PICS_Demo-Form.md` and repository guidelines.* |
| **原則六：查閱及改正**<br>*(DPP 6: Access & Correction)* | 員工有權透過人力資源部申請查核本人之非營運出勤審批紀錄，並提出合法更正要求。<br>*Employees retain legal rights to access and rectify personal attendance records via HR.* | 依企業既定個人資料查閱機制（DSR）受理並以電子存證回覆。<br>*Standard Data Subject Request (DSR) workflows handled by HR administration.* |

---

### 2. ISO 國際管理體系標準對照 / ISO Management Standards Alignment

#### ISO/IEC 27001:2022 (資訊安全 / Information Security) & ISO/IEC 27701:2019 (私隱資訊管理 / Privacy Information Management)
- **存取控制 (Access Control & Least Privilege)**：SharePoint 核心清單剔除通用讀取權限，僅授權系統管理員編輯權限，各級主管僅能透過 Approvals 深度連結檢視單一項目。  
  *Core lists remove broad organizational access; managers only view item-level data via secure Approval deep links.*
- **審計日誌與時間戳記 (Logging & Non-Repudiation)**：每一級審核均記錄核准人身分識別（UPN）、處置動作（Approved / Rejected）、簽批意見，並由 Power Automate 強制將雲端時區轉為本地標準時間。  
  *All approval actions log identity, disposition, comments, and immutable timestamps for non-repudiation.*

#### ISO 9001:2015 (品質管理體系 / Quality Management System)
- **成文資訊 (Documented Information)**：將傳統易遺失、字跡辨識不清之紙本紀錄全面標準化為結構化數位資產，具備完整版本歷程與不可篡改之電子歸檔。  
  *Standardizes paper-based records into version-controlled, traceable digital assets to ensure operational consistency.*

#### ISO 45001:2018 (職業健康與安全管理體系 / Occupational Health & Safety Management System)
- **運行策劃與危害辨識 (Hazard Identification & Risk Assessment)**：透過事前申報掌握深夜、假日或惡劣天氣下之非正常營運時段出勤動態，防範單獨作業（Lone Working）及過度加班之職安健康風險。  
  *Enables visibility over odd-hour, night shift, or solitary work to mitigate fatigue and occupational hazards.*

---

### 3. 法規適用性裁決與豁免聲明 / Statutory Applicability & Exemption Notice

```text
                      +------------------------------------------+
                      |    EnterpriseDemo 系統架構 (Architecture)|
                      +------------------------------------------+
                                           |
                   -------------------------------------------------
                  |                                                 |
         [適用範疇 Applicable]                           [明確豁免 Exemptions]
                  |                                                 |
  +-------------------------------+               +-----------------------------------+
  | - 隱私保護法規 (如 PDPO/GDPR) |               | - 歐盟 AI 法案 (EU AI Act)        |
  | - 勞工權益與僱傭相關條例      |               | - ISO/IEC 42001 (AI 管理系統)     |
  | - ISO/IEC 27001 / 27701       |               |   * 裁定理由：本系統為 100% 確定性 |
  | - ISO 9001 / ISO 45001        |               |     規則引擎，無機器學習模型。     |
  +-------------------------------+               | - 數據出境安全與跨境傳輸法規       |
                                                  |   * 裁定理由：架構展示預設租戶為   |
                                                  |     本地儲存，無跨國數據轉移。     |
                                                  +-----------------------------------+

```

* **人工智能監管框架 (Artificial Intelligence Frameworks - e.g., EU AI Act, ISO/IEC 42001)**：**不適用 (NOT APPLICABLE)**。本系統架構僅依循靜態條件式流程（`Outcome == Approve`），無任何自主學習、機率預測或評分演算法，不屬於 AI 系統範疇。
*Operates entirely on deterministic conditional logic. Contains no machine learning, statistical inference, or algorithmic profiling.*
* **跨境數據傳輸規範 (Cross-border Data Transfer - e.g., GDPR Chapter V)**：**不適用 (NOT APPLICABLE)**。所有資料及執行日誌均展示留存於企業本地租戶雲端環境，不涉及任何將個人資料轉移至外部司法管轄區之行為。
*All telemetry and database items are confined within the corporate tenant. Zero cross-border export.*

---

> **⚠️ 免責聲明 (Disclaimer):**
> 本文件僅為架構展示用途，不代表真實企業之法律約束文件。不涉及任何真實數據收集或合規宣告。
> *This document is for architectural demonstration purposes only and does not represent a legally binding compliance statement of any real-world enterprise.*
