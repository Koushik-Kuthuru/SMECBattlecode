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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            <path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
    )
}
