import type { SVGAttributes } from 'react';

export interface NtsLogoProps extends SVGAttributes<SVGElement> {
    variant?: 'auto' | 'light' | 'dark' | 'gold';
    showArch?: boolean;
}

export default function NtsLogo({
    variant = 'auto',
    showArch = true,
    className = '',
    ...props
}: NtsLogoProps) {
    const colorClasses = {
        auto: 'text-slate-900 dark:text-white fill-current',
        light: 'text-slate-900 fill-slate-900',
        dark: 'text-white fill-white',
        gold: 'text-[#C5A059] fill-[#C5A059]',
    }[variant];

    return (
        <svg
            viewBox="0 0 500 350"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${colorClasses} ${className}`}
            {...props}
        >
            <defs>
                {/* Mathematical circular arc for PT. NAPAK TILAS SENI */}
                <path id="ntsArchCurve" d="M 50,188 A 235,235 0 0,1 450,188" fill="none" />
            </defs>

            {/* Arched Company Name */}
            {showArch && (
                <text
                    className="fill-current font-semibold"
                    style={{
                        fontFamily: "'Century Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                        fontSize: '26.5px',
                        letterSpacing: '4.2px',
                    }}
                >
                    <textPath href="#ntsArchCurve" startOffset="50%" textAnchor="middle">
                        PT. NAPAK TILAS SENI
                    </textPath>
                </text>
            )}

            {/* Monogram N.T.S */}
            <g
                className="fill-current font-semibold"
                style={{
                    fontFamily: "'Century Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '160px',
                    textAnchor: 'middle',
                }}
            >
                {/* N */}
                <text x="112" y="308">N</text>
                
                {/* Dot 1 */}
                <circle cx="196" cy="298" r="10.5" className="fill-current" />

                {/* T */}
                <text x="250" y="308">T</text>

                {/* Dot 2 */}
                <circle cx="304" cy="298" r="10.5" className="fill-current" />

                {/* S */}
                <text x="388" y="308">S</text>
            </g>
        </svg>
    );
}
