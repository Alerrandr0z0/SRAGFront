import { NavLink } from 'react-router-dom';
import Logo from '../../images/logo/Logo.png';
import DarkModeSwitcher from './DarkModeSwitcher';
import DropdownUser from './DropdownUser';

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center px-4 py-3 shadow-2 md:px-6 2xl:px-11">
        {/* Hamburguer — mobile */}
        <div className="flex items-center lg:hidden">
          <button
            type="button"
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark"
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && '!w-full delay-300'}`}
                />
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && 'delay-400 !w-full'}`}
                />
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && '!w-full delay-500'}`}
                />
              </span>
              <span className="absolute right-0 h-full w-full rotate-45">
                <span
                  className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && '!h-0 !delay-[0]'}`}
                />
                <span
                  className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && '!h-0 !delay-200'}`}
                />
              </span>
            </span>
          </button>
        </div>

        {/* Logo + nome — centro absoluto para não depender dos vizinhos */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img src={Logo} alt="Logo Prefeitura" className="h-9 w-auto" />
            <span className="text-xl font-bold text-black dark:text-white whitespace-nowrap">
              SRAG · SIVEP-Gripe
            </span>
          </NavLink>
        </div>

        {/* Ações — direita */}
        <div className="ml-auto flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <DarkModeSwitcher />
          </ul>
          <DropdownUser />
        </div>
      </div>
    </header>
  );
};

export default Header;
