import { BookOpen, MessageCircle, Mic, Brain, Trophy, Target } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">LingoCoach</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Sign In
            </Link>
            <Link href="/auth/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Master Languages with
            <span className="text-blue-600"> AI-Powered</span> Learning
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience personalized language learning through AI conversations, 
            real-time feedback, and adaptive learning paths designed just for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="px-8 py-4 bg-blue-600 text-white text-lg rounded-md hover:bg-blue-700">
              Start Learning Free
            </Link>
            <Link href="#features" className="px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-lg rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
              Explore Features
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-24 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link href="/lessons" className="block group">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Interactive Lessons
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Practice with structured lessons tailored to your level and goals
              </p>
            </div>
          </Link>

          <Link href="/conversations" className="block group">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI Conversations
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Practice speaking with intelligent AI tutors that adapt to your level
              </p>
            </div>
          </Link>

          <Link href="/pronunciation" className="block group">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <Mic className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Pronunciation Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get real-time feedback on your pronunciation and speaking skills
              </p>
            </div>
          </Link>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <Target className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Adaptive Learning
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Personalized lessons that adjust to your progress and learning style
            </p>
          </div>

          <Link href="/achievements" className="block group">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
              <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Achievement System
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your progress and earn badges as you learn
              </p>
            </div>
          </Link>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <Brain className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Smart Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track your progress with detailed insights and learning analytics
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Your Language Journey?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of learners already mastering new languages with LingoCoach
          </p>
          <Link href="/auth/signup" className="px-8 py-4 bg-blue-600 text-white text-lg rounded-md hover:bg-blue-700">
            Begin Learning Now
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 LingoCoach. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}