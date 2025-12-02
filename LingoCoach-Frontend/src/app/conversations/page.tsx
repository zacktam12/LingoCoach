'use client'

import { useConversationsQuery } from '@/hooks/useConversations'
import { MessageCircle, Plus, Clock, Globe } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Spinner } from '@/components/ui/spinner'
import { TipCard } from '@/components/ui/TipCard'
import { motion, useReducedMotion } from 'framer-motion'

export default function Conversations() {
  const { data, isLoading, error } = useConversationsQuery()

  const conversations = data || []

  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  }

  const motionListProps = shouldReduceMotion
    ? {}
    : { initial: 'hidden' as const, animate: 'visible' as const }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner className="h-12 w-12 text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
        {error.message}
        {error}
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Conversations</h1>
            <Link href="/conversations/new">
              <button className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </button>
            </Link>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Conversations</h2>

            {conversations.length > 0 ? (
              <motion.div
                className="space-y-4"
                variants={containerVariants}
                {...motionListProps}
              >
                {conversations.map((conversation) => (
                  <motion.div key={conversation.id} variants={itemVariants}>
                    <Link href={`/conversations/${conversation.id}`}>
                      <div className="flex items-center p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <div className="p-2 bg-primary/10 rounded-lg mr-4">
                          <MessageCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {conversation.title || `Conversation in ${conversation.language}`}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Globe className="h-4 w-4 mr-1" />
                            <span className="capitalize mr-3">{conversation.language}</span>
                            <span className="capitalize">{conversation.level}</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="text-center py-8"
                variants={itemVariants}
                {...motionListProps}
              >
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start a new conversation to practice your language skills.
                </p>
                <Link href="/conversations/new">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    Start Conversation
                  </button>
                </Link>
              </motion.div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Conversation Tips</h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              variants={containerVariants}
              {...motionListProps}
            >
              <motion.div variants={itemVariants}>
                <TipCard title="Be Consistent" description="Practice daily to build confidence and fluency in your target language." />
              </motion.div>
              <motion.div variants={itemVariants}>
                <TipCard title="Don't Fear Mistakes" description="Mistakes are part of learning. Our AI will help you correct them naturally." />
              </motion.div>
              <motion.div variants={itemVariants}>
                <TipCard title="Ask Questions" description="Be curious! Ask about culture, idioms, and real-life usage of the language." />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}