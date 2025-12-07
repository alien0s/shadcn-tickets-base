export const NotFoundUFO = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 312 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full ${className}`}
        >
            <defs>
                <linearGradient id="beam-gradient" x1="156" y1="140" x2="156" y2="260" gradientUnits="userSpaceOnUse">
                    <stop stopColor="currentColor" stopOpacity="0.15" className="text-blue-200 dark:text-blue-400" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0.05" className="text-blue-100 dark:text-blue-900" />
                </linearGradient>
                <clipPath id="clippath">
                    <ellipse cx="155.97" cy="110.39" rx="58.62" ry="156.13" transform="translate(38.02 260.73) rotate(-87.17)" />
                </clipPath>
            </defs>

            {/* Background Elements - Stars & Sparkles */}
            <g className="opacity-70">
                {/* Top left sparkle */}
                <path d="M90 60 L92 55 L94 60 L99 62 L94 64 L92 69 L90 64 L85 62 Z" className="fill-blue-200 dark:fill-blue-700 animate-pulse" />
                {/* Bottom right sparkle */}
                <path d="M220 200 L222 195 L224 200 L229 202 L224 204 L222 209 L220 204 L215 202 Z" className="fill-indigo-200 dark:fill-indigo-700 animate-pulse delay-100" />

                {/* Small circles */}
                <circle cx="60" cy="120" r="3" className="stroke-blue-300 dark:stroke-blue-600" strokeWidth="1.5" />
                <circle cx="260" cy="110" r="3" className="stroke-indigo-300 dark:stroke-indigo-600" strokeWidth="1.5" />
                <circle cx="240" cy="210" r="2" className="stroke-purple-300 dark:stroke-purple-600" strokeWidth="1.5" />
                <circle cx="100" cy="230" r="2" className="stroke-blue-300 dark:stroke-blue-600" strokeWidth="1.5" />

                {/* Tiny dots */}
                <circle cx="80" cy="80" r="1" className="fill-blue-300 dark:fill-blue-500" />
                <circle cx="280" cy="150" r="1" className="fill-indigo-300 dark:fill-indigo-500" />
            </g>

            {/* Light Beam - Wider funnel shape without narrow point */}
            <path
                d="M156 140 L80 250 C80 250 110 260 156 260 C202 260 232 250 232 250 L156 140Z"
                fill="url(#beam-gradient)"
                className="animate-pulse-slow"
            />
            {/* Beam Bottom Shadow */}
            <ellipse cx="156" cy="250" rx="76" ry="8" className="fill-blue-200/40 dark:fill-blue-800/40" />

            {/* 
        UFO Group - Your Illustrator Design 
        - Scaled to 0.5 (50% - smaller than before)
        - opacity-80 adds 80% opacity (20% transparency)
        - You can control transparency by changing opacity-80 to:
          opacity-90 (10% transparency - less subtle)
          opacity-70 (30% transparency - more subtle)
          opacity-60 (40% transparency - very subtle)
      */}
            <g className="animate-bounce-slow opacity-80" transform="translate(78, 40) scale(0.5)">
                <path className="fill-indigo-500 dark:fill-indigo-600" d="M238.38,64.06c-7.05-20.65-29.26-37.17-57.36-41.81l1.28-6.26c4.26-.56,7.35-4.38,6.96-8.69-.41-4.42-4.32-7.67-8.74-7.27-4.42.41-7.67,4.32-7.27,8.74.27,2.92,2.07,5.33,4.54,6.51l-1.3,6.35c-2.17-.25-4.36-.45-6.59-.56-31.33-1.55-58.79,11.92-70.41,32.22C42.27,59.23,1.24,78.21.03,102.69c-1.6,32.34,66.93,62,153.05,66.25,86.13,4.25,157.24-18.51,158.84-50.85,1.06-21.37-28.51-41.56-73.53-54.04Z" />
                <g clipPath="url(#clippath)">
                    <ellipse className="fill-indigo-300 dark:fill-indigo-400 opacity-60" cx="157.1" cy="119.53" rx="55.54" ry="147.93" transform="translate(29.97 270.54) rotate(-87.17)" />
                </g>
                <ellipse className="fill-blue-50 dark:fill-blue-100" cx="157.35" cy="146.45" rx="20.11" ry="59.29" transform="translate(4.89 297.99) rotate(-87.77)" />
                <g>
                    <ellipse className="fill-blue-50 dark:fill-blue-100" cx="62.06" cy="111.18" rx="14.48" ry="7.32" transform="translate(-14.17 9.2) rotate(-7.61)" />
                    <ellipse className="fill-blue-50 dark:fill-blue-100" cx="128.45" cy="100.7" rx="14.48" ry="7.32" transform="translate(-8.68 12.18) rotate(-5.25)" />
                    <ellipse className="fill-blue-50 dark:fill-blue-100" cx="199.67" cy="102.79" rx="7.32" ry="14.48" transform="translate(76.5 290.57) rotate(-83.98)" />
                    <ellipse className="fill-blue-50 dark:fill-blue-100" cx="258.7" cy="120.67" rx="7.32" ry="14.48" transform="translate(69.04 334.01) rotate(-73.37)" />
                </g>
            </g>

            <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translate(78px, 40px) scale(0.5); }
          50% { transform: translate(78px, 32px) scale(0.5); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s infinite ease-in-out;
        }
      `}</style>
        </svg>
    );
};
