import { ScatterBoxLoader } from "react-awesome-loaders";

type LoadingBriefingProps = {
  message: string;
};

export function LoadingBriefing({ message }: LoadingBriefingProps) {
  return (
    <div className="relative z-10 flex flex-col items-center bg-[#111111] border border-white/5 p-16 rounded-[3rem] w-full max-w-lg shadow-2xl animate-fade-in-up mt-12">
      <div className="relative mb-10 flex items-center justify-center">
        <ScatterBoxLoader
          primaryColor={"#FF453A"}
          background={"transparent"}
        />
      </div>
      <h2 className="text-xl font-medium mb-6 text-center text-white/90 transition-all h-8 tracking-wide">
        {message}
      </h2>
      <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-accent w-full animate-shimmer" />
      </div>
    </div>
  );
}
