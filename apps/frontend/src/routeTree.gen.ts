/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as TransactionsImport } from './routes/transactions'
import { Route as BudgetImport } from './routes/budget'
import { Route as AccountsImport } from './routes/accounts'
import { Route as AboutImport } from './routes/about'
import { Route as IndexImport } from './routes/index'
import { Route as AccountsIndexImport } from './routes/accounts/index'
import { Route as AccountsAccountIdImport } from './routes/accounts/$accountId'

// Create/Update Routes

const TransactionsRoute = TransactionsImport.update({
  id: '/transactions',
  path: '/transactions',
  getParentRoute: () => rootRoute,
} as any)

const BudgetRoute = BudgetImport.update({
  id: '/budget',
  path: '/budget',
  getParentRoute: () => rootRoute,
} as any)

const AccountsRoute = AccountsImport.update({
  id: '/accounts',
  path: '/accounts',
  getParentRoute: () => rootRoute,
} as any)

const AboutRoute = AboutImport.update({
  id: '/about',
  path: '/about',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const AccountsIndexRoute = AccountsIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => AccountsRoute,
} as any)

const AccountsAccountIdRoute = AccountsAccountIdImport.update({
  id: '/$accountId',
  path: '/$accountId',
  getParentRoute: () => AccountsRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/about': {
      id: '/about'
      path: '/about'
      fullPath: '/about'
      preLoaderRoute: typeof AboutImport
      parentRoute: typeof rootRoute
    }
    '/accounts': {
      id: '/accounts'
      path: '/accounts'
      fullPath: '/accounts'
      preLoaderRoute: typeof AccountsImport
      parentRoute: typeof rootRoute
    }
    '/budget': {
      id: '/budget'
      path: '/budget'
      fullPath: '/budget'
      preLoaderRoute: typeof BudgetImport
      parentRoute: typeof rootRoute
    }
    '/transactions': {
      id: '/transactions'
      path: '/transactions'
      fullPath: '/transactions'
      preLoaderRoute: typeof TransactionsImport
      parentRoute: typeof rootRoute
    }
    '/accounts/$accountId': {
      id: '/accounts/$accountId'
      path: '/$accountId'
      fullPath: '/accounts/$accountId'
      preLoaderRoute: typeof AccountsAccountIdImport
      parentRoute: typeof AccountsImport
    }
    '/accounts/': {
      id: '/accounts/'
      path: '/'
      fullPath: '/accounts/'
      preLoaderRoute: typeof AccountsIndexImport
      parentRoute: typeof AccountsImport
    }
  }
}

// Create and export the route tree

interface AccountsRouteChildren {
  AccountsAccountIdRoute: typeof AccountsAccountIdRoute
  AccountsIndexRoute: typeof AccountsIndexRoute
}

const AccountsRouteChildren: AccountsRouteChildren = {
  AccountsAccountIdRoute: AccountsAccountIdRoute,
  AccountsIndexRoute: AccountsIndexRoute,
}

const AccountsRouteWithChildren = AccountsRoute._addFileChildren(
  AccountsRouteChildren,
)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/accounts': typeof AccountsRouteWithChildren
  '/budget': typeof BudgetRoute
  '/transactions': typeof TransactionsRoute
  '/accounts/$accountId': typeof AccountsAccountIdRoute
  '/accounts/': typeof AccountsIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/budget': typeof BudgetRoute
  '/transactions': typeof TransactionsRoute
  '/accounts/$accountId': typeof AccountsAccountIdRoute
  '/accounts': typeof AccountsIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/accounts': typeof AccountsRouteWithChildren
  '/budget': typeof BudgetRoute
  '/transactions': typeof TransactionsRoute
  '/accounts/$accountId': typeof AccountsAccountIdRoute
  '/accounts/': typeof AccountsIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/about'
    | '/accounts'
    | '/budget'
    | '/transactions'
    | '/accounts/$accountId'
    | '/accounts/'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/about'
    | '/budget'
    | '/transactions'
    | '/accounts/$accountId'
    | '/accounts'
  id:
    | '__root__'
    | '/'
    | '/about'
    | '/accounts'
    | '/budget'
    | '/transactions'
    | '/accounts/$accountId'
    | '/accounts/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AboutRoute: typeof AboutRoute
  AccountsRoute: typeof AccountsRouteWithChildren
  BudgetRoute: typeof BudgetRoute
  TransactionsRoute: typeof TransactionsRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AboutRoute: AboutRoute,
  AccountsRoute: AccountsRouteWithChildren,
  BudgetRoute: BudgetRoute,
  TransactionsRoute: TransactionsRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/about",
        "/accounts",
        "/budget",
        "/transactions"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/about": {
      "filePath": "about.tsx"
    },
    "/accounts": {
      "filePath": "accounts.tsx",
      "children": [
        "/accounts/$accountId",
        "/accounts/"
      ]
    },
    "/budget": {
      "filePath": "budget.tsx"
    },
    "/transactions": {
      "filePath": "transactions.tsx"
    },
    "/accounts/$accountId": {
      "filePath": "accounts/$accountId.tsx",
      "parent": "/accounts"
    },
    "/accounts/": {
      "filePath": "accounts/index.tsx",
      "parent": "/accounts"
    }
  }
}
ROUTE_MANIFEST_END */
