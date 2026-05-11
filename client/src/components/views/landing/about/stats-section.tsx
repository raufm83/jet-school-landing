"use client";
import { motion } from "framer-motion";

interface StatsProps {
  stats: {
    graduatesLabel: string;
    groupsLabel: string;
    studentsLabel: string;
    teachingArea: string;
  };
}

export default function StatsSection({ stats }: StatsProps) {
  const statsData = [
    { value: "12+", label: stats.teachingArea },
    { value: "500+", label: stats.graduatesLabel },
    { value: "25+", label: stats.groupsLabel },
    { value: "200+", label: stats.studentsLabel },
  ];

  return (
    <section
      id="mezunlar"
      className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 sm:py-12 md:py-16 lg:py-20"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
        {statsData.map(({ value, label }, index) => (
          <motion.div
            key={index}
            className="relative flex flex-col items-center justify-center text-center rounded-2xl lg:rounded-3xl border border-jsyellow bg-[#fef7eb] hover:bg-[#fef3e0] shadow-sm hover:shadow-lg transition-all duration-300 p-5 sm:p-6 md:p-7 lg:p-8 min-h-[140px] sm:min-h-[160px] md:min-h-[180px] lg:min-h-[200px]"
            whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.45, ease: "easeOut" }}
          >
            <motion.h3
              className="
                font-bold text-jsyellow mb-2 sm:mb-3 lg:mb-4 leading-none 
                text-[clamp(36px,5vw,48px)]
                sm:text-[clamp(28px,3.5vw,48px)]
                md:text-[clamp(32px,3vw,48px)]
                lg:text-[clamp(22px,3vw,48px)]
                [@media(min-width:3000px)]:text-7xl
                [@media(min-width:3500px)]:text-8xl
              "
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {value}
            </motion.h3>

            <p
              className="
                text-gray-700 font-medium leading-snug 
                text-[clamp(13px,1.3vw,20px)] 
                max-w-[28ch]
                [@media(min-width:3000px)]:text-3xl
                [@media(min-width:3500px)]:text-4xl
              "
            >
              {label}
            </p>

            <div className="absolute top-3 right-3 w-3 h-3 bg-jsyellow/20 rounded-full" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
