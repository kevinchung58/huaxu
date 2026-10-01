# TODO — 使用者的問題、需求與現況（給下一個接手的 LLM）

> 本檔是與使用者對話的工作記憶。最後更新：2026-10-01 · 站點零依賴、純靜態、所有 HTML 由 `_gen_html.py` 產生。

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
