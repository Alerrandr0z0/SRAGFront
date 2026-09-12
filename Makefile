# SRAGFront — toolchain (Biome + tsc + Vitest + Vite)

.PHONY: help setup dev build preview lint format fix typecheck test test-unit check clean

help:
	@echo "SRAGFront"
	@echo "  setup      Instala dependências"
	@echo "  dev        Vite dev server"
	@echo "  build      Build de produção (dist/)"
	@echo "  preview    Serve o build localmente"
	@echo "  lint       Biome lint"
	@echo "  format     Biome format (escreve)"
	@echo "  fix        Biome check --write + tsc"
	@echo "  typecheck  tsc --noEmit"
	@echo "  test       Vitest (todos)"
	@echo "  test-unit  Vitest (tests/unit)"
	@echo "  check      lint + typecheck + test-unit"
	@echo "  clean      Remove dist e node_modules"

setup:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

format:
	npm run format

fix:
	npm run fix

typecheck:
	npm run typecheck

test:
	npm run test

test-unit:
	npm run test:unit

check:
	npm run check

clean:
	rm -rf dist node_modules
