// Registro enxuto do ECharts: só o que os gráficos analíticos usam. Este
// módulo só é importado pela página lazy "Gráficos analíticos", então o
// ECharts não pesa no carregamento das demais páginas.
import { BarChart, CustomChart, HeatmapChart, LineChart, SankeyChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  SankeyChart,
  HeatmapChart,
  CustomChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

export type { EChartsCoreOption } from 'echarts/core';
export { echarts };
