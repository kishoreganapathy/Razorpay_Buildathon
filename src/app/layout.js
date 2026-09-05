import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata = {
  title: "Razorpay — Autonomous AI Commerce & Instant Payments",
  description:
    "Next-generation conversational commerce powered by Razorpay. Intelligent AI negotiation within merchant-defined policy guardrails.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#02042B] text-slate-100 antialiased selection:bg-[#0066FF] selection:text-white relative">
        {/* Ambient background glows for Razorpay blue atmosphere */}
        <div className="fixed top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-[#0066FF]/10 blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="fixed bottom-0 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-[#00C2FF]/10 blur-[130px] pointer-events-none" />

        <Nav />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>

        <footer className="mt-20 border-t border-slate-800/80 bg-[#02042B] py-8 text-center text-xs text-slate-400">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wider">RAZORPAY</span>
              <span>•</span>
              <span>AI Autonomous Commerce Desk</span>
            </div>
            <p className="text-slate-400">
              © {new Date().getFullYear()} Razorpay Software Private Limited. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

