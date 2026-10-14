import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Data fetched in the last 30s is reused when you open another page instead of
        // re-downloading everything on every click. Saves/deletes still refresh lists
        // immediately because they invalidate their queries.
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Hovering a link starts loading that page's code so the click opens instantly.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
