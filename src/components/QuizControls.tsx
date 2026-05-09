interface QuizControlsProps {
  onPrev?: () => void;
  onNext: () => void;
  onSkip: () => void;
  onRandom: () => void;
  hasPrev?: boolean;
  isLast?: boolean;
  poolEmpty?: boolean;
}

export default function QuizControls({
  onPrev,
  onNext,
  onSkip,
  onRandom,
  hasPrev,
  poolEmpty,
}: QuizControlsProps) {
  if (poolEmpty) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {hasPrev && (
        <button
          onClick={onPrev}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700"
        >
          上一题
        </button>
      )}
      <button
        onClick={onSkip}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700"
      >
        跳过
      </button>
      <button
        onClick={onRandom}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700"
      >
        随机
      </button>
      <button
        onClick={onNext}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
      >
        下一题
      </button>
    </div>
  );
}