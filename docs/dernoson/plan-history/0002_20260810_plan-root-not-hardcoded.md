# 0002_20260810_plan-root-not-hardcoded

- **prev:** —
- **skill:** plan-history v3
- **status:** done

## 主題簡述

`plan-history` skill 目前把計畫根目錄寫死成 `docs/dernoson/plan-history/`。別人採用這份
skill 時，散文會叫他把計畫寫進我的資料夾；更糟的是生成的 `head.md` 每次重算都會再叫他去跑
我的腳本，而 `head.md` 是嚴禁手動編輯的生成檔，他改不掉。

目標只有一個：**讓採用者知道要指向自己的 `docs/<他>/plan-history/`，而且只需要改一個地方**。

**本計畫的約束**

- 不做多人共存的架構改造 —— 不搬移 `.py` 到共用位置、不加 `--root` 參數、不擴大測試掃描
  範圍。使用者已明確排除；採用者各自持有 skill 副本，改動不回merge。
- 四個字串只換顯示內容，不得改變任何解析行為或既有測試的斷言。

## 規劃描述

兩件事，互相獨立：

1. `SKILL.md` 開頭宣告一次 `<PLAN_ROOT>`，其餘字面路徑全部改成引用它。採用者改一行即可，
   不必自己 grep 出散落的路徑。
2. 把工具印出的字面路徑改成以執行期已知的 `HERE` 組出來，讓生成物指向讀者自己的目錄。

## 觀察與推論

### O1 · 2026-08-10 05:51:49+08:00 — SKILL.md 有 9 處字面 `docs/dernoson/`

`.claude/skills/plan-history/SKILL.md` 行 3、10、79、85、438、442、477、478、479。

行 3 是 frontmatter 的 `description`，也就是觸發判斷用的那段文字，寫死別人名字的誤導性最高。
其餘為前言、檔名規則、`update-head.py` 段、`plan-item.py` 段的範例指令。

九處分散在四個區段，採用者靠人工搜尋容易漏掉其中一兩處，而漏掉的那處就會把計畫寫錯位置。

### O2 · 2026-08-10 05:51:49+08:00 — Python 工具本身已經位置無關

`plan_parse.py:44`：`HERE = Path(os.environ.get("PLAN_HISTORY_ROOT") or Path(__file__).resolve().parent).resolve()`。
`update-head.py` 由此取得 `HERE`（`HEAD = HERE / "head.md"`），`plan-item.py` 不直接碰 root，
一律經 `collect()`。

所以「換人使用」不需要動任何解析邏輯：三支 `.py` 隨計畫目錄一起複製過去就會自動對齊。硬編
問題純粹落在散文與輸出字串，這也是本計畫範圍能維持極小的原因。

### O3 · 2026-08-10 05:51:49+08:00 — 工具把字面路徑寫進生成物與錯誤訊息

`update-head.py:86`（寫入 `head.md` 的「要做某一格」指令）、`:107`（寫入 `head.md` 的
do-not-hand-edit 標記）、`:142`（衝突提示）、`plan-item.py:196`（v1/v2 計畫「只能整份讀」
的錯誤訊息）。

前兩者進的是生成檔。採用者無法手動修正 `head.md`，等於每次重生成都被指回我的目錄一次 ——
這比散文的硬編更難察覺，因為它看起來像工具的權威輸出而不是別人留下的範例。

### O4 · 2026-08-10 05:56:26+08:00 — 改完後 `head.md` 逐位元不變，推導對三種情境都正確

`ROOT_DISPLAY` 以「往上找到含 `.git` 的祖先，取相對路徑、POSIX 分隔符」推導。實測三種
`PLAN_HISTORY_ROOT`：`docs/toby/plan-history` → `docs/toby/plan-history`；倉庫外的暫存路徑
→ 絕對路徑；未設定 → `docs/dernoson/plan-history`。

因此本倉庫重生成 `head.md` 得到位元相同的檔案（`update-head.py` 回報 already up to date），
`tests/` 47 項全過。相對化不只是為了好看：`head.md` 進 git，絕對路徑或反斜線會讓別台機器的
clone 重生成出不同的檔案，`test_head_md_is_up_to_date` 就會紅。

### O5 · 2026-08-10 06:00:42+08:00 — 採用者要改的其實是三處，`README.md` 一處都沒提

`.claude/settings.json` 的 PostToolUse hook 仍寫死 `$CLAUDE_PROJECT_DIR/docs/dernoson/plan-history/update-head.py`。它不像 SKILL.md 那樣「複製過去就跟著錯」——它是每人一份的 gitignore
目標——但採用者若不改，hook 會去跑我的腳本、對著我的 corpus 重生成我的 `head.md`。

`docs/dernoson/README.md` 的採用說明目前只教人把 `.claude` symlink **指向我的資料夾**，等於
直接把人導向這條衝突路徑，且完全沒提 plan-history 有自己的資料目錄。

因此 O1 對範圍的判斷不完整：採用者實際要動的是 SKILL.md 的 `<PLAN_ROOT>`、settings.json 的
hook 路徑、以及自建計畫目錄並複製三支 `.py`，共三處。SKILL.md 目前寫的「其他地方都不必動」
是錯的，而錯在提醒文件上比沒有提醒更糟。

## 待辦

### 1 SKILL.md 導入 `<PLAN_ROOT>` 單一宣告點

- **state:** 完成
- **basis:** → O1、O4

開頭新增一小節，宣告 `<PLAN_ROOT>` 的值與它應該在哪（與 `.claude` symlink 指向的
`docs/<你>/claude` 同一層），並說明三支 `.py` 以自身所在目錄為 root、複製過去即自動對齊。

其餘八處字面路徑改為引用 `<PLAN_ROOT>`。`description`（行 3）改成不含人名的說法，因為它是
觸發判斷讀的那段。

判準：全檔 `grep docs/dernoson` 只剩宣告區塊那一處。

**沿革**

- H1 · 2026-08-10 落地 —— 新增「計畫根目錄」小節，其餘 8 處改引用；grep 只剩宣告那行 → O4

### 2 四個輸出字串改用執行期 `HERE`

- **state:** 完成
- **basis:** → O3、O2、O4

`update-head.py:86`、`:107`、`:142`、`plan-item.py:196` 的路徑改為由 `HERE` 組出，讓生成的
`head.md` 與錯誤訊息指向讀者自己的目錄。

只換顯示字串，不動解析。`HERE` 已存在且已支援 `PLAN_HISTORY_ROOT`（O2），不需要新的取得管道。

實作上多了一層：路徑要相對於倉庫根、用 POSIX 分隔符，理由見 O4。這層放在 `plan_parse.py`
的 `ROOT_DISPLAY`，與 `HERE` 同一處定義，兩支 CLI 共用。

**沿革**

- H1 · 2026-08-10 落地 —— `plan_parse.ROOT_DISPLAY` + 四處改引用，`head.md` 位元不變 → O4

### 3 重生成 head.md 並跑工具測試

- **state:** 完成
- **needs:** 0002#2
- **basis:** → O4

項目 2 會改變 `head.md` 的內容，需重跑 `update-head.py` 讓它與生成器一致，否則
`test_head_md_is_up_to_date` 會紅。接著跑 `tests/` 的 pytest 確認四個字串的改動沒有動到
任何斷言。

結果是 `head.md` 對本倉庫毫無變化 —— 推導出來的值與原本的字面值相同，這正是「別人才會看到
差異」的預期行為。

**沿革**

- H1 · 2026-08-10 落地 —— `update-head.py` 回報 already up to date，pytest 47 passed → O4

### 4 採用清單寫進 README，並修正 SKILL.md 的「只改一處」

- **state:** 完成
- **basis:** → O5

`docs/dernoson/README.md` 的 symlink 說明底下補一段：要用 plan-history 就得有自己的計畫目錄，
並列出三處要改的地方（`<PLAN_ROOT>`、settings.json hook、複製三支 `.py`）。它是採用者唯一
一定會讀的文件，提醒放這裡才攔得住人。

同時把 SKILL.md「計畫根目錄」小節那句「其他地方都不必動」改成實話，並點名 hook。

判準：照 README 從零走一遍，不需要再自己 grep 任何路徑。

**沿革**

- H1 · 2026-08-10 落地 —— README 補三步採用清單，SKILL.md 改為點名 hook 並指向 README → O5
