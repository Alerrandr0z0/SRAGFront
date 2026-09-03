export const CICLOS_LIRA = [1, 2, 3, 4, 5, 6] as const;

export const rotuloCiclo = (n: number) => `Ciclo ${n}`;

export const rotuloCicloCompleto = (n: number, ano: number) =>
  `LIRA ${n} - Ciclo ${n} de ${ano}`;

/** Anos que já têm dados importados. Atualize quando entrar ano novo. */
export const ANOS_COM_DADOS = [2022, 2023, 2024, 2025] as const;

export const ANO_PADRAO = 2025;
