export interface LiraData {
  bairro: string;
  indiceInfestacaoPredial: number | null;
  indiceBreteau: number | null;
  liraNumber?: number;
  ano?: number;
}

export const indiceMedido = (valor: number | null | undefined): valor is number =>
  typeof valor === 'number' && Number.isFinite(valor);

export const resumirIndices = (dados: LiraData[]) => {
  const prediais = dados.map((d) => d.indiceInfestacaoPredial).filter(indiceMedido);
  const breteau = dados.map((d) => d.indiceBreteau).filter(indiceMedido);
  return {
    mediaPredial: prediais.length
      ? prediais.reduce((soma, indice) => soma + indice, 0) / prediais.length
      : null,
    maxPredial: prediais.length ? Math.max(...prediais) : null,
    maxBreteau: breteau.length ? Math.max(...breteau) : null,
  };
};

export const formatarIndice = (valor: number | null, percentual = false) =>
  indiceMedido(valor) ? `${valor.toFixed(2)}${percentual ? '%' : ''}` : 'Sem medição';
