interface CompareTableProps {
  headers: string[];
  rows: string[][];
  highlightCol?: number;
}

export function CompareTable({ headers, rows, highlightCol }: CompareTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800">
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left font-semibold ${
                  i === highlightCol ? 'text-blue-400' : 'text-gray-300'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-gray-800 hover:bg-gray-900/50">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-3 ${
                    ci === highlightCol ? 'text-blue-300' : 'text-gray-400'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
