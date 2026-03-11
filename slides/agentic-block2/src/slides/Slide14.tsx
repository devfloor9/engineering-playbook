import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { Database, Brain, Search } from 'lucide-react';

export default function Slide14() {
  const ragCode = `from langchain_community.vectorstores import Milvus
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA

# 임베딩 모델 설정
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Milvus 벡터 스토어 연결
vectorstore = Milvus(
    embedding_function=embeddings,
    connection_args={
        "host": "milvus-proxy.ai-data.svc.cluster.local",
        "port": "19530",
    },
    collection_name="knowledge_base",
)

# LLM 설정
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# RAG 체인 구성
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(
        search_type="mmr",  # Maximum Marginal Relevance
        search_kwargs={"k": 5, "fetch_k": 10}
    ),
    return_source_documents=True,
)

# 질의 수행
result = qa_chain.invoke({"query": "GPU 리소스 관리 방법은?"})
print(result['result'])`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-emerald-400">Milvus RAG 파이프라인 통합</h2>
        <p className="text-xl text-gray-400 mb-6">LangChain/LlamaIndex 연동</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <Database className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">1. 벡터화</h4>
            <p className="text-sm text-gray-400">
              문서를 청크로 분할하고 임베딩 모델로 벡터화하여 Milvus에 저장
            </p>
          </Card>

          <Card className="p-5">
            <Search className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-purple-300">2. 검색</h4>
            <p className="text-sm text-gray-400">
              사용자 쿼리를 벡터화하여 유사한 문서를 Milvus에서 검색 (MMR, topK)
            </p>
          </Card>

          <Card className="p-5">
            <Brain className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">3. 생성</h4>
            <p className="text-sm text-gray-400">
              검색된 컨텍스트와 쿼리를 LLM에 전달하여 답변 생성
            </p>
          </Card>
        </div>

        <CodeBlock
          code={ragCode}
          language="python"
          title="LangChain RAG 파이프라인"
        />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <h5 className="text-sm font-semibold text-blue-300 mb-2">검색 최적화</h5>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <span className="text-blue-400">MMR:</span> 다양성을 고려한 검색 결과</li>
              <li>• <span className="text-cyan-400">topK:</span> 반환할 문서 수 조정</li>
              <li>• <span className="text-emerald-400">scoreThreshold:</span> 유사도 임계값</li>
            </ul>
          </div>
          <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
            <h5 className="text-sm font-semibold text-emerald-300 mb-2">지원 프레임워크</h5>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <span className="text-emerald-400">LangChain:</span> 포괄적 RAG 프레임워크</li>
              <li>• <span className="text-purple-400">LlamaIndex:</span> 데이터 중심 RAG</li>
              <li>• <span className="text-amber-400">Haystack:</span> NLP 파이프라인</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
