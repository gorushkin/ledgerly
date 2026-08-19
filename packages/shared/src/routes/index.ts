const API_ROOT = "/api";

const appendQuery = (url: string, query?: string) => {
  return query ? `${url}?${query}` : url;
};

const apiUrl = (route: string, query?: string) => {
  return appendQuery(`${API_ROOT}${route}`, query);
};

const apiResourceUrl = (route: string) => {
  const byId = (id: string) => apiUrl(`${route}/${id}`);

  return {
    byId,
    close: (id: string) => apiUrl(`${route}/${id}/close`),
    open: (id: string) => apiUrl(`${route}/${id}/open`),
    root: apiUrl(route),
    withQuery: (query: string) => apiUrl(route, query),
  };
};

const APP_ROUTES = {
  accounts: "/accounts",
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    root: "/auth",
  },
  commodities: "/commodities",
  transactions: "/transactions",
  user: {
    password: "/user/password",
    root: "/user",
  },
} as const;

export const ROUTES = {
  api: {
    accounts: apiResourceUrl(APP_ROUTES.accounts),
    auth: {
      login: apiUrl(APP_ROUTES.auth.login),
      register: apiUrl(APP_ROUTES.auth.register),
      root: apiUrl(APP_ROUTES.auth.root),
    },
    commodities: apiResourceUrl(APP_ROUTES.commodities),
    root: API_ROOT,
    transactions: apiResourceUrl(APP_ROUTES.transactions),
    user: {
      password: apiUrl(APP_ROUTES.user.password),
      root: apiUrl(APP_ROUTES.user.root),
    },
  },
  app: APP_ROUTES,
} as const;
