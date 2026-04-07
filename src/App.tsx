import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { OrderProvider } from "@/context/OrderContext";
import { ProductProvider } from "@/context/ProductContext";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import RoleGuard from "@/components/RoleGuard";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminReports from "./pages/admin/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ProductProvider>
          <OrderProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Admin routes - blocked for customers */}
                  <Route path="/admin" element={<RoleGuard role="admin"><AdminLayout><AdminDashboard /></AdminLayout></RoleGuard>} />
                  <Route path="/admin/products" element={<RoleGuard role="admin"><AdminLayout><AdminProducts /></AdminLayout></RoleGuard>} />
                  <Route path="/admin/orders" element={<RoleGuard role="admin"><AdminLayout><AdminOrders /></AdminLayout></RoleGuard>} />
                  <Route path="/admin/inventory" element={<RoleGuard role="admin"><AdminLayout><AdminInventory /></AdminLayout></RoleGuard>} />
                  <Route path="/admin/reports" element={<RoleGuard role="admin"><AdminLayout><AdminReports /></AdminLayout></RoleGuard>} />

                  {/* Customer routes - blocked for admin */}
                  <Route path="/" element={<Layout><Index /></Layout>} />
                  <Route path="/shop" element={<Layout><Shop /></Layout>} />
                  <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
                  <Route path="/cart" element={<RoleGuard role="customer"><Layout><Cart /></Layout></RoleGuard>} />
                  <Route path="/checkout" element={<RoleGuard role="customer"><Layout><Checkout /></Layout></RoleGuard>} />
                  <Route path="/orders" element={<RoleGuard role="customer"><Layout><Orders /></Layout></RoleGuard>} />
                  <Route path="/login" element={<Layout><Login /></Layout>} />
                  <Route path="/register" element={<Layout><Register /></Layout>} />
                  <Route path="*" element={<Layout><NotFound /></Layout>} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </OrderProvider>
        </ProductProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
