"use client"

import { useQuery } from "@tanstack/react-query"
import { conversationAPI } from "@/lib/api"

export function useConversationsQuery() {
  return useQuery({
    queryKey: ["conversations", "list"],
    queryFn: async () => {
      const response = await conversationAPI.getConversations()
      return response.data.conversations || []
    },
  })
}
