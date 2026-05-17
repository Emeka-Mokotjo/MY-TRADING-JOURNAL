"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, TrendingUp, DollarSign, Calendar, BarChart3, Shield, Target, Wallet, Activity, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Mesh */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Chart Grid Overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" className="text-blue-400">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}

// Floating Dashboard Mockup
function FloatingDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const mockEquityData = [
    { time: "09:30", value: 10000 },
    { time: "10:00", value: 10150 },
    { time: "10:30", value: 10120 },
    { time: "11:00", value: 10300 },
    { time: "11:30", value: 10250 },
    { time: "12:00", value: 10450 },
    { time: "12:30", value: 10600 },
  ];

  return (
    <motion.div
      className="relative w-full max-w-lg mx-auto lg:mx-0"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      {/* Main Dashboard Card */}
      <motion.div
        className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300 font-medium">Live Session</span>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: false,
              timeZone: 'UTC'
            })} UTC
          </div>
        </div>

        {/* Equity Chart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Equity Curve</span>
            <span className="text-sm text-green-400 font-mono">+6.00%</span>
          </div>
          <div className="h-32 bg-black/20 rounded-lg p-3">
            <svg viewBox="0 0 300 120" className="w-full h-full">
              <motion.path
                d="M0,100 L50,85 L100,90 L150,70 L200,75 L250,55 L300,40"
                fill="none"
                stroke="url(#equityGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1 }}
              />
              <defs>
                <linearGradient id="equityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3"
            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="text-xs text-gray-400 mb-1">Total P&L</div>
            <div className="text-lg font-bold text-green-400">$1,247.50</div>
          </motion.div>
          <motion.div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3"
            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="text-xs text-gray-400 mb-1">Win Rate</div>
            <div className="text-lg font-bold text-blue-400">68.2%</div>
          </motion.div>
          <motion.div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3"
            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="text-xs text-gray-400 mb-1">Trades Today</div>
            <div className="text-lg font-bold text-white">12</div>
          </motion.div>
          <motion.div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3"
            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="text-xs text-gray-400 mb-1">Risk/Reward</div>
            <div className="text-lg font-bold text-purple-400">1:2.3</div>
          </motion.div>
        </div>

        {/* Calendar Preview */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Trading Calendar</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={day} className={`text-center p-1 rounded ${i < 5 ? 'bg-green-500/20 text-green-400' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Zap className="w-4 h-4 text-blue-400" />
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full flex items-center justify-center"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <TrendingUp className="w-3 h-3 text-green-400" />
      </motion.div>
    </motion.div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: any;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      className="group relative bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.1)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="w-12 h-12 bg-blue-500/10 border border-blue-400/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors duration-300">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      <AnimatedBackground />

      {/* Navigation */}
      <motion.nav
        className="relative z-50 flex items-center justify-between p-6 lg:px-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">BemoEdge</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#why" className="text-gray-300 hover:text-white transition-colors">Why BemoEdge</a>
          <Link
            href="/login"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side: Content */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-sm font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Activity className="w-4 h-4" />
                <span>The Trading Operating System</span>
              </motion.div>

              <motion.h1
                className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Trade Like a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Business.
                </span>
              </motion.h1>

              <motion.p
                className="text-lg lg:text-xl text-gray-400 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                The professional operating system for traders who value discipline, structure, analytics, and long-term performance.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Link
                  href="/signup"
                  className="group relative inline-flex justify-center items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    Enter BemoEdge
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                <button className="group relative inline-flex justify-center items-center px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300">
                  <span className="flex items-center gap-2">
                    View Features
                    <BarChart3 className="w-4 h-4" />
                  </span>
                </button>
              </motion.div>
            </motion.div>

            {/* Right Side: Dashboard Mockup */}
            <FloatingDashboard />
          </div>
        </div>
      </section>

      {/* Platform Positioning Section */}
      <motion.section
        className="py-24 px-6 lg:px-8 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-4xl lg:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            The Trading Operating System
          </motion.h2>
          <motion.p
            className="text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            BemoEdge combines performance analytics, capital management, discipline systems, psychology tracking, and wealth management into one institutional-grade platform.
          </motion.p>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Complete Trading Infrastructure
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every tool you need to transform trading from a hobby into a professional operation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Target}
              title="Trade Tracking"
              description="Precision logging of every trade with setup analysis, execution details, and performance metrics."
              delay={0.1}
            />
            <FeatureCard
              icon={Wallet}
              title="Capital Management"
              description="Multi-account tracking with risk management, position sizing, and capital allocation rules."
              delay={0.2}
            />
            <FeatureCard
              icon={DollarSign}
              title="Payout Tracking"
              description="Automated payout calculations, tax tracking, and withdrawal scheduling for consistent cash flow."
              delay={0.3}
            />
            <FeatureCard
              icon={Calendar}
              title="Trading Calendar"
              description="Visual trading schedule with session tracking, market hours, and performance correlation."
              delay={0.4}
            />
            <FeatureCard
              icon={BarChart3}
              title="Analytics Engine"
              description="Deep performance analytics with equity curves, drawdown analysis, and statistical modeling."
              delay={0.5}
            />
            <FeatureCard
              icon={Shield}
              title="Discipline Rules"
              description="Automated rule enforcement with violation tracking and behavioral pattern analysis."
              delay={0.6}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Wealth Management"
              description="Long-term wealth tracking with portfolio optimization and financial goal planning."
              delay={0.7}
            />
            <FeatureCard
              icon={Activity}
              title="Performance Reports"
              description="Comprehensive reporting with customizable dashboards and export capabilities."
              delay={0.8}
            />
            <FeatureCard
              icon={Clock}
              title="Journal Timeline"
              description="Chronological trade journal with market context, emotions, and decision rationale."
              delay={0.9}
            />
          </div>
        </div>
      </section>

      {/* Why BemoEdge Section */}
      <motion.section
        id="why"
        className="py-24 px-6 lg:px-8 bg-black/20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Beyond Simple Trade Journals
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Most trading platforms only track what happened. BemoEdge tracks why it happened, how to prevent it from happening again, and how to scale what works.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Performance", desc: "Win rates, profit factors, expectancy, and statistical significance" },
                  { title: "Discipline", desc: "Rule adherence, risk management, and behavioral consistency" },
                  { title: "Psychology", desc: "Emotional tracking, decision quality, and mental state correlation" },
                  { title: "Wealth", desc: "Capital growth, withdrawal strategies, and long-term compounding" },
                  { title: "Consistency", desc: "Pattern recognition, process optimization, and systematic improvement" },
                  { title: "Capital Growth", desc: "Risk-adjusted returns, drawdown management, and scaling strategies" }
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Command Center</h3>
                  <p className="text-gray-400">Your trading operations dashboard</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Active Rules", value: "12", color: "text-blue-400" },
                    { label: "Risk Score", value: "A+", color: "text-green-400" },
                    { label: "Consistency", value: "94%", color: "text-cyan-400" },
                    { label: "Growth Rate", value: "+23%", color: "text-purple-400" }
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-24 px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-4xl lg:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Ready to Trade Like a Professional?
          </motion.h2>
          <motion.p
            className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join the traders who have transformed their approach from casual speculation to systematic performance.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              href="/signup"
              className="group relative inline-flex justify-center items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Start Your Professional Journey
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">BemoEdge</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>© {new Date().getFullYear()} BemoEdge. All rights reserved.</span>
              <div className="flex gap-4">
                <span className="hover:text-gray-300 cursor-pointer transition-colors">Privacy</span>
                <span className="hover:text-gray-300 cursor-pointer transition-colors">Terms</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
