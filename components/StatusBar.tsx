export function StatusBar() {
  return (
    <div className="h-[44px] px-[22px] flex items-center justify-between text-text text-[14px] font-semibold">
      <div>9:41</div>
      <div className="flex items-center gap-[5px]">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-hidden>
          <path
            d="M1 10h1M5 8h1v2H5zM9 5h1v5H9zM13 2h1v8h-1z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden>
          <path
            d="M1 5a11 11 0 0114 0M3.5 7a7 7 0 019 0M6 9a3 3 0 014 0"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none" aria-hidden>
          <rect
            x="0.5"
            y="0.5"
            width="21"
            height="10"
            rx="2.5"
            stroke="currentColor"
            opacity="0.6"
          />
          <rect x="2" y="2" width="16" height="7" rx="1" fill="currentColor" />
          <path d="M22.5 4v3" stroke="currentColor" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
