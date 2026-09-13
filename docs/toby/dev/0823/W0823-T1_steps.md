# W0823-T1 分步執行索引

本索引將 `W0823-T1` 拆成五個可獨立執行與驗收的步驟。
原始分析見 `W0823-T1_analysis.md`。

## 執行順序

1. [步驟 1：確認範圍與基準](./W0823-T1_step_01_scope.md)
2. [步驟 2：建立唯讀資料接線](./W0823-T1_step_02_data_wiring.md)
3. [步驟 3：呈現設備資訊](./W0823-T1_step_03_ui.md)
4. [步驟 4：手動驗收與問題分類](./W0823-T1_step_04_manual_verification.md)
5. [步驟 5：品質檢查與交付摘要](./W0823-T1_step_05_quality_gate.md)

## 固定範圍

- 唯一允許修改的程式檔：`src/editor/inspector/InspectorPanel.vue`。
- 不修改 `FactoryCanvas.vue`、`FlowNodeOverlay.vue`、stores、資料檔或測試。
- 新增的設備資訊功能全程唯讀。
- 不自行 push、建立 PR 或合併分支；必須等待使用者明確指示。

## 停止條件

遇到以下情況時，不擴大修改範圍，記錄證據後停止：

- 單擊設備沒有更新 `selectionStore.selectedNodeIds`。
- 新放置設備的英文 `machineType` 無法被 `getMachine()` 查到。
- 機器尺寸或耗電資料本身不正確。
- 完成需求必須修改工單明列禁止變更的檔案。
