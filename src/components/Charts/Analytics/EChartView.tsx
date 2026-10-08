import type { EChartsCoreOption } from './echartsCore';
import useECharts from './useECharts';

interface EChartViewProps {
  option: EChartsCoreOption | null;
  height: number;
  ariaLabel: string;
}

export default function EChartView({ option, height, ariaLabel }: EChartViewProps) {
  const elementRef = useECharts(option);
  return (
    <div ref={elementRef} role="img" aria-label={ariaLabel} style={{ width: '100%', height }} />
  );
}
