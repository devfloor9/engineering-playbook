import { motion } from 'framer-motion';

interface CompareTableProps {
  headers: string[];
  rows: string[][];
  title?: string;
  highlightCol?: number;
  delay?: number;
}

export function CompareTable({ headers, rows, title, highlightCol, delay = 0 }: CompareTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="w-full"
    >
      {title && <h3 className="text-xl font-bold text-gray-200 mb-3">{title}</h3>}
      <div className="overflow-x-auto rounded-xl border border-gray-700/50">
        <table className="w-full text-base">
          <thead>
            <tr className="bg-gray-800">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-left font-semibold ${
                    highlightCol === i ? 'text-[#ff9900]' : 'text-gray-300'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-4 py-3 ${
                      ci === 0 ? 'font-medium text-gray-200' : 'text-gray-400'
                    } ${highlightCol === ci ? 'text-[#ff9900] font-medium' : ''}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
