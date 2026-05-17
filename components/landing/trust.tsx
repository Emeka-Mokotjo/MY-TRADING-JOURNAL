import { CheckCircle2 } from "lucide-react";

export function LandingTrust() {
  const points = [
    "Track multiple funded accounts",
    "Analyze performance like a prop firm",
    "Stay disciplined with structured systems"
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0F14]/80 to-transparent z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">serious traders.</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-lg">
              We stripped away the noise and focused on what actually moves the needle. Bemo Edge is a professional operating system for your trading career.
            </p>
            <ul className="space-y-4">
              {points.map((point, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-300 font-medium">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            <div className="relative rounded-2xl bg-gradient-to-tr from-white/5 to-white/10 p-[1px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-xl opacity-50 -z-10 rounded-2xl" />
              <div className="bg-[#0B0F14] rounded-2xl p-8 h-full">
                <div className="flex flex-col gap-6">
                  {/* Mock small stat cards */}
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-400 rounded-sm" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 bg-white/20 rounded" />
                        <div className="h-2 w-32 bg-white/10 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-success/20 rounded flex items-center justify-center">
                        <div className="h-2 w-8 bg-success/60 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
