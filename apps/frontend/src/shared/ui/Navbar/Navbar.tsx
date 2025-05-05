import { Link } from "@tanstack/react-router";
import { sidebarItems } from "./navbarConfig";

export const Navbar = () => {
  return (
    <nav className="flex-1 overflow-auto py-4">
      {sidebarItems.map((group) => (
        <div key={group.title} className="px-4 py-2">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">
            {group.title}
          </h2>
          <ul className="menu menu-sm">
            {group.items.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="flex items-center">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};
