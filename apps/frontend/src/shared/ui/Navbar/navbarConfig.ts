import {
  BarChart3,
  CreditCard,
  DollarSign,
  Home,
  LineChart,
  List,
  PieChart,
  Settings,
} from "lucide-react";

export const sidebarItems: {
  title: string;
  items: { to: string; icon: React.ElementType; label: string }[];
}[] = [
  {
    title: "Основное",
    items: [
      { to: "/", icon: Home, label: "Обзор" },
      { to: "/transactions", icon: List, label: "Транзакции" },
      { to: "/accounts", icon: CreditCard, label: "Счета" },
      { to: "/budget", icon: DollarSign, label: "Бюджет" },
    ],
  },
  {
    title: "Аналитика",
    items: [
      { to: "#", icon: BarChart3, label: "Отчеты" },
      { to: "#", icon: LineChart, label: "Тренды" },
      { to: "#", icon: PieChart, label: "Категории" },
    ],
  },
  {
    title: "Настройки",
    items: [{ to: "#", icon: Settings, label: "Настройки" }],
  },
];
