import type React from 'react';

interface HelpTooltipProps {
  text: string;
}

/*Ícone "?" que mostra uma mensagem explicativa ao passar o mouse */
const HelpTooltip: React.FC<HelpTooltipProps> = ({ text }) => {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Mais informações"
        className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-white outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        ?
      </button>
        <span
            role="tooltip"
            className="pointer-events-none absolute top-full right-0 z-50 mt-2 hidden w-96 rounded border border-stroke bg-white p-3 text-left text-sm font-normal normal-case leading-relaxed text-black shadow-default group-hover:block group-focus-within:block dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
            {text}
      </span>
    </span>
  );
};

export default HelpTooltip;