# SRAG Front — Vigilância SIVEP-Gripe (Mossoró)

Frontend React dos dashboards de SRAG: notificações, óbitos, vacinação, território por bairro e gerenciamento de dados. Consome o `SRAGBack` (FastAPI, JWT próprio) — : autenticação, dados e PDFs vêm da API.

## Stack

React 18 + Vite 4 + TypeScript 5 (strict) + Tailwind 3 · ApexCharts · Leaflet/react-leaflet · axios · react-router-dom · react-hot-toast · flowbite-react (modais) · Biome 2 (lint/format) · Vitest 4.

## Pré-requisitos

Node 20+ e o backend em `http://127.0.0.1:8001` (ou ajuste o proxy no `vite.config.ts`).

## Setup

```bash
npm install
cp .env.example .env   # opcional; o padrão já usa /api
npm run dev            # Vite dev (default :5173), /api → 127.0.0.1:8001
```

Variáveis (`envPrefix: 'REACT_APP_'`):

| Var | Dev | Produção (Docker) |
|---|---|---|
| `REACT_APP_API_URL` | `/api` (proxy do Vite) | `/api` (proxy do nginx) |

## Verificação e build

```bash
make check   # biome lint + tsc --noEmit + vitest (tests/unit)
make build   # vite build → dist/
```

Scripts npm equivalentes: `lint`, `typecheck`, `test:unit`, `check`, `build`. Regras: Biome `recommended` + complexidade cognitiva ≤ 15, `tsc` sem erro, 19 testes unitários em `tests/unit` (filtros, mappers, chart options).

## Estrutura

```
src/
  App.tsx                 # rotas (guards em ProtectedRoute)
  main.tsx                # entry (Toaster, AuthProvider, ErrorBoundary)
  pages/                  # Dashboard/* (Vigilância, Sociodemográfica, Gerenciar), Authentication/*, Profile
  components/             # Charts/*, Maps/BairrosMap, Tables/BaseTable, Forms/SelectGroup/*, Modals/*, Header, Sidebar
  service/
    api/                  # Api.tsx (axios + refresh JWT), fetchApiData.tsx (desembrulha {data})
    srag/                 # sragClient (tipos + chamadas), sragDashboard (orquestra), sragMappers, sragChartOptions, sragFilters
  contexts/ hooks/ layout/ common/input/  # Auth, useLocalStorage/useColorMode, layouts, sanitize/cpfMask
  css/ images/logo/       # Tailwind + Satoshi (único asset: Logo.png)
```

Camadas: páginas chamam `service/srag/*` (nunca axios direto); `sragClient` espelha os endpoints do backend (`/summary`, `/trends`, `/virus`, `/citizen_bootstrap`, `/vaccination_profile`, `/territory_bootstrap`, `/clinical/*`, `/laboratory_network`, `/manage/errors`, `/reports/*`, `/ingest/*`).

## Rotas

`/` e `/dashboard/dadosGerais` (Vigilância) · `/dashboard/sociodemografica` · `/dashboard/gerenciar` (upload, com guarda `isAdmin`) · `/perfil` · `/auth/login` · `/usuarios` (ADMIN) · `/auth/registrar → /usuarios` · `* → /`.

## Deploy

`Dockerfile` (build → nginx servindo `dist/`, fallback SPA) + `.github/workflows/deploy.yml` (build/push GHCR → VPS via SSH com healthcheck).
