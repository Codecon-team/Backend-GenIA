-- DropIndex
DROP INDEX "Subscription_stripe_subscription_id_key";

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "stripe_subscription_id" DROP NOT NULL;
