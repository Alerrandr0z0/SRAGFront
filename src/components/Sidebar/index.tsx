import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (arg: boolean) => void;
}

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
}: SidebarProps) => {
  const { isAdmin } = useAuth();

  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);

  // Fecha ao clicar fora (mobile)
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      const node = target as Node | null;
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(node) || trigger.current.contains(node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // Fecha ao pressionar Esc (mobile)
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  function toggleCollapse() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', next.toString());
  }

  // Classes reutilizáveis para cada item de navegação
  // O "recolhido" (só ícones) é um recurso de desktop → escopar ao breakpoint lg.
  // No menu flutuante (mobile/zoom) os itens sempre mostram texto e alinhamento normal.
  const navItem = (isActive: boolean) =>
    `group relative flex items-center rounded-sm py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
      sidebarCollapsed ? 'gap-2.5 px-4 lg:justify-center lg:gap-0 lg:px-2' : 'gap-2.5 px-4'
    } ${isActive ? 'bg-graydark dark:bg-meta-4' : ''}`;

  const label = (text: string) => (
    <span
      className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'opacity-100'
      }`}
    >
      {text}
    </span>
  );

  const tip = (text: string) => (sidebarCollapsed ? text : undefined);

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen flex-col overflow-x-hidden overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarCollapsed ? 'lg:w-16' : 'w-72.5'
      } ${sidebarOpen ? 'translate-x-0 w-72.5' : '-translate-x-full'}`}
    >
      {/* ── Header da sidebar ── */}
      <div className="flex items-center justify-between px-3 pt-5.5 pb-4 lg:pt-6.5 border-b border-strokedark">
        {/* Botão colapso — desktop */}
        <button type="button"
          onClick={toggleCollapse}
          title={sidebarCollapsed ? 'Expandir menu' : 'Menu'}
          className={`hidden lg:flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-bodydark2 hover:bg-graydark hover:text-white transition-all duration-200 ${
            sidebarCollapsed ? 'w-full justify-center' : ''
          }`}
        >
          <svg aria-hidden="true"
            className={`shrink-0 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
          {!sidebarCollapsed && <span>Menu</span>}
        </button>

        {/* Botão fechar — mobile */}
        <button type="button"
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="flex lg:hidden ml-auto items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-bodydark2 hover:bg-graydark hover:text-white transition-all duration-200"
        >
          <svg aria-hidden="true" className="fill-current shrink-0" width="20" height="18" viewBox="0 0 20 18">
            <path
              d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
              fill=""
            />
          </svg>
          <span>Fechar</span>
        </button>
      </div>

      {/* ── Menu ── */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-2 py-4 px-2 lg:mt-4">
          {/* SIVEP-GRIPE */}
          <div className="pt-2">
            <h3
              className={`mb-2 ml-2 text-xs font-semibold text-bodydark2 uppercase whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarCollapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0' : 'opacity-100'
              }`}
            >
              SIVEP-Gripe
            </h3>

            <ul className="flex flex-col gap-1.5">
              <li>
                <NavLink
                  to="/"
                  end
                  title={tip('Vigilância')}
                  className={({ isActive }) => navItem(isActive)}
                >
                  <svg aria-hidden="true" className="fill-current shrink-0" width="18" height="18" viewBox="0 0 18 18">
                    <path
                      d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.72817C7.8751 1.7438 7.0876 0.956299 6.10322 0.956299ZM6.60947 6.30005C6.60947 6.5813 6.38447 6.8063 6.10322 6.8063H2.53135C2.2501 6.8063 2.0251 6.5813 2.0251 6.30005V2.72817C2.0251 2.44692 2.2501 2.22192 2.53135 2.22192H6.10322C6.38447 2.22192 6.60947 2.44692 6.60947 2.72817V6.30005Z"
                      fill=""
                    />
                    <path
                      d="M15.4689 0.956299H11.8971C10.9408 0.956299 10.1533 1.7438 10.1533 2.70005V6.27192C10.1533 7.22817 10.9408 8.01567 11.8971 8.01567H15.4689C16.4252 8.01567 17.2127 7.22817 17.2127 6.27192V2.72817C17.2127 1.7438 16.4252 0.956299 15.4689 0.956299ZM15.9752 6.30005C15.9752 6.5813 15.7502 6.8063 15.4689 6.8063H11.8971C11.6158 6.8063 11.3908 6.5813 11.3908 6.30005V2.72817C11.3908 2.44692 11.6158 2.22192 11.8971 2.22192H15.4689C15.7502 2.22192 15.9752 2.44692 15.9752 2.72817V6.30005Z"
                      fill=""
                    />
                    <path
                      d="M6.10322 9.92822H2.53135C1.5751 9.92822 0.787598 10.7157 0.787598 11.672V15.2438C0.787598 16.2001 1.5751 16.9876 2.53135 16.9876H6.10322C7.05947 16.9876 7.84697 16.2001 7.84697 15.2438V11.7001C7.8751 10.7157 7.0876 9.92822 6.10322 9.92822ZM6.60947 15.272C6.60947 15.5532 6.38447 15.7782 6.10322 15.7782H2.53135C2.2501 15.7782 2.0251 15.5532 2.0251 15.272V11.7001C2.0251 11.4188 2.2501 11.1938 2.53135 11.1938H6.10322C6.38447 11.1938 6.60947 11.4188 6.60947 11.7001V15.272Z"
                      fill=""
                    />
                    <path
                      d="M15.4689 9.92822H11.8971C10.9408 9.92822 10.1533 10.7157 10.1533 11.672V15.2438C10.1533 16.2001 10.9408 16.9876 11.8971 16.9876H15.4689C16.4252 16.9876 17.2127 16.2001 17.2127 15.2438V11.7001C17.2127 10.7157 16.4252 9.92822 15.4689 9.92822ZM15.9752 15.272C15.9752 15.5532 15.7502 15.7782 15.4689 15.7782H11.8971C11.6158 15.7782 11.3908 15.5532 11.3908 15.272V11.7001C11.3908 11.4188 11.6158 11.1938 11.8971 11.1938H15.4689C15.7502 11.1938 15.9752 11.4188 15.9752 11.7001V15.272Z"
                      fill=""
                    />
                  </svg>
                  {label('Vigilância')}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/dashboard/sociodemografica"
                  title={tip('Sociodemográfico')}
                  className={({ isActive }) => navItem(isActive)}
                >
                  <svg aria-hidden="true" className="fill-current shrink-0" width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                      fill=""
                    />
                  </svg>
                  {label('Sociodemográfico')}
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Separador */}
          <div className="my-3 border-t border-white opacity-20" />

          {/* OUTROS */}
          <div>
            <h3
              className={`mb-2 ml-2 text-xs font-semibold text-bodydark2 uppercase whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarCollapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0' : 'opacity-100'
              }`}
            >
              OUTROS
            </h3>

            <ul className="flex flex-col gap-1.5">
              {isAdmin && (
                <li>
                  <NavLink
                    to="/dashboard/gerenciar"
                    title={tip('Gerenciar Dados')}
                    className={({ isActive }) => navItem(isActive)}
                  >
                    <svg aria-hidden="true"
                      className="fill-current shrink-0"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
                        fill=""
                      />
                    </svg>
                    {label('Gerenciar Dados')}
                  </NavLink>
                </li>
              )}
              {isAdmin && (
                <li>
                  <NavLink
                    to="/usuarios"
                    title={tip('Gerenciar Usuários')}
                    className={({ isActive }) => navItem(isActive)}
                  >
                    <svg aria-hidden="true"
                      className="fill-current shrink-0"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        fill=""
                      />
                    </svg>
                    {label('Gerenciar Usuários')}
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
