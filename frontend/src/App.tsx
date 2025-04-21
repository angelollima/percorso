// src/App.tsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { DirEntryInfo } from './types';

const App: React.FC = () => {
  // guarda os nomes
  const [allNames, setAllNames] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  // recebe o array embaralhado
  const handleEntries = (entries: DirEntryInfo[]) => {
    const names = entries.map(e => e.name);
    setAllNames(names);
    setRemaining(names);
  };

  // atualiza current sempre que remaining mudar
  useEffect(() => {
    if (remaining.length > 0) {
      setCurrent(remaining[0]);
      setInput('');
      setFeedback('');
    } else {
      setCurrent('');
    }
  }, [remaining]);

// Defina isso no seu componente (por ex. em App.tsx)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();      // evita reload da página
    if (input.trim() === current) {
      setRemaining(prev => prev.slice(1));  // acerto
      setFeedback('');
    } else {
      setFeedback('Nome incorreto. Tente de novo.');
    }
    setInput('');            // limpa o campo
  };


  return (
    <div className="bg-[#1e1e1e] text-gray-300 h-screen flex flex-col">
      <Navbar onEntriesSelected={handleEntries} />

      <div className="flex-grow flex items-center justify-center">
        {current ? (
          <form onSubmit={handleSubmit} className="bg-[#2d2d2d] p-8 rounded-lg shadow-lg flex flex-col space-y-4">
          <div className="text-xl">Digite este nome:</div>
          <div className="font-mono text-2xl p-2 bg-black rounded">{current}</div>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="p-2 bg-[#1e1e1e] rounded text-white outline-none"
            autoFocus
          />

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Confirmar
          </button>

          {feedback && <div className="text-red-400">{feedback}</div>}

          <div className="text-sm text-gray-500">
            Restam {remaining.length} de {allNames.length}
          </div>
        </form>
        ) : allNames.length > 0 ? (
          <div className="text-green-400 text-2xl">
            Parabéns, você completou todos os nomes!
          </div>
        ) : (
          <p>Passe o mouse sobre "File" e abra uma pasta para começar.</p>
        )}
      </div>
    </div>
  );
};

export default App;
