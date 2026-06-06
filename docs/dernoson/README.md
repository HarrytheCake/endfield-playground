# dernoson 工作筆記

## TODO

- [x] ~~**畫布渲染套件 PoC**：Vue Flow vs Konva.js~~  \
  Vue Flow 已選定（`@vue-flow/core` 已 in package.json，editorStore 已用 `FactoryNode` / `FactoryEdge`）。

- [x] ~~**幫 shirone 遷移既有 CR-03 程式碼**~~  \
  已將 `origin/shirone/0522:src/validation_check/overlap.ts` 遷移為  \
  `src/lib/validation/detectors/E001_deviceOverlap.ts`（純結構搬移，邏輯仍由 shirone 補）。  \
  另寫了 `docs/shirone/README.md` 引導後續流程。

## 下一個方向（建議）

- 集中初始化點：找一個地方集中 `validationStore.registerDetector(...)`（例如 `src/composables/useValidation.ts` 或新建 `src/lib/validation/registerDetectors.ts`），等 shirone 第一個 detector 完工再決定
- L2 開工前的最後檢查：請 harry / toby 對 `editorStore` 高階 actions 簽名提任何建議

## 分層職責文件

- `L1/` — 基礎建設層（dernoson, aaaaa, shirone）
- `L2/` — 容器層（harry, toby）
- `L3/` — UI 元件層（goodmorning, avery, azure9572, MBD）
