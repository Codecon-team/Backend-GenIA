import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existingPlans = await prisma.plan.findMany({
    where: {
      slug: {
        in: ['basic', 'prime']
      }
    }
  })

  if (existingPlans.length === 0) {
    await prisma.plan.create({
      data: {
        name: 'Básico',
        slug: 'basic',
        price: 0,
        billing_cycle: 'monthly',
        analysis_limit: 3, 
        features: JSON.stringify({
          basicAnalysis: true,
          pdfReports: false,
          prioritySupport: false,
          unlimitedStorage: false
        }),
        is_active: true
      }
    })

    await prisma.plan.create({
      data: {
        name: 'Prime',
        slug: 'prime',
        price: 29.90,
        billing_cycle: 'monthly',
        analysis_limit: 100, 
        features: JSON.stringify({
          basicAnalysis: true,
          advancedAnalysis: true,
          pdfReports: true,
          prioritySupport: true,
          unlimitedStorage: true
        }),
        is_active: true
      }
    })

    console.log('Planos básico e prime criados com sucesso!')
  } else {
    console.log('Planos já existem no banco de dados')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })