# 手機點餐系統 (商業級 MVP)

## 專案簡介
以 **Next.js + Prisma + PostgreSQL** 建置的完整餐飲手機點餐平台，包含：顧客點餐、後台管理、廚房看板、報表分析與 RBAC。

## 技術棧
- Frontend/Backend: Next.js 14 + TypeScript (App Router + Route Handlers)
- UI: Tailwind CSS + Recharts
- DB: PostgreSQL
- ORM: Prisma
- Auth: JWT (admin)
- Validation: Zod
- Testing: Vitest
- Deploy: Docker / docker-compose

## 架構設計與取捨
- 使用單體 Next.js 減少跨服務溝通成本，快速交付商業 MVP。
- 透過 `lib/services` 與 `lib/validators` 分層，後續可抽離成獨立 NestJS 服務。
- 即時看板目前採 polling（5 秒），務實、穩定、部署成本低，後續可升級 WebSocket。

## 目錄結構
- `app/customer/*`: 顧客端點餐流程
- `app/admin/*`: 後台管理頁
- `app/kitchen/*`: 現場看板
- `app/api/*`: REST API
- `lib/auth|services|validators`: 核心商業邏輯
- `prisma/schema.prisma`: DB schema
- `prisma/seed.ts`: 種子資料

## 安裝方式
```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Docker 啟動
```bash
docker-compose up --build
```

## 環境變數
請參考 `.env.example`。

## DB migration / seed
```bash
npm run prisma:migrate
npm run prisma:seed
```

## 測試
```bash
npm run lint
npm run typecheck
npm run test
```

## 預設帳號
- admin: `admin@demo.com`
- password: `Admin123!`

## 系統流程
1. 顧客掃 QR 進 `/customer/menu?storeSlug=demo-store`
2. 加入購物車 → 結帳送出 `/api/orders`
3. 廚房看板 `/kitchen` 依狀態流轉 NEW → PREPARING → COMPLETED/CANCELLED
4. 後台可管理商品/分類/訂單/桌號/人員與查看報表
