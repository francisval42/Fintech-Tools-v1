import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  useParams
} from 'wouter';

import Home from '@/pages/home';
import NotFound from '@/pages/not-found';
import Privacy from '@/pages/privacy';
import Contact from '@/pages/contact';
import AmortisationCalculatorPage from '@/pages/calculator';
import ComingSoonPage from '@/pages/coming-soon';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry client errors (404s must render the NotFound page fast);
      // allow two retries for transient server/network failures.
      retry: (failureCount, error) => {
        const status = (error as { status?: number } | null)?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

// Helper to handle dynamic tool routes
function ToolRoute() {
  const params = useParams();
  const slug = params.slug;

  if (slug === 'amortisation-schedule-calculator') {
    return <AmortisationCalculatorPage />;
  }

  // Handle all other tools as coming soon
  return <ComingSoonPage slug={slug as string} />;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/contact" component={Contact} />
        <Route path="/:slug" component={ToolRoute} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
