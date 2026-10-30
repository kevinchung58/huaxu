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
- **三層驗證**：`node --test`（55 條，約 11 s，不開瀏覽器）→ `.verify/` 閘門 31 支（§2.3 的清單就是
  「有沒有跑」的判準；整段用 `python3 bin/gate-all.py` 跑，它讀的就是那份清單）→ 量具（§2.4，只在需要
  數字時跑）。效能看 `tools/bench.mjs`（§5.6）。
- **規模**：頁面程式 4 支共 9,552 行（載入順序在 `bin/site-sources.json`；巷道的 9,045 行仍是一個 closure，§3 P3）、
  產生器 7,524 行、`.verify` 98 支（其中閘門 31 支）、`skills/` 19 個。

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

**每一支都走 `sh bin/gate`**：它補回被沙盒清掉的 `node_modules` 與 `/tmp/al2023/lib`、匯出
`LD_LIBRARY_PATH`，並在機器上已經有 Chromium 時**拒絕**跑 `verify-feel`／`verify-collision`／`walk-feel`
（exit 3）——背景有別的瀏覽器，量到的速度與碰撞就不是這一頁的（2026-10-30：`verify-tables` 與
`verify-story` 在批次裡「紅」掉，其實只是沒匯出路徑，同一支單跑就過）。HTTP 型閘門仍要先
`sh bin/preview`（0.0.0.0:8080）。

**不在清單上的閘門等於不存在**：它不會紅，因為沒有人跑它。加一支閘門，就同時把它加進下面這一段。

**這一段可以直接執行**：`python3 bin/gate-all.py` 讀的就是下面這個圍籬，照順序一支一支跑（每支都走
`sh bin/gate`，一次一支，印出耗時與它自己的最後一行，紅的把尾巴印出來），最後給一張表。它不另外存一份
清單，所以清單不會跟磁碟漂移：磁碟上有一支 `verify-*` 而清單沒寫，或清單寫了磁碟沒有的，`--check` 直接
exit 2 並點名（`tests/gatelist.test.cjs` 釘住這件事）。常用：`--list`、`--only=walk,box`、`--skip=collision`、
`--stop`。清單第一行的 `sh bin/preview` 不會被執行——伺服器不會結束，需要伺服器的閘門由 `bin/gate` 起停。
**整段一次的實測時間**（2026-10-30，本機）：35 支 32.6 分鐘（最久 `verify-island` 443 s、
`tools/bench` 435 s、`verify-tables` 213 s）＋ `verify-collision` 31.5 分鐘 ≈ **64 分鐘**。

```sh
sh bin/restore-env && sh bin/preview          # 環境 + 伺服器（0.0.0.0:8080）
# ── 不開瀏覽器（秒級）──
node --test                                    # 55 條：45 條純檔案、4 條 jsdom 巷道、6 條環境（`bin/gate`）
node tools/bench.mjs                           # 效能基準（§5.6）；`--check` 是預設，`--write` 重錄
node .verify/verify-shapes.mjs                 # 248 個 prop 都有形
node .verify/verify-geometry.mjs
node .verify/verify-clash.mjs
node .verify/verify-tables.mjs
node .verify/verify-chain.mjs
node .verify/verify-games.mjs                  # 23/23
node .verify/shader-lits.mjs                   # 6 個 shader program 完整
node .verify/verify-walk.mjs                   # 212/212
node .verify/verify-sources.mjs                # 10/10（4 支組成的頁面程式：順序、?v= 同一顆、沒有重複頂層名字）
node .verify/verify-csslive.mjs                # 546 條選擇器：LIVE 400／RUNTIME 123／DORMANT 5／DEAD 0
node .verify/verify-ux.mjs                     # 69/69（按壓的動詞表、文字只給 read）
node .verify/verify-overlay.mjs                # 95/95（什麼可以蓋在走頁上、由哪個手勢）
node .verify/verify-exit.mjs                   # 82/82（每一種進去都有訪客認得的出口）
node .verify/verify-rooms-e2e.cjs              # 72/72（0 failures）
node .verify/verify-body.mjs                   # 73/73
node .verify/verify-story.mjs                  # 27/27
node .verify/verify-skills.mjs                 # 95/95（19 個 skill 都註冊、都有路由）
node .verify/verify-gen.mjs                    # 7/7（無孤兒模組、名字不重複、閘門讀得到全部、
                                               #    每頁釘的 ?v= 等於磁碟上 assets 的 sha1、冪等）
node_modules/.bin/impeccable detect --json .   # []
git diff --check && python3 -m py_compile _gen_html.py bin/toronto_massing.py
md5sum *.html > /tmp/a && python3 _gen_html.py && md5sum *.html > /tmp/b && diff /tmp/a /tmp/b   # 冪等
# ── 真瀏覽器，順序跑（獨佔）──
sh bin/gate node .verify/verify-feel.mjs          # 12/12（獨佔）
sh bin/gate node .verify/verify-look.mjs          # 5 張桌子都量到
sh bin/gate node .verify/verify-nowebgl.mjs       # 35/35
sh bin/gate node .verify/verify-island.cjs        # 47 站，每站 empty 0 %
sh bin/gate node .verify/verify-mirror.mjs        # 看到的就是按到的（73 % vs 1 %）
sh bin/gate node .verify/verify-box.mjs           # 75/75 框坐在自己畫素上、15/15 按壓（5 頁，約 3 分鐘；`SHIFT=40` 是反測）
sh bin/gate node .verify/verify-motion.mjs
sh bin/gate node .verify/verify-wheel.cjs         # 三張取最大（15 車廂）
sh bin/gate node .verify/verify-hotel.cjs
sh bin/gate node .verify/verify-rail.mjs          # 4/4（四個起點到同一顆停止點）
sh bin/gate node .verify/verify-objects.mjs
sh bin/gate node .verify/verify-floor.mjs         # 8 頁的鋪面 uv：一 tile = 64 × 該層 floor 的 period（12/12）
sh bin/gate node bin/verify-three.mjs             # 14,924 world + 1,048 water
sh bin/gate node .verify/verify-collision.cjs     # 28/28（7 頁，實測 31.5 分鐘；動到移動／碰撞碼才必跑）
```

每支後面的數字是**最後一次跑到的**，不是保證；引用前重跑。

**動到移動／碰撞碼時多跑兩件事**：`ROUNDS=20` 的 rooms 單頁連跑，以及寬掃描量具 `_wedge.cjs`
（§2.4）。一次綠燈是一次抽樣，不是驗收。

### 2.4 量具（`.verify/_*.mjs|cjs`；只留真的會再用的，其餘刪，git 歷史留著）

- **取景**：`_view.mjs`（一張影格一個行程，深站約 55 s）、`_walkshot.mjs`、`_aim.mjs`（轉到某個 yaw 再拍；
  `openPage(..., { reduce })` 必須在導覽前設）、`_gamesshot.cjs`、`_onscreen.mjs`、`browser-shot.mjs`。
- **量測**：`_pix.mjs`、`_strip.mjs`、`_lumacheck.mjs`、`_hourprobe.cjs`、`_coupling.mjs`（頁面程式的
  頂層名字、每個名字被幾個區塊讀、每個區塊幾行幾個名字；預設把四支接起來量，`FILE=js/site.js` 只看巷道；
  P3 就是靠它決定從哪個縫切）、`_scenehash.mjs`（**A/B 一支改動有沒有改到畫面**：把 `__walk.drawQuads` 的每個
  四邊形、相機、`threeStats` 排序後取 sha1，逐個 stop 印 SAME／DIFFERENT；不要用整張影格的差異判，讀
  `skills/frame-evidence` §9e）、`_abdiff.mjs`（兩張影格的差異分佈＋門檻計數，**看**差異用它，判有沒有差異用
  `_scenehash`）、`_partsprobe.mjs`（四支是不是真的都載入、`__walk` 有沒有掛上、overlay 名字解不解析得到）、
  `_shadow.py`（P3 的價錢：339 個頂層名字裡有幾個在更深層被當成參數／區域變數重用——決定「能不能只靠
  改字拆 closure」，今天 20 個，`a` 一個就 45 處）、
  `_floorband.mjs`（每頁第一站的鋪面帶 y700-734 x160-864 的 mean／sd；比亮度用它，不要用整張影格的 mean）、
  `_lane.mjs` / `_tile.mjs` 是鋪面的診斷（單頁深看）；**跨頁的尺度是閘門 `verify-floor.mjs`**、
  `verify-motion.mjs`、`audit-all.mjs`（一次載入量所有 prop 在**它被畫出來的那個最大視角**上的形：框是
  `--padx/--pady` 收回來的剪影、`visibility:hidden` 的視角不算（§5.8）；**診斷不是閘門**，`STRICT=1` 才是）、
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
- **一站一張影格**：`_stopshot.mjs`（按某一站、不瞄準，直接拍——驗收「訪客按了會看到什麼」用它，
  不要用 `_aim` 把鏡頭調到好看為止）、`_goatcheck.mjs`（抵達後量 `blockedAt`、標記是否在框內、
  按標記中央打到誰）、`_flowcheck.mjs`（同一個站兩張相隔 1.2 s 的影格，比對帶狀 mean 與變動像素佔比；
  `OFF=1` 是對照組）、`_reducedstill.mjs`（reduced-motion 下兩張影格必須位元組相同）。
- **每一站看什麼**：`_stopview.mjs`（抵達後對畫面正中央射線，回報第一個**不透明**的面、它的距離，以及
  `GRID=1` 時 16×12＝192 條射線的分類佔比：近牆／近物／遠景／天空／空。**單一射線只能找候選，佔比才能說
  「這面牆是主角還是角落」**——第 81 輪用它掃 57 站，9 站中央 12 m 內有不透明立面，其中 Goat stop 3 的近牆
  只佔畫面 19 %，所以那不是「貼牆」，是**主體被擠成一條**）。`_goatpitch.mjs`（同一個 stop 掃一串 pitch，
  拍影格並量中央三分之一的 mean／sd／色數，用來挑取景）。
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
- **`?v=` 是雜湊，不是手寫的日期**：`gen/site.py` 用 sha1（css + site.js + scene3d + games + 兩支
  Three.js）算十碼，`verify-gen` 第 5b 步在**重新產生之前**檢查每一頁釘的那十碼等於磁碟上的值——
  頁面比 assets 舊一格，只有訪客的快取看得到（本輪就是這樣：Goat 的水流改了 `js/scene3d.js`，
  但頁面停在上一組十碼）。
- **數字要能被質疑**：量具本身也會錯（`skills/frame-evidence` §9、§9b、§9c）。引用一個數字時，
  它旁邊要有「怎麼量的」與「樣本範圍／雜訊」。

## 3. 待辦（依優先序；每項都有驗收證據）

### P2 — ❌ 量過之後不成立：把 prop 改成資料省不到什麼

248 顆 `<button class="walk-hit">` 的 markup 在 8 頁共 **129,112 B**（niagara 47,981＝它自己的 47 %、
fukuoka 32.4 %、street 25.5 %）。把同一批 prop 改成資料檔的位元組數：

| 編碼 | 原始 | gzip |
|---|---|---|
| 現行 markup | 129,112 B | 25,762 B |
| 完整 JSON（一個 prop 一個物件，所有 data-* 照留） | 129,095 B | — |
| 精簡陣列（位置 + 固定的 9 個旗標 + style 字串） | 83,522 B | 21,733 B |

精簡陣列省 35 % 原始位元組，但 **gzip 之後只省 16 %**（25.8 → 21.7 KB，整站一次請求），
而代價是：`js/site.js` 要在建立 DOM 之後把 `style` 字串寫進去（等於把 `--x/--z/--w` 這一組搬到 runtime）、
約 40 個屬性的 `dataset` 大小寫規則、`verify-chain`／`verify-walk`／`tests/markup.test.cjs` 三支讀 HTML 的閘門
全部要改。**16 % 的 gzip 換三支閘門改寫＋一個新的 runtime 失敗模式，不划算。** 這不是「難做」，是「做完沒有好處」。
若哪天頁面真的太大，先量哪一頁超過預算——現在最大的一頁是 niagara 101.7 KB（gzip 後約 20 KB），
不是問題。詳見 `AGENTS.md` 的「不編造、不為數字而數字」。

### P3 — 給巷道一個介面（前三支已拆，剩下 9,045 行）

- **已完成的一半**：頁面程式拆成四支經典 script，`bin/site-sources.json` 是唯一的載入順序
  （`overlay` 133 行／`chrome` 153／`dot-game` 217／巷道 9,045）。**四支接起來與拆之前的 607,062 B 完全相同**；
  `verify-sources` 10/10 守住順序、單一 `?v=`、重複頂層名字、接起來能不能 parse。18 支閘門＋
  `tests/helpers/boot.cjs` 已改成讀 `siteText()`（分開 eval 看不到前一段的 `let/const`——量過，不是猜的）。
- **剩下的巷道**（`js/site.js`，`_coupling.mjs` 2026-10-30）：**9,045 行、288 個宣告共用一個 closure**，
  其中 11 個名字被 5 個以上區塊讀。這是介面，不是行數。
- **為什麼還沒拆，而且不是靠改字就能拆**：切 closure 不是搬移，是把 288 個共用名字改成介面。量過
  （`_shadow.py`：339 個頂層名字，其中 **20 個在程式更深的層級又被當成參數／區域變數**，最熱的 `a`
  一個就 45 處）——所以任何「把 `name` 換成 `NS.name`」的文字改寫都會把那 20 個的內層綁定一起改掉，結果是
  畫得出來、畫錯東西。正確做法需要真正的 scope 分析，而這裡不能有 parser：`acorn`／`babel`／`esbuild`
  都不在（就算裝了也是 build step，硬規則 2），自己寫一個能正確處理樣板字串與 regex/除法歧義的 lexer
  不是這一項的價值所在。**剩下的 319 個名字可以乾淨改寫，這 20 個不行**——這就是它一直是 rewrite 而不是
  move 的原因。
- **第二筆錢**：最快的閘門 `verify-walk`（212 條）現在把整段文字 eval 進 jsdom，而 **ES module 不能用
  這種方式 eval**，所以一次真的模組化要同時付「設計介面」與「把 212 條搬去真瀏覽器」兩筆錢。
- **範圍與驗收**（真的要做的那一輪）：先寫 scope 分析（或逐一手改那 20 個衝突名字並在 commit 裡列出）；
  維持經典 script 或把介面寫成顯式匯出，二者擇一並在 commit 裡說清楚；
  每個縫用 `_coupling.mjs` 命名；用 `verify-sources` 守；改動前後用 `_scenehash.mjs` 逐個 stop 比
  「程式交給 renderer 的四邊形」，**不要**用整張影格的逐像素差異驗收（`skills/frame-evidence` §9e：
  同一個 build 自己跟自己就差了 4,249 個 ±1 的像素）。
- **不要**為了讓行數好看而把 500 行搬進 `helpers.js`、留下 9,000 行的檔案。

### P6 — 場景還欠的（站主 2026-10-23 的清單）

已收（本輪或更早）：
- **Goat Island stop 3 的取景**：`pitch 14 → −2`、站位 `x 250 → 700`（欄杆前 85 cm，`blockedAt` 為 false）。
  量到的：中央三分之一 mean 117.9／sd 51.9／62 色 → **141.2／62.8／79**，水幕從「25–35 % 高的一條」
  變成佔畫面下半，霧柱在中央；`falls-horseshoe` 標記 924,668 在框內且按得到；`verify-walk` 212/212、
  `verify-island` 47/47、`verify-rail` 4/4、`verify-box` 75/75 全部重跑。影格 `.preview/goat-pitch/`。
- **近水面是一片不會動的貼圖**：`foam`／`rapids` 兩張 tile 現在沿 V 軸以 `time` 捲動
  （`FLOW_KEYS`／`FLOW_RATE`，`js/scene3d.js`；reduced-motion 時完全靜止）。A/B 量到的：
  近水面 y 640-767 **2.38 mean／10.4 % 像素在動** ↔ 把流動關掉同一個框 **0.07／0 %**；
  天空帶兩次都是 0.14–0.16，水幕帶 0.29–0.32（`_flowcheck.mjs`，`OFF=1` 是對照組）。
  reduced-motion 下兩張影格位元組完全相同（`_reducedstill.mjs`）。
- 店面本體、樹線結構、東京最後一站、五重塔、廣場暗帶：更早的輪次已收，各由 `verify-shapes`、
  `_ray`、`verify-wheel` 等守住。
- **鋪面尺度量到八頁**（原本只有 Niagara）：`street`／`rooms`／`fukuoka`／`toronto`／`journey`／
  `cntower` 一 tile 都是 **64.0 × 64.0 cm**（period 1），`niagara`／`goat` 的三層（含遠景 tier）都是
  **192.0 × 192.0 cm**（`FLOOR_PERIOD pavers: 3`，即四顆 48 cm 的石頭）——橫豎兩軸一致、沒有條紋。
  `verify-floor.mjs` 是它的閘門（12/12）。
- **量具覆蓋：248 顆 prop 全部量到「它自己的形」**：`audit-all.mjs` 的框修好兩處（未繪製的 prop 留著上一
  個視角的變換；`getBoundingClientRect()` 回的是 44 px 按壓框而非剪影，見 §5.8），八頁重掃：
  248 顆 prop、245 顆量到、18 顆在最大視角上 sd < 20、3 顆是只有文字的記錄（不是 prop）。
  `skyline-cn` 209,646 px／sd 19.2／10-of-40 → **171,456 px／sd 30.2／5-of-10**，不再被判平。

還開著：
1. **`audit-all` 的平不平清單現在是「藝術問題」**：18 顆 sd < 20 的多半天生一面（`signA-s` 空白摺牌、
   `plinth-*` 桌面、`curtain-back` 布幕、`queue-rail-*` 欄杆、`pipe-nakamise-e` 管、`mailbox-nakamise` 信箱）。
   判準分不出「窗簾」與「壞掉的東西」，所以 `STRICT=1` 仍未開；要開就得先決定哪幾個 kind 天生是平面
   ——那是站主的取捨（§4）。`hall-sl` 19.8 是唯一的邊界值（差 1 %，影格顯示磚面有開間）。
2. **鋪面的「該多大」仍然沒有表**：`verify-floor.mjs` 守住「uv 服從 `FLOOR_PERIOD`、tile 是正方形、
   每頁的鋪面有貼圖」（8 頁、12 個 tile 層），但**它證明不了 period 對不對**——把 `FLOOR_PERIOD`
   改 `pavers: 3 → 2`，tile 從 192 變成 128 cm，這支閘門照樣 3/3 綠（兩邊同時移動）。48 cm 的
   paver 只存在於 `paintPavers` 的「128 px 橫放四顆石頭」裡，沒有任何表寫著它。要讓它可判，得先
   把「一顆 paver 幾公分」寫成資料（站主的取捨，§4）。
3. **Niagara 的夜**：`HOUR=night` 沒有夜色授權 ⇒ 整頁深藍（mean 42.1）、只有兩顆燈光暈。
   要不要給 Clifton 一條夜色記錄是站主的決定（§4）。
4. **Goat Island 另外兩件**（都量過了，兩件都卡在站主的取景／亮度判斷）：
   - ①「鋪面 143.7 偏亮」**今天量不到**。`_floorband.mjs` 在 stop 0 的同一條帶（y700-734、x160-864）
     量到 mean **100.7**／sd 22.8，而記錄的鋪面平色 `#797570` 本身就是 luma **117.6** ⇒ 現在的畫面比記錄
     **暗**，不是亮。要嘛 143.7 量的是另一條帶／另一個 stop（要站主指認），要嘛它已經不成立——在找到那個
     位置之前不動繪法（P6-4① 原本就寫著「共用繪法，要動先確認別的頁」）。
   - ②「林線那帶偏暗」**已定位、未改**：goat stop 3 瀑布上方那條深帶是 `out="L"` 的美國岸林線
     （240 m，`gen/world.py:1636`，author `#556f45`、air 6.8 %、`dg=0.45`）。`_ray.mjs` 讀到它交給 renderer
     的頂點色 **[0.091, 0.159, 0.060]** ≈ rgb 23,41,15，是 author 值的 **0.27 倍**（`dg 0.45` × 該處的
     light）。同一面島壁在 Niagara 頁（`gen/world.py:1083`）用的是 `air × 1.9`（round 69 修「遠岸是一條
     黑槓」時加的），goat 這面仍是 × 1.0 —— 兩頁對同一塊林地用了兩種處理。要調哪一邊是亮度決定（§4）。

## 4. 需要站主決定（代理不能替他決定）

- **瀑布的圈要不要更亮**（`.preview/r65e/`、`.preview/r65b/falls2/`）；文字要不要縮短。
- **Goat 的林線要多亮、用哪一頁的處理**（§3 P6-4②）：現在 goat 那面是 `air × 1.0`、Niagara 同一面島壁是
  `air × 1.9`；它交給 renderer 的顏色是 author 值的 0.27 倍。選項是「goat 也 ×1.9」「兩頁都改 author 色」
  或「維持現狀」。
- **夜景 fold 0.62 的上限**（全站規則；`verify-walk` 有「night fold keeps a readable floor」的斷言）。
- **站點 6 的 A 字架要不要進畫面**（先量那條直線，不許先改後說）。
- **Goat 的瀑布與 Toronto 的 falls 要不要也做地標盤**（P6-1）。
- **Niagara 要不要一條夜色記錄**（P6-3）。
- **一顆鋪面石頭幾公分要不要寫成資料**（§3 P6-2：寫了 `verify-floor` 才驗得到 period，否則它只驗接線）。
- **哪幾個 prop kind 天生就是一面**（`signA` 空白摺牌、`plinth` 桌面、`curtain`、欄杆、管、信箱）：
  定了才能把 `audit-all --STRICT` 當閘門開（P6-1，§5.8）。
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

### 5.4c 會動的水

`FLOW_KEYS = {foam, rapids}`，`FLOW_RATE = {foam 0.055, rapids 0.11}`（V 單位／秒，`js/scene3d.js`）：
只有這兩張測繪貼圖沿 V 軸捲動，而且**只在非 reduced-motion 時**（與水幕 shader 的 `uMotion` 同一條規則）。
量法：同一個站拍兩張相隔 1.2 s 的影格，比對帶狀 mean 與「差 > 6 的像素佔比」，`OFF=1` 把 `FLOW_KEYS`
清空當對照組（`_flowcheck.mjs`）。**不要用「看起來有動」當證據**——先前那版在 A/B 裡是 0 %。

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

tracked 支檔案（`.git` 12 MB）：`js/vendor/three-0.186.1/three.core.js` 1.42 MB、
產生器 552 KB／7,524 行（入口 721 ＋ `gen/` 六個模組）、
`css/site.css` 85 KB（2,707 行）。頁面程式四支共 596 KB（`js/site.js` 577 KB／9,045 行，仍是一個 closure）。
`.verify` 98 支，閘門 31 支，`skills/` 19 個。
`image-search/`（3 張 CN Tower 參考照，**來源未追溯 → 永不入庫**）只留在磁碟。

### 5.8 每一顆 prop 的形（`audit-all.mjs`，八頁）

**框是什麼**：`[data-obj]` 是按壓目標，不是剪影。量的是 `getBoundingClientRect()` 減掉自己的
`--padx/--pady`（`js/site.js` 把框長到 `HIT = 44`，再用 inset 把圈收回剪影上），而且
`visibility:hidden` 的視角不算——沒被畫出來的 prop 留著上一個視角的變換（`js/site.js` 在寫新變換之前就
return 了），那個矩形是別的地方。面積門檻 14,400 px（120×120）、sd 門檻 20、取**面積最大**的那個視角。
`ROOMS=<page> node .verify/audit-all.mjs`，八頁一次跑約兩小時（niagara 最久）。

| 頁 | props | 量到 | sd<20 | 太小不能判 | 只有文字的記錄 |
|---|---|---|---|---|---|
| street | 27 | 27 | 3 | 3 | 0 |
| rooms | 33 | 33 | 2 | 0 | 0 |
| rooms-fukuoka | 41 | 41 | 5 | 9 | 0 |
| rooms-toronto | 26 | 26 | 1 | 12 | 0 |
| rooms-niagara | 100 | 100 | 7 | 49 | 0 |
| rooms-goat | 14 | 11 | 0 | 4 | 3 |
| rooms-journey | 3 | 3 | 0 | 0 | 0 |
| rooms-cntower | 4 | 4 | 0 | 0 | 0 |
| **合計** | **248** | **245** | **18** | **77** | **3** |

- **sd 量的是面與面之間的對比**（`flatShading`，一個面一個顏色），所以天生一面的東西 sd 就低：
  `signA-s`／`signA-s2`（空白摺牌，規則 5 不許有字）、`plinth-retrohighmart`（桌面）、`curtain-back`（布幕）、
  `frame-bridge`（畫框）、`ac-s`（牆上冷氣）、`bin-moji`（垃圾桶）、`pipe-nakamise-e`（管）、
  `mailbox-nakamise`（信箱）、`block-d`、`planter-strip-2`、`queue-rail-a`／`b`、`point-rail-sw`／`se`、
  `lights-post-b2`（欄杆與燈柱）。**這 18 顆不是 18 個缺陷**，判準分不出「窗簾」與「壞掉的東西」。
- `hall-sl`（St. Lawrence Market，19.8）是唯一的邊界值：差門檻 1 %，影格顯示磚面有開間與綠屋頂。
  要動它之前先問這是哪個問題——模型、門檻、還是那個 3.5:1 的長條框本身。
- 3 顆 `record-only`：`woodline-c1`、`channel-e`、`pool-lower`（`rooms-goat`）——`kind: landmark` 卻沒有
  `data-landmark="1"`，所以不畫、不給框、不回答，只在頁尾書面清單裡（`<li id="thing-…">`）。
  `verify-shapes.mjs` 現在把這件事寫成不變式：**地標記錄要嘛有標記，要嘛是 quiet 且被清單列出**。

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
