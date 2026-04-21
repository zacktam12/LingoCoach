'use client'

import { 
  BookOpen, 
  MessageCircle, 
  Mic, 
  Brain, 
  Trophy, 
  Target, 
  ArrowRight, 
  Sparkles, 
  Languages, 
  CheckCircle2, 
  Play, 
  Star,
  Quote,
  ShieldCheck,
  Zap,
  Globe,
  Github,
  Linkedin,
  Send
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeLang, setActiveLang] = useState(0)

  const languages = [
    { name: "Spanish", hello: "Hola", color: "from-orange-500 to-red-500" },
    { name: "French", hello: "Bonjour", color: "from-blue-500 to-indigo-500" },
    { name: "German", hello: "Hallo", color: "from-yellow-500 to-orange-500" },
    { name: "Italian", hello: "Ciao", color: "from-green-500 to-emerald-500" },
    { name: "Japanese", hello: "こんにちは", color: "from-red-500 to-pink-500" },
  ]

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
    const interval = setInterval(() => {
      setActiveLang((prev) => (prev + 1) % languages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isAuthenticated, router, languages.length])

  if (isAuthenticated) return null

  const FloatingElement = ({ children, delay = 0, duration = 5, className = "" }: any) => (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Image src="/logo.png" alt="DiburAI" width={40} height={40} className="rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
            <span className="font-black text-xl tracking-tighter">DiburAI</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <button className="text-sm font-bold hover:text-primary transition-colors px-4 py-2">Login</button>
            </Link>
            <Link href="/auth/signup">
              <button className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 transition-all">Get Started</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-40">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] gemini-gradient opacity-[0.03] blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] gemini-gradient opacity-[0.03] blur-[120px] -ml-64 -mb-64" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="text-left">
              <div className="min-h-[160px] md:min-h-[200px] mb-12 relative flex items-center">
                <AnimatePresence mode="wait">
                  <motion.h1 
                    key={activeLang}
                    initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                    className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-[1.1]"
                  >
                    Say <span className={cn("bg-gradient-to-r bg-clip-text text-transparent transition-all duration-1000", languages[activeLang].color)}>
                      {languages[activeLang].hello}
                    </span> <br />
                    to your future.
                  </motion.h1>
                </AnimatePresence>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-6"
              >
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <button className="w-full px-12 py-6 bg-primary text-primary-foreground font-black rounded-[2rem] hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3 group text-xl">
                    Get Started Now
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </motion.div>
            </div>

            <div className="relative hidden lg:block">
              <FloatingElement duration={6}>
                <div className="relative z-10 p-4 bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.1)] overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop" 
                    className="rounded-[2.5rem] w-full shadow-2xl grayscale-[0.2] hover:grayscale-0 transition-all duration-700" 
                    alt="Learning Platform" 
                  />
                </div>
              </FloatingElement>

              {/* Background Shapes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter"><Globe size={24} /> GLOBAL</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter"><Zap size={24} /> STRIKE</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter"><ShieldCheck size={24} /> SECURE</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-blue-500"><Sparkles size={24} /> AI-READY</div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-8 leading-[0.9]">
                Everything you need to <span className="text-primary">master</span> any language.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We've combined decades of linguistic research with the power of large language models to create a truly unique learning experience.
              </p>
            </div>
            <Link href="/auth/signup">
              <button className="px-8 py-4 bg-secondary hover:bg-accent rounded-2xl font-black transition-all flex items-center gap-2">
                Explore All Features <ArrowRight size={18} />
              </button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-6 gap-6">
            {/* Feature 1 */}
            <motion.div whileHover={{ y: -10 }} className="md:col-span-3 p-10 bg-card border border-border rounded-[3rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                <Mic size={160} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-8"><Mic size={28} /></div>
                <h3 className="text-3xl font-black mb-4">Voice Coaching</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">Get real-time feedback on your accent, rhythm, and intonation with our proprietary AI analysis.</p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div whileHover={{ y: -10 }} className="md:col-span-3 p-10 bg-card border border-border rounded-[3rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                <MessageCircle size={160} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-8"><MessageCircle size={28} /></div>
                <h3 className="text-3xl font-black mb-4">AI Conversations</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">Practice natural, unscripted dialogues with AI characters that have unique personalities and goals.</p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div whileHover={{ y: -10 }} className="md:col-span-2 p-10 bg-card border border-border rounded-[3rem] overflow-hidden group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-8"><Brain size={28} /></div>
              <h3 className="text-2xl font-black mb-4">Adaptive Path</h3>
              <p className="text-muted-foreground leading-relaxed">Your curriculum evolves based on your progress, interests, and actual usage patterns.</p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div whileHover={{ y: -10 }} className="md:col-span-2 p-10 bg-card border border-border rounded-[3rem] overflow-hidden group">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-8"><Trophy size={28} /></div>
              <h3 className="text-2xl font-black mb-4">Mastery Metrics</h3>
              <p className="text-muted-foreground leading-relaxed">Visualize your growth with advanced analytics showing vocabulary, grammar, and fluency scores.</p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div whileHover={{ y: -10 }} className="md:col-span-2 p-10 bg-primary text-primary-foreground rounded-[3rem] overflow-hidden group shadow-2xl shadow-primary/20">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-8"><Play size={28} fill="white" /></div>
              <h3 className="text-2xl font-black mb-4">Instant Learning</h3>
              <p className="text-primary-foreground/80 leading-relaxed">Start practicing within seconds. No scheduled classes, no waiting. Just pure learning.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive How it Works */}
      <section id="how-it-works" className="py-32 bg-card/30 backdrop-blur-sm border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-8 leading-[0.9]">Fluency in 3 steps.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">We've simplified the language learning process so you can focus on what actually matters: speaking.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Choose Your Goal", desc: "Select a language and a specific goal—from business travel to casual dating.", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973&auto=format&fit=crop" },
              { step: "02", title: "Engage in AI Chat", desc: "Talk or text with our AI tutor who provides instant corrections and helpful hints.", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" },
              { step: "03", title: "Review & Repeat", desc: "Our AI identifies patterns in your mistakes and generates targeted practice sessions.", img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" },
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group cursor-pointer"
              >
                <div className="relative mb-10 overflow-hidden rounded-[2.5rem] aspect-[4/5]">
                  <img src={s.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={s.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8">
                    <div className="text-6xl font-black text-white/20 mb-4">{s.step}</div>
                    <h3 className="text-3xl font-black text-white mb-2">{s.title}</h3>
                    <p className="text-white/60 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto bg-primary rounded-[3rem] p-10 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/40 group">
             {/* Animated Rings */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full animate-pulse-slow" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/10 rounded-full animate-pulse-slow [animation-delay:1s]" />
             
             <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-10"
             >
               Stop <span className="text-white/40 italic">studying.</span> <br />
               Start <span className="underline decoration-white/30 underline-offset-8">speaking.</span>
             </motion.h2>
             
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link href="/auth/signup">
                 <button className="px-10 py-5 bg-white text-primary font-black rounded-[1.5rem] hover:scale-105 active:scale-95 shadow-2xl transition-all flex items-center gap-3 text-lg group">
                   Get Unlimited Access
                   <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                 </button>
               </Link>
             </div>
             
             <p className="mt-10 text-white/60 font-bold uppercase tracking-widest text-[10px]">Join 50,000+ learners worldwide</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <Image src="/logo.png" alt="DiburAI" width={40} height={40} className="rounded-xl shadow-lg" />
                <span className="font-black text-2xl tracking-tighter">DiburAI</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed mb-8">
               advanced AI language tutor. Build confidence, perfect your accent, and achieve fluency faster than ever.
              </p>
              <div className="flex gap-4">
                <Link href="https://github.com/zacktam12" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary hover:scale-110 transition-all cursor-pointer flex items-center justify-center text-foreground hover:shadow-lg">
                  <Github size={20} />
                </Link>
                <Link href="https://www.linkedin.com/in/zekariastamiru/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary hover:scale-110 transition-all cursor-pointer flex items-center justify-center text-[#0A66C2] hover:shadow-lg hover:shadow-[#0A66C2]/20">
                  <Linkedin size={20} />
                </Link>
                <Link href="https://t.me/zakifytech" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary hover:scale-110 transition-all cursor-pointer flex items-center justify-center text-[#26A5E4] hover:shadow-lg hover:shadow-[#26A5E4]/20">
                  <Send size={20} />
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">Product</h4>
              <ul className="space-y-4">
                {["Features", "Pricing", "Enterprise", "Roadmap"].map((item) => (
                  <li key={item}><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">Support</h4>
              <ul className="space-y-4">
                {["Help Center", "Community", "Privacy Policy", "Terms"].map((item) => (
                  <li key={item}><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8 text-sm font-bold text-muted-foreground">
            <div>&copy; {new Date().getFullYear()} DiburAI. All rights reserved.</div>
            <div className="flex items-center gap-8">
              <span>Made with <Sparkles className="inline text-primary mx-1" size={14} /> for learners</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


