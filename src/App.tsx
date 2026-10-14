import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@shared/components/layout/MainLayout';
import { ProtectedRoute } from '@shared/components/layout/ProtectedRoute';
import { AdminRoute } from '@shared/components/layout/AdminRoute';
import { NotFoundPage } from '@shared/components/layout/NotFoundPage';

import { CatalogPage } from '@features/catalog/pages/CatalogPage';
import { ProductDetailPage } from '@features/catalog/pages/ProductDetailPage';
import { CartPage } from '@features/cart/pages/CartPage';
import { CheckoutPage } from '@features/checkout/pages/CheckoutPage';
import { OrderHistoryPage } from '@features/orders/pages/OrderHistoryPage';
import { OrderDetailPage } from '@features/orders/pages/OrderDetailPage';
import { LoginPage } from '@features/auth/pages/LoginPage';
import { RegisterPage } from '@features/auth/pages/RegisterPage';

import { AdminLayout } from '@features/admin/layout/AdminLayout';
import { AdminDashboardPage } from '@features/admin/pages/AdminDashboardPage';
import { AdminProductsPage } from '@features/admin/pages/AdminProductsPage';
import { AdminOrdersPage } from '@features/admin/pages/AdminOrdersPage';

export default function App() {
  return (
    <Routes>
      {/* Area publica / cliente */}
      <Route element={<MainLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Panel de administracion (layout propio, solo rol admin) */}
      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
