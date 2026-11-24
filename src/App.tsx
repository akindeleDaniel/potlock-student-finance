import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Setup from "./pages/Setup";
import MoneyIn from "./pages/MoneyIn";
import Spend from "./pages/Spend";
import Emergency from "./pages/Emergency";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="setup" element={<Setup />} />
          <Route path="money-in" element={<MoneyIn />} />
          <Route path="spend" element={<Spend />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="report" element={<Report />} />
          <Route path="jar" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
