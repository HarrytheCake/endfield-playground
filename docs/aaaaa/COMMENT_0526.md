# interface 設計建議 (0526)

## 共通建議

- 變數名稱不要混用 camelCase 與 snake_case
    - 以 `src/data/devices.ts #22` 為例，可以將變數命名為 `productList`

## `src/data/devices.ts`

### `#353, #383` 冗餘的 export 複名

這些可能是 AI 生出來的遺留產物

## `src/data/machines.ts`

### 變數不該使用中文

### `#910` 設計方式建議

可以將前面所有物件集合為一個 list：

```typescript
const machineList: Machine[] = [
    {
        name: '塑型機',
        width: 3,
        height: 3,
        input_ports: [],
        output_ports: [],
        power: 0,
    },
    // ...
];
```

然後再使用 `new Map` 將其轉換為 lookup map：

```typescript
// 這邊使用 ReadonlyMap 是因為這些物件是不可變的
const machineNameMap: ReadonlyMap<string, Machine> = new Map(
    machineList.map((machine) => [machine.name, machine])
);
```

這樣的好處是可以不用宣告那麼多變數 (當然也解決掉中文變數名稱的問題)，並且之後每當有新的設備時，你就更新這個 list 就好，不用怕忘記在 map 那邊新增一次。

## `src/data/plan.ts`

### `#1 ~ #23` interface 定義應移至 `src/types/plan.ts`

## `src/types/flow.ts`

### `#21` 冗餘的委派 export

該委派在未來 debug 需要尋找問題來源時，會多一層麻煩。使用這些工具或是 type 的人應該要自己正確引用對應的來源。

### `#38, #51` 缺乏 id 欄位

## `src/types/machine.ts`

### `#81` 缺乏 id 欄位

### `#105 ~ #156` 工具函數不該在 `src/types/` 的檔案中

## 架構設計建議

### 為何這些東西都需要 id 欄位？

- 查找唯一性：name 無法保證唯一性、不變性 (可能機器名會修改、甚至修改語言)

### 索引相依性可以怎麼設計 (僅供參考)

- 一個 Machine 可對應多個 Recipe，一個 Recipe 應只對應一個 machine
- 一個 Product 可對應多個 Recipe，一個 Recipe 可對應多個 product
- 一個 Recipe 可對應多個 Product，一個 Product 可對應多個 recipe

這些東西其實彼此間是用 id 來互相關聯的
