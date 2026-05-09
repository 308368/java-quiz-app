interface RestoreButtonProps {
  onClick: () => void;
  label?: string;
}

export default function RestoreButton({ onClick, label = '重新加入题库' }: RestoreButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-900/50 rounded-lg text-sm font-medium transition-colors"
    >
      {label}
    </button>
  );
}