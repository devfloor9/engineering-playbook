import { SlideWrapper, CompareTable } from '@shared/components';
import { ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthMigrationSlide() {
  const steps = [
    { label: 'CONFIG_MAP', desc: 'Legacy', color: 'gray', active: false },
    { label: 'API_AND_CONFIG_MAP', desc: 'Migration Period', color: 'amber', active: true },
    { label: 'API', desc: 'Final Target', color: 'emerald', active: false },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <ArrowRightLeft className="w-12 h-12 text-amber-400" />
        Authentication Mode Migration
      </h1>

      <div className="flex items-center justify-center gap-4 mb-8">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-4"
          >
            <div className={`px-6 py-4 rounded-xl border-2 ${
              s.active ? `border-${s.color}-400 bg-${s.color}-500/20` : 'border-gray-700 bg-gray-900'
            }`}>
              <p className={`font-bold text-lg ${s.active ? `text-${s.color}-400` : 'text-gray-400'}`}>
                {s.label}
              </p>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <span className="text-gray-600 text-2xl">&rarr;</span>
            )}
          </motion.div>
        ))}
      </div>

      <CompareTable
        headers={['Mode', 'Access Entry API', 'aws-auth ConfigMap', 'Recommendation']}
        rows={[
          ['CONFIG_MAP', 'Unavailable', 'Active', 'Legacy'],
          ['API_AND_CONFIG_MAP', 'Available', 'Active', 'Migration Period'],
          ['API', 'Available', 'Ignored', 'Final Target'],
        ]}
        highlightCol={3}
      />

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
          <h3 className="text-white font-bold mb-3">Auto Mode Differences</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>Default mode is <span className="text-emerald-400 font-bold">API</span></li>
            <li>aws-auth ConfigMap <span className="text-rose-400">not supported</span></li>
            <li>Access Entry is the <span className="text-blue-400">only</span> auth management method</li>
          </ul>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-rose-400 font-bold mb-2">One-Way Migration</h3>
            <p className="text-sm text-gray-300">
              Switching to API mode is irreversible. Verify all aws-auth entries are migrated to Access Entries before proceeding.
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
