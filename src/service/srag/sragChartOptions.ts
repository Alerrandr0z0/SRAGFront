import type { ApexOptions } from 'apexcharts';

/**
 * Opções de gráficos compartilhadas pelas telas SRAG.
 */

export function sragLineOptions(): ApexOptions {
  const categories = Array.from({ length: 53 }, (_, index) => index + 1);

  return {
    legend: {
      show: false,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: ['#3C50E0', '#80CAEE', '#79C657'],
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      height: 335,
      type: 'area',
      dropShadow: {
        enabled: true,
        color: '#623CEA14',
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },

      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [2, 2],
      curve: 'straight',
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: '#fff',
      strokeColors: ['#3056D3', '#80CAEE', '#5F9E41'],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: 'category',
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      title: {
        text: 'Contagem de casos por semana epidemiologica',
        style: {
          fontSize: '16px',
        },
      },
    },
  };
}

export function sragDonutSexoOptions(): ApexOptions {
  return {
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      type: 'donut',
    },
    colors: ['#3C50E0', '#E03C3C', '#8FD0EF'],
    labels: ['Masculino', 'Feminino'],
    legend: {
      show: true,
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          background: 'transparent',
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  };
}

/** Cor fixa por agente etiológico (ordem do backend pode variar com os filtros). */
const AGENTE_COLORS: Record<string, string> = {
  VSR: '#8E44AD',
  Influenza: '#3C50E0',
  'COVID-19': '#E03C3C',
  'Outros Vírus': '#0F766E',
  'Outro Agente': '#D97706',
  'Não Especificada': '#94A3B8',
};

const AGENTE_FALLBACK = ['#80CAEE', '#6577F3', '#0EA5E9', '#F59E0B'];

export function sragDonutAgenteOptions(labels: string[]): ApexOptions {
  const base = sragDonutSexoOptions();
  const resolved = labels.length > 0 ? labels : ['Sem dados'];
  return {
    ...base,
    labels: resolved,
    colors: resolved.map((l, i) => AGENTE_COLORS[l] ?? AGENTE_FALLBACK[i % AGENTE_FALLBACK.length]),
  };
}

export function sragDonutProfileOptions(labels: string[]): ApexOptions {
  return {
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      type: 'donut',
    },
    colors: ['#3C50E0', '#0F766E', '#D97706', '#E03C3C', '#8E44AD', '#80CAEE', '#94A3B8'],
    labels,
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '11px',
      itemMargin: {
        horizontal: 6,
        vertical: 4,
      },
      markers: {
        width: 10,
        height: 10,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          background: 'transparent',
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  };
}

export function sragColumnIdadeOptions(): ApexOptions {
  return {
    colors: ['#3C50E0', '#80CAEE'],
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      type: 'bar',
      height: 335,
      stacked: true,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },

    responsive: [
      {
        breakpoint: 1536,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 0,
              columnWidth: '25%',
            },
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 0,
        columnWidth: '25%',
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    dataLabels: {
      enabled: false,
    },

    xaxis: {
      categories: [
        '0-1 ano',
        '2-4 anos',
        '5-9 anos',
        '10-14 anos',
        '15-19 anos',
        '20-29 anos',
        '30-39 anos',
        '40-49 anos',
        '50-59 anos',
        '60-69 anos',
        '70-79 anos',
        '80+ anos',
      ],
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Satoshi',
      fontWeight: 500,
      fontSize: '14px',

      markers: {
        radius: 99,
      },
    },
    fill: {
      opacity: 1,
    },
  };
}
