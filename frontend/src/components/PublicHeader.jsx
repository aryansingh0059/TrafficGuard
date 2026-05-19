import { Link } from 'react-router-dom';

const PublicHeader = () => {
  return (
    <header className="w-full flex flex-col font-sans">
      {/* Tricolor Stripe */}
      <div className="flex h-[3px] w-full">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* Navy Top Bar */}
      <div className="bg-primary text-white text-[11px] py-1.5 px-4 md:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4 font-medium tracking-wide opacity-90">
          <span>GOVERNMENT OF INDIA</span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <a href="#main-content" className="hover:underline opacity-90 transition-opacity">Skip to main content</a>
          <div className="flex items-center gap-2">
            <span className="opacity-90">A+</span>
            <span className="opacity-90">A</span>
            <span className="opacity-90">A-</span>
          </div>
          <div className="opacity-90 border border-white/30 px-2 py-0.5 rounded text-[10px] cursor-pointer hover:bg-white/10 transition-colors">
            EN | ਪੰਜਾਬੀ
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="bg-white border-b border-border shadow-sm px-4 md:px-8 py-3 md:py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-4 group">
          {/* Emblem Placeholder */}
          <div className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full border-[2px] border-accent flex flex-col items-center justify-center bg-[#fffdf5] group-hover:bg-[#fff9e6] transition-colors shrink-0">
            <span className="text-accent text-[8px] md:text-[10px] font-bold leading-none text-center">GOV<br/>SEAL</span>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-primary text-[18px] md:text-[20px] font-bold leading-tight">Traffic & Accident Management System</h1>
            <h2 className="text-gray-500 text-[12px] md:text-[13px] font-medium mt-0.5 uppercase tracking-wider">Punjab Traffic Police</h2>
          </div>
        </Link>

        {/* Helpline */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">Emergency Helpline</span>
          <div className="flex items-center gap-2 text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span className="text-[20px] font-black">112</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
