import { describe, expect, it } from 'vitest';
import { buildSragQueryParams } from '../../src/service/srag/sragFilters';

describe('buildSragQueryParams', () => {
  it('maps front filters to backend params', () => {
    expect(
      buildSragQueryParams({ year: '2024', agent: 'COVID', bairro: 'CENTRO', classi: '5' }),
    ).toBe('years=2024&agents=COVID&bairros=CENTRO&classi=5');
  });

  it('omits empty filters', () => {
    expect(buildSragQueryParams({})).toBe('');
    expect(buildSragQueryParams({ year: '', agent: '', bairro: '', classi: '' })).toBe('');
  });

  it('encodes special characters', () => {
    expect(buildSragQueryParams({ bairro: 'AREA RURAL DE MOSSORO' })).toBe(
      'bairros=AREA+RURAL+DE+MOSSORO',
    );
  });

  it('appends base de análise', () => {
    expect(buildSragQueryParams({ base: 'confirmados' })).toBe('base=confirmados');
  });

  it('appends gravidade', () => {
    expect(buildSragQueryParams({ gravidade: 'uti' })).toBe('gravidade=uti');
  });

  it('appends one query param per sintoma selecionado', () => {
    expect(buildSragQueryParams({ sintomas: ['febre', 'tosse'] })).toBe(
      'sintomas=febre&sintomas=tosse',
    );
  });

  it('omits sintomas when list is empty', () => {
    expect(buildSragQueryParams({ sintomas: [] })).toBe('');
  });

  it('combines every filter together', () => {
    expect(
      buildSragQueryParams({
        year: '2024',
        agent: 'COVID',
        bairro: 'CENTRO',
        classi: '5',
        base: 'confirmados',
        gravidade: 'uti',
        sintomas: ['febre', 'tosse'],
      }),
    ).toBe(
      'years=2024&agents=COVID&bairros=CENTRO&classi=5&base=confirmados&gravidade=uti&sintomas=febre&sintomas=tosse',
    );
  });
});
