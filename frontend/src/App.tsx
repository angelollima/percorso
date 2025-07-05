// src/App.tsx
import React, { useState, useCallback } from 'react';
import NavigationBar from './components/navbar/Navbar';
import { DirectoryEntryInfo } from './types';
import { invoke } from '@tauri-apps/api/core';

// Type definition for vocabulary entries
interface VocabularyEntry {
  Italian: string;
  English: string[];
}

const VocabularyLearningApp: React.FC = () => {
  // State for the selected directory path
  const [selectedDirectoryPath, setSelectedDirectoryPath] = useState<string>('');

  // State for loaded vocabulary entries
  const [vocabularyEntries, setVocabularyEntries] = useState<VocabularyEntry[]>([]);

  // State for tracking current vocabulary card index
  const [currentVocabularyIndex, setCurrentVocabularyIndex] = useState(0);

  // Handler for processing directory entries and extracting vocabulary
  const handleDirectoryEntriesSelected = useCallback(async (
    directoryEntries: DirectoryEntryInfo[],
    selectedFolderPath?: string
  ) => {
    if (selectedFolderPath) {
      setSelectedDirectoryPath(selectedFolderPath);
    }

    console.log('Found files and directories:', directoryEntries);

    // Filter for markdown files only
    const markdownFiles = directoryEntries.filter(
      entry => entry.is_file && entry.full_path?.endsWith('.md')
    );

    // Extract vocabulary data from all markdown files
    const vocabularyExtractionPromises = markdownFiles.map(async (markdownFile) => {
      try {
        const extractedVocabulary = await invoke<VocabularyEntry>(
          'extract_vocabulary_fields',
          { filePath: markdownFile.full_path }
        );
        return extractedVocabulary;
      } catch (error) {
        console.error(`Failed to extract vocabulary from ${markdownFile.name}:`, error);
        return null;
      }
    });

    // Wait for all extractions to complete
    const extractionResults = await Promise.all(vocabularyExtractionPromises);

    // Filter out failed extractions and update state
    const validVocabularyEntries = extractionResults.filter(
      (result): result is VocabularyEntry => result !== null
    );

    console.log("Loaded vocabulary entries:", validVocabularyEntries);

    setVocabularyEntries(validVocabularyEntries);
    setCurrentVocabularyIndex(0); // Reset to first card
  }, []);

  // Navigate to next vocabulary card
  const showNextVocabularyCard = useCallback(() => {
    setCurrentVocabularyIndex(
      previousIndex => (previousIndex + 1) % vocabularyEntries.length
    );
  }, [vocabularyEntries.length]);

  // Render main application content based on current state
  const renderMainApplicationContent = () => {
    // Show vocabulary flashcards if directory is loaded and vocabulary exists
    if (selectedDirectoryPath && vocabularyEntries.length > 0) {
      const currentVocabularyEntry = vocabularyEntries[currentVocabularyIndex];

      return (
        <div className="text-center space-y-6">
          {/* Current vocabulary card */}
          <div className="bg-[#2d2d2d] p-8 rounded-xl shadow-lg max-w-md mx-auto">
            <p className="text-2xl font-bold text-white mb-4">
              🇮🇹 - {currentVocabularyEntry.Italian}
            </p>
            <p className="text-lg text-gray-300">
              🇺🇸 - {currentVocabularyEntry.English.join(', ')}
            </p>
          </div>

          {/* Navigation controls */}
          <div className="space-y-2">
            <button
              onClick={showNextVocabularyCard}
              className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Next Card
            </button>

            {/* Progress indicator */}
            <p className="text-sm text-gray-400">
              Card {currentVocabularyIndex + 1} of {vocabularyEntries.length}
            </p>
          </div>
        </div>
      );
    }

    // Show welcome message when no directory is selected
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-white mb-4">
          Welcome to Vocabulary Learner!
        </h1>
        <p className="text-sm text-gray-500">
          Click "File" → "Open folder" to get started
        </p>
      </div>
    );
  };

  return (
    <div className="bg-[#1e1e1e] text-gray-300 h-screen flex flex-col">
      {/* Top navigation bar with folder name display */}
      <NavigationBar
        onDirectoryEntriesSelected={handleDirectoryEntriesSelected}
        selectedDirectoryPath={selectedDirectoryPath}
      />

      {/* Main content area - centered vertically and horizontally */}
      <div className="flex-grow flex items-center justify-center p-8">
        {renderMainApplicationContent()}
      </div>
    </div>
  );
};

export default VocabularyLearningApp;
