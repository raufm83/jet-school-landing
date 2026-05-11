"use client";
import { motion } from "framer-motion";
import { MdPhone, MdMail, MdLocationOn } from "react-icons/md";
import { FaWhatsapp, FaClock } from "react-icons/fa";

interface ContactInfoProps {
  phone: string;
  email: string;
  address: string;
  address2: string;
  whatsapp: string;
  workingHours: {
    weekdays: string;
    sunday: string;
  };
}

export default function ContactInfo({
  phone,
  email,
  address,
  whatsapp,
  workingHours,
}: ContactInfoProps) {

  const hasPhone = phone?.trim();
  const hasWhatsapp = whatsapp?.trim();
  const hasEmail = email?.trim();
  const hasAddress = address?.trim();
  const placeholder = "—";

  const contactItems = [
    {
      icon: <MdPhone className="w-6 h-6 text-jsyellow" />,
      value: hasPhone ? phone : placeholder,
      link: hasPhone ? `tel:${phone}` : null,
    },
    {
      icon: <FaWhatsapp className="w-6 h-6 text-jsyellow" />,
      value: hasWhatsapp ? whatsapp : placeholder,
      link: hasWhatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null,
    },
    {
      icon: <MdMail className="w-6 h-6 text-jsyellow" />,
      value: hasEmail ? email : placeholder,
      link: hasEmail ? `mailto:${email}` : null,
    },
    {
      icon: <MdLocationOn className="w-6 h-6 text-jsyellow" />,
      value: hasAddress ? address : placeholder,
      link: hasAddress ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null,
    },
    {
      icon: <FaClock className="w-6 h-6 text-jsyellow" />,
      workingHours: workingHours,
      link: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {contactItems.map((item, index) => (
        <motion.div
          key={index}
          className="border border-jsyellow rounded-[32px] px-6 py-4 bg-[#fef7eb] hover:scale-[1.02] transition-transform min-h-[72px] flex items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full"
            >
              {item.icon}
              <p className="text-gray-600">{item.value}</p>
            </a>
          ) : "workingHours" in item && item.workingHours ? (
            <div className="flex items-center gap-4 w-full">
              {item.icon}
              <div className="flex flex-col gap-1">
                <span className="text-gray-600 leading-relaxed">
                  {item.workingHours?.weekdays || placeholder}
                </span>
                <span className="text-gray-600 leading-relaxed">
                  {item.workingHours?.sunday || placeholder}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 w-full">
              {item.icon}
              <p className="text-gray-500">{item.value}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
