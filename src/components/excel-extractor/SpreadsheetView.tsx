import React from 'react';

interface SpreadsheetViewProps {
  data: (string | number | null)[][];
  selectedCells: Set<string>;
  onCellClick: (rowIndex: number, colIndex: number) => void;
}

const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({ data, selectedCells, onCellClick }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Visualização da Planilha</h2>
      <div className="w-full overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg" style={{ maxHeight: '50vh' }}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="sticky top-0 left-0 bg-gray-50 dark:bg-gray-700/50 z-20 px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12"></th>
              {data[0]?.map((_, colIndex) => (
                <th key={colIndex} className="sticky top-0 bg-gray-50 dark:bg-gray-700/50 z-10 px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {String.fromCharCode(65 + colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="sticky left-0 bg-gray-50 dark:bg-gray-700/50 z-10 px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 w-12">{rowIndex + 1}</td>
                {row.map((cell, colIndex) => {
                  const isSelected = selectedCells.has(`${rowIndex}:${colIndex}`);
                  const cellClasses = `
                    px-3 py-2 whitespace-nowrap text-sm cursor-pointer border-l border-gray-200 dark:border-gray-700
                    transition-colors duration-150
                    ${isSelected
                      ? 'bg-indigo-200 dark:bg-indigo-900/70 text-indigo-900 dark:text-indigo-100 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `;
                  return (
                    <td
                      key={colIndex}
                      className={cellClasses}
                      onClick={() => onCellClick(rowIndex, colIndex)}
                      title={String(cell ?? '')}
                    >
                      <div className="truncate max-w-xs">{String(cell ?? '')}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpreadsheetView;