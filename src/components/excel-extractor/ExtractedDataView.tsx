import React, { useState, useEffect } from 'react';
import { ClipboardIcon, CheckIcon } from './Icons';

interface ExtractedDataViewProps {
  extractedText: string;
}

const ExtractedDataView: React.FC<ExtractedDataViewProps> = ({ extractedText }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText).then(() => {
        setIsCopied(true);
      });
    }
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const hasContent = extractedText.length > 0;

  return (
    <div className="relative">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Informações Extraídas</h2>
      <div className="relative rounded-md shadow-sm">
        <textarea
          readOnly
          value={hasContent ? extractedText : "Nenhuma célula selecionada para extração."}
          className={`
            block w-full h-48 p-3 pr-20 sm:text-sm rounded-md resize-none
            border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50
            text-gray-900 dark:text-gray-300 focus:ring-indigo-500 focus:border-indigo-500
            ${!hasContent ? 'italic text-gray-500' : ''}
          `}
          aria-label="Dados extraídos"
        />
        <div className="absolute top-0 right-0 pt-2 pr-2">
            <button
                type="button"
                onClick={handleCopy}
                disabled={!hasContent || isCopied}
                className={`
                    inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm
                    transition-all duration-150
                    ${isCopied
                        ? 'bg-green-600 text-white'
                        : `text-white bg-indigo-600 hover:bg-indigo-700
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                           disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed`
                    }
                `}
                aria-live="polite"
            >
                {isCopied ? (
                    <>
                        <CheckIcon className="h-4 w-4 mr-1.5" />
                        Copiado!
                    </>
                ) : (
                    <>
                        <ClipboardIcon className="h-4 w-4 mr-1.5" />
                        Copiar
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExtractedDataView;