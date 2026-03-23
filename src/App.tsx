import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const PropertyDetailPage = lazy(() =>
  import("@/pages/PropertyDetailPage").then((m) => ({ default: m.PropertyDetailPage }))
);
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() =>
  import("@/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const SignupPage = lazy(() =>
  import("@/pages/SignupPage").then((m) => ({ default: m.SignupPage }))
);
const ProfileSettingsPage = lazy(() =>
  import("@/pages/ProfileSettingsPage").then((m) => ({ default: m.ProfileSettingsPage }))
);
const WishlistPage = lazy(() =>
  import("@/pages/WishlistPage").then((m) => ({ default: m.WishlistPage }))
);
const MyAccountPage = lazy(() =>
  import("@/pages/MyAccountPage").then((m) => ({ default: m.MyAccountPage }))
);
const MyListingsPage = lazy(() =>
  import("@/pages/MyListingsPage").then((m) => ({ default: m.MyListingsPage }))
);
const EditListingPage = lazy(() =>
  import("@/pages/EditListingPage").then((m) => ({ default: m.EditListingPage }))
);
const SellPage = lazy(() => import("@/pages/SellPage").then((m) => ({ default: m.SellPage })));
const RentOutPage = lazy(() =>
  import("@/pages/RentOutPage").then((m) => ({ default: m.RentOutPage }))
);
const MessagesPage = lazy(() =>
  import("@/pages/MessagesPage").then((m) => ({ default: m.MessagesPage }))
);
const SellerDashboardPage = lazy(() =>
  import("@/pages/SellerDashboardPage").then((m) => ({ default: m.SellerDashboardPage }))
);
const BuyerDashboardPage = lazy(() =>
  import("@/pages/BuyerDashboardPage").then((m) => ({ default: m.BuyerDashboardPage }))
);
const AdminPage = lazy(() =>
  import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/property/:slug" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/account" element={<MyAccountPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/my-listings/:listingId/edit" element={<EditListingPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/rent-out" element={<RentOutPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/seller-dashboard" element={<SellerDashboardPage />} />
          <Route path="/buyer-dashboard" element={<BuyerDashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
