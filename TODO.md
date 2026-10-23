# TODO — 這個站台接下來要做什麼

> 這是這個 repo 的**單一真相來源**：下一輪（或下一個人）只看這一份。
> **規則：完成的項目直接刪掉，不留敘述。** 方法與永遠成立的約束留在第 2 節；量出來的事實留在第 5 節。
> 舊的 66 輪流水帳在 `TODO-archive.md`（git 追蹤、唯讀）；要找「那時候為什麼這樣做」再去查它。

## 1. 現在在哪裡（2026-10-23）

- **站台**：靜態學術網站（Hua-Xu Zhong）。零依賴、零 build step；所有 `*.html` 只由 `_gen_html.py` 產生；runtime 只有 vendored 的 Three.js 0.186.1。
- **可走的頁面（8）**：`street.html`、`rooms.html`、`rooms-fukuoka.html`、`rooms-toronto.html`、`rooms-niagara.html`、`rooms-goat.html`、`rooms-journey.html`、`rooms-cntower.html`。
- **分支 / PR**：`arena/b5407904-huaxu` → `master`；PR #19（站主已授權合併）。
- **進度（第 67 輪，已交付）**：
  - 垃圾清除：`image-search/` 的 3 張參考照片**退出 Git**（磁碟保留；來源未追溯，所以永不入庫）、`js/site.js` 的死定義 `SUN`/`uvAt` 刪掉、PR 草稿刪掉、34 支一次性探針刪掉（`.verify` 89 → 55 檔）。
  - **CSS 孤兒 class 的清理「暫緩」**：先刪了 44 條規則，walk 閘門立刻抓到兩條（相簿的 `object-fit` 與手機版控制條）——它們不是孤兒，是**契約**。正確做法寫在 P1b：**用閘門問，不要用 grep 猜**。
  - `TODO.md` 重寫為本檔；舊內容歸檔到 `TODO-archive.md`。
- **唯一的真缺陷（P0）**：collision 閘門在 `rooms.html` **偶發** freeze-with-exit（16 次全頁跑裡 1 次；之後 10+ 次單頁重跑都 0）。原因還沒定位 → 下一輪第一件事。

## 2. 怎麼做（不變的部分，不要每輪重寫）

### 2.1 硬規則（`AGENTS.md`）

1. **HTML 只能由 `_gen_html.py` 產生**；不手改任何 `*.html`。
2. **不引入 build step、不提交依賴**；runtime 的例外只有 vendored 的 Three.js 0.186.1。
3. **一次建置、一次驗證**（`SKILLS.md` §7）：不要分批改、分批報。
4. **沒跑過的閘門不能說它過了**（`SKILLS.md` §8）。
5. **不編造**：人名、場館、日期、到訪、招牌字樣——沒有來源就不要寫（`SKILLS.md` §5）。
6. **改完要 commit 在 session 分支上**；PR 前先更新本檔、讀 `skills/pr-handoff/SKILL.md`。
7. `skills/` 是追蹤的工藝資產；**參考照片不入 Git**。
8. 沒有站主授權不 merge。

### 2.2 技藝（`SKILLS.md` / `skills/*`）

- 先 grill（把需求問清楚）→ 再研究 → 再量 → 再寫。
- **量，不猜**：每一個「感覺不對」都要變成一個數字或一張影格。
- 場景來歷要能追溯：`grounded-scene`、`real-place-builder`、`japan-place`、`district-author`、`street-commons`、`lane-prop`、`landmark-space`；收尾用 `scene-quality-loop`。
- 報告要證據優先（`skills/pua`）；改動要小而準（`skills/karpathy-guidelines`）。

### 2.3 閘門（一次跑完）

Puppeteer 需要 `LD_LIBRARY_PATH=/tmp/al2023/lib`；**collision 與 feel 兩支要獨佔機器**（背景有別的 Chromium 就會掉幀，量出來的速度會失真）。

```sh
sh bin/restore-env && sh bin/preview          # 環境 + 伺服器（0.0.0.0:8080）
node .verify/verify-shapes.mjs                 # 248 個 prop 都有形
node .verify/verify-geometry.mjs
node .verify/verify-clash.mjs
node .verify/verify-walk.mjs                   # 192/192
node .verify/verify-collision.cjs              # 28/28
node .verify/verify-feel.mjs                   # 12/12
node .verify/verify-body.mjs                   # 73/73
node .verify/verify-objects.mjs
node .verify/verify-story.mjs                  # 27/27
node .verify/verify-tables.mjs
node .verify/verify-games.mjs                  # 23/23
node .verify/verify-look.mjs
node .verify/verify-chain.mjs
node .verify/verify-nowebgl.mjs                # 35/35
node bin/verify-three.mjs
node_modules/.bin/impeccable detect --json .   # []
md5sum *.html > /tmp/a && python3 _gen_html.py && md5sum *.html > /tmp/b && diff /tmp/a /tmp/b   # 冪等
```

### 2.4 量具（`.verify/_*.mjs|cjs`；只留真的會再用的，其餘刪，git 歷史留著）

- **取景**：`view.mjs`（一張影格一個行程，深站約 55 s）、`walkshot.mjs`（走一段再拍）、`aim.mjs`（轉到某個 yaw 再拍）、`gamesshot.cjs`（遊戲畫面）、`onscreen.mjs`（從站點看，畫面上有什麼）。
- **量測**：`pix.mjs`（像素比對）、`strip.mjs`（抽一條像素帶）、`lumacheck.mjs`（各時段的平均亮度）、`hourprobe.mjs`（夜景的可讀性）、`lane.mjs` / `tile.mjs`（鋪面與材質的實際尺度）。
- **手感與互動**：`turn.mjs` / `keys.mjs`（鍵盤手感與速度）、`census.mjs`（互動普查）、`reachprobe.mjs`（reach 實測）。
- **診斷**：`stuck.mjs` / `stuck2.mjs`（卡住）、`tapdiag.mjs`（點擊診斷）、`wallgap.mjs`（畫牆與可行走空間）、`csscheck.mjs`（樣式表解析與套用）。

### 2.5 記憶的規則

- **做完就刪敘述**：完成的項目從本檔移除，只留「現在在哪裡」與「量到的事實」。
- **不要用 grep 當證明**：class 名可能是 generator 產生的（`class="ig-tile"`、`id="ig-plate"` 住在 `_gen_html.py` 裡，頁面上不一定看得到）。**閘門才是判官**：要刪一條規則，先刪、再跑閘門；閘門不叫，就把它當成契約留著。

## 3. 下一輪計畫（依優先序；每項都有驗收證據）

### P0 — `rooms.html` 的偶發 freeze（唯一的真缺陷）

- **目標**：修掉「按著 W 走，身體卡住不動、但還能轉身離開」的 wedge。
- **前提**：先用 `GATE_DEBUG=1` 抓到一次現場（到目前為止還沒有失敗的細節，只有現象）。
- **已知**：g-coll5 = 28/28；g-coll6 = 28 頁中 1 頁 freeze-with-exit ×1；之後 10+ 次 `rooms.html` 單頁重跑都 PASS；frames 落在 19,080–20,040（邊界）。懷疑 `moveStep` 的 slide／creep：楔形裡 `along` 留在 1.9 cm 以下、creep 又被 `clear(sgn)` 否決 → 身體不動。
- **驗收**：連跑 **20 次**全頁 collision 都 28/28。

### P1 — 剩下的垃圾

- **P1b CSS 孤兒 class**：**用閘門問**（刪一條 → 跑 walk／look／nowebgl → 閘門不叫才真刪）。候選：`title-btn`、`open-fig`、`on-photo`、`district-pick`、`is-drawn`、`is-pannable`（先用 `git grep` 排除 generator 與 `js/`，再逐條問閘門）。**驗收**：walk 192/192、look 與 impeccable 0 findings、`_pix.mjs` 逐像素相同。
- **P1c 探針收斂**：只留 2.4 列的那些，其餘刪（git 歷史留著）。**驗收**：27 支閘門全綠、`git grep` 沒有任何檔案引用被刪的檔名。

### P2 — 世界資料搬出 HTML（最大的結構改動）

- **目標**：世界資料從「烘焙進 HTML」改成獨立的 data module（照 `mrdoob/slop-newyork` 的 `nyc-geodata.js` 做法），頁面回到約 30 KB。
- **現況**：`rooms-cntower.html` 722 KB（**695 KB 是 `data-walk-backdrop`**，3,827 個 world prim）；`rooms-niagara.html` 325 KB（1,351 prim）；`rooms-journey.html` 264 KB（1,400 prim，其中約 1,140 個與 niagara 重複）。
- **做法**：新增 `js/places/*.js`（generator 照樣產生它，**不引入 build step**）；`js/places/index.js` 當 place index（停止點、district、地標），runtime 不再 parse DOM。
- **驗收**：cntower < 80 KB、`verify-three` 的三角形數不變（12,826 world + 864 water）、impeccable 0、全閘門全綠。

### P3 — 拆掉兩個巨型檔（純搬移，零行為變更）

- `js/site.js` 9,116 行 / 558 KB → `js/lane/*.js`（motion / reach / input / card / story / games）。
- `_gen_html.py` 6,821 行 / 483 KB → `tools/places/*.py` + 共用的 `tools/scene/*.py`。
- **驗收**：全閘門全綠 + `_pix.mjs` 逐像素相同。

### P4 — 距離剔除

- 照 `mrdoob/slop-newyork` 的 `scene-culling.js`（500 m proxy cell、CULL_MIN 300 / CULL_MAX 2000）。量到的瓶頸是**瀏覽器在畫 canvas**（frame gap 78–471 ms，lane JS 只有 38–60 ms）→ 少畫像素就是快。
- **驗收**：`tools/bench.mjs` 量到 frame 時間下降，且剔除邊界外的畫面內容不變。

### P5 — 真的測試套件 + 基準

- `tests/*.test.cjs`（node:test）：把「單元性質」的檢查從自製 harness 搬出來；瀏覽器型的留在 `.verify/`，**不重寫已有的 27 支閘門**。
- `tools/bench.mjs`：一條命令量 frame 時間、draw call、prim 數——重構的迴歸尺。

### P6 — 場景還欠的（站主 2026-10-23 的清單）

1. **店面本體**（最久的一條，0aj 起）：門、騎樓柱、招牌底座（**不可有字**）。*驗收*：站在店前 4 m 的影格裡，門與柱都在畫面上且有深度（不是貼紙）；`verify-shapes` 全綠。
2. **街後的 `canopy` 貼太近**（店面像開在森林前）。*前提*：先量它離店面幾公尺、離地多高（record 的 w/d/h 與 x），再改。*驗收*：同一張店面影格裡，樹木退到店面後方。
3. **`hotelw` 旅館塔近看**：已給 `trcwall` 專屬磚（淡石材、基座腰線、三拱三方窗、深玻璃帶豎梃），欠一張近照證據。
4. **SkyWheel 吊艙近看**：圓潤感、門、座椅的節奏。*驗收*：近照裡能數出吊艙、認出門與玻璃。
5. **其他頁面的地標盤**：Goat 的兩道瀑布、Toronto 的 `falls` 模型（現在是「看得見就算」，沒有盤）。
6. **量具覆蓋**：`_lane.mjs` / `_tile.mjs` 只量 Niagara 的鋪面；量別的頁面前，先確認 `FLOOR_PERIOD` 對那個 floor style 的意義。

## 4. 需要站主決定（代理不能替他決定）

- **瀑布的圈要不要更亮／卡片文字要不要更短**（影格 `.preview/r65e/`、`.preview/r65b/falls2/`）。
- **夜景 fold 0.62 的上限**（全站規則；`verify-walk` 有「night fold keeps a readable floor」的斷言）。
- **站點 6 的 A 字架要不要進畫面**（先量那條直線，不許先改後說）。
- **Goat 的瀑布與 Toronto 的 falls 要不要也做地標盤**（見 P6.5）。

## 5. 已量到的事實（不要重新發明）

### 5.1 控制契約

W/↑ 前進、S/↓ 後退、A/← 與 D/→ 轉向、Shift 跑、Space 跳、E 只給動詞（Q 已移除）。
`SPEED 165 cm/s`、`RUN ×1.25`、`TURN_RATE 120°/s`、按住鍵上限 2 s、governor 下限 0.26、`?render=full`。
**短按不會被吃掉**：`tapState` 記住每個鍵的按住時間，沒被任何一幀看見就補一次，上限 120 ms（`owed = min(ms,120) − held`）。
實測（idle、1024×768 SwiftShader）：W 149 cm/s、S 156 cm/s、D/A 96.3 / 89.2 °/s、latency 49–166 ms。

### 5.2 互動與 reach

- 可按 = `states` / `leave` / `"place": true` / `PLACE_KINDS` / `landmark` / `frame`；其餘是 `data-quiet="1" tabindex="-1"`，列在「The small things (N)」。
- reach = **一個池子，最近的那個贏**（同距離 → 後的那個贏）；**地標壓過整個池子**。`REACH 190`、`FAR_REACH 8000`、`LANDMARK_REACH 60000`。
- 地標（瀑布）沒有自己的面 → 標記就是整個盤；`falls-horseshoe` 離 promenade 394.4 m，bearing 292.6°。

### 5.3 幾何

- lane 牆 ±700；可行走半寬 676（parkway）／996（strip）／1726（plaza）；`PLAYER_RADIUS 24`。
- `moveStep` 的 slide 分支是 `blockedX || blockedD`（兩個軸都被擋才停）——這是上一個「卡住不動」的修法。
- 停止點（HTML z）：61 / 1360 / 2842 / 4379 / 4814 / 6177 / 7424（fun row x 300, yaw 90）/ 8584（SkyWheel x 830, yaw 78）/ 10092。

### 5.4 夜景

`murkK = min(0.62, vLaneDarkness)`、`murkTex = clamp(luma × 2.2, 0, 1)` → 霧的比例來自表面自己的亮度，鋪面的縫活著。

### 5.5 閘門現況（2026-10-23，第 67 輪）

walk 192/192、feel 12/12、story 27/27、body 73/73、games 23/23、nowebgl 35/35、shapes 248、geometry／clash／objects／tables／look／chain PASS、three PASS、impeccable `[]`、generator 冪等 19/19、collision **28/28**（g-coll7，第 67 輪合併前那次全綠；但 g-coll6 有一次偶發 → P0）。

### 5.6 倉庫大小

tracked 約 16.7 MB：`js/vendor/three-0.186.1/three.core.js` 1.42 MB、`rooms-cntower.html` 722 KB、`js/site.js` 558 KB、`_gen_html.py` 483 KB、`TODO-archive.md` 368 KB。`image-search/`（1.2 MB，3 張 CN Tower 參考照，**來源未追溯 → 永不入庫**）只留在磁碟。

## 6. 已知限制（不要假裝解決了）

- 夜裡的 fold 壓到 0.62 是全站規則（待站主決定）。
- SkyWheel 的輪圈從廣場地板看永遠在畫面外（幾何如此：輪圈在頭上 71°），站點 6 只看得到腿與排隊區。
- `verify-feel` 的「慢幀仍在走」需要機器空閒才會過（背景有別的 Chromium 就掉到 70 cm/s）——量尺要獨佔機器。
- 慢幀的根因是**瀏覽器軟體光柵化**，不是 JS → 真正的槓桿是少畫像素（P4）。
- collision 閘門偶發 freeze（P0，未定位）。

> 最後更新：2026-10-23 · 站台零依賴、純靜態、所有 HTML 由 `_gen_html.py` 產生。
