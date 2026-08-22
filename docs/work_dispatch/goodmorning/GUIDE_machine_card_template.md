# 教學｜goodmorning｜MachineCard 完整樣板（W0823-G1 專用）

| meta | value |
|------|-------|
| 對應工單 | [W0823-G1](./W0823-G1_machine_card_mock.md) |
| 用法 | **整份複製**下面的檔案內容，改文字與樣式即可交件 |
| 唯一路徑 | `src/components/MachineCard/Index.vue` |
| Deadline | **8/28（五）23:59** |

---

## 1. 三步驟

1. 在專案裡建立資料夾 `src/components/MachineCard/`
2. 在裡面建立檔案 `Index.vue`
3. 貼上 §2 全部內容 → 存檔 → 交件（§4）

不必先看懂整個專案，也不必接任何資料。

---

## 2. 整份貼這個

```vue
<script setup lang="ts">
/**
 * MachineCard/Index.vue
 *
 * 工具列用的機器卡片（L3 純展示）：
 *   - 只顯示外部用 props 傳進來的文字，不自行讀取資料
 *   - 使用者點卡片時 emit('pick', id)，由上層決定要做什麼
 */

const props = defineProps<{
    /** 機器 id，點擊時原樣回傳給上層 */
    id: string;
    /** 機器顯示名稱，例如「粉碎機」 */
    name: string;
    /** 佔格文字，例如「3×2」 */
    sizeText: string;
    /** 分類標籤，例如「基礎生產」；沒有就不顯示 */
    tag?: string;
    /** 機器圖示網址；沒有就不顯示圖 */
    iconUrl?: string;
}>();

const emit = defineEmits<{
    /** 使用者點了這張卡片 */
    (event: 'pick', machineId: string): void;
}>();

/** 卡片被點擊：把自己的 id 往上回報 */
function onClick(): void {
    emit('pick', props.id);
}
</script>

<template>
    <button type="button" class="machine-card" @click="onClick">
        <img v-if="iconUrl" :src="iconUrl" class="machine-card__icon" alt="" />

        <span class="machine-card__body">
            <span class="machine-card__name">{{ name }}</span>
            <span class="machine-card__size">{{ sizeText }}</span>
        </span>

        <span v-if="tag" class="machine-card__tag">{{ tag }}</span>
    </button>
</template>

<style scoped>
.machine-card {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    text-align: left;
    border: 1px solid #3f3f46;
    border-radius: 8px;
    background: #18181b;
    color: #fafafa;
    cursor: pointer;
}

.machine-card:hover {
    background: #27272a;
}

.machine-card__icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
}

.machine-card__body {
    display: flex;
    flex-direction: column;
}

.machine-card__name {
    font-size: 13px;
    font-weight: 600;
}

.machine-card__size {
    font-size: 11px;
    color: #a1a1aa;
}

.machine-card__tag {
    margin-left: auto;
    padding: 2px 6px;
    font-size: 11px;
    border-radius: 4px;
    background: #3f3f46;
    color: #d4d4d8;
}
</style>
```

想改漂亮一點可以改 `<style>` 裡的顏色、圓角、間距，**不會影響驗收**。

---

## 3. 自我檢查（交件前逐條看）

- [ ] 路徑是 `src/components/MachineCard/Index.vue`，一字不差
- [ ] 檔名沒有日期（`Index.vue0828` 不行）
- [ ] 全檔搜尋沒有 `store`、`pinia`、`@/data/machines` 這幾個字
- [ ] 有 `id`、`name`、`sizeText` 三個 props
- [ ] 點卡片會 `emit('pick', id)`
- [ ] 沒有動到 `ToolbarPanel.vue` 或其他人的檔

---

## 4. 交件（三選一，禁止 GitHub 網頁 Add file）

**A. 本機 git（推薦）**

```powershell
git checkout -b dev/goodmorning-g1
git add src/components/MachineCard/Index.vue
git commit -m "feat(ui): MachineCard 機器卡片 mock"
git push -u origin dev/goodmorning-g1
```

再到 GitHub 開 PR，標題 `feat(ui): MachineCard mock`，描述貼上檔案路徑。

**B. 交給 dernoson 代推**：把整份檔案內容貼 Discord，寫明路徑 `src/components/MachineCard/Index.vue`。

**C. ZIP**：內層資料夾結構要一樣。

不會把卡片掛到畫面上截圖也沒關係——請 dernoson 代掛兩組假 props 驗收，**仍算你交付**。

---

## 5. 30 秒驗收長相

有人用這兩組假資料掛上去後，畫面應該看得到兩張卡：

```vue
<MachineCard id="crusher" name="粉碎機" size-text="3×2" tag="基礎生產" @pick="..." />
<MachineCard id="shaping_machine" name="塑型機" size-text="2×2" @pick="..." />
```

點任一張，上層會收到 `pick` 事件與對應 id。做到這樣就結案。

---

## 6. 逾時怎麼辦

8/28 前交不出來就在 Discord 說「本週不做」——**不計失敗**，工具列會繼續用現有按鈕，9 月 B1 再排。最怕的是不回訊息，那會讓人一直追問。
