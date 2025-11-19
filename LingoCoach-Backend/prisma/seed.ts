import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with achievements...')
  
  // Create sample achievements
  const achievements = [
    {
      name: 'First Lesson',
      description: 'Complete your first lesson',
      category: 'lessons',
      points: 10,
      icon: '📚'
    },
    {
      name: 'Lesson Master',
      description: 'Complete 10 lessons',
      category: 'lessons',
      points: 50,
      icon: '🎓'
    },
    {
      name: 'Conversation Starter',
      description: 'Start your first conversation',
      category: 'conversations',
      points: 15,
      icon: '💬'
    },
    {
      name: 'Chatty',
      description: 'Have 25 conversations',
      category: 'conversations',
      points: 75,
      icon: '🗣️'
    },
    {
      name: 'Perfect Pronunciation',
      description: 'Score 90+ on a pronunciation test',
      category: 'pronunciation',
      points: 30,
      icon: '🎤'
    },
    {
      name: 'Pronunciation Pro',
      description: 'Score 90+ on 5 pronunciation tests',
      category: 'pronunciation',
      points: 100,
      icon: '🏆'
    },
    {
      name: 'Streak Master',
      description: 'Maintain a 7-day learning streak',
      category: 'consistency',
      points: 40,
      icon: '🔥'
    },
    {
      name: 'Dedicated Learner',
      description: 'Spend 10 hours learning',
      category: 'consistency',
      points: 60,
      icon: '⏱️'
    }
  ]

  // Insert achievements into database
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: {
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        points: achievement.points,
        icon: achievement.icon,
        isActive: true
      }
    })
  }

  console.log(`Seeded ${achievements.length} achievements`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })