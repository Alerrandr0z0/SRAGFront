// Registro enxuto do ECharts: só o que os gráficos analíticos usam. Este
// módulo só é importado pela página lazy "Gráficos analíticos", então o
// ECharts não pesa no carregamento das demais páginas.
import { BarChart, CustomChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  CustomChart,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export type { EChartsCoreOption } from 'echarts/core';
export { echarts };
