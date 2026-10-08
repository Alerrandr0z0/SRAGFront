// Registro enxuto do ECharts: só o que os gráficos analíticos usam. Este
// módulo só é importado pela página lazy "Gráficos analíticos", então o
// ECharts não pesa no carregamento das demais páginas.
import { CustomChart, HeatmapChart, SankeyChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  SankeyChart,
  HeatmapChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

export type { EChartsCoreOption } from 'echarts/core';
export { echarts };
