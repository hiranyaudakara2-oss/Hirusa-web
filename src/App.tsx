import React, { useState, useEffect, Component, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  ArrowRight, 
  LogOut, 
  Plus, 
  Shield, 
  Briefcase,
  Globe,
  Code,
  Zap,
  Trash2
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { 
  loginWithGoogle, 
  logout, 
  createUserProfile, 
  submitProjectRequest, 
  subscribeToUserProjects, 
  subscribeToAllProjects, 
  subscribeToAllUsers,
  updateProjectStatus,
  deleteProject,
  getProjectDetails,
  getAdminAccessKey,
  updateAdminAccessKey,
  ProjectRequest,
  UserProfile
} from './firebaseService';
import { cn } from './lib/utils';

// --- Components ---

class ErrorBoundary extends Component<any, any> {
  state: any;
  props: any;
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) errorMessage = `Firestore Error: ${parsed.error}`;
      } catch (e) {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Application Error</h2>
            <p className="text-zinc-500 mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold tracking-tighter text-zinc-900">HIRUSA</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Home</Link>
            <Link to="/portfolio" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">My Work</Link>
            <Link to="/about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">About Us</Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className="flex items-center space-x-1 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                <Shield size={16} />
                <span>Admin</span>
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="text-sm font-medium text-zinc-900 bg-zinc-100 px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-white bg-zinc-900 px-6 py-2 rounded-full hover:bg-zinc-800 transition-all"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-3 -mr-3 text-zinc-600 hover:text-zinc-900 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-50 md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 flex justify-between items-center border-b border-zinc-100">
                <span className="text-xl font-bold tracking-tighter text-zinc-900">MENU</span>
                <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-500 hover:text-zinc-900">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Link to="/" onClick={() => setIsOpen(false)} className="block text-2xl font-bold text-zinc-900 tracking-tight">Home</Link>
                <Link to="/portfolio" onClick={() => setIsOpen(false)} className="block text-2xl font-bold text-zinc-900 tracking-tight">My Work</Link>
                <Link to="/about" onClick={() => setIsOpen(false)} className="block text-2xl font-bold text-zinc-900 tracking-tight">About Us</Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 text-2xl font-bold text-amber-600 tracking-tight"
                  >
                    <Shield size={24} />
                    <span>Admin Terminal</span>
                  </Link>
                )}
                <div className="pt-6 border-t border-zinc-100">
                  {user ? (
                    <div className="space-y-6">
                      <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block text-2xl font-bold text-zinc-900 tracking-tight">Dashboard</Link>
                      <button 
                        onClick={() => { handleLogout(); setIsOpen(false); }} 
                        className="flex items-center space-x-2 text-2xl font-bold text-red-600 tracking-tight"
                      >
                        <LogOut size={24} />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { navigate('/login'); setIsOpen(false); }}
                      className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-zinc-900/20"
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-zinc-50 border-t border-zinc-200 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span className="text-lg font-bold tracking-tighter text-zinc-900">HIRUSA</span>
        </div>
        <div className="flex space-x-8 text-sm text-zinc-500">
          <Link to="/" className="hover:text-zinc-900">Terms</Link>
          <Link to="/" className="hover:text-zinc-900">Privacy</Link>
          <Link to="/" className="hover:text-zinc-900">Contact</Link>
        </div>
        <p className="text-sm text-zinc-400">© 2026 HIRUSA Agency. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// --- Pages ---

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-zinc-100 text-zinc-900 text-xs font-bold tracking-widest uppercase rounded-full mb-6">
              Custom Web Development
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-bold tracking-tighter text-zinc-900 leading-[0.9]">
              WE BUILD THE <br />
              <span className="text-zinc-400 italic">FUTURE</span> OF WEB.
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-2xl mx-auto text-xl text-zinc-500 font-medium"
          >
            HIRUSA is a boutique agency crafting high-performance, modern web experiences for ambitious brands.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <button 
              onClick={() => navigate('/register')}
              className="group relative px-8 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg overflow-hidden transition-all hover:pr-12"
            >
              <span className="relative z-10">Start Your Project</span>
              <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all" size={20} />
            </button>
            <button 
              onClick={() => navigate('/portfolio')}
              className="px-8 py-4 bg-white border border-zinc-200 text-zinc-900 rounded-full font-bold text-lg hover:bg-zinc-50 transition-all"
            >
              View Our Work
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-zinc-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Globe, title: "Global Reach", desc: "We build websites that scale globally with zero friction." },
              { icon: Code, title: "Clean Code", desc: "Maintainable, high-performance codebases built with modern tech." },
              { icon: Zap, title: "Lightning Fast", desc: "Optimized for speed, SEO, and ultimate user experience." }
            ].map((feature, i) => (
              <div key={i} className="space-y-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const Portfolio = () => (
  <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-4xl font-bold tracking-tighter mb-12">SELECTED WORK</h2>
    <div className="grid md:grid-cols-2 gap-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="group cursor-pointer">
          <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden mb-4 border border-zinc-200">
            <img 
              src={`https://picsum.photos/seed/hirusa-${i}/1200/800`} 
              alt="Project" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">E-Commerce / 2026</p>
              <h3 className="text-2xl font-bold">Project Alpha {i}</h3>
            </div>
            <ArrowRight className="-rotate-45 group-hover:rotate-0 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const About = () => (
  <div className="pt-32 pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 className="text-4xl font-bold tracking-tighter mb-8">WE ARE HIRUSA.</h2>
    <p className="text-xl text-zinc-600 leading-relaxed mb-12">
      Based in the digital frontier, we are a team of designers and developers dedicated to pushing the boundaries of what's possible on the web. We don't just build websites; we build digital legacies.
    </p>
    <div className="grid grid-cols-2 gap-8 py-12 border-y border-zinc-200">
      <div>
        <h4 className="text-3xl font-bold">50+</h4>
        <p className="text-sm text-zinc-400 uppercase font-bold tracking-widest">Projects Delivered</p>
      </div>
      <div>
        <h4 className="text-3xl font-bold">12</h4>
        <p className="text-sm text-zinc-400 uppercase font-bold tracking-widest">Global Awards</p>
      </div>
    </div>
  </div>
);

const Login = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, profile, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-zinc-500">Sign in to access your portal</p>
        </div>

        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center space-x-3 py-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all font-medium"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          <span>{isLoggingIn ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <p className="mt-8 text-center text-sm text-zinc-400">
          New here? <Link to="/register" className="text-zinc-900 font-bold hover:underline">Register your project</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please login with Google first to verify your identity.');
      await loginWithGoogle();
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserProfile({
        uid: user.uid,
        name: formData.name,
        email: user.email!,
        whatsapp: formData.whatsapp,
        initialDescription: formData.description,
        role: 'client'
      });
      toast.success('Registration complete!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white p-8 rounded-3xl shadow-xl border border-zinc-100"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tighter">Register Project</h2>
          <p className="text-zinc-500">Tell us about your vision.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-widest">Full Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-widest">WhatsApp Number</label>
            <input 
              type="text" 
              value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              placeholder="+1 234 567 890"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-widest">Describe your website</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all resize-none"
              placeholder="I need a modern e-commerce site for my fashion brand..."
            />
          </div>

          <button 
            onClick={handleRegister}
            disabled={isSubmitting || !formData.name || !formData.description}
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : user ? 'Complete Registration' : 'Verify with Google'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<ProjectRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({
    websiteName: '',
    email: user?.email || '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserProjects(user.uid, setProjects);
      return () => unsubscribe();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await submitProjectRequest({
        userId: user.uid,
        websiteName: newProject.websiteName,
        email: newProject.email,
        description: newProject.description
      });
      toast.success('Project request submitted!');
      setShowForm(false);
      setNewProject({ websiteName: '', email: user.email || '', description: '' });
    } catch (error) {
      toast.error('Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter">MY PROJECTS</h2>
            <p className="text-zinc-500">Welcome back, {profile?.name}</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-zinc-900 text-white px-8 py-4 rounded-full font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
          >
            <Plus size={20} />
            <span>New Work</span>
          </button>
        </div>

        <div className="grid gap-6">
          {projects.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                <Briefcase className="text-zinc-400" size={32} />
              </div>
              <h3 className="text-xl font-bold">No projects yet</h3>
              <p className="text-zinc-500">Start your first project with HIRUSA today.</p>
            </div>
          ) : (
            projects.map((project) => (
              <motion.div 
                key={project.id}
                layout
                className="bg-white p-6 rounded-2xl border border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold">{project.websiteName}</h3>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                      project.status === 'Pending' ? "bg-amber-100 text-amber-700" : 
                      project.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm line-clamp-1">{project.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Submitted</p>
                  <p className="text-sm font-medium">{project.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white p-8 rounded-3xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight">New Project Request</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Website Name</label>
                  <input 
                    required
                    type="text" 
                    value={newProject.websiteName}
                    onChange={(e) => setNewProject({...newProject, websiteName: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    placeholder="E.g. My Portfolio"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Contact Email</label>
                  <input 
                    required
                    type="email" 
                    value={newProject.email}
                    onChange={(e) => setNewProject({...newProject, email: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all resize-none"
                    placeholder="Describe your vision..."
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Send Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProjectDetailsModal = ({ projectId, onClose }: { projectId: string; onClose: () => void }) => {
  const [data, setData] = useState<{ project: ProjectRequest; userProfile: UserProfile | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const details = await getProjectDetails(projectId);
        setData(details);
      } catch (error) {
        toast.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [projectId]);

  const handleStatusChange = async (newStatus: ProjectRequest['status']) => {
    if (!data) return;
    setUpdating(true);
    try {
      await updateProjectStatus(projectId, newStatus);
      setData({
        ...data,
        project: { ...data.project, status: newStatus }
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setUpdating(true);
    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setUpdating(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900">Project Details</h3>
            {!loading && data && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 text-center">
              <div className="max-w-xs space-y-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 mb-2">Are you sure?</h4>
                  <p className="text-zinc-500 text-sm">This action will permanently delete this project request. This cannot be undone.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleDelete}
                    disabled={updating}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {updating ? 'Deleting...' : 'Yes, Delete Project'}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={updating}
                    className="w-full py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-24 bg-zinc-100 rounded-2xl" />
              <div className="h-48 bg-zinc-100 rounded-2xl" />
            </div>
          ) : data ? (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500 tracking-wide uppercase">Current Status</span>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest",
                  data.project.status === 'Pending' ? "bg-amber-100 text-amber-700" : 
                  data.project.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                  "bg-emerald-100 text-emerald-700"
                )}>
                  {data.project.status}
                </span>
              </div>

              {/* Client Info Section */}
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} />
                  Client Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Name</p>
                    <p className="font-bold text-zinc-900">{data.userProfile?.name || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Email</p>
                    <p className="font-bold text-zinc-900 break-all">{data.project.email}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 sm:col-span-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">WhatsApp</p>
                    {data.userProfile?.whatsapp ? (
                      <a 
                        href={`https://wa.me/${data.userProfile.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors flex items-center gap-2"
                      >
                        {data.userProfile.whatsapp}
                        <ArrowRight size={14} />
                      </a>
                    ) : (
                      <p className="font-bold text-zinc-400">Not provided</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Project Info Section */}
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} />
                  Project Specifications
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Website Name</p>
                    <p className="font-bold text-zinc-900">{data.project.websiteName}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Description</p>
                    <div className="mt-2 text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                      {data.project.description}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500">Project not found</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && data && (
          <div className="p-6 bg-zinc-50 border-t border-zinc-100">
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Update Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pending', 'In Progress', 'Approved'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating || data.project.status === status}
                    className={cn(
                      "py-3 rounded-xl text-xs font-bold transition-all border-2",
                      data.project.status === status 
                        ? "bg-zinc-900 text-white border-zinc-900" 
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AdminPanel = () => {
  const { isAdmin: isSystemAdmin } = useAuth();
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [projects, setProjects] = useState<ProjectRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'settings'>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    const fetchKey = async () => {
      if (!isSystemAdmin) return;
      const key = await getAdminAccessKey();
      if (!key) {
        // Initialize with default if not set
        const defaultKey = 'admin.Hirusa25';
        await updateAdminAccessKey(defaultKey);
        setAdminKey(defaultKey);
      } else {
        setAdminKey(key);
      }
    };
    fetchKey();
  }, [isSystemAdmin]);

  useEffect(() => {
    if (isAuthorized) {
      const unsubProjects = subscribeToAllProjects(setProjects);
      const unsubUsers = subscribeToAllUsers(setUsers);
      return () => {
        unsubProjects();
        unsubUsers();
      };
    }
  }, [isAuthorized]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminKey) {
      setIsAuthorized(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };

  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey.length < 8) {
      toast.error('Key must be at least 8 characters');
      return;
    }
    try {
      await updateAdminAccessKey(newKey);
      setAdminKey(newKey);
      setNewKey('');
      toast.success('Admin access key updated');
    } catch (error) {
      toast.error('Failed to update key');
    }
  };

  const handleApprove = async (projectId: string) => {
    try {
      await updateProjectStatus(projectId, 'Approved');
      toast.success('Project approved!');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <Shield className="mx-auto text-zinc-900 mb-4" size={48} />
            <h2 className="text-2xl font-bold">Admin Access</h2>
            <p className="text-zinc-500">Enter secure key to proceed</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="Admin Password"
            />
            <button className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all">
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter">ADMIN TERMINAL</h2>
            <p className="text-zinc-500">Managing {projects.length} projects and {users.length} clients</p>
          </div>
          <div className="flex bg-zinc-200 p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('projects')}
              className={cn(
                "flex-1 lg:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                activeTab === 'projects' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Projects
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={cn(
                "flex-1 lg:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                activeTab === 'users' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Clients
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={cn(
                "flex-1 lg:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                activeTab === 'settings' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
          {activeTab === 'projects' ? (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[600px] lg:min-w-0">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Project</th>
                    <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Client Email</th>
                    <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {projects.map((p) => (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedProjectId(p.id)}
                      className="hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-5">
                        <div className="font-bold text-zinc-900 group-hover:text-zinc-900 transition-colors">{p.websiteName}</div>
                        <div className="text-xs text-zinc-400 line-clamp-1 max-w-xs">{p.description}</div>
                      </td>
                      <td className="px-6 py-5 text-sm text-zinc-600">{p.email}</td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          p.status === 'Pending' ? "bg-amber-100 text-amber-700" : 
                          p.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end">
                          <button 
                            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 group-hover:text-zinc-900"
                            onClick={(e) => { e.stopPropagation(); setSelectedProjectId(p.id); }}
                          >
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'users' ? (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[600px] lg:min-w-0">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">WhatsApp</th>
                    <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-5 font-bold text-zinc-900">{u.name}</td>
                      <td className="px-6 py-5 text-sm text-zinc-600">{u.email}</td>
                      <td className="px-6 py-5 text-sm text-zinc-600">{u.whatsapp || '-'}</td>
                      <td className="px-6 py-5 text-sm text-zinc-400">{u.createdAt?.toDate().toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 max-w-md mx-auto">
              <div className="text-center mb-8">
                <Shield className="mx-auto text-zinc-900 mb-4" size={48} />
                <h3 className="text-xl font-bold">Security Settings</h3>
                <p className="text-zinc-500 text-sm">Update your admin access key</p>
              </div>
              <form onSubmit={handleUpdateKey} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">New Access Key</label>
                  <input 
                    type="password" 
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                    placeholder="Enter new key"
                  />
                </div>
                <button className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all">
                  Update Key
                </button>
              </form>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedProjectId && (
            <ProjectDetailsModal 
              projectId={selectedProjectId} 
              onClose={() => setSelectedProjectId(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- App Shell ---

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 bg-zinc-900 rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-zinc-900 selection:text-white">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="bottom-right" richColors />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
