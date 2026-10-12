import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Signature Emblem Arch */}
            <path
                d="M 16,40 A 42,42 0 0,1 84,40"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
            />
            {/* Monogram NTS */}
            <text
                x="50"
                y="74"
                textAnchor="middle"
                fill="currentColor"
                style={{
                    fontFamily: "'Century Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontWeight: 700,
                    fontSize: '32px',
                    letterSpacing: '1px',
                }}
            >
                NTS
            </text>
        </svg>
    );
}
