import { useCallback, useEffect, useRef } from 'react';
import { type EChartsCoreOption, echarts } from './echartsCore';
import { fitOptionToWidth } from './responsiveOption';

/** Cria a instância ECharts no elemento retornado e aplica `option` quando muda. */
export default function useECharts(option: EChartsCoreOption | null) {
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);
  const optionRef = useRef<EChartsCoreOption | null>(null);
  const widthRef = useRef(0);

  const apply = useCallback(() => {
    const chart = chartRef.current;
    if (chart && optionRef.current) {
      chart.setOption(fitOptionToWidth(optionRef.current, widthRef.current), true);
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const chart = echarts.init(element);
    chartRef.current = chart;
    widthRef.current = element.clientWidth;
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
      const previous = widthRef.current;
      widthRef.current = element.clientWidth;
      if (previous !== widthRef.current) apply();
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [apply]);

  useEffect(() => {
    optionRef.current = option;
    if (option) apply();
  }, [option, apply]);

  return elementRef;
}
