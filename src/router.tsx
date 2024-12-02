import { createRouter, Route, rootRouteWithContext, Outlet } from '@tanstack/react-router';
import { PublicSupercurationPage } from './pages/PublicSupercurationPage';

// Create the root route
const rootRoute = rootRouteWithContext<{}>()({
  component: () => <Outlet />,
});

// Define the supercuration route
const supercurationRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/s/$slug',
  component: PublicSupercurationPage,
});

// Create and export the router with the route tree
const routeTree = rootRoute.addChildren([supercurationRoute]);

export const router = createRouter({
  routeTree,
});

// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
} 