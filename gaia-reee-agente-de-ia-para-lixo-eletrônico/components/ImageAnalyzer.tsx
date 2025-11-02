/**
 * @authors
 * Vitoriano Martin - https://github.com/VitorianoFM/
 * Felipe Fuhrmann - https://github.com/FelipeFuhrmann/
 * Lilian Ferreira - https://github.com/LilianFerreira/
 */
import React, { useState, useCallback } from 'react';
import { analyzeImage } from '../services/geminiService';
import { CameraIcon } from './Icons';

// Define helper component outside the main component
const Dropzone: React.FC<{ onFileSelect: (file: File) => void }> = ({ onFileSelect }) => {
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
    event.currentTarget.classList.remove('border-green-500');
  }, [onFileSelect]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-green-500');
  };
  
  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-green-500');
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  return (
    <div 
      className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input type="file" accept="image/*" onChange={onFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      <div className="flex flex-col items-center justify-center text-gray-400">
        <CameraIcon />
        <p className="mt-2 text-sm">Arraste e solte uma imagem aqui, ou clique para selecionar um arquivo</p>
      </div>
    </div>
  );
};

const ImageAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Identifique o lixo eletrônico nesta imagem e sugira como descartá-lo corretamente.');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!file || !prompt) {
      setError('Por favor, selecione uma imagem e forneça uma solicitação.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const imageDataBase64 = await fileToBase64(file);
      const analysisResult = await analyzeImage(imageDataBase64, file.type, prompt);
      setResult(analysisResult);
    } catch (err) {
      setError('Falha ao analisar a imagem. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {preview ? (
            <img src={preview} alt="E-waste preview" className="w-full h-auto max-h-64 object-contain rounded-lg shadow-md bg-gray-900" />
          ) : (
            <Dropzone onFileSelect={handleFileSelect} />
          )}
        </div>
        <div className="flex flex-col space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-green-500 focus:border-green-500 flex-grow text-sm"
            rows={4}
            placeholder="Digite sua solicitação..."
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Analisando...' : 'Analisar Lixo Eletrônico'}
          </button>
        </div>
      </div>
      
      <div className="flex-grow bg-gray-900 rounded-lg p-4 overflow-y-auto border border-gray-700 min-h-[200px]">
        {isLoading && <p className="text-gray-400">A IA está analisando sua imagem...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {result && (
          <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }} />
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;