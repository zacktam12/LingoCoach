import { BookOpen, MessageCircle, Mic, Brain, Trophy, Target } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground mb-6 animate-fade-in">
            Master Languages with{' '}
            <span className="text-primary">AI-Powered</span> Learning
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Experience personalized language learning through AI conversations,
            real-time feedback, and adaptive learning paths designed just for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button asChild size="lg">
              <Link href="/auth/signup">
                Start Learning Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">
                Explore Features
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything You Need to Succeed</h2>
            <p className="mt-4 text-muted-foreground">Our platform is packed with features to help you learn faster and smarter.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-0 pt-6">
                <div className="mb-4"><BookOpen className="h-8 w-8 text-primary mx-auto" /></div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Interactive Lessons
                </h3>
                <p className="text-muted-foreground">
                  Practice with structured lessons tailored to your level and goals.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-0 pt-6">
                <div className="mb-4"><MessageCircle className="h-8 w-8 text-primary mx-auto" /></div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  AI Conversations
                </h3>
                <p className="text-muted-foreground">
                  Practice speaking with intelligent AI tutors that adapt to your level.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-0 pt-6">
                <div className="mb-4"><Mic className="h-8 w-8 text-primary mx-auto" /></div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Pronunciation Analysis
                </h3>
                <p className="text-muted-foreground">
                  Get real-time feedback on your pronunciation and speaking skills.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-0 pt-6">
                <div className="mb-4"><Target className="h-8 w-8 text-primary mx-auto" /></div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Adaptive Learning
                </h3>
                <p className="text-muted-foreground">
                  Personalized lessons that adjust to your progress and learning style.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-0 pt-6">
                <div className="mb-4"><Trophy className="h-8 w-8 text-primary mx-auto" /></div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Achievement System
                </h3>
                <p className="text-muted-foreground">
                  Track your progress and earn badges as you learn.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-0 pt-6">
                <div className="mb-4"><Brain className="h-8 w-8 text-primary mx-auto" /></div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Smart Analytics
                </h3>
                <p className="text-muted-foreground">
                  Track your progress with detailed insights and learning analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Start Your Language Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of learners already mastering new languages with LingoCoach.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/signup">
              Begin Learning Now
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} LingoCoach. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

