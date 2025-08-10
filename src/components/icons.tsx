import type { SVGProps } from 'react';

export function SmecBattleCodeLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
      <path
        fill="currentColor"
        d="M61.13,128,42.87,112.43a8,8,0,0,1,0-11.31l32-28.44a8,8,0,0,1,11.31,0l32,28.44a8,8,0,0,1,0,11.31L99.87,128,118.13,143.57a8,8,0,0,1,0,11.31l-32,28.44a8,8,0,0,1-11.31,0l-32-28.44a8,8,0,0,1,0-11.31Zm94,0,18.26-15.57a8,8,0,0,0,0-11.31l-32-28.44a8,8,0,0,0-11.31,0l-32,28.44a8,8,0,0,0,0,11.31L118.13,128,99.87,143.57a8,8,0,0,0,0,11.31l32,28.44a8,8,0,0,0,11.31,0l32-28.44a8,8,0,0,0,0-11.31Z"
      ></path>
    </svg>
  );
}

export function BulletCoin(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
            <circle cx="12" cy="12" r="10" fill="url(#paint0_linear_1_2)"/>
            <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 20C7.582 20 4 16.418 4 12C4 7.582 7.582 4 12 4C16.418 4 20 7.582 20 12C20 16.418 16.418 20 12 20Z" fill="url(#paint1_linear_1_2)"/>
            <path d="M13.8279 8.33391L15.2078 6.95398C15.3957 6.76611 15.2635 6.44336 15.0117 6.44336H13.6366L11.0029 9.07703L9.62784 7.70197H8.25281C7.99912 7.70197 7.86875 8.02472 8.05662 8.21259L9.43655 9.59252L8.25281 10.7763V12.1513L13.8279 6.57629V8.33391Z" fill="url(#paint2_linear_1_2)"/>
            <path d="M13.1191 17.5566H10.3711L8.25281 15.4383V13.7807L13.8279 8.20575L15.2078 9.58568L10.3711 14.4224L11.0586 15.1098L13.1191 13.0493V17.5566Z" fill="url(#paint3_linear_1_2)"/>
            <defs>
                <linearGradient id="paint0_linear_1_2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FDB813"/>
                    <stop offset="1" stopColor="#F58529"/>
                </linearGradient>
                <linearGradient id="paint1_linear_1_2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F58529"/>
                    <stop offset="1" stopColor="#FDB813"/>
                </linearGradient>
                <linearGradient id="paint2_linear_1_2" x1="11.7302" y1="6.44336" x2="11.7302" y2="12.1513" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FCEE21"/>
                    <stop offset="1" stopColor="#F47B28"/>
                </linearGradient>
                <linearGradient id="paint3_linear_1_2" x1="11.7302" y1="8.20575" x2="11.7302" y2="17.5566" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FCEE21"/>
                    <stop offset="1" stopColor="#F47B28"/>
                </linearGradient>
            </defs>
        </svg>
    )
}
