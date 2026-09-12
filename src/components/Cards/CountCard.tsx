interface CountCardProps {
  title: string;
  count: number | string;
}

export const CountCard: React.FC<CountCardProps> = ({ title, count }) => {
  return (
    <div className="border-l-4 border-indigo-500 text-lg flex flex-col justify-between gap-2 px-3 rounded-md text-black dark:text-white grow bg-white dark:bg-boxdark p-2">
      <div className="text-2xl">{title}</div>
      <div className="text-2xl">{count}</div>
    </div>
  );
};
