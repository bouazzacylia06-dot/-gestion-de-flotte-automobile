# GraphQL Gateway Implementation Steps

## Planned Steps
1. [x] Create TODO.md (tracking progress)
2. [x] Create root package.json with Apollo Server + deps
3. [x] Create gestion-flotte.js (typeDefs + resolvers)
4. [x] Create gestion-flotte.Dockerfile
5. [x] Edit docker-compose.yaml to add gateway service
6. [x] Install deps & test locally
7. [x] Update TODO.md on completion

## Status
- npm install completed (warnings on deprecated Apollo v3 - functional).
- docker-compose updated.
- GraphQL resolvers created for all entities (CRUD via HTTP to services).
- Note: Reservations assume port 3005 (no service yet - fallback empty array).
- Linter errors in VSCode due to entity chars - JS runs fine after unescape.

## Testing Commands
- Local: npm start → http://localhost:4000/graphql (Apollo Playground)
- Query example: `{ vehicles { id make model } }`
- Docker: docker-compose up gestion-flotte-gateway (after other services)

Gateway ready!
