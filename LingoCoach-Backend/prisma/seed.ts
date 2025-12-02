import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with achievements and lessons...')
  
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

  // Sample lessons with structured vocabulary / grammar / practice content
  const lessons = [
    {
      id: 'lesson-es-greetings-beginner',
      title: 'Spanish Basics: Greetings',
      description: 'Learn common Spanish greetings and introductions.',
      language: 'es',
      level: 'beginner',
      category: 'vocabulary',
      duration: 15,
      content: {
        vocabulary: [
          {
            term: 'hola',
            translation: 'hello',
            example: 'Hola, ¿cómo estás?'
          },
          {
            term: 'buenos días',
            translation: 'good morning',
            example: 'Buenos días, señor García.'
          },
          {
            term: 'buenas noches',
            translation: 'good night',
            example: 'Buenas noches y hasta mañana.'
          }
        ],
        grammar: [
          {
            title: 'Formal vs informal greetings',
            explanation: 'Use "hola" in most situations. Use "buenos días" / "buenas noches" in more formal contexts or specific times of day.',
            examples: [
              'Hola, Marta. (informal)',
              'Buenos días, profesor. (formal)'
            ]
          }
        ],
        practice: [
          'Write three greetings you would use with friends.',
          'Write three greetings you would use with a teacher or boss.'
        ]
      }
    },
    {
      id: 'lesson-en-present-simple-beginner',
      title: 'English Grammar: Present Simple',
      description: 'Understand and practice the present simple tense in English.',
      language: 'en',
      level: 'beginner',
      category: 'grammar',
      duration: 20,
      content: {
        vocabulary: [
          {
            term: 'usually',
            translation: 'in most cases / most of the time',
            example: 'I usually wake up at 7 a.m.'
          },
          {
            term: 'never',
            translation: 'at no time',
            example: 'She never drinks coffee.'
          }
        ],
        grammar: [
          {
            title: 'Form of the present simple',
            explanation: 'Use the base form of the verb for all subjects except third person singular (he, she, it), where you add -s or -es.',
            examples: [
              'I work in a bank.',
              'He works in a bank.',
              'They watch TV in the evening.',
              'She watches TV in the evening.'
            ]
          }
        ],
        practice: [
          'Write five sentences about your daily routine using the present simple.',
          'Rewrite the sentences for a friend (he/she) and change the verb forms correctly.'
        ]
      }
    },
    {
      id: 'lesson-fr-cafe-conversation',
      title: 'French Conversation: At the Café',
      description: 'Practice ordering food and drinks in French at a café.',
      language: 'fr',
      level: 'beginner',
      category: 'conversation',
      duration: 15,
      content: {
        vocabulary: [
          {
            term: "un café",
            translation: 'a coffee',
            example: "Je voudrais un café, s'il vous plaît."
          },
          {
            term: 'l’addition',
            translation: 'the bill',
            example: "L’addition, s'il vous plaît."
          }
        ],
        grammar: [
          {
            title: 'Polite requests with "je voudrais"',
            explanation: '"Je voudrais" (I would like) is a polite way to order in French.',
            examples: [
              "Je voudrais un jus d'orange, s'il vous plaît.",
              "Je voudrais un sandwich au fromage."
            ]
          }
        ],
        practice: [
          'Write a short dialogue between you and a waiter at a café.',
          'Record yourself reading the dialogue aloud.'
        ]
      }
    }
  ]

  for (const lesson of lessons) {
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {},
      create: lesson,
    })
  }

  console.log(`Seeded ${achievements.length} achievements and ${lessons.length} lessons`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })