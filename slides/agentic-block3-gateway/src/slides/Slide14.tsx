import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

const Slide14: React.FC = () => {
  return (
    <SlideWrapper slideNumber={14} title="Multimodal & TTS Routing">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-blue-400 mb-6">
          Path-Based Routing at kgateway
        </h2>

        <Card title="API Endpoint Mapping">
          <div className="space-y-3">
            <div className="p-4 bg-blue-900/30 border-l-4 border-blue-500 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-blue-300">/v1/chat/completions</span>
                <span className="text-gray-400">Text-based chat</span>
              </div>
              <div className="text-sm text-gray-500">→ Bifrost → GPT-4 / Claude / Bedrock</div>
            </div>

            <div className="p-4 bg-green-900/30 border-l-4 border-green-500 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-green-300">/v1/embeddings</span>
                <span className="text-gray-400">Text embeddings</span>
              </div>
              <div className="text-sm text-gray-500">→ Embedding service → text-embedding-3-small</div>
            </div>

            <div className="p-4 bg-purple-900/30 border-l-4 border-purple-500 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-purple-300">/v1/images/generations</span>
                <span className="text-gray-400">Image generation</span>
              </div>
              <div className="text-sm text-gray-500">→ DALL-E service / Stable Diffusion</div>
            </div>

            <div className="p-4 bg-orange-900/30 border-l-4 border-orange-500 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-orange-300">/v1/audio/speech</span>
                <span className="text-gray-400">Text-to-Speech</span>
              </div>
              <div className="text-sm text-gray-500">→ TTS service → OpenAI TTS / AWS Polly</div>
            </div>

            <div className="p-4 bg-pink-900/30 border-l-4 border-pink-500 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-pink-300">/v1/audio/transcriptions</span>
                <span className="text-gray-400">Speech-to-Text</span>
              </div>
              <div className="text-sm text-gray-500">→ STT service → Whisper / AWS Transcribe</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Multimodal Routing">
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="font-bold text-blue-300 mb-2">Vision Models</div>
                <p className="text-sm text-gray-400 mb-2">
                  Images + text → GPT-4 Vision, Claude 3 Opus
                </p>
                <div className="text-xs font-mono text-gray-500">
                  x-model-type: vision
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="font-bold text-green-300 mb-2">Audio Models</div>
                <p className="text-sm text-gray-400 mb-2">
                  Audio → Whisper, Gemini audio
                </p>
                <div className="text-xs font-mono text-gray-500">
                  x-model-type: audio
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="font-bold text-purple-300 mb-2">Video Models</div>
                <p className="text-sm text-gray-400 mb-2">
                  Video → Gemini Pro 1.5 (video understanding)
                </p>
                <div className="text-xs font-mono text-gray-500">
                  x-model-type: video
                </div>
              </div>
            </div>
          </Card>

          <Card title="TTS/STT Routing">
            <div className="space-y-4">
              <div className="p-4 bg-orange-900/30 rounded-lg">
                <div className="font-bold text-orange-300 mb-2">Text-to-Speech</div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• OpenAI TTS (alloy, echo, nova)</li>
                  <li>• AWS Polly (neural voices)</li>
                  <li>• ElevenLabs (premium quality)</li>
                  <li>• Provider selection by quality/cost</li>
                </ul>
              </div>

              <div className="p-4 bg-pink-900/30 rounded-lg">
                <div className="font-bold text-pink-300 mb-2">Speech-to-Text</div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Whisper (high accuracy)</li>
                  <li>• AWS Transcribe (real-time)</li>
                  <li>• Google STT (multilingual)</li>
                  <li>• Language-based routing</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Card title="HTTPRoute Example">
          <div className="p-4 bg-gray-900/50 rounded font-mono text-xs text-gray-300">
            <div className="text-blue-400">rules:</div>
            <div className="ml-4">
              <div className="text-green-400">- matches:</div>
              <div className="ml-4">
                <div>- path: /v1/images/generations</div>
                <div className="text-purple-400">backendRefs:</div>
                <div className="ml-4">- name: dalle-service</div>
              </div>
              <div className="text-green-400 mt-2">- matches:</div>
              <div className="ml-4">
                <div>- path: /v1/audio/speech</div>
                <div className="text-purple-400">backendRefs:</div>
                <div className="ml-4">- name: tts-service</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
          <p className="text-lg text-gray-300">
            <strong className="text-blue-400">Benefit:</strong> Single gateway endpoint, path-based routing to specialized backends
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide14;
