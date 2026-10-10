# TODO — 使用者的問題、需求與現況（給下一個接手的 LLM）

> 本檔是與使用者對話的工作記憶。最後更新：2026-10-09 · 站點零依賴、純靜態、所有 HTML 由 `_gen_html.py` 產生。

## 0x. 下一件（2026-10-10 記，站主指定）：巷的夜間 lantern／窗光節奏

站主裁示：先把上輪提的「巷的夜間版 lantern／窗光節奏」記在案，做不做等一句話。

現狀：白天頁自帶夜循環（DAY()→0），夜有燈籠點火、shopfront 窗光、門框光——但**沒人專門
作者過夜的節奏**：燈籠在地板的光池、弦燈的暈、開著店的窗光潑到巷面的寬度、與關著店的暗面
交替的韻律。做的時候：

- 只加夜的光，不動夜的氛圍量測（street night 65.0 是量測不是目標——別為數字改氛圍）；
- 光池跟影子系統同一規矩：夜裡影消失、光池出現，兩者不疊在同一塊地板上打架；
- 無字原則不變（光不帶字）；
- 全閘綠收尾（walk 168、lane-shot、e2e、luma 三頁）。

---

## 0w. 第十六輪四續（2026-10-09）：Toronto 半邊太陽一致性——乾淨

站主「繼續.」。前半（入口到 Toronto 門）從中段回頭截 noon／evening 兩幀：

- 正午：世界右牆暖、左牆陰；傍晚換邊——前半的牆面 daygain 與地板影正確隨太陽。
- 後門（album 門）的門框光在暮色裡正常工作；bollard 等小 prop 的影是正確的細條。
- 前半的空是**設計**（street 不命名城市、日本半才是街區；meta 描述亦然），不另加裝飾
  （不適用就不要做）。

工具：`_walkshot.mjs` 加第六參＝方向鍵 7° 步數（drag 會 clamp 在 512px，轉不了 180°；
site.js 4515 行有 arrowleft/right ±7°）。以後回頭幀用 `-26`。

結論：影子系統（牆、地板、帆布、日光柱、per-prop）在**全巷**一致，沒有半邊例外。

---

## 0v. 第十六輪三續（2026-10-09）：per-prop 投影——影子系統完成

站主「.」核准最後一項。每個有身體的 prop（box/bikes/planter/cones/aboard/glass）在
`meta.forEach` 的 contact shadow 旁得到自己的方向影：

- 地板段：長 = h / tan(alt) × |az|，方向背陽；正午一條、傍晚一道。
- 撞到牆就爬牆：爬牆高度 = 沒跨過去的那段 × 0.9（夾在 0.85h 內）。
- 全部 `day: false`、alpha × DAY()，夜裡消失。

傍晚截圖確認：右箱影左拖、左物影爬左牆。量測：中午 188.9、夜 65.0、rooms 107.6；
walk 168/168、lane-shot 0、chain/e2e 0、shapes 123、geometry/clash 乾淨、impeccable []、冪等。

§3 的影子系統至此完成（牆影、地板影、帆布影、日光柱、per-prop）。再上去是 shadow map
（軟邊、多重投影）——那是換 renderer，不是修正。

---

## 0u. 第十六輪再續（2026-10-09）：影會動了（sunAz / sunAlt）

站主「..」核准下一件。把静态 shade 升級成**隨時刻移動的影**：

- `sunAz()`：方位角，日出 −1（左／東）→ 正午 0 → 日落 +1（右／西）。
- `sunAlt()`：高度角 8°–70°。
- 地板影寬 = 620 / tan(alt) × |az|，夾在巷寬內；早上長、正午剩一條、午後換邊。
- 牆面 daygain 跟著 az 換邊（背陽面吃 1/3 光，正午兩面都不餓）。
- 帆布的牆影隨 alt 下滑、隨 az 傾斜；港面的日光柱 x 隨 az 移動（光柱在太陽下面，不在鏡頭下面）。

早上與傍晚截圖確認是**兩條不同的街**。量測：中午 189.2（近白 0.05%）、夜 65.0、rooms 108.1 不變；
walk 168/168、lane-shot 0、chain/e2e 0、shapes 123、geometry/clash 乾淨、impeccable []、冪等。

剩給「真·shadow pass」的只有 per-prop 投影（自販機在牆上的影之類）——升級項，不是缺掉的真實。

---

## 0t. 第十六輪續（2026-10-09）：把白天作者成有方向的陽光（authored shade）

站主以「.」核准做 shade pass。走 skills 記的零新機制路線：

- **牆**：太陽在左 → 左牆面 `daygain 0.35`、右牆面 1.0（surfaces loop 裡按 side）。
- **地板**：左牆的影＝umbra（alpha 0.30×DAY）＋penumbra（0.14×DAY）兩條 quad，`day: false`
  （否則太陽會把自己的影洗掉）。
- **店**：帆布在牆上留下影（alpha 0.32×DAY）；展示玻璃吃 0.45 的陽光、暖 shelf 減半
  （影側的窗不該發白）。

量到的：中午 **193.1 → 179.1**（方向出來了，近白仍 0.05%）；夜 65.0、rooms 107.x 不變。
lane-shot 0 FAIL、walk 168/168、其餘閘全綠、冪等。真正的 cast-shadow pass（幾何投影、影隨時刻移動）
仍是升級項，記在 street-commons §3。

---

## 0s. 第十六輪（2026-10-09）：Tokyo 巷尾的夜畫面，gate 終於量對東西

上一輪留下的 3 個 lane-shot FAILED（Tokyo 深停 luma 74/61）這輪處理完。

**診斷**：失敗幀不是塌陷（137–341 色），而是「站在窗前、面向窗外夜城市」的畫面—— Tokyo 巷尾是
一個 470 寬的 **window**（不是開口），最深兩站向前看就是那張夜城市圖。閘原本用「室內」閾值
（84 luma）量它，但夜城市本來就暗：`lit` 有 28% 暖洗上限，城市量體再調也亮不了三十階。把夜城市
重畫成黃昏會背叛已核可的房間——所以修的是**閘的語義**，不是房間的時刻。

**修法和閘自己的哲學一致**（「曝光跟著畫面裡的東西走；夜戶外 graded 成室內就是對時刻說謊」；
塌陷由色數抓，色數下限不動）：

- `lane-shot` 新增 `atVista()`：有 vista 的頁面、站在距尾牆約一個窗寬內、向前看的幀，歸入
  「夜戶外」級（50 luma / 30 色）——與 open-world 頁面同一級同一理由。
- Tokyo 天空順手補了「空氣」：horizon glow 0.62→0.95、上兩層 base 色提亮（**維持閘的
  「只有地平線層 glow」規則**——我第一版給三層都 glow，被 walk 閘抓，改回）。plaza lit 0.8。

**結果**：lane-shot **0 FAILED**；walk **168/168**；chain/e2e 0；shapes 123；geometry/clash 乾淨；
impeccable `[]`；冪等；luma：street 中午 193.1／夜 65.0 不變、rooms 107.1（+0.5，黃昏空氣）。

---

## 0r. 第十五輪續（2026-10-09）：街道盡頭是港，日本半是商店街

站主說：「你可能想一下合適我的規劃你就推理幫我做完」，後來又指示流程：「先全面大多都做好，最後再全部
去修與測試……這要修改 SKILLS」。

### 決定（我推理的，理由寫進 skills/street-commons/references/promenade.md）

**街道盡頭是港**。站主把這條街比門司港，而門司港是港町；單點透視下海只能在路的盡頭，所以「沿途的
風景」=「穿过商店街，盡頭是海、太陽在水面上」。海灘不做（門司港 retro 沒有海灘，且缺最多材質）；
轉角运河也不做（那是小溪，不是「美麗的港」）。

### 做完的（working tree，尚未 commit）

- **`bd.harbor` painter**（js/site.js）：水面（panel 化、夜 tile＋**白天 waterDay tile**、日光柱）、
  堤岸（plaza 縮短）、欄杆＋柱、渡輪（船身／白船艙／夜間亮窗帶／煙囪）、門式起重機、對岸低丘
  （`mountain` 現在吃資料色，海峽綠）。
- **商店街**：`front` shape 重寫——有 `awn` 就是貼牆店面（kickplate、展示玻璃日間淡夜間深、mullions、
  空白 fascia、斜出 130 cm 的**條紋**帆布＋valance、noren 掛在門頭高）；沒有 `awn` 維持舊的突出盒。
  日本半共 6 個店面（4 新＋front-s／front-n 改裝），帆布六色、noren 三色。
- **兩個大 bug**：(1) `scaleTint` 只認 `rgba()`，hex tint 原封不動回傳 → 那顆「城市反光」在正午以
  alpha 1 全亮（白球真相），現已修；(2) emitter 沒把 `awn/noren/fascia` 寫進 DOM → 商店全隱形，現已
  加進 document contract（`data-awn` 等，與 `data-leaf` 同级）。
- **單位災難**：record 深度 ×2.9 進 walk space，但 **backdrop 與 max_d 是直接寫 walk space**。第一版
  港的欄杆作者在某 record 數字、落在巷子裡面被遠牆擋住。已全改：plaza 3000–4300、rail 4300、
  water 4360–12000、hill z 13500、max_d 4150、stations 改回 record（1240/1420）。
- 長椅搬回加拿大半（-250）；日本半下段牆 shutter→plaster；slots note／caveat／stations 文字跟上。
- **SKILLS 更新**：SKILLS.md §7（先建後測的流程規則，站主指示）、street-system §6（兩套單位）、
  promenade 決定段、lane-prop §7（retail kit 的 DOM contract 與防曬 lit 預算）。

### 最後驗證批結果（同一天稍後）

- syntax OK、冪等、**walk 168/168**、chain 0、**shapes 123/123**（加了 `shop: "front"` alias）、
  geometry OK、clash 0、**e2e 0**（其中一個斷言從「backdrop 要有 city」更新為「city 或 harbor」，
  因為設計改了）、impeccable `[]`、street-commons 與 lane-prop skill valid。
- luma（伺服器實際吐出的頁面）：**中午 193.0**（近白 0.05%）、夜 65.0、**rooms.html 106.6**
  （改前 106.7，未動）。
- lane-shot 的 3 個既存 FAILED 已在下一輪（0s）修好，見下。
- 已 commit `a5db8ef` 並 push；PR #11 已更新。

---

## 0q. 第十五輪（2026-10-08）：街道變成白天 + 日本區，太陽是量出來的

站主的話：「我比較想要有一個街道像是門司港街道，沿路走、一個地方有一個區域，另一個區域是加拿大
多倫多，走進去就是那個空間。而且我想要的**街道沿途有美麗的海灘或港的風景、且有陽光**。」加上一句
「你可以自己想想並新增 SKILLS…**不適用就不要做**」。使用者按了「繼續」。

所以這一輪**只做了兩件站主已經說死的事**：**(A) 街道有陽光**、**(B) 街道沿路有日本區**。海／港／
沙灘**沒做**——那是要決定的（三個選項寫在 `skills/street-commons` §3 與 AGENTS.md backlog），
而且它需要新的水域形狀與材質，不是這輪能誠實交付的東西。

### A. 白天：機制而不是數字（這是本輪最大的發現）

**`lit` 承載不了陽光。** 整個 renderer 的 `lit` 上限是「在貼圖自己的顏色上加一層 28% 暖色」，
而這支檔案裡的每一張貼圖都是夜景值（柏油 `#37435c`、dado `#3f5170`、混凝土 `#6b7380`）。
實測：把 `SUN()` 開到 1.0，街道整幀亮度只有 **76.9 → 83.2**，肉眼完全看不出來。所以「調太陽」是
錯的方向，必須是**加法光**。

新增（`js/site.js`）：`"day": True` 的 record → emitter 蓋 `data-lane-day-*`（cycle/start/gain）
→ 這一頁有自己的時鐘（900 s、開在 0.45＝11:50 前後），`DAY()` 是「太陽有多高」的係數，
`emit()` 用 `lighter` 疊一層暖白。連帶被迫回答的四件事，**每一件都是看畫面看出來的，不是推理出來的**：

1. **蓋子**：`drawRoom()` 每格在 `CEIL` 蓋一片平塗 `#232f4a`。白天版把它畫成天空（兩個 authored
   藍、按該格自己的深度混，頭頂深、遠端淡），而且它**不吃**加法光（`day: false`）——把太陽的顏色
   加在天空上，天空只會變白。
2. **空氣**：`FOG_MAX` 是室內的濁度，原封不動讀起來像起霧的早晨（地板與畫面中段只差 3 階）。中午
   清到 0.38 倍。
3. **光暈**：白天保留「燈還是亮著」的地板是對的（自販機），但街尾那顆 `k:0.5` 的「某處開闊」反光
   在中午是一顆 135 cm 的白球；有太陽的頁面把光暈的份額交給太陽。提燈的光錐是夜景物件，不畫。
4. **街尾的 compound 是一張「圖」，有它自己的曝光**：天空與遠山改用大氣透視（天空幾乎漂白、
   山約半、雪冠幾乎不動），而那裡凡是**表面**（廣場、斑馬線、屋頂、遠城市）吃街道的加法光但打折
   （`q.daygain`）——本來就很亮的表面再被抬，就是過曝。**第一版是整組排除，結果晴天街道盡頭是一塊
   黑楔子**；那一版現在還在我的截圖資料夾裡。
5. **提燈的紙兩者都不是**：它帶自己的 lit、`nolite`（不被夜色吃）也不吃加法光，否則紅色被洗成粉彩
   ——這件事真的在第一張白天截圖裡發生過。

**量到的數字（headless Chromium，拍伺服器實際吐出的那頁）：**

| 舊街道 | | 新街道（`"day": True`） | |
|---|---|---|---|
| 載入（它的時鐘 08:00） | 76.9 | 開頁 11:50 | **184.3** |
| 它自己的正午 | 83.2 | 黃昏 | 70.5 |
| 它自己的黃昏 | 68.8 | 夜 | 62.0 |

近白像素三個點都是 0.06%（沒有爆白），正午到夜之間是 **122 階**的擺幅。同一支探針也量了
`rooms.html`（沒有 day）：**106.7**（改動前 107.0）——黃昏的房間沒有被動到。

**還沒做**（都寫進 skill 了）：沒有方向光投影（只有接觸陰影，所以白天靠材質的明暗而不是投影）；
遠城市的窗格與水面貼圖還是夜景值（**白天還有亮著的窗**是那張畫面裡唯一還在說「晚上」的東西，
修法就是 skyline 已經在用的那招：每個變體一張自己的貼圖，不是暈一層色）；海岸整套。

### B. 日本區：靠材質、家具與燈，不靠標籤

街道遠半段（`z` 300–1040）加了五件日本街道家具與一串提燈，全部沿用 **Tokyo／Moji 已經承諾的尺寸**
（`skills/japan-place/references/japan-vocabulary.md`，自販機 112×195×72、提燈 ⌀22 掛在 3.0–3.2 m）：
`vending-s`（街角的自販機，白天唯一還亮著的燈）、`bikes-s`、`signA-s2`（第二面空白折疊板）、
`recycle-s`、`bin-s2`，以及 **8 盞提燈分掛在 z 470 與 780 兩條電線上**（掛點就在 authored 的電線上，
`swing` 讓它們各自不同相位地晃）。**站點從 6 個變 9 個**——鋪了東西的地方就值得站，station 是「值得
站的地方」而不是檢查點。

第一版只做 2 盞、`size 30` 且顏色是 `#b0402e`：在 7 m 寬的巷子裡讀成兩塊紅招牌。改成 4+4、22 cm、
掛高錯開之後才像一條祭典的燈串。

### 這一輪踩到的坑

- **沙箱這一輪真的洗掉了 `.claude/`、`node_modules`，還把 git refs 退回 `afeb04d`**——上一輪修好的
  `bin/restore-env` 自己把分支接回 origin 並重裝 skill-creator，`bin/preview` 推導分支名也生效。
  這是那兩個修法的**實戰驗證**，不是推論。
- **沒有 upstream 的 `git push` 不會失敗得很明顯**：refs 被洗掉時分支的 upstream 也一起不見，
  `git push` 只印三行 autoSetupRemote 建議、什麼都沒推，遠端停在舊 commit。`restore-env` 現在會
  `--set-upstream-to` 接回來。
- **沙箱會在你回合中途消失**（中途又洗了一次：`node_modules` 與 pyyaml 都不見）。
- **腳本在 body 結尾直接 `boot()`**，所以「載入後再改 `data-*`」完全無效（試了兩次）。要量一個
  相位，得在**伺服器吐出的 HTML 上**改那個屬性——最後是用 puppeteer 攔截請求改寫那一行。
  這件事值得記住：**harness 只能量「伺服器真的給的東西」**，跟 SKILLS.md §4 是同一條規則。
- 我第一版把 `lidAt` 寫成用了沒定義的 `blendHex`／`lid`，整頁黑掉、`pageerror` 才抓到。
  **jsdom 不會畫圖，只有真瀏覽器會喊。**

### 驗證（本輪結束時）

`_gen_html.py` exit 0 且**冪等**；`verify-walk` **168/168**、`verify-chain` **0**、
`verify-rooms-e2e` **0**、`verify-shapes` 119 props 全部解析、`verify-geometry` OK、
`verify-clash` **0**、impeccable **`[]`**；白天三點位量測（184.3 / 70.5 / 62.0，近白 0.06%），
`rooms.html` 未被影響（106.7）。

---

## 0p. 第十四輪（2026-10-08）：裝 skill-creator、讀 sakura-crossing、把技能變成一等公民

使用者的四個要求，一條不漏：① 先讀完 `skills/` 與根的 `AGENTS.md`/`SKILLS.md` 再做；② 把
[anthropics/skills 的 `skill-creator`](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
裝進來；③ 研究 [`Kenton-GMI/sakura-crossing`](https://github.com/Kenton-GMI/sakura-crossing)，因為
「這有關於我們日本的建構」；④ 用 skill-creator 先建我們可能用到的 skills，並且在 AGENTS.md 加上
「**要自動判斷使用者是不是在修改／新增 SKILLS**，該用 skill-creator 就用」。

這一輪**沒有動任何 site 檔案**——`css/site.css`、`js/site.js`、`_gen_html.py`、任何 `*.html` 都
沒改，所以 gate 的數字是拿來確認環境健康的，不是拿來確認改動的。

### 裝了什麼

- `.claude/skills/skill-creator`（本輪連 `frontend-design`、`theme-factory` 一起補齊，因為
  AGENTS.md 的清單上它們本來就該在，而沙箱裡 `.claude/` 是空的）。`.claude/` 仍然 gitignored。
- **`bin/restore-env` 現在會自己補 skill-creator**：只在 `.claude/skills/skill-creator` 不存在時
  clone `anthropics/skills`（`--depth 1`）再複製，離線是支援狀態（clone 失敗只印一行、不中斷）。
  這樣「技能包被沙箱洗掉」不再是每次開場都要人工處理的事。

### 建了兩個 skill（在 `skills/`，**有進版控**）

| Skill | 內容 |
|---|---|
| `skills/japan-place` | 日本地方的物件與比例。`SKILL.md` 講兩種房間格式（lane vs 檯面）、尺規、材質、夜、**不可以說的六件事**；`references/japan-vocabulary.md` 是物件表（公分，†＝在 sakura-crossing 量到的、⚑＝本 repo 已commit的數字）；`references/sakura-crossing.md` 是那個 repo 的研究筆記 |
| `skills/lane-prop` | 動一個物件／一盞燈／一個 state／一個 stop 的機制：`SHAPE`×`OBJ_SIZE` 雙註冊表、**id 前綴就是 kind**、`Z_SCALE` 只拉 z、`y` 是底部、`glow`/`of:` 綁定、`states`/`leave`、以及「站位要在它命名的東西前面 90–170」 |

用 skill-creator 的 `quick_validate.py` 驗過四個 skill（兩個新的＋既有的兩個）都 `Skill is valid!`——
它檢查的是 frontmatter 的 key、kebab-case 名稱、description 的 1024 字上限。**skill-creator 的
另一半（跑 subagent 做 with/without-skill 對照、`claude -p` 優化 description）這個沙箱做不到**：
沒有 `claude` CLI。所以走的是 draft → validate → 讓使用者讀；**沒有跑 benchmark，就不要說有**。

### AGENTS.md / SKILLS.md 改了什麼

- `## Skills` 拆成兩個家：`skills/`（本 repo 的手藝，**納入版控**，四個 skill 一張表）與
  `.claude/skills/`（第三方、local-only）。新增 `### Authoring a skill: when skill-creator runs`，
  這是使用者要的那條：**觸發不是我說了才做，是我自己判斷**——使用者明講（「把這個做成 skill」、
  新增/修改 SKILLS、「記下來給下一個 session」）；或**同一件事付過兩次學費**（同一個坑重踩、
  同一個數字重測、流程又從程式碼反推一次）；或同類改動開始發生在第二個地方（一次性技巧在變成手藝）。
  另外把 description 的角色（它是唯一的觸發器）、500 行上限、`references/`/`scripts/`/`assets/`
  的分工、以及「`quick_validate.py` 需要 PyYAML（`pip install --break-system-packages pyyaml`）」寫進去。
- `Reference packs` 加了 sakura-crossing，並寫明**只讀研究筆記**再決定要不要 clone，以及它是
  「語彙、比例、禁令清單」的來源，不是招牌系統或技術棧的先例。
- `## Conventions` 加一條：**skill 是產物，表格要同一個 commit 改**；`bin/` 腳本也算，理由寫在註解裡。
- `SKILLS.md` 開頭加一段指標，指向四個可載入的 skill。

### sakura-crossing 讀到什麼（重點，那個 repo 不會留在沙箱裡）

MIT、56 096 行 JS、26 個 district、**src/ 裡沒有一張圖片**（每個材質、每個招牌都是 Canvas2D 現畫）、
**裡面沒有人**。讀在 `de01898`（initial public release）。細節在
`skills/japan-place/references/sakura-crossing.md`，這裡只記對我們兩個日本房間最要緊的三件事：

1. **可以拿**：物件尺寸（自販機 112×195×72、提灯 r16、鳥居 340×330、石段 rise19/run46、路肩 13.5、
   人行道 155、車道 630、巷子 240、後巷 210、商店街 6 m 寬）——它和我們 record 已經承諾的數字一致；
   「一個地方只有一個會動的瞬間」的結構（警報→遮斷機→電車）；行為式動態（渡輪靠岸會停，不是
   `sin()` 等速來回）；以及它的 **flood fill 驗證法**（回報「最近的可達格距離」而不是 boolean）。
2. **不能拿**：它的**招牌系統**。那個 repo 的每一家店名都是**刻意發明的**（青空商店、さくら坂商店街…），
   而且用 Canvas2D 把字畫在招牌上——在它虛構的小鎮是對的，在我們這裡是**禁止事項**（場景內不得有字）。
   要拿的是**節奏**：整排店面在同一高度有 fascia 帶、一支直式招牌、視線高度一塊小牌，字全部留白。
   也不能拿它的技術棧：npm/Vite/three.js 就是 AGENTS.md 的依賴規則，那不是先例。
3. **它和我們獨立走到同一份禁令清單**（沒有任何人、沒有品牌、沒有霓虹、沒有寫實材質）——兩邊各自
   蓋一個日本地方卻收斂到同樣的「不可以」，所以那是媒介的規則，不是某個專案的品味。

### ⚠️ 這輪發現／修掉的沙箱問題

- **`bin/restore-env` 與 `bin/preview` 的分支名是寫死的 `arena/01a0fb1d-huaxu`**。沙箱重設 refs 之後，
  `restore-env` 會 `reset --soft` 到**上一個 session 的分支**——檔案不會掉，但 commit 指標會被吃掉，
  下一個 commit 就從錯的 parent 分岔（就是第九輪那個「branch 會在你回合中途被重設」的形狀）。
  兩支腳本改成**從 HEAD 推導**（HEAD 不是 `arena/*` 時，取 remote 上最新的 `arena/*`），
  而且 `restore-env` 只在 **HEAD 沒有 remote 沒有的 commit** 時才動指標；有未推的 commit 就印一行
  然後放著不動。
- **PyYAML 不在沙箱裡**（`quick_validate.py` 需要它）：`pip install --break-system-packages pyyaml`
  一次即可，但**不會**跟著 workspace 保存。沒有 `claude` CLI，所以 skill-creator 的 eval 那半沒跑。
- **refs 被洗掉時，分支的 upstream 也一起不見**——而沒有 upstream 的 `git push` **不會失敗得很明顯**，
  commit 根本沒出去，回合結束時卻像推過了。`bin/restore-env` 現在會在需要時
  `git branch --set-upstream-to=origin/<branch>` 把它接回來（這次真的踩到：第一次 `git push`
  只回了三行 autoSetupRemote 提示，remote 還停在舊 commit）。

### 驗證（本輪結束時）

`python3 _gen_html.py` **exit 0** 且**冪等**（`md5sum *.html` 前後相同）；impeccable detect **`[]`**；
四個 skill `quick_validate.py` 全部 valid。沒有動 site，所以 walk/chain/e2e 沒有意義、也沒有跑。

---

## 0i. 第九輪（2026-10-02）：Toronto 廳「物件站回桌上、廳會動了」→ 五個真 bug

使用者選「繼續修 Toronto 廳的物件真實度」。先把**動態**當成第一個量測目標（業主要過 Little Canada
那種明顯動態，但 gate 從來沒驗證過「動畫看不看得到」）：真瀏覽器在每一站、每一個視角各拍兩張
間隔 1.6 s 的圖，算「有多少 % 的像素變了」。結果：**整個廳幾乎是靜止的**（0.04%–2.1%）。往回追出五個 bug：

1. **沒有一個模型站在它的桌上**（最嚴重）。emitter 把物件的 **z 位置**乘 `Z_SCALE`（2.9），
   但**自己的尺寸 w/h/d 不乘**——所以 record 裡排好的一組東西會被「拉開」：城市桌的內容散在
   ±174 walk cm，桌子卻只有 150 深（±75）。結果電車＋軌道**浮在桌前方 99 cm 的空中**、圓頂在桌後
   24 cm、市場三攤＋兩個木箱＋七棵樹全部懸空。修法：**桌子的佔地面積才是 props 被定位的依據**，
   所以改的是桌子（`plinth-sky`/`plinth-market` 的 `d` 150→300），少數 props 微調 z。
   兩張 3 m 桌因此會在轉角互穿，於是把市場桌整組（桌子＋攤位＋木箱＋樹＋spot 燈＋frame＋station）
   一起往後退 30 record cm 讓開。
2. **畫面正中央拖曳不能轉頭**。`pointerdown` 遇到 `.walk-hit` 就 `return`，而一間有內容的房間
   **畫面中央通常就是某個物件的 press box**——於是不會建立 drag、pointerup 也判定不成 tap，
   **整個手勢什麼都不會發生**。量到：拖 188 px（26°）只有 **0.33%** 的畫面變化。
   改成「有位移就是轉頭、沒位移才是按壓」；**抓到物件時不做 `setPointerCapture`**——有了 capture
   target override，後續的 `click` 會被丟給 capture 的元素，那顆按鈕就永遠收不到它應得的按壓。
   修完 **83.9%**；tap 物件仍然開卡片 ✓，轉頭不會誤開 ✓。
3. **任何拖曳都會把 idle pump 掐死**。`pointermove` 直接 `draw()` 不請 frame，而 tick 只在身體移動時
   才排下一個——所以一轉頭就停在那一格，**整個房間凍結**。修法：`release()` 把 pumping 交回去。
4. **水根本沒有在流**。瀑布的條紋是「釘在幕上、左右晃 2 cm」——2 cm 是幕寬的 1%、從最近的站看是
   4 px，所以量起來就是一張靜圖。改成條紋**由上往下走完整個高度再從頂端重來**。渡輪（週期 29 s）
   與電車（21 s）也都約砍半。
5. **城市桌那一站把 CN Tower 切掉了**。從 858 walk cm 看，塔頂投影在視窗上方 210 px——也就是說
   「by the city table」這一站看不到全場的主角。站點退到 652，塔／天際線／圓頂／電車同框。

### 這輪學到的量測方法（重要，下次直接抄）
- **「動態看不看得到」＝同視角間隔 1.6 s 兩張圖的像素差異 %**。全廳 0.04% 就是「根本沒在動」。
- **`_vis.mjs` 是最好用的一支**：renderer 每幀會把每個物件的 hit box 定位/隱藏，所以
  `document.querySelectorAll('[data-obj]')` 的 rect + `visibility` 就能知道**這一站到底看得到什麼**
  ——不需要眼睛就能發現「站點看不到它自己命名的桌子」。
- **拖曳手勢要用真 `page.mouse`，而且要先確認 `elementFromPoint(512,384)` 不是 `.walk-hit`**——
  在做完 bug 2 之前，我所有「左右轉 79°」的量測**全部是無效的**（轉不動，量到的只是 idle 動畫）。
  這也解釋了為什麼更早期 browser-shot 的 `-right`/`-left` 幀跟 `-ahead` 數字幾乎一樣。
- `lane-shot.mjs` 的 frame gate 一直過，因為它只檢查「有沒有畫出東西」，不檢查「有沒有在動」。

### 新增的永久關卡
`.verify/browser-shot.mjs` 多一個 **turn gate**：從畫面正中央拖 188 px，斷言畫面變化 > 5%
（0.33% 就是手勢被吃掉的特徵）。jsdom 沒有 hit-testing，所以這個 bug 只能靠真瀏覽器抓——
這正是為什麼它能活到現在。四頁全過：94% / 84% / 84% / 56%。
（gate 會先按 Esc 關掉可能開著的 card，否則中心點是 card 不是場景。）

### ⚠️ 沙箱陷阱（這輪真的踩到）
**branch 會在你回合中途被重設**。我這輪第一次 push 被 reject：本地的 `arena/01a0fb1d-huaxu`
被退回 `018315b`，而 0h 那兩個 story commit 只剩在 remote 上；**但工作樹的內容還在**。
所以我 `git add -A` 出來的 commit 同時含「story 修復 + Toronto 修改」，parent 卻是 018315b → 歷史分岔。
修法（安全、不丟東西）：`git branch backup <old>` → `git reset --soft origin/arena/01a0fb1d-huaxu`
→ staged 的就會**正好只剩 Toronto 那段**（用 `git diff --cached` 確認 story 相關行數 = 0）→ 重新 commit。
`reset --soft` 不動工作樹與 index，所以不會掉任何東西。下一位遇到「push rejected」**不要**直接 pull/merge。

### 驗證（本輪結束時）
walk **167/167**、chain **0**、e2e **0**、probe **4604** < 4700、impeccable **[]**、冪等；
lane-shot toronto **0 FAIL**；browser-shot 四頁 turn + story gate **全 PASS**。

---

## 0h. 第八輪（2026-10-02）：「讀完 skills/AGENTS.md 做該做的事」→ 真瀏覽器量測抓到三個 story plate 的 bug

先做完 onboarding（讀 `AGENTS.md`、`skills/district-author`、`skills/place-intake`、`SPEC-gallery-3d.md`、
`.impeccable/config.json`），確認既有 gate 全綠（walk 166/166、chain 0、e2e 0、probe 4604<4700、
impeccable []、冪等），才去「看」站點。

**重要：本輪我沒有視覺能力**，看不到 PNG。所以改用**量測代替眼睛**：真瀏覽器（`puppeteer-core` +
`@sparticuz/chromium`，見 §0g 的跑法）跑每一站的每一個視角，逐格算 mean luminance／色彩數／
最大單色占比／壓黑比例，再對數字挑異常。這套方法一次就抓到三個 jsdom 門檻永遠抓不到的 bug
（jsdom 沒有 layout，所以它只能證明「renderer 要求畫什麼」）：

1. **story reel 六格全部留在排版裡**（最嚴重）。`#room-plate.is-rail .story-frame { display: grid }`
   的權重壓過 UA 的 `[hidden]{display:none}`，所以 `paint()` 對其他五格下的 `hidden` 完全無效。
   結果每一格被拉成 3665 px 高、該看的那一格被推到畫面外約 3500 px 處，按「Play from here」
   或在巷子裡走到畫框前按 E，開出來的是一整片空白的黑板。修法：`#room-plate .story-frame[hidden]
   { display:none }`——**要帶 id 權重，而且要寫在那條 display:grid 之後**，因為平手時是順序決定勝負。
   修完：365×500 在畫面上、panel rows 3px/630.7px/32.4px/43.5px（=768，正確）。
2. **story 的背景圖 404**。`--fill` 用相對路徑 `url("IMG/x.jpg")` 設在 inline style，但
   `background-image: var(--fill)` 宣告在 `css/site.css`——**自訂屬性裡的相對 URL 是在「被使用的地方」
   解析**，所以瀏覽器去要 `css/IMG/x.jpg`，每一格都 404，故事背後永遠是空的。
   修法：`new URL(raw, document.baseURI).href` 在 JS 端就解析成絕對。
   （注意：`verify-walk.mjs` 原本有一條 assert 在**斷言這個相對寫法**，等於在斷言 bug——已改成斷言
   意圖：必須是絕對 URL 且以當下那一格的檔名結尾。）
3. **故事沒有佔滿螢幕**。`#room-plate.is-rail .modal-panel { max-width: min(36rem, 92vw) }`（上一輪才加的，
   壓過前面那條 `max-width:none`）把全版型 panel 鎖在 576 px，1024 寬的螢幕左右兩側露出兩條裸 backdrop
   `#05080f`，模糊背景在 panel 邊界就斷掉。改成 `max-width: none`：背景 flatTop 43.8%→11.7%、
   mean 47.7→65.1，左右兩側開始出現該格自己影像的模糊色。
4. 承 3，背景變大之後多倫多那幾格（夜間暗圖）有 39.4% 的畫面落在 L≈15，低於本站自己寫的
   「任何被畫出來的表面 L*20 起跳」（`skills/district-author` §3）。`brightness(0.5)`→`0.7`，
   最大單色占比 39.4%→20.5%、暗部 L≈15→≈18–22；最亮的東京那格仍在中間調沒爆白。
   （這條是**美感判斷**，不是硬 bug——若使用者不喜歡，改回 0.5 即可，gate 不會抗議。）

### 本輪加的検證（因為這三個 bug 全是 166 條 assert 抓不到的）
- `.verify/verify-walk.mjs`：新增「`[hidden]` 規則必須寫在 display:grid 之後」的結構 assert（+1 條，
  現 167/167）；`--fill` 那條改成斷言絕對 URL。
- `.verify/browser-shot.mjs`：新增**真瀏覽器 layout gate**（原本它只是拍照工具）。跑完各站之後開
  story plate，斷言「畫面上那一格必須真的在畫面內、真的載入、且只有一格在 flow 裡」，失敗才 exit 1；
  沒有 reel 的頁面（street）跳過不算通過。這是全站唯一能證明 layout 的關卡。

### 量測腳本（用過即刪，做法記在這裡）
- `frame-metrics`：逐格算 mean/p05/p95/colours/flatTop/crushed，`mean<90 || colours<12 || flatTop>45%
  || crushed>25%` 就標旗。異常格再用 `px-probe` 取九宮格 RGB＋前四名顏色占比定位。
- 兩支都放 `.verify/` 下（`@napi-rs/canvas` 要在 repo 的 node_modules 裡才 import 得到），用完刪除。

### 驗證（本輪結束時）
walk **167/167**、chain **0**、e2e **0**、probe **4604** < 4700、impeccable **[]**、冪等；
browser-shot 四頁 story gate **全 PASS**（street 無 reel 跳過）；lane-shot street / toronto **0 FAIL**
（街道最遠兩站 mean 65、130 colours，被 gate 標為 "open night ground"，是設計如此不是 bug）。

## 0. 本輪（2026-10-01）使用者需求與處理結果

使用者原話大意：
1. 「點 album 進去一樣只能單間房間進去，空間裡面沒有連通其他空間。我要的是開放空間：先進到原本房間，然後走出房門是一般街道（有一些路程）連通其他的房間，我們可以走過去。」
2. 「加拿大那邊 Little Canada 那個地方，我也想做成那樣的——按照那邊裡面做成多倫多：知名景點、瀑布、市場、其他等等。」
3. 追問確認：「我要你把加拿大那邊環境直接修改成 Toronto 那種。生成圖是參考、再去修改環境的？」

### 處理結果（已做、已驗證）

- **連通感修好**：每個房間的出口連結現在帶 `#at-<room>`（`_gen_html.py` 的 wiring 迴圈），`js/site.js` 讀 hash 後在街上**該房自己的門口**生成、面朝街尾——走出房門就是街道，看得到其他門，用走的過去。街道加長（record d 560→1040、max_d 3400），三門間隔約 300 record cm（≈9 m 步行），滿足「有一些路程」。
- **Canada 房直接改成 Toronto 房**（不是加第四間——使用者糾正過）：`ROOMS` 的 canada 行換成 `("toronto", "Toronto", "rooms-toronto.html", ["toronto-"], "open")`；雪地走道區間與 `IMG/canada-*.jpg`、`rooms-canada.html` 已刪除。
- **Toronto 房＝Little Canada 式暗廳**：四張發光展示桌（城市桌：CN Tower／天際線／圓頂；瀑布桌：會動的水幕＋霧；市場桌：條紋雨棚攤位＋木箱；湖桌：水面＋島＋渡輪），遠牆掛整城一張的 cover plate 加畫燈。新 renderer 形狀：`plinth / tower / skyline / dome / falls / pool / stall`（`js/site.js`），並允許 record 用 `w/h/d` 縮放既有形狀（迷你比例）。
- **生成的圖的角色**（回答使用者）：`IMG/toronto-*.jpg` 是掛在牆上的 plate 與專輯卡片封面（內容），可行走環境是**依照圖所畫的用程式碼建**——本站慣例「plates are generated; the environment is authored」。
- 修掉的 renderer 陷阱：painter's algorithm 會讓一大片桌面 quad 蓋掉站在桌上的模型——`m.y > 40` 的 prop 在 sort key 上減 70（只動排序、不動幾何）。

### 驗證（本輪結束時）

- `python3 _gen_html.py` exit 0 且冪等。
- `node .verify/verify-walk.mjs` → **166/166**。
- `node .verify/verify-chain.mjs` → **0 failures**。
- `node .verify/verify-rooms-e2e.cjs` → **0 failures**（含 Toronto 門步行進出、hash 生成點）。
- `node .verify/cost-probe.mjs` → peak 4500 < 4700。
- `lane-shot` street / toronto → 0 FAIL（截圖在 `.preview/lane/`，gitignore）。
- `npx impeccable detect` → **0 findings**。

## 0b. 第二輪回饋（同日）：「環境要漂亮、有動畫、辨識度、門看不清」

處理結果（已做、已驗證）：
- **動畫**（全部走 frame clock `T`、`prefers-reduced-motion` 時靜止，idle pulse 11fps 站著也動）：
  瀑布水紋＋霧呼吸、CN Tower 頂紅燈閃爍＋pod 窗帶、天際線窗戶慢閃、湖面光帶漂移、
  渡輪改成 `boat` 形狀來回渡湖帶尾跡、市場攤位雨棚下暖燈微閃。
- **辨識度**：城市桌移到廳尾正中當主展品（塔 260 cm、天際線 120、圓頂 44，背景是整城圖）；
  瀑布加大（220×84）；湖桌移到門口左；每桌加窄 spot；廳牆改深色平滑 gallery 牆。
- **門**：door 形狀加兩側 lit jamb、fanlight 加亮、門前地面灑光池；街上三門的 over-door glow 加強。
- 驗證：walk 166/166、chain 0、e2e 0、probe 4500<4700、impeccable 0、lane-shot 兩頁 0 FAIL。

## 0c. 第三輪回饋（同日）：「整個物件真實度太差」＋ skills 調查

使用者懷疑缺了 repo 要求的 skills。調查結果：**`.claude/skills` 整個不存在**——AGENTS.md 規定的
設計 skill 包（anthropics/skills 的 frontend-design、theme-factory；pbakaus/impeccable；mattpocock/skills）
是 local-only、gitignored，所以這份 checkout 從來沒裝過。已照 AGENTS.md 的來源清單全部裝回
`.claude/skills/`（含 `.claude/agents/`）。

接著照 frontend-design 的流程「自己進去看、截圖、critique、修」，用 lane-shot 重拍兩頁逐格看，
找出真實度差的具體原因並修掉（都在 `js/site.js` renderer 與 `_gen_html.py` record）：

- **紙板感的根源＝一大片 quad 只有一個光照值**：
  - 牆面：record 標 `grad: true` 的高牆（Toronto 廳的 plaster）垂直切成 240 cm 切片，每片各自問 lamp 要光照→高度方向有光的衰減。（grad-gated：不標的帶不切，fill 預算才守得住。）
  - 桌面：plinth 頂面從一片蓋子改成 2×2 四片，spot 在桌面畫出會往邊緣衰減的光池。
  - 瀑布水幕：一片發光白板→三段高度切片（頂亮、底暗）＋原有動的水紋。
  - 湖桌水面：前後兩片、遠水較亮＋原有 drift 光帶。
- **物件浮空＝沒有接地陰影**：所有站在地板或桌面的物件（|x| < WALL−40）在腳下畫一片 contact shadow。
- **燈只有亮點沒有體積**：每盞桌上 spot 加空中光錐（同 lantern 的 cone 手法）。
- **市場攤位太弱**：record 攤位放大（64/52/40→78/60/46）、雨棚接到櫃面（後高前低）、櫃上加三堆貨色。
- **天際線窗戶**：每棟 2×3 窗格慢閃，代替原本的零星點。
- **窒息視角**：最深站點 396 原本站在城市桌正中間（塔身充滿畫面），拉回 296 站在桌前。

### 驗證（本輪結束時）

- walk **166/166**、chain **0**、e2e **0**、probe peak **4557** < 4700、impeccable **[]**、冪等、
  lane-shot street+toronto **0 FAIL**。
- node_modules 被沙箱清過：jsdom / @napi-rs/canvas / impeccable 都用 `npm --no-save` 裝回（不進 repo）。

## 0d. 第四輪回饋（同日）：「物件建構很失敗」→ 調研＋技術評估＋材質/動態大修

使用者要求：先調研 GitHub repo 相關專案/skills 怎麼教、評估多個可用技術、自行決定全做完，
要「真的可以有真實的美觀物件」且「有些物件有明顯動態像 Little Canada」。

### 調研與技術評估（結論）

- **repo 自己的 skill**：`skills/place-intake` 的教誡——prop 是 silhouette、光是模型的一部分、
  一切以公分計；已裝的 `frontend-design`：截圖→critique→修的迴圈。
- **Little Canada 本体**（[Yahoo](https://www.yahoo.com/lifestyle/articles/kid-friendly-tourist-attraction-toronto-023000432.html)、
  [Travelweek](https://www.travelweek.ca/news/little-canadas-latest-wonder-exploring-the-west-coast-in-miniature/)、
  [Destination Toronto](https://www.destinationtoronto.com/listing/little-canada/31083/)）：動態語言＝
  移動的車/火車/船、流動的水、rolling fog、窗內閃爍的電視、日與夜循環；工藝語言＝手工上色、
  幾千棵樹、分層細節。
- **技術選項評估**：
  1. three.js/WebGL——硬約束排除（零依賴、禁 WebGL）。
  2. 逐像素軟體光柵（[software-rasterizer-canvas](https://github.com/NeedFulCabin3/software-rasterizer-canvas)、EASEL.js scanline）——
      per-pixel 光照真實但等於換架構，效能風險高，否決。
  3. **Canvas2D affine-texture quad + painter sort（現有架構）**——與
     [sub3d](https://github.com/nrshvch/sub3d) 同路線（UV→context transform + CanvasPattern +
     deferred shade），方向被驗證；借它的「pattern = material」材質語言繼續深化。採納。
  4. acko projective-texturing 三角細分——等同現有 60 cm 切片慣例，不引入。

### 做了什麼

- **8 種程序化材質貼圖**（128 px tile，affine 貼上面）：玻璃帷幕（窗格＋散點亮窗）、
  肋紋混凝土（塔身）、木紋（攤位/木箱/長椅）、草皮（植栽）、展台櫃體（trim＋kick）、
  水面波紋（湖/瀑潭）、軌道道碴＋雙軌、圓頂板縫。
- **動態（Little Canada 語言）**：紅色電車在城市桌軌道來回（窗帶內透光）、瀑布潭巡迴船、
  瀑面 rolling fog、攤位蒸汽上升變淡；原有：渡輪、水紋、霧呼吸、窗閃、塔燈。
- **踩到的坑（重要）**：verify-walk 的 4700 fill 上限是**含 boot 的總量**；8 張材質 tile 啟動時
  畫 ~875 個 fillRect 直接爆預算。解法：tile 改 batched path（同色多 rect() 一次 fill()），
  boot 成本降到 ~25 fills。接手者畫任何程序化貼圖都要記得這條。
- 亮窗原本線性公式排成對角線，改非線性雜湊散開。

### 驗證（本輪結束時）

walk **166/166**、chain **0**、e2e **0**、probe peak **4582** < 4700、impeccable **[]**、冪等、
lane-shot street+toronto **0 FAIL**。

## 0e. 第五輪（同日，「繼續」）：桌面地形底座＋樹

- 四張桌的頂面從奶油蓋改成 record 用 `top` 指定的地形 tile：城市桌 `cityg`（淡色街區線＋
  兩塊公園綠）、瀑布桌 `rock`（岩層＋苔）、市場桌 `cobble`（鵝卵石）、湖桌 `sand`。
  模型站在自己的地形上＝Little Canada 的底座工藝。
- `top` 欄位原本不會到前端：`_gen_html.py` 的物件發射器只發固定欄位——補 `data-top` 發射＋
  renderer meta 讀取。（接手者：record 新欄位要同時改發射器與 meta，兩邊缺一不可。）
- 新 shape `tree`（樹幹＋兩層草皮 blob），種了 10 棵：島上兩棵、湖岸兩棵、城市桌三棵、
  瀑布緣兩棵、市場角一棵。
- 瀑布水幕基色加深（#9dbbd8→#86a8c8、lit ×0.92），不再發白。

驗證：walk 166/166、chain 0、e2e 0、probe 4595<4700、impeccable []、冪等、兩頁 lane-shot 0 FAIL。

## 0f. 第六輪（同日）：「太透、看不到正確的、做成3D」→ 實心化審計

使用者回饋物件「太透」、很多看不到正確的，建議做成 3D。

**先說誠實的限制**：這輪我試圖裝無頭瀏覽器親眼看瀏覽器畫面，但 sandbox 擋了 Google 與
Playwright 的 CDN（puppeteer/playwright 的 Chrome 都下載失敗），所以改為**逐行審計 code 裡
所有半透明來源**。renderer 本身就是真 3D 投影（體積盒、背面剔除、painter sort）——物件從來
都是 3D；「透」的來源是半透明 veil 與太淺的材質：

- 半透明 veil 全部變薄或變實：spot 光錐 0.13→0.05、攤位蒸汽 0.22→0.12、瀑霧 0.42→0.26、
  rolling fog 0.10→0.06。
- 材質改不透明：玻璃帷幕基色 #26364f→#1d2b42、窗格與亮窗全不透明、grid 線加粗；
  電車窗帶 rgba→#f2dc9e；瀑水紋 alpha 提高成泡沫；湖光帶 0.5→0.7；瀑布水幕基色再加深
  （#5d84a8、lit 上限 0.95）。
- 「看不到正確的」＝太小：迷你物放大——塔 260→300、天際線 120→150、瀑布 84→100、
  攤位 78×60→84×70。
- 雨棚加 valance（前緣下垂裙邊）， canopy 從飄著的片面變實體。

驗證：walk 166/166、chain 0、e2e 0、probe 4595<4700、impeccable []、冪等、兩頁 lane-shot 0 FAIL。

## 0g. 第七輪（同日）：「紋理牆弄好、E2E 你絕對可以、物件精緻化」

**E2E 真瀏覽器做到了**（使用者說得對）：Google/Playwright CDN 雖被擋，但
`@sparticuz/chromium` 把 chromium 二進制打包在 npm 裡；系統 lib 用套件附的 al2023.tar.br
解到 /tmp + `LD_LIBRARY_PATH`。新工具 `.verify/browser-shot.mjs`：真瀏覽器進房、走動、截圖，
圖會真的載入。跑法：`LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/browser-shot.mjs <dir>`。

**真瀏覽器一看就抓到的真 bug（牆上黑三角）**：emit 的紋理填充用「3 角 affine＋fillRect uv
bbox」，透視下第四角彎出平行四邊形，clip 區域蓋不到→每片 60 cm 壁板在斜視角被削掉一個三角。
修：改填「uv 四邊形外擴 35%」，clip 仍裁真輪廓。街與廳全癒合。

**牆做到好**：廳牆原本偷用巷子的磚 tile 與螺孔混凝土→新 gallery 材質 `hallplaster`
（平滑暖灰＋抹刀噪點）與 `hallbase`（炭色踢腳）；grad 光階改等分兩片消掉頂部薄碎片。

**物件精緻/遠看辨識**：岩壁改碎石 chip＋苔（不再像木板）、瀑頂 crest 加亮加高、
渡輪放大、天花板/地板加 sort bias（sz）確保先畫不被遠牆切片蓋。

驗證：walk 166/166、chain 0、e2e 0、probe 4604<4700、impeccable []、冪等、
lane-shot 兩頁 0 FAIL、browser-shot 真瀏覽器入口/斜視/走動帧乾淨。

## 0g. 第七輪（同日）：E2E 真瀏覽器到位＋「看不到正確的」真根因

使用者：「toronto 物件有沒有調整好？你肯定可以進去 e2e 看。」

### E2E 真瀏覽器（可以做到，做到了）

- 路線：`puppeteer-core` + `@sparticuz/chromium`（chromium 二進制**裝在 npm 包裡**，不走被擋的
  Google/Playwright CDN）＋包內附的 `al2023.tar.br` 共享庫（brotli 解壓到 /tmp/al2023，
  `LD_LIBRARY_PATH` 指過去）。不需要 apt。
- `.verify/browser-shot.mjs`：真瀏覽器開房間頁、截圖；本輪升級成**點頁面自己的 station chips**
  （`[data-walk-stop]`，同 lane-shot）每站拍 ahead/right/left——不再盲走撞牆。
- 沙箱重置後重跑只需：npm 裝依賴、解壓 al2023、起 8080、`LD_LIBRARY_PATH=... node .verify/browser-shot.mjs <dir>`。

### 「看不到正確的」真根因（用 E2E instrument 抓到的）

**pic 面的 uv v 是負的（跟牆同慣例），但 emit 的 drawImage 把圖畫在正 v 區**——圖與 clip 區只交
一條邊，於是**所有房間的畫板/cover 在真瀏覽器裡永遠是空白灰板**（lane-shot 沒有圖，所以我的
截圖也一直看不出來）。修：9 參數 drawImage 畫到 quad 的 uv bounding box。這修的是全站所有
房間的 plates，不只 Toronto。

同輪一併修掉的：affine 在掠射角失敗時 pat 面 fallback 成 void  navy 的黑三角（改 fallback 成
該材質的平色）；廳牆換 gallery 材質（hallplaster/hallbase，不再是巷弄磚＋螺絲孔混凝土）。

### 驗證

walk 166/166、chain 0、e2e 0、probe 4604<4700、impeccable []、冪等、兩頁 lane-shot 0 FAIL；
E2E 22 格真瀏覽器截圖確認：畫板出現、背景畫與前景模型同框、牆完整無鋸齒。

## 1. 需求總表與現況

| # | 需求 | 現況 | 交付 |
|---|------|------|------|
| 1 | 樞紐街道＋各房自由進出 | ✅ | 早期 commits |
| 2 | 相簿＝一個容器三張卡、卡即門 | ✅ | 早期 commits |
| 3 | 走出房門落在街上該房門口、街加長有路程 | ✅ | 本輪 |
| 4 | Canada 房改成 Toronto（Little Canada 式：景點/瀑布/市場） | ✅ | 本輪 |
| 5 | Toronto 廳漂亮＋動畫＋辨識度；門要看得清 | ✅ | 本輪 0b |
| 6 | 門真美術、walk guide、HUD 無字等合約 | ✅ 維持 | — |

## 2. 環境陷阱（接手必讀）

- **sandbox 會在回合之間還原檔案、重置 server**。動手前先 `git fetch` 比對；server 用前先驗或重啟：`python3 -m http.server 8080 --bind 0.0.0.0`。
- **HTML 頁無 cache-buster**（只有 css/js 有 VER，sha1 導出、禁手動 bump）→ 請使用者 Ctrl+Shift+R。
- node_modules 不持久：`npm i --no-save jsdom @napi-rs/canvas impeccable@4.1.0`。
- playwright 不可用；驗證＝jsdom 鍵盤 harness＋`@napi-rs/canvas` 真光柵截圖（`lane-shot.mjs`），如實回報。

## 3. 硬性約束（不變）

- 繁體中文溝通；站內內容英文。
- `*.html` 全部由 `_gen_html.py` 產生，禁手編；改完跑產生器並驗冪等。
- 零依賴；WebKit 3D 規則（`preserve-3d` 僅 `.room-world`／`.ig-grid`）；impeccable 0 findings。
- IMG/ 是 registry；ref/ 不進 commit；場景無 lettering、不畫路人。
- Backlog（CV PDF、ORCID、classroom 三張 held 圖的日期/場地）等 owner 素材，**禁止編造**。

## 4. 給下一位的觀察

- CN Tower 原本是進門視角外的左前桌——已於 0b 輪搬成廳尾正中主展品，進門即見塔＋天際線對著整城圖。若還要更「明信片」，可加一個正對城市桌的 station。
- 迷你比例靠 record 的 `w/h/d` override；新形狀必須在 `js/site.js` 的 SHAPE/PROP_TINT 有 entry，否則落回平面。

## 0j. Toronto 物件完整度檢查（第 10 輪）

owner 問：「那些物景到底有沒有做好看與完整？」查了四件事，全部是**程式查得、量得出**的缺陷，不是感覺：

**1. 三件 props 其實沒被畫出來（形狀沒解析到，靜默退回平面）**
`js/site.js` 的 `const shape = SHAPE[kindOf(m.kind)] || "plane"` 會把認不得的 id 畫成一張卡片。
`kindOf()` 只認 `kind` 或 `kind-n` 兩種寫法，而全廳只有這兩個 id 破例：

| 原本 | 實際畫成 | 應該是 |
|---|---|---|
| `isle-1` / `isle-2` | 平面卡片，沒有盆栽綠葉 | `planter`（盆＋三層葉） |
| `ferry-1` | 平面卡片，**且完全不會動**——船的動畫整段寫在 `boat` branch 裡 | `boat`（船身＋尾波） |
| `mural-cover` | 平面（這件本來就是牆上的圖版，正確） | — |

改成 `planter-i1` / `planter-i2` / `boat-lake` / `poster-cover`，現在 **36 件 props 全部解析得到形狀，0 件靠 fallback**。
（用 `/tmp/audit.mjs` 數的：把 SHAPE/PROP_TINT 從 site.js 摳出來重跑 `kindOf()`。13 件沒有 PROP_TINT 的是 `tree`/`tram`/`track`，這三種在 branch 裡自帶顏色，不算缺陷。）

**2. 四張桌子互相穿過**
- `market ∩ lake`：260 × 50 cm
- `sky ∩ market`：50 × 194 cm
- `sky ∩ falls`：50 × 4 cm
- 城市桌還穿出後牆 66 cm（桌到 z=546，牆在 480）
- 「by the city table」的 station 離桌緣只有 21 cm，根本看不到桌子

廳深 480 → **740**，四桌重排：城市桌在廳尾正中（正對走道）、湖／市場在左牆、瀑布在右牆，長邊都橫在視線方向。現在 **0 重疊、全部在牆內、每件 prop 都在自己桌上**。

**3. 渡輪原本等於沒在動**
湖桌長邊原本是 x（進深方向），訪客從走道看是「端對端」，船往 x 走＝往畫面深處走，實測只掃 **10 px**。
`boat` branch 現在看 `ry`：船沿著自己的長軸跑（`facesOf` 在 `|ry|>45` 時會交換 w/d），湖桌轉成長邊在 z，船 `ry:90`。實測 **掃 377 px**。

**4. 側桌太深，訪客鼻子貼著桌子的宽度**
要注意：渲染時 **z 會乘 2.9（`--z`），x 不會**，所以畫面上的角度是 record 數字的約 3 倍。
側桌原本 240 cm 深、離走道 210 cm → 畫面張角 59° > FOV 79° 的一半。側桌改成 160 cm 深。

### 修完的量測

| stop | 轉向 | 桌上物件進框 | 亮部 luma | 動作（框內 2 幀差） |
|---|---|---|---|---|
| 1 lake | −90° | **9/9** | 143 | 渡輪 **42% → 13%** |
| 2 falls | +90° | **4/4** | 137 | 瀑布流水 **5.1%** |
| 3 market | −90° | **7/7** | 144 | 控制組（木箱）**0%** |
| 4 city | +30° | **9/9** | 108 | 街車 **4.6–7.8%** |

（第 9 輪時 lake 是 6/7、falls 1/4、market 5/7、city 8/9。）

### gate

walk 167/167 · chain 0 · e2e 0 · cost peak 4604/4700 · impeccable `[]` ·
turn gate：toronto **84.89%**（原 78.17%）／rooms 93.12%／fukuoka 83.73%／street 5.46%
（`index` 不適用此 gate：它是落地頁，沒有可走的房間。）
新增兩個常駐 harness：`.verify/verify-tables.mjs`（每站取景）、`.verify/verify-motion.mjs`（逐物件動作）。
`VER` 由 sha1(css+js) 自動更新，本輪 **`2929633fbc`**（五個頁面一致；0i 輪的 `b2aa3d0a2e` 已過期）。

### 量測方法（下一位別再踩）

- **不要用中心點判斷有沒有進框**：大桌面的中心會掉到視窗下方，但桌面上緣明明就在畫面裡。要讀 renderer 自己寫的 `visibility`（`site.js:2567`），或算矩形與視窗的交集比例。
- **整幀像素差看不見小東西的動作**：街車整幀 0.1%，自己框裡 4–8%。
- **量轉向角度時，箭頭要一次一次按並等慣性停下**；連續快按 12 下會比「按 2 下等一下」多轉很多，量到的取景完全不同。
- **換站重走不會還原轉向**，要重載頁面才會回到正前方。

## 0k. 「仔細全部弄好」：座標陷阱、其他三個房間、與兩個會騙人的 harness（第 11 輪）

上一輪修完 Toronto，owner 說「你必須仔細全部弄好」。於是把檢查範圍放大到全部四個房間，結果上一輪的結論**還不夠**：取景對了，但東西並沒有真的站在桌上。

### 1. 最大的一個：z 會乘 2.9，深度不會

發射器（`_gen_html.py:3215`）把物件的 z 乘 `Z_SCALE`，但 `--d` 是原值輸出；renderer（`js/site.js:1129`）兩個都照讀。結果：

- 桌子桌面的實際範圍 = `z×2.9 ± d/2`（**沒有**放大）
- 桌上物件的中心 = `z×2.9`（**放大了**）

所以一件 prop 在 record 裡離桌心 50cm，到了畫面上是 145 單位——比桌面半深 120 還遠，**它就懸在桌子外面**。用 record 的數字檢查「有沒有在桌上」完全看不出來，因為 record 空間裡它明明在桌上。

上一輪排完的四張桌子，有 **15 件 prop 懸空**：島、樹、攤位、木箱、塔、街車軌道、街車本身……全部。

約束是 `|z_prop − z_table| ≤ (d_table/2 − d_prop/2) / 2.9`。據此把 17 件 prop 往桌心收（例如湖的島從 ±45 收到 ±28、城市桌的塔從 −30 收到 −2）。現在四張桌子的每一件 prop 都完整落在自己的桌面上。

### 2. 同樣的「形狀沒解析到」的 bug，另外三個房間也有 7 件

| 原 id | kind | 原本畫成 | 現在 |
|---|---|---|---|
| `crates-2` | crate | 平面卡片 | `crate-2` → 一疊木箱 |
| `planters` | planter | 平面卡片，**hint 承諾的植栽不存在** | `planter-1` → 盆＋三層葉 |
| `board-a` / `board-f` / `board-s` | signA | 平面卡片 | `signA-a/f/s` → A 字板兩面 |
| `window-a` | pane | 平面卡片 | `pane-a` → 窗台、窗框、窗簾 |
| `wheel` | bikes | 平面卡片 | `bikes-1` → 真的腳踏車 |

全部 **112 件 props（四個房間）現在 0 件解析不到形狀**。

### 3. 兩個新的常駐檢查

- `.verify/verify-shapes.mjs` — 每個房間的每件 prop 是否真的走到畫它的 branch。
- `.verify/verify-geometry.mjs` — **在 renderer 真正使用的座標空間**檢查「有沒有站在該站的東西上面」。

兩個都是 0 失敗。

### 4. 兩個會騙人的 harness（都不是網站的錯，但會害死下一位）

- **點 walk-stop 會把頁面捲動**（真實瀏覽器對任何被點擊的元素都會 `scrollIntoView`）。所以 turn gate 點完站之後，視窗中央已經不是房間而是內容區塊的標題，拖曳就落在標題上。`street` 因此量到 4.13% / 5.46% 亂跳。改成先 `scrollIntoView` 房間、再抓房間自己的中心。
- **沒東西開的時候按 Escape 會直接離開房間**（`site.js:3162`：`window.location.assign(exitLink)`）。原本無條件按 Escape，結果走到後面 walk view 已經是 `null`。改成只有真的有卡片/列表開著才按。

修完：`street` 連三次 **55.66%**（與第 9 輪已知的好數值一致）、toronto **87.69%**、rooms **77.78%**、fukuoka **83.73%**，四個都抓到 `walk-hits`。

### 5. 成本天花板 4700 → 4900（有 A/B 證據）

七件 prop 從「一張卡片 = 1 個 quad」變成真的形狀，成本本來就會上升。A/B 量 `rooms.html`：修之前 **4604**，修之後 **4758**（+154，等於四件 prop 真的被畫出來）。天花板不是細節預算而是「二次 depth pass」偵測器，二次 pass 會落在 ~6000，所以 4900 仍然留了大距離。理由已寫進 `verify-walk.mjs` 的註解裡（該檔本來就有一次同樣理由的上調前例）。

### 6. 量測

walk 167/167（id 清單同步更新）· chain 0 · e2e 0 · impeccable `[]` · geometry OK · shapes 0 unresolved ·
cost-probe peak 4756（此值只報告不斷言）· 四頁 turn gate 全 PASS · 全頁 idempotent。
Toronto 取景仍是 lake 9/9、falls 4/4、market 7/7、city 9/9；渡輪框內 2 幀差 23–46%、瀑布 3.6–5.5%、街車 1.8–4.6%、控制組木箱 0%。

### 給下一位

- **不要在 record 空間檢查幾何**。要嘛用 `.verify/verify-geometry.mjs`，要嘛記得「位置 ×2.9、尺寸不乘」。
- 新 prop 的 id 必須是 `kind` 或 `kind-n`，否則靜默變平面卡片——`verify-shapes.mjs` 現在會擋。

---

## 0j. 第十二輪（2026-10-03）：把「好不好看」變成可量測的數字 → 城市桌是主角

使用者對第 11 輪的回應：「我建議把物件都做完整做更好／我建議你自己看清楚 因為我覺得你沒弄好」。
我已經明確告訴使用者**我看不到渲染出來的圖**，所以「看清楚」在這裡不能靠眼睛，只能靠**讀 code + 量像素**。
本輪做了兩件事：先把「好不好看」變成可量測的數字，再按數字修。

### 1. 新 harness：`verify-look.mjs`（常駐）

四張桌子各裁**自己物件的聯集外框**（不是固定的矩形——固定矩形量到的是模型周圍那圈黑廳，會把亮的模型判成暗的），
回報亮度分佈、Sobel 邊緣密度（= 有多少東西可看）、顏色數、飽和度、暖色窗光比例。跑法：`node .verify/verify-look.mjs`。

### 2. 量出來的問題：主角桌是房間裡最小最暗的東西

| 桌 | 畫面上的大小 | 平均亮度 | 顏色數 | 邊緣密度 | 暖光 |
|---|---|---|---|---|---|
| lake | 867×273 | 128 | 718 | 18.4% | 12.5% |
| falls | 884×411 | 137 | 447 | 17.9% | **0.09 sat** |
| market | 741×265 | 146 | 565 | 24.4% | 57.6% |
| **city（主角）** | **289×295** | **103** | 744 | **40.9%** | 3.4% |

城市桌有 CN Tower 跟天際線，卻是全廳**最小、最暗**的一桌——和 Little Canada 完全相反
（他們的廳刻意暗，讓**模型**自己發光）。

### 3. 修法

1. **城市站往前走**：z 230 → 460（`_gen_html.py`）。原本站得離桌子 1160 單位遠，所以塔跟天際線是郵票。
   主角桌 **289×295 → 592×637 px**，平均亮度 103 → 131、對比 sd 42 → 65、顏色 744 → 979。
   取景也跟著變：這站的最佳視角從 **+30° 變成 0°**（+30° 只剩 4/9 物件在畫面內）。
2. **天際線的窗戶改成圖樣，不是 quad**。原本是 12 個手放的小 quad，而且共用 `PATS.glass`：
   `DPM = 2` 所以一塊 128 px 的 tile 只蓋 64 cm，一面 42 cm 的樓只顯示約 11 個亮窗，
   而且亮窗被當成「牆面材質」一起乘以 `lit`，所以不會發光。
   改成專屬的 `PATS.sky0/1/2`（4 cm 一窗、約 37% 亮），**三個變體**按 frame clock 輪替 → 一樣會閃爍，
   但成本是「一面一個 quad」，而且 `lit` 鎖在 ≥1.05（窗是發光的，不是被照亮的）。
3. **瀑布拿回顏色**：原本 sat 0.09，是一塊灰板。改成 Niagara 的青玉色、9 道流動條紋（原本 6）、
   並在落點加一道會呼吸的白色泡沫。
4. **街車改成行為化的班表**。原本是純 `sin()`——永遠等速，永遠不在任何地方停。
   改成「起步加速 → 行走 → 減速進站 → 停 12% 週期」，這是 Little Canada 的動態語言
   （他們的 Maid of the Mist 會在碼頭減速、離岸加速）。量測：街車在軌道框內 2 幀差
   從「off-screen」變成 **11.03 / 11.06 / 12.6 / 14.22%**，控制組木箱仍是 0%。

### 4. 使用者第 12 輪的決定：廳內的四張 AI 圖板全部拆掉，改用場景自己的形狀重畫

`toronto-1/2/3` 三張掛在側牆、`toronto-cover` 掛在遠牆。全部從 3D 廳移除（`curl` 驗過：
`data-obj="frame-*` 從 3 個變成 **0**），改成 **10 件用 renderer 自己的形狀做出來的物件**：
遠牆一組（燈箱 + 塔 + 街廓 + 圓頂）、側牆三組（燈箱 + 天際線／瀑布／攤子）。

`toronto-cover.jpg` 留下來當 index 卡縮圖與 `og:image`；`toronto-1/2/3` 留在頁面的
story reel 與 frame list（`wall: False` = 留在清單上但不掛上牆），所以頁面內容沒有減少。

### 5. 三個「harness 自己錯」的 bug（都不是網站的錯，但前兩個害我誤判）

- **`verify-geometry.mjs` 的 footprint 只會處理四分之一轉**：原本寫 `|ry| > 45 → 交換 w 和 d`，
  在 90° 是對的，在 **180°（半圈）是錯的**——半圈的 footprint 跟沒轉一樣。
  換成一般的旋轉 AABB：`hx = |cos|·w/2 + |sin|·d/2`。
- **`verify-shapes.mjs` 解析的是 id 不是 kind**——但我核對了 `site.js:1152`（`kind: el.dataset.obj`），
  決定形狀的**就是 id 前綴**，所以這支其實一直都是對的，錯的是我新加的 10 個 id
  （`shelf-city` / `mini-tower`…）。已全部改名成形狀前綴（`plinth-cityshelf` / `tower-mini`…）。
- **`verify-motion.mjs` 的街車 job 過期**：站點往前移之後 `+30°` 已經看不到車，而且車子行走距離是自己
  車身的 8 倍，裁「車子自己的外框」只會證明「車子離開了框」。改成 city+0、裁 `track-c` 的框。

### 6. 成本天花板 4900 → 5600（有 60fps 的量測證據）

往前站讓更多 quad 進畫面，`rooms-toronto` 從 4758 → **5194**。天花板的作用是抓「二次 depth pass」，
二次 pass 現在會落在 ~10000，所以 5600 仍留大距離；而且**五個站全部實測 60 fps**
（median 16.7 ms，p95 < 21 ms），所以這是「穿好衣服的廳」，不是「廳被重畫一次」。理由已寫進 `verify-walk.mjs` 註解。

### 7. 量測

walk **167/167** · impeccable `[]` · geometry OK · shapes **118/118 resolve** ·
四桌取景 lake 9/9(−90°)、falls 4/4(+90°)、market 7/7(−90°)、**city 9/9(0°)** ·
turn gate toronto **94.79%** · 全頁 idempotent。

### 給下一位

- **「好不好看」現在有數字了**：跑 `.verify/verify-look.mjs`，四張桌會排出亮度/細節/顏色/暖光。
  改任何形狀之前先跑一次，改完再跑一次，不要靠感覺說「變好了」。
- **新 prop 的 id 必須是形狀前綴**，`kind` 欄位不會決定形狀（`site.js:1152`）。
- **改站點位置會同時改變最佳取景角度**。移動 z 之後一定要重跑 `verify-tables.mjs`（約 11 分鐘）。
- 仍然沒做：**15 分鐘晝夜循環**（Little Canada 的招牌，靠 show control 同步數千盞燈；我們全廳是固定光）、
  以及渡輪的行為化減速（目前仍是 `sin()`）。

---

## 0k. 第十三輪（2026-10-03）：「只有塔能看」→ 逐物件量測，抓出瀑布根本沒畫出來

使用者的回饋：「不只那個 現在只有塔看起來比較正常。妳其他都再次檢查全面弄好」。
上一輪的 `verify-look.mjs` 是**逐桌**量測，而「桌」的平均數會把爛掉的東西藏起來
（塔 sd 52 配上旁邊一塊平的板子，平均起來還是「可以」）。本輪改成**逐物件**。

### 1. 新 harness（常駐兩支）

- **`.verify/verify-objects.mjs`**：每一個物件裁自己的外框，量大小、亮度、對比 sd、
  顏色數、邊緣密度。東西真的是一張平面卡片的話，這裡一定現形。
- **`.verify/verify-clash.mjs`**：兩個站在同一個支撐面上的 prop 不可以佔同一塊地。
  `verify-geometry.mjs` 只問「有沒有站在桌上」，從來不問「旁邊那個是不是站在同一個位置」。

### 2. 我第一個判斷是錯的（而且錯在我自己記過的陷阱上）

我算 `stall-m1`(z 385) 跟 `stall-m3`(z 415) 用 ry=90 會重疊 54 cm。**這是錯的**：
位置 z 會乘 `Z_SCALE`(2.9) 但尺寸不乘，所以兩者在渲染空間相距 88、各自深 84 → 中間還有 4 cm 空隙。
是 `verify-clash.mjs` 抓到我的錯。（第一版還寫了 `pa.y > 40 continue` 想避開牆上配件，
結果把**所有桌子**都避掉了，因為桌子在 y=80。已改成用「支撐面」分組。）

### 3. 逐物件量出來的結果（修前）

| 物件 | 大小 | 亮度 | sd | 顏色 | 邊緣 |
|---|---|---|---|---|---|
| tower-cn | 110×462 | 129 | **52** | 155 | 43% |
| skyline-cn | 238×231 | 113 | **54** | 489 | 54% |
| **dome-rc** | 139×83 | **233** | 36 | **76** | 34% |
| **falls-n** | 271×353 | 170 | **17** | 219 | 23% |
| **crate-m2** | 79×84 | 181 | **11** | 69 | 37% |
| **tree-i2** | 44×67 | 143 | **10** | 39 | 12% |

只有塔跟天際線有真的內部對比——**跟使用者說的完全一致**。

### 4. 最大的一個 bug：瀑布根本沒被畫出來

用洋紅色（magenta）探針把水牆整片塗掉去定位，結果整張圖 **0 個洋紅像素**。

原因：`facesOf()` **根本不旋轉幾何**，它只交換 w 和 d。所以「在 z - d/2 的那一面、
沿 x 展開」的那一面**永遠是那一面**，`ry` 說什麼都沒用。瀑布放在 x=290（lane 右側），
而瀑布站的位置 z=200 剛好等於 walker 站的 z → 你在 +90° 往 +x 看，
視線**正好躺在水牆的平面上** → 側看、面積為零。你其實是站在瀑布旁邊看它的側面。

修法：在 falls 分支加 `P(a, y, t)`（面上橫向座標 a、往內 t），並用 `along = |ry| > 45`
與 `sgn` 讓整片水（水牆、條紋、泡沫、水霧、水潭、船）跟著面向 lane。
`falls-n` 的 ry 從 0 改成 -90。修完：洋紅 **0 → 54,285 px**；
`falls-n` sd **17 → 46**、顏色 **219 → 517**。

### 5. `q.lit` 不會調整明暗（這點害我修錯方向）

`emit()` 裡：`lit` 只在 > 0.55 時疊一層**暖色**（255,228,186），**不會**縮放底色。
真正能壓暗的是 `q.air`（疊 navy）。所以寫 `q.lit = lit * 0.6` 想讓石頭變暗是**沒用的**。

### 6. 其他修法

- **dome**：原本是三個淺色盒子 `lit * 1.1`，量起來是全廳最亮（mean 233）又最平（76 色）的白饅頭。
  改成：底下加一圈暗的鼓座（`q.air = 0.34`）、屋頂 tile 改成有肋的板（亮板＋深色接縫）、亮度降到 0.78。
  mean **233 → 198**、顏色 **76 → 159**。
- **tree**：原本是「兩個盒子貼 terrain 貼圖」＝貼了草皮的盒子。改成 **billboard**：
  面向相機的 quad（相機右向量是 `(cy, -sy)`），帶一張柔和邊緣的樹葉 tile。
  tree-m1 sd 20 → 31、tree-s1 30 → 43、tree-s2 32 → 41。
- **crate**：木紋板條對比拉強（縫 0.6→0.85、加明暗板條）。sd 15→23、11→22。

### 7. 量測

shapes 118/118 · geometry OK · clash 4（全部是設計上就該重疊的：電車在軌道上、
島和船在水池裡）· walk **167/167** · impeccable `[]` · 全頁 idempotent ·
五站皆 **60 fps** · fills 5228（天花板 5600）。

### 給下一位

- **`facesOf` 不旋轉**——它只交換 w/d。任何「有正面」的自訂形狀都必須自己處理 `along`/`sgn`。
  `stall` 跟 `boat` 已經有（stall 還會用 `m.x < 0` 自動面向 lane），falls 是本輪唯一漏掉的。
  新增這種形狀時請照抄 `P(a, y, t)` 的寫法。
- **`q.lit` 只能加暖光，不能壓暗；要壓暗用 `q.air`。**
- **在 record 空間算幾何一定會錯**（位置 ×2.9、尺寸不乘）。用 `.verify/verify-clash.mjs`。
- 洋紅探針（把某個元素暫時塗成 `#ff00ff` 再數畫面上有幾個洋紅像素）是確認
  「這東西到底有沒有被畫出來」最快的方法——本次就是靠它發現瀑布的 0 像素。

---

## 0l. 第十三輪之二（2026-10-03）：「你這是動畫嗎？」→ 逐物件量動態

使用者的問題：「你這是動畫嗎？瀑布還有其他的我建議你也做完整」。
先把 motion probe 升級成**逐物件**（原本只量 4 個手挑的），量出來的答案很清楚：

### 1. 修前：市場那桌幾乎是死的

| 物件 | 動 |
|---|---|
| boat-lake | 54.2% |
| skyline-cn | 26.5%（窗戶閃爍）|
| falls-n | 25.6% |
| tram-t | 21.9% |
| **stall-m1/m2/m3** | **0.1 / 0.7 / 0.7%** |
| **tower-cn** | **1.5%** |
| **所有樹** | **0.0–1.0%** |

攤子唯一的動畫是「兩片 6×7 cm、alpha 0.12 的蒸氣」，等於沒有。

### 2. 修法：把動畫放在**物件的本體**上，不是角落的小裝飾

- **樹**：樹冠改成會擺動（billboard 整個平移），相位取自 `m.z`/`m.x` 所以每棵不同步，
  而且上面那叢擺得比下面大——整叢一起動就是紙板剪影。**0% → 30–50%**。
- **攤子**：遮雨篷本身就是會動的帆布。每片面板的前緣各自起伏、垂簾跟著前緣走、
  面板**整片亮度**隨波動變化、再加上攤子自己那盞燈打出來的會閃的光池。**0.7% → 7–13%**。
- **瀑布**：加了湧浪（surge）——水不是均勻落下，是一股一股地來，波沿著三段往下跑。
  **25.6% → 40.7%**。
- **塔**：pod 燈帶改成會呼吸，警示紅燈加了光暈（那個高度你看得到的其實主要是光暈）。
  **1.5% → 7.2%**。

### 3. 兩個量測陷阱（都是我踩到的）

- **取樣間隔會 alias**：攤子的燈是 1.2 s 一個週期，我原本正好每 1.2 s 拍一張 →
  每次都落在同一相位，量出來是「完全沒動」。改成 0.7 s × 5 張。
- **純色 quad 只有邊緣會被算成「有動」**：一塊沒有紋理的面，移動它的角只改變角附近的像素。
  所以「讓形狀起伏」量起來只有 2%，「讓整片亮度變化」才量得到 13%。
  要做看得出來的動畫，**亮度／顏色變化比形狀變形有效得多**。

### 4. 量測

shapes 118/118 · geometry OK · clash 4（設計上該重疊的）· walk **167/167** ·
impeccable `[]` · 全頁 idempotent · 五站皆 **60 fps** · fills 5228（天花板 5600）。
`verify-motion.mjs` 已換成逐物件版本（含上面兩個陷阱的註解），控制組木箱 0.0–1.3%。

### 給下一位

- 想讓某個東西「看起來在動」，**改亮度不要只改形狀**（見上）。
- 量動畫時**絕對不要用剛好等於動畫週期的取樣間隔**。
- 仍然沒做：**15 分鐘晝夜循環**（Little Canada 的招牌：整廳燈光同步由 show control 驅動、
  黃昏時成千上萬個窗戶 LED 亮起）。我們整廳仍是固定光。

---

## 0m. 第十三輪之三（2026-10-03）：市場其實還是死的 —— 我自己的數字騙了自己

使用者問「你真的做完整了嗎」，結果**沒有**。而且上一輪我報的數字是錯的。

### 我怎麼被自己的數字騙

`verify-motion.mjs` 報的是「四個視角 × 三個 frame-pair 裡最好的那一對」。
它說攤子動了 7–13%。用**每一對的平均**老實量：

| 物件 | 平均 \|Δ\|（滿分 765）| >14 的像素 |
|---|---|---|
| tree-m1 | 23.5 | 36.3% |
| falls-n | 11.8 | 19.7% |
| stall-m3 | 3.5 | 6.1% |
| stall-m1 | 2.0 | 4.0% |
| stall-m2 | 1.8 | 1.7% |

**連死的東西都會有一對 frame 剛好不一樣**，所以取最大值一定會過譽。
已把平均值的量法做成 `verify-motion-magnitude.mjs`（含這段教訓的註解）。

### 真正的 bug：我又用了 `q.lit`

第 13 輪我記過「`lit` 不是亮度控制，它只疊一層暖色，而且從 lit > 0.55 才開始」。
然後我在攤子的遮雨篷上**又用了一次**。

```
q.lit = lit * (1.2 + 0.26*sin(...))   // 廳內很暗，lit 從來沒超過 0.55 → 完全沒效果
```

改成用 `mix(col, shim)` 動**底色**之後：

| 物件 | 修前 | 修後 |
|---|---|---|
| stall-m1 | 2.0 | **5.4**（11.2%）|
| stall-m2 | 1.8 | **5.2**（9.9%）|
| stall-m3 | 3.5 | **11.3**（17.6%）|
| **falls-n** | **11.8** | **20.7**（49.3%）|
| tower-cn | 2.5 | 3.4 |

瀑布也一樣：`sheet.lit = l * surge` 改成 `mix(col, surge)`，水量感幾乎翻倍。

### 順便量出來的

- **stall-m1 是三攤中最遠的，也被擋得最多：27.1% 被擋**（m2 12.6%、m3 15.5%）。
  所以它數字最低是構圖問題，不是沒做動畫。
- 瀑布 bbox 填滿率 87.2%，對比 sd 42 / 519 色（第 13 輪收尾時是 46/517）→ 沒有退化。

### 量測

shapes 118/118 · geometry OK · clash 4 · walk 167/167 · impeccable `[]` ·
idempotent · 五站 60 fps。

### 給下一位

- **報數字時報「每一對的平均」，不要報「最好的一對」。**
- **不要用 `q.lit` 做亮度動畫。** 用 `mix(col, k)` 動底色。`lit` 有 0.55 的門檻。
- 仍然沒做：15 分鐘晝夜循環 · 渡輪減速進站 · issue #7。

---

## 0n. 第十三輪之四（2026-10-03）：為什麼有兩個瀑布？尼加拉瓜的比例

使用者問「為什麼會有兩個呢？」「尼加拉瓜瀑布應該要做好，怎麼感覺差很多」。

### 1. 為什麼有兩個

`falls-n`（桌上本尊）與 `falls-mini`（牆上模型盒）。這是設計：每個地標都出現兩次——
一次是桌上的大場景，一次是牆上展示櫃的小模型（tower-cn/tower-mini、skyline-cn/skyline-mini
都是同一套）。所以兩個不是 bug。

**但模型盒那一個太大了**：96×72，是本尊 130×100 的 **74%**。所以它不像「展示櫃裡的模型」，
而像「又一個瀑布」。已縮到 68×30（本尊的 30%）。

### 2. 「差很多」的真正原因：比例

查了實景尺寸：

- **Horseshoe Falls：冠寬約 670 m、落差約 57 m → 11.75:1**
- American Falls：約 320 m × 55 m → 5.8:1

**我們的模型是 130×100 = 1.30:1 —— 高了約 9 倍。**
那是一條又高又窄的緞帶（像挪威峽谷的瀑），不是尼加拉瓜。
尼加拉瓜的辨識特徵就是「極寬、相對矮」，加上**馬蹄形彎曲的冠部**。

### 3. 修法

- **`falls-n` 130×100 → 228×52（4.4:1）**，畫面上量到 **4.00:1**。
  228 是 plinth（z 向 240）能撐住的最大寬度，不會懸空。
- **冠部改成馬蹄形**：`bow(a) = hd*0.9*max(0, 1-(a/(hw*0.8))^2)`，
  水幕橫向切成 **9 片、各自在不同深度**，中間往上游凹。
  水花、冠部、水霧、落下條紋全部跟著同一條曲線走。
- **落下條紋 12 → 20**：冠部從 130 拉到 228，原本 12 條被拉稀了近一倍。
- **`falls-mini` 96×72 → 68×30**，讓它像個模型。

### 4. 前後比較

| | 修前 | 修後 |
|---|---|---|
| 畫面寬高比 | 1.42:1 | **4.00:1** |
| 對比 sd | 45 | **57** |
| 顏色數 | 499 | **679** |
| 動態 mean\|d\| | 20.7 | 19.3（30.3% 像素在動）|
| falls-mini 尺寸 | 261×168 | 188×76 |

### 量測

shapes 118/118 · geometry OK · clash 4（仍是原本那 4 組，沒有新增）· walk 167/167 ·
impeccable `[]` · idempotent · 五站 60 fps。

### 給下一位

- 這是「**先查實景尺寸再建模**」的教訓：我做了好幾輪「對比、動態」，
  卻從來沒檢查過**這個東西的形狀對不對**。形狀錯了，對比跟動態再好也不像。
- 廳內其他物件也該做同一件事：`tower-cn` 58×300 = 0.19:1，真實 CN Tower 高 553 m、
  塔身寬約 30–40 m → 大概 15:1，我們的還算接近；但 `dome-rc`、`skyline-cn` 的比例都還沒查。

---

## 0o. 第十三輪之五（2026-10-04）：聖勞倫斯市場 —— 沒有，而且從來沒做過

使用者問「你 canada little 聖勞倫斯市場這到底有沒有做完整？」

**答案是：沒有。而且它本來就沒有要做成聖勞倫斯市場。**

### 查到的事實

- 站上**從來沒有出現過 "Lawrence" 這個字**（grep 全站為 0）。文案自己就寫
  "No stall is named; a market reads without lettering"——是刻意匿名的。
- 實景：
  - **South Market 建於 1845，是多倫多第一座市政廳**；1899 年起改建為市場。
    紅磚＋石造裝飾、喬治亞式 [5](https://torontobuildings.wordpress.com/2010/10/18/st-lawrence-south-market/)
  - **大型拱窗、鐘塔／圓頂（cupola）** [3](https://www.welove-toronto.com/item/st-lawrence-market/)
  - **120 家以上攤商**，兩層樓，上層是挑廊（gallery）可俯瞰一樓
    [1](https://www.destinationtoronto.com/things-to-do/attractions/must-see-attractions/st-lawrence-market-complex/)
    [2](https://www.nomadotravel.app/en/attractions/st-lawrence-market)
  - 2012 年被 National Geographic 評為世界最佳食物市場 [1]
- **Little Canada 的 Little Toronto 確實把 St. Lawrence Market 列為地標之一**
  （與 Distillery District、Royal York Hotel、Prince Edward Viaduct 並列）
  [wiki](https://en.wikipedia.org/wiki/Little_Canada_(attraction))

### 原來的狀態（量出來的）

市場那桌 = plinth + **3 個一模一樣的攤子** + 2 個木箱：
- 桌面 **43.6% 被佔用，56% 是空的石板**
- 三個攤子的 `w/h/d` 完全相同、貨品顏色也完全相同 → 像「同一個攤子印三次」
- **完全沒有建築物**——而建築物才是聖勞倫斯市場的辨識特徵

對照其他桌的佔用率：lake 74.8% · sky 55.4% · **market 43.6%** · falls 36.8%（單一大件）

### 使用者選了：做成聖勞倫斯市場（加建築）

新增 shape `markethall`（`kind: "hall"`）：
- 紅磚主體＋砌磚橫縫、兩端轉角面（不是一塊看板）
- **地面層拱廊** 7 開間，每間石拱＋內部暗處＋會呼吸的暖光
- **上層挑廊** 7 扇高拱窗，各有自己的亮度（不是一排相同亮度的條燈），有窗櫺
- 石簷口＋女兒牆
- **鐘塔**：塔身＋**鐘面是一個圓盤，沒有指針也沒有數字**（場內不放任何字）
  上面是圓頂（cupola）＋塔尖
- 攤子改成 **4 種配色**（蔬果／肉／魚／起司），用 `m.z % 4` 挑
  （`meta` 不帶任意欄位，所以不能加 data 屬性，只能從既有值推）

### 結果

| | 修前 | 修後 |
|---|---|---|
| 攤子動態 mean\|d\| | 1.8 / 3.5 / 2.0 | **5.4 / 15.8 / 16.0** |
| 攤子對比 sd | — | 33 / 45 / 43，308–478 色 |
| 新建築 hall-sl | （不存在）| sd 37，452 色 |
| 樹 | 22（被我移到看不到）| **29.2** |

### 兩個我自己踩的坑

1. **我把三個攤子排成一條直線，結果互相擋住**，stall-m3 掉到 sd 27／100 色。
   改成兩個深度交錯才回來。**動位置一定要重測，不能假設。**
2. **tree-m1 量到 0.00** 我一度以為是程式壞了，結果單獨測：
   換回原位 **25.30**。**是位置（被擋／不在畫面），不是程式。**
   「量到 0」要先懷疑取樣框，不要先改 code。
3. crate-m2 旋轉 18° 後腳印比 `d` 寬，多出 4 cm 懸空 → geometry 檢查抓到。

### 量測

shapes 119/119 · geometry OK · clash 4（仍是原本那 4 組）· walk 167/167 ·
impeccable `[]` · idempotent · 五站 60 fps。

### 給下一位

- **做場景前先查實景尺寸跟辨識特徵。** 這輪跟瀑布輪是同一個教訓：
  我做了好幾輪對比跟動態，卻沒問過「這東西的形狀／有沒有主體建築對不對」。
- 廳內還沒查實景比例的：`dome-rc`、`skyline-cn`、`tower-cn`（0.19:1，真實約 15:1，尚接近）。

## Round 18 — 拿 Little Canada 當尺

### 已完成

- **日夜循環**（`2c3c9e3`）。4 分鐘一天（`DAYLEN`，不是 Little Canada 的 15 分鐘）。
  半個循環內全畫面 101.6 → 77.6，亮部 153 → 163（相對突出 +39%）。
- **Rogers Centre 開屋頂**（`f1d7140`）。42 秒一輪，靜態 1.3 → 峰值 35.04。
- **窗在黃昏亮起來，用自己的貼圖**（`40339fb`），不是白天貼圖疊暖色。
- **塔的窗帶改成四面環繞**（`9f287d5`）。tower-cn 從 73 色 → 190/422/445 色。

### 審查程式的三次錯誤（都寫進程式註解了）

1. **取最大 bbox** → 對一排樓來講那就是沒窗的側面。skyline-cn 90° 量 34 色、0° 量 529 色。
   改成按細節挑，並丟掉沒畫東西的區域（平均亮度 < 18）。
2. **按最大 sd 挑** → 偏愛小裁切，track-c 只量到 24×83。加了面積門檻（>= 最佳面積一半）。
3. **只取 ±90° 兩個極端轉向** → 這個害我連下兩次錯結論，以為 city table 崩了。
   現在是 5 站 × {-90,-45,0,45,90} = 25 個視角。

**教訓：一個物件在單一視角讀到的數字，不足以說它壞了。**

### 現在的讀數（25 視角，可信）

| 桌 | 代表物件 | sd | 色數 |
|---|---|---|---|
| lake | plinth-lake | 50 | 664 |
| market | plinth-market | 46 | 654 |
| market | hall-sl | 40 | 601 |
| falls | falls-n | 60 | 585 |
| city | skyline-cn | 55 | 498 |
| city | tower-cn | 51 | 445 |
| city | dome-rc | 60 | 443 |

### 還欠著

- **dome-mini 28 色、tree-f2 17 色、crate-m2 26 色** — 都是 44×44 上下的小物，
  但 17 色真的偏少，值得看一眼。
- 渡輪改成行為動畫（靠岸減速），目前仍是 `sin()` 等速來回。
- 彩蛋 / 湊近才發現的內部細節 — Little Canada 的招牌之一。
- 廳內還沒查實景比例的：`dome-rc`、`skyline-cn`（`tower-cn` 已 0.19:1，真實約 15:1）。

## Round 19 — 福岡改做門司港（MOJIKO）

站主定的 brief，一條都不能偏：

| 項目 | 決定 |
|---|---|
| 主體 | **門司港**（北九州市門司區），不是屋台小巷 |
| 構圖 | **全景**：門司港駅 + 舊門司税関 + ブルーウイングもじ + 關門海峽的船 |
| 會動的瞬間 | **三個都要，串成同一個循環**：橋開合、船過海峽、燈亮起 |
| 比例尺 | **桌上模型**（像多倫多那間，也像 Little Canada） |
| 時間 | 站主的裁量 → **傍晚開始，站在那裡看它入夜** |
| 站主去過 | 是。細節**之後補**；先用公開史實蓋，不憑空想像他看到的 |
| 屋台 | **留一個**，不指定賣什麼（不宣稱任何內容） |

### 研究到的事實（寫進程式註解，因為抓來的頁面不會留下來）

- **門司港駅**：1914（大正3）開業，木造 2 層，**ネオ・ルネッサンス様式**，左右對稱，
  中央據說是「門」字。1942 改稱門司港駅。**1988 年成為日本第一個被列為重要文化財的鐵道站舎**。
  2012–2019 復原工程，2019/3 重新開幕。
- **舊門司税関**：1912（明治45），**赤レンガ造・木骨構造**，ルネサンス様式。
  明治建築界三大巨匠之一**妻木頼黄**參與（東京日本橋、橫濱赤レンガ倉庫的設計者）。
  1927 年税関移轉後民間使用，1994 年北九州市修復。3F 展望室、1F 展示室。
- **ブルーウイングもじ**：架在第一船だまり的**歩行者専用跳開橋（はね橋）**，
  **全長約 108 m**、**日本最大級**、**全國唯一**。**一天開 6 次**，配合船的航行，
  **開合約 20 分鐘**，夜間ライトアップ。橋體是**藍色**。
- **舊大阪商船**：大拱窗 + **八角形の塔**。
- **北九州市大連友好記念館**：赤レンガ + 複合した尖塔，1995 年建。
- **舊門司三井倶楽部**：愛因斯坦曾下榻的迎賓館。
- 門司港曾與神戶、橫濱並列**日本三大港**；1995 年以「門司港レトロ」開幕。
  夜間歷史建築會**ライトアップ**。

### 待辦

1. ✅ 巷子 → 桌上港口：lane 改檯面（z 540，d 500 → 290..790）。**站位要在檯子前面**：
      第一版把 stop 排在 60..600、檯面卻在 170..690，結果 5 個 stop 有 3 個站在港口裡面
      或已經走過去，看的是空氣。多倫多的做法是每個 stop 站在它要看的檯子前面 90–170。
2. ✅ `drawbridge`（兩片葉片用自己的鉸鏈、真的三角函數轉到 1.26 rad ≈ 72°）+ `ship`
3. ⬜ 門司港駅 ✅（shape `stationfront`，「門」字門柱＋門楣＋山牆，夜間窗會亮）
   ⬜ 舊門司税関（紅磚 + 3F 展望室）　⬜ 大連友好記念館（赤レンガ + 尖塔）
   ⬜ 舊大阪商船（大拱窗 + 八角塔）
4. ✅ 橋與船串在同一個 `dayPhase`：橋 p 0.72→0.94 開，船在那段時間過航道
5. ✅ 夜間ライトアップ：**建築一棟棟亮**（`liton` 0.74/0.76/0.80/0.84/0.88，窗 `nolite` 不被夜色吃）
      ⚠️ 相位區間跨越午夜會歸零（`p - liton` 變負，`ease01` 直接熄燈）——要從黃昏 0.70 起算
6. ✅ 一個屋台（`front-mj`，在近岸碼頭 x -252）
7. ✅ 提燈重新配置：13 盞沿碼頭兩側 x ±300、z 390..690（原來掛在走道上 z 26..348，
      相機走到 z 957 時大半在背後、最近那顆離鏡頭 53 單位 → 停 0/1 有 92% 暖色像素是它）
      實測五個 stop 都讀得到，暖色佔比 57–72%，且走近時才變亮
8. ✅ 亮度泛白（wash）：`glow()` 現在吃 record 的 `k`、並隨夜色升起；
      夜色改為與 haze **疊乘**（`1-(1-air)(1-night)`），並有獨立上限 `NIGHT_MAX 0.72`
      結果（stop 4 最暗幀）：station luma 213→148（r−b 59→25）、custom 217→150、sky 119→98

### 這一輪踩到的坑（每一個都花了很久才量出來，不要再踩）

- **未註冊的 kind 會靜默變成平板**：`SHAPE[kindOf(id)] || "plane"`，不報錯、不警告，只給出一個
  無意義的 bbox。而 `verify-shapes` 是靠 **id 前綴** 反推 kind（`plinth-sky` → `plinth`），
  **不是** `data-kind`。所以物件必須命名成 `drawbridge-mj`、`ship-mj`、`pool-moji`。
- **Z_SCALE = 2.9 只拉長 z，不動寬高**：橋照原尺寸 173×20 做，投影出來只有 7 px 寬的細線。
  英雄物件要照它在畫面上的份量給尺寸（現在 w 360）。
- **關閉時的橋是水平甲板**：放在 y 80（水面高度）等於沉在水底，什麼都畫不出來。甲板 y 92。
- **`lift = 1` 寫在相位計算之前會被覆蓋**，「強制開橋」的測試要蓋的是計算之後的值。
- **我的相位估算公式偏了約 +0.3 個週期**，所以所有「開橋時段」的取樣其實都拍在關著的時候。
  要嘛把真實相位曝出來，要嘛連續掃過整段週期。
- **截圖很慢**：`_cycle.mjs` 每次迭代實際約 22 秒，不是 sleep 設的那個數字。取樣間隔要量過。
- **字典裡重複的 key 是靜默的**：fukuoka record 曾有**兩個** `"lanterns"`，後面的勝出。
      改的是前面那個，所以「改了卻完全沒變」。`_gen_html.py` 現在會用 `ast` 掃全檔，
      遇到重複的字串 key 直接中斷。
- **`glow()` 沒吃 `k`，也沒吃 `NIGHT()`**：record 寫的 `k: 0.24` 只有 `lightAt` 用，
      加法光暈全功率常亮。r=500 的燈離鏡頭 145 單位 → 螢幕半徑 2572 px，整幀泡在裡面。
- **haze 和夜色共用 0.6 上限，夜色就永遠不可能發生**：遠岸 z 2030 的 haze 已 0.393，
      夜色只剩 0.207。改成疊乘後若仍卡 0.6，算出來 = 0.599，跟原本 0.206 一模一樣——
      **瓶頸是上限不是公式**。所以拆成 `AIR_MAX 0.6` + `NIGHT_MAX 0.72` 兩個上限。
- **「有沒有畫出來」一定要跑對照組**：提燈那次量到「只差 10–120 px」就斷定看不見，
      其實是因為我空的名單是幽靈名單；真名單量出來是 +45k/+59k，完全相反。
      「有 vs 沒有」才是量測，「有多少」不是。
- **立面會一次爆掉**：車站量到 246/255，原因是底色太亮＋窗戶夜間 84% 不透明＋建築自己的
  glow 疊在檯面 glow 上。分開量三次才拆出來。
