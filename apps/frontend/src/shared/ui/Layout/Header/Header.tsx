import { Link } from '@tanstack/react-router';

const links: { to: string; label: string }[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
];

export const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4 flex items-center gap-x-4">
      <h1 className="text-xl">ФинТрекер</h1>
      <div className="p-2 flex gap-2">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="[&.active]:font-bold">
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
};
