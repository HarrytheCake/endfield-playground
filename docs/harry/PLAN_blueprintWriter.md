# 藍圖回寫（endfield-playground → 遊戲）：blueprint-writer

## Context

上一個計畫（`vision-service`，見 `docs/harry/PLAN_visionService.md`）是「讀」——用 CV 辨識遊戲畫面上的建築佈局。這次是相反方向：把使用者在 `endfield-playground` 裡規劃好的藍圖，自動「寫」回真正在跑的遊戲畫面——模擬滑鼠/鍵盤操作，依序選建築、旋轉、點擊放置。

使用者已確認：
- 定位方式：**重用 `vision-service` 的 CV**，動態辨識建造選單圖示／游標位置，而非寫死螢幕座標
- 範疇：**先只做「已知一種建築」的最小可行版本**，把選取→旋轉→放置→確認整條路徑跑通，之後再擴充其他建築

**風險與範疇界線（必須先講清楚）：**

1. **ToS／帳號風險**：這本質上是遊戲自動化 bot。大部分線上遊戲條款禁止巨集/自動化操作，是否違反《終末地》的 ToS、會不會觸發風控/被判定異常帳號，我無法查證也無法保證。這個工具只做「模擬一般玩家也做得到的滑鼠鍵盤操作」（OS 層合成輸入，跟一般巨集/無障礙軟體同一類），**不會**做任何刻意規避反作弊偵測的設計（例如驅動層輸入偽造、隨機化行為以混淆偵測模型）。是否要跑這個工具、要不要拿正式帳號測試，風險由你自行判斷承擔。
2. **點擊路徑是你的功課**：建造選單長怎樣、哪個圖示對應哪種建築、怎麼旋轉/確認，這些只有你看得到實際遊戲畫面，我沒辦法憑空生出來。這次會定義一個範本供你手動建一份「已知一種建築」的設定（一顆選單圖示截圖 + 幾個按鍵設定），之後要擴充其他建築就照同樣格式加。
3. **座標定位仍需要一次性校準**：「重用 CV 動態抓」處理的是選單圖示位置／游標位置這種會變動的東西；但「blueprint 的格子座標 → 螢幕像素」這個映射本身，沒有校準錨點的話沒有任何辦法推得出來（沒有already known 的相機參數）。所以設計上是：**一次性校準（點兩個已知格子當基準）+ 每次執行時用 CV 動態重新定位游標/選單圖示做校正**，不是完全免校準的閉環視覺伺服（那是研究等級的控制問題，不在這次範圍）。
4. **Blueprint 匯出功能本身還不存在**：`editorStore.ts` 目前沒有任何 export/serialize function（已確認搜過 "export"/"serialize"/"blueprint"/"toJSON" 都沒有），所以這次會先定義一個獨立的 blueprint JSON schema 給 writeback 工具吃，不等 `endfield-playground` 正式做出 CR-06 匯出功能。等匯出功能做出來，只要輸出成同樣的 schema 就能直接接上。

## 沿用與擴充 `vision-service`

不是重寫一份新的 CV 邏輯，而是把 `vision-service` 從單一 binary 重構成 **lib + 兩個 bin**，共用 capture/CV 程式碼：

```
vision-service/
├── Cargo.toml                    # 新增 [[bin]] x2 + enigo 依賴
├── src/
│   ├── lib.rs                     # 對外匯出 capture/inference/cache 等模組（原本 main.rs 的邏輯搬進來）
│   ├── capture.rs                  # 不變：視窗截圖（vision-server、blueprint-writer 共用）
│   ├── config.rs / inference.rs / postprocess.rs / cache.rs / server.rs   # 不變
│   └── bin/
│       ├── vision-server.rs         # 原本 main.rs 內容原封不動搬過來（讀圖辨識 + serve）
│       └── blueprint-writer.rs       # 新增：這次的主角，讀藍圖 → 操作滑鼠鍵盤寫回遊戲
├── ui_templates/                    # 新增：建造選單圖示/游標/預覽格快照範本（PNG，你提供，gitignore）
│   └── crusher_menu_icon.png         # MVP 唯一支援的建築範本
└── blueprints/
    └── example.json                  # 範例藍圖（進版控），真正的藍圖檔另外放、不進版控
```

## 新模組設計

**`src/ui_match.rs`**（新增，vision-server/blueprint-writer 共用）：輕量 template matching，找 UI 圖示在目前截圖裡的位置。UI 圖示是固定 2D 貼圖（不像世界裡的建築物件會旋轉/縮放/被遮擋），用 classical CV（normalized cross-correlation，`imageproc::template_matching`）就夠、不需要訓練模型——這點跟 `vision-service` 世界物件辨識用 ONNX 模型是刻意的不同選擇，兩種問題性質不同。回傳最佳匹配位置 + 信心分數，低於門檻視為「目前這幀沒看到」。

**`src/calibration.rs`**（新增）：一次性校準流程，跑 `blueprint-writer --calibrate`：終端機提示你在遊戲裡把游標移到兩個已知格子座標（例如 `(0,0)` 和 `(10,0)`）分別按 Enter，工具讀取當下滑鼠 OS 座標（不是靠 CV，直接讀系統游標位置最準），算出「格子座標 → 螢幕像素」的仿射轉換，存進 `calibration.json`（gitignore，因為跟你機器的視窗位置/縮放綁定）。

**`src/blueprint.rs`**（新增）：定義獨立 schema，不綁定 `editorStore.ts` 現有的 Vue Flow `FactoryNode` 那套（那是 UI 狀態，不是乾淨的資料格式）：
```json
{
  "placements": [
    { "machineId": "crusher", "gridX": 3, "gridY": 5, "rotation": 0 }
  ]
}
```
`rotation` 沿用 `src/types/editor.ts` 已有的 `0|1|2|3`（四分之一圈）語意，保持跟前端一致，之後前端真的做匯出功能時輸出同樣的值就能直接用。MVP 只處理 `machineId === "crusher"`（`docs/harry/SESSION_HANDOFF.md` §5 已確認這是目前唯一跟 `machines.ts` 真實 id 對得上的機型），其餘 `machineId` 直接跳過並記 log，不報錯中斷。

**`src/actuator.rs`**（新增）：用 `enigo` crate（跨平台合成滑鼠鍵盤輸入）包裝：`move_to(x, y)`、`click_left()`、`key_press(key)`，動作之間固定加短延遲（純粹為了讓遊戲 UI 來得及反應，不是為了規避偵測）。

**`src/writeback.rs`**（新增）：核心流程，對每個支援的 placement 依序執行：
1. 用 `ui_match.rs` 在目前截圖裡找 `crusher_menu_icon.png` 的位置 → 移動滑鼠過去點擊（選取該建築）
2. 讀 `calibration.json` 算出目標格子的螢幕座標 → 移動滑鼠過去
3. （校正）重新截圖，用 `ui_match.rs` 找目前游標貼圖或放置預覽格貼圖的實際位置，跟目標比對誤差，超出容忍範圍就位移修正一次再確認（有限次數，不做成無限收斂的閉環伺服）
4. 依 `rotation` 按對應次數的旋轉鍵（假設固定熱鍵，設定檔可調）
5. 點擊放置、按確認鍵（如果遊戲有二次確認）

**`--dry-run` 模式（安全網，預設開啟）**：不會真的呼叫 `actuator.rs` 送出任何輸入，只把每一步「原本要做什麼」印到終端機（要點哪裡、按什麼鍵），讓你在真的放它動手前先確認整條路徑邏輯正確。要真的執行必須明確加 `--execute` 旗標。

## 明確不在本次範圍內

- 除了 `crusher` 以外的建築（架構上很好擴充——照 `ui_templates/` + `blueprint.rs` 的 match 分支加一筆就好，但這次先不做，等 MVP 跑過一輪流程再擴充）
- 不做完全免校準的閉環視覺伺服（見上方風險 3）
- 不處理放置失敗/碰撞/空間不足的復原邏輯（v1 假設藍圖本身合法、目標格子淨空）
- 不接前端 CR-06 匯出功能本身（那是 `endfield-playground` 這邊的另一塊工作，這次只定義好 schema 等它接上）
- 不做任何反偵測/規避風控的設計（見上方風險 1）

## 驗證方式

1. 前置：同 `vision-service` 計畫，需要先裝好 Rust 工具鏈（這台機器目前沒裝）
2. `cd vision-service && cargo build --bin blueprint-writer`
3. 你自己提供 `ui_templates/crusher_menu_icon.png`（從遊戲建造選單截一張乾淨的圖示圖）
4. `cargo run --bin blueprint-writer -- --calibrate`，照終端機提示在遊戲裡點兩個已知格子
5. `cargo run --bin blueprint-writer -- blueprints/example.json`（預設 dry-run），確認印出來的步驟序列跟你預期的一致（選哪個圖示、點哪裡、按什麼鍵）
6. 確認無誤後才加 `--execute` 真的讓它操作滑鼠鍵盤——**建議先在非正式存檔/測試環境跑過，而不是直接對你的正式進度跑**
