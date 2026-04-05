import React from "react";
import kfarmsLogo from "../assets/Kfarms_logo.png";

export default function AuthWatermark({ logoUrl = "" }) {
  const resolvedLogo = logoUrl || kfarmsLogo;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      <img
        src={resolvedLogo}
        alt=""
        className="absolute bottom-[-8rem] right-[-7rem] h-[26rem] w-[26rem] max-w-none object-contain opacity-[0.06] saturate-125 contrast-110 sm:bottom-[-10rem] sm:right-[-9rem] sm:h-[34rem] sm:w-[34rem] lg:bottom-[-12rem] lg:right-[-10rem] lg:h-[42rem] lg:w-[42rem]"
      />
    </div>
  );
}
