import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface CodeBlockProps {
  title?: string;
  language?: string;
  children: string;
  delay?: number;
}

export function CodeBlock({ title, language = 'bash', children, delay = 0 }: CodeBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-xl overflow-hidden border border-gray-700/50"
    >
      {title && (
        <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 border-b border-gray-700/50">
          <Terminal size={14} className="text-gray-400" />
          <span className="text-sm text-gray-400">{title}</span>
          <span className="ml-auto text-xs text-gray-500">{language}</span>
        </div>
      )}
      <pre className="bg-gray-900 p-4 overflow-x-auto">
        <code className="text-base text-emerald-300 font-mono whitespace-pre leading-relaxed">
          {children}
        </code>
      </pre>
    </motion.div>
  );
}
