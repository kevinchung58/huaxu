# TODO — 這個站台接下來要做什麼

> 這份檔案只放**現在要用的東西**：現況、規則、閘門、待辦、量到的常數。
> **不記回合流水帳，任何地方都不記**（站主 2026-10-29，兩次：「那些紀錄都刪掉，我怕影響你判斷」／
> 「我覺得都不需要」）。哪一輪做了什麼、為什麼那樣做、當初怎麼量的，屬於 **commit message 與 PR 內容**——
> 寫一次，之後不當計畫讀。完成的項目直接刪除，不留敘述。

## 1. 現況

- **站台**：靜態學術網站（Hua-Xu Zhong）。零依賴、零 build step；所有 `*.html` 只由 `python3 _gen_html.py`
  產生（入口 721 行＋`gen/` 六個模組）；runtime 只有 vendored 的 Three.js 0.186.1。
- **可走的頁面（8）**：`street.html`、`rooms.html`、`rooms-fukuoka.html`、`rooms-toronto.html`、
  `rooms-niagara.html`、`rooms-goat.html`、`rooms-journey.html`、`rooms-cntower.html`。
- **分支**：`arena/0cb70678-huaxu` → `master`；PR #21 開著，**未合併**（合併要站主一句授權）。
- **三層驗證**：`node --test`（45 條，約 12 s，不開瀏覽器）→ `.verify/` 閘門 28 支（§2.3 的清單就是
  「有沒有跑」的判準）→ 量具（§2.4，只在需要數字時跑）。效能看 `tools/bench.mjs`（§5.6）。
- **規模**：`js/site.js` 一個 closure 9,479 行（§3 P3）、產生器 7,524 行、`.verify` 84 支、`skills/` 19 個。

## 2. 怎麼做（不變的部分）

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
- **量，不猜**：每一個「感覺不對」都要變成一個數字或一張影格（`skills/frame-evidence`）。
- 場景來歷要能追溯：`grounded-scene`、`real-place-builder`、`japan-place`、`district-author`、
  `street-commons`、`lane-prop`、`landmark-space`；收尾用 `scene-quality-loop`。
- 報告要證據優先（`skills/pua`）；改動要小而準（`skills/karpathy-guidelines`）。

### 2.3 閘門（一次跑完）

Puppeteer 需要 `LD_LIBRARY_PATH=/tmp/al2023/lib`；HTTP 型閘門要先 `sh bin/preview`（0.0.0.0:8080）；
**`verify-collision` 與 `verify-feel` 要獨佔機器**（背景有別的 Chromium，量到的速度就不算數）。

**不在清單上的閘門等於不存在**：它不會紅，因為沒有人跑它。加一支閘門，就同時把它加進下面這一段。

```sh
sh bin/restore-env && sh bin/preview          # 環境 + 伺服器（0.0.0.0:8080）
# ── 不開瀏覽器（秒級）──
node --test                                    # 45 條：41 條純檔案、4 條 jsdom 巷道
node tools/bench.mjs                           # 效能基準（§5.6）；`--check` 是預設，`--write` 重錄
node .verify/verify-shapes.mjs                 # 248 個 prop 都有形
node .verify/verify-geometry.mjs
node .verify/verify-clash.mjs
node .verify/verify-tables.mjs
node .verify/verify-chain.mjs
node .verify/verify-games.mjs                  # 23/23
node .verify/shader-lits.mjs                   # 6 個 shader program 完整
node .verify/verify-walk.mjs                   # 212/212
node .verify/verify-csslive.mjs                # 546 條選擇器：LIVE 400／RUNTIME 123／DORMANT 5／DEAD 0
node .verify/verify-ux.mjs                     # 69/69（按壓的動詞表、文字只給 read）
node .verify/verify-overlay.mjs                # 95/95（什麼可以蓋在走頁上、由哪個手勢）
node .verify/verify-exit.mjs                   # 82/82（每一種進去都有訪客認得的出口）
node .verify/verify-rooms-e2e.cjs              # 72/72（0 failures）
node .verify/verify-body.mjs                   # 73/73
node .verify/verify-story.mjs                  # 27/27
node .verify/verify-skills.mjs                 # 95/95（19 個 skill 都註冊、都有路由）
node .verify/verify-gen.mjs                    # 6/6（無孤兒模組、名字不重複、閘門讀得到全部、冪等）
node_modules/.bin/impeccable detect --json .   # []
git diff --check && python3 -m py_compile _gen_html.py bin/toronto_massing.py
md5sum *.html > /tmp/a && python3 _gen_html.py && md5sum *.html > /tmp/b && diff /tmp/a /tmp/b   # 冪等
# ── 真瀏覽器，順序跑（獨佔）──
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-feel.mjs        # 12/12（獨佔）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-look.mjs          # 5 張桌子都量到
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-nowebgl.mjs     # 35/35
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-island.cjs      # 47 站，每站 empty 0 %
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-mirror.mjs      # 看到的就是按到的（73 % vs 1 %）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-box.mjs         # 75/75 框坐在自己畫素上、15/15 按壓（5 頁，約 3 分鐘；`SHIFT=40` 是反測）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-motion.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-wheel.cjs       # 三張取最大（15 車廂）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-hotel.cjs
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-rail.mjs        # 4/4（四個起點到同一顆停止點）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-objects.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node bin/verify-three.mjs           # 14,924 world + 1,048 water
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-collision.cjs   # 28/28（7 頁，約 50 分鐘；動到移動／碰撞碼才必跑）
```

每支後面的數字是**最後一次跑到的**，不是保證；引用前重跑。

**動到移動／碰撞碼時多跑兩件事**：`ROUNDS=20` 的 rooms 單頁連跑，以及寬掃描量具 `_wedge.cjs`
（§2.4）。一次綠燈是一次抽樣，不是驗收。

### 2.4 量具（`.verify/_*.mjs|cjs`；只留真的會再用的，其餘刪，git 歷史留著）

- **取景**：`_view.mjs`（一張影格一個行程，深站約 55 s）、`_walkshot.mjs`、`_aim.mjs`（轉到某個 yaw 再拍；
  `openPage(..., { reduce })` 必須在導覽前設）、`_gamesshot.cjs`、`_onscreen.mjs`、`browser-shot.mjs`。
- **量測**：`_pix.mjs`、`_strip.mjs`、`_lumacheck.mjs`、`_hourprobe.cjs`、`_lane.mjs` / `_tile.mjs`（鋪面尺度）、
  `verify-motion.mjs`、`audit-all.mjs`（一次載入量所有可見 prop；**診斷不是閘門**，`STRICT=1` 才是）、
  `cost-probe.mjs`、`make-cover.mjs`。
- **手感與互動**：`_turn.mjs` / `_keys.mjs`、`_census.mjs`、`browser-check.py`（點擊真的落在地上；jsdom 沒有
  hit-testing）、`wall-live.mjs`、`wall-pierce-live.mjs`、`walk-feel.mjs`。
- **碰撞**：`_wedge.cjs`（寬掃描：每個 stop 16 個方位＋斜向壓牆＋每個 solid 四角，連續回報「有合法出口卻站著」）、
  `_wedge2.cjs`（把 `js/site.js` 的 `moveStep` **在記憶體裡**插旗，印 `clear`／`along`／`hop2`／`buzz`／`ok`；
  anchor 命中數不對就拋錯）。**改 `moveStep` 就要重對 anchor。**
- **效能**：`tools/bench.mjs`（每頁一列 frame／render／quads／calls／tris／scale，印出樣本**範圍**）、
  `cull-probe.mjs`（同一個 stop 換方向讀 render／calls／tris，分辨「畫面貴」還是「提交貴」）。
  讀 `__walk.renderMs` 前先讀 `skills/frame-evidence` §9c：它是 0.7/0.3 的指數平均，**要用 `__walk.draw()`
  要真的影格**，否則量到的是上一次重畫。
- **水與霧**：`_plume.mjs`（`MIST=red` 染色證明幾何在哪、`MIST=off` 關掉）、`_water.mjs`（40 px 一條帶的
  平均／sd／p05-p95／rgb 與 Δluma；每個狀態拍 5 張先平均，並印出同狀態雜訊）、`_ray.mjs`（對某個像素
  射線，回報前三個命中的 mesh 與世界座標）、`_fps.mjs`。**這幾支遇到 pageerror 一律 exit 2、不印數字**：
  空白背景配 HUD 也會量出一張表。
- **表面與抵達**：`_surface.mjs`（cover／content／fill／字的 measure）、`_stops.mjs`（每站抵達誤差，等
  `__walk.glide` 收工）、`_reach.mjs`（走過去按得到嗎）、`_deadui.mjs`（每個控制元件按下去有沒有變化；
  jsdom 不能導航是它的盲點）、`_uxwalk.mjs`、`_gap.mjs`（缺面：覆蓋圖＋向下 miss）、`_aisleprobe.cjs`。
- **診斷**：`_stuck.mjs` / `_stuck2.mjs`、`_tapdiag.mjs`、`_wallgap.mjs`、`_csscheck.mjs`、`wall-probe.cjs`、
  `verify-rooms-e2e.cjs`（jsdom 啟動樣板；`tests/helpers/boot.cjs` 是同一份）。
- **任何「等滑行結束」都要問 `__walk.glide`**，不要用固定秒數或「看起來停了」。
- **刪掉就不要留名字**：方法在 `skills/dead-ballast`（七種垃圾怎麼找、四種判決、怎麼證明移除是隱形的）。

### 2.5 記憶的規則

- **紀錄不存在。** 一輪做完，只更新本檔的「現況／待辦／常數」三段；敘述留在 commit message 與 PR 內容。
  不建 archive、不寫「本輪摘要」、也不在 skill 裡累積戰功。理由：舊紀錄會被下一輪當成現況讀。
  （2026-10-29 站主兩次裁定；`AGENTS.md` 與 `skills/pr-handoff` 都寫死了。）
- **不要用 grep 當證明，也不要用閘門當判官。** 一個 class 名可能只住在產生器裡，也可能只住在一句註解裡；
  反過來，閘門會把到不了的東西寫成真理。判官是 `.verify/verify-csslive.mjs`：它問 DOM，把剩下的分成
  LIVE／RUNTIME／DORMANT／DEAD。**只有 DEAD 才刪，DORMANT 要說出它等的是什麼資料。**
- **閘門的綠燈是一次抽樣**：移動類的驗收要連跑。
- **數字要能被質疑**：量具本身也會錯（`skills/frame-evidence` §9、§9b、§9c）。引用一個數字時，
  它旁邊要有「怎麼量的」與「樣本範圍／雜訊」。

## 3. 待辦（依優先序；每項都有驗收證據）

### P2 — 按鈕 markup 產生器（世界資料已經搬完，剩下的是可互動的 UI）

- **現況**：> 60 KB 的 island 已經是 `js/places/<place>.js`（`window.__HX_PLACES[place][attr]`），頁面只留
  `data-place` 標記＋普通 `<script>`，`readAny` 在 store 裡找，jsdom 閘門在 strip 前內聯。剩下的大塊是
  `<button class="walk-hit" data-…>`——每一顆都是可互動元素，不是 JSON。
- **做法**：把 prop 也寫成資料（generator → `js/places/<place>.props.js` → `js/site.js` 建 DOM）。
- **動手前先量**：先寫一支量具量「按鈕 markup 佔幾 KB」，不要憑印象。
- **代價寫在前面**：約 40 個 `data-*` 屬性與 `dataset` 的大小寫規則（`data-rideX` → `dataset.ridex`，
  見 `AGENTS.md` 單位規則）；`verify-chain` 直接讀 HTML 字串裡的 `data-leave`／`data-story`；
  `verify-walk` 讀 `.walk-hit` 的 DOM 與「nothing writes prose into the scene」；`tests/markup.test.cjs`
  也是讀 HTML（搬完要一起改）。沒有 JS 時整條 lane 本來就不能走，不是新問題。
- **不要重做**：改成 `fetch`／`await`。`js/site.js` 載入時同步組世界，async 會讓「先畫出一個沒有世界的
  lane」變成可能；普通 `<script>` 在它之前跑，就是這條規則的實作。
- **驗收**：19 頁 md5 冪等；`node --test`、`verify-walk`、`verify-chain`、`verify-ux` 全綠；
  頁面位元組下降量與「按鈕 markup 佔幾 KB」對得上。

### P3 — 拆 `js/site.js`（這一項要一整輪，不要用美工拆法交差）

- **為什麼不能只搬檔**：它是四個頂層單元——頁面 chrome 145 行、共用 overlay 管線 ~115 行、點點遊戲 207 行、
  **巷道 8,989 行（288 個宣告共用同一個 closure）**。把 closure 照檔切開不是搬移，是**把 288 個共用名字
  改成介面**；而且最快的閘門 `verify-walk`（212 條）是把那一支腳本 `w.eval` 進 jsdom 跑的，ES module 做不到。
  所以要拆就得**同時**付「給巷道介面」與「閘門改成真瀏覽器」兩筆錢。
- **範圍與驗收**：切成 `js/lane/{fields,props,reach,rail,story,px}.js`（原生 ES module），每個檔只匯出它
  真正的介面；**閘門改成 puppeteer 開真頁面跑同一批斷言**（212 條要一條一條搬，不是重寫）；並用 `.preview`
  的影格逐像素比對。沒過這三關就不算拆完。
- **不要**為了讓行數好看而把 500 行搬進 `helpers.js`、留下 9,000 行的檔案。

### P6 — 場景還欠的（站主 2026-10-23 的清單，未結案項）

0. **Goat Island stop 3 的預設視角是往下看（等站主一句話）**：authored `yaw 88 / pitch 14`，而本專案的
   pitch 正值＝往下，畫面中央 (480,430) 第一個命中的是 **528 cm 外、92 cm 高**的石牆，影格中間三分之一
   是護牆、馬蹄只剩頂端一條（`.preview/r76/goat-stop3.png`）。建議 `pitch 14 → 0~2` 並重拍；
   **看畫面的事留給站主**。驗收：重拍影格＋`_ray` 中央像素命中瀑布、不再命中 528 cm 的石牆。
1. **其他頁面的地標盤**：Goat 兩道瀑布已是世界幾何；Toronto 的 `falls` 模型只有 `look` 的數值，
   沒有專屬量具。
2. **量具覆蓋**：`_lane.mjs` / `_tile.mjs` 只量 Niagara 的鋪面；量別的頁面前先確認 `FLOOR_PERIOD`
   對那個 floor style 的意義。`audit-all.mjs` 的平不平判準（框內 sd ≥ 20、面積 ≥ 120×120 px、取最大視角）
   與程式不一致，`skyline-cn`（四棟塔的小模型，框內三成是空隙）因此永遠被判平——**先修判準，不要動模型**。
3. **Niagara 的夜**：`HOUR=night` 沒有夜色授權 ⇒ 整頁深藍（mean 42.1）、只有兩顆燈光暈。要不要給
   Clifton 一條夜色記錄是站主的決定（§4）。
4. **Goat Island 三件沒收尾的**：①鋪面偏亮（143.7 vs 記錄值 121，共用繪法，要動先確認別的頁）；
   ②林線那帶偏暗（`canopy` 斑塊）；③近水面仍偏平（加了 `foam` 水流線，要真的流得改 shader）。

## 4. 需要站主決定（代理不能替他決定）

- **Goat Island stop 3 的 pitch**（P6-0）：`14 → 0~2`？影格 `.preview/r76/goat-stop3.png`。
- **瀑布的圈要不要更亮**（`.preview/r65e/`、`.preview/r65b/falls2/`）；文字要不要縮短。
- **夜景 fold 0.62 的上限**（全站規則；`verify-walk` 有「night fold keeps a readable floor」的斷言）。
- **站點 6 的 A 字架要不要進畫面**（先量那條直線，不許先改後說）。
- **Goat 的瀑布與 Toronto 的 falls 要不要也做地標盤**（P6-1）。
- **Niagara 要不要一條夜色記錄**（P6-3）。
- **英文 CV PDF 與 ORCID iD**（`AGENTS.md` 的 backlog：站主提供檔案／網址後才加）。

## 5. 量到的常數與數字（不要重新發明）

### 5.1 控制契約

W/↑ 前進、S/↓ 後退、A/← 與 D/→ 轉向、Shift 跑、Space 跳、E 只給動詞（Q 已移除）。
`SPEED 165 cm/s`、`RUN ×1.25`、`TURN_RATE 85 °/s`、`DRAG_DEG_PER_PX 0.065`、`TURN_TAP_MS 35`
（一擊 ≈ 3.0°）、按住鍵上限 2 s、governor 下限 0.26、`?render=full`。
轉向**用訪客的毫秒付**，不是用幀：按住時把時間記入 `tap.held`，放手時補「還欠的」那一段，而且只付一次。
**放手要自己排一幀**（`keyup` 最後 `if (tap) loop();`），否則慢機器上那筆 nudge 欠給一個沒人排的幀。
實測（idle、1024×768 SwiftShader）：W 149 cm/s、S 156 cm/s、D/A 96.3 / 89.2 °/s、latency 49–166 ms。

### 5.2 互動與 reach

- **可按** = `leave` / `story` / `frame` / `ride` / `game` / `"demo" in o` / `landmark` /
  （`states` 且 kind 是 `door`／`glassfloor`）。其餘是 `data-quiet="1" tabindex="-1"`，列在
  「The small things (N)」。**`quiet` 只擋卡片，不擋動詞**（金魚攤的教訓）。
- **reach = 一個池子，最近的那個贏**（同距離 → 後的那個贏）；**地標壓過整個池子**。
  `REACH 190`、`FAR_REACH 8000`、`LANDMARK_REACH 60000`、`EXIT_REACH 350`。
- 地標沒有自己的面 → 標記就是整個盤；`falls-horseshoe` 離 promenade 394.4 m、bearing 292.6°。
  地標盤會**夾進畫面**（`M = 8`），但那是標記，不是「站在瀑布上」。
- 由產生器的 `is_target()` 與 `press_verb()` 決定；動詞以 `data-verb` 出貨，`VERB_WORD` 在 `js/site.js`。
  文字表面只有一個（`showWords`，只有 `read` 進得去）。

### 5.3 幾何與碰撞

- lane 牆 ±700；可行走半寬 676（parkway）／996（strip）／1726（plaza）；`PLAYER_RADIUS 24`。
- `moveStep` 的 slide 分支是 `blockedX || blockedD`；楔角死區是**速度** `deadAlong = 115 × dt`，
  蠕行 `creep = 115 × dt`，四步 `clear(sgn)` 前瞻（**步伐被 clamp 吃掉就不算暢通**）。
- 三個寫進程式碼的邊界，改它之前先看 `tests/lane.test.cjs`：①蠕行不吃 `buzz` 的反向價（`cornerAssist`
  自己記方向）；②`clear()` 用「真的走得出去」判定，不是「不撞」；③push-out 後留 **0.01 cm** 餘隙
  （`pen = R − dist` 剛好落在嚴格 `<` 的邊界上）。
- 停止點（HTML z）：61 / 1360 / 2842 / 4379 / 4814 / 6177 / 7424（fun row x 300, yaw 90）/
  8584（SkyWheel x 830, yaw 78）/ 10092。
- 自動走：空線 1,332 cm 用 8.5 s（≈157 cm/s）；判準是「這一步有沒有讓到終點的距離縮短一半以上」。

### 5.4 瀑布與霧（改霧／水幕前先讀）

- **取景**：`rooms-niagara.html` stop 3（Table Rock 步道），`yaw −109`（崖線弧頂方位 −109.4°，356 m），
  1024×768，day；`_water.mjs` 一條帶 = 40 px。任何「霧看不見」的結論，先用 `__cam` 把 billboard 投到畫面
  上數 **onScreen**：低於 20 張是取景問題，不是霧的問題。
- **尺度**：`makeClouds` 畫的是 `w` 的 15–26%；作者的 `w` 要當「世界公尺」乘 4–7 倍，否則得到 1.5 m 的點。
- **形狀**：馬蹄是漏斗，霧是**一根柱子**（弧中為中心的高斯權重 σ≈7/36、單朵 14–24 m），兩翼淡出。
  只有柱列該有霧；「每列都鋪」會出現 20 m 外 82° 的板子。
- **不要用「把 alpha／亮度調高」修白對白**：顏色 `#eef4f7` 疊在近白天空與近白水幕上，840 張 billboard
  佔畫面 20.7 % 只推 +1.1 luma。要改的是位置（霧在崖線之前才看得到），那是站主的決定。
- **量法**：每個狀態拍 5 張先平均再比，並印出**同狀態相鄰影格的雜訊**。y 600-640 這一帶同狀態就晃 ±22
  （池面自己在動），**任何「池上的霧」的單一數字都不要再引用**；y 440-480 的 p95 227 是右側白色量體，
  不是水幕。
- **shader 的 backtick 陷阱**：`js/scene3d.js` 的 6 個 shader 是 template literal，GLSL 註解裡一個 backtick
  會提早收掉字串，而 `node --check` 照過（讀成 tagged template）、瀏覽器整個空白。`shader-lits.mjs` 為此存在。

### 5.5 夜景

- `murkK = min(0.62, vLaneDarkness)`、`murkTex = clamp(luma × 2.2, 0, 1)`：霧的比例來自表面自己的亮度。
- **夜空只有一種寫法會被畫出來**：`backdrop.sky` 是遠平面（z=120000）上的高度色帶，
  `backdrop.skyAround.stops` 是仰角表；兩者都沒有就回 `FALLBACK_COLOR`。寫色帶時 y 要落在 120000 的尺度上
  （y=1600 → 0.76°、8000 → 3.8°、42000 → 19.3°）。
- **`skyEnv`**（`{"day":1,"night":0.22}`）乘在 `scene.environmentIntensity` 上，隨時辰內插；沒有這個欄位的
  頁面維持 1。夜空的 PMREM 在強度 1 下不是夜（量到朱紅柱子變 (36,57,114)、地坪 (40,65,120)）。
- **釘死的時辰**：`"night": 0.92` → `data-lane-night`，`HELD` 蓋掉訪客偏好、頁面不出現 `data-walk-hour`
  （`rooms.html`、`rooms-cntower.html` 是這一類）。
- **燈**（`scaledEffectTint`）：hex tint → 不透明度＝強度；`rgba()` tint → `a × 強度`。`r` 是**光暈半徑（cm）**，
  不是照明範圍（街上的燈籠 `r:30` 配 22 cm 燈體；寫 260 會變成探照燈）。要有燈體用 `"body":"lantern"`，
  要一個亮點用 `"bulb":true`。
- **自發光平面**：`q.nolite = true` 不吃夜色 murk 也不吃太陽（亮著的窗、燈籠紙、招牌背光用它；牆不要）。

### 5.6 一幀的代價（`tools/bench.mjs --write` 的基準）

每頁在**自己的第一站**、`draw()` 要 40 幀暖機後取 16 幀中位數（沙盒 SwiftShader）：

| 頁 | frame 間隔 | render（自身） | 樣本範圍 | quads | calls | 三角形 |
|---|---|---|---|---|---|---|
| rooms-cntower | 17 ms | 2.4 ms | 2–3 | 158 | 45 | 10,113 |
| rooms-goat | 20 ms | 2.7 ms | 2–4 | 321 | 43 | 3,138 |
| street | 38 ms | 7.0 ms | 4–14 | 729 | 73 | 2,570 |
| rooms-journey | 50 ms | 8.4 ms | 7–13 | 737 | 44 | 6,267 |
| rooms-toronto | 35 ms | 9.1 ms | 5–12 | 958 | 64 | 3,812 |
| rooms-fukuoka | 52 ms | 13.5 ms | 7–23 | 1367 | 60 | 4,215 |
| rooms | 45 ms | 14.3 ms | 9–19 | 796 | 143 | 3,748 |
| rooms-niagara | 50 ms | 17.4 ms | 14–24 | 2382 | 65 | 9,522 |

- **`frame` 這一欄不是效能**：靜止車道以 50 ms 的 idle 脈搏畫，`frameMs` 量到的是那個節奏。
  量畫面成本看 `render`；滑行或載入中的 frame 間隔不能當 steady state。
- **同一台機器上 render 會晃 2–3 倍**（street 三跑 53.5／121.0／64.9 ms，程式沒動），所以 `--check`
  只管**計數器**（每跑都一樣，容許 2 % 動態擺動）與 `render` 的 3 倍粗圍籬。
- **這個世界沒有「遠處」**：最長車道 159 m，霧 `FogExp2(0.000005)` 要 ~4 km 才飽和 ⇒ 以距離為判準的剔除
  在這裡沒有對象（P4 已量過，不成立）。

### 5.7 倉庫大小

tracked 支檔案（`.git` 12 MB）：`js/vendor/three-0.186.1/three.core.js` 1.42 MB、`js/site.js` 592 KB
（9,479 行，**一個 closure**）、產生器 552 KB／7,524 行（入口 721 ＋ `gen/` 六個模組）、
`css/site.css` 85 KB（2,707 行）。`.verify` 84 支，閘門 28 支，`skills/` 19 個。
`image-search/`（3 張 CN Tower 參考照，**來源未追溯 → 永不入庫**）只留在磁碟。

## 6. 已知限制（不要假裝解決了）

- 夜裡的 fold 壓到 0.62 是全站規則（待站主決定）。
- SkyWheel 的輪圈從廣場地板看永遠在畫面外（輪圈在頭上 71°）；站點 6 只看得到腿與排隊區。輪下的
  stop 6/7/8 看不到輪是構圖，不是缺陷，不要為此轉動地標。
- **`verify-feel` 與 `verify-collision` 需要空閒的機器**：旁邊有別的 Chromium，`verify-feel` 會把 40 ms
  轉向輕點量成 0.2°（應 3.0°），碰撞閘門的速度也失真。看到紅燈，先確認機器上只剩它一個。
- **`verify-collision` 在這個沙盒要 ~50 分鐘**，輸出要導到檔案才看得到進度（`> /tmp/collision.log`），
  接 `| tail` 會讓它 50 分鐘一片空白、看起來像卡住。
- 慢幀的根因是**瀏覽器軟體光柵化**；真正的槓桿是少畫像素，但在這個世界裡距離剔除沒有對象（§5.6）。

> 最後更新：2026-10-29 · 零依賴、純靜態、所有 HTML 由 `_gen_html.py` 產生。
