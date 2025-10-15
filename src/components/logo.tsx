import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn("text-primary", props.className)}
    >
        <path
            fill="currentColor"
            d="M50 0C27.9 0 10 17.9 10 40c0 22.1 40 60 40 60s40-37.9 40-60C90 17.9 72.1 0 50 0zm0 55.6c-8.6 0-15.6-7-15.6-15.6s7-15.6 15.6-15.6 15.6 7 15.6 15.6-7 15.6-15.6 15.6z"
        />
        <path 
            fill="currentColor"
            transform="translate(13, 13) scale(0.75)"
            d="M50,0C27.9,0,10,17.9,10,40c0,7.2,1.9,13.9,5.3,19.8L50,100l34.7-40.2C88.1,53.9,90,47.2,90,40C90,17.9,72.1,0,50,0z M50,56.2c-8.9,0-16.2-7.2-16.2-16.2c0-8.9,7.2-16.2,16.2-16.2s16.2,7.2,16.2,16.2C66.2,49,58.9,56.2,50,56.2z"
        />
        <path
            fill="white"
            transform="translate(35, 25) scale(0.4)"
            d="M60,4h-8v12h-4V12H32v- оркеH16v4h-4v20h24V16h-4V4z M40,24h-8V12h8V24z M64,48H52V36c0-2.2-1.8-4-4-4h-8c-2.2,0-4,1.8-4,4v12H20V28h8v4h4v-4h12V12h4v12h4V12h8v36H64z"
        />
    </svg>
  );
}