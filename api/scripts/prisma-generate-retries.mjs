/**
 * Windows-da `prisma generate` bəzən query_engine DLL kilidləndiyi üçün EPERM verir.
 * Bir neçə təkrar cəhd (Nest/process işləyərkən) uğurları artırır.
 */
import { execSync } from 'child_process';

const retries = Math.min(
  8,
  Math.max(1, Number(process.env.PRISMA_GENERATE_RETRIES || 5)),
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (let i = 1; i <= retries; i++) {
    try {
      execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });
      process.exit(0);
    } catch {
      const delay = 250 * i;
      console.warn(
        `[prisma generate] cəhd ${i}/${retries} uğursuz — ${delay}ms sonra yenidən… ` +
          '(DLL kilidi: `nest start` və ya antivirus olmadan təkrarlayın)',
      );
      if (i === retries) {
        console.error('[prisma generate] son cəhd də uğursuz oldu.');
        process.exit(1);
      }
      await sleep(delay);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
