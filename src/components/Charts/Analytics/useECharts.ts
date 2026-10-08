import { useEffect, useRef } from 'react';
import { type EChartsCoreOption, echarts } from './echartsCore';

/** Cria a instância ECharts no elemento retornado e aplica `option` quando muda. */
export default function useECharts(option: EChartsCoreOption | null) {
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const chart = echarts.init(element);
    chartRef.current = chart;
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (option) chartRef.current?.setOption(option, true);
  }, [option]);

  return elementRef;
}
