import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&directConnection=true'
    }
  }
});

async function main() {
  const advantages = [
    {
      order: 1,
      title: { az: 'İnteraktiv Öyrənmə', ru: 'Интерактивное обучение' },
      description: {
        az: 'Uşaqların marağını artıran interaktiv dərslərimiz, praktiki layihələr və oyunlar vasitəsilə öyrənmə prosesini əyləncəli və dinamik hala gətirir, bilikləri əyləncə ilə birləşdirir.',
        ru: 'Наши интерактивные занятия, практические проекты и игры делают процесс обучения увлекательным и динамичным, сочетая знания с развлечением и повышая интерес детей.',
      },
    },
    {
      order: 2,
      title: { az: 'Təcrübəli Müəllimlər', ru: 'Опытные преподаватели' },
      description: {
        az: 'Müxtəlif sahələrdə geniş təcrübəyə malik peşəkar müəllimlərimiz, uşaqlara müasir texnologiyalarla tanış olma imkanı təqdim edərək, öyrənmələrini daha dərin və faydalı edir.',
        ru: 'Наши профессиональные преподаватели с обширным опытом в различных областях предоставляют детям возможность познакомиться с современными технологиями, делая их обучение более глубоким и полезным.',
      },
    },
    {
      order: 3,
      title: { az: 'Fərdi Yanaşma', ru: 'Индивидуальный подход' },
      description: {
        az: 'Hər bir uşağın öyrənmə sürətinə uyğun fərdi yanaşma tətbiq edərək, onların unikal bacarıq və maraqlarını inkişaf etdirmək üçün xüsusi proqramlar hazırlayırıq.',
        ru: 'Мы разрабатываем специальные программы, учитывающие темп обучения каждого ребенка, развивая их уникальные способности и интересы с помощью индивидуального подхода.',
      },
    },
    {
      order: 4,
      title: { az: 'Gələcək Uğurlar', ru: 'Будущий успех' },
      description: {
        az: 'Proqramlarımız, uşaqların problem həll etmə, əməkdaşlıq və yaradıcılıq bacarıqlarını artıraraq, gələcək karyeraları üçün güclü bir təməl yaradır və onlara uğur qazanmaq üçün lazım olan resursları təqdim edir.',
        ru: 'Наши программы создают прочную основу для будущей карьеры, развивая навыки решения проблем, сотрудничества и творчества, предоставляя ресурсы, необходимые для достижения успеха.',
      },
    },
    {
      order: 5,
      title: { az: 'Valideyn Nəzarəti və Hesabatlıq', ru: 'Родительский контроль и отчетность' },
      description: {
        az: 'Valideynlərə uşaqlarının inkişafını izləmək üçün mütəmadi hesabatlar təqdim edir, öyrənmə prosesini şəffaf şəkildə paylaşırıq.',
        ru: 'Мы регулярно предоставляем родителям отчеты для отслеживания прогресса их детей, делая процесс обучения прозрачным.',
      },
    },
    {
      order: 6,
      title: { az: 'Beynəlxalq Sertifikat əldə etmək imkanı', ru: 'Возможность получения международного сертификата' },
      description: {
        az: 'Uğurlu məzunlarımız üçün beynəlxalq səviyyədə tanınan sertifikat əldə etmək imkanı təqdim edirik.',
        ru: 'Для наших успешных выпускников мы предоставляем возможность получения сертификата международного образца.',
      },
    },
  ];

  for (const adv of advantages) {
    await prisma.advantage.create({
      data: {
        title: { set: adv.title },
        description: { set: adv.description },
        order: adv.order,
      } as any,
    });
  }
  console.log('Seeded school advantages');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
