# TODO — 這個站台接下來要做什麼

> 這是這個 repo 的**單一真相來源**：下一輪（或下一個人）只看這一份。
> **規則：完成的項目直接刪掉，不留敘述。** 方法與永遠成立的約束留在第 2 節；量出來的事實留在第 5 節。
> 舊的 66 輪流水帳在 `TODO-archive.md`（git 追蹤、唯讀）；要找「那時候為什麼這樣做」再去查它。

## 1. 現在在哪裡（2026-10-24）

- **站台**：靜態學術網站（Hua-Xu Zhong）。零依賴、零 build step；所有 `*.html` 只由 `_gen_html.py` 產生；runtime 只有 vendored 的 Three.js 0.186.1。
- **可走的頁面（8）**：`street.html`、`rooms.html`、`rooms-fukuoka.html`、`rooms-toronto.html`、`rooms-niagara.html`、`rooms-goat.html`、`rooms-journey.html`、`rooms-cntower.html`。
- **分支 / PR**：`arena/adedb8cc-huaxu` → `master`（本輪開 PR；合併要站主一句授權）。
- **進度（第 69e 輪，本輪）** —— 站主說「瀑布感覺不好」，這一輪**先證明錯在哪**，再改：
  - **最大的錯是取景，不是霧也不是水幕。** 用頁面自己的相機（`__cam`）把 406 張霧的 billboard 投到畫面上：stop 3 的 `yaw -82` 讓霧的 alpha 加權中心落在 x **220/1024**、全畫面只有 **3/53** 張在框內——霧被左邊切掉，馬蹄的正中央不在鏡頭裡。**兩輪「調霧」之所以什麼都看不出來，因為改的東西大半在畫面外。** 從崖線自己算：離兩端連線最遠的那一點在 **356 m**、方位 **−109.4°**。stop 3 改成 **yaw −109**。
  - **第二個錯：霧的尺度用了錯的單位。** `makeClouds` 每朵 billboard 只畫 `w` 的 **15–26%**（`size: w * (0.15 + 0.11f)`），所以在 `_gen_html.py` 裡「看起來合理」的 900 cm，實際畫出來是 **1.5 m 的點**。紅染影格裡是方格、自然色影格裡什麼都沒有，就是這個原因。柱子的 `w` 改成 4200–7600 cm（畫出來 12–20 m）。
  - **第三個錯：整條崖線都有霧，包括鋪到訪客頭上。** 紅染 + 普查：406 張裡 **155 張在 300 m 內**，最近的 **20 m**、`w=3505 h=2519 α=0.409`，在 20 m 處佔 **82°** 視角——那不是霧，是貼在臉上的一面牆。成因是六個霧的迴圈只有一個有權重。修法：全部收成**一根柱列**（沿崖線四個錨點 24/27/30/33，各九輪），權重 `funnel()` 由崖線幾何自己算（弧頂、σ 3.5 點）。**406 → 74 張，最近的 192 m。**
  - **重新量（修好的量具，`YAW=-109`，4 張平均）**：y 240-280 **+0.4**、280-320 **+0.3**、320-360 **+2.1**、360-400 **+0.8**、400-440 **+0.9**、440-480 **+0.8**；同狀態雜訊 ±0.1–0.9。逐像素比對同一位置：霧的核心 **+53 luma**（單一像素最大值），墨爾本 y 600-640 仍是 ±21.7 的雜訊帶，**不要用**。
  - **水池的白板**：八圈泡沫環（26–148 m，40/30/22%）在掠射角下變成一張白板。改成 30/17/11/7/4/2.5%，白色只留在落下點 26 m 內。
  - **水幕的色階**：近白的兩段從落差的 15% 一路蓋到崖腳（85%），量到的瀑布方框 mean 188／sd 31。改成綠撐到 62%（`0.06/0.24/0.62`），四段各自更深一階。
  - **⚠ 還有一個沒修的洞（下一個 P0，見 §3）**：yaw −109 時畫面右側 x 565–690、y 370–515 是**沒有幾何的空洞**，背景霧色 217,230,238 透出來。`_ray.mjs` 對 7 個像素射線**全部沒有命中任何東西**（前三個座標 600,430／620,450／660,480／680,390 皆空），而 record 裡在該方向 1 km 處確實有一片崖線高度的水平面——所以是**近場（100–300 m）的碗口沒有牆**，不是資料缺片。這就是站主說的「plaster」：一塊平的淺色矩形。
  - **第 69f 輪：站主說的「plaster」找到了，也修好了** —— 那塊淡色矩形**不是霧、不是水幕、不是顏色**，是 **Goat Island 的西角沒有岩石立面**。`NIA_GOAT_GORGE` 從島的西北角才開始，而面向馬蹄的西角（`NIA_GOAT[:3]` 那兩段）只有 canopy 的頂與牆。`_gap.mjs`（新量具：逐像素往下射，數「什麼都沒打到」）在修前是 **241 條**向下零命中、畫面 x 550–1020/y 360–510 一整格 `H`；補立面（8 m 內縮、`strata` 貼圖、`s=low`）之後 **71 條**，`H` 格變 `#`。`_ray.mjs` 對原本五個零命中的像素**全部命中**島面（290–310 m）。
- **閘門（本輪 artefact）**：walk 193/193、collision 28/28、rail 4/4、body 73/73、shapes 248、look 全過、three PASS（1,973 world + 432 water、216 sheets、**74 spray layers**）、shader-lits PASS、`_fps` 0.2/22.4/20.1（第 69d 是 2.6/13.1/18.4）、generator 冪等（md5 兩次相同）。

- **進度（第 69 輪，未交付）** —— 站主四件事（「通通弄好」）的現況：
  - **站主的問題先回答清楚**：那個 3D repo 是 `mrdoob/slop-newyork`（2026-10-23 的指示，見 `TODO-archive.md` §0aq）。**瀑布沒有照它重建**：它整份 `js/` 沒有一行 waterfall／river-fall，只有落葉噴霧與水窪；它的 WebGPU/TSL ＋ jsDelivr import map 也違反本站「零 build、零 CDN」。瀑布是第 58–60 輪從照片與本站自己的量測做出來的。真正能沿用它的只有 **P2 的 data module 架構**，而那件事到現在都還沒做。
  - **A 霧（做了，有數字）**：`_plume.mjs` 的紅染測試證明霧的幾何一直在、位置也對，看不見的原因是**白對白**：840 張 billboard 佔畫面 20.7%，平均亮度只 +1.1。改法是作者三列（碗內、崖邊、越過唇緣），spray 從 216 → 436 張。實測 y600-640 帶 Δluma **0 → 23.5**、y560-600 → 8.6、y520-560 → 6.9；整片不再只有崖上的白。
  - **B 水幕（做了，有數字）**：三處 —— 白端封頂（`aerated` 0.80 → 0.62，天花板的 227 不再是水幕自己的值）、落下方向的明暗（`densityDark`／`boilLift`，讓水幕有身體而不是一面牆）、底部改到最後四分之一才轉白。
  - **C 接地（做了）**：遠岸不是黑的。raycast（`_ray.mjs`，pixel 800,330）證明橫過瀑布的黑條就是 Goat Island 的 `canopy` 牆（326 m 外，`#2c4428`／夜 `#0f1618`）。改成 `#57764a`／`#24322a` 並提 ambient；同一個影格裡它從黑條變成遠岸的樹。
  - **新閘門 `.verify/shader-lits.mjs`**：GLSL 註解裡的一個 backtick 會提早結束 template literal，`node --check` 照過、瀏覽器整個場景空白（本輪被它害兩次，兩次都差點把空畫面當成「沒有霧」量下去）。閘門會先自我測試：合成的壞例必須被抓到，才去讀真的檔案。`_plume.mjs`／`_water.mjs` 也改成遇到 pageerror 直接 exit 2、不印數字。
  - **D P2（做了）**：世界資料搬出 HTML。`_gen_html.py` 把超過 60 KB 的 island 寫成 `js/places/<place>.js`（`window.__HX_PLACES[place][attr]`），頁面只留一個帶 `data-place` 的標記＋一支普通 `<script>`（**在 `js/site.js` 之前**，所以仍然是同步可讀：沒有 fetch、沒有 await、沒有 build step）。`js/site.js` 的 `readAny` 讀不到文字就翻到 store；jsdom 型閘門（jsdom 不抓外部 script）在 strip 之前把 place 檔內聯進去；`bin/verify-three` 讀標記指向的那個檔案。
    - **頁面大小**：`rooms-cntower.html` 739,002 → **27,304 B**（驗收門檻 < 80 KB）、`rooms-journey.html` 293,392 → **26,201 B**、`rooms-niagara.html` 355,858 → **93,897 B**。
    - **三角形數不變**：`bin/verify-three.mjs` 仍報 12,826 world + 864 water、3 sourced worlds。
    - 小 island 留在頁內（2 KB 不值得一個 request），所以 `rooms.html`／`street.html` 等頁面只多了 VER 字串的差別。
  - **P0 自動走（上一輪以為是閘門不穩，其實是站上的錯）**：`verify-walk` 的教學段落先轉頭 48°、走兩公尺，再點 z 1392 的停止點；上一輪它 4 次失敗 2 次（HEAD 也一樣），被當成「閘門擲硬幣」。這輪查下去，**兩件事疊在一起**：
    1. **閘門自己**：兩支 JSDOM lane 同時活在一個行程裡，各自跑 rAF，第二支只剩一半的幀；而 glide 是「每秒幾公分 × 實際時間」，所以它在 9.6 s 的等待裡到不了 1,392 cm（單一視窗實測 8.5 s 到）。修法：開第二支之前先 `w.close()`，等待改成**等身體**（上限 40 s，實測的 5 倍）並且**加一條 assertion**：到不了就紅，不是默默量錯地方。步伐也改成「走到 200 cm 為止」而不是「按 1800 ms」。
    2. **站上真的有 bug**：身體到了 x≈270、z≈962 就**永遠到不了停止點**——`_rail.mjs` 把 glide 的狀態印出來，x 在 **206 與 343 之間被推來推去**，40–90 秒內一公分都沒靠近。成因兩個：`moved` 把**被推開**也算成「有在動」，所以繞路永遠不觸發；繞路又一邊側移一邊仍瞄準終點，每一步都是斜的、剛好撞回那個花台（`planter-nakamise-1`，x 278／z 1010／104×46 cm）。修法：**用「有沒有靠近」判定撞到**（`gained < stride/2` 就算擋住）、繞路時**先純側移到旁線再前進**、繞路基準取停止點自己的線（不是被推開的位置）、`homeGlide` 加上身體自己那一點與前 30 cm 的檢查（原本從 120 cm 外開始掃，正好跳過花台的深度）。
    - **結果**：`verify-rail.mjs`（新閘門，四種起點）**4/4，5.4–7.9 s 到達**；同一支閘門對**舊版 `site.js` 只有 1/4**（三個起點 30 s 內一公分都沒靠近，最後八幀印出的就是被推來推去的位置）——所以它真的量到這個 bug，不是量到運氣。`verify-walk` **193/193 連三次**；`verify-collision` 28/28（七頁的「every rail stop arrives」含在內）；`_wedge` 寬掃描 20 次 STALL 全部 `exits: []`（合法貼牆），**freeze-with-exit 0**。
  - **閘門現況（第 69 輪，最終 artefact）**：walk 193/193（連三次）、collision 28/28、feel 12/12、body 73/73、story 27/27、games 23/23、nowebgl 35/35、shapes 248、geometry／clash／chain／tables／look／objects 全過、three PASS（12,826 + 864）、shader-lits PASS、impeccable `[]`、`_gen_html.py` 冪等。

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
node .verify/verify-walk.mjs                   # 193/193（含「rail 帶你到停止點」）
node .verify/verify-rail.mjs                   # 4/4（四個起點都要到同一顆停止點；舊版 1/4）
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
- **自動走（第 69 輪）**：`verify-rail.mjs`（閘門：四個起點點同一顆停止點，每個都要在 30 s 內到，失敗會印出最後八幀的「身體 ↔ 目標」與是否在繞路；舊版 `site.js` 跑 1/4，修好後 4/4。它把 `js/site.js` 在記憶體裡補一行 trace，anchor 命中數不對就拋錯）
- **診斷**：`_stuck.mjs` / `_stuck2.mjs`（卡住）、`_tapdiag.mjs`（點擊診斷）、`_wallgap.mjs`（畫牆與可行走空間）、`_csscheck.mjs`（樣式表解析與套用）、`wall-probe.cjs`（受困／滑動／擱淺普查）、`verify-rooms-e2e.cjs`（jsdom 啟動樣板，碰撞閘門共用同一份 boot）。

### 2.5 記憶的規則

- **做完就刪敘述**：完成的項目從本檔移除，只留「現在在哪裡」與「量到的事實」。
- **不要用 grep 當證明**：class 名可能是 generator 產生的（`class="ig-tile"`、`id="ig-plate"` 住在 `_gen_html.py` 裡，頁面上不一定看得到）。**閘門才是判官**：要刪一條規則，先刪、再跑閘門；閘門不叫，就把它當成契約留著。
- **閘門的綠燈是一次抽樣**：碰撞閘門的路徑每次不同（前面撞擊留下的站位＋idle pulse 的幀），所以移動類的驗收是連跑，不是一次。

## 3. 下一輪計畫（依優先序；每項都有驗收證據）

### P0 — ✅ 已修（第 69f 輪）：那不是「碗口」，是 Goat Island 的西角沒有臉

- **收尾**：`NIA_GOAT_GORGE` 從島的**西北角**開始沿著北面走，而島的西角——面向馬蹄、崖線最後一個節點接上去的那兩段——只有 canopy 的頂和 canopy 的牆，**底下沒有岩石**。補上 `NIA_GOAT[:3]` 的立面（同一個 8 m 內縮、同一片 `strata` 貼圖、同樣 `s=low`）。
- **驗收（都做了）**：`_gap.mjs` 向下射線**零命中 241 → 71**（−71%），覆蓋圖裡的 `H` 格變成 `#`；`_ray.mjs` 對 (600,430)(620,450)(660,480)(680,390)(570,400) 五個像素**全部命中**島面（命中距離 290–310 m，也就是島的西角，不是遠崖）；畫面裡那塊淡色矩形消失（`.preview/water/gap2/`）。
- **順帶修好的一件事**：平面色 `#6e6a5f` 在 290 m 處是一張灰卡，改成加拿大崖面同一片 `strata`（16 m 一磚），頂邊於是有了質感可斷，不再是畫上去的邊。
- 剩下的 71 條向下射線集中在 (e,n)≈0,0 與 100,0——那是**崖線腳下的河面邊界**（河面只畫到島的岸線），屬於「水面的邊」，不是崖；要收掉它得把河面往西補，已列為下面這一項 P1。

<details><summary>原本的 P0 記錄（保留，因為驗收方式還在用）</summary>

### P1 — 河面只畫到島的岸線（第 69f 輪剩下來的 71 條向下射線）

`_gap.mjs` 修完 P0 之後還有 71 條「往下看、什麼都沒打到」的射線，全部集中在 (e,n)≈0,0 與 100,0 一帶——那是崖腳、也就是下層河面的**西邊界**。河面多邊形 `lower` 一路只到島的西岸線，再往西就是空的，於是從崖上往下看會看到背景色。這是「水面的邊」，不是崖，但它同樣是一塊平的淺色。驗收同 P0：`_gap.mjs` 的向下 miss 再降一個量級，且畫面裡崖腳沒有色塊。**先量河面邊界的實際位置再補**（不要憑印象把水面往西拉几千公尺——那會蓋掉島與美國瀑布的岸）。

#### （存檔）第 69e 輪的原記錄：碗口那個洞

- **現象**：`rooms-niagara.html` stop 3、`yaw -109`、day、1024×768，畫面 x **565–690**、y **370–515** 是一塊平的淺色（實測 RGB **217,230,238**），邊緣是直線。
- **證據**：`_ray.mjs` 對 (600,430)(620,450)(660,480)(680,390)(570,400) 射線**零命中**；同一支量具在 (700,420)(800,400) 命中 `surveyed world: __flat` 的崖面（`#6e6a5f`，294／570 m）。所以洞在**遠崖之前**，是碗口（100–300 m）沒有面。
- **不是資料缺片**：record 裡 `t:"f", h:-100` 的一片水平面（崖線高度）確實通過洞的方向，1 km 外。
- **驗收**：上面五個像素至少各有一個命中；同一個框的 luma 標準差從 ~4 升到 >15；`verify-three` 的 triangle 數不變或只少量增加。
- **注意**：先量再改。`_ray.mjs` 已經會印出命中的 prim，所以「補一面牆」可以指名道姓，不要憑印象加幾何。

</details>

### P2 — 世界資料搬出 HTML（本輪做了，§1 有數字）

- **已完成**：> 60 KB 的 island → `js/places/<place>.js`（`window.__HX_PLACES[place][attr]`），頁面只留 `data-place` 標記＋普通 `<script>`；`readAny` 在 store 裡找；jsdom 閘門在 strip 前內聯；`verify-three` 讀標記指向的檔案。cntower 739 KB → 27 KB。
- **P2 之後補的洞（第 69 輪）**：資料搬走之後，**有一個閘門悄悄失去它的對象**——`verify-collision` 的「painted floor-walls」直接讀 `.textContent`，對 cntower／niagara／journey 讀到空白，於是對著什麼都沒掃還印 `holes x0`（niagara 與 journey 正是第 45 輪 526/786 個自由站立點的兩頁）。修好後 niagara 回到 2 runs。**教訓寫進這一條**：搬資料的那一手，必須把每一個讀 island 的閘門一起改，否則閘門不會紅，只會瞎。
  - `journey` 掃到 0 runs 是**舊有**的（不是這一輪造成）：它 56 面牆都比「run 不超過半條 lane」的濾網寬。要動這個濾網，先量它到底在排除什麼，不要為了讓數字好看而放寬。
- **還沒做（下一輪的第一件事，而且它不再是「搬 island」）**：剩下的大塊**不是資料，是可互動的 UI**——niagara 93.9 KB 裡絕大多數是 `<button class="walk-hit" data-…>`，每一顆都是可以按的元素，不是 JSON。要再縮，唯一的辦法是**把 prop 也寫成資料、由 runtime 產生按鈕**（generator → `js/places/<place>.props.js` → `js/site.js` 建 DOM）。代價與風險要寫在前面：約 40 個 `data-*` 屬性與 `dataset` 的大小寫規則（`data-rideX` → `dataset.ridex`，見 AGENTS 單位規則）、`verify-chain` 直接讀 HTML 字串裡的 `data-leave`／`data-story`、`verify-walk` 讀 `.walk-hit` 的 DOM 與「nothing writes prose into the scene」、以及沒有 JS 時整條 lane 本來就已经不能走（不是新問題）。**先寫一支量具量「按鈕 markup 佔幾 KB」再動手**，不要憑印象。
- **不要重做**：把資料改成 `fetch`／`await`。`js/site.js` 在載入時同步組出世界，async 會讓「先畫出一個沒有世界的 lane」變成可能；普通 `<script>` 在它之前跑，是這條規則的實作。

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
- **自動走的實測**：空線 1,332 cm 用 8.5 s（≈157 cm/s）。**修好前**，直線切過 `planter-nakamise-1`（x 278／z 1010／104×46 cm）時，身體在 x 206↔343、z≈962 之間被推來推去，40–90 s 一公分都沒靠近；**修好後**四種起點都 6–8 s 到達。判準是「這一步有沒有讓到終點的距離縮短一半以上」，不是「身體有沒有動」。

### 5.4 瀑布（第 69 輪量到的；在做任何「霧／水幕」的改動前先讀這一節）

- **取景**：`rooms-niagara.html`，stop 3（Table Rock 步道），yaw −90，1024×768，day。`_water.mjs` 的一條帶 = 40 px。
- **改動前的樣子（第 68 輪的產物，存成 `/tmp/baseline.txt`）**：水幕從 y400 到 y520 是**一面白牆**（y440-480 `198.9`／sd `31.0`，p05-p95 `153-227`），y520-560 一步掉到 `82.0`，池面 `54.1`／sd `10.7`。霧的 Δluma 在崖下全部 ≈ 0（0.46／0.51／0.62／0.18／0.03／0）。
- **霧為什麼看不見**：`_plume` 紅染測試 → 幾何一直在、位置也對；840 張 billboard 佔畫面 **20.7%**，平均亮度只推 **+1.1**。顏色 `#eef4f7` 疊在近白的天空與近白的水幕上 = 白對白。**不要用「把 alpha／亮度調高」修它**，那是同一個錯誤再試一次。
- **⚠ 本輪先修正自己的錯**：上面那個「Δluma 23.5」是**錯的**。它是一張影格，而霧是會動的、水幕的 shader 也在動；兩張影格相差 3 秒，差的東西不只有霧。追下去發現 `_water.mjs` 有兩個量測錯誤：(a) 單張影格當結果（同一個 build 連跑兩次，同一個帶給 6.9 和 0.6）；(b) on/off 兩張相隔好幾秒，水幕自己的動畫也進了差值。修法：**每個狀態拍 5 張、先平均成一張再比**，並且**印出「同一狀態」相鄰影格的雜訊**，讓雜訊大於效果的帶自己承認。
- **改完之後（用修好的量具，兩邊同樣 5 張平均）**：

| 帶 | 舊 build 的霧 Δ | 新 build 的霧 Δ | 同狀態雜訊 |
|---|---|---|---|
| y 320-360 | 0.8 | **8.0** | ±0.3 |
| y 360-400 | 1.0 | **6.7** | ±0.6 |
| y 400-440 | 0.9 | **3.6** | ±0.9 |
| y 440-480 | 0.8 | **1.9** | ±0.8 |
| y 520-560 | 0.2 | **1.3** | ±0.3 |
| y 640-680 | 1.8 | **5.8** | ±4.8 |
| y 680-720 | 1.3 | **4.0** | ±0.3 |

  **第三個錯：均勻。** 即使基座加重，畫面還是「一片霧毯」——霧被平攤在 670 m 的 36 個點上、每朵 33–43 m。馬蹄形是**漏斗**：水往弧的中間收，而所有來源都說同一件事——**柱子站在中央**，兩翼相對乾淨（niagaraparks.com 的數字，以及「從 Parkway 遠處就看得到那根霧柱」的描述）。所以改成**一根柱子**：以弧中為中心的高斯權重（σ≈7/36）、單朵 14–24 m，兩翼淡出。spray billboard 436 → 812。
  **量到的（同一支修好的量具，兩邊都是 5 張平均）**：y 240-280 Δ **2.5**（雜訊 ±0.1）、y 280-320 **4.5**（±0.2）、y 320-360 **2.6**（±0.1）；y 360-720 全部 ≤ 1.1——**霧聚在崖上空中，不再塗在瀑布身上**。舊 build 在同樣的帶上是 0.3–0.6。
  **誠實的結論**：中段的霧現在是**一根看得見的柱子**（影格 `_water` 的 plume-on/off 與 `.preview/water/side-by-side.png`），但它仍然是**偏灰的薄煙**，不是照片裡那種有厚度的白色噴霧；而且它在崖上、不在觀者與瀑布之間——這是幾何限制（水幕在崖線之後，霧在崖線之前才看得到），要改就得動瀑布與觀景台的相對位置，那是站主要決定的事。
- **第 69e 輪補記（本節最重要的三件事，改霧前必讀）**：
  1. **取景**：stop 3 的舊 `yaw -82` 把霧的中心放在 x 220，霧大半在框外。現行 **−109**（崖線弧頂方位 −109.4°，356 m）。任何「霧看不見」的結論，先用 `__cam` 把 billboard 投到畫面上數 **onScreen**——低於 20 張就是取景問題，不是霧的問題。
  2. **尺度**：`makeClouds` 畫出來的是 `w` 的 15–26%。作者 `w` 要當成「世界公尺」乘 4–7 倍，否則得到 1.5 m 的點。
  3. **權重**：只有 `funnel()` 那條柱列該有霧（74 張）。406 張那種「每列都鋪」會出現 20 m 外 82° 的板子。
- **y 600-640 這一帶不能拿來量霧**：同一個狀態相鄰影格就相差 **±22**（池面自己在動）。本輪所有「池上的霧」的單一數字都是這個雜訊，不要再引用。
- **水幕**：白端封頂後 y440-480 從 `198.9`／p95 `227` 變成 `185.1`／sd `36.2`；落下方向有明暗（上三分之一偏綠暗、下三分之一轉白）。**p95 仍是 227**：那是畫面右側那棟白色量體（不在水幕上），不要把它當成水幕的量測值。
- **遠岸的黑條**：不是著色錯誤，是 `_gen_html.py` 的 Goat Island `canopy` 牆（`#2c4428`，夜 `#0f1618`）。`_ray.mjs` 800,330 命中 326 m 的那面牆。改成 `#57764a`／`#24322a`、ambient ×1.9+240 之後仍是深綠，但不再是剪影。
- **shader 的 backtick 陷阱**：`js/scene3d.js` 的 6 個 shader 是 template literal。GLSL 註解裡一個 backtick 會提早收掉字串，`node --check` 照過（` `` ` 讀成 tagged template），瀏覽器整個空白。`.verify/shader-lits.mjs` 就是為此存在的閘門。
- **代價**：spray 216 → 436 張 billboard，`_fps.mjs` 同機比較 `1.4/1.4/8.1` → `1.3/1.5/8.1` fps（headless SwiftShader，絕對值沒有意義，差別才是）。

### 5.4b 夜景

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
