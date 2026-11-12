import { describe, expect, it } from 'vitest';
import { fitOptionToWidth } from '../../src/components/Charts/Analytics/responsiveOption';
import { lastItemSpan } from '../../src/components/Forms/SelectGroup/FilterBar';
import { fitColumns } from '../../src/hooks/useFitColumns';

const OPTIONS = [7, 4, 2, 1] as const;

describe('fitColumns', () => {
  it('usa uma linha só quando os sete filtros cabem', () => {
    expect(fitColumns(1200, 160, 12, OPTIONS)).toBe(7);
  });

  it('cai para 4, 2 e 1 colunas conforme a largura diminui', () => {
    expect(fitColumns(1000, 160, 12, OPTIONS)).toBe(4);
    expect(fitColumns(375, 160, 12, OPTIONS)).toBe(2);
    expect(fitColumns(200, 160, 12, OPTIONS)).toBe(1);
  });

  it('devolve a menor opção quando nada cabe', () => {
    expect(fitColumns(50, 160, 12, OPTIONS)).toBe(1);
    expect(fitColumns(0, 148, 12, [])).toBe(1);
  });
});

describe('lastItemSpan', () => {
  it('estica o último item até fechar a linha', () => {
    expect(lastItemSpan(7, 4)).toBe(2);
    expect(lastItemSpan(7, 2)).toBe(2);
    expect(lastItemSpan(7, 7)).toBe(1);
  });

  it('é 1 quando a última linha já está completa', () => {
    expect(lastItemSpan(8, 4)).toBe(1);
  });

  it('protege contra entradas inválidas', () => {
    expect(lastItemSpan(0, 4)).toBe(1);
    expect(lastItemSpan(5, 0)).toBe(1);
  });
});

describe('fitOptionToWidth', () => {
  const bars = {
    grid: { left: 300, right: 120, top: 8 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', axisLabel: { width: 284, overflow: 'truncate' } },
  };

  it('mantém a opção intacta em telas largas', () => {
    expect(fitOptionToWidth(bars, 800)).toBe(bars);
  });

  it('reduz margens e rótulos em telas estreitas', () => {
    const out = fitOptionToWidth(bars, 340) as typeof bars & {
      xAxis: { splitNumber: number };
    };
    expect(out.grid.left).toBe(129);
    expect(out.grid.right).toBe(76);
    expect(out.yAxis.axisLabel.width).toBe(117);
    expect(out.xAxis.splitNumber).toBe(3);
  });

  it('não altera o original', () => {
    fitOptionToWidth(bars, 340);
    expect(bars.grid.left).toBe(300);
  });

  it('quebra rótulos de categorias no eixo X', () => {
    const columns = { xAxis: { type: 'category', data: ['a', 'b', 'c', 'd'] }, grid: { left: 56 } };
    const out = fitOptionToWidth(columns, 340) as {
      xAxis: { axisLabel: { interval: number; overflow: string; width: number } };
      grid: { left: number };
    };
    expect(out.xAxis.axisLabel).toMatchObject({ interval: 0, overflow: 'break', width: 67 });
    expect(out.grid.left).toBe(56);
  });
});
