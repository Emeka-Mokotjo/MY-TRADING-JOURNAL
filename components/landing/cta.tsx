import Link from "next/link";

export function LandingCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-600/5 blur-[150px] -z-10 rounded-full w-full h-full" />
      
      <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          Ready to trade with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">structure?</span>
        </h2>
        <p className="text-lg text-gray-400">
          Join serious traders who treat their operation like a business. Stop guessing, start measuring.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/signup"
            className="inline-flex justify-center items-center px-8 py-4 bg-primary text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:-translate-y-1"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex justify-center items-center px-8 py-4 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
          >
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}
