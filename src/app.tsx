import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./appLayout.tsx";
import { AnalysisPage } from "./features/analysis/analysisPage.tsx";
import { HistoryDetailPage } from "./features/history/historyDetailPage.tsx";
import { HistoryPage } from "./features/history/historyPage.tsx";
import { KeyDetailPage } from "./features/keys/keyDetailPage.tsx";
import { KeysPage } from "./features/keys/keysPage.tsx";
import { PlayPage } from "./features/play/playPage.tsx";
import { RecordsProvider } from "./shared/storage/recordsContext.tsx";
import { ThemeProvider } from "./shared/ui/themeContext.tsx";

const basePath = import.meta.env.BASE_URL;
const basename = basePath === "/" ? undefined : basePath.replace(/\/$/, "");

export function App() {
  return (
    <ThemeProvider>
      <RecordsProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route element={<AppLayout />} path="/">
              <Route index element={<PlayPage />} />
              <Route element={<AnalysisPage />} path="analysis" />
              <Route element={<KeysPage />} path="keys" />
              <Route element={<KeyDetailPage />} path="keys/:key" />
              <Route element={<HistoryPage />} path="history" />
              <Route element={<HistoryDetailPage />} path="history/:playId" />
              <Route element={<Navigate replace to="/" />} path="*" />
            </Route>
          </Routes>
        </BrowserRouter>
      </RecordsProvider>
    </ThemeProvider>
  );
}
