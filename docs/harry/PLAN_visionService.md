# 遊戲畫面建築物辨識 native service（Rust CV + WebSocket）

## Context

使用者想幫 Endfield Playground 加一個能力：偵測實際在跑的《明日方舟：終末地》遊戲視窗，辨識畫面上的工廠建築物佈局，並把結果快取起來供前端使用。這超出現有 Vue SPA（純瀏覽器沙盒）能做的事——需要一個有 OS 層權限的 native process 才能截取指定視窗畫面。使用者已確認：

- 技術棧選 **Rust**（可編譯成單一 .exe，不需額外安裝執行環境）
- 辨識方式選 **訓練一個物件偵測模型**（而非 template matching）
- 整合方式選 **本機 WebSocket/HTTP server，網頁端連線讀取**

**重要範疇界線（已與使用者對齊）：** 「訓練模型」本身分成兩塊完全不同性質的工作：

1. **資料集蒐集 + 標註 + 訓練**（Python/YOLOv8 生態、需要實際遊戲畫面截圖、需要人工標註、需要 GPU/長時間訓練）——這是我在這個 session 裡**做不到**的事，我沒有遊戲畫面可以截、也無法幫你標註資料。這部分是你（或你的團隊）之後要自己做的功課。
2. **推論端 pipeline**（視窗截圖、載入 ONNX 模型跑推論、YOLO 輸出解碼、快取、本機 server 廣播）——這是純工程問題，不需要真的訓練好的模型也能把整條線路寫完、跑起來、測試通過（用一個不存在/尚未配置的模型路徑時，pipeline 會降級成「只回報有沒有連上視窗」的心跳模式，不會整個掛掉）。

這次的實作只涵蓋第 2 塊：把 native service 的完整骨架建好、跑得起來、前端能連上去看到即時資料，之後你只要把訓練好的 `model.onnx` + 類別清單丟進指定資料夾，不用改任何程式碼就能開始看到真的辨識結果。

**已知風險（本機環境沒裝 Rust 工具鏈）：** 這台機器目前 `cargo`/`rustc` 都找不到（Bash 和 PowerShell 都測過），代表我沒辦法自己 `cargo build`/`cargo run` 驗證程式碼能不能編譯過。我會照 Rust 慣例把程式碼寫對，但**編譯驗證這一步需要你先裝好 Rust 工具鏈**（`winget install Rustlang.Rustup.MSVC` 或 https://rustup.rs），裝好之後我可以幫你跑 `cargo build` 確認沒問題。

## 專案結構

新增一個獨立於 `src/` 之外的頂層資料夾，跟現有的 pnpm 前端專案完全脫鉤（repo 目前是單一 package，沒有 workspace 機制，這個 Rust crate 就單純放著、不用註冊到任何地方）：

```
vision-service/
├── Cargo.toml
├── config.example.toml      # 範本設定檔（追蹤進 git）
├── models/
│   └── .gitkeep              # 使用者自己把 model.onnx + classes.txt 丟進來（gitignore）
├── src/
│   ├── main.rs                # 進入點：讀設定 → 開 capture loop task + axum server task
│   ├── config.rs                # Config struct（toml 反序列化）
│   ├── capture.rs                 # 用 `xcap` 依視窗標題找到遊戲視窗、截圖成 RgbImage
│   ├── inference.rs                # 用 `ort` 載入 ONNX session、跑推論；模型不存在時回傳 None（心跳模式）
│   ├── postprocess.rs                # YOLOv8 輸出解碼（conf threshold + NMS）→ Detection 清單
│   ├── cache.rs                       # Arc<RwLock<CacheState>> 共享最新結果；定期寫 cache.json 落地快取
│   └── server.rs                       # axum：GET /health、GET /latest、GET /ws（broadcast 推播）
└── README.md                            # 使用說明、ONNX 輸入輸出格式契約、訓練部分怎麼接（明確寫「不含資料集/訓練」）
```

## 各檔案設計重點

**`config.rs` / `config.example.toml`**
```toml
window_title_contains = "Endfield"   # 用子字串比對找視窗，不用寫死完整標題
model_path = "models/model.onnx"     # 不存在時 inference 自動降級成心跳模式
classes_path = "models/classes.txt"  # 每行一個類別名稱，index 對應模型輸出的 class id
capture_interval_ms = 500
server_port = 8787
cache_snapshot_path = "cache.json"
```
真正的 `config.toml`（含使用者本機路徑）與 `models/*.onnx`/`*.txt` 進 `.gitignore`，只有 `config.example.toml` 進版控。

**`capture.rs`**：用 `xcap` crate（跨平台視窗截圖，含 Windows）依 `window_title_contains` 找到目標視窗、截當前畫面成 `image::RgbImage`。找不到視窗時回傳明確錯誤，讓 `main.rs` 的 loop 記 log 並重試，不要整個 process 掛掉。

**`inference.rs`**：`ort` crate 載入 ONNX Runtime session（啟用 `download-binaries` feature，build 時自動抓 onnxruntime 動態庫，不需要使用者手動裝）。啟動時檢查 `model_path` 是否存在——不存在就整個推論模組進入 no-op 模式（`main.rs` 據此決定要不要呼叫）。存在的話：resize 到模型輸入尺寸（先假設 640×640，YOLOv8 預設）、HWC→CHW、正規化，跑 session，回傳原始 tensor 給 `postprocess.rs`。

**`postprocess.rs`**：照 YOLOv8 ONNX 匯出的標準輸出格式（`[1, 4+num_classes, 8400]`）解碼：對每個 anchor 取分數最高的類別、門檻過濾、NMS 去重疊框，換算回原始截圖座標，輸出 `Vec<Detection>`（`class_name`、`confidence`、`x`、`y`、`w`、`h`）。這段是通用 YOLOv8 後處理邏輯，不依賴實際訓練出來的權重，先寫好之後接你的模型就能用——但如果你訓練時用別的輸出格式（例如 YOLOv5 或自訂 head），這段需要對應調整，README 會註明這個假設。

**`cache.rs`**：`Arc<RwLock<CacheState>>` 存最新一批 `Vec<Detection>` + 時間戳，capture loop 每次跑完就更新；同時定期把這份狀態寫進 `cache.json`（落地快取，對應你原本說的「cache data」——這樣 server 重啟後，前端一連上就能先拿到最後一次已知狀態，不用等下一輪 capture）。

**`server.rs`**：`axum` 起本機 HTTP+WS server：
- `GET /health` → `{ "capturing": bool, "model_loaded": bool }`
- `GET /latest` → 目前快取的 `Vec<Detection>` + timestamp（一次性拉取）
- `GET /ws` → 升級成 WebSocket，用 `tokio::sync::broadcast` 頻道推播每次 capture loop 產生的新結果

**`main.rs`**：讀 config → 建 broadcast channel + `CacheState` → spawn capture loop task（每 `capture_interval_ms` 跑一輪 capture → [inference → postprocess] → 更新 cache → broadcast）→ spawn axum server task → `tokio::try_join!` 兩者。

## 前端整合（`src/`）

比照 `PaperFigMainField.vue`（`src/app/dev/PaperFigMainField.vue`）已經立下的「dev-only、獨立頂層路由、URL 直達、不掛左側選單」慣例：

- **`src/composables/useVisionService.ts`**：用 VueUse 既有的 `useWebSocket`（專案已依賴 `@vueuse/core`，符合 CLAUDE.md「VueUse 工具函式優先」，不用手刻重連邏輯）連 `ws://localhost:8787/ws`，暴露 `detections`（reactive）、`status`（連線狀態）
- **`src/app/dev/VisionOverlay.vue`**：dev-only 頁面，顯示連線狀態 + 目前偵測到的建築物清單（表格：類別／信心值／座標），先不做疊圖到 FactoryCanvas 上（v1 keep it simple，純資料檢視頁）
- **`src/router/index.ts`**：新增一條路由，完全比照 `/dev/paper-fig-main-field` 那個 block 的寫法（獨立 top-level route、`beforeEnter` 檢查 `import.meta.env.DEV`）

## `.gitignore` 新增

```
target/                        # Rust build 產物
vision-service/config.toml     # 使用者本機設定，只留 config.example.toml
vision-service/models/*.onnx
vision-service/models/*.txt
vision-service/cache.json
```

## 明確不在本次範圍內

- 資料集蒐集、標註、模型訓練（YOLOv8/Python 那一段，見上方 Context）——這是你的後續工作
- GPU/DirectML 加速（v1 用 CPU execution provider，之後有需要再優化）
- 疊圖到 `FactoryCanvas.vue` 上做即時視覺化（v1 先做資料檢視表格）
- 打包/安裝程式（v1 就是 `cargo run`，不做成安裝檔）
- 視窗遮擋/最小化時的行為處理（`xcap` 抓不到畫面時就是 capture 失敗，記 log 重試，不特別處理）

## 驗證方式

1. **前置：確認 Rust 工具鏈已裝好**（`cargo --version`）——這台機器目前沒裝，需要你先裝
2. `cd vision-service && cargo build` 確認編譯過
3. `cargo run`，不放任何 `model.onnx`（測降級心跳模式）：`curl http://localhost:8787/health` 應回 `model_loaded: false`；如果 `window_title_contains` 設成隨便一個現有視窗（例如 "Notepad" 測試用，不用真的開遊戲）能看到 `capturing: true`
4. 前端：`pnpm dev`，開 `http://localhost:5173/dev/vision-overlay`，確認能連上 WS、看到 `/health` 對應的狀態
5. 之後你把訓練好的 `model.onnx` + `classes.txt` 丟進 `vision-service/models/`、指到真的遊戲視窗標題，重跑 `cargo run`，`/latest` 跟 WS 推播應該要開始出現真的偵測結果
