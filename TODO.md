# TODO — 使用者的問題、需求與現況（給下一個接手的 LLM）

> 本檔是與使用者對話的工作記憶。**先讀 §0**：使用者仍認為「有些需求沒做到」，尚未確認具體是哪一項——接手後第一件事是跟使用者把 §0 討論清楚，再動手改東西。
> 最後更新：2026-09-30 · HEAD `64b0d5f`（已 push 到 `arena/01a0d7c8-huaxu`）· 站點零依賴、純靜態、所有 HTML 由 `_gen_html.py` 產生。

## 0. 最優先：與使用者確認「還有哪個需求沒做到」

使用者最新回饋（原話大意）：

> 「The album 你這邊這樣有點問題……你這邊應該是 3 個卡片在一個容器然後她變成一個點進去就可以到房間的做法，你這邊設計互動有問題。」
> 「回顧一下當前的問題，我覺得我的需求你有些沒做到。」

事實查核結果（接手前先知道）：

- origin 上的程式碼**已經是**「一個容器、三張卡、卡片本體即門」：`activities.html` 含 `<div class="place-cards" data-place-cards>`，內有三張 `<a class="place-card" href="房間頁">`；整張卡是一個連結，點卡片任何地方直接換頁進房間。沒有檢視器、沒有下方第二道文字門、封面磚不進相簿捲軸（commit `2f6b734`）。
- 使用者看到舊版的最可能原因：**sandbox 會在回合之間把檔案還原成舊快照**（實測過 8080 曾送出無卡片的舊頁、`_gen_html.py` 檔尾被拼壞），加上 HTML 頁無 cache-buster，瀏覽器快取也會給舊頁。
- 已修掉的殘留（commit `64b0d5f`）：相簿開頭文案不再描述已移除的捲軸檢視器；空 classroom 架子的說明不再重複兩次。

**未解**：使用者仍覺得有需求沒被滿足，但還沒指出具體是哪一項。接手後用決策層級的問題問清楚（勿問低階技術細節），候選方向：

1. **看到的還是舊畫面嗎？** 請使用者 Ctrl+Shift+R 後描述看到的卡片外觀與點擊行為，最好給截圖。
2. **「點進去就到房間」是指同頁內嵌嗎？** 目前點卡片是換頁到 `rooms*.html`；若使用者要的是 activities 頁內直接走進房間（不換頁），那是新的互動架構，需先確認再動工。
3. **卡片夠不夠「像一扇門」？** 目前是紙卡＋封面圖＋「Walk into X →」，不是真的把卡片畫成門的美術。
4. **classroom 空架可以嗎？** 目前誠實空架（0 shown · 3 held for want of a caption），素材（日期/場地）等 owner 提供，禁止編造。

## 1. 需求總表與現況

| # | 需求（使用者語意） | 現況 | 交付 |
|---|------|------|------|
| 1 | 樞紐式街道＋三房自由進出（不是線性鏈） | ✅ | `acca84e` |
| 2 | Field notes 三地一門（Canada / Tokyo / Fukuoka） | ✅ | `ea60d3d` |
| 3 | skills／AGENTS.md 措辭同步 | ✅（卡片化後已改「one container of three cards, the card itself the door」） | `acca84e`、`71f88df`、`2f6b734` |
| 4 | 街尾 GTA 式開放、可以一直走出去（夜空曠野） | ✅ | `71f88df` |
| 5 | The album 只放三張代表圖；支領域 12 張圖只在房內牆上 | ✅（後進一步演進為三卡） | `71f88df` → `2f6b734` |
| 6 | 第一次訪客看得懂操作（walk guide 說明） | ✅ | `e9550fd` |
| 7 | 門要有真美術（框/嵌板/把手/扇窗/門檻）；互動分散四地不集中一房 | ✅ | `b463ac2` |
| 8 | 相簿 Field notes＝**一個容器裝三張卡片、點卡片本體直接進房間**；否決「圖磚開檢視器＋下方文字門」雙互動 | ✅ 程式碼已如此；**使用者體感未確認（見 §0）** | `2f6b734`＋`64b0d5f` |
| 9 | 把使用者的問題/需求/現況完整寫成 TODO 交給下一個 LLM | ✅ 本檔 | 本 PR |

## 2. 環境陷阱（接手必讀）

- **sandbox 會在回合之間還原檔案、重置 commit 歷史**。每次動手前先 `git fetch origin arena/01a0d7c8-huaxu` 比對；本地分歧時：工作樹髙亂且 origin 為真源 → `git reset --hard FETCH_HEAD`；本地有未推工作 → `git reset --soft FETCH_HEAD` 後重新 commit（push 前後用 `md5sum *.html` 比對樹不變）。
- **server 每輪之間會被清掉**。用前先驗：`curl -s http://127.0.0.1:8080/activities.html | md5sum` 對照工作樹；重啟：`python3 -m http.server 8080 --bind 0.0.0.0`（cwd = repo root）。bind 0.0.0.0 供預覽代理。
- **HTML 頁無 cache-buster**（只有 css/js 有 VER，由 sha1 導出，**禁止手動 bump**）→ 每次請使用者 Ctrl+Shift+R。
- node_modules 不持久，每次重裝：`npm i --no-save jsdom @napi-rs/canvas impeccable@4.1.0`。一次性 jsdom 探針要放 `.verify/` 下（放 /tmp 會 ERR_MODULE_NOT_FOUND）；剝外部 script 後要 `w.eval(js)`；`[data-walk].__walk` 需等約 900ms。
- playwright 不可用。驗證必須「真的操控」：jsdom 鍵盤 harness＋`@napi-rs/canvas` 真光柵截圖，並如實回報。
- patch 檔案時 assert 要先於 write；先讀實際原始碼再定錨（錨點會因前輪改動過期）。

## 3. 硬性約束

- 與使用者以**繁體中文**溝通；站內內容保持英文。
- 所有 `*.html` 由 `_gen_html.py` 產生，**禁止手編 HTML**；改完跑 `python3 _gen_html.py` 並驗冪等（連跑兩次 md5 不變）。
- 站點零依賴（無 framework、無 build step）；node_modules 已 gitignore。
- WebKit 3D 規則：`preserve-3d` 僅允許在 `.room-world` 與 `.ig-grid`。
- 保持 `.impeccable/config.json` 0 findings；真實缺陷修進程式，不靠 ignore。
- IMG/ 是 registry 不是資料夾；ref/ 不進 commit；相片不加 lettering、不畫路人。
- Backlog（CV PDF、ORCID、corresponding-author、classroom 三張 held 圖的日期/場地）等 owner 素材，**禁止編造**。

## 4. 驗證指令與目前數據（`64b0d5f` 樹）

- `node .verify/verify-walk.mjs` → **166/166**（fills 4520 < ceiling 4700）
- `node .verify/verify-chain.mjs` → **0 failures**
- `node .verify/verify-rooms-e2e.cjs` → **0 failures**
- `env ROOMS=<page> node .verify/lane-shot.mjs <out>` → street 8 / canada 7 / rooms 7 / fukuoka 7 PASS
- `npx impeccable detect .` → **0 findings**；`python3 _gen_html.py` 連跑兩次 → **IDEMPOTENT**

## 5. 相簿新契約（現行實作，§0 未解前勿再動架構）

- `<div class="place-cards" data-place-cards>` 一個容器；三張 `<a class="place-card reveal" data-place-card="{rid}" href="{page}">`；ROOMS 序 canada→`rooms-canada.html`、tokyo→`rooms.html`、fukuoka→`rooms-fukuoka.html`。
- 卡片＝`.place-card-media`（`IMG/{rid}-cover.jpg`＋poster attrs）＋`.place-card-body`（strong 地名／`.when` 一行註記／`.place-card-go`「Walk into X →」）。點卡片任何地方＝換頁進房。
- 相簿捲軸不發射（0 frames）；classroom 誠實空架（0 shown · 3 held）。
- 常數：walk-z 348/870/1102、e2e 290/810/1040、max_d 2400、Z_SCALE 2.9、REACH 190、EYE 168、NEAR 24。
- 驗證斷言已鎖定此契約：verify-walk §7（容器/三卡/順序/各帶封面/無磚無箭頭門）＋verify-chain。
