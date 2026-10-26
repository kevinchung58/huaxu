# TODO — 這個站台接下來要做什麼

> 這是這個 repo 的**單一真相來源**：下一輪（或下一個人）只看這一份。
> **規則：完成的項目直接刪掉，不留敘述。** 方法與永遠成立的約束留在第 2 節；量出來的事實留在第 5 節。
> 舊的 66 輪流水帳在 `TODO-archive.md`（git 追蹤、唯讀）；要找「那時候為什麼這樣做」再去查它。

## 1. 現在在哪裡（2026-10-25）

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
- **第 69g 輪：整片遠岸是兩個灰階並排** —— 島的西角戴了 `strata` 貼圖、畫成 **luma 45.9**，它旁邊同一面崖（島的北面）**沒有貼圖**、畫成 **83.1**。同一個 `#6e6a5f`、同一個法線、同一段空氣，差 2.4 倍，交界處是一條直的硬邊——那就是站主看到的「灰板」。
  - **根因**：貼圖在 Three 裡是**乘上** vertex colour 的。`strata` 的底色是 rgb(133–181) 的中灰，於是它把 authored 的岩石顏色又乘暗一次（linear 光下約 ×0.33）。但 record 裡的 `c="#6e6a5f"` 本來就是那面岩石該有的顏色——貼圖的工作只是接縫與岩層，不該同時決定亮度。
  - **修法**：`strata` 的底色改成近白（190–248），接縫加粗到 3.5 px（310 m 處 1 px 會被 mipmap 抹掉），岩層色差拉到 22 %，並讓島的北面也穿上同一片磚（26 m 一磚，與加拿大崖面一致）。
  - **量到的**：兩面崖 **45.9 / 83.1（差 37.2）→ 62.2 / 64.3（差 2.1）**；接縫消失、整面遠岸成為一個面。瀑布本身沒動（curtain 178.8 → 178.8）。
  - **順帶發現的閘門盲點**：`verify-story` 把 rail stop 的方位硬寫成 −82，69e 改成 −109 之後它的 `waitForFunction` 直接逾時，**整支閘門只跑到一半就停**（還印 26/27）。現在它寫 −109 並附上 69e 的理由，而且真的跑完：**27/27**。
  - **留下來的**：遠岸仍然有**每 ~20 px 一段的橫向明暗階梯**。量過三種貼圖設定（1 px／3 px／3.5 px 接縫、16 m／26 m 磚），sd 只從 5.1 動到 5.5——**不是貼圖**，是 `world_quads_between` 每塊 quad 各自一個平面法線（`fn`）＋ `flatShading`，於是相鄰 quad 的受光不同。要修得動整條 `world_quads_between` 的法線策略，屬於 P3 的範圍，不是瀑布這一項。
- **閘門（本輪 artefact）**：walk 193/193、collision 28/28、rail 4/4、body 73/73、shapes 248、look 全過、three PASS（1,973 world + 432 water、216 sheets、**74 spray layers**）、shader-lits PASS、`_fps` 0.2/22.4/20.1（第 69d 是 2.6/13.1/18.4）、generator 冪等（md5 兩次相同）。

- **第 69i/69j 輪：東京的兩座建築是紙片，而最後一站看不到它們** —— 站主說「通通都弄好」。
  - **站 5 的取景本來就不可能對**：站在 17 m 外看 22.7 m 高的門，45° 鏡頭在該距離只裝得下 2×17×tan22.5 = **14.1 m**。改成站在 record 自己的 **28 m** 廣場進深（`z0=3016` 到門 6000），仰 **16°**（門脊在 atan((2270−168)/2800) = **36.9°**，畫面頂邊 38.5°）。**`pitch` 在這份程式裡是正＝往下**（`scene3d` 的 `lookAt` 從眼高減 `sin(pitch)`），第一次寫 +15 把鏡頭壓向地板，影格當場證明。
  - **門本身是剪紙**：每一片都在同一個 z，整個門樓只有 **230 cm 深**，「屋頂」是一個梯形、整片 **sd 1.2 luma**（一個色），整張影格 **60 個 quad**。現在有 record 的 **8 m**：近面中間開穿堂、遠面、兩道側牆、穿堂自己的天花與內壁（燈籠因此掛在真的暗處）、六根外凸的柱、有出簷與簷底的下層屋頂、有欄杆柱的上層、以及四坡＋脊＋簷底的大屋頂。屋頂面 **sd 1.2 → 16.8**、整座 **18.0 → 21.1**、**60 → 95 quad**。
  - **五重塔也是紙片，而且浮在虛空上**：每層一片貼在同一個 z；更糟的是廣場只鋪到 `z1=7600`，塔在 **7900** —— 從廣場看，塔的石基坐在「沒有東西」上，後面是霧。塔改成每層四牆＋外挑陽台＋四坡屋頂（含簷底與翹角）＋九輪相輪；廣場延伸到 **9000**（half 3400），塔站在院子裡。塔的影格 `.preview/tokyo/final/stop5-yaw-57-*`。
  - **兩支量具也是壞的**：`_view.mjs` 的「壓方向鍵」永遠瞄不準（幀被夾到 0.12 s → 最小一步 14.4°），改成**拖曳瞄準**（0.09°/px，事件驅動），對不到 1.2° 就 `NOT AIMED` 不存檔；`verify-look.mjs` 的 id 表有一半在頁面上不存在（`planter-i1/i2`、`stall-m1..m3`、`crate-m1/m2` 隨舊市場桌退場），所以它靜靜地什麼都沒量、exit 0 —— 現在 id 對得上真的頁面、方位改成絕對角度並回讀、**量不到就 FAIL 且 exit 1**。
  - **四支 `mix(a, b, t)`**：`mix` 只吃 `(hex, lift)`，第三個參數撞到第 61 輪的守衛 → 顏色原樣返回（店面門檻與遮簷本想用店面自己的色調染色，其實從來沒染）。改成既有的 `blendHex(a, b, t)`，並加一條閘門掃原始碼（先剝註解，否則它會抓到自己的說明）。
  - **閘門**：`walk` **197 → 201/201**（三條「門是真建築」：8 m 進深與遠面側牆、中央穿堂、四坡屋頂與簷底；一條「沒有三參數 mix」）、`look` 四桌全部量到（lake 467×276、falls 228×261、market 165×102、city 260×230），其餘 gate 全綠。

- **第 69l 輪：skill 不會自己開，所以要有一支會紅的閘門** —— 站主問「skill-creator 會自動判斷／自動啟用嗎？發現問題有必要就建 skills」＋「都去弄好」。
  - **實話先說**：`/tmp/anthropic-skills/skills/skill-creator/` 是一份**文件**，不是執行中的偵測器；沒有任何 runtime 會監看「你想改 skill」。它在我讀它的時候才存在，`/tmp` 一重置就沒了。所以「自動」只能由兩件事實現：**寫下來的觸發規則** ＋ **一支會紅的閘門**。
  - **閘門**：`.verify/verify-skills.mjs`。檢查 15 個 skill 的 front matter（`name` 要等於目錄、description 要說「何時用」且 ≥60 字）、<500 行上限、`skills/README.md` 有列、`SKILLS.md`／`AGENTS.md` 有路由、以及反向（README 列了但目錄不存在）。**第一次跑就紅 12 條**：`skills/` 有 15 個 skill、README 只登記 4 個。補完登記後 75/75 綠。
  - **規則**：`AGENTS.md` 新增「任何發現缺陷類別、實測常數或新量具的輪次，必須同一輪寫或改一個 skill，並跑 `node .verify/verify-skills.mjs`」；`SKILLS.md` 加路由段。
  - **新 skill**：`skills/skill-authoring/SKILL.md`（何時該寫成 skill、四個條件、要登記的三個地方、`evals/evals.json` 3 個 case）。
  - **P6-3 SkyWheel 結案**：輪面在 x–y 平面、pitch 夾 ±24°，所以「站在輪下」（stop 6/7/8，25–27 m、仰角 46–65°）看不到輪 —— 這是構圖問題，不是建模問題。**從 stop 2（欄杆，66.7 m、輪心仰角 22.4°）yaw 26 / pitch −21.5 看，整輪在框內、艙數得出來**：新閘門 `verify-wheel.cjs` 量到 **1023×615 px、上緣 14／下緣 629、14 個艙**（艙 10–20 px，與焦長 927 px、168 cm 於 66.7 m 的 23 px 相符）。
  - **這支閘門自己先錯了一次**：第一版用「比該列中位數亮 34」，在一個有 14 個艙的畫面裡只數到 **2** 個，然後對一個好好的場景報 FAIL。原因是艙（#c3ccd2，lum 155）與天空（#76a1cb，lum 147）**亮度幾乎一樣**，差的是彩度（b−r 15 vs 85）。改用「比天空亮且沒那麼藍」，並要求 7–60 px 的連通塊 ≥45 px。**故意讓它紅（MIN_CABINS=30）確認 exit=1**。
  - **`_map.mjs` 的已知限制**：車道的景物是**按材質合併**的，所以很多 prop 會回報成 `walk lane: flat/flat`（16,384 verts）而不是 prop 名。它可以證明「這個像素在 86 m 外、屬於合併景物」，**不能**證明「這個像素是 SkyWheel」。要 prop 名就用量畫面（`_box.py`／`_edge.py`）＋該 prop 專屬的偵測器。已寫進 `frame-evidence` §5。
  - **教訓寫進 skill**：新 §6b「閾值要量的是『把兩者分開的那個軸』，不是『讓其中一個變亮的那個軸』」——並要印出計數與尺寸，因為「14 個 10–20 px 的塊」可以對照焦距驗算，「PASS」不行。

- **第 69m 輪：Goat Island 終於有世界了，而「瀑布不在畫面裡」不是取景問題** —— 站主說「繼續都做好」。
  - **先撤回三輪的診斷**：前幾輪把 stop 2 的 yaw 一改再改（75、66、62），每次都說「這次該看到了」。**三次都不可能成立**：把作者寫的崖線、兩道水面、拋出量投影到相機（`pitch` 正＝往下、前向 `(sin y, cos y)`），從走道中段那個點看，水幕在**任何一個方位都只佔畫面的 0–1%**。原因是幾何，不是瞄準：崖線貼著走道右緣跑（6–17 m），水幕往外拋、往下掉，而**一塊水平的水面會把自己崖線後面的落差全部遮住**——掠過崖頂的視線以 `atan(1.68/距離)` 下降，6 m 外已經是 24°，水幕整片在視線之下。要看見它只能俯仰壓過那個角度，或把眼睛退開；轉頭沒有用。**這條寫進 `frame-evidence` §6c。**
  - **`_map.mjs` 沒有 `ROOMS=` 時預設讀 `rooms.html`**：本輪第一次 `_map.mjs` 量到「12.9–24.3 m 有 72 格噴霧」，於是判斷「霧的 billboard 貼在臉上」——**那 72 格是別頁的（Niagara）**。同一支工具換成 `ROOMS=rooms-goat.html` 之後，stop 3 的量測是 `rapids` 33 格 4.6–22.0 m、`stonewall` 12 格 1.5–3.4 m（欄杆）、水幕 7 格 14.6–124.2 m、`strata` 7 格 136–310 m。**量錯頁比沒有量更糟；已寫進 skill。**
  - **Goat Island 的世界（`goat_world`，`_gen_html.py` ~3306）**：先前只有 props 撐著，水面是 30 個 `hprims` 的塑膠片。現在是幾何：崖線取 survey 的 `NIA_HS_CREST[19:]`（148 m），放在走道平面上、末端釘在 Terrapin Point；上游水面由走道右緣鋪到崖線；水幕用**和加拿大頁同一個 shader**（四段帶、`fallsw` tile）從 `BRINK` 掛到 `LOW`，腳下拋出 16.3 m；加拿大岸與美國岸各是一道岩壁＋林線＋壁面貼圖（`strata`/`canopy`，法線朝走道）；池面、水花、霧柱都在。
  - **數字**：`GOAT_POINT=(12.0,161.0)`、`GOAT_GS=67.8` cm／record m、`BRINK=−1.02 m`、`LOW=−39.66 m`、`TREES=9.5 m`、拋出 16.3 m、`BANK=90.0 m`。**`BANK` 是本輪改的**：加拿大岸原本在 320 m，水幕只佔畫面 3.8°（`.preview/goat69mf` 量到 90×120 px 貼在左緣）；這個頁面的距離一向壓到約十分之一（美國瀑布 290 m 的崖線站在 30 m 外，同一段註解就在上面），所以 90 m 才是這條 strip 的說法。
  - **崖線的壓縮（`K=0.30`，上一輪加的）還在，理由沒變**：1:1 的崖線從 18 m 外看是一條 1.5° 的帶。**但水幕的條紋不是**：tile 從 3.8 m 改成 1.5 m（`u=150`）——3.8 m 一條在 84 m 外是 46 px 的直條，整個瀑布像帆布（`.preview/goat69mj`）。
  - **兩個站的取景（都量過，frames 在 `.preview/goat69ml`）**：stop 2 `x 250 z 4200 yaw 70 pitch 6`「the rail above the upper river」——隔著水池看加拿大側的水幕＋林線；stop 3 `x 250 z 5379 yaw 88 pitch 14`「Terrapin Point」——**鋪面 → 欄杆 → 水幕 → 林線 → 天**，量到空框 **0%**（`.preview/goat69ml/stop3-yaw88-p14`）。站位從 x 700 收到 250：欄杆在 x 7.85–8.35，站在 700 等於離一道 92 cm 的牆 0.7 m，畫面是一條石頭斜線（`.preview/goat69mk`）。
  - **閘門（本輪 artefact）**：`verify-island` 全站 40 stops＋goat 4 stops 全過（41.7／16.7／**13.3**／**0**% 空框）、walk 201/201、look 全量到、rail 4/4、skills 75/75、collision 28/28（另外跑）；`_map`／`_shot_at`／`_box.py` 三個量具照舊。
  - **同一輪補的三件（第二趟）**：
    - **回頭把一個結論撤回**：我原先寫「美國瀑布還是舊的 `falls` prop 畫法」——**錯**。`_map` 在 stop 1 量到 30 格 `surveyed waterfall sheets` 25.1–33.9 m，它從上一輪起就**已經是世界水幕**（同一支 `curtain()`、`u=300`）。真正的缺陷是別的：那一面**西側根本沒有欄杆**，而 stop 1 的標籤寫著「the rail at the American Falls」。補上同款欄杆（`parapet()` 抽成函式，東西兩側共用），量到的西側牆在 1.5–2.2 m。
    - **停點離欄杆多遠就是構圖**：穿過 96 cm 壓頂的視線以 `atan(0.72/d)` 下降，3 m 外是 14°，把 19.5 m 的水幕遮到只剩 6.7 m（`.preview/goat69mn/stop1-yaw-60-p6`）。stop 1 改到**欄杆邊**（`x -700`，離壓頂 1.2 m）、`yaw 285 pitch 12`：壓頂落到畫面最底，水幕就是整個框（`.preview/goat69mp/stop1-yaw-75-p12`）。
    - **上水面的水流**：沿崖線內側 4.2／2.6／1.2 m 各一條 38 cm 寬的 `foam` 線（透明 0.20／0.26／0.32），`rapids` tile 900 → 380 cm。原因是近水面量到 **sd 6.3、27 色**——一張壁紙。
  - **第二趟順手結掉 P6-1（Niagara 的旅館塔）**：`hotelw` 一直在 fun row 的視野裡（`_map`：324–333 m），但 `pitch -2` 把畫面頂邊切在屋頂線上。改成 **-8**：最近那棟塔在店面上方 **110×220 px**、`_box` mean 107.3／sd 37.2／134 色，店面沒變（`.preview/nia69ms/stop6-yaw90-p-8`）。**這一條的教訓：一個物件「在視野裡」和「在框裡」是兩件事，pitch 也是取景軸之一。**
  - **還沒做的，照實寫**：鋪面在腳下偏亮（最終幀 `_box` 量 143.7，記錄值 121；那個值在 `js/site.js` 的遠層與 `paintPavers` 裡共用，動它會移動別的頁）；林線那一帶偏暗（`canopy` 的斑塊）；近水面即使加了水流線仍偏平（要動 shader 才能真的流）。這三項列在 §3 P6-7。

- **第 69k 輪：量具先說謊，場景才跟著錯** —— 站主說「通通都弄好」並且「每次必用 skills creator」。
  - **先撤回一個數字，因為整條診斷都建在它上面**：`_ray.mjs` 印的 `19416` 是**公分**，也就是 **194.16 m**；TODO 的 P6 把它寫成「19.4 km、一面牆不到一個 texel、mipmap 壓成一片」，於是「森林太遠／太近」整段推理都是錯的。用 `_map.mjs` 重新射線：店面後面那面樹牆在 **211–252 m**、`canopy` 91 個 prim、頂在視線上方 8.6°。**19416 cm ≠ 19.4 km；這條已寫進 `frame-evidence` skill。**
  - **量具抽成一份共用實作**：`.verify/_aim.mjs`（`arrive()` 讀回站點自己的 `--z/--x`、`aim()` 用拖曳＋讀回、`park()`、`shot()`）。實測常數：水平 **0.09 °/px**、垂直 **0.065 °/px 且方向相反**（往下拖＝往上看；8.00 → 1.50 over 100 px）、pitch 夾在 **±24°**（`js/site.js:8946`）、一次按鍵最小 **14.4°**。到達不是「停住」（起步前也停著），也不是「進了一個 200 cm 的帶」（身體還在滑行）；`arrive()` 只在站點位置讀回時才算到，停在短處會印出 signed shortfall。
  - **兩支新量具**：`.verify/_map.mjs`（畫面格點射線 → prim 名＋距離＋材質的地圖與圖例，cm 與 m 都印）與 `.verify/_shot_at.mjs`（一站一角度，含仰角）。`-90` 那次請求被 **NOT AIMED** 擋下（要求 −28°、實際 +24°），擋下才是對的。
  - **樹牆的毛病不是距離，是顏色**：坡面與站在坡上的樹冠都用 `#3b5631` — 一個顏色疊在同樣顏色上就沒有邊，樹線是一條直線。改成每 7–9 m 一顆樹冠（高度 8–18 m、三段綠色 `CANOPY_CROWNS`）＋後面一條更高的深色帶。量到（同一個框 x285–400 y240–330）：頂邊 sd **20.07 → 15.29**、階數 17 → 15；右段 35.59 / 38 階。
  - **Toronto 的「三個平物件」重測**（`audit-all.mjs` 重寫：拖曳瞄準、26/26 都量到、每件取最大視角）：`skyline-cn` **6 → 14.9**、`island-i1` **2 → 5.4**、`pool-lake` **10 → 24.6（過關）**。真正還平的是 **`boat-lake` 6.7（24,455 px）**、**`tram-t` 18.0（43,384 px）**、`skyline-cn` 14.9（172,630 px）。原本的 sd 判準對 51×51 px 的小模型沒有意義（量到的是背景），改成「面積 ≥ 120×120 px 才判平」。
  - **SkyWheel 吊艙：四個視角只有 1 個艙**（stop 6 yaw 56/40、stop 7 yaw −165/−145、stop 8 yaw 118/101）。輪面在 x–y 平面、輪心 15.7 m 外、pitch 上限 24° ⇒ **站在「輪下」看不到輪**，只看到輻條與一段輪圈。這不是「近照沒拍」，是 P6 第 3 條的真身。
  - **夜色的 Niagara**：`HOUR=night` 沒有夜色授權，整頁是深藍（框內 mean 42.1），只有兩顆燈光暈。紀錄在此，未修（不屬於 P6）。
  - **新 skill（用 skill-creator 流程）**：`skills/frame-evidence/SKILL.md`（114 行）＋ `evals/evals.json`（3 個 case）；同時改了 `scene-quality-loop`（第 2 節加「每一張畫面都走 frame-evidence」），並在 `SKILLS.md` 與 `skills/README.md` 登錄。
  - **閘門**：`walk` **201/201**、`look` 4/4、`shapes` 248、`three` PASS（13,996 world tris）、`collision` 28/28、`body` 73/73、`story` 27/27、`rail` 4/4、`feel` 12/12、`games` 23/23、`nowebgl` 35/35、`chain` 0、`shader-lits` PASS、`_gen_html.py` 冪等。
  - **踩到的坑（寫進 skill）**：改完 `js/*` 沒重跑 `_gen_html.py`，`verify-walk` 的 cache-buster 檢查**真的紅了**（`deaa3e8cbe` 一片舊）；而用 `| tail` 收 exit code 會拿到 `tail` 的 0 —— 閘門要直接看 `$?`。

- **第 69h 輪：東京的量具、天空與時辰都停在錯的地方** —— 站主說「之前跟你看的那個 repo 都做得很完整，東京也應該做完整」。先量再改，量到五件事：
  - **量具自己先錯**：`_view.mjs` 用「壓住方向鍵 ≥600 ms」對準方位，而轉速是 120°/s —— 600 ms 就是 **72°**。標成 `yaw0` 的影格實際在 **−15.9 / −34.1 / −20.9**，三張都是斜著拍的（前一輪對東京的「平」有一部分是看錯角度）。改成：每個脈衝依剩餘角度給、短、之後重新讀頭並**等它穩定**（步進的最後幾度是下一幀才套用的），對不到 1.2° 內就**不存影格**並印 `NOT AIMED`，檔名一律寫實測角度。修好後三站都是 **0.09°**。
  - **東京的天空是死資料**：`rooms.html` 的三條 `sky` 色帶畫在 z=120000 的平面上，換算成仰角只有 **0.76° 與 3.34°** —— 4.8 m 屋簷以上（訪客看到的全部天空）只有最暗那一條。同一條 150 px 垂直線量到 **8.7–13.4 luma（Δ4.7）**，日夜一模一樣。改成仰角表 `TOKYO_SKY`（0°–90°，每個仰角同時有 `c` 日色與 `n` 夜色）→ 同一條線 **14.4–38.1（Δ23.7）**；天頂 (12.4,18.0,35.0)、近地平 (28.7,35.9,59.3)。天空同時變成環境光來源，所以加的 `skyEnv`（日 1、夜 0.22）是「這片天空在這一小時值多少光」，寫在 record 上、預設 1（既有頁面不受影響）。
  - **時辰是假的**：東京有日夜鈕，白天量到地坪 **73.8 → 107.1 luma** 變亮，天空卻是同一個夜 —— 因為「這頁有沒有白天」寫在 lane record 上，東京沒寫，`dayC` 就永遠不套用。兩條路：給它一個白天（要拉起鐵門、擺攤、有人，record 裡沒有），或**釘在自己的夜裡**（`"night": 0.92`、按鈕消失，與 LookOut 同一個慣用法，理由寫在 record 裡）。選後者。驗證：把訪客偏好設成 `day` 再拍，天頂逐值相同（**15.0/21.2/29.6/36.5**）。
  - **主角燈籠比旁邊的柱子暗**：Hōzōmon 中央的紅燈籠用牆面的紅（`#c22f22`）畫、再被夜色 murk 壓過去，量到 **69.7（sd 0.0，整塊同值）**；旁邊柱子 **68.8**、地坪 **72.5** —— 廣場上最重要的物件是畫面裡最暗的平面。改成紙燈籠自己的顏色（`#e8503a`）＋`nolite`（自己發光、不吃夜色）＋三圈暗肋，同一個位置 **109.0（sd 8.6）**，並在門下加一圈暖光池（地坪 75.3 → 77.4）。
  - **店簷的燈原本不是燈**：`r:260`、沒有燈體、tint 是 `rgba(...,0.22)`，被 `scaledEffectTint` 再乘上燈的強度 → **0.10 不透明度**；整條街的夜間光源在 1024 px 影格裡是三個白點。改成 `body:"lantern"`、`size:24`、`r:34`、hex tint（hub street 自己的燈籠就是 30 cm 光暈配 22 cm 燈體；260 cm 在 3 m 高的走道上讀起來是探照燈），影格裡兩排暖光＋落在百葉上的光斑。
  - **閘門跟著改，不是放寬**：`verify-walk` 的東京段把「每個 bay 只有沒有燈體的 strip」「街上沒有 lantern body」「天空是三條 y 色帶」都寫死了。改成新的事實：每個 bay 一個燈籠、燈籠 `r ≤ 40` 且 `size ≤ 32` 且顏色是 hex、`skyAround` ≥ 6 個仰角（首 ≤ 0°、末 ≥ 90°，`c`/`n` 都在）、`skyEnv.night ∈ (0,1)`，並**新增**「這條街只有一個時辰」（有 `data-lane-night="0.92"`、沒有 `data-lane-day`）；鐘的測試段落改在 `rooms-niagara.html`（有白天的頁）跑，東京與 LookOut 兩頁一起驗「釘死的頁沒有按鈕、訪客偏好改不動它」。`walk` **193 → 197/197**。
  - **另一支壞掉的量具**：`audit-all.mjs` 把「最佳視角」存成單一物件、報告卻當陣列用，跑到最後一行 TypeError（Toronto 的 10 個視角全白拍）。修好後第一次印出清單，Toronto 有幾個真的平的物件（見 §3 P6）。

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

### P1 — 河面只畫到島的岸線（第 69f 輪剩下來的 71 條向下射線；第 69g 重新量過，**仍未動**）

`_gap.mjs` 修完 P0 之後還有 71 條「往下看、什麼都沒打到」的射線，全部集中在 (e,n)≈0,0 與 100,0 一帶——那是崖腳、也就是下層河面的**西邊界**。河面多邊形 `lower` 一路只到島的西岸線，再往西就是空的，於是從崖上往下看會看到背景色。這是「水面的邊」，不是崖，但它同樣是一塊平的淺色。驗收同 P0：`_gap.mjs` 的向下 miss 再降一個量級，且畫面裡崖腳沒有色塊。
- **第 69g 補記**：再量一次（`STEP=8`）是 **108 條**向下 miss（比 69f 的 71 條多，因為取樣更密），仍然集中在 (e,n)≈0,0 與 100,0，也就是崖線正下方。畫面上那一帶是**深綠色水面**（luma 45–63），不是淺色塊——它不顯眼，所以優先序低於 69g 修掉的遠岸灰板。**不要**為了一個看不見的邊界去拉水面多邊形。**先量河面邊界的實際位置再補**（不要憑印象把水面往西拉几千公尺——那會蓋掉島與美國瀑布的岸）。

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

- **先記一件 69g 量到、但不屬於拆檔的事**：`world_quads_between` 每塊 quad 一個平面法線，遠岸因此有 ~20 px 的橫向明暗階梯（貼圖無關，三種設定 sd 都 5.1–5.5）。法線策略與 `flatShading` 屬於渲染層，改它要全站量過；記在這裡免得下一輪又從貼圖開始找。

- `js/site.js` 9,144 行 / 561 KB → `js/lane/*.js`（motion / reach / input / card / story / games）。
- `_gen_html.py` 6,821 行 / 483 KB → `tools/places/*.py` + 共用的 `tools/scene/*.py`。
- **驗收**：全閘門全綠 + `_pix.mjs` 逐像素相同。

### P4 — 距離剔除

- 照 `mrdoob/slop-newyork` 的 `scene-culling.js`（500 m proxy cell、CULL_MIN 300 / CULL_MAX 2000）。量到的瓶頸是**瀏覽器在畫 canvas**（frame gap 78–471 ms，lane JS 只有 38–60 ms）→ 少畫像素就是快。
- **驗收**：`tools/bench.mjs` 量到 frame 時間下降，且剔除邊界外的畫面內容不變。

### P5 — 真的測試套件 + 基準

- `tests/*.test.cjs`（node:test）：把「單元性質」的檢查從自製 harness 搬出來；瀏覽器型的留在 `.verify/`，**不重寫已有的 27 支閘門**。第 68 輪的三個碰撞成因（蠕行門檻、clamp 探測、push-out 邊界）是這套測試的第一批 case。
- `tools/bench.mjs`：一條命令量 frame 時間、draw call、prim 數——重構的迴歸尺。

### P6 — 場景還欠的（站主 2026-10-23 的清單；第 69k 輪重寫）

已結案（證據在本輪 §1）：
- **店面本體**：門、騎樓柱、門檻／遮簷的染色缺陷（`mix` 三參數），`verify-shapes` 248/248。
- **「街後的 canopy 貼太近」——原本的紀錄是錯的，已撤回**：那面樹牆在 **211–252 m**（`_map.mjs`：`canopy` 在 21,075–25,209 cm），不是 19.4 km；`_ray.mjs` 印的是公分。19 km 那條推論（「不到一個 texel」）不成立，因此也不需要「遠處粗圖層」。
- **樹線沒有結構**：坡面與樹冠同色 ⇒ 直線。改 7–9 m 齒狀樹冠＋三段綠（`CANOPY_CROWNS`），頂邊 sd 20.07 → 15.29、右段 35.59／38 階（同一個框）。
- **東京最後一站看不到門**、**五重塔進不了畫面**：69j 修完（站點退到 28 m＋仰角，塔在 −57° 有自己的影格）。
- **東京廣場地坪的「暗帶」＝訪客腳下影子**（不必修）：沿 x 剖面 32→21 平滑、關掉 `3D walker ground shadow` 整條一起移動。

還開著：
1. ~~**`hotelw` 旅館塔近看**~~ **已結案（第 69m 輪，第二趟）**：塔**一直都在視野裡，只是從來沒進過框**——`_map` 在 fun row（stop 6，yaw 90）量到 `hotelw` 在 **324–333 m**，而作者寫的 `pitch -2` 讓畫面頂邊剛好切在屋頂線上（`.preview/nia69mq/stop6-yaw90-p6` 與 p0 兩張都是）。**`pitch -2 → -8`** 之後，最近那棟塔在店面正上方站出 **110×220 px**（`_box`：mean 107.3、sd 37.2、134 色），七公尺外的店面一格沒動。影格 `.preview/nia69ms/stop6-yaw90-p-8`。
2. ~~SkyWheel 吊艙~~ **已結案（第 69l 輪）**：從 stop 2 yaw 26 / pitch −21.5 看得到整輪，`verify-wheel.cjs` 量到 14 個艙、閘門會紅也會綠。輪下的 stop 6/7/8 看不到輪是**構圖**（輪面在 x–y 平面、pitch 夾 ±24°），不是缺陷；不要為此轉動地標。
3. **其他頁面的地標盤**：~~Goat 的兩道瀑布~~ —— 第 69m 輪把兩道瀑布都做成世界幾何（Horseshoe 的崖線＋水幕＋弧線對面那一半；美國瀑布的崖線＋水幕），見 §1；Toronto 的 `falls` 模型（現在只有 `look` 的數值，沒有專屬量具）仍在。
4. **量具覆蓋**：`_lane.mjs` / `_tile.mjs` 只量 Niagara 的鋪面；量別的頁面前，先確認 `FLOOR_PERIOD` 對那個 floor style 的意義。
5. **Toronto 還平的三個**（`audit-all.mjs`，`STRICT=1` 會紅）：`boat-lake` **6.7**（24,455 px）、`tram-t` **18.0**（43,384 px）、`skyline-cn` **14.9**（172,630 px）。*驗收*：面積 ≥ 120×120 px 的物件 sd ≥ 20；小於這個面積的印「too small to judge」，不當成平。
6. **Niagara 的夜**：`HOUR=night` 沒有夜色授權 ⇒ 整頁深藍（mean 42.1）、只有兩顆燈光暈。要不要給 Clifton 一條夜色記錄，是站主的決定（見 §4）。
7. **Goat Island 三件沒收尾的**（第 69m 輪量的，見 §1）：①鋪面偏亮（143.7 vs 記錄值 121，共用繪法，要動先確認別的頁）；②林線那帶偏暗（`canopy` 斑塊）；③近水面仍偏平（加了 `foam` 水流線，要真的流得改 shader）。

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

- **夜空有兩種寫法，只有一種會被畫出來。** `backdrop.sky` 是遠平面（z=120000）上的**高度色帶**，`backdrop.skyAround.stops` 是**仰角表**（`{e, c, n}`）。`backdropSkyStops()` 只有在 `skyGradient` 或 `skyAround` 存在時才有東西，否則回空陣列 → `scene.background` 是 `FALLBACK_COLOR`、環境光也沒有。寫高度色帶時，**色帶的 y 要落在 120000 的尺度上**（y=1600 → 0.76°、y=8000 → 3.8°、y=42000 → 19.3°）；東京原本寫 −260/1600/7000，所以天頂到地平只看到一條。
- **`skyEnv`（新，第 69h 輪）**：`{"day":1,"night":0.22}`，乘在 `scene.environmentIntensity` 上，隨時辰內插。沒有這個欄位的頁面維持 1（既有頁面零變更）。夜空的 PMREM 在強度 1 下不是夜：量到 Nakamise 的朱紅柱子變成 (36,57,114)、地坪 (40,65,120)（原 (76,78,87)）。
- **釘死的時辰**：`"night": 0.92` → `data-lane-night`，`HELD` 蓋掉訪客偏好、頁面不出現 `data-walk-hour`。`DAYPAGE` 與它無關：有 `"night"` 的頁面也不會有白天。**東京從 69h 起是這一類**（`rooms.html`）；`rooms-cntower.html` 原本就是。
- **燈的參數語意**（`scaledEffectTint`）：hex tint → 不透明度＝燈的強度；`rgba(r,g,b,a)` tint → 不透明度＝`a × 強度`。`r` 是**光暈半徑（cm）**，不是照明範圍：hub street 的燈籠是 `r:30` 配 22 cm 燈體，寫 260 會在畫面上變成探照燈。要有燈體就用 `"body":"lantern"`（自帶吊線、光錐、地面光池），要一顆會發亮的點就用 `"bulb":true`。
- **自發光平面**：`q.nolite = true` 讓那塊 quad 不吃夜色 murk（`darkness = 0`）也不吃太陽——這是全站「亮著的窗」的既有慣用法（`js/site.js` 40 餘處）。燈籠的紙、亮窗、招牌背光都該用它；牆面不該用。

### 5.5 閘門現況（2026-10-25，第 69k 輪）

**量具（第 69k 輪）**：`.verify/_aim.mjs` 是到達與瞄準的唯一實作；`_map.mjs`（prim 地圖）、`_shot_at.mjs`（帶仰角取景）新增；`audit-all.mjs` 重寫（每件取最大視角，26/26 量到）並**標記為診斷**（`STRICT=1` 才是閘門，因為 `boat-lake`/`tram-t`/`skyline-cn` 還平，見 §3 P6-5）。

walk **201/201**、feel 12/12、story 27/27、body 73/73、games 23/23、nowebgl 35/35、shapes 248、rail 4/4、collision **28/28**（全 7 頁）＋ rooms 單頁 **20/20**、chain 0 failure、three PASS（12,866 world + 864 water、432 sheets、148 spray）、shader-lits PASS、impeccable `[]`、generator 冪等（md5 兩次相同）、`look` 四桌全部量到（id 對得上頁面、方位是絕對角度並回讀、量不到就 exit 1）。

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
