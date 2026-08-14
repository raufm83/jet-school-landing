"use client";
import { useTranslations } from "next-intl";
import { FaCloud, FaCode, FaShieldAlt } from "react-icons/fa";

const moduleTypes = [
  { id: "starter", icon: FaCloud },
  { id: "programmer", icon: FaCode },
  { id: "hacker", icon: FaShieldAlt },
];

const CourseModules = () => {
  const t = useTranslations("courses");

  const renderModuleIcon = (moduleId: string) => {
    const moduleType = moduleTypes.find((type) => type.id === moduleId);
    const Icon = moduleType?.icon || FaCloud;
    return (
      <div className="bg-jsyellow text-white p-2 rounded-full transition-transform duration-200 hover:scale-110 hover:rotate-[5deg] active:scale-95">
        <Icon className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 relative">
        {moduleTypes.map((moduleType) => {
          const moduleId = moduleType.id;
          const moduleSubKeys = Object.keys(t.raw(`${moduleId}.modules`));

          return (
            <div key={moduleId} className="w-full select-none cursor-pointer">
              <div className="flex items-center gap-4 mb-6">
                {renderModuleIcon(moduleId)}
                <h2 className="font-semibold select-none pointer-events-none text-[28px] text-jsblack">
                  {t(`${moduleId}.title`)}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moduleSubKeys.map((subKey) => (
                  <div
                    key={subKey}
                    className="border border-jsyellow rounded-[32px] p-6 bg-[#fef7eb] text-jsblack transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:shadow-black/20 active:scale-[0.98]"
                  >
                    <div className="flex flex-col gap-4">
                      <h3 className="font-semibold text-xl">
                        {t(`${moduleId}.modules.${subKey}.title`)}
                      </h3>
                      <p className="text-gray-600">
                        {t(`${moduleId}.modules.${subKey}.description`)}
                      </p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm bg-jsyellow/10 px-3 py-1 rounded-full hover:bg-jsyellow/20 transition-colors duration-200">
                          {t(`${moduleId}.modules.${subKey}.duration`)}
                        </span>
                        <span className="text-sm bg-jsyellow/10 px-3 py-1 rounded-full hover:bg-jsyellow/20 transition-colors duration-200">
                          {t(`${moduleId}.modules.${subKey}.level`)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseModules;
