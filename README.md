# Order System（Next.js + Prisma + PostgreSQL）

手機點餐系統 MVP，包含：
- customer 點餐流程（menu/cart/checkout）
- customer 掃碼入桌 + 我的訂單（單筆詳情、狀態自動重新整理）
- kitchen 現場看板
- admin 管理後台（RBAC）
- dashboard / reports 統計

## 1) 需求環境

- Node.js 20+（建議 22）
- npm 10+
- PostgreSQL 16（或使用 Docker）

## 2) 快速啟動（本機開發）

### Step A. 安裝相依套件

```bash
npm install
```

### Step B. 設定環境變數

```bash
cp .env.example .env
```

若使用 docker-compose 內建 DB，可直接沿用 .env.example 的 `DATABASE_URL`。

### Step C. 啟動 PostgreSQL

你可以擇一：

1. 本機 PostgreSQL（自行啟動服務）
2. Docker 啟動 DB（建議）

```bash
docker compose up -d db
```

### Step D. Prisma 初始化

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Step E. 啟動專案

```bash
npm run dev
```

預設網址：
- customer menu: `http://localhost:3000/customer/menu?storeSlug=demo-store`
- admin login: `http://localhost:3000/login`
- kitchen board: `http://localhost:3000/kitchen`

## 3) Docker 一次啟動（db + app + 反向代理）

```bash
docker compose up --build
```

說明：
- compose 會先等 DB healthy，再啟 app
- proxy（Nginx）會反向代理到 app，提供手機區網連線入口
- app 啟動時會執行：generate → migrate deploy → seed → start

手機連線網址：
- 同一 Wi-Fi 下，使用 `http://你的電腦IP:8080`
- 例如：`http://192.168.1.23:8080`

可用此命令查電腦 IP（Windows PowerShell）：

```powershell
ipconfig
```

對外反向代理設定位置：
- [infra/nginx/default.conf](infra/nginx/default.conf)

> 注意：若 Docker Desktop / Docker Engine 沒有啟動，`8080` 反向代理不會存在，手機會顯示無法連線。

### Docker 無法使用時（手機測試替代方案）

可改用 Next.js 直接對外監聽：

```bash
npm run dev:lan
```

然後手機改連：
- `http://你的電腦IP:3000`

容器主要環境變數（於 [docker-compose.yml](docker-compose.yml)）：
- `DATABASE_URL=postgresql://order_user:order_pass@db:5432/order_system?schema=public`
- `JWT_SECRET=super-secret`
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- `NEXT_PUBLIC_DEMO_STORE_ID`（可留空）
- `NEXT_PUBLIC_DEMO_TABLE_ID`（可留空）

## 4) 預設帳號

- Email: `admin@demo.com`
- Password: `Admin123!`

## 5) 常用指令

```bash
npm run dev
npm run typecheck
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## 6) Seed 說明（可重複執行）

- [prisma/seed.ts](prisma/seed.ts) 為重建型 seed：每次先清空示範資料再重建。
- 可重複執行，不會累積重複資料。
- 結束時會輸出 `storeId` 與 `sampleTableId`，可視需求填到 .env：
	- `NEXT_PUBLIC_DEMO_STORE_ID`
	- `NEXT_PUBLIC_DEMO_TABLE_ID`

## 7) 目錄概覽

- [app/customer](app/customer) customer 端頁面
- [app/customer/scan](app/customer/scan) QRCode 掃描頁
- [app/customer/orders](app/customer/orders) 我的訂單（含單筆詳情）
- [app/admin](app/admin) admin 頁面
- [app/kitchen](app/kitchen) kitchen 看板
- [app/api](app/api) API
- [lib/services](lib/services) 業務 service
- [lib/validators](lib/validators) validator
- [prisma/schema.prisma](prisma/schema.prisma) 資料模型

## 8) 疑難排解

### Prisma P1001（連不到 DB）

- 確認 PostgreSQL 有啟動
- 檢查 `.env` 的 `DATABASE_URL`
- 若用 Docker，先執行：

```bash
docker compose ps
docker compose logs db
```

### migration 失敗

- 先確認 schema 正確
- 再執行：

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 型別錯誤檢查

```bash
npx tsc --noEmit
```

### QRCODE 掃描無法使用

- 若桌機瀏覽器沒有相機、或未允許相機權限，請改用手機開啟掃描頁。
- 手機建議先透過反向代理網址進入（`http://你的電腦IP:8080/customer/scan?storeSlug=demo-store`）。
- 若你目前使用 `dev:lan`，請改用 `http://你的電腦IP:3000/customer/scan?storeSlug=demo-store`。
- 若仍無法掃描，可先用手動輸入桌號（例如 `A1` 或 `TABLE:A1`）。
