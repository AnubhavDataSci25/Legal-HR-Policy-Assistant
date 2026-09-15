import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  BrainCircuit, 
  Database, 
  Search, 
  ShieldCheck, 
  Scale, 
  Users, 
  Briefcase, 
  GraduationCap, 
  ArrowRight, 
  Menu, 
  X,
  Server,
  Zap,
  Network,
  Cpu,
  Layers,
  FileCheck,
  Code
} from 'lucide-react';


// Custom hook for scroll-triggered animations (performant alternative to heavy libraries)
const useInView = (options = { threshold: 0.1, triggerOnce: true }) => {
  const [ref, setRef] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (options.triggerOnce) observer.unobserve(ref);
      } else if (!options.triggerOnce) {
        setIsVisible(false);
      }
    }, options);
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options.threshold, options.triggerOnce]);

  return [setRef, isVisible];
};

// Reusable component for fade-up animation
const Reveal = ({ children, delay = 0, className = "", direction = "up" }) => {
  const [setRef, isVisible] = useInView();
  
  let translateClass = "translate-y-8";
  if (direction === "left") translateClass = "-translate-x-8";
  if (direction === "right") translateClass = "translate-x-8";
  if (direction === "down") translateClass = "-translate-y-8";

  return (
    <div
      ref={setRef}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${translateClass}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-dark: #080D17;
    --bg-surface: #111827;
    --accent-blue: #4F8DF7;
    --accent-cyan: #38BDF8;
  }

  body {
    background-color: var(--bg-dark);
    color: #F9FAFB;
    font-family: 'Crimson Pro', 'Charter', 'Bitstream Charter', 'Sitka Text', 'Cambria', serif;
    overflow-x: hidden;
  }

  /* Custom subtle grid background */
  .bg-grid-pattern {
    background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
    -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
  }

  /* Smooth floating animation for hero cards */
  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-10px) scale(1.02); }
  }
  
  .animate-float-slow { animation: float 6s ease-in-out infinite; }
  .animate-float-medium { animation: float 4s ease-in-out infinite; }
  .animate-float-fast { animation: float 3s ease-in-out infinite; }

  /* Pulse for connection lines */
  @keyframes line-pulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.8; box-shadow: 0 0 10px var(--accent-blue); }
  }
  .animate-line { animation: line-pulse 2s infinite; }

  /* Glassmorphism utilities */
  .glass-panel {
    background: rgba(17, 24, 39, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .glass-card {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
  }
  
  .glass-card:hover {
    border-color: rgba(79, 141, 247, 0.3);
    box-shadow: 0 10px 30px -10px rgba(79, 141, 247, 0.15);
    transform: translateY(-2px);
  }

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#080d17]/80 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/20 blur-md group-hover:bg-blue-400/30 transition-colors"></div>
            <FileText className="text-blue-400 w-5 h-5 relative z-10" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Policy Assistant</h1>
            <p className="text-[10px] uppercase tracking-wider text-blue-400 font-medium">Document Q&A</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#about" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover:w-full opacity-0 group-hover:opacity-100 shadow-[0_0_8px_rgba(79,141,247,0.8)]"></span>
          </a>
          <a href="#use-cases" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
            Use Cases
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover:w-full opacity-0 group-hover:opacity-100 shadow-[0_0_8px_rgba(79,141,247,0.8)]"></span>
          </a>
          <a href="#technology" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
            Technology
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-500 transition-all group-hover:w-full opacity-0 group-hover:opacity-100 shadow-[0_0_8px_rgba(79,141,247,0.8)]"></span>
          </a>
          <Link 
            to="/workspace" 
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,141,247,0.3)] hover:shadow-[0_0_25px_rgba(79,141,247,0.5)] active:scale-95 flex items-center gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-gray-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div className={`md:hidden absolute top-full left-0 w-full glass-panel transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-64 border-b' : 'max-h-0 border-transparent'}`}>
        <div className="flex flex-col p-6 gap-4">
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-blue-400">About</a>
          <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-blue-400">Use Cases</a>
          <a href="#technology" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-blue-400">Technology</a>
          <Link to="/workspace" className="text-blue-400 font-medium flex items-center gap-2">Get Started <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </nav>
  );
};

const HeroVisualization = () => {
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
      
      {/* Main Flow Container */}
      <div className="relative w-full max-w-md aspect-square">
        
        {/* Node 1: Document */}
        <div className="absolute top-10 left-0 animate-float-slow z-20">
          <div className="glass-panel p-4 rounded-xl flex items-center gap-3 shadow-lg border-blue-500/30">
            <div className="bg-red-500/20 p-2 rounded-lg"><FileText className="text-red-400 w-5 h-5" /></div>
            <div>
              <p className="text-sm text-white font-medium">hr_policy_2026.pdf</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Processed
              </p>
            </div>
          </div>
        </div>

        {/* Node 2: Database / Chunks */}
        <div className="absolute top-40 right-4 animate-float-medium z-20" style={{ animationDelay: '1s' }}>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-3 shadow-lg">
            <div className="bg-blue-500/20 p-2 rounded-lg"><Database className="text-blue-400 w-5 h-5" /></div>
            <div>
              <p className="text-sm text-white font-medium">Vector Store</p>
              <p className="text-xs text-gray-400">4,281 chunks indexed</p>
            </div>
          </div>
        </div>

        {/* Node 3: User Query */}
        <div className="absolute bottom-32 left-8 animate-float-fast z-30" style={{ animationDelay: '0.5s' }}>
          <div className="glass-panel p-4 rounded-xl max-w-[220px] shadow-lg border-indigo-500/30">
            <p className="text-xs text-indigo-300 mb-1 font-semibold uppercase tracking-wider">Query</p>
            <p className="text-sm text-white leading-relaxed">"What is the remote work allowance policy?"</p>
          </div>
        </div>

        {/* Node 4: AI Answer */}
        <div className="absolute bottom-4 right-0 animate-float-medium z-30" style={{ animationDelay: '1.5s' }}>
          <div className="glass-panel p-4 rounded-xl shadow-[0_0_20px_rgba(79,141,247,0.2)] border-blue-400/40">
            <p className="text-xs text-blue-400 mb-1 font-semibold flex items-center gap-1">
              <BrainCircuit className="w-3 h-3" /> Answer Generated
            </p>
            <p className="text-sm text-gray-200 leading-relaxed max-w-[240px]">
              Employees are eligible for a $50/month stipend for home office expenses...
            </p>
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Source: Employee Handbook</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Page 14</span>
            </div>
          </div>
        </div>

        {/* Connecting Lines (Decorative) */}
        <svg className="absolute inset-0 w-full h-full -z-10 opacity-30" viewBox="0 0 400 400">
          <path d="M 80 80 Q 200 150 320 180" fill="none" stroke="#4F8DF7" strokeWidth="2" strokeDasharray="5,5" className="animate-line" />
          <path d="M 320 200 Q 200 250 150 320" fill="none" stroke="#4F8DF7" strokeWidth="2" strokeDasharray="5,5" className="animate-line" style={{animationDelay: '1s'}} />
          <path d="M 160 340 Q 250 360 300 340" fill="none" stroke="#38BDF8" strokeWidth="2" className="animate-line" style={{animationDelay: '0.5s'}} />
        </svg>
      </div>
    </div>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left: Content */}
        <div className="max-w-2xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border-blue-500/30 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wider text-blue-300 uppercase">AI-Powered Document Intelligence</span>
            </div>
          </Reveal>
          
          <Reveal delay={100}>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Ask Your Documents.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Get Answers You Can Trust.
              </span>
            </h1>
          </Reveal>
          
          <Reveal delay={200}>
            <p className="text-xl text-gray-400 mb-4 font-light">
              Turn complex legal and HR documents into instant, cited answers.
            </p>
            <p className="text-base text-gray-500 mb-8 max-w-lg leading-relaxed">
              Policy Assistant uses Retrieval-Augmented Generation (RAG) to understand your documents, retrieve relevant information, and generate source-grounded answers with page-level citations.
            </p>
          </Reveal>
          
          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/workspace" 
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_20px_rgba(79,141,247,0.4)] hover:shadow-[0_0_30px_rgba(79,141,247,0.6)] flex items-center justify-center gap-2 group"
              >
                Get Started 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#about" 
                className="px-8 py-3.5 rounded-xl glass-panel hover:bg-white/5 text-gray-300 font-medium transition-colors flex items-center justify-center"
              >
                Explore How It Works ↓
              </a>
            </div>
          </Reveal>
        </div>

        {/* Right: Visual */}
        <Reveal delay={200} direction="left" className="hidden lg:block">
          <HeroVisualization />
        </Reveal>
      </div>
    </section>
  );
};

const PipelineStep = ({ icon: Icon, title, desc, delay, isLast }) => (
  <Reveal delay={delay} className="flex-1 min-w-[140px] relative">
    <div className="flex flex-col items-center text-center group">
      <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4 relative z-10 group-hover:border-blue-500/50 group-hover:shadow-[0_0_15px_rgba(79,141,247,0.2)] transition-all">
        <Icon className="w-7 h-7 text-blue-400" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-tight">{desc}</p>
    </div>
    {!isLast && (
      <div className="hidden md:block absolute top-8 left-[50%] w-full h-[2px] -z-10">
        <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-blue-500/20 relative">
          <div className="absolute top-0 left-0 h-full w-[20%] bg-blue-400 rounded-full blur-[2px] animate-[slide_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    )}
  </Reveal>
);

const AboutPipeline = () => {
  return (
    <section id="about" className="py-24 relative border-t border-white/5 bg-[#0b1020]">
      <style>{`
        @keyframes slide {
          0% { left: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Understand. Retrieve. Answer.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Your documents become an intelligent, searchable knowledge source through our advanced Retrieval-Augmented Generation pipeline.</p>
          </Reveal>
        </div>

        <div className="flex flex-wrap md:flex-nowrap justify-between gap-8 md:gap-4 relative pt-4">
          <PipelineStep delay={0} icon={FileText} title="Document" desc="PDF Extraction" />
          <PipelineStep delay={100} icon={Layers} title="Chunking" desc="Semantic Splitting" />
          <PipelineStep delay={200} icon={Database} title="Vector DB" desc="Embedding Storage" />
          <PipelineStep delay={300} icon={Search} title="Hybrid Search" desc="Vector + BM25" />
          <PipelineStep delay={400} icon={Cpu} title="Reranking" desc="Cross-Encoder" />
          <PipelineStep delay={500} icon={BrainCircuit} title="LLM" desc="Grounded Generation" isLast />
        </div>
      </div>
    </section>
  );
};

const WhyRAG = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-900/5 blur-[120px] rounded-full pointer-events-none transform -translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <Reveal>
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Retrieval-Augmented Generation?</h2>
            <p className="text-gray-400">Bridging the gap between raw AI capability and enterprise reliability.</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          <Reveal delay={100}>
            <div className="glass-card p-8 rounded-2xl h-full border-t border-t-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Database className="w-24 h-24 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 relative z-10">Up-to-Date Knowledge</h3>
              <p className="text-sm text-gray-400 relative z-10 leading-relaxed">
                Update organizational documents by simply uploading a new PDF without the immense cost of retraining the underlying language model.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="glass-card p-8 rounded-2xl h-full border-t border-t-cyan-500/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-24 h-24 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 relative z-10">Grounded Answers</h3>
              <p className="text-sm text-gray-400 relative z-10 leading-relaxed">
                Answers are generated exclusively using retrieved document context, preventing hallucinations and reliance on unsupported generalized assumptions.
              </p>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="glass-card p-8 rounded-2xl h-full border-t border-t-indigo-500/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileCheck className="w-24 h-24 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 relative z-10">Traceable Responses</h3>
              <p className="text-sm text-gray-400 relative z-10 leading-relaxed">
                Trust is built through verification. Every claim generated by the assistant includes direct source references and page citations to the original documents.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const UseCaseCard = ({ icon: Icon, title, desc, delay }) => (
  <Reveal delay={delay}>
    <div className="glass-card p-6 rounded-2xl group hover:-translate-y-1 transition-transform duration-300 h-full">
      <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-colors">
        <Icon className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </Reveal>
);

const UseCases = () => {
  const cases = [
    { icon: Users, title: "HR Teams", desc: "Quickly find answers across employee handbooks, benefits guides, and HR policies." },
    { icon: Scale, title: "Legal Teams", desc: "Search through contracts, legal precedents, and lengthy regulatory material instantly." },
    { icon: ShieldCheck, title: "Compliance", desc: "Find relevant rules and policy requirements without reading hundreds of pages." },
    { icon: Briefcase, title: "Employees", desc: "Ask questions about company policies in natural language and get immediate answers." },
    { icon: Server, title: "Organizations", desc: "Turn large, dormant internal document collections into an active, searchable knowledge base." },
    { icon: GraduationCap, title: "Researchers", desc: "Explore large PDF-based policy, academic, and legal documents efficiently." }
  ];

  return (
    <section id="use-cases" className="py-24 bg-[#0b1020] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for Information-Heavy Organizations</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Designed to save time and ensure accuracy across various departments.</p>
          </Reveal>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <UseCaseCard key={i} icon={c.icon} title={c.title} desc={c.desc} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <Reveal>
          <div className="mb-16 md:w-2/3">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">More Than Just a Chatbot</h2>
            <p className="text-gray-400 text-lg">A sophisticated retrieval architecture designed for precision and reliability.</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <Reveal delay={100} direction="up">
            <div className="flex gap-4">
              <div className="mt-1"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><Network className="w-4 h-4 text-blue-400" /></div></div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Hybrid Search</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Combines semantic vector search (understanding meaning) with BM25 keyword retrieval (exact match) to ensure both conceptual and specific terminology queries are handled perfectly.</p>
              </div>
            </div>
          </Reveal>
          
          {/* Feature 2 */}
          <Reveal delay={200} direction="up">
            <div className="flex gap-4">
              <div className="mt-1"><div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center"><Zap className="w-4 h-4 text-indigo-400" /></div></div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Smart Reranking</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Uses a local cross-encoder model to re-evaluate and re-order initially retrieved chunks, significantly improving the relevance of context sent to the LLM.</p>
              </div>
            </div>
          </Reveal>

          {/* Feature 3 */}
          <Reveal delay={300} direction="up">
            <div className="flex gap-4">
              <div className="mt-1"><div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center"><FileText className="w-4 h-4 text-cyan-400" /></div></div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Source Citations</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Answers are never black boxes. Every response includes specific document excerpts and page references, allowing users to verify the information instantly.</p>
              </div>
            </div>
          </Reveal>

          {/* Feature 4 */}
          <Reveal delay={400} direction="up">
            <div className="flex gap-4">
              <div className="mt-1"><div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div></div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Hallucination Guardrails</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Built-in confidence awareness. If relevant context is unavailable or similarity scores are too low, the system explicitly refuses to guess, ensuring zero hallucination.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const TechBadge = ({ children }) => (
  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 font-mono">
    {children}
  </span>
);

const TechStack = () => {
  return (
    <section id="technology" className="py-24 bg-[#0b1020] border-y border-white/5 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powered by a Modern AI Stack</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Built with open-source tools and cutting-edge frameworks for maximum performance and security.</p>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Frontend/Backend */}
          <Reveal delay={100} className="flex flex-col gap-4 h-full">
            <div className="glass-card p-6 rounded-2xl h-full border-t border-t-blue-500/20 flex flex-col relative overflow-hidden group">
              
              {/* Application Visual (Moved to right) */}
              <div className="absolute right-0 inset-y-0 w-1/2 flex justify-end items-center opacity-30 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-r-2xl">
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500/10 to-transparent z-0"></div>
                <div className="relative w-32 h-40 mr-2 flex flex-col justify-center transform group-hover:scale-105 transition-transform duration-700 z-10">
                  <div className="relative z-10 w-full h-20 border border-white/10 rounded-lg bg-[#080d17]/80 flex flex-col overflow-hidden shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 backdrop-blur-sm">
                    <div className="h-4 bg-white/5 border-b border-white/10 flex items-center px-2 gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400/60"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400/60"></div>
                    </div>
                    <div className="flex-1 p-2.5 flex flex-col gap-2">
                      <div className="h-1.5 w-1/2 bg-blue-400/50 rounded"></div>
                      <div className="h-1.5 w-full bg-white/10 rounded"></div>
                      <div className="h-1.5 w-3/4 bg-white/10 rounded"></div>
                    </div>
                  </div>
                  <div className="absolute top-1/2 right-1/2 w-32 h-32 bg-blue-500/20 blur-[30px] rounded-full translate-x-1/4 -translate-y-1/2 -z-10"></div>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10"><Code className="w-4 h-4"/> Application Layer</h3>
              <div className="space-y-5 relative z-10 flex-1 w-2/3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Frontend</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>React</TechBadge><TechBadge>Vite</TechBadge><TechBadge>Tailwind CSS</TechBadge></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Backend API</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>Python 3.11</TechBadge><TechBadge>FastAPI</TechBadge></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Deployment</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>Vercel</TechBadge><TechBadge>Render</TechBadge></div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* RAG Core */}
          <Reveal delay={200} className="flex flex-col gap-4 lg:-translate-y-4 h-full">
            <div className="glass-card p-6 rounded-2xl h-full border-t border-t-indigo-500/20 shadow-[0_10px_40px_rgba(79,141,247,0.1)] flex flex-col relative overflow-hidden group">
              
              {/* Retrieval Visual (Moved to right) */}
              <div className="absolute right-0 inset-y-0 w-1/2 flex justify-end items-center opacity-30 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-r-2xl">
                <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
                <div className="relative w-full h-full flex items-center justify-end pr-6">
                  <Database className="w-20 h-20 text-indigo-400/20 absolute z-0 transform group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 w-24 h-24 bg-indigo-500/20 blur-[30px] rounded-full animate-pulse"></div>
                  
                  {/* Floating vector chunks */}
                  <div className="absolute top-1/4 right-8 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-float-fast"></div>
                  <div className="absolute bottom-1/3 right-16 w-1.5 h-1.5 bg-blue-400 rounded-full animate-float-medium" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute top-1/2 right-24 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-float-slow" style={{animationDelay: '1.2s'}}></div>
                  
                  {/* Connection lines */}
                  <svg className="absolute w-32 h-32 right-4 top-1/2 -translate-y-1/2 z-0 opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 10 50 Q 50 20 90 50" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,3" className="animate-line" />
                    <path d="M 20 80 Q 50 90 80 70" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,3" className="animate-line" style={{animationDelay: '1s'}} />
                  </svg>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10"><Database className="w-4 h-4"/> Retrieval Engine</h3>
              <div className="space-y-5 relative z-10 flex-1 w-2/3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Doc Processing & Chaining</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>LangChain</TechBadge><TechBadge>PyMuPDF</TechBadge></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Vector Database</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>ChromaDB</TechBadge></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Hybrid Search</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>BM25</TechBadge><TechBadge>Cosine Similarity</TechBadge></div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Models */}
          <Reveal delay={300} className="flex flex-col gap-4 h-full">
            <div className="glass-card p-6 rounded-2xl h-full border-t border-t-cyan-500/20 flex flex-col relative overflow-hidden group">
              
              {/* AI Model Visual (Moved to right) */}
              <div className="absolute right-0 inset-y-0 w-1/2 flex justify-end items-center opacity-30 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-r-2xl">
                <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/10 to-transparent"></div>
                <div className="relative w-full h-full flex items-center justify-end pr-8">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 bg-cyan-500/10 blur-[30px] rounded-full"></div>
                  <BrainCircuit className="w-16 h-16 text-cyan-400/30 relative z-10 animate-float-slow transform group-hover:scale-110 transition-transform duration-700" />
                  
                  {/* Neural network nodes and connections */}
                  <div className="absolute right-0 w-32 h-32 top-1/2 -translate-y-1/2 z-0">
                    <div className="absolute top-1/2 right-1/2 w-16 h-[1px] bg-gradient-to-l from-cyan-400/40 to-transparent origin-right -rotate-45 transform -translate-y-1/2"></div>
                    <div className="absolute top-1/2 right-1/2 w-12 h-[1px] bg-gradient-to-l from-cyan-400/40 to-transparent origin-right rotate-12 transform -translate-y-1/2"></div>
                    <div className="absolute top-1/2 right-1/2 w-20 h-[1px] bg-gradient-to-l from-cyan-400/40 to-transparent origin-right rotate-[135deg] transform -translate-y-1/2"></div>
                    
                    <div className="absolute top-[20%] right-[30%] w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                    <div className="absolute top-[65%] right-[75%] w-1 h-1 rounded-full bg-blue-400/80"></div>
                    <div className="absolute bottom-[20%] right-[40%] w-1.5 h-1.5 rounded-full bg-cyan-300/80 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10"><BrainCircuit className="w-4 h-4"/> AI Models</h3>
              <div className="space-y-5 relative z-10 flex-1 w-[70%]">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Embeddings</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>all-MiniLM-L6-v2</TechBadge></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Reranker</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>ms-marco-MiniLM-L-6-v2</TechBadge></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Language Model</p>
                  <div className="flex flex-wrap gap-2"><TechBadge>Llama 3.1 8B</TechBadge><TechBadge>Groq API</TechBadge></div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="w-[600px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <Reveal>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Your Documents Already Have the Answers.</h2>
          <p className="text-xl text-gray-400 mb-10">Let Policy Assistant find them instantly with absolute precision.</p>
          
          <Link 
            to="/workspace" 
            className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-lg font-medium transition-all shadow-[0_0_30px_rgba(79,141,247,0.3)] hover:shadow-[0_0_50px_rgba(79,141,247,0.5)] hover:-translate-y-1"
          >
            Open Workspace <ArrowRight className="w-5 h-5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[#080d17] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-12">
          {/* Brand */}
          <div className="text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
               <FileText className="text-blue-400 w-5 h-5" />
               <h3 className="text-lg font-semibold text-white tracking-tight">Policy Assistant</h3>
             </div>
             <p className="text-sm text-gray-500 max-w-xs">AI-powered document intelligence for modern, information-heavy organizations.</p>
          </div>
          
          {/* Links */}
          <div className="flex gap-8 text-sm">
            <a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a>
            <a href="#use-cases" className="text-gray-400 hover:text-white transition-colors">Use Cases</a>
            <a href="#technology" className="text-gray-400 hover:text-white transition-colors">Technology</a>
            <Link to="/workspace" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Get Started</Link>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>© 2026 Policy Assistant. Built as an MCA Data Science Minor Project.</p>
          <p>Anubhav Yadav • MCA – Data Science</p>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080D17] text-slate-200 selection:bg-blue-500/30">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <Navbar />
      <main>
        <Hero />
        <AboutPipeline />
        <WhyRAG />
        <UseCases />
        <Features />
        <TechStack />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}