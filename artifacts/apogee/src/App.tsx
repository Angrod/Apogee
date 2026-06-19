import { Switch, Route, Router as WouterRouter, Link, useRoute } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ChildrenList from "@/pages/children-list";
import ChildFormPage from "@/pages/child-form";
import Catalog from "@/pages/catalog";
import AppFormPage from "@/pages/app-form";
import { exportData } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

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

function ExportButton() {
  const { toast } = useToast();

  async function handleExport() {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `apogee-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export downloaded" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="ml-auto text-stone-600 border-stone-200 hover:border-amber-300 hover:text-amber-800 gap-1.5"
    >
      <DownloadIcon className="h-3.5 w-3.5" />
      Export Data
    </Button>
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
        <ExportButton />
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/catalog/new" component={AppFormPage} />
        <Route path="/catalog/:id" component={AppFormPage} />
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
