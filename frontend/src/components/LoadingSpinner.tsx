interface LoadingSpinnerProps {
  text?: string;
}

export default function LoadingSpinner({ text = '로딩중...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-10">
      <div className="w-12 h-12 border-4 border-white/10 border-t-blue-400 rounded-full animate-spin" />
      <span className="text-xl text-indigo-200 font-medium">{text}</span>
    </div>
  );
}
