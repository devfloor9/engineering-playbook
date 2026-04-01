import { SlideWrapper, Card, Badge } from '@shared/components';

export default function Slide11() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Milvus Vector Database
        </h2>

        <div className="flex items-center space-x-4 mb-8">
          <Badge color="green">Open Source</Badge>
          <Badge color="blue">Cloud Native</Badge>
          <Badge color="purple">Billion+ Scale</Badge>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <Card title="Distributed Architecture">
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <strong className="text-blue-400">Access Layer:</strong>
                <p className="ml-4 text-gray-400">Proxy for load balancing</p>
              </div>
              <div>
                <strong className="text-green-400">Coordinator Services:</strong>
                <p className="ml-4 text-gray-400">Root, Query, Data, Index coordinators</p>
              </div>
              <div>
                <strong className="text-purple-400">Worker Nodes:</strong>
                <p className="ml-4 text-gray-400">Query, Data, Index nodes (scalable)</p>
              </div>
              <div>
                <strong className="text-yellow-400">Storage:</strong>
                <p className="ml-4 text-gray-400">etcd (metadata), MinIO/S3 (vectors), Pulsar (logs)</p>
              </div>
            </div>
          </Card>

          <Card title="Hybrid Search Capabilities">
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <strong className="text-blue-400">HNSW Index:</strong>
                <p className="ml-4 text-gray-400">Fast ANN search (graph-based)</p>
              </div>
              <div>
                <strong className="text-green-400">SCANN Index:</strong>
                <p className="ml-4 text-gray-400">Google's high-accuracy search</p>
              </div>
              <div>
                <strong className="text-purple-400">BM25:</strong>
                <p className="ml-4 text-gray-400">Keyword-based retrieval</p>
              </div>
              <div>
                <strong className="text-yellow-400">RRF Fusion:</strong>
                <p className="ml-4 text-gray-400">Combine vector + keyword results</p>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Performance Characteristics">
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">10M+</div>
              <div className="text-sm text-gray-400 mt-2">QPS on single cluster</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">&lt;10ms</div>
              <div className="text-sm text-gray-400 mt-2">P99 search latency</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">Billions</div>
              <div className="text-sm text-gray-400 mt-2">Vector capacity</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">99.9%</div>
              <div className="text-sm text-gray-400 mt-2">Recall accuracy</div>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
