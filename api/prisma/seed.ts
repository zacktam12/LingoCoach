import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Achievements
  const achievements = [
    { name: 'First Lesson', description: 'Complete your first lesson', category: 'lessons', points: 10, icon: '📚' },
    { name: 'Lesson Master', description: 'Complete 10 lessons', category: 'lessons', points: 50, icon: '🎓' },
    { name: 'Conversation Starter', description: 'Start your first conversation', category: 'conversations', points: 15, icon: '💬' },
    { name: 'Chatty', description: 'Have 25 conversations', category: 'conversations', points: 75, icon: '🗣️' },
    { name: 'Perfect Pronunciation', description: 'Score 90+ on a pronunciation test', category: 'pronunciation', points: 30, icon: '🎤' },
    { name: 'Pronunciation Pro', description: 'Score 90+ on 5 pronunciation tests', category: 'pronunciation', points: 100, icon: '🏆' },
    { name: 'Streak Master', description: 'Maintain a 7-day learning streak', category: 'consistency', points: 40, icon: '🔥' },
    { name: 'Dedicated Learner', description: 'Spend 10 hours learning', category: 'consistency', points: 60, icon: '⏱️' },
    { name: 'Polyglot', description: 'Practice 3 different languages', category: 'languages', points: 80, icon: '🌍' },
    { name: 'Grammar Guru', description: 'Complete 5 grammar lessons', category: 'lessons', points: 45, icon: '✏️' },
  ]

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { name: a.name },
      update: {},
      create: { ...a, isActive: true },
    })
  }

  // Lessons with quiz content
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
          { term: 'hola', translation: 'hello', example: 'Hola, como estas?' },
          { term: 'buenos dias', translation: 'good morning', example: 'Buenos dias, senor Garcia.' },
          { term: 'buenas noches', translation: 'good night', example: 'Buenas noches y hasta manana.' },
          { term: 'adios', translation: 'goodbye', example: 'Adios, hasta luego.' },
          { term: 'por favor', translation: 'please', example: 'Un cafe, por favor.' },
          { term: 'gracias', translation: 'thank you', example: 'Muchas gracias.' },
        ],
        grammar: [
          {
            title: 'Formal vs informal greetings',
            explanation: 'Use "hola" in most situations. Use "buenos dias" in formal contexts.',
            examples: ['Hola, Marta. (informal)', 'Buenos dias, profesor. (formal)'],
          },
        ],
        practice: [
          'Write three greetings you would use with friends.',
          'Write three greetings you would use with a teacher.',
        ],
        quiz: [
          { question: 'How do you say "hello" in Spanish?', options: ['Adios', 'Hola', 'Gracias', 'Por favor'], answer: 'Hola' },
          { question: 'What does "buenos dias" mean?', options: ['Good night', 'Goodbye', 'Good morning', 'Thank you'], answer: 'Good morning' },
          { question: 'How do you say "thank you" in Spanish?', options: ['Hola', 'Adios', 'Por favor', 'Gracias'], answer: 'Gracias' },
          { question: 'What does "por favor" mean?', options: ['Please', 'Sorry', 'Hello', 'Goodbye'], answer: 'Please' },
        ],
      },
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
          { term: 'usually', translation: 'in most cases', example: 'I usually wake up at 7 a.m.' },
          { term: 'never', translation: 'at no time', example: 'She never drinks coffee.' },
          { term: 'always', translation: 'at all times', example: 'He always brushes his teeth.' },
          { term: 'sometimes', translation: 'occasionally', example: 'They sometimes go to the gym.' },
        ],
        grammar: [
          {
            title: 'Form of the present simple',
            explanation: 'Use the base form for all subjects except he/she/it, which adds -s or -es.',
            examples: ['I work in a bank.', 'He works in a bank.', 'They watch TV.', 'She watches TV.'],
          },
        ],
        practice: [
          'Write five sentences about your daily routine.',
          'Rewrite the sentences for a friend (he/she) and change the verb forms.',
        ],
        quiz: [
          { question: 'Which is correct?', options: ['She work every day.', 'She works every day.', 'She working every day.', 'She is work every day.'], answer: 'She works every day.' },
          { question: 'Which sentence uses present simple correctly?', options: ['I am go to school.', 'I goes to school.', 'I go to school.', 'I going to school.'], answer: 'I go to school.' },
          { question: 'What does "usually" mean?', options: ['Never', 'Always', 'In most cases', 'Right now'], answer: 'In most cases' },
        ],
      },
    },
    {
      id: 'lesson-fr-cafe-beginner',
      title: 'French Conversation: At the Cafe',
      description: 'Practice ordering food and drinks in French at a cafe.',
      language: 'fr',
      level: 'beginner',
      category: 'conversation',
      duration: 15,
      content: {
        vocabulary: [
          { term: 'un cafe', translation: 'a coffee', example: 'Je voudrais un cafe, s\'il vous plait.' },
          { term: 'l\'addition', translation: 'the bill', example: 'L\'addition, s\'il vous plait.' },
          { term: 'un croissant', translation: 'a croissant', example: 'Je prends un croissant.' },
          { term: 's\'il vous plait', translation: 'please (formal)', example: 'Un verre d\'eau, s\'il vous plait.' },
        ],
        grammar: [
          {
            title: 'Polite requests with "je voudrais"',
            explanation: '"Je voudrais" (I would like) is a polite way to order in French.',
            examples: ['Je voudrais un jus d\'orange, s\'il vous plait.', 'Je voudrais un sandwich au fromage.'],
          },
        ],
        practice: [
          'Write a short dialogue between you and a waiter at a cafe.',
          'Record yourself reading the dialogue aloud.',
        ],
        quiz: [
          { question: 'How do you say "I would like" in French?', options: ['Je suis', 'Je voudrais', 'Je mange', 'Je parle'], answer: 'Je voudrais' },
          { question: 'What is "l\'addition"?', options: ['The menu', 'The waiter', 'The bill', 'The coffee'], answer: 'The bill' },
          { question: 'How do you say "please" formally in French?', options: ['Merci', 'Bonjour', 'S\'il vous plait', 'Au revoir'], answer: 'S\'il vous plait' },
        ],
      },
    },
    {
      id: 'lesson-de-numbers-beginner',
      title: 'German Numbers 1-20',
      description: 'Learn to count from 1 to 20 in German.',
      language: 'de',
      level: 'beginner',
      category: 'vocabulary',
      duration: 10,
      content: {
        vocabulary: [
          { term: 'eins', translation: 'one', example: 'Ich habe eins.' },
          { term: 'zwei', translation: 'two', example: 'Zwei Kaffee, bitte.' },
          { term: 'drei', translation: 'three', example: 'Drei Apfel.' },
          { term: 'zehn', translation: 'ten', example: 'Zehn Minuten.' },
          { term: 'zwanzig', translation: 'twenty', example: 'Zwanzig Euro.' },
        ],
        grammar: [
          {
            title: 'Numbers in German',
            explanation: 'German numbers 1-12 are unique words. 13-19 follow a pattern: number + zehn.',
            examples: ['dreizehn = 13 (drei + zehn)', 'vierzehn = 14 (vier + zehn)', 'neunzehn = 19 (neun + zehn)'],
          },
        ],
        practice: [
          'Count from 1 to 20 aloud in German.',
          'Write the German words for: 5, 11, 15, 18, 20.',
        ],
        quiz: [
          { question: 'What is "zwei" in English?', options: ['One', 'Three', 'Two', 'Four'], answer: 'Two' },
          { question: 'How do you say "ten" in German?', options: ['Zehn', 'Zwei', 'Drei', 'Zwanzig'], answer: 'Zehn' },
          { question: 'What does "zwanzig" mean?', options: ['Twelve', 'Twenty', 'Two', 'Ten'], answer: 'Twenty' },
        ],
      },
    },
    {
      id: 'lesson-es-preterite-intermediate',
      title: 'Spanish Intermediate: Past Tense',
      description: 'Learn to talk about past events using the preterite tense.',
      language: 'es',
      level: 'intermediate',
      category: 'grammar',
      duration: 25,
      content: {
        vocabulary: [
          { term: 'ayer', translation: 'yesterday', example: 'Ayer fui al mercado.' },
          { term: 'la semana pasada', translation: 'last week', example: 'La semana pasada viaje a Madrid.' },
          { term: 'hace un ano', translation: 'a year ago', example: 'Hace un ano aprendi espanol.' },
        ],
        grammar: [
          {
            title: 'Preterite tense (regular -ar verbs)',
            explanation: 'For regular -ar verbs, remove -ar and add: -e, -aste, -o, -amos, -asteis, -aron.',
            examples: ['hablar: yo hable (I spoke)', 'trabajar: el trabajo (he worked)', 'caminar: nosotros caminamos (we walked)'],
          },
        ],
        practice: [
          'Write five sentences about what you did yesterday.',
          'Conjugate "hablar" in all preterite forms.',
        ],
        quiz: [
          { question: 'What is the preterite of "yo hablar"?', options: ['hablo', 'hable', 'hablaba', 'hablare'], answer: 'hable' },
          { question: 'What does "ayer" mean?', options: ['Tomorrow', 'Today', 'Yesterday', 'Last week'], answer: 'Yesterday' },
          { question: 'Which is the correct preterite for "el trabajar"?', options: ['trabaja', 'trabajo', 'trabajaba', 'trabajara'], answer: 'trabajo' },
        ],
      },
    },
    {
      id: 'lesson-en-vocabulary-travel',
      title: 'English Vocabulary: Travel',
      description: 'Essential vocabulary for traveling in English-speaking countries.',
      language: 'en',
      level: 'beginner',
      category: 'vocabulary',
      duration: 15,
      content: {
        vocabulary: [
          { term: 'passport', translation: 'official travel document', example: 'Please show your passport at the border.' },
          { term: 'boarding pass', translation: 'ticket to board a plane', example: 'I need to print my boarding pass.' },
          { term: 'luggage', translation: 'bags and suitcases', example: 'My luggage is too heavy.' },
          { term: 'customs', translation: 'border control for goods', example: 'You must declare items at customs.' },
          { term: 'departure', translation: 'leaving a place', example: 'The departure time is 10:30 AM.' },
          { term: 'arrival', translation: 'reaching a destination', example: 'The arrival gate is B12.' },
        ],
        grammar: [
          {
            title: 'Asking for directions',
            explanation: 'Use "Could you tell me..." or "Where is..." to ask for directions politely.',
            examples: ['Could you tell me where the gate is?', 'Where is the nearest taxi stand?'],
          },
        ],
        practice: [
          'Write a short paragraph about a trip you took or would like to take.',
          'Practice asking for directions using the vocabulary above.',
        ],
        quiz: [
          { question: 'What is a "boarding pass"?', options: ['A travel document', 'A ticket to board a plane', 'A type of luggage', 'A customs form'], answer: 'A ticket to board a plane' },
          { question: 'What does "departure" mean?', options: ['Arriving at a place', 'Leaving a place', 'Checking in', 'Boarding'], answer: 'Leaving a place' },
          { question: 'Where do you show your passport?', options: ['At the gate', 'At the restaurant', 'At the border', 'At the hotel'], answer: 'At the border' },
        ],
      },
    },
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
