import { describe, expect, it } from 'vitest';
import type { NotifyingUnit } from '../../src/service/srag/sragAnalytics';
import {
  filterUnits,
  normalizeText,
  paginate,
  sortUnits,
} from '../../src/pages/Dashboard/analiticos/unitsTable';

const unit = (name: string, total: number, cure = 0, death = 0, id = name): NotifyingUnit => ({
  id_unidade: id,
  name,
  total,
  cure,
  death,
  other: total - cure - death,
});

const units = [
  unit('HOSPITAL SÃO LUIZ', 421, 248, 173, '2409'),
  unit('UPA RAIMUNDO FRANCO', 182, 56, 116, '7771'),
  unit('CENTRO MEDICO RODOLFO', 140, 120, 20, '6620'),
];

describe('normalizeText', () => {
  it('ignora acento e caixa', () => {
    expect(normalizeText('São LUIZ')).toBe('sao luiz');
  });
});

describe('filterUnits', () => {
  it('devolve tudo sem busca', () => {
    expect(filterUnits(units, '   ')).toHaveLength(3);
  });

  it('acha pelo nome sem depender de acento ou caixa', () => {
    expect(filterUnits(units, 'sao luiz').map((item) => item.id_unidade)).toEqual(['2409']);
  });

  it('acha pelo código CNES', () => {
    expect(filterUnits(units, '7771').map((item) => item.name)).toEqual(['UPA RAIMUNDO FRANCO']);
  });

  it('devolve vazio quando nada combina', () => {
    expect(filterUnits(units, 'xyz')).toEqual([]);
  });
});

describe('sortUnits', () => {
  it('ordena números do maior ao menor', () => {
    expect(sortUnits(units, 'death', 'desc').map((item) => item.death)).toEqual([173, 116, 20]);
  });

  it('ordena por nome em ordem alfabética', () => {
    expect(sortUnits(units, 'name', 'asc').map((item) => item.name)).toEqual([
      'CENTRO MEDICO RODOLFO',
      'HOSPITAL SÃO LUIZ',
      'UPA RAIMUNDO FRANCO',
    ]);
  });

  it('desempata pelo nome e não altera a lista original', () => {
    const tied = [unit('B', 10), unit('A', 10)];
    expect(sortUnits(tied, 'total', 'desc').map((item) => item.name)).toEqual(['A', 'B']);
    expect(tied.map((item) => item.name)).toEqual(['B', 'A']);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 23 }, (_, index) => index);

  it('devolve a primeira página', () => {
    const page = paginate(items, 0, 10);
    expect(page.rows).toHaveLength(10);
    expect([page.from, page.to, page.pages]).toEqual([1, 10, 3]);
  });

  it('devolve a última página, mais curta', () => {
    const page = paginate(items, 2, 10);
    expect(page.rows).toEqual([20, 21, 22]);
    expect([page.from, page.to]).toEqual([21, 23]);
  });

  it('limita páginas fora do intervalo', () => {
    expect(paginate(items, 99, 10).page).toBe(2);
    expect(paginate(items, -3, 10).page).toBe(0);
  });

  it('lida com lista vazia', () => {
    const page = paginate([], 0, 10);
    expect([page.rows.length, page.from, page.to, page.pages]).toEqual([0, 0, 0, 1]);
  });
});
