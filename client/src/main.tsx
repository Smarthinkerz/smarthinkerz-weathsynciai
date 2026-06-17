import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import i18n, { initializeI18n } from './lib/i18n';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize i18n before rendering
initializeI18n().then((i18nInstance) => {
  console.log('i18n initialized with language:', i18nInstance.language);

  // Set up initial direction
  document.documentElement.dir = i18nInstance.language === 'ar' ? 'rtl' : 'ltr';

  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
}).catch(error => {
  console.error('Failed to initialize i18n:', error);
});