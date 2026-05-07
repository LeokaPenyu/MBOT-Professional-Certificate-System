import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { getQuestions, saveQuestions } from './lib/storage.ts';
import { INITIAL_QUESTIONS } from './constants.ts';

const init = () => {
  const questions = getQuestions();
  if (questions.length === 0) {
    saveQuestions(INITIAL_QUESTIONS);
  }
};

init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
