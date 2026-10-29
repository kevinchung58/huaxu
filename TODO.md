# TODO — 這個站台接下來要做什麼

> 這是這個 repo 的**單一真相來源**：下一輪（或下一個人）只看這一份。
> **規則：完成的項目直接刪掉，不留敘述。** 方法與永遠成立的約束留在第 2 節；量出來的事實留在第 5 節。
> 舊的 66 輪流水帳在 `TODO-archive.md`（git 追蹤、唯讀）；要找「那時候為什麼這樣做」再去查它。

## 1. 現在在哪裡（2026-10-29）

- **站台**：靜態學術網站（Hua-Xu Zhong）。零依賴、零 build step；所有 `*.html` 只由 `python3 _gen_html.py` 產生（第 78 輪起本體在 `gen/` 六個模組，入口 721 行）；runtime 只有 vendored 的 Three.js 0.186.1。
- **可走的頁面（8）**：`street.html`、`rooms.html`、`rooms-fukuoka.html`、`rooms-toronto.html`、`rooms-niagara.html`、`rooms-goat.html`、`rooms-journey.html`、`rooms-cntower.html`。
- **分支 / PR**：`arena/0cb70678-huaxu` → `master`（本輪開 PR；合併要站主一句授權）。
- **閘門 28 支**（第 79 輪加 `verify-box`，5 頁 75 個量測）。

- **第 79 輪（本輪）—— 「框在牆上還是在模型上」不再用顏色猜：把 prop 塗成洋紅、量它的畫素、再按它**
  - 起因：站主說「用 skills 並且遵循 AGENTS.md 做該做的事情」。照 `skills/karpathy-guidelines` 與 `pua` 先讀現況，`TODO.md` 第 3 節的 **P6-8** 自己就是一個矛盾：它說 `skyline-cn` 的框在 yaw 0 是 582–894、而「四棟塔畫在 130–420，框在空牆上」，同一份 TODO 的第 1 節卻寫「翻面之後同一個框**正好框住**四棟塔」。**兩個結論引用的框是同一個**，差別只在「哪些畫素算那個 prop」——兩次都是**顏色啟發式**（「最暖的連通塊」／「裁框自己的平均值」）。這就是 `skills/frame-evidence` §9 那條還沒被執行到的規矩。
  - **新閘門 `.verify/verify-box.mjs`（第 28 支，2 頁 33 個 prop，約 60 秒）**：把**單一 prop** 的 quad 在**記憶體裡**改成平塗洋紅 `#ff00ff`（`_plume.mjs`／`_wedge2.cjs` 的同一招，anchor `m.shown = false;` **assert 只命中一次**），讀洋紅畫素的 bbox，再從同一個停住的影格的 DOM 讀框，然後用 `document.elementFromPoint` **按那團畫素的正中央**。判準三個、而且都不是「中心對齊」：
    - **cover**：prop 自己的畫素要落在它的框裡（≥ 97%，3 px 給抗鋸齒邊）。鏡射的簽名是 0%；框故意移 40 px 是 **3.9%**。
    - **press**：按在畫素中央要打到自己，或打到**更近的**那個（`z-index = 1200 − depth/4`，「兩個框重疊時近的贏」）。`data-quiet` 的景物**不按**——CSS 給它 `pointer-events: none`，手指本來就穿過去（第 65 輪）。
    - **fill 只印不判**：`skyline-cn` 的框比它被看見的畫素多 61 px（桌子的下緣遮住模型下半），而站在畫面邊緣的 prop（`plinth-market`：框 1251 px、可見 200 px）先天 fill 很低。**中心偏移也不是判準**（`skyline-cn` +30 px 是正確的框）。
  - **量到的（本輪）**：`rooms-toronto.html` stop 4 yaw 0 **rect 581,192 312x552 ↔ paint 581,191..892,683、cover 100%**；yaw 30 **rect 164,172 305x566 ↔ paint 163,172..468,683、cover 100%**；`rooms-fukuoka.html` stop 2 yaw 0/45 每個看得見的 prop 全部 cover 100%。**合計 33/33、按壓 5/5**。**P6-8 撤回：框從來沒有離開它的模型**，第 70 輪的「四棟塔畫在 130–420」是那個顏色啟發式在另一張影格上得到的東西。
  - **閘門自己先錯了兩次，兩次都是量具**：①`tree-c3`（會擺動的樹冠）被報 cover 89%，因為框和影格相差 600 ms、樹冠在這段時間內移了 8 px——`js/site.js` 的 `ease` 只在 boot 讀一次 `prefers-reduced-motion`，所以 `_aim.openPage({ reduce: true })` 必須在**導覽之前**設定（事後 emulate 沒有效果）。②`hall-sl` 被報 cover 72.8%，是輪廓最外圈的 2 px 抗鋸齒，改成 3 px 邊界後 100%。**兩次都先以為是場景，量具自己承認。**
  - **反測**：`SHIFT=40`（把讀到的框右移 40 px）→ `skyline-cn` cover **83.2%**、`tree-c2` **3.9%**、**exit 1**。會紅，也會綠。
  - **這支閘門第一次跑就抓到兩個真的按壓缺陷（都已列進第 3 節，附重現指令）**：
    - **港區街道的 `stall-menya`**（有 `game` 的拉麵攤）是 `board`＝一片 170×128 的**平面卡**，`ry 90` 讓它**沿著牆**站立：從街道中央看是 **19 m 外 12 px 寬的側邊**，而它自己的面在 street stop 0 與 stop 1 都**一個洋紅畫素都沒有**（被身後的 `front-n` 店面蓋掉），**按壓框卻坐在那間店面上**。`stall-kingyo` 同型（框 47×117、畫素 575）。
    - **`rooms-niagara.html` stop 3 yaw −109**：`falls-horseshoe` 的地標盤投影在 **x 1128**（影格只有 1024 寬）——那一站存在的目的就是看馬蹄瀑布，而**看得到、按不到**（要轉頭 42° 才找得到它）。
  - **`.verify/_aim.mjs` 多一個 `reduce` 參數**（預設 false，不影響既有 27 支閘門）：任何「一個影格裡同時讀幾何與讀畫素」的量具都該用它。
  - **量到的（第 79 輪，`verify-box` 之外全部在改動後重跑）**：box **33/33（5/5 按壓）**、walk **212/212**、ux **69/69**、overlay **95/95**、exit **82/82**、body **73/73**、story **27/27**、games **23/23**、shapes **248**、csslive **546 條（DEAD 0）**、skills **95/95**、gen **6/6**、mirror **PASS（框 73%、鏡像 1%）**、island **47/47（每站 0 % empty）**、rail **4/4**、nowebgl **35/35**、rooms-e2e **0 failures**、objects／motion／wheel（**18 艙**）／hotel／three（**14,924 world ＋ 1,048 water**）**PASS**、tables／look 全量到、feel **12/12**（第一次 11/12＝`0.2°`，是緊接在 `verify-rooms-e2e` 後面跑的；單獨跑 **3.0°** 過——這條「要獨佔機器」的既有註記現在有第二個數字）。**沒跑**：`verify-collision`（本輪沒動任何移動／碰撞碼；約 50 分鐘）。
  - **skill 同輪更新**：`skills/frame-evidence` §9 改寫
  - **同一輪續作（站主說「繼續都弄好」）：把兩個 P0 修掉，`verify-box` 擴到 5 頁**。① 兩個攤位照屋台尺寸 **170×128 → 300×250**、`.walk-stall` 重畫（百分比尺寸）、燈籠 252 → 300；② `js/site.js` 的地標盤**夾進畫面**（背後的地標仍隱藏），niagara **1128 → 924**、goat **(1161,775) → 924,668**，`elementFromPoint` 兩邊都**打到自己**；③ `verify-box` 加 **CSS 身體分支**（量未塗色基準影格上的亮度差＋按壓）與**每個 heading 一張基準影格**，預設頁 **2 → 5 頁、33 → 75 個量測、15 個按壓全過**。反測 `SHIFT=40` 仍 **exit 1**。
  - **量具又錯了兩次，兩次都是量具**：① 第一次把 CSS 身體的攤位報成 `pressable box, nothing painted`——那是**tint 對 CSS 沒有畫面可塗**，不是缺陷（缺陷是真的，但不是那句話說的）；② 清 tint 之後拍到的影格仍有洋紅殘影（`front-s` 上 2 px 一條），因為 `__walk.drawQuads` 在畫布換幀前就乾淨了。**修法不是等更久，是每個 heading 先拍一張「還沒塗任何東西」的基準影格**，要「場景原樣」的分支全部讀那一張。→ 寫進 `skills/frame-evidence` §9b。
  - **5 頁 75/75 的量到的**：street stop 0 **20/20**（含 2 個 CSS 攤位、2 個按壓）、fukuoka stop 2 **重跑**、toronto stop 4、niagara stop 3、goat stop 2；每個 heading 都留一張 `-base.png` 給人看。
（同一份 TODO 裡的兩個矛盾數字、洋紅方法、同一影格規則、兩個新缺陷、邊緣 prop 的 fill），`skills/README.md` 那一列與 `SKILLS.md` 的路由句同步；`verify-skills` **95/95**。

- **第 78 輪（上一輪）—— 站主問 React，答案是「問題在兩個檔案，不在沒有框架」；產生器拆完，腳本不拆（並說清楚為什麼）**：
  - 站主：「你這邊是不是這東西用 react 做對你來說比較好處理。但礙於我們用 GitHub page 目前就只能這樣？」→「該做你都去做」。**GitHub Pages 不是限制**：它只是靜態檔案伺服器，React 打好包一樣能放。真正的限制是這個 repo 自己定的（零 build step、零 committed 依賴、只 vendored Three.js 0.186.1）。而且站主感覺到的痛是真的、只是名稱不對——痛的是**兩個檔**：`_gen_html.py` 7,484 行、`js/site.js` 9,479 行。3D 巷道（每一幀都是命令式程式）換 React 一點好處都沒有；產生器與介面外殼有，但那是檔案大小的問題，不是框架的問題。**所以：保持靜態，拆檔案。**
  - **產生器拆完了，而且是一個「純搬移」**：`_gen_html.py` **7,484 行 → 入口 721 行 ＋ `gen/` 六個模組**（`site.py` 354（頁殼、導覽、圖示、`page()`／`shell_page()`）、`content.py` 491（論文、計畫、pillars、課程、報告逐條）、`media.py` 365（圖片登錄表與相簿牆）、`world.py` 2,080（尼加拉、山羊島、多倫多、隧道）、`districts.py` 2,657（區塊紀錄）、`render.py` 855（巷道標記、抽屜、影格盤））。**證明不是靠 review，是靠 md5：拆前 19 頁的 md5 存成 `/tmp/base_html.md5`，拆後 `md5sum -c` 全過，再跑一次也一樣（冪等）。**
  - **拆法是「名稱歸屬」，不是行號**：行號一改就動，名字不會。每個頂層敘述歸給「定義它的名字」所屬的模組；沒人認領的留在入口、順序不動。四個坑全部踩過並寫進 skill：**tuple 目標**（`A, B, C = f()` 沒有 `ast.Name` 目標 → 誰都不認領 → 掉進入口 → 所有 import A 的模組在 import 時就死）、**註解開頭要自己一個換行**（黏上去會變成下一行縮排裡的註解 → `IndentationError`）、**`__file__` 路徑**（檔案下沉一層，`ROOT` 與所有路徑靜默指進套件裡 → `gen/css/site.css` 找不到）、**搬過去的多餘 import**。
  - **拆分會讓閘門瞎掉，這是每次都會忘的部分**：三支閘門把產生器當**文字**讀（`verify-csslive`、`verify-walk`、`bin/verify-three`），而產生器自己有一支「重複 key 掃描」只 parse `_gen_html.py` 一個檔。它們**不會紅**，只會安靜地只看見 10 % 的程式。→ 新增 `bin/gen-source.mjs`（入口＋`gen/*.py` 串成一份，排序固定）給三支閘門用；重複 key 掃描改成掃全部（`_gen_files()`），**反測：在 `gen/content.py` 塞一個重複的 `"id"`，建置在 `line 53: 'id'` 停下**。
  - **新閘門 `verify-gen`（5 條，秒級）**：①每個 `gen/*.py` 都從入口的 import 圖走得到（沒有孤兒模組）②沒有任何頂層名字被兩個檔案定義（後者靜默勝出，和重複 dict key 同一類）③跨模組 import 的名字在對方頂層真的存在 ④`genSource()` 覆蓋全部檔案、且看得到只有模組才有的字串（`def walk_html`、`DISTRICTS = `、`def gallery_html`、`def page(`）⑤產生器冪等（連跑兩次 19 頁 md5 相同）。**反測**：塞一個同名 `css_sig` 進兩個模組會紅、塞一個沒人 import 的 `gen/_orphan.py` 會紅。→ **26 → 27 支閘門**。
  - **`js/site.js` 沒有拆，而且不該用「拆檔」的名義拆**：它是四個頂層單元——頁面 chrome 145 行、共用 overlay 管線 ~115 行、點點遊戲 207 行、**巷道 8,989 行（288 個宣告共用同一個 closure）**。把 closure 照檔切開不是搬移，是**把 288 個共用名字改成介面**（重寫，風險不同）；而且本站最快的閘門 `verify-walk`（212 條）是把那一支腳本 `w.eval` 進 jsdom 跑的，**ES module 做不到**，所以拆它同時要付「介面」與「閘門改成真瀏覽器」兩筆錢。留給專門的一輪，規格寫在 P3。**不做美工拆法**（把 500 行搬去 `helpers.js`、留下 9,000 行檔案），那兩筆錢一筆都沒付。
  - **新 skill `pure-move-split`（第 19 個）**：純搬移怎麼做、怎麼證明、拆完哪些閘門會瞎、哪個檔案不能拆。附上可重複使用的 `scripts/split_by_ownership.py`（AST＋symtable，名稱歸屬、tuple 目標、註解換行、import 修剪都在裡面）與本 repo 的 `scripts/spec-gen.py`；**用工具重建一次 `gen/` 與 `_gen_html.py`，`diff` 逐檔相同**——工具不是文件，是這一輪真的用過的那一支。`verify-skills` **95/95（19 個 skill）**。
  - **量到的（第 78 輪，拆後重跑）**：19 頁 md5 與拆前逐一相同、冪等；walk **212/212**、ux **69/69**、overlay **95/95**、exit **82/82**、body **73/73**、story **27/27**、feel **12/12**、nowebgl **35/35**、rail **4/4**、games **23/23**、shapes **248**、geometry／clash／tables／objects／motion／chain 全綠、csslive **546 條：400／123／5／0 DEAD**、skills **95/95**、rooms-e2e **72/72（0 failures）**、mirror PASS、look 5/5、island **47/47**、hotel PASS、wheel PASS、`verify-three`（14,924 world ＋ 1,048 water triangles）、`shader-lits` 6 個 program 完整、`verify-gen` **5/5**。
  - **拆分之後才發現的第二個受害者：`bin/toronto_massing.py` 已經壞了，而且沒有東西會告訴你。** 它的 `--generator` 預設釘在 `_gen_html.py`，用 `ast` 去那裡讀 `TOR_O`／`TOR_GRID`／`TOR_TOWERS`；拆分把這三個常數搬進 `gen/world.py` 之後，它會拋 `Missing Toronto constants`。**沒有任何閘門抓到**，因為那支工具要先 `pip install` 三個套件、再下載一份 archive 才跑得起來——一支跑不起來的工具等於不存在。修法：新增 `bin/gen_literals.py`（只用標準庫，搜尋全部產生器檔案、找不到就說「我找過哪些檔」），`toronto_massing.py` 改成用它、預設改成搜尋；`verify-gen` 多一條（**6/6**）真的去執行它，並斷言 `--generator` 沒有再被釘回路徑。**反測**：把 `TOR_O` 改名 → 紅（「searched world.」）；把預設路徑釘回去 → 紅。
  - **`verify-collision` 補跑了**（第 77、78 輪都跳過的那支，約 50 分鐘；不是因為它會紅，是因為它已經兩輪沒人看過）：**7 頁 28/28、exit 0**。順帶量到一件清單上寫過但沒有數字的事：撞擊閘門在背景跑的時候 `verify-feel` 讀到 **11/12**，把它停掉單獨跑就是 **12/12**——「這兩支要獨佔機器」現在有量到的代價了。**Terrapin Point 的預設視角**仍然沒動——這一輪量了 pitch 4／14／22 三張影格（`.preview/r79/goat3-*.png`）並寫下為什麼**不改**：影格裡正中央那道灰色的東西是站位前 531 cm 的石護牆（射線命中 `surveyed world: stonewall`，高 40 cm），而真正的水幕在 75 m 外的對岸；把 pitch 往下壓會讓護牆佔滿中景、往上抬會讓天空吃到 24 %。**這是這一站「站在馬蹄瀑布崖邊」的真實構圖**（貨真價實的無遮蔽缺口不存在——真實的 Terrapin Point 也是隔著矮牆看水從腳下消失），改它等於改這一站的立意，所以留給站主一句話。同一輪的射線統計與畫面**對不起來**（護牆下的舖面沒有被算進任何一類），依 `frame-evidence` 的規矩，**不引用那個百分比**。
- **第 77 輪 —— 「不是提到就不是垃圾」：把「有人在提它」和「有人在用它」分開，只留真的會被用的**：
  - 站主：「那個喔！不是提到就不是垃圾。你不能這樣保守，你必須垃圾真的就刪掉。該維持的都弄好。繼續」第 76 輪用「它有被寫在註解裡／有被閘門讀」當作留下的理由，這一輪把那個理由本身當成要刪的東西。
  - **新的量具 `verify-csslive.mjs`（是閘門，不是探針）**：把 `css/site.css` 的每一條選擇器連行號解析出來（615 條），用 jsdom 問 19 個頁面有沒有東西匹配，再把沒匹配的分成 **LIVE／RUNTIME（腳本會加）／DORMANT（產生器寫得出來，只是今天沒有那種資料）／DEAD**。`_gen_html.py` 的**註解與 docstring 先剝掉**才去比對——上一輪的兩個誤判就是從那裡來的（一句「.plate-navy 是 fallback」＋一個檔名 `grid-2-grouping.jpg`）。結果：**36 條對不到 → 12 條 → DEAD 0**。反測：故意塞一條 `.zzz-dead-test{…}` 進去，它會紅。
  - **相簿閱覽器整個刪掉（CSS 259 行、JS 189 行、產生器 ~55 行）**。它是為一卷「有日期的課堂照片」寫的，而**一面牆從寫好到現在沒有掛過一張照片**（一張 plate 需要 caption 加日期，兩者都沒有人給），所以 `#ig-plate`、`.ig-reel`、`.ig-frame`、`.ig-btn`、`.ig-count`、`.ig-cell`、`data-ig*` **一次都沒有出現在任何一頁**。留著它的代價是：`verify-walk` 有四條斷言在檢查它的**形狀**（讀樣式表，不是讀頁面），五輪都綠，於是它看起來「有測試」。現在牆只剩 **5 條規則**：`figure.ig-tile` ＋ 圖 ＋ 自己的說明行（`alt` 同樣的字），有照片就掛，沒有就說「Nothing in this block yet」。`verify-walk` 212/212。
  - **進度條（`walk-strip`）是第 72 輪的自己打自己。** 第 72 輪的 commit message 寫「站點列的 `is-here`、街區抽屜的卡、**進度條的點**已經各自說同一件事」，同一支 commit 卻把進度條的四條 CSS 一起砍了——所以五輪以來頁面上是三個看不見的 span，而第 76 輪還寫了一句註解保證它「在刻度上標出分界並寫出名字」。標記、刻度、15 行 JS、兩張 `zones` 表、每頁一行 HTML 註解，全部刪。**要恢復它是一個設計決定，不是修 bug**：它會讓控制列多出 120–260 px。
  - **七條對不到任何頁面的規則**：`.hero-note a`（hero note 是一句話，沒有連結）、`.section .btn-ghost`×3（`btn-ghost` 只在 hero 和點點遊戲裡）、`.section.alt .icon-chip`、`.grid-2`（整站沒有兩欄格線）、`.about-copy h3`、`.meta-links a`（那裡只有 button）、`.place-card-media.dashed.empty`。最後一條連同產生器的分支一起刪：**封面是卡片的臉，缺了是建置錯誤，不是一個要設計的狀態**——`IMG/{id}-cover.jpg` 不存在時產生器直接停。同理，`PRINCIPLE_READS`／`PRACTICE_ROWS` 的 `.plate` fallback 分支也刪，插圖改成必要欄位。
  - **七個什麼都不做的 class**：`block-head`、`doi-line`、`principles`、`q-list`、`text-link` 這五個底下早就有一條真的規則（`reveal`／`p`／`grid-3`／`stance-list`／`.meta-links button`）在做事，刪字；`walk-aside`、`walk-jump` 看起來活著是因為腳本會問它們——**腳本問的是 `data-walk-aside`／`data-walk-jump`，不是 class**。另外 `data-room="…"` 每張 story frame 都寫、沒有任何程式讀（`data-room-title/where/hint/close` 才是活的），刪。
  - **CSS 裡第 72 輪留下的孤兒 `}`**（刪規則時留下的收尾括號）與兩段已經在講「這個東西不在了」的註解，一起清掉。
  - **`verify-walk` 的四條「相簿閱覽器」斷言換成四條關於牆的**（牆不可開、tile 是 figure＋caption、格線固定比例、空區塊用文字說明而不是空格子）；`.verify/_albumprobe.mjs` 隨閱覽器刪（83 → 82 支）；`_csscheck` 的兩條 ig 斷言改指向還在的規則。
  - **一個被自己的刪除照出來的量具 bug**：`verify-rooms-e2e` 的 `walkUntilBlocked` 看的是 `depth + x`，而貼著牆的斜走會讓和持續變化，於是它跑滿 900 幀、把「沿隧道滑了多遠」當成「橫越得直不直」。刪掉進度條的兩次 style 寫入讓頁面變快之後，漂移從 358 變成 **470 cm**（門檻 400）——紅的不是物理，是量具。改成指定被推的那一軸（`axis="x"`），量到 **42.6 cm**，rooms-e2e 回到 **72/72、0 failures**。
  - **量到的（第 77 輪）**：walk **212/212**、ux **69/69**、overlay **95/95**、exit **82/82**、games **23/23**、body **73/73**、story **27/27**、feel **12/12**、nowebgl **35/35**、skills **90/90**、rooms-e2e **72/72（0 failures）**、csslive **546 條：400／123／5／0 DEAD**、chain 全綠、shapes **248**、geometry／clash／tables／objects／motion 全綠、mirror PASS（**72 % vs 1 %**）、island **47/47（每站 0 % empty）**、look **5/5**、wheel PASS（best of 14/11/**15**）、hotel PASS、rail **4/4**、`verify-three`（14,924 world ＋ 1,048 water triangles）。產生器冪等（19 頁 md5 相同）。
  - **這一輪沒跑的**：`verify-collision`（約 50 分鐘；本輪沒有動任何移動／碰撞碼，rooms-e2e 的碰撞段有跑）、`_stops`／`_lumacheck`／`_reach`（沒有動到滑行與亮度）。**Terrapin Point 的預設視角**（第 76 輪留下的、要站主決定的那一條）仍然沒動。
- **第 76 輪 —— 掃一遍「什麼都不做」的東西，刪掉，並證明刪掉的眼睛看不出來**：
  - 站主：「繼續都弄好 建議順便處理 不該有的垃圾都刪掉。」第 73 輪的口號是「只留有意義的物件」，這一輪問的是同一句話的下一層：**repo 裡有哪些東西存在、看起來可以調，但其實沒有任何程式讀它。**
  - **最貴的垃圾不是死程式碼，是死旋鈕。** 產生器把 `data-lane-day-start` 寫進頁面，`js/site.js` 把它解析成 `DAY_AT`，而 `DAY_AT` 進到一個**沒有人讀的常數**——所以 `_walkshot`／`_lumacheck` 每次「把 start 改成 0.9 拍黃昏」，拍到的都是**正午**。同一個探針接上之後量到：street「夜」**luma 141 → 80**（`rooms` 沒有 day flag，46.9，作為對照沒有變）。`data-lane-day-cycle="900"` 是同一族的東西（一個網站已經沒有的頁面時鐘），連同 `DAYLEN`／`DAY_LEN`／`tileCm` 一起刪。修法是把 start 接上：`hourChosen`（localStorage 有任何小時值）為真時不動，否則 `hourPhaseSet = clamp(DAY_AT, 0, 1)`——**站主選過的時間永遠贏過頁面的預設**。
  - **十支閘門從來不在清單上。** `TODO.md` §2.3 的「一次跑完」少了 `verify-ux`、`verify-overlay`、`verify-exit`、`verify-island`、`verify-mirror`、`verify-motion`、`verify-rooms-e2e`、`verify-skills`、`verify-wheel`、`verify-hotel`——`verify-island`（沒有一站站在空無一物前面）第 69m 輪抓過真缺陷，之後只被手動跑過一次。**沒在清單上的閘門不會紅，因為沒有人跑它。** 清單整個重寫：25 支分成「不開瀏覽器」與「真瀏覽器、順序跑」兩段，每支後面寫它現在的數字。
  - **`verify-island` 補跑：43 站全部看得到東西，每一站 empty 0 %**（門檻 60 %）。它回報 rooms.html 第 3 站「停在目標前 152 cm」——查下去是**量具**的問題不是產品：`_aim.mjs` 的抵達判準是「6 秒沒動」，而被搶幀的滑行會在原地停超過 6 秒。`_stops` 同一顆按鈕量到 **0 cm**。修法：`_aim.arrive()` 改問車道自己的答案（`__walk.glide` 是不是 null），「靜止」不再是抵達的證據。`_stops` 全八頁重跑 **57/57 站、誤差 0–1 cm**。
  - **十個 `.verify/` 檔沒有任何東西引用**：`_barshot`、`_dbg2`、`_dbg3`、`_dbg_goat`、`_mirror-cmp`、`_overlay-audit`、`_proj`、`_r74shot`、`_stopprobe2`、`_turnprobe-jsdom`——單輪的臨時探針，刪（git 歷史留著）。**`verify-island` 是同一種「零引用」但不該刪**：它是能紅的閘門，所以進清單。
  - **產生器裡的死名字**：`NIA_TRAIL`（九個 OSM 節點，`NIA_RIM_N` 是用公尺偏移另外寫的，不是從它算的）、`_ring_m()`、`PRESS_VERBS`（動詞次序寫在 `press_verb()` 裡，這個 tuple 只是它的影子）。三個都刪，產生器輸出**除了快取雜湊以外一個位元組都沒變**。
  - **第 72 輪留下的半個承諾**：`data-lane-zones` 當時以「也許有人要讀巷道的分界」為理由留著，四輪下來沒有人讀。刪掉；分界本來就畫在站點列的刻度上，區域名稱在刻度的 `title` 裡——訪客拿得到的東西沒有少。
  - **掃過而乾淨的四項**（寫下來，下一輪不用再掃）：66 張圖全部有引用；256 個 CSS class 選擇器、28 個自訂屬性、95 個出貨的 `data-*`，除上面兩個以外全部有讀者（`data-axle`、`data-dia`、`data-phase0`、`data-view-h` 這些是 `dataset[\`view${key}\`]`、`m.axle` 這種**間接**讀法，靜態 grep 會把它們誤判成死——每一條都回程式碼確認過）。
  - **文件指到不存在的檔案**：`AGENTS.md` 的 `.verify/_rail.mjs`（現在叫 `verify-rail.mjs`）、`scene-system` 的 `.preview/shot1dbg.mjs`（`.preview/` 是 ignore 的輸出目錄，那個檔案不存在）→ 改成「用 `_walkshot` 拍平塗 A/B、`_pix` 比對」。其餘「第 54 輪退休」的句子是**歷史，保留**（它們明說那個工具已經不在）。
  - **新 skill `dead-ballast`（第 18 個）**：五種垃圾的找法、三種判決（刪／接上／寫進清單）、以及「證明移除是隱形的」那一步。`frame-evidence` 加了 §6d「頁面交出來的值不等於程式套用的值」——那一節的證據就是本輪的黃昏變正午。`verify-skills` **90/90**。
  - **量具自己也會說謊——這一輪抓到三支，全部是同一類：它們在量一個「時刻」，而不是一個事實**：
    - **`_aim.arrive()`** 用「6 秒沒動」判斷抵達。被搶幀的滑行會停超過 6 秒，所以 `verify-island` 把 rooms.html 第 3 站報成「停在目標前 152 cm」；`_stops` 同一顆按鈕量到 **0 cm**。改成問車道自己的 `__walk.glide`，island 從 **43 站（1 站被跳過）** 變成 **47 站全過**。
    - **`verify-look` 的兩張表是第 70 輪翻轉相機之前的量測**：`market` 表寫 yaw −12，而 −12 在今天是把市場模型轉到畫面外（`.preview` 的影格裡它落在 x 1040），所以它每次都回報「nothing on screen」。**第 71–75 輪沒有一輪重跑過這支**，所以它從翻轉那天起就一直是紅的，只是沒有人看見。重掃 −180…180 共 36 個方位後重寫：lake −20（127,485 px²）、falls +50（85,404）、market **+36**（122,679；−12 是 0）、city −30（637,264，9 件裡 5 件在畫面上；−9 只有 2 件）。
    - **同一支的另一個「時刻」問題**：它在按完停止點之後 `sleep(2600)`。滑行走的是「模擬時間」，一頁一幀 200 ms 時 1.4 秒的滑行是五秒的牆上時間——`goat` 在 z 5542 就被量了（還有 6.8 公尺沒走完），四個物件當然都框外。改成等 `__walk.glide` 收工。**結果 5/5 全部量到**（goat 用「看著影格選的矩形」量：瀑布的 `[data-obj]` 是 44 px 的按壓目標、不是水幕本身，92×92 的框框量不動 1024 px 寬的瀑布）。
    - **`verify-wheel` 在一顆會轉的輪子上取單一影格**：那顆輪子 40 秒轉一圈，所以「當下看得到幾顆車廂」是時間的函數。同一顆輪子、同一個方位，連拍三張（間隔 7 秒）量到 **16／14／13**，而單張量到 **9**——門檻是 10，於是它紅在一個沒問題的場景上。改成三張取最大，門檻不動（**不是**把 10 改成 8）。
  - **找到但這一輪不動的（要站主一句話）**：**Terrapin Point（rooms-goat 第 3 站）的預設視角是往下看**。站點自己寫 `pitch 14`（本專案 pitch 正值＝往下），`_ray` 量到畫面中央 (480,430) 第一個命中的是 **528 cm 外、92 cm 高的石牆**，所以整張影格的中央三分之一是護牆，瀑布只剩頂端一條（`.preview/r76/goat-stop3.png`）。修法是把這一站的 pitch 從 14 改成大約 0～2（看向馬蹄的 Crest），但那是**看畫面的判斷**，依規矩留給站主。
  - **量到的（第 76 輪）**：walk **211/211**、ux **69/69**、overlay **95/95**、exit **82/82**、games **23/23**、body **73/73**、story **27/27**、feel **12/12**、nowebgl **35/35**、skills **90/90**、rooms-e2e **72/72（0 failures）**、shapes **248**、geometry／clash／chain／tables／objects／shader-lits 全綠、**collision 28/28（7 頁，exit 0）**、**island 47/47（每一站 0 % empty）**、**look 5/5**、**wheel PASS（16 車廂）**、hotel PASS、mirror PASS（73 % vs 1 %）、rail **4/4**、`verify-three`（14,924 world ＋ 1,048 water triangles）、`_stops` **57/57（0–1 cm）**、`_lumacheck` 141（正午）／80（0.98）／**79（start=0）**／46.9（無 day flag）。產生器冪等（第二次與第三次 md5 相同）。
- **第 75 輪（上一輪）—— 「其他東西」檢查完了：表面、書籤、門、量具，四種都沒有在做事**：
  - 站主：「你檢查其他的 該弄掉就動掉 請全部弄好。」第 74 輪定的是「哪個物件可以開表面」，這一輪問下一層：**表面開了之後，它裡面有沒有東西**。四個缺陷全部是既有的閘門看不到的，因為每一條閘門問的都是「有沒有東西打開」。
  - **① 佔滿螢幕只為了給你看五分之一的圖。** 在 `rooms-toronto.html` 按一張印刷，故事盤蓋住 **100 % 的視窗**，圖只有 **364×199 px**（新量具 `.verify/_surface.mjs`：cover 100 %、**fill 9 %**）。成因是盤面的欄寬照抄了手機的 9:16 故事畫布，而這份紀錄裡的圖幾乎全是橫的：`object-fit: contain` 就照那個寬度縮，剩下的都是它自己的模糊。**修法不是把表面縮小，是讓圖的框就是圖**：`paint()` 用檔案自己的 `naturalWidth/Height` 蓋 `--ar`，`sizeReel()` 用格子剩下的高度蓋 `--reel-w`；量到的修後是 **992×541、fill 68 %**，直幅的印刷則是 **479×642**（原本 406 px 的圖放在 992 px 的模糊裡）。**文字另外有自己的 measure**（`--measure: 30rem`，69–72 字），因為 992 px 的一行標題是 132 字。
  - **② 書籤沒有把你帶到它寫的地方。** 按 Goat Island 的「Terrapin Point」開始一段 **94 秒**的滑行（15599 cm ÷ 165 cm/s），而機器一忙滑行還會被取消：新量具 `.verify/_stops.mjs` 量到 Goat 前三站 30 秒後還在走、停在**目標前 26–40 公尺**。修法：速度跟著距離走（`GLIDE_T 1.4 s`、上限 `7000 cm/s`），而且**硬滑行**（站點、印刷自己的靠近）在解算器繞不過去時**直接完成**而不是放棄。修後 **10/10 站誤差 0 cm**。
  - **③ 門在你抵達的那一站按不到。** 每個房間的出口都掛在走道近端外 133 cm，而房間的第一站不在那條線上（Goat 116、門司港 174、CN Tower 58）——所以**遊客一進門站的那一站，轉身按 E 是沒有反應的**，八頁裡有三頁如此。`EXIT_REACH = 350`。修後八頁全部答得出「The door at your back」。
  - **④ 因為一個旗標而可按、卻只會搶走別的按壓。** Goat Island 三片對岸的看板被寫成 `landmark`，於是拿到 600 m 的 landmark 伸手距離，其中一片還會**壓過馬蹄瀑布**、用「對岸的樹」回答一次對著瀑布的按壓。它們現在是佈景（三片都拿掉 `landmark`），說明留在文字廊。`_reach.mjs`（走過去按每一個可按的東西，8 頁）是抓到的量具：**修前 36/43、修後 40/40**。
  - **順手改掉的、量到的**：故事盤的提示只講手勢（「Tap the right two thirds…」）而它從第一版就吃 `→`／`←` → 改成兩種都講；只有一格的的故事會叫人點「下一格」→ `frames.length < 2` 時把分段、計數與提示藏起來；`--paper` 之外的**四個從來沒有人讀的屬性**（`data-glance`、`data-walk-guide`、`data-walk-hits`、`data-walk-id`）從產生器移除；資訊卡（「How to be in the lane」）在沒有店面的頁面上講店面 → 改成每一頁都成立的話；`__walk.glide` 開放給量具（不要用「停了」判斷抵達，那是第 72 輪就學過的教訓）。
  - **新量具（這一輪三個）**：`.verify/_surface.mjs`（每個表面 cover／content／fill／字的 measure）、`.verify/_stops.mjs`（每一站抵達誤差）、`.verify/_reach.mjs`（走過去可不可以按到）、`.verify/_deadui.mjs`（每一個控制元件按下去有沒有變化，並寫明它看不見的三種情況）。
  - **量到的（第 75 輪）**：verify-ux **69/69**（可按 40／248，`read` 3）、walk **211/211**、overlay 95/95、exit 82/82、rail 4/4、games 23/23、body 73/73、story 27/27、feel 12/12、nowebgl 35/35、skills 85/85、rooms-e2e 72/72（0 failures）、shapes 248、`_census` 全綠、`_stops` **10/10**、`_reach` **40/40**、`_deadui` 0 個真的死控制、`audit-all` 26/26 量到（平的 2：`hall-sl`、`skyline-cn`，與前兩輪同一組）。
- - **第 74 輪 —— 一次按壓要用「看得見的變化」回答；文字只留給真的只能用文字介紹的物件**：
  - 站主：「只留該需要用文字彈出介面介紹的物件。其他就像你說的可以用 E 去互動看有沒有變化。你如果全部都做出彈出介面，這很傷使用者體驗。」第 73 輪把卡片整組刪掉是對的方向，但**把說明也一起刪掉了**——地標（馬蹄瀑布這種三百七十公尺外、按了什麼都不會動的東西）因此變成按了沒反應。這一輪把「回答」分成兩層，並把判斷寫進產生器。
  - **動詞表在產生器裡，一個函式**：`press_verb(o)` 依序給 `leave`（門）→ `photos`（`frame is not None`）→ `ride` → `play`（`game`）→ `try`（`"demo" in o`）→ `use`（`states` 且是 `door`／`glassfloor`）→ `read`（**只有 `landmark`**）。先後次序就是規則：**有東西可看的東西，永遠不會要求被閱讀**。動詞以 `data-verb` 出貨到每一個可按的 prop；`js/site.js` 的 `VERB_WORD` 是它的另一半（`leave` "Walk through"、`photos` "Photographs"、`ride` "Ride"、`play` "Play"、`try` "Try"、`use` "Use"、`read` "Read"），橫桿與伸手提示都從這一張表講話。
  - **橫桿在按之前就說明它會做什麼**：`data-verb` 換掉了第 73 輪的固定前綴 `Open · `，於是 `Read · The Horseshoe`、`Walk through · Kaminarimon`、`Photographs · …` 是三種不同的承諾，訪客在花掉那一按之前就知道會得到什麼；伸手提示同樣是動詞開頭（"Press E to see the photographs."）。
  - **文字表面只剩一個，而且只有 `read` 進得去**：`revealThing()`（第 73 輪把地標捲到文字廊的那一列、閃 2400 ms）整個刪掉，連 CSS 的 `li.is-called` 與 keyframes 一起；改成 `showWords(m)`——`card.dataset.mode = "words"`、寬 30rem、標題與提示就是物件自己的 `data-title`／`data-hint`。它只從 `act()` 的 landmark 分支呼叫，**其餘七個動詞一律不開任何文字表面**。地標的提示長度因此有上限（100–290 字），792 字的長文留在文字廊。
  - **量到的（`.verify/verify-ux.mjs`，新閘門，8 頁）：248 個 hit box，43 個可按——leave 13 · photos 11 · read 6 · try 5 · play 3 · use 3 · ride 2**；`read` 6／43（14 %），正好是地標集合。它逐頁 boot `js/games.js` **再** `js/site.js`，對每一個可按的東西按 `detail: 0` 的鍵盤點擊，折疊夾在中間的表面，然後斷言：每個可按的東西都有動詞、佈景沒有動詞、`read` 集合≟ 地標集合、每一按都被它承諾的動詞回答、文字只為 `read` 開、不同時開兩個表面、橫桿的承諾在按之前就寫好。**66/66，exit 0。**
  - **抓到的真產品錯：纜車（Falls Incline）從來沒有動過。** `moveStep` 的走路分支第一行是 `if (ride) return;`，而 `if (ride) rideStep();` 在**同一個函式的最下面**——所以按下 `incline-upper-door` 之後，頁面宣布「You ride the Falls Incline…」、把按鍵收走，然後身體在高度 0 停留 2.4 秒（`.verify/_rideprobe.mjs` 每 200 ms 印一次 `__walk.height`）。**十幾輪的閘門都沒抓到，因為每一條都在斷言 record 那一行字變了。** 修法：`if (!ride) { …走路與慣性… }` 然後無條件 `if (ride) rideStep();`；修後同一個探針 0 → 4.8 → 23.7 → 53.1 → 91.9 → 142.8 → 198.2 → 258.9（200 ms 一步）。這正是站主說的「看有沒有變化」——一句話不是變化。
  - **量具本身也修了三個毛病（不然它會把門說成崩潰、把布景說成場景）**：①`fold()` 原本用 Esc 收，而 Esc 在什麼都沒開時**就是門**，所以每次折疊都在離開房間，puppeteer 回報 "execution context destroyed"，看起來像當機；改成各自按自己的關閉鈕。②門按下去本來就會換頁，舊 document 在那之後還能讀一下，於是它會拿到**下一個房間**的 quads 並把門記成 `SCENE`——改用 `page.url()` 判定 `LEFT`，並在之後重開同一頁、同一個 stop。③每一行按下去就寫進 `.preview/ux74/presses.txt`，四十分鐘的走查不會在最後一刻把證據一起帶走。
  - **順手抓到的兩個「靜默」樣式錯——宣告被丟掉不會報錯，只會是那個顏色從來沒生效**：`css/site.css` 有五處 `color: var(--paper)`，而 `--paper` **從來沒有定義**；`.walk-card` 的字只是因為繼承到兩層外 HUD 的淺色才看起來對。而同一個 `.modal-close` 是 `color: var(--navy)`（它關的其他每個表面都是紙色），所以**卡片上唯一的出口鈕是深藍畫在深藍上**：在 DOM 裡、在 tab 順序裡、拿得到焦點，看不見（`.preview/r74/rooms-goat-stop0-read-after.png` 只看得到一圈金色焦點框）。修法：`:root` 定義 `--paper: #fdf6ec`、加 `.walk-card .modal-close { color: var(--paper) }`、把另一個從未定義的 `var(--amber)` 換成出貨中的 `--accent-bright`。閘門三條寫進 `verify-ux`：**每個 `var(--x)` 都要有定義或 fallback**、**卡片的關閉鈕不能畫成卡片自己的底色**、**卡片要宣告一個自己的底色吃不掉的文字色**；把 `--paper` 與那條規則故意改回去，它會紅成 67/69。
  - **量到的（第 74 輪）**：**verify-ux 69/69（新）**、walk **210/210**（第 73 輪的兩條斷言寫的是 "Open · " 與 "open the frame"，改成讀動詞）、overlay **95/95**、exit **82/82**、games 23/23、body 73/73、rooms-e2e **72/72（0 failures）**、skills **85/85**（新增 `skills/ux-walkthrough`）。卡片在真瀏覽器裡量到 **0 % → 13 %**（同一件地標，第 73 輪是文字廊 47 %）。`_uxwalk` 走查（Toronto 起點）：`falls-n:photos` → PHOTOS、`door-back:leave` → LEFT（activities.html），沒有任何 TEXT。
- - **第 73 輪 —— 只剩真的有意義的物件；而「按著往前走卻被推回去」是解算器的死區寫成了公分**：
  - 站主：「我說的就是全部拿掉多餘的。你只要真的有意義的物件才留著，這裡面很多都是真的會導致操作很煩。」**這一輪推翻第 72 輪的折衷**：把卡片藏在有名字的橫桿後面不算拿掉。
  - **判準寫進產生器，一個函式**：`is_target(o)` 只給這幾種動詞——離開（`leave`）、給你看照片（`frame is not None`）、搭乘（`ride`）、玩（`game`）、示範（`"demo" in o`）、「這地方因它而命名」的地標（`landmark`）、**真的拿來用**（`states` 且 `kind` 是 `door`／`glassfloor`）。其餘都是畫。`.verify/_census.mjs` 量到：**245 個 hit box，改前 107 個可按，改後 43 個**（street 6 · rooms 7 · fukuoka 7 · toronto 3 · niagara 9 · goat 6 · journey 1 · cntower 4）。退出按鈕名單的：店面、基座、量體、天際線／圓頂／軌道／路面電車／島／船／池／船艦、站前、海關、大阪商船、大連會館、復古商場、販賣機、大廳，以及 17 面鐵捲門／拱廊／廣場／鬼屋／售亭立面。
  - **卡片是刪掉，不是藏起來**：`js/site.js` 的 `showCard()` 已不存在。一次按壓只會被四種東西回答——表面（印刷的膠卷、文字廊、玩具、筆記）、它指名的門、它自己的狀態（升降梯開、玻璃地板亮）、示範——其餘什麼都沒有。閘門 `verify-overlay` 的橫桿斷言也改成問同一件事：**這一按有沒有被回答**（`surface`／`left`／`changed`／`demoed`）。
  - **段落沒有刪，改成寫出來**：文字廊的 `<details class="walk-things" data-walk-things>` 依走過去的順序列出每一件被畫出來的東西；可按的列帶 `press E — <動詞>` 與 `li.is-pressable`，`id="thing-<obj>"` 是 `revealThing()` 打開、捲到、閃 2400 ms 的目標——**地標改開自己那一列，不再開表面**。原本「Asakusa Emaki… blank here」那種說明現在讀得到（`verify-walk` 的「the paragraph that used to be in that card is in the lane」）。
  - **`data-states` 只出貨在真的拿來用的東西上**：產生器也用 `is_target(o)` 擋；八頁只剩 `rooms-cntower.html` 的 3 件（`lift-cn`、`glassfloor-cn`、`lift-skypod`）。十七個店面的開關狀態從此是畫。
  - **閘門紅了十條，全部是「站的地方不見了」，不是產品壞了**：第 73 輪讓店面變成畫之後，每一條靠店面開卡的東京斷言都回報 `#room-plate class="modal"`——reach 是空的，所以那一按沒有目標。斷言本身仍然成立，改成站在**掛在鐵捲門上的印刷**（西側 x −295：`frame-sensoji` z 299、`frame-scramble` 1436、`frame-tower` 2601），讀它的膠卷。盲目的「轉 988 ms 再走 1500 ms」到不了一件掛在單一深度的東西，所以 `verify-walk` 長出 `walkToThing(id)`：轉到那件東西自己的方位、前進一步、直到 `.walk-hit.is-reach` 就是它。**改後 210/210 全綠**（原 205 條＋新的 5 條）。
  - **順手抓到的真產品錯：楔角死區寫成公分，於是「按著沿著牆走」會被推回房間中央。** `moveStep` 的 `|along| < 1.9` 是 1.9 公分，正好是 115 cm/s × 16.6 ms；但 `moveBody` 會把超過 2.6 cm 的一步拆成 micro-step，所以全速 2.8 cm 的一幀到了 `moveStep` 是兩個 1.4 cm 的 hop，**兩個都小於 1.9**，於是每一幀沿著長面走都被判成「直直撞進角落」，assist 用 115 cm/s 把身體往房間中央蠕行。量到的（`.verify/_aisleprobe.cjs`，門司港大廳）：沿著港灣桌面向東走**卡在 x 368**、走不到側廊；6 個進入位置有 2 個卡住——這就是 `verify-rooms-e2e` 看起來「時好時壞」的原因（**在 `51b0197` 上也是紅的，不是本輪修剪造成的**）。修法是把同一件事說成速度：`const deadAlong = 115 * dt;`。改後 6/6 都走到牆邊（554–566 cm，≤ 270 幀），`verify-rooms-e2e` 回到 **72/72（0 failures）**。
  - **站到剛打開的印刷前面**：`atFrame()` 的橫向比例 0.45 是為了 x −295 的印刷留了 202 cm，而單手可及的距離是 190 cm——你剛打開的東西按不到，膠卷一收，腳下的橫桿就不見了。改成 0.58（離牆約 1.7 m，仍在伸手可及內）。
  - **量到的（第 73 輪）**：walk **210/210**、overlay **95/95**（比第 72 輪少 3 條：修剪後有 3 頁在起點身前沒東西，`else` 分支只斷言一次）、exit **82/82**、rooms-e2e **72/72**、feel **12/12**、games 23/23、body 73/73、nowebgl 35/35、story 27/27、rail 4/4、shapes 248、skills **80/80**、mirror PASS（73 % vs 1 %）、island 全部 47 個 stop 都看得到東西、wheel PASS、hotel PASS、`audit-all` 26/26 量到（平的 2：`hall-sl`、`skyline-cn`，與第 72 輪同一組）、shader-lits PASS；`_wedge2` 5 輪 0 freeze；**`verify-collision` 28/28（7 頁，exit 0）**。

- **第 72 輪 —— 只有被點名的東西才准出現；每一個進得去的面，都要有站主本來就有的那個出口**：
  - 站主兩句話：「甚至其他的東西 有很重要的你在跳介面。我發現很多東西 因為選取會跳這種介面 你全面審查清楚 有必要的在跳。」＋「還有你任何的進出環境 請全面你E2E進去用發現問題並系統性解決問題。」
  - **(a) 全面審查：整站已經沒有任何「自己跳出來」的表面。** `.verify/_albumprobe.mjs`（第 77 輪隨閱覽器刪除）逐頁探 `research.html` 的 `#featured-modal`、`thinking.html` 的 `.dot-game-panel`、`#ig-plate`：三者到頁都是關的，`#ig-plate` 已經不在任何出貨頁面裡。剩下最後一個會自己出現的是**街區橫幅**（`data-walk-banner`）：每到一個 seam、每次用站點列跳站就 `is-on` 3.4 秒（`_stopprobe.mjs` 在 niagara stop 5 量到）。
  - **橫幅的判斷：不需要。** 站點列的 `is-here`、街區抽屜自己的卡、進度條的點已經各自說同一件事，而它在選取時跳出來正好是站主說的干擾，所以整組拿掉：`js/site.js` 的 `bannerEl`／`showBanner`／`bannerTimer`／`zoneHere`／`zoneOf`／`ZONES`、`_gen_html.py` 的 `.walk-banner` 標記、`css/site.css` 的 ~40 行（原位改成「不要加回來」的中文註解）。`data-lane-zones` 當時仍出貨但已無人讀（第 76 輪刪掉）。
  - **新閘門 `verify-overlay.mjs`（jsdom，8 頁，98 條）**：沒有任何一頁出貨橫幅或它的 CSS；沒有任何計時器會揭開表面（`.is-on` 同時被回到頂端與相簿 chips 用，所以只認 `data-walk-banner|walk-banner|showBanner|bannerTimer`）；到頁只有 `[data-walk-tutor]`；tap／拖曳不開；**每一個 `.walk-hit` 的指標點擊都不開**；每一個 `[data-walk-stop]` 都不開表面；`i` 只有卡、`l` 只有清單、Esc 只收不合；橫桿的文字＝`reach.dataset.title`，按下去一定開一個表面。
  - **(b) 進出環境：先在真瀏覽器走一遍，再修「類別」，不是修那一頁。** `.verify/_backprobe.mjs` 量到的：`rooms-toronto.html` 按 `i` 開卡、按**瀏覽器上一頁** → 人被丟回 `street.html`，卡片不見、在房間裡的位置也沒了。手機沒有 Esc，上一頁就是它唯一的出口手勢——這不是細節，是整個出口契約失效。
  - **修法（一個咽喉）**：`js/site.js` 新增 `overlayEntered()`／`overlayLeft()`／`popstate`：任何佔住畫面的表面開時 push 一筆 history、關時 pop 同一筆；開著東西時來的 Back **用頁面本來就會回應的 Esc** 去收那一層（`overlayDepth`／`ownPop`／`foldingFromHistory` 三個計數器防止迴圈），只有「什麼都沒開」的 Back 才離開。接上的是 `enterOverlay`/`leaveOverlay`（故事盤、相簿盤、點點遊戲）、`showCard`/`hideCard`、`showSpace`、`toggleList`、`research.html` 的出版卡。
  - **選擇器要照出貨的標記讀，不要憑記憶**：第一版寫 `.walk-listpanel`（class 其實是 `walk-list`）、`.dot-game-panel:not([hidden])`（點點遊戲藏的是 `[data-dot-game]` 外框，面板本身從來不 hidden）——所以「清單按 Back 不收」多活了一輪。
  - **新閘門 `verify-exit.mjs`（jsdom，82 條）**：8 個走路頁的 chrome 連結全部指到存在的檔案；Back 在 8 頁都能收卡片且不導航；兩層表面要兩次 Back；自己按關閉不留幽靈條目；焦點回到開它的東西；故事盤會收；`research.html` 的出版卡會收；Esc 仍是「有東西先收、沒東西才出門」。jsdom 不能導航，所以「最後一次 Back 真的離開」由瀏覽器探針斷言（`BACK CONTRACT OK`：卡片收、房間留、第二次 Back 離開、清單收、Esc 沒東西時是門）。
  - **`verify-rooms-e2e` 從 53 PASS／18 FAIL 修成 72/72 綠**：它寫的還是第 64 輪「A／D 平移」的契約（`sidleToReach` 按住 A 側滑到門邊），第 65 輪改成轉頭之後那等於原地旋轉再撞牆，於是每一個門、每一張印刷、每一條走道都回報隔壁店面。改成訪客的做法：`walkToReach` 先轉到目標自己的方位再走進去、`walkUntilBlocked` 按住 W 直到身體停下。**紅不是本輪造成的**（第 71 輪的 A/B 已證明），本輪把它修掉。
  - **量具錯②：`_aim.mjs` 的「停了」比一幀還短，也比 glide 的一次停頓還短。** `arrive()` 用「6 次 300 ms 取樣沒動」判抵達＝1.8 秒，而機器一忙一幀就是 1.5 秒——那 27 m 的 rail glide 還在走，卻被判成「停在 149 cm」。`verify-wheel` 因此紅了一輪，看起來像軌道壞了。改成用時間對照 lane 自己的 `frameMs`（`max(6×1000 ms, 6×frameMs)`＝至少 6 秒），拒絕時把「停了多久、一幀多久」一起印出來。niagara 的 rail glide 是**一陣一陣**走的（會停 ~2 秒等貼圖），6 秒是量出來的下限；`verify-wheel` 之後連兩次 PASS。
  - **順手抓到的產品錯：一次輕點轉頭被吞掉。** 轉向是在 `tick` 裡付的，而沒按鍵的 lane 靠計時器休息；慢機器「看見按鍵的那一幀」可能在放手前就結束，剩下的 3° 欠給一個沒人排的幀 ⇒ 40 ms 輕點只轉 **0.4°**（`verify-feel` 12/12 → 11/12，全站只有這一條發現）。修法：keyup 收尾 `if (tap) loop();`，每一次放手都有自己的幀可以落地；修後 12/12。
  - **本輪閘門**：walk **205/205**、overlay **98/98**、exit **82/82**、rooms-e2e **72/72**、feel **12/12**、games 23/23、body 73/73、nowebgl 35/35、story 27/27、rail 4/4、shapes 248、skills **80/80**；其餘見 §5.5。
- **第 71 輪 —— 手：一個 tap 不再按任何東西，而頭轉得太快是「用幀付帳」**：站主給了 `.walk-card` 的截圖說「你幫我全部拿掉這種。因為我看很多不必要的物件都會跳這種視窗。這很干擾操作體驗。你順便全部處理好。」＋「現在移動左右邊轉向很大。可以全面調整好嗎」。
  - **先量，再改**。新量具 `.verify/_popup-audit.mjs`：把訪客會按的鍵（Space／Enter／e／i）、會握的鍵（d／a／w）與 GRID×GRID 個 tap 依序做一遍，印出每一個開了卡片的動作，以及當下 `reach`、焦點、指標底下的東西。**`rooms-cntower.html` stop 3 的基線是 25 個 tap 全部開卡**（其中 16 個落在空白畫布），每一個非拖曳的點擊都開——**整張畫面是一個按鈕**。這就是站主說的「很多不必要的物件」。
  - **修法（產品）**：畫面從此只看不按。`up()` 只剩一個分支：有卡片就收起來，其他什麼都不做。手指的動詞改成一根**有名字的橫桿** `<button class="walk-open" data-walk-open hidden>`（`.walk-bottom` 的第一個子元素）：只有「身前有東西」時出現，文字就是該物件的 `data-title`，CSS 加前綴 `Open · `，按下去 `act(reach)`。**屬性按鈕只認鍵盤**：`event.detail === 0` 是 DOM 自己分「鍵盤合成點擊」與「真的指標點擊」的欄位，指標點擊只把焦點交回畫面。`e`／`Enter`（畫面有焦點時）仍是同一條路。
  - **量到的（修後）**：`0/16`、`0/25` 個 tap 開卡；`e`／`Enter`／`i` 仍會開；橫桿在四個方位**只開它寫的那一個**（`names "An open shop under an indigo awning" -> CARD "An open shop under an indigo awning"`）。
  - **順手抓到一個我自己造成的回歸（`verify-games` 23/23 → 20/23）**：金魚攤 `stall-kingyo` 的 `kind` 是 `board`（＝佈景），所以它出貨時是 `data-quiet="1" tabindex="-1"`，而**tap 是它唯一的入口**。修法兩層：`act()` 的 quiet 守衛從函式最上面搬到 `showCard()` 前（quiet 的意思是「不廣播、不寫字」，不是「什麼都不做」），`is_target()` 加上 `game`／`ride`／`story`／`"demo" in o`（有動詞的物件就是目標，不管它是什麼做的）。修後 street 的 quiet 16 → 14，攤子回到可達。
  - **轉向：錯在「用幀付帳」**。原本的轉向在 `stepMotion` 裡乘 `dt`，而軟體光柵化一幀 47–670 ms ⇒ 12 ms 的輕點被付了一整幀。改成**用訪客自己的毫秒付**：按住時每幀付 `min(elapsed×1000, now−tap.start)` 並記進 `tap.held`，放手時 `cap = tap.ms > 0 ? max(tap.ms, TURN_TAP_MS) : 0`，`owed = cap − tap.held`。`TURN_RATE 120 → 85`、`DRAG_DEG_PER_PX 0.09 → 0.065`、`TURN_TAP_MS 35`。
  - **量到的（`.verify/_turnprobe.mjs`，真瀏覽器真事件）**：輕點 **2.97–2.98°**（改前 7.4–9.2°）、按 200 ms **17.7–18.4°**（37.7）、500 ms **43.5°**、1 s **85.2°**（140.3）、拖曳 **0.065 °/px**（0.09）。九次輕點三次 d／三次 a／三次 → 全部 2.97–2.98°，方向也對。
  - **兩個單位／狀態的坑，都寫進 skill 了**：①`tap.held` 曾是**秒**而 `tap.ms` 是**毫秒**，所以 `owed` 永遠是正數、每個 tap 都付滿上限；②「補足短按」的下限沒有「只付一次」的守衛，於是每一幀之後又付一次，3° 的 nudge 量成 8.9°。
  - **閘門更新（修改意圖，不刪斷言）**：`verify-walk` 的手指段整段重寫成新契約（tap 什麼都不開、橫桿開它寫的那一個、指標點擊屬性框不開、鍵盤啟動同一框會開、拖曳轉頭不開、右鍵不轉不開），**201 → 205 條仍然全綠**；因為轉速 120→85，閘門裡六處 `hold("a|d", 700)` 依 `×120/85` 改成 988 ms（`arrowright` 800→1129、`a` 550→777），否則下游八條與轉向無關的斷言（reach、rail、焦點）會一起紅。`.verify/_aim.mjs`（`DRAG_DEG_PER_PX 0.065`、`DEG_PER_KEY 2.975`）、`verify-look`、`_view.mjs`、`_keys.mjs`、`_tapdiag.mjs` 全部同步。
  - **順帶發現（不是本輪造成的）**：`verify-rooms-e2e` 現在 53 PASS／18 FAIL，但**在上一顆 commit（`cc24606`）也是紅的**（51／20）——它寫的還是第 64 輪「A／D 平移」的契約（第 65 輪改成轉頭），而且「門進入 reach」那幾條量到隔壁店面。**第 72 輪已把這支閘門修成 72／72**（見上）。
  - **本輪閘門**：walk **205/205**、games **23/23**、body 73/73、nowebgl 35/35、feel 12/12、story 27/27、rail 4/4、chain 0、shapes 248、geometry OK、clash 0、skills **80/80**、mirror PASS（73 % vs 1 %）、look 五桌全量到、wheel 14 艙 PASS、hotel PASS、island 46/46、three PASS、shader-lits PASS、`audit-all` 26/26（平的 2：`hall-sl`、`skyline-cn`）。
- **第 70 輪 —— 兩個「沒收尾」其實都不是場景的問題，是量具的問題**：
  - **`verify-tables` 不再是未知**：`LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-tables.mjs` 跑完 **exit 0**（`/tmp/gt.log`，37 行）。它逐站逐角度印出「幾個 prop 在框內、各佔多少」：lake `4/9` 只在 −90°；falls `0/4` 從 −90° 到 +30°、60/90° 只有 `falls-n 0.35/0.36`；market `2/7`（`plinth-market`、`tree-m1`）；city `7–8/9`，七個角度都在框內，少的只有 `track-c` 與 `tree-c2`。
  - **P6-5 的「三個平的 prop」是**量具**的錯，不是模型的錯，這一條撤回**：`_probe-box.mjs`（新）在 stop 4 讀 `[data-obj]` 的矩形，`skyline-cn` 在 yaw −4/0 是 `[582,191,312,552]`、yaw 30 是 `[163,172,305,566]`、31 是 `[153,171,307,569]`、60 是 `[−22,147,350,622]`——矩形**會跟著轉頭移動**（所以不是 DOM 沒更新），但**方向和畫面相反**；而同一張影格裡四棟塔畫在 yaw 0 的 `≈[130,160]–[420,690]`、yaw 30 的 `≈[548,170]–[860,700]`。把矩形畫在影格上（`.verify/_mark.mjs`）看得最清楚：**框裡是空牆**——裁下來 mean 102.3／sd **14.6**／192 色，正是 `audit-all` 報的「平」；四棟塔自己的方框是 sd **24.2**／246 色，**過 20 的門檻**。所以 `skyline-cn` 不該在平的清單上。
  - **同一個毛病讓 `tram-t`／`boat-lake` 的讀數沒有意義**：`tram-t` 的 hit 矩形是**整條軌道**（`[-25,788,1253,68]`，因為 record 的 `w` 是 380 = 全線），街車本體只有 30；`boat-lake` 在大部分視角被裁成 `1×1`。用「prop 的矩形」量「prop 平不平」，量到的是它背後那面牆和它走過的那條線。
  - **已修（站主選 (A) 翻 3D）**：`scene3d.js` 的 `makePerspective` 把 left/right 互換，畫面不再鏡射；`pic`（貼牆的照片）的 u 也取 `1 − u`，照片不會被翻。**驗證**：同一個 stop 4 影格上，`skyline-cn` 的矩形 `[582,191,312,552]`（yaw 0）與 `[163,172,305,566]`（yaw 30）**正好框住四棟塔**（`/tmp/am0.png`、`/tmp/am30.png` 已讀）；Fukuoka stop 2「the old customhouse, on your right」的房子**真的在畫面右邊**，stop 1「the station, on your left」在左邊——作者當初是照座標寫的標籤，以前畫面跟標籤相反，現在一致。Tokyo stop 5 的 −57° 五重塔仍在框內。
  - **翻面之後天空一度變成黑色，成因與修法**：`scene.background` 由 Three 自己的 background pass 畫一個 `BackSide` 的盒子，投影左右互換後三角形繞向反了、被剔掉，只剩 clear colour——Niagara stop 2 從授權的藍天變成近黑，而前景的輪子畫得好好的。改成**自建的天空球**（`Side: DoubleSide`、`depthTest/depthWrite: false`、`renderOrder −1000`、跟著眼睛走），材質仍用同一張 `makeSkyTexture`；`makeSkyTexture` 在沒有天空紀錄時回傳的是**顏色不是貼圖**，所以那條分支要降回 `material.color`，不然整個房間會被白球包住。修後 Niagara stop 3 的天空回到 pale blue（`/tmp/n2/`），夜晚仍是海軍藍（`/tmp/night/`）。
  - **兩個閘門的方框也是照舊畫面寫的**：`verify-hotel.cjs` 三個塔的方框、`verify-wheel` 的艙數都量在舊的鏡像影格上。`verify-hotel` 的方框全部取 `1024 − x − w` 重新量（塔 A `484,232`、B `634,108`、C `726,104`），三個都過（sd 14.4／29.4／15.7，色數 25／129／88）。
  - **新閘門 `verify-mirror.mjs`**：不看方框、看**畫出來的東西**。它找出畫面裡「比牆暖」的最大連通區塊（塔是奶油／金／紅花崗岩，牆是藍灰），再問 `[data-obj]` 的方框覆蓋那個區塊多少、它的鏡像覆蓋多少。現在 **74 % vs 1 %**（PASS）；把 `scene3d.js` 的修法 stash 掉重跑，就是 **1 % vs 71 %** 並且印出「the picture is mirrored」。這是這一輪唯一一個**會紅也會綠**的鏡射閘門。
  - **第 70 輪真正的發現：3D 畫面是 2D 模型（矩形、碰撞、`_map`）的左右鏡像。** 把四個 prop 的矩形和它在同一張影格裡畫出來的位置都取下來，全部滿足 `x_box ≈ 1024 − x_paint`（畫面中心 512 對稱）：`skyline-cn` yaw 0 矩形 582–894 ↔ 塔畫在 130–420；yaw 30 矩形 163–466 ↔ 塔畫在 548–860；`dome-rc` 矩形 −25–431 ↔ 圓頂畫在 820–960；`tree-c2` 矩形 465–509 ↔ 樹畫在 515–559。不是某一個 prop 的偏移，是**整張畫**相對模型左右翻面。成因在相機而不是東西放錯：`scene3d.js` 的 `camera.lookAt` 用 `up=+Y` 看向 `+Z` 時，Three 的相機右軸是 **−X**（`x = up × z`），而 2D 的 `camPt`／`affine` 是 `screen x = W/2 + focal·dx/az`（+X 在右）。兩邊差一個鏡射。**後果**：①點擊框、`verify-tables` 的 framed 比例在畫面的另一邊；②`reach`（按 E）用模型方向，所以「看著它按 E」會拿到另一側的東西；③`_map.mjs` 的左右對所有修圖建議都反了；④同一頁在沒有 WebGL 的 2D 模式下**不會**鏡射，兩種模式左右相反。**未修**：修法只有兩條（翻 3D 或翻 2D 模型），兩條都會改變全站已交付的每一張影格，所以要站主決定（見 §4）。
  - **還沒證明、所以還沒修**：矩形為什麼偏。它在 yaw 0 偏約 **+450 px（≈32°）**、yaw 30 偏約 **−400 px**，也就是偏的方向隨轉頭反向——像是一個角度常數被鏡射，但我沒能在 `js/site.js` 的投影路徑裡指出那一行；`_map.mjs` 在 3D 房間裡打到的是 2 m 處的 HUD 平面（`3D lamp halo`、`flat/flat`），不能拿來仲裁。列成 §3 P6-8，附新量具。
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
  - **P1b**：刪掉 8 段真正孤兒的 CSS（`title-btn`、`open-fig`、`.modal-close.on-photo`、`.ig-reel.is-pannable`、`.district-pick`＋其 media query、`.slot.is-drawn`、`.ig-room`），並把 `.ig-cell` 的過時註解改成實況。判準：**HTML／generator／js 三處都沒有**才算孤兒（當時的例外是 `.ig-tile`、`.ig-cell`「只活在 generator 裡＝圖一來就要用」——**第 77 輪推翻了這半條**：`.ig-cell` 只是一個沒有規則的包裝，刪；`.ig-tile` 留，但它等的是站主的日期，不是一個已經準備好的功能）。
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

### 2.3 閘門（一次跑完；**這份清單就是「有沒有跑」的判準**）

Puppeteer 需要 `LD_LIBRARY_PATH=/tmp/al2023/lib`；HTTP 型閘門要先 `sh bin/preview`（0.0.0.0:8080）；**collision 與 feel 兩支要獨佔機器**（背景有別的 Chromium 就會掉幀，量出來的速度會失真）。

**第 76 輪的教訓**：這份清單原本少列了 10 支**能跑、會紅、抓得到真缺陷**的閘門（`verify-ux`、`verify-overlay`、`verify-exit`、`verify-island`、`verify-mirror`、`verify-motion`、`verify-rooms-e2e`、`verify-skills`、`verify-wheel`、`verify-hotel`）——`verify-island` 第 69m 輪抓過「Goat Island 站在空無一物前面」，但只在那一輪被手動跑過。**不在清單上的閘門等於不存在**：它不會紅，因為沒有人跑它。

```sh
sh bin/restore-env && sh bin/preview          # 環境 + 伺服器（0.0.0.0:8080）
# ── 不開瀏覽器（秒級）──
node .verify/verify-shapes.mjs                 # 248 個 prop 都有形
node .verify/verify-geometry.mjs
node .verify/verify-clash.mjs
node .verify/verify-tables.mjs
node .verify/verify-chain.mjs
node .verify/verify-games.mjs                  # 23/23
node .verify/shader-lits.mjs                   # 6 個 shader program 完整
node .verify/verify-walk.mjs                   # 212/212（含「rail 帶你到停止點」）
node .verify/verify-csslive.mjs                # 546 條選擇器：LIVE 400／RUNTIME 123／DORMANT 5（相片牆，等站主給日期）／DEAD 0
node .verify/verify-ux.mjs                     # 69/69（按壓的動詞表、文字只給 read）
node .verify/verify-overlay.mjs                # 95/95（什麼可以蓋在走頁上、由哪個手勢）
node .verify/verify-exit.mjs                   # 82/82（每一種進去都有訪客認得的出口）
node .verify/verify-rooms-e2e.cjs              # 72/72（0 failures）
node .verify/verify-body.mjs                   # 73/73
node .verify/verify-story.mjs                  # 27/27（需 LD_LIBRARY_PATH）
node .verify/verify-skills.mjs                 # 95/95（19 個 skill 都註冊、都有路由）
node .verify/verify-gen.mjs                    # 6/6（無孤兒模組、名字不重複、閘門讀得到全部、冪等、工具找得到產生器的常數）
node_modules/.bin/impeccable detect --json .   # []
git diff --check && python3 -m py_compile _gen_html.py bin/toronto_massing.py
md5sum *.html > /tmp/a && python3 _gen_html.py && md5sum *.html > /tmp/b && diff /tmp/a /tmp/b   # 冪等
# ── 真瀏覽器，順序跑（獨佔）──
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-feel.mjs        # 12/12（獨佔）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-look.mjs          # 5 張桌子都量到
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-nowebgl.mjs     # 35/35
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-island.cjs      # 沒有一站站在空無一物前面（47 站，每站 empty 0 %）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-mirror.mjs      # 看到的就是按到的
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-box.mjs        # 75/75 框坐在自己的畫素上、15/15 按壓打到它（5 頁：toronto／fukuoka／street／niagara／goat，約 3 分鐘；`SHIFT=40` 是反測）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-motion.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-wheel.cjs       # 三張取最大（15 車廂；單張量到 9 是抽樣誤差）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-hotel.cjs
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-rail.mjs        # 4/4（四個起點到同一顆停止點）
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-objects.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node bin/verify-three.mjs           # 12,826 world + 864 water
LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-collision.cjs   # 28/28（7 頁，約 50 分鐘；動到移動／碰撞碼才必跑）
```

**動到移動／碰撞碼時多跑兩件事**（第 68 輪的規則）：`ROUNDS=20` 的 rooms 單頁連跑，以及寬掃描量具
（見 2.4）。一次綠燈是一次抽樣，不是驗收。

**量具自己也要驗**：`.verify/_stops.mjs`（每一站抵達誤差，等 `__walk.glide` 收工，不是等「看起來停了」）、
`.verify/_reach.mjs`（走過去按得到嗎）、`.verify/_surface.mjs`（表面佔多少、圖佔多少）、`_deadui.mjs`（每個
控制元件按下去有沒有變化）、`.verify/_walkshot.mjs`（走一段再拍）。第 76 輪量到 `_stops` **57/57 站 0–1 cm**。

### 2.4 量具（`.verify/_*.mjs|cjs`；只留真的會再用的，其餘刪，git 歷史留著）

- **取景**：`_view.mjs`（一張影格一個行程，深站約 55 s）、`_walkshot.mjs`（走一段再拍）、`_aim.mjs`（轉到某個 yaw 再拍）、`_gamesshot.cjs`（遊戲畫面）、`_onscreen.mjs`（從站點看，畫面上有什麼）、`browser-shot.mjs`（真 Chromium 的定點連拍，skills 裡到處引用）。
- **量測**：`_pix.mjs`（像素比對）、`_strip.mjs`（抽一條像素帶）、`_lumacheck.mjs`（各時段的平均亮度）、`_hourprobe.cjs`（夜景的可讀性）、`_lane.mjs` / `_tile.mjs`（鋪面與材質的實際尺度）、`verify-motion.mjs`（每個物件自己框內的像素變化）、`audit-all.mjs`（一次載入量所有可見 prop）、`cost-probe.mjs`（一幀提交多少 quad／三角形）、`make-cover.mjs`（把一張真影格存成封面）。
- **手感與互動**：`_turn.mjs` / `_keys.mjs`（鍵盤手感與速度）、`_census.mjs`（互動普查）、`browser-check.py`（**點擊真的落在地上**——AGENTS 指定；jsdom 沒有 hit-testing）、`wall-live.mjs`（真瀏覽器的撞牆連段）、`wall-pierce-live.mjs`（真瀏覽器的穿牆取樣）、`walk-feel.mjs`（真瀏覽器的加減速與轉向）。
- **碰撞診斷（第 68 輪）**：`_wedge.cjs`（寬掃描：每個 rail stop 16 個方位＋斜向壓牆＋每個 solid 四角，**連續**回報「有合法出口卻站著」的 STALL）、`_wedge2.cjs`（同一條路線，但把 `js/site.js` 的 `moveStep` **在記憶體裡**逐點插旗，印出 `clear`／`along`／`hop2`／`buzz`／`ok`；每個 anchor 都 assert 只命中一次）。**改 `moveStep` 就要重對 anchor**，這是它的代價，也是它抓出三個成因的方式。
- **水與霧（第 69 輪）**：`_plume.mjs`（把 `js/scene3d.js` **在記憶體裡**補上 `window.__threeScene`，回報霧的 billboard 數／alpha／包圍盒；`MIST=red` 把霧染紅證明幾何在哪、`MIST=off` 關掉它）、`_water.mjs`（40 px 一條帶的平均／sd／p05-p95／rgb，以及開霧前後每帶的 Δluma；`STOP/YAW/HOUR/SCENE/OUT`，`SCENE=` 可以拿舊版 `scene3d.js` 做 A/B）、`_ray.mjs`（在活的場景裡對某個像素射線，回報前三個命中的 mesh 名與世界座標——「畫面那條黑的是什麼」用這個問，不要猜）、`_fps.mjs`（同一台 headless 上的 fps，用來判斷多出來的幾何有沒有代價）。**三支瀏覽器量具遇到 pageerror 一律 exit 2、不印數字**：空白背景配上 HUD 也會量出一張表，那張表不是場景。
- **自動走（第 69 輪）**：`verify-rail.mjs`（閘門：四個起點點同一顆停止點，每個都要在 30 s 內到，失敗會印出最後八幀的「身體 ↔ 目標」與是否在繞路；舊版 `site.js` 跑 1/4，修好後 4/4。它把 `js/site.js` 在記憶體裡補一行 trace，anchor 命中數不對就拋錯）
- **診斷**：`_stuck.mjs` / `_stuck2.mjs`（卡住）、`_tapdiag.mjs`（點擊診斷）、`_wallgap.mjs`（畫牆與可行走空間）、`_csscheck.mjs`（樣式表解析與套用）、`wall-probe.cjs`（受困／滑動／擱淺普查）、`verify-rooms-e2e.cjs`（jsdom 啟動樣板，碰撞閘門共用同一份 boot）。
- **表面與抵達（第 75–76 輪）**：`_surface.mjs`（每一個開啟的表面：cover／content／fill／字的 measure）、`_stops.mjs`（點每一顆停止點，等 `__walk.glide` 收工，印出 cm 誤差；**不要**用「看起來停了」判斷）、`_reach.mjs`（走過去，每一個可按的東西按得到嗎）、`_deadui.mjs`（每一個控制元件按下去有沒有變化；jsdom 不能導航，所以導覽型的「沒變化」是它的盲點，原始碼裡有寫）、`_uxwalk.mjs`（訪客走查，逐行寫進 `.preview/ux74/presses.txt`）。
- **量具的抵達判準（第 76 輪修）**：`_aim.mjs` 的 `arrive()` 原本是「6 秒沒動就是到了」。被搶幀的滑行會在原地停超過 6 秒，於是 `verify-island` 把 rooms.html 第 3 站報成「停在目標前 152 cm」，而 `_stops` 同一顆按鈕量到 0 cm。現在它問車道自己的 `__walk.glide`。**任何新的抵達判斷都先看 `glide`。**
- **刪掉就不要留名字**：第 76 輪刪了十個零引用的探針（`_barshot`、`_dbg2/3`、`_dbg_goat`、`_mirror-cmp`、`_overlay-audit`、`_proj`、`_r74shot`、`_stopprobe2`、`_turnprobe-jsdom`），第 77 輪刪了 `_albumprobe`（它的題目是相簿閱覽器，閱覽器沒了）。方法寫在 `skills/dead-ballast`：七種垃圾怎麼找、四種判決（刪／接上／寫進清單／登記為 dormant）、以及怎麼證明移除是隱形的。
- **CSS 的照妖鏡（第 77 輪）**：`verify-csslive.mjs` 是**閘門**（進 §2.3），不是探針——它每次都要跑。它把 `css/site.css` 的每一條選擇器連行號解析出來，問 19 個頁面的 jsdom 有沒有東西匹配，再把沒匹配的分成三類。**加一條樣式規則的人，這支就會替他回答那條規則什麼時候有人用。**

### 2.5 記憶的規則

- **做完就刪敘述**：完成的項目從本檔移除，只留「現在在哪裡」與「量到的事實」。
- **不要用 grep 當證明，也不要用閘門當判官。** class 名可能只住在 `_gen_html.py` 裡（頁面上不一定看得到），所以 grep 會兩邊都騙：一句註解能讓死掉的 `.plate-navy` 看起來活著，一個檔名 `grid-2-grouping.jpg` 能讓死掉的 `.grid-2` 看起來在用。反過來也一樣：**閘門會把到不了的東西寫成真理**——`verify-walk` 有五輪拿「樣式表裡有沒有這段」當作相簿閱覽器存在的證據，於是刪掉它時閘門變紅，看起來像是刪錯了。判官是 `.verify/verify-csslive.mjs`：它問 DOM，然後把剩下的分成 LIVE／RUNTIME／DORMANT／DEAD（DORMANT 的判準見 `skills/dead-ballast` §3a）。**只有 DEAD 才刪，DORMANT 要說出它等的是什麼資料。**
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

### P3 — 拆掉兩個巨型檔（第 78 輪做了一半；另一半留著，理由在下面）

- **先記一件 69g 量到、但不屬於拆檔的事**：`world_quads_between` 每塊 quad 一個平面法線，遠岸因此有 ~20 px 的橫向明暗階梯（貼圖無關，三種設定 sd 都 5.1–5.5）。法線策略與 `flatShading` 屬於渲染層，改它要全站量過；記在這裡免得下一輪又從貼圖開始找。

- **✅ 產生器拆完了（第 78 輪）**：`_gen_html.py` 7,484 行 → 入口 **721 行**＋`gen/` 六個模組（`site.py` 354（頁殼、導覽、圖示、`page()`）、`content.py` 491（論文、計畫、pillars、課程、報告逐條）、`media.py` 365（圖片登錄表與牆）、`world.py` 2,080（三個測繪世界）、`districts.py` 2,657（區塊紀錄）、`render.py` 855（巷道標記））。**驗收：19 頁 md5 逐一相同（拆前 / 拆後 / 再跑一次都一樣）**，全閘門綠。拆分**靠的是名稱歸屬**，不是行號——行號在動，名稱不會；三支讀 `_gen_html.py` 當文字的閘門改讀 `bin/gen-source.mjs`（入口＋`gen/*.py` 串起來），重複 key 掃描也改成掃全部模組（塞一個重複 `"id"` 進 `gen/content.py` 會讓它停）。
- **`js/site.js` 沒拆，而且不該用「拆檔」的名義拆**：它是四個頂層單元——頁面 chrome 145 行、共用的 overlay 管線 ~115 行、點點遊戲 207 行、**巷道 8,989 行（288 個宣告共用同一個 closure）**。把 closure 照檔切開不是搬移，是**把 288 個共用名字改成介面**；而且本站最快的閘門（`verify-walk` 212 條）是把那一支腳本 `w.eval` 進 jsdom 跑的，ES module 做不到。所以要拆就得**同時**付「給巷道介面」與「閘門變慢」兩筆錢。這件事留給專門的一輪，規格寫在下面，不要用留下一個 9,000 行檔案的美工拆法交差。
  - 下一輪（若要做）的範圍與驗收：把巷道切成 `js/lane/{fields,props,reach,rail,story,px}.js`（原生 ES module），每個檔只匯出它真正的介面；**閘門改成 puppeteer 開真頁面跑同一批斷言**（212 條要一條一條搬，不是重寫），並用 `.preview` 的影格逐像素比對。沒過這三關就不算拆完。

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
0. **Goat Island 的 Terrapin Point 預設視角是往下看（第 76 輪量到，等站主一句話）**：第 3 站 authored view `yaw 88 / pitch 14`，而本專案的 pitch 正值＝往下，於是畫面中央 (480,430) 第一個命中的是 **528 cm 外、92 cm 高的石牆**，整張影格中間三分之一是護牆、馬蹄只剩頂端一條（`.preview/r76/goat-stop3.png`）。同時量到 `falls-horseshoe` 的按壓框投影在 **x 2171**（畫面外），所以這一站「看得到／按得到」對不上。建議 `pitch 14 → 0~2` 並重拍；**看畫面的事留給站主**。驗收：重拍影格＋`_ray` 中央像素命中瀑布、不再命中 528 cm 的石牆。
1. ~~**`hotelw` 旅館塔近看**~~ **已結案（第 69m 輪，第二趟）**：塔**一直都在視野裡，只是從來沒進過框**——`_map` 在 fun row（stop 6，yaw 90）量到 `hotelw` 在 **324–333 m**，而作者寫的 `pitch -2` 讓畫面頂邊剛好切在屋頂線上（`.preview/nia69mq/stop6-yaw90-p6` 與 p0 兩張都是）。**`pitch -2 → -8`** 之後，最近那棟塔在店面正上方站出 **110×220 px**（`_box`：mean 107.3、sd 37.2、134 色），七公尺外的店面一格沒動。影格 `.preview/nia69ms/stop6-yaw90-p-8`。
2. ~~SkyWheel 吊艙~~ **已結案（第 69l 輪）**：從 stop 2 yaw 26 / pitch −21.5 看得到整輪，`verify-wheel.cjs` 量到 14 個艙、閘門會紅也會綠。輪下的 stop 6/7/8 看不到輪是**構圖**（輪面在 x–y 平面、pitch 夾 ±24°），不是缺陷；不要為此轉動地標。
3. **其他頁面的地標盤**：~~Goat 的兩道瀑布~~ —— 第 69m 輪把兩道瀑布都做成世界幾何（Horseshoe 的崖線＋水幕＋弧線對面那一半；美國瀑布的崖線＋水幕），見 §1；Toronto 的 `falls` 模型（現在只有 `look` 的數值，沒有專屬量具）仍在。
4. **量具覆蓋**：`_lane.mjs` / `_tile.mjs` 只量 Niagara 的鋪面；量別的頁面前，先確認 `FLOOR_PERIOD` 對那個 floor style 的意義。
5. ~~**Toronto 還平的三個**~~ **撤回（第 70 輪）**：那三個數字是從 `[data-obj]` 矩形量的，而矩形不等於畫出來的東西 —— 見 §1。四棟塔自己在畫面裡的 sd 是 **24.2**。**這一條重寫成 P6-8**（量具），不是模型的工作。順帶記下 `audit-all.mjs` 還有一個判準錯誤：它用「眾數視角 sd ≥ 20」當平不平，可是 20 m 外的一棵樹在某個角度只有幾十 px，永遠過不了；`TODO` 原本寫的驗收是「**最大視角**、面積 ≥ 120×120 px 才判」，程式沒照做。改它之前，先修 P6-8。

6. **Niagara 的夜**：`HOUR=night` 沒有夜色授權 ⇒ 整頁深藍（mean 42.1）、只有兩顆燈光暈。要不要給 Clifton 一條夜色記錄，是站主的決定（見 §4）。
7. **Goat Island 三件沒收尾的**（第 69m 輪量的，見 §1）：①鋪面偏亮（143.7 vs 記錄值 121，共用繪法，要動先確認別的頁）；②林線那帶偏暗（`canopy` 斑塊）；③近水面仍偏平（加了 `foam` 水流線，要真的流得改 shader）。
8. ~~**`[data-obj]` 矩形沒有坐在它自己的 paint 上**~~ **撤回（第 79 輪）：框從來沒有離開過它的模型。** `.verify/verify-box.mjs` 把 prop 塗成洋紅再讀畫素：`skyline-cn` yaw 0 **rect 581,192 312x552 ↔ paint 581,191..892,683（cover 100%）**、yaw 30 **164,172 305x566 ↔ 163,172..468,683（100%）**，兩頁 33 個 prop 全部 100%。第 70 輪那句「四棟塔畫在 130–420」是**顏色啟發式**在另一張影格上得到的東西，不是框的位置。這條從此由 `verify-box` 守住（`SHIFT=40` 會紅：83.2%／3.9%）。

9. **`audit-all` 的 `skyline-cn` 仍被判平（sd 19.2 < 20）**：它是四棟塔的**小模型**（`kind: skyline`，100×162×90 cm，塔分佈在 dx −30…+32），方框裡有三成是塔之間的空隙，所以「框內 sd」先天偏低。這是 **P6-8 量具問題的同一類**，不是模型的問題；改判準（框內只算塔的連通塊，或改用 `_probe-box` 的 paint 邊界）之前不要動那座模型。


## 4. 需要站主決定（代理不能替他決定）

- ~~**「3D 畫面 vs 2D 模型」的鏡射要修哪一邊**~~ **站主已裁決（第 70 輪）：翻 3D（A 案）**，已在同輪做完並驗證（見 §1）。理由保留：B 案會讓畫面對不上真實地理的左右，A 案只是把每張影格重拍一次。

- ~~**`#walk-card` 還要不要存在**~~ **站主已裁決（第 73 輪：「全部拿掉多餘的」，第 74 輪補完）**：第 73 輪把 `showCard()` 整個刪掉是對的方向，但把地標的說明也一起刪了；第 74 輪的裁決是「只留該需要用文字彈出介面介紹的物件」。所以文字表面只剩**一個**：`showWords()`，`card.dataset.mode = "words"`，**只有 `read`（地標）進得去**，其餘六個動詞一律用場景回答（門走掉、影片開膠卷、載具開動、玩具開玩、示範、狀態改變）。每件東西的 `data-hint` 也仍寫在文字廊的 `walk-things` 裡，可按的那幾列帶著動詞。
- ~~**印刷的膠卷該不該佔滿整個畫面**~~ **第 75 輪已修**：表面仍是全螢幕（它是「故事」的畫布），但**圖的框現在就是圖**（`--ar`／`--reel-w`），填滿率從 9 % 變成 68 %（橫幅）、直幅則是 479×642。要不要連表面都不佔滿，是另一個決定；現在沒有「小圖放在大房間裡」的問題了。
- **瀑布的圈要不要更亮**（影格 `.preview/r65e/`、`.preview/r65b/falls2/`）；文字現在寫在文字廊（第 73 輪起沒有卡片），要不要縮短是站主的判斷，不是版面問題。
- **夜景 fold 0.62 的上限**（全站規則；`verify-walk` 有「night fold keeps a readable floor」的斷言）。
- **站點 6 的 A 字架要不要進畫面**（先量那條直線，不許先改後說）。
- **Goat 的瀑布與 Toronto 的 falls 要不要也做地標盤**（見 P6.5）。
- **英文 CV PDF 與 ORCID iD**（AGENTS 的 backlog：站主提供檔案／網址後才加）。

## 5. 已量到的事實（不要重新發明）

### 5.1 控制契約

- **第 71 輪改掉的常數**：`TURN_RATE 85` °/s（原 120）、`DRAG_DEG_PER_PX 0.065`（原 0.09）、`TURN_TAP_MS 35`（一擊 ≈ 3.0°）。轉向**用訪客的毫秒付**，不是用幀；按住時每幀 `min(elapsed×1000, now−tap.start)` 記入 `tap.held`（毫秒），放手時 `cap = tap.ms > 0 ? max(tap.ms, TURN_TAP_MS) : 0`、`owed = cap − tap.held`。走路的 tap 上限仍是 120 ms。
- **第 71 輪改掉的按下契約**：畫面只看不按（tap 只收卡片）；動詞是 `[data-walk-open]` 橫桿（有名字、沒東西時消失）；屬性框只認鍵盤（`event.detail === 0`）；`act()` 先跑所有真動詞，最後才用 `quiet` 擋卡片。量到的：`_popup-audit` 25/25 → 0/16（cntower）、0/25（street）。

W/↑ 前進、S/↓ 後退、A/← 與 D/→ 轉向、Shift 跑、Space 跳、E 只給動詞（Q 已移除）。
`SPEED 165 cm/s`、`RUN ×1.25`、`TURN_RATE 85°/s`（第 71 輪；原 120）、按住鍵上限 2 s、governor 下限 0.26、`?render=full`。
**第 72 輪補**：放手要**自己排一幀**才付得出來（`keyup` 最後 `if (tap) loop();`）。沒按鍵時 lane 靠計時器休息，慢機器上「看見按鍵的那一幀」可能在放手前就結束，剩下的 nudge 欠給一個沒人排的幀：40 ms 輕點只轉 **0.4°**，`verify-feel` 是唯一發現的那一條。
**短按不會被吃掉**：`tapState` 記住每個鍵真實按住的時間。走路鍵沒被任何一幀看見就補一次，上限 120 ms；**轉向鍵用訪客自己的毫秒付**（見下一段的常數），放手時只補「還欠的」那一段，而且那筆 nudge 只付一次（`tap.ms > 0` 的守衛）。
實測（idle、1024×768 SwiftShader）：W 149 cm/s、S 156 cm/s、D/A 96.3 / 89.2 °/s、latency 49–166 ms。

### 5.2 互動與 reach

- 可按 = `states` / `leave` / `"place": true` / `PLACE_KINDS` / `landmark` / `frame` / **`game` / `ride` / `story` / `"demo" in o`（第 71 輪補：有動詞的物件就是目標）**；其餘是 `data-quiet="1" tabindex="-1"`，列在「The small things (N)」。**`quiet` 只擋卡片，不擋動詞**（金魚攤的教訓）。
- reach = **一個池子，最近的那個贏**（同距離 → 後的那個贏）；**地標壓過整個池子**。`REACH 190`、`FAR_REACH 8000`、`LANDMARK_REACH 60000`。
- 地標（瀑布）沒有自己的面 → 標記就是整個盤；`falls-horseshoe` 離 promenade 394.4 m，bearing 292.6°。

### 5.3 幾何與碰撞解

- lane 牆 ±700；可行走半寬 676（parkway）／996（strip）／1726（plaza）；`PLAYER_RADIUS 24`。
- `moveStep` 的 slide 分支是 `blockedX || blockedD`；楔角死區是**速度**：`|along| < deadAlong`，`deadAlong = 115 × dt`（第 73 輪起；原本寫成固定 1.9 cm，而 1.9 cm 正是 115 cm/s × 16.6 ms——micro-step 讓全速的沿牆走落進死區，身體被蠕行回房間中央）。蠕行 `creep = 115 × dt`，四步 `clear(sgn)` 前瞻（第 68 輪起：步伐被 clamp 吃掉就不算暢通）。
- **第 68 輪三個成因的實測數字**（`_wedge2`，`js/site.js` 的 `moveStep` 內部）：
  - 蠕行 0.955 cm（115 × 0.0083）< `buzz` 的 1.2 cm → 8 個 freeze-with-exit 一次跑完（crate-nakamise-3 ×2、ladder、rack、mailbox、shopbay-e4 ×2、frame-poster-wires），每個都是 `clear:[1,0]`、`col:false`、`ok:false`。
  - `clear()` 在 x = −431（lane 牆）回報 `[1,1]`，蠕行 0.507 cm 被 clamp 抵銷 → move 0。
  - `pushAt` 推離後候選距離 24.0009（R = 24）、`h2.p` 0.07、`col:true` → move 0（浮點在嚴格 `<` 上翻面）。
  - 修好後：`_wedge` 寬掃描 5 輪 0 freeze（19,240–20,040 幀／輪）；`verify-collision` 7 頁 28/28。
- 停止點（HTML z）：61 / 1360 / 2842 / 4379 / 4814 / 6177 / 7424（fun row x 300, yaw 90）/ 8584（SkyWheel x 830, yaw 78）/ 10092。
- **第 73 輪的碰撞觀測**：門司港大廳沿著港灣桌面向東走，改前**卡在 x 368**（6 個進入位置有 2 個卡住），改後 6/6 走到牆邊（554–566 cm，≤ 270 幀）。原因見上：死區是公分不是速度。
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

### 5.5 閘門現況

**現在只有一個地方記這件事：§2.3 的清單**（26 支檔案，分「不開瀏覽器」與「真瀏覽器、順序跑」兩段，每支後面是它這一輪量到的數字）。第 77 輪加了 `verify-csslive.mjs`：它不是探針，是每次都要跑的閘門——一條樣式規則有沒有東西可以套，只有 DOM 知道。逐輪的流水帳已刪：它跟 §1 的回合記錄重複，而且停在第 73 輪，會讓人以為那是最新的。

第 79 輪再加 `verify-box.mjs`（框 vs 畫素 vs 按壓，2 頁 33 個 prop）——它守住「看到的就是按到的」這一件事的**另一半**：`verify-mirror` 證明整張畫不鏡射，`verify-box` 證明每個框坐在它自己的畫素上。

留下三件跨輪仍然成立的事實：

- **`verify-rooms-e2e` 曾經一直是紅的**（53 PASS／18 FAIL，`cc24606` 上 51／20）：它寫死第 64 輪「A／D 平移」的契約，改成「先轉到方位再走」之後 72/72。閘門紅不等於產品壞，先問它寫的是哪一輪的契約。
- **`audit-all.mjs` 是診斷，不是閘門**（`STRICT=1` 才是閘門）：`boat-lake`／`tram-t` 這種「量具框到的是路徑不是車」的物件會讓它永遠不過。
- **拖曳常數只有一個**：0.065 deg/px，`_aim.mjs`、`verify-look`、`_view.mjs`、`_keys.mjs`、`_tapdiag.mjs` 全部照它；第 76 輪再加一條，任何「等滑行結束」的等待都要問 `__walk.glide`，不要用固定秒數。

### 5.6 倉庫大小

tracked 支檔案（`.git` 12 MB）：`js/vendor/three-0.186.1/three.core.js` 1.42 MB、`js/site.js` 592 KB（9,479 行，**一個 closure**，第 78 輪決定不拆）、產生器 552 KB／**7,524 行＝入口 721 ＋ `gen/` 六個模組 6,803**（第 78 輪拆完；原本是單檔 7,484 行）、`TODO-archive.md` 375 KB、`css/site.css` 85 KB（2,707 行）。`.verify` **84 支**，閘門 **28 支**，`bin/` 多一支給工具用的 `gen_literals.py`。
`image-search/`（1.2 MB，3 張 CN Tower 參考照，**來源未追溯 → 永不入庫**）只留在磁碟。

## 6. 已知限制（不要假裝解決了）

- 夜裡的 fold 壓到 0.62 是全站規則（待站主決定）。
- SkyWheel 的輪圈從廣場地板看永遠在畫面外（幾何如此：輪圈在頭上 71°），站點 6 只看得到腿與排隊區。
- `verify-feel` 的「慢幀仍在走」需要機器空閒才會過（背景有別的 Chromium 就掉到 70 cm/s）——量尺要獨佔機器。第 79 輪量到同一件事的第二個面：緊接在 `verify-rooms-e2e` 後面跑，**40 ms 轉向輕點只量到 0.2°**（應為 3.0°），單獨跑**立刻 12/12**。**這是量具的機器條件，不是被吃掉的按鍵**——但下一個人若看到它紅，先確認機器上只剩它一個 Chromium，再懷疑產品。
- 慢幀的根因是**瀏覽器軟體光柵化**，不是 JS → 真正的槓桿是少畫像素（P4）。
- **`verify-collision` 在這個沙盒要 ~50 分鐘**（第 71 輪實測；歷史紀錄 12–17 分鐘）。它每頁印四行，但**輸出要導到檔案才看得到進度**：`… > /tmp/collision.log 2>&1` 再 `tail`；接 `| tail -40` 會讓它 50 分鐘一片空白、看起來像卡住。
- collisions 閘門的路徑**每次不同**（站位相依＋idle pulse 的幀）：單次綠燈只證明「這一條路走得通」，移動類驗收要連跑。

> 最後更新：2026-10-29 · 站台零依賴、純靜態、所有 HTML 由 `_gen_html.py` 產生。
