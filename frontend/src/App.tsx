// src/App.tsx
import './index.css';
import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import PreferencesWindow from './components/PreferencesWindow';
import Profile from './components/profile/Profile';
import NavigationBar from './components/navigation/navbar/NavigationBar';
import { DirectoryEntryInfo } from './types/navigation'; // Atualizado para usar o novo tipo
import { invoke } from '@tauri-apps/api/core';

interface VocabularyEntry {
  Italian: string;
  English: string[];
}

const App: React.FC = () => {
  const [selectedDirectoryPath, setSelectedDirectoryPath] = useState<string>('');
  const [vocabularyEntries, setVocabularyEntries] = useState<VocabularyEntry[]>([]);
  const [currentVocabularyIndex, setCurrentVocabularyIndex] = useState(0);

  const handleDirectoryEntriesSelected = useCallback(async (
    directoryEntries: DirectoryEntryInfo[],
    selectedFolderPath?: string
  ) => {
    if (selectedFolderPath) {
      setSelectedDirectoryPath(selectedFolderPath);
    }

    // Adaptar para a nova estrutura DirectoryEntryInfo
    const markdownFiles = directoryEntries.filter(
      entry => !entry.isDirectory && entry.path?.endsWith('.md')
    );

    const vocabularyExtractionPromises = markdownFiles.map(async (markdownFile) => {
      try {
        const extractedVocabulary = await invoke<VocabularyEntry>(
          'extract_vocabulary_fields',
          { filePath: markdownFile.path }
        );
        return extractedVocabulary;
      } catch (error) {
        console.error(`Erro ao extrair vocabulário de ${markdownFile.name}:`, error);
        return null;
      }
    });

    const extractionResults = await Promise.all(vocabularyExtractionPromises);
    const validVocabularyEntries = extractionResults.filter(
      (result): result is VocabularyEntry => result !== null
    );

    setVocabularyEntries(validVocabularyEntries);
    setCurrentVocabularyIndex(0);
  }, []);

  return (
    <div className="bg-[#1e1e1e] text-gray-300 h-screen flex flex-col">
      {/* NavigationBar sempre visível */}
      <NavigationBar
        onDirectoryEntriesSelected={handleDirectoryEntriesSelected}
      />

      {/* Conteúdo das rotas */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
              <h1 className="text-2xl font-bold text-white mb-4">
                Welcome to Vocabulary Learner!
              </h1>
              <p className="text-sm text-gray-500">
                Click "File" → "Open folder" to get started
              </p>

              {/* Informações de debug (opcional) */}
              {selectedDirectoryPath && (
                <div className="mt-4 p-4 bg-[#2d2d2d] rounded-lg">
                  <p className="text-sm text-gray-400">
                    Selected folder: <span className="text-white">{selectedDirectoryPath}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Vocabulary entries found: <span className="text-white">{vocabularyEntries.length}</span>
                  </p>
                </div>
              )}
            </div>
          } />
          <Route path="/preferences" element={<PreferencesWindow />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
