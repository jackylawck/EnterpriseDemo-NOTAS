# Power Automate 流程定義說明 / Workflow Architecture

## 流程名稱 / Workflow Name：`EnterpriseDemo-Attendance-Workflow`

---

### 1. 核心環境依賴 (Prerequisites & Environment)
- **連接器類型 (Connector Types)**：全數採用 Microsoft 365 標準連接器 (Standard Connectors)。  
  *Fully utilizes Microsoft 365 Standard Connectors without premium add-ons.*
  * `Microsoft Forms`
  * `SharePoint Online`
  * `Office 365 Users`
  * `Office 365 Outlook`
  * `Approvals`
- **授權要求 (Licensing Requirement)**：零額外授權（Zero-License），包含於 Microsoft 365 商業標準版 / E3 / E5 授權內。  
  *Zero extra license cost; natively included in standard Microsoft 365 Business Standard / E3 / E5 subscriptions.*

---

### 2. 安全防禦與例外處置 (Security Defense & Exception Handling)

- **目錄檢驗防呆 (Directory Validation & Exception Scope)**：
  * **[ZH]** 設定 `Configure run after` 監聽 `Get user profile (V2)` 動作。當且僅當目錄查詢發生 `has failed` 或 `has timed out` 時觸發異常捕獲。系統會自動寫入 SharePoint「已駁回」狀態並發送退回通知信，避免未經驗證之錯誤電郵導致工作流掛起並消耗系統資源。
  * **[EN]** Configured `run after` to monitor the `Get user profile (V2)` action. The exception scope triggers only when the directory query `has failed` or `has timed out`. It automatically updates the SharePoint status to "Rejected" and sends a return notification, preventing workflows with invalid emails from hanging and consuming system resources.

- **時區標準化 (Timezone Normalization)**：
  * **[ZH]** 使用運算式強制將雲端 UTC 時間轉換為本地標準時間（例如 UTC+8），消除伺服器時差導致之工時與審計爭議。
  * **[EN]** Utilizes expressions to forcefully convert cloud UTC time to Local Standard Time (e.g., UTC+8), eliminating attendance and audit disputes caused by server timezone offsets.

---

### 3. 部署指引與變數替換 (Deployment Guidelines & Variable Substitution)

正式匯出或複製流程至新測試環境時，請確認以下變數已完成替換：  
*When exporting or duplicating this workflow to a new test environment, ensure the following variables are appropriately substituted:*

1. **Forms ID**：
   - **[ZH]** 更換為目標環境之 Demo-Form 唯一 ID。
   - **[EN]** Replace with the unique Form ID of the target Demo-Form.
2. **SharePoint Site URL**：
   - **[ZH]** 指派至目標測試站台之網址 (Site Address)。
   - **[EN]** Assign to the target test Site URL.
3. **清單名稱 (List Name)**：
   - **[ZH]** 指定為 `Demo_Non_Operating_OT` 或對應之核心清單。
   - **[EN]** Specify as `Demo_Non_Operating_OT` or the corresponding core list.
4. **專用郵箱 (Role-based Emails)**：
   - **[ZH]** 將各級審批節點（如 HR 團隊、高階營運主管）指派至目標組織內對應角色之測試郵箱。
   - **[EN]** Reassign multi-tier approval nodes (e.g., HR team, executive management) to the corresponding test email addresses within the target organization.

---
> **⚠️ 免責聲明 (Disclaimer):**  
> 本文件與附帶之流程定義檔僅為架構展示用途。不代表任何真實企業之實際營運邏輯或真實端點配置。  
> *This document and the associated workflow definition files are for architectural demonstration purposes only. They do not represent the actual operational logic or real endpoint configurations of any enterprise.*
