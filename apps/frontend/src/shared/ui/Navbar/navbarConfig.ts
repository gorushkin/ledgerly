import { BarChart3, CreditCard, DollarSign, Home, LineChart, List, PieChart, Settings } from 'lucide-react';

export const sidebarItems: {
  title: string;
  items: { to: string; icon: React.ElementType; label: string }[];
}[] = [
  {
    items: [
      { icon: Home, label: 'Обзор', to: '/' },
      { icon: List, label: 'Транзакции', to: '/transactions' },
      { icon: CreditCard, label: 'Счета', to: '/accounts' },
      { icon: DollarSign, label: 'Бюджет', to: '/budget' },
    ],
    title: 'Основное',
  },
  {
    items: [
      { icon: BarChart3, label: 'Отчеты', to: '#' },
      { icon: LineChart, label: 'Тренды', to: '#' },
      { icon: PieChart, label: 'Категории', to: '#' },
    ],
    title: 'Аналитика',
  },
  {
    items: [{ icon: Settings, label: 'Настройки', to: '#' }],
    title: 'Настройки',
  },
];
