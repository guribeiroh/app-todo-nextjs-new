export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          completed: boolean
          priority: string
          dueDate: string | null
          listId: string
          createdAt: string
          completedAt: string | null
          position: number
          tags: string[]
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          completed?: boolean
          priority?: string
          dueDate?: string | null
          listId: string
          createdAt?: string
          completedAt?: string | null
          position?: number
          tags?: string[]
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          completed?: boolean
          priority?: string
          dueDate?: string | null
          listId?: string
          createdAt?: string
          completedAt?: string | null
          position?: number
          tags?: string[]
          user_id?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          taskId: string
          title: string
          completed: boolean
          position: number
          createdAt: string
        }
        Insert: {
          id?: string
          taskId: string
          title: string
          completed?: boolean
          position?: number
          createdAt?: string
        }
        Update: {
          id?: string
          taskId?: string
          title?: string
          completed?: boolean
          position?: number
          createdAt?: string
        }
      }
      task_lists: {
        Row: {
          id: string
          name: string
          color: string
          createdAt: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          createdAt?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          createdAt?: string
          user_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 