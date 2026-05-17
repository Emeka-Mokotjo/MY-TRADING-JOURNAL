"use client";

import Link from "next/link";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { TrendingUp, Percent, Calendar, DollarSign, Activity } from "lucide-react";

const mockEquityData = [
  { name: "Mon", value: 10000 },
  { name: "Tue", value: 10150 },
  { name: "Wed", value: 10120 },
  { name: "Thu", value: 10300 },
  { name: "Fri", value: 10250 },
  { name: "Mon", value: 10450 },
  { name: "Tue", value: 10600 },
];

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-white/5 rounded-full blur-[128px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-white/3 rounded-full blur-[128px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Content */}
        <div className="space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm font-medium">
            <Activity className="w-4 h-4" />
            <span>The New Standard in Trade Tracking</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Trade like a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              business.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-400 max-w-xl leading-relaxed">
            The clean, fast, and powerful platform to track your trading performance, stay disciplined, and improve consistency.
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex justify-center items-center px-8 py-4 bg-white text-black font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:-translate-y-1"
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
            <p className="text-sm text-gray-500 pl-2">
              Your trading edge, systemized.
            </p>
          </div>
        </div>

        {/* Right Side: Mock UI */}
        <div className="relative z-10 perspective-1000">
          <div className="relative rounded-2xl bg-[#11151c]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transform-gpu hover:rotate-y-2 hover:-rotate-x-2 transition-transform duration-700 ease-out p-6 flex flex-col gap-6">
            
            {/* Top Bar of Mock UI */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium">Total Equity</span>
                  <span className="text-2xl font-bold text-white">$10,600.00</span>
                </div>
                <div className="flex flex-col pl-4 border-l border-white/10">
                  <span className="text-xs text-gray-500 font-medium">Daily PnL</span>
                  <span className="text-lg font-bold text-success">+$150.00</span>
                </div>
              </div>
              <div className="hidden sm:flex gap-2">
                <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-gray-300">10K Funded</div>
                <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-gray-300">Personal</div>
              </div>
            </div>

            {/* Main Chart Area */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockEquityData}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#ffffff" 
                    strokeWidth={3}
                    dot={{ fill: '#000000', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#ffffff' }}
                  />
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#1f1f1f', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <TrendingUp className="w-5 h-5 text-gray-300 mb-2" />
                <div className="text-xs text-gray-500">Win Rate</div>
                <div className="text-lg font-bold text-white">68.5%</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <Percent className="w-5 h-5 text-gray-300 mb-2" />
                <div className="text-xs text-gray-500">Profit Factor</div>
                <div className="text-lg font-bold text-white">2.4</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <Calendar className="w-5 h-5 text-gray-300 mb-2" />
                <div className="text-xs text-gray-500">Trading Days</div>
                <div className="flex gap-1 mt-1">
                  <div className="w-3 h-3 rounded-sm bg-success/80"></div>
                  <div className="w-3 h-3 rounded-sm bg-danger/80"></div>
                  <div className="w-3 h-3 rounded-sm bg-success/80"></div>
                  <div className="w-3 h-3 rounded-sm bg-success/80"></div>
                  <div className="w-3 h-3 rounded-sm bg-gray-600/50"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
