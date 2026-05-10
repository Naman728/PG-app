import { ProductionApiConfigBanner } from "./components/ProductionApiConfigBanner";
import { AppProviders } from "./layouts/AppProviders";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <AppProviders>
      <ProductionApiConfigBanner />
      <AppRoutes />
    </AppProviders>
  );
}
