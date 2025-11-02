/**
 * @authors
 * Vitoriano Martin - https://github.com/VitorianoFM/
 * Felipe Fuhrmann - https://github.com/FelipeFuhrmann/
 * Lilian Ferreira - https://github.com/LilianFerreira/
 */
import React, { useState } from 'react';
import ImageAnalyzer from './components/ImageAnalyzer';
import LiveAgent from './components/LiveAgent';
import ChatBot from './components/ChatBot';
import { CameraIcon, MicrophoneIcon, ChatBubbleIcon } from './components/Icons';

type Tab = 'analyze' | 'live' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analyze');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analyze':
        return <ImageAnalyzer />;
      case 'live':
        return <LiveAgent />;
      case 'chat':
        return <ChatBot />;
      default:
        return null;
    }
  };

  // FIX: Changed icon type from JSX.Element to React.ReactNode to resolve namespace issue.
  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 rounded-md ${
        activeTab === tab
          ? 'bg-green-600 text-white shadow-lg'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <header className="bg-gray-800 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-green-400">
            Agente de IA para Lixo Eletrônico
          </h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col">
        <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-2xl flex flex-col flex-grow">
          <div className="p-4 border-b border-gray-700">
            <div className="flex space-x-2 md:space-x-4">
              <TabButton tab="analyze" label="Identificar Resíduo" icon={<CameraIcon />} />
              <TabButton tab="live" label="Agente ao Vivo" icon={<MicrophoneIcon />} />
              <TabButton tab="chat" label="Chat de Texto" icon={<ChatBubbleIcon />} />
            </div>
          </div>
          <div className="p-4 sm:p-6 flex-grow flex flex-col">
            {renderTabContent()}
          </div>
        </div>
      </main>

       <footer className="text-center py-4 text-xs text-gray-500">
          <p>Construído com React, Tailwind CSS e a API Google Gemini.</p>
       </footer>
    </div>
  );
};

export default App;