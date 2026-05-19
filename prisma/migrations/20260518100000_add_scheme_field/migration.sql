-- CreateEnum
CREATE TYPE "Scheme" AS ENUM ('SCPP', 'MRT');

-- AlterTable
ALTER TABLE "AgencyApplication" ADD COLUMN     "scheme" "Scheme" NOT NULL DEFAULT 'SCPP';

-- AlterTable
ALTER TABLE "AgencyProfile" ADD COLUMN     "scheme" "Scheme" NOT NULL DEFAULT 'SCPP';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "scheme" "Scheme" NOT NULL DEFAULT 'SCPP';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "scheme" "Scheme" NOT NULL DEFAULT 'SCPP';

