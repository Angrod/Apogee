import { Switch, Route, Router as WouterRouter, Link, useRoute } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ChildrenList from "@/pages/children-list";
import ChildFormPage from "@/pages/child-form";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [isActive] = useRoute(href === "/" ? "/" : href + "*");
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-amber-100 text-amber-900"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      {children}
    </Link>
  );
}

function Nav() {
  return (
    <nav className="border-b border-stone-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-1">
        <Link href="/" className="mr-6 text-lg font-semibold text-stone-900 tracking-tight">
          Apogee
        </Link>
        <NavLink href="/">Dashboard</NavLink>
        <NavLink href="/catalog">Catalog</NavLink>
        <NavLink href="/children">Children</NavLink>
      </div>
    </nav>
  );
}

function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Dashboard</h1>
      <p className="text-stone-500 text-sm">Your children's app recommendations will appear here.</p>
    </div>
  );
}

function Catalog() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">App Catalog</h1>
      <p className="text-stone-500 text-sm">Your vetted app catalog will appear here.</p>
    </div>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/children" component={ChildrenList} />
        <Route path="/children/new" component={ChildFormPage} />
        <Route path="/children/:id" component={ChildFormPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
