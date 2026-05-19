const GovSkeleton = ({ count = 1, type = 'text', className = '' }) => {
  // Types: 'text', 'card', 'table-row', 'chart'
  
  const renderSkeleton = (index) => {
    switch (type) {
      case 'card':
        return (
          <div key={index} className={`gov-card animate-pulse flex flex-col gap-4 ${className}`} aria-hidden="true">
            <div className="h-6 bg-border/60 rounded w-1/3 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
            </div>
            <div className="h-8 bg-border/60 rounded w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
            </div>
          </div>
        );
      case 'table-row':
        return (
          <div key={index} className={`flex items-center gap-4 py-4 border-b border-border animate-pulse ${className}`} aria-hidden="true">
            <div className="h-4 bg-border/60 rounded w-12 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
            </div>
            <div className="h-4 bg-border/60 rounded flex-1 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
            </div>
            <div className="h-4 bg-border/60 rounded w-1/4 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
            </div>
            <div className="h-6 bg-border/60 rounded w-20 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
            </div>
          </div>
        );
      case 'chart':
        return (
          <div key={index} className={`w-full h-full min-h-[300px] bg-border/30 rounded-lg animate-pulse relative overflow-hidden flex items-end p-4 gap-2 ${className}`} aria-hidden="true">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
            {/* Fake chart bars */}
            <div className="w-1/6 bg-border/60 h-1/3 rounded-t"></div>
            <div className="w-1/6 bg-border/60 h-2/3 rounded-t"></div>
            <div className="w-1/6 bg-border/60 h-1/2 rounded-t"></div>
            <div className="w-1/6 bg-border/60 h-full rounded-t"></div>
            <div className="w-1/6 bg-border/60 h-1/4 rounded-t"></div>
            <div className="w-1/6 bg-border/60 h-3/4 rounded-t"></div>
          </div>
        );
      case 'text':
      default:
        return (
          <div key={index} className={`h-4 bg-border/60 rounded w-full animate-pulse relative overflow-hidden ${className}`} aria-hidden="true">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => renderSkeleton(idx))}
    </>
  );
};

export default GovSkeleton;
