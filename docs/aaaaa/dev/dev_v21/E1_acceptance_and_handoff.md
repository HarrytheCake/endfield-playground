# V21-E1 — 驗收、USAGE／交接

**對應工項：** V21-E1
**狀態：** `[~]` C1 交接已寫（2026-11-08）；全版驗收仍等 D1／`canConnect`
**日期：** 2026-11-08
**依賴：** [C1](./C1_tryout_shell_p0.md) `[x]`、[D1](./D1_can_connect_tryout.md) `[ ]`
**準則：** [A0 §5](./A0_tryout_panel_plan.md)
**開發分支：** `dev/aaaaa1102`
**給別人看的版本：** [會議報告](../../../work_dispatch/aaaaa/1102/INTRO_meeting_v21_tryout.md)、[交接](../../../work_dispatch/aaaaa/1102/HANDOFF_tryout_p0.md)

---

## 1. 驗收表

| # | 步驟 | 預期 | 結果 |
|---|------|------|------|
| 1 | hub 內找得到試玩入口 | 單一 lab 的「試玩」 | **通過**（2026-11-08 瀏覽器） |
| 2 | P0 兩題可改位置，各至少兩個範例 | 真呼叫；頁上有中文答案 | **通過** |
| 3 | `canConnect` 成功／失敗可讀 | 失敗有原因 | **未做** |
| 4 | 非 swagger 自檢 | 無 OpenAPI／第二 hub／codegen | **通過**（目前範圍） |
| 5 | 鎖檔／簽名 | 無業務 diff | **通過**（只動 `docs/` 與 `src/app/dev/`） |
| 6 | USAGE／LAB | 各有入口指到交接 | **通過** |
| 7 | type-check／試玩單元測試 | 綠 | **通過**（測試 3 項；型別檢查當日通過） |

---

## 2. 回寫清單

- [x] todolist_v21：C1 完成、D1 未做
- [x] USAGE／LAB 指到試玩與交接
- [x] AGENT_WEEK_1102
- [x] 工單 §4、WEEK 進度日誌、會議報告、交接
- [x] 不發解鎖句
- [ ] D1 完成後把 §1 第 3 列補上，並把本項改 `[x]`
- [ ] 文件 PR（另裁）

---

## 3. 交接產物

| 產物 | 對象 | 一句話 |
|------|------|--------|
| [HANDOFF](../../../work_dispatch/aaaaa/1102/HANDOFF_tryout_p0.md) | L2／第一次進 lab 的人 | 滑鼠點得到 ≠ 管子接在那個小數點 |
| [會議報告](../../../work_dispatch/aaaaa/1102/INTRO_meeting_v21_tryout.md) | 週會 | 3–5 分鐘節奏 |
| 試玩分頁 | 同上 | 先讀綠色框的中文，JSON 在頁面最下方 |

建議 PR（仍另裁；標題先不要寫成含 `canConnect`）：

```text
標題建議：L1 Hub：試玩頁分辨滑鼠點埠與管子端點（V21-C1）

下游消費者：
- 開 /dev/l1-contract-lab 的「試玩」即可跟做
- 拉線仍用 hitTestPortAt；管子端點仍用 findPortAt
不發解鎖句；未改 LayoutView／GridCanvas／store／L1 簽名。
canConnect 試玩尚未做。
```

---

## 4. 開發日誌

### 2026-11-08｜C1 交接

- 公開會議報告與交接落在 `work_dispatch/aaaaa/1102/`
- 全版 DoD 的 `canConnect` 仍空著

### 2026-11-08｜建檔

- 當時只開版，驗收表留空
