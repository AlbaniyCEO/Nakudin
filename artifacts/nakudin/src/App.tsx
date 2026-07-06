import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, auth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { I18nProvider } from "@/i18n";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";

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
import PremiumPage from "@/pages/premium";
import BlogPage from "@/pages/blog";
import BlogDetailPage from "@/pages/blog-detail";
import FeedbackPage from "@/pages/feedback";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";

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
    <div className="max-w-screen-sm mx-auto min-h-[100dvh] pb-20 relative bg-transparent before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(0,217,255,0.06),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_28%)] before:opacity-100">
      <OfflineBanner />
      <PushNotificationPrompt />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/explore" component={Explore} />
        <Route path="/blog/:slug" component={BlogDetailPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/shops" component={Shops} />
        <Route path="/shops/:shopId/edit" component={ShopEdit} />
        <Route path="/shops/:shopId" component={ShopProfile} />
        <Route path="/s/:slug" component={ShopProfile} />
        <Route path="/products/:productId" component={ProductDetail} />
        <Route path="/dashboard/product/new" component={ProductForm} />
        <Route path="/dashboard/product/:id/edit" component={ProductForm} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/create-shop" component={CreateShop} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/premium" component={PremiumPage} />
        <Route path="/feedback" component={FeedbackPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
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
