import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MENU = [
  {
    id: 'system',
    name: '시스템관리',
    children: [
      {
        id: 'settings',
        name: '시스템 설정',
        children: [
          {
            id: 'plant',
            name: '사업장 관리',
            path: '/dashboard/system/settings/plant',
          },
        ],
      },
    ],
  },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({ system: true, settings: true });

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {MENU.map((menu) => (
          <div key={menu.id} className="sidebar-group">
            <button
              type="button"
              className="sidebar-depth1"
              onClick={() => toggleMenu(menu.id)}
              aria-expanded={openMenus[menu.id]}
            >
              <span className="sidebar-depth1-text">{menu.name}</span>
              <span className={`sidebar-arrow ${openMenus[menu.id] ? 'open' : ''}`}>
                ▼
              </span>
            </button>

            {openMenus[menu.id] && menu.children?.map((sub) => (
              <div key={sub.id} className="sidebar-depth2-group">
                <button
                  type="button"
                  className="sidebar-depth2"
                  onClick={() => toggleMenu(sub.id)}
                  aria-expanded={openMenus[sub.id]}
                >
                  <span className="sidebar-depth2-text">{sub.name}</span>
                  <span className={`sidebar-arrow ${openMenus[sub.id] ? 'open' : ''}`}>
                    ▼
                  </span>
                </button>

                {openMenus[sub.id] && sub.children?.map((leaf) => (
                  <button
                    key={leaf.id}
                    type="button"
                    className={`sidebar-depth3 ${location.pathname === leaf.path ? 'active' : ''}`}
                    onClick={() => navigate(leaf.path)}
                  >
                    {leaf.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
