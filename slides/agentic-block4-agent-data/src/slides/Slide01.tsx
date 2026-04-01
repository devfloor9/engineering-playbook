import { SlideWrapper } from '@shared/components';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center space-y-8">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Block 4
          </h1>
          <h2 className="text-5xl font-bold text-white">
            Agents & Data Infrastructure
          </h2>
          <div className="mt-12 text-2xl text-gray-400">
            <p>Building Intelligent Agent Systems</p>
            <p className="mt-4">with Knowledge Storage & Retrieval</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
