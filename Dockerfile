FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@latest-10

FROM base AS build
COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=server --prod /prod/server
RUN pnpm deploy --filter=ui --prod /prod/ui

FROM base AS server
COPY --from=build /prod/server /prod/server
WORKDIR /prod/server
EXPOSE 8000
CMD [ "node", "build/main.js" ]

FROM base AS ui
COPY --from=build /prod/ui /prod/ui
WORKDIR /prod/ui
EXPOSE 3000
CMD [ "pnpm", "start" ]