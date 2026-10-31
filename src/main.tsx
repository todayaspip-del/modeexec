import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runMigrations } from './lib/migrations';

// Run storage migrations once before AppProvider reads any state
runMigrations();

createRoot(document.getElementById('root')!).render(<App />);
