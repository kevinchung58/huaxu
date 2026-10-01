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

## 1. 需求總表與現況

| # | 需求 | 現況 | 交付 |
|---|------|------|------|
| 1 | 樞紐街道＋各房自由進出 | ✅ | 早期 commits |
| 2 | 相簿＝一個容器三張卡、卡即門 | ✅ | 早期 commits |
| 3 | 走出房門落在街上該房門口、街加長有路程 | ✅ | 本輪 |
| 4 | Canada 房改成 Toronto（Little Canada 式：景點/瀑布/市場） | ✅ | 本輪 |
| 5 | 門真美術、walk guide、HUD 無字等合約 | ✅ 維持 | — |

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

- Toronto 暗廳的固定視角截圖不容易帶到 CN Tower（它在城市桌、靠左、進門時在視角外）；真機可以拖曳轉頭，e2e 已驗證幾何與可達性。若使用者覺得「進門看不到塔」，可把城市桌往街心/深處搬，或加一個朝它的 station。
- 迷你比例靠 record 的 `w/h/d` override；新形狀必須在 `js/site.js` 的 SHAPE/PROP_TINT 有 entry，否則落回平面。
