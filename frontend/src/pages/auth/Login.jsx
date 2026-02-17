import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
import { Link, useNavigate } from "react-router-dom";
import { login, googleLogin } from "../../store/slices/storeSlice";
import { IoEyeSharp, IoLogoGoogle, IoCheckmarkCircle, IoRocket, IoShieldCheckmark, IoStatsChart, IoPerson } from "react-icons/io5";
import { TbEyeClosed } from "react-icons/tb";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { useLoading } from "../../components/loader/LoaderContext";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";

// Add specific Google Auth scopes if needed (optional but good practice)
googleProvider.addScope('email');
googleProvider.addScope('profile');

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { handleLoading } = useLoading();
  const [currentSlide, setCurrentSlide] = useState(0);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      handleLoading(true);
      try {
        await dispatch(login(values)).unwrap();
        navigate("/");
      } catch (e) {
        console.log("Error", e);
        toast.error("Invalid Credentials");
      }
      formik.resetForm();
      handleLoading(false);
    },
  });

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await dispatch(googleLogin(user)).unwrap();
      navigate("/");
    } catch (error) {
        console.error("Google Login Error:", error);
        let msg = "Google Login Failed";
        if (error.code === 'auth/configuration-not-found') {
            msg = "Firebase Auth not configured. Check console.";
        }
        toast.error(msg);
    }
  };

  const features = [
    {
      icon: <IoCheckmarkCircle className="text-4xl text-emerald-400" />,
      title: "Task Management",
      description: "Organize tasks with ease using our intuitive drag-and-drop interface. Prioritize what matters most.",
    },
    {
      icon: <IoStatsChart className="text-4xl text-blue-400" />,
      title: "Real-time Analytics",
      description: "Visualize your progress with dynamic charts and reports. Make data-driven decisions instantly.",
    },
    {
      icon: <IoRocket className="text-4xl text-purple-400" />,
      title: "Project Tracking",
      description: "Keep your projects on track with milestones, timelines, and automated status updates.",
    },
    {
      icon: <IoShieldCheckmark className="text-4xl text-rose-400" />,
      title: "Secure Collaboration",
      description: "Collaborate safely with your team. Enterprise-grade security ensures your data is protected.",
    },
  ];

  // Carousel mockups
  const slides = [
    { id: 1, title: "Dashboard", color: "from-blue-600/20 to-purple-600/20", content: "Interactive Charts" },
    { id: 2, title: "Kanban Board", color: "from-emerald-600/20 to-teal-600/20", content: "Drag & Drop Tasks" },
    { id: 3, title: "Team Chat", color: "from-orange-600/20 to-red-600/20", content: "Real-time Comm" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-bgDark text-primaryText min-h-screen overflow-x-hidden font-sans selection:bg-primary/30">
      {/* Navbar / Logo Header */}
      <nav className="fixed w-full z-50 bg-bgDark/80 backdrop-blur-md border-b border-white/5 px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
              <img src="/momentum_logo.svg" alt="Momentum" className="w-8 h-8" />
              <span className="font-bold text-xl tracking-wider uppercase">Momentum</span>
           </div>
        </div>
      </nav>

      {/* Hero Section with Login */}
      <section className="relative pt-32 pb-20 px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center min-h-screen gap-12 max-w-7xl mx-auto">
         {/* Background Glows */}
         <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

         {/* Hero Text */}
         <div className="flex-1 space-y-8 text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                   Simplify Tasks, <br />
                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                     Amplify Success.
                   </span>
                </h1>
                <p className="mt-6 text-xl text-secondaryText max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                   Momentum is the all-in-one platform for high-performance teams. 
                   Manage projects, track goals, and collaborate in real-time.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                   <a href="#features" className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-medium backdrop-blur-sm">
                      Explore Features
                   </a>
                   <a href="#showcase" className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all font-medium shadow-lg shadow-primary/25">
                      View Demo
                   </a>
                </div>
            </motion.div>
         </div>

         {/* Login Card */}
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md bg-cardBg/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative"
         >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/30 rounded-full blur-2xl"></div>
            
            <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
            
            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors mb-6 shadow-lg group"
            >
                <IoLogoGoogle className="text-xl group-hover:scale-110 transition-transform" />
                <span>Continue with Google</span>
            </button>

            <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">Or email</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-5">
                <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="name@company.com"
                    error={formik.touched.email && formik.errors.email}
                    isRequired
                    className="bg-bgDark border-2 border-transparent focus:border-primary focus:ring-0 rounded-xl py-3 px-4 transition-all placeholder-gray-600 font-medium"
                    labelClass="text-white text-sm font-medium mb-1 ml-1"
                />

                <div className="relative">
                    <InputField
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter your password"
                        error={formik.touched.password && formik.errors.password}
                        isRequired
                        className="bg-bgDark border-2 border-transparent focus:border-primary focus:ring-0 rounded-xl py-3 px-4 transition-all placeholder-gray-600 font-medium"
                        labelClass="text-white text-sm font-medium mb-1 ml-1"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-[50px] text-gray-400 hover:text-white transition-colors"
                    >
                        {showPassword ? <IoEyeSharp size={20} /> : <TbEyeClosed size={20} />}
                    </button>
                    <div className="flex justify-end mt-1">
                        <Link to="/forget" className="text-xs text-primary hover:text-primaryHover font-medium">Forgot Password?</Link>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!formik.isValid || !formik.dirty}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    Sign In
                </button>
            </form>
         </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-themeBG/30 px-6 lg:px-8">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Momentum?</h2>
                <p className="text-secondaryText max-w-2xl mx-auto text-lg">Everything you need to manage your projects and team in one place.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="bg-cardBg p-8 rounded-3xl border border-white/5 hover:border-primary/30 transition-all hover:-translate-y-2 group"
                    >
                        <div className="mb-6 p-4 bg-bgDark rounded-2xl inline-block shadow-inner group-hover:scale-110 transition-transform">{feature.icon}</div>
                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-secondaryText leading-relaxed">{feature.description}</p>
                    </motion.div>
                ))}
            </div>
         </div>
      </section>

      {/* Application Workflow Section */}
      <section className="py-24 bg-bgDark relative overflow-hidden">
         {/* Decorative Elements */}
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
         
         <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
                <span className="text-primary font-bold tracking-wider uppercase text-sm">How It Works</span>
                <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-6">Seamless Workflow Integration</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
            </div>

            <div className="space-y-16">
                {/* Introduction */}
                <div className="prose prose-invert prose-lg max-w-4xl mx-auto text-secondaryText leading-relaxed text-justify">
                    <p className="mb-6">
                        Momentum is designed to revolutionize the way modern teams approach project management. Our application workflow is meticulously crafted to ensure a seamless transition from idea to execution, minimizing friction and maximizing output. It begins with a streamlined <strong>Onboarding Process</strong>, where you set up your personalized workspace. Whether you are a freelancer managing multiple clients or an enterprise team coordinating across departments, Momentum adapts to your structure. You can define roles, invite team members, and configure permissions with just a few clicks, ensuring that the right people have access to the right resources from day one.
                    </p>
                    <p className="mb-6">
                        Once your workspace is ready, the core of the experience shifts to <strong>Project Creation and Planning</strong>. Here, you can break down complex objectives into manageable milestones. Our intuitive interface allows you to create projects with detailed descriptions, set deadlines, and allocate budgets. You aren't just creating a list of to-dos; you are building a roadmap. You can associate specific tags, priority levels, and dependencies to each task, visualizing the critical path of your project before work even begins. This planning phase is crucial for aligning your team on the "what," "why," and "when" of every initiative.
                    </p>
                </div>

                {/* Detailed Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="prose prose-invert prose-lg text-secondaryText leading-relaxed text-justify order-2 md:order-1">
                        <h3 className="text-2xl font-bold text-white mb-4">Execution & Real-time Collaboration</h3>
                        <p className="mb-4">
                            As the project moves into the <strong>Execution Phase</strong>, Momentum really shines. Tasks are no longer static entries but dynamic entities that move through customizable workflows—from "To Do" to "In Progress," "Review," and "Done." Team members can collaborate in real-time directly within task cards. You can share files, exchange comments, and mention colleagues to get immediate feedback. This centralized communication eliminates the chaos of scattered email threads and ensures that the context of every decision is preserved right where the work happens.
                        </p>
                        <p>
                            Furthermore, our <strong>Intelligent Notification System</strong> keeps everyone in the loop without overwhelming them. You receive updates only on what matters to you—deadline approaches, task assignments, or urgent mentions. This focused approach helps maintain deep work states while ensuring that no critical blocker goes unnoticed. The workflow is designed to be fluid; as priorities shift, you can drag and drop tasks on the Kanban board or adjust timelines on the Gantt chart, and Momentum automatically propagates these changes across the entire project ecosystem.
                        </p>
                    </div>
                    <div className="order-1 md:order-2 bg-gradient-to-br from-gray-800 to-black p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-cardBg rounded-xl border border-white/5 transform translate-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><IoRocket /></div>
                                <div><div className="h-2 w-24 bg-gray-600 rounded mb-2"></div><div className="h-2 w-16 bg-gray-700 rounded"></div></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-cardBg rounded-xl border border-white/5 transform -translate-x-2 border-l-4 border-l-primary">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><IoStatsChart /></div>
                                <div><div className="h-2 w-32 bg-gray-500 rounded mb-2"></div><div className="h-2 w-20 bg-gray-600 rounded"></div></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-cardBg rounded-xl border border-white/5 transform translate-x-2">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><IoCheckmarkCircle /></div>
                                <div><div className="h-2 w-28 bg-gray-600 rounded mb-2"></div><div className="h-2 w-12 bg-gray-700 rounded"></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="prose prose-invert prose-lg max-w-4xl mx-auto text-secondaryText leading-relaxed text-justify">
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">Analytics & Continuous Improvement</h3>
                    <p>
                        Finally, the workflow cycle completes with <strong>Analysis and Reporting</strong>. Momentum doesn't just track what you do; it helps you understand how you do it. Our powerful analytics engine aggregates data from all your active projects to provide high-level insights into team velocity, workload distribution, and task completion rates. You can generate automated reports for stakeholders, visualizing progress through burndown charts and cumulative flow diagrams. These insights empower you to identify bottlenecks, optimize resource allocation, and continuously refine your processes for future projects. With Momentum, every completed project becomes a learning opportunity, driving a cycle of constant improvement and escalating success.
                    </p>
                </div>
            </div>
         </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-24 px-6 lg:px-8 relative overflow-hidden">
         <div className="max-w-7xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Built for Modern Teams</h2>
            
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="mt-12 bg-gray-900 border border-gray-700 rounded-3xl p-2 md:p-4 shadow-2xl max-w-5xl mx-auto"
            >
                {/* CSS Mockup of Dashboard */}
                <div className="bg-bgDark rounded-2xl overflow-hidden aspect-video relative flex">
                    {/* Sidebar Mockup */}
                    <div className="w-16 md:w-64 bg-themeBG border-r border-white/5 hidden md:flex flex-col p-4 gap-4">
                        <div className="h-8 w-32 bg-white/10 rounded-full mb-4"></div>
                        <div className="h-4 w-24 bg-white/5 rounded-full"></div>
                        <div className="h-4 w-28 bg-white/5 rounded-full"></div>
                        <div className="h-4 w-20 bg-white/5 rounded-full"></div>
                    </div>
                    
                    {/* Main Content Mockup */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6">
                        <div className="flex justify-between items-center mb-4">
                             <div className="h-8 w-48 bg-white/10 rounded-md"></div>
                             <div className="h-8 w-24 bg-primary/20 rounded-md"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="h-32 bg-cardBg rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                                <div className="h-8 w-8 bg-blue-500/20 rounded-lg"></div>
                                <div className="h-4 w-16 bg-white/10 rounded-full"></div>
                            </div>
                            <div className="h-32 bg-cardBg rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                                <div className="h-8 w-8 bg-purple-500/20 rounded-lg"></div>
                                <div className="h-4 w-16 bg-white/10 rounded-full"></div>
                            </div>
                            <div className="h-32 bg-cardBg rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                                <div className="h-8 w-8 bg-pink-500/20 rounded-lg"></div>
                                <div className="h-4 w-16 bg-white/10 rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex-1 bg-cardBg rounded-xl border border-white/5 mt-4 w-full relative overflow-hidden">
                             {/* Graph Mockup */}
                             <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary/20 to-transparent"></div>
                             <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>
                        </div>
                    </div>
                </div>
            </motion.div>
         </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-bgDark to-black border-t border-white/5">
        <div className="max-w-6xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row items-center gap-12 bg-cardBg/30 p-10 rounded-3xl border border-white/5 backdrop-blur-sm"
            >
                {/* Image Side */}
                <div className="relative flex-shrink-0 group">
                    <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-r from-primary to-secondary transition-transform transform group-hover:scale-105">
                        <div className="w-full h-full rounded-full bg-bgDark overflow-hidden flex items-center justify-center">
                            <IoPerson className="text-6xl text-gray-600" />
                            {/* <img src="/founder.jpg" alt="Balaji Aadesh" className="w-full h-full object-cover" /> */}
                        </div>
                    </div>
                </div>

                {/* Content Side */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3 mb-4 justify-center md:justify-start">
                        <h3 className="text-3xl font-bold text-white">Balaji Aadesh</h3>
                        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/20">Founder</span>
                    </div>
                    
                    <p className="text-lg italic text-gray-300 leading-relaxed mb-6 relative">
                        <span className="text-4xl text-primary/20 absolute -top-4 -left-2">"</span>
                        Momentum isn't just a tool; it's a philosophy. We believe that with the right clarity and focus, any goal is achievable. We built this platform to help you find your flow and maintain it.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                         <p className="text-secondaryText font-medium tracking-wide uppercase text-sm">Create. Innovate. Inspire.</p>
                         <div className="font-cursive text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 transform -rotate-3 hover:rotate-0 transition-transform cursor-default" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                            Aadesh
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 py-12 px-6 lg:px-8">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                 <img src="/momentum_logo.svg" alt="Momentum" className="w-6 h-6 grayscale hover:grayscale-0 transition-all opacity-50 hover:opacity-100" />
                 <span className="text-gray-500 font-semibold hover:text-white transition-colors">Momentum</span>
             </div>
             <p className="text-gray-600 text-sm">&copy; 2026 Momentum Inc. Built with ❤️ by Balaji Aadesh.</p>
         </div>
      </footer>
    </div>
  );
};

export default Login;
