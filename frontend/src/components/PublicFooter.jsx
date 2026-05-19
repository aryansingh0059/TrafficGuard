import { Link } from 'react-router-dom';

const PublicFooter = () => {
  return (
    <footer className="w-full font-sans mt-auto">
      {/* Footer Body */}
      <div className="bg-primary pt-12 pb-8 px-4 md:px-8 border-t-4 border-accent">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Identity */}
          <div className="flex flex-col items-start gap-4">
            <div className="w-[60px] h-[60px] rounded-full border-[2px] border-white/20 flex flex-col items-center justify-center bg-white/5 shrink-0">
              <span className="text-white/60 text-[10px] font-bold leading-none text-center">GOV<br/>SEAL</span>
            </div>
            <div>
              <h3 className="text-white text-[16px] font-bold mb-1">Traffic & Accident Management System</h3>
              <p className="text-white/60 text-[13px]">Ministry of Road Transport and Highways<br/>Government of Punjab</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-accent text-[13px] font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-white/80 hover:text-white text-[13px] hover:underline transition-all flex items-center gap-2"><span className="text-accent text-[10px]">▶</span> Report Incident</Link></li>
              <li><Link to="/track" className="text-white/80 hover:text-white text-[13px] hover:underline transition-all flex items-center gap-2"><span className="text-accent text-[10px]">▶</span> Track Status</Link></li>
              <li><Link to="/login" className="text-white/80 hover:text-white text-[13px] hover:underline transition-all flex items-center gap-2"><span className="text-accent text-[10px]">▶</span> Department Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-accent text-[13px] font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-white/80 text-[13px]">
                <svg className="w-4 h-4 shrink-0 text-accent mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Police Headquarters, Sector 9,<br/>Chandigarh, 160009</span>
              </li>
              <li className="flex gap-3 text-white/80 text-[13px]">
                <svg className="w-4 h-4 shrink-0 text-accent mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span>Traffic Helpline: 1073<br/>Emergency: 112</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#0f2238] py-4 text-center">
        <p className="text-white/40 text-[11px] uppercase tracking-wider">© {new Date().getFullYear()} Government of India. All rights reserved.</p>
      </div>

      {/* Tricolor Bottom Edge */}
      <div className="flex h-[4px] w-full">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>
    </footer>
  );
};

export default PublicFooter;
