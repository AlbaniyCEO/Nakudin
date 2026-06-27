import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, auth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { I18nProvider } from "@/i18n";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Shops from "@/pages/shops";
import Login from "@/pages/login";
import Register from "@/pages/register";
import CreateShop from "@/pages/create-shop";
import ShopProfile from "@/pages/shop-profile";
import ShopEdit from "@/pages/shop-edit";
import ProductDetail from "@/pages/product-detail";
import Dashboard from "@/pages/dashboard";
import ProductForm from "@/pages/product-form";
import Subscription from "@/pages/subscription";
import Settings from "@/pages/settings";
import AdminPanel from "@/pages/admin/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});


const NO_NAV_PATHS = ["/login", "/register", "/create-shop"];

function Layout() {
  const [location] = useLocation();
  const hideNav = NO_NAV_PATHS.includes(location);

  return (
    <div className="max-w-screen-sm mx-auto min-h-[100dvh] pb-16 relative bg-background">
            <Switch>
        <Route path="/" component={Home} />
        <Route path="/explore" component={Explore} />
        <Route path="/shops" component={Shops} />
        <Route path="/shops/:shopId/edit" component={ShopEdit} />
        <Route path="/shops/:shopId" component={ShopProfile} />
        <Route path="/products/:productId" component={ProductDetail} />
        <Route path="/dashboard/product/new" component={ProductForm} />
        <Route path="/dashboard/product/:id/edit" component={ProductForm} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/create-shop" component={CreateShop} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/settings" component={Settings} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Layout />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;
