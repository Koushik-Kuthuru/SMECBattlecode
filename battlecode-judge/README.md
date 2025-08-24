# BattleCode Mini Judge
A minimal but secure custom judge (Node + Docker + Redis).

## Run
- Install Docker & Docker Compose
- `docker compose up --build`
- API: `http://localhost:8080/api`

## Endpoints
- `GET /api/health`
- `GET /api/problems` — list
- `GET /api/problems/:id` — single
- `POST /api/problems` — create/update (send full JSON)
- `POST /api/submit` — { problemId, language, code }
- `GET /api/result/:id` — job state + result
