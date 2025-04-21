// src/App.tsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import { DirEntryInfo } from './types';

const App: React.FC = () => {
  const [entries, setEntries] = useState<DirEntryInfo[]>([]);

  return (
    <div className="bg-[#1e1e1e] text-gray-300 h-screen">
      {/* Passa callback para receber as entries do submenu */}
      <Navbar onEntriesSelected={setEntries} />

      <div className="p-5 overflow-auto">
        {entries.length === 0 ? (
          <p>Passe o mouse sobre "File" e abra uma pasta para listar seu conteúdo.</p>
        ) : (
          <div>
            <h2 className="text-lg mb-2">Conteúdo do diretório:</h2>
            <ul className="list-disc list-inside">
              {entries.map((e, idx) => (
                <li key={idx}>
                  {e.is_dir ? '📁' : '📄'} {e.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
