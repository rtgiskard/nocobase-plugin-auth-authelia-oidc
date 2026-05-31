FROM node:22-alpine AS build

WORKDIR /src
COPY package.json package-lock.json tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
COPY README.md ./README.md
RUN npm ci && npm run build

FROM alpine:3.22

WORKDIR /plugin/@nocobase/plugin-auth-oidc-external
COPY --from=build /src/package.json ./package.json
COPY --from=build /src/README.md ./README.md
COPY --from=build /src/server.js ./server.js
COPY --from=build /src/server.d.ts ./server.d.ts
COPY --from=build /src/client-v2.js ./client-v2.js
COPY --from=build /src/client-v2.d.ts ./client-v2.d.ts
COPY --from=build /src/dist ./dist
