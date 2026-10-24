# TODO — 這個站台接下來要做什麼

> 這是這個 repo 的**單一真相來源**：下一輪（或下一個人）只看這一份。
> **規則：完成的項目直接刪掉，不留敘述。** 方法與永遠成立的約束留在第 2 節；量出來的事實留在第 5 節。
> 舊的 66 輪流水帳在 `TODO-archive.md`（git 追蹤、唯讀）；要找「那時候為什麼這樣做」再去查它。

## 1. 現在在哪裡（2026-10-24）

- **站台**：靜態學術網站（Hua-Xu Zhong）。零依賴、零 build step；所有 `*.html` 只由 `_gen_html.py` 產生；runtime 只有 vendored 的 Three.js 0.186.1。
- **可走的頁面（8）**：`street.html`、`rooms.html`、`rooms-fukuoka.html`、`rooms-toronto.html`、`rooms-niagara.html`、`rooms-goat.html`、`rooms-journey.html`、`rooms-cntower.html`。
- **分支 / PR**：`arena/adedb8cc-huaxu` → `master`（本輪開 PR；合併要站主一句授權）。
- **進度（第 69 輪，未交付）** —— 站主四件事（「通通弄好」）的現況：
  - **站主的問題先回答清楚**：那個 3D repo 是 `mrdoob/slop-newyork`（2026-10-23 的指示，見 `TODO-archive.md` §0aq）。**瀑布沒有照它重建**：它整份 `js/` 沒有一行 waterfall／river-fall，只有落葉噴霧與水窪；它的 WebGPU/TSL ＋ jsDelivr import map 也違反本站「零 build、零 CDN」。瀑布是第 58–60 輪從照片與本站自己的量測做出來的。真正能沿用它的只有 **P2 的 data module 架構**，而那件事到現在都還沒做。
  - **A 霧（做了，有數字）**：`_plume.mjs` 的紅染測試證明霧的幾何一直在、位置也對，看不見的原因是**白對白**：840 張 billboard 佔畫面 20.7%，平均亮度只 +1.1。改法是作者三列（碗內、崖邊、越過唇緣），spray 從 216 → 436 張。實測 y600-640 帶 Δluma **0 → 23.5**、y560-600 → 8.6、y520-560 → 6.9；整片不再只有崖上的白。
  - **B 水幕（做了，有數字）**：三處 —— 白端封頂（`aerated` 0.80 → 0.62，天花板的 227 不再是水幕自己的值）、落下方向的明暗（`densityDark`／`boilLift`，讓水幕有身體而不是一面牆）、底部改到最後四分之一才轉白。
  - **C 接地（做了）**：遠岸不是黑的。raycast（`_ray.mjs`，pixel 800,330）證明橫過瀑布的黑條就是 Goat Island 的 `canopy` 牆（326 m 外，`#2c4428`／夜 `#0f1618`）。改成 `#57764a`／`#24322a` 並提 ambient；同一個影格裡它從黑條變成遠岸的樹。
  - **新閘門 `.verify/shader-lits.mjs`**：GLSL 註解裡的一個 backtick 會提早結束 template literal，`node --check` 照過、瀏覽器整個場景空白（本輪被它害兩次，兩次都差點把空畫面當成「沒有霧」量下去）。閘門會先自我測試：合成的壞例必須被抓到，才去讀真的檔案。`_plume.mjs`／`_water.mjs` 也改成遇到 pageerror 直接 exit 2、不印數字。
  - **未做：P2**（世界資料搬出 HTML）。本輪把預算花在「量到成因 → 修 → 再量」上，P2 仍完整留在 §3，沒有動一行。

- **進度（第 68 輪，已交付）**：
  - **P0 站死修好，成因有三個，全在 `js/site.js` 的 `moveStep`**（每處都有 `Round 68` 註解與量測）：
    1. **楔角蠕行被反向門檻否決**：`buzz` 只用「上一個被接受滑動的方向」記帳，卻活得比那個面久；繞過箱角後新面的唯一暢通蠕行是 `115 cm/s × 8.3 ms = 0.955 cm`，永遠付不起 1.2 cm 的反向價 → 站在角上不動。修法：蠕行方向由 `cornerAssist`（自己的記憶＋四步淨空測試）決定，不受 `buzz` 管。
    2. **`clear()` 把步伐 clamp 在 lane 牆上還回報暢通**：貼牆轉角因此永遠選牆那一側，clamp 吃掉整步，人就站著（`clear:[1,1]`、0.507 cm 自我抵銷）。修法：步伐必須**真的走得出去**（clamp 會改變座標就回 0）。
    3. **push-out 剛好落在碰撞面上**（`pen = R − dist`），而接受判定是嚴格 `<`：浮點決定那一幀，候選 24.0009 vs R 24 被算成碰撞。修法：推離後留 0.01 cm 餘隙。
  - **P1b**：刪掉 8 段真正孤兒的 CSS（`title-btn`、`open-fig`、`.modal-close.on-photo`、`.ig-reel.is-pannable`、`.district-pick`＋其 media query、`.slot.is-drawn`、`.ig-room`），並把 `.ig-cell` 的過時註解改成實況。判準：**HTML／generator／js 三處都沒有**才算孤兒（`.ig-tile`、`.ig-cell` 這些只活在 generator 裡的是「圖一來就要用」的契約，不能刪）。
  - **P1c**：刪 6 支被取代的探針（`audit-merge`、`audit-views`、`_cycle`、`_feel7`、`_feel8`、`_night3`）；`.verify` 51 → 45 支。live-browser 量具（`wall-live`、`wall-pierce-live`、`walk-feel`、`browser-check.py`…）留在 2.4，不再只是「檔案裡有」。
  - **AGENTS 新規則**：「動得動的閘門跑一次只量到一條路」——碰撞閘門的路徑取決於前面撞擊留下的站位與 idle pulse 插進來的幀，驗收是**連跑 20 次**加寬掃描量具 `_wedge.cjs`，不是一次綠燈。

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

Puppeteer 需要 `LD_LIBRARY_PATH=/tmp/al2023/lib`；HTTP 型閘門要先 `sh bin/preview`（0.0.0.0:8080）；**collision 與 feel 兩支要獨佔機器**（背景有別的 Chromium 就會掉幀，量出來的速度會失真）。

```sh
sh bin/restore-env && sh bin/preview          # 環境 + 伺服器（0.0.0.0:8080）
node .verify/verify-shapes.mjs                 # 248 個 prop 都有形
node .verify/verify-geometry.mjs
node .verify/verify-clash.mjs
node .verify/verify-walk.mjs                   # 192/192
node .verify/verify-collision.cjs              # 28/28（7 頁）
node .verify/verify-feel.mjs                   # 12/12
node .verify/verify-body.mjs                   # 73/73
node .verify/verify-objects.mjs
node .verify/verify-story.mjs                  # 27/27
node .verify/verify-tables.mjs
node .verify/verify-games.mjs                  # 23/23
node .verify/verify-look.mjs
node .verify/verify-chain.mjs
node .verify/verify-nowebgl.mjs                # 35/35
node bin/verify-three.mjs                      # 12,826 world + 864 water
node .verify/shader-lits.mjs                   # 6 個 shader program 完整、沒有被 backtick 截斷
node_modules/.bin/impeccable detect --json .   # []
md5sum *.html > /tmp/a && python3 _gen_html.py && md5sum *.html > /tmp/b && diff /tmp/a /tmp/b   # 冪等
```

**動到移動／碰撞碼時多跑兩件事**（第 68 輪的規則）：`ROUNDS=20` 的 rooms 單頁連跑，以及寬掃描量具
（見 2.4）。一次綠燈是一次抽樣，不是驗收。

### 2.4 量具（`.verify/_*.mjs|cjs`；只留真的會再用的，其餘刪，git 歷史留著）

- **取景**：`_view.mjs`（一張影格一個行程，深站約 55 s）、`_walkshot.mjs`（走一段再拍）、`_aim.mjs`（轉到某個 yaw 再拍）、`_gamesshot.cjs`（遊戲畫面）、`_onscreen.mjs`（從站點看，畫面上有什麼）、`browser-shot.mjs`（真 Chromium 的定點連拍，skills 裡到處引用）。
- **量測**：`_pix.mjs`（像素比對）、`_strip.mjs`（抽一條像素帶）、`_lumacheck.mjs`（各時段的平均亮度）、`_hourprobe.cjs`（夜景的可讀性）、`_lane.mjs` / `_tile.mjs`（鋪面與材質的實際尺度）、`verify-motion.mjs`（每個物件自己框內的像素變化）、`audit-all.mjs`（一次載入量所有可見 prop）、`cost-probe.mjs`（一幀提交多少 quad／三角形）、`make-cover.mjs`（把一張真影格存成封面）。
- **手感與互動**：`_turn.mjs` / `_keys.mjs`（鍵盤手感與速度）、`_census.mjs`（互動普查）、`browser-check.py`（**點擊真的落在地上**——AGENTS 指定；jsdom 沒有 hit-testing）、`wall-live.mjs`（真瀏覽器的撞牆連段）、`wall-pierce-live.mjs`（真瀏覽器的穿牆取樣）、`walk-feel.mjs`（真瀏覽器的加減速與轉向）。
- **碰撞診斷（第 68 輪）**：`_wedge.cjs`（寬掃描：每個 rail stop 16 個方位＋斜向壓牆＋每個 solid 四角，**連續**回報「有合法出口卻站著」的 STALL）、`_wedge2.cjs`（同一條路線，但把 `js/site.js` 的 `moveStep` **在記憶體裡**逐點插旗，印出 `clear`／`along`／`hop2`／`buzz`／`ok`；每個 anchor 都 assert 只命中一次）。**改 `moveStep` 就要重對 anchor**，這是它的代價，也是它抓出三個成因的方式。
- **水與霧（第 69 輪）**：`_plume.mjs`（把 `js/scene3d.js` **在記憶體裡**補上 `window.__threeScene`，回報霧的 billboard 數／alpha／包圍盒；`MIST=red` 把霧染紅證明幾何在哪、`MIST=off` 關掉它）、`_water.mjs`（40 px 一條帶的平均／sd／p05-p95／rgb，以及開霧前後每帶的 Δluma；`STOP/YAW/HOUR/SCENE/OUT`，`SCENE=` 可以拿舊版 `scene3d.js` 做 A/B）、`_ray.mjs`（在活的場景裡對某個像素射線，回報前三個命中的 mesh 名與世界座標——「畫面那條黑的是什麼」用這個問，不要猜）、`_fps.mjs`（同一台 headless 上的 fps，用來判斷多出來的幾何有沒有代價）。**三支瀏覽器量具遇到 pageerror 一律 exit 2、不印數字**：空白背景配上 HUD 也會量出一張表，那張表不是場景。
- **診斷**：`_stuck.mjs` / `_stuck2.mjs`（卡住）、`_tapdiag.mjs`（點擊診斷）、`_wallgap.mjs`（畫牆與可行走空間）、`_csscheck.mjs`（樣式表解析與套用）、`wall-probe.cjs`（受困／滑動／擱淺普查）、`verify-rooms-e2e.cjs`（jsdom 啟動樣板，碰撞閘門共用同一份 boot）。

### 2.5 記憶的規則

- **做完就刪敘述**：完成的項目從本檔移除，只留「現在在哪裡」與「量到的事實」。
- **不要用 grep 當證明**：class 名可能是 generator 產生的（`class="ig-tile"`、`id="ig-plate"` 住在 `_gen_html.py` 裡，頁面上不一定看得到）。**閘門才是判官**：要刪一條規則，先刪、再跑閘門；閘門不叫，就把它當成契約留著。
- **閘門的綠燈是一次抽樣**：碰撞閘門的路徑每次不同（前面撞擊留下的站位＋idle pulse 的幀），所以移動類的驗收是連跑，不是一次。

## 3. 下一輪計畫（依優先序；每項都有驗收證據）

### P2 — 世界資料搬出 HTML（最大的結構改動）

- **目標**：世界資料從「烘焙進 HTML」改成獨立的 data module（照 `mrdoob/slop-newyork` 的 `nyc-geodata.js` 做法），頁面回到約 30 KB。
- **現況**：`rooms-cntower.html` 722 KB（**695 KB 是 `data-walk-backdrop`**，3,827 個 world prim）；`rooms-niagara.html` 325 KB（1,351 prim）；`rooms-journey.html` 264 KB（1,400 prim，其中約 1,140 個與 niagara 重複）。
- **做法**：新增 `js/places/*.js`（generator 照樣產生它，**不引入 build step**）；`js/places/index.js` 當 place index（停止點、district、地標），runtime 不再 parse DOM。
- **驗收**：cntower < 80 KB、`verify-three` 的三角形數不變（12,826 world + 864 water）、impeccable 0、全閘門全綠。

### P3 — 拆掉兩個巨型檔（純搬移，零行為變更）

- `js/site.js` 9,144 行 / 561 KB → `js/lane/*.js`（motion / reach / input / card / story / games）。
- `_gen_html.py` 6,821 行 / 483 KB → `tools/places/*.py` + 共用的 `tools/scene/*.py`。
- **驗收**：全閘門全綠 + `_pix.mjs` 逐像素相同。

### P4 — 距離剔除

- 照 `mrdoob/slop-newyork` 的 `scene-culling.js`（500 m proxy cell、CULL_MIN 300 / CULL_MAX 2000）。量到的瓶頸是**瀏覽器在畫 canvas**（frame gap 78–471 ms，lane JS 只有 38–60 ms）→ 少畫像素就是快。
- **驗收**：`tools/bench.mjs` 量到 frame 時間下降，且剔除邊界外的畫面內容不變。

### P5 — 真的測試套件 + 基準

- `tests/*.test.cjs`（node:test）：把「單元性質」的檢查從自製 harness 搬出來；瀏覽器型的留在 `.verify/`，**不重寫已有的 27 支閘門**。第 68 輪的三個碰撞成因（蠕行門檻、clamp 探測、push-out 邊界）是這套測試的第一批 case。
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
- **英文 CV PDF 與 ORCID iD**（AGENTS 的 backlog：站主提供檔案／網址後才加）。

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

### 5.3 幾何與碰撞解

- lane 牆 ±700；可行走半寬 676（parkway）／996（strip）／1726（plaza）；`PLAYER_RADIUS 24`。
- `moveStep` 的 slide 分支是 `blockedX || blockedD`；楔角死區 `|along| < 1.9` → `creep = 115 × dt`，四步 `clear(sgn)` 前瞻（第 68 輪起：步伐被 clamp 吃掉就不算暢通）。
- **第 68 輪三個成因的實測數字**（`_wedge2`，`js/site.js` 的 `moveStep` 內部）：
  - 蠕行 0.955 cm（115 × 0.0083）< `buzz` 的 1.2 cm → 8 個 freeze-with-exit 一次跑完（crate-nakamise-3 ×2、ladder、rack、mailbox、shopbay-e4 ×2、frame-poster-wires），每個都是 `clear:[1,0]`、`col:false`、`ok:false`。
  - `clear()` 在 x = −431（lane 牆）回報 `[1,1]`，蠕行 0.507 cm 被 clamp 抵銷 → move 0。
  - `pushAt` 推離後候選距離 24.0009（R = 24）、`h2.p` 0.07、`col:true` → move 0（浮點在嚴格 `<` 上翻面）。
  - 修好後：`_wedge` 寬掃描 5 輪 0 freeze（19,240–20,040 幀／輪）；`verify-collision` 7 頁 28/28。
- 停止點（HTML z）：61 / 1360 / 2842 / 4379 / 4814 / 6177 / 7424（fun row x 300, yaw 90）/ 8584（SkyWheel x 830, yaw 78）/ 10092。

### 5.4 瀑布（第 69 輪量到的；在做任何「霧／水幕」的改動前先讀這一節）

- **取景**：`rooms-niagara.html`，stop 3（Table Rock 步道），yaw −90，1024×768，day。`_water.mjs` 的一條帶 = 40 px。
- **改動前的樣子（第 68 輪的產物，存成 `/tmp/baseline.txt`）**：水幕從 y400 到 y520 是**一面白牆**（y440-480 `198.9`／sd `31.0`，p05-p95 `153-227`），y520-560 一步掉到 `82.0`，池面 `54.1`／sd `10.7`。霧的 Δluma 在崖下全部 ≈ 0（0.46／0.51／0.62／0.18／0.03／0）。
- **霧為什麼看不見**：`_plume` 紅染測試 → 幾何一直在、位置也對；840 張 billboard 佔畫面 **20.7%**，平均亮度只推 **+1.1**。顏色 `#eef4f7` 疊在近白的天空與近白的水幕上 = 白對白。**不要用「把 alpha／亮度調高」修它**，那是同一個錯誤再試一次。
- **改完之後（本輪）**：y600-640 帶 Δluma **23.5**（`56.1→72.2`），y560-600 **8.6**，y520-560 **6.9**，y640-720 也有 7–11。霧站在**池上**、在水幕的下三分之一前面，而不是崖上的天空裡。
- **水幕**：白端封頂後 y440-480 從 `198.9`／p95 `227` 變成 `185.1`／sd `36.2`；落下方向有明暗（上三分之一偏綠暗、下三分之一轉白）。**p95 仍是 227**：那是畫面右側那棟白色量體（不在水幕上），不要把它當成水幕的量測值。
- **遠岸的黑條**：不是著色錯誤，是 `_gen_html.py` 的 Goat Island `canopy` 牆（`#2c4428`，夜 `#0f1618`）。`_ray.mjs` 800,330 命中 326 m 的那面牆。改成 `#57764a`／`#24322a`、ambient ×1.9+240 之後仍是深綠，但不再是剪影。
- **shader 的 backtick 陷阱**：`js/scene3d.js` 的 6 個 shader 是 template literal。GLSL 註解裡一個 backtick 會提早收掉字串，`node --check` 照過（` `` ` 讀成 tagged template），瀏覽器整個空白。`.verify/shader-lits.mjs` 就是為此存在的閘門。
- **代價**：spray 216 → 436 張 billboard，`_fps.mjs` 同機比較 `1.4/1.4/8.1` → `1.3/1.5/8.1` fps（headless SwiftShader，絕對值沒有意義，差別才是）。

### 5.4 夜景

`murkK = min(0.62, vLaneDarkness)`、`murkTex = clamp(luma × 2.2, 0, 1)` → 霧的比例來自表面自己的亮度，鋪面的縫活著。

### 5.5 閘門現況（2026-10-24，第 68 輪）

walk 192/192、feel 12/12、story 27/27、body 73/73、games 23/23、nowebgl 35/35、shapes 248、geometry／clash／objects／tables／look／chain PASS、three PASS（12,826 world + 864 water）、impeccable `[]`、generator 冪等 19/19、collision **28/28**（全 7 頁）＋ rooms 單頁 **20/20**（第 68 輪的 acceptance loop）。

### 5.6 倉庫大小

tracked 約 17 MB：`js/vendor/three-0.186.1/three.core.js` 1.42 MB、`rooms-cntower.html` 722 KB、`js/site.js` 561 KB（9,144 行）、`_gen_html.py` 483 KB、`css/site.css` 2,890 行、`TODO-archive.md` 368 KB。`.verify` 45 支。
`image-search/`（1.2 MB，3 張 CN Tower 參考照，**來源未追溯 → 永不入庫**）只留在磁碟。

## 6. 已知限制（不要假裝解決了）

- 夜裡的 fold 壓到 0.62 是全站規則（待站主決定）。
- SkyWheel 的輪圈從廣場地板看永遠在畫面外（幾何如此：輪圈在頭上 71°），站點 6 只看得到腿與排隊區。
- `verify-feel` 的「慢幀仍在走」需要機器空閒才會過（背景有別的 Chromium 就掉到 70 cm/s）——量尺要獨佔機器。
- 慢幀的根因是**瀏覽器軟體光柵化**，不是 JS → 真正的槓桿是少畫像素（P4）。
- collisions 閘門的路徑**每次不同**（站位相依＋idle pulse 的幀）：單次綠燈只證明「這一條路走得通」，移動類驗收要連跑。

> 最後更新：2026-10-24 · 站台零依賴、純靜態、所有 HTML 由 `_gen_html.py` 產生。
