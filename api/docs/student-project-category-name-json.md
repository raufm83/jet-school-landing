# StudentProjectsCategory.name — Json (UTF-8)

Prisma modeli `name` sahəsini **Json** kimi saxlayır (tək UTF-8 string və ya `{ "az", "ru" }` obyekti). API cavablarında `name` həmişə **string** qaytarılır.

**Deploy:** `npx prisma generate` və `npx prisma db push` (və ya migrasiya prosesiniz).

Köhnə sənədlər MongoDB-də yalnız **string** idisə, adətən əlavə çevirmə tələb olunmur — BSON string Json sahəsinə uyğun gəlir. Əgər Prisma xətası görsəniz, sənədləri əl ilə JSON obyektinə çevirin.
