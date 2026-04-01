import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export default function Slide12() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          RAG Pipeline Architecture
        </h2>

        <div className="mb-12">
          <FlowDiagram
            nodes={[
              { id: 'doc', label: 'Documents', color: 'gray' },
              { id: 'chunk', label: 'Chunking', color: 'blue' },
              { id: 'embed', label: 'Embedding', color: 'green' },
              { id: 'store', label: 'Vector Store', color: 'purple' },
              { id: 'query', label: 'User Query', color: 'yellow' },
              { id: 'retrieve', label: 'Retrieval', color: 'orange' },
              { id: 'generate', label: 'LLM Generate', color: 'red' },
            ]}
            edges={[
              { from: 'doc', to: 'chunk', label: 'Split' },
              { from: 'chunk', to: 'embed', label: 'Vectorize' },
              { from: 'embed', to: 'store', label: 'Index' },
              { from: 'query', to: 'embed', label: 'Encode' },
              { from: 'embed', to: 'retrieve', label: 'Search' },
              { from: 'store', to: 'retrieve', label: 'Top-K' },
              { from: 'retrieve', to: 'generate', label: 'Context' },
            ]}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card title="Ingestion" color="blue">
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Document loading</li>
              <li>Text chunking (500-1000 tokens)</li>
              <li>Overlap for continuity</li>
              <li>Metadata extraction</li>
            </ul>
          </Card>

          <Card title="Retrieval" color="purple">
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Query embedding</li>
              <li>Similarity search (cosine/L2)</li>
              <li>Top-K filtering (5-10 docs)</li>
              <li>Reranking (optional)</li>
            </ul>
          </Card>

          <Card title="Generation" color="red">
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Context injection</li>
              <li>Prompt construction</li>
              <li>LLM inference</li>
              <li>Citation tracking</li>
            </ul>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg text-center">
          <p className="text-gray-300">
            <strong>Key Benefit:</strong> Grounds LLM responses in factual, domain-specific knowledge
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
