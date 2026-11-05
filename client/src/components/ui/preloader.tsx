"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide the preloader after a set duration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2200);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
        >
          {/* Dekorativ pələng: sağda dayanıb, blursuz */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-0 right-[3%] h-[34vh] md:h-[46vh] lg:right-[6%] lg:h-[68vh] 2xl:right-[10%]"
          >
            <Image
              src="/images/hero-mascot.webp"
              alt=""
              width={533}
              height={900}
              sizes="(min-width: 1024px) 420px, 200px"
              priority
              className="h-full w-auto select-none opacity-95"
            />
          </motion.div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-8">
            {/* Logo Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-80 h-28 md:w-96 md:h-32 mb-8"
            >
              <Image
                src="/logos/JET_School_Yellowww.png"
                alt="Jet School Logo"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
            
            {/* Loading Line similar to Neymantech */}
            <div className="relative w-full h-[2px] bg-gray-100 overflow-hidden mt-2">
              <motion.div
                className="absolute top-0 left-0 h-full bg-[#f9a00e]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
