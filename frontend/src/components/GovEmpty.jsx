const GovEmpty = ({ 
  title = "No Records Found", 
  subtitle = "There is currently no data to display for this section.", 
  actionText, 
  onAction,
  icon
}) => {
  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center gov-card bg-surface/50 border-dashed border-2">
      <div className="w-[60px] h-[60px] rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4 opacity-80">
        {icon || (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      <h3 className="text-[18px] font-bold text-primary mb-2">{title}</h3>
      <p className="text-[14px] text-gray-500 max-w-sm mb-6 font-medium">{subtitle}</p>
      
      {actionText && onAction && (
        <button onClick={onAction} className="gov-btn-outline !py-2 !px-4 !text-[13px]">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default GovEmpty;
