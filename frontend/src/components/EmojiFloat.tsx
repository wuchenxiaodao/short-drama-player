'use client'

import { useState, useCallback, useRef } from 'react'
import EmojiPicker from './EmojiPicker'

interface FloatingEmoji {
  id: number
  emoji: string
  x: number
  likes: number
  liked: boolean
}

export default function EmojiFloat() {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const nextId = useRef(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a, [data-interaction], [data-emoji-picker]')) return
    const timer = setTimeout(() => setShowPicker(true), 500)
    longPressTimer.current = timer
  }, [])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleEmojiSelect = useCallback((emoji: string) => {
    setShowPicker(false)
    const id = nextId.current++
    const newEmoji: FloatingEmoji = { id, emoji, x: 20 + Math.random() * 60, likes: 0, liked: false }
    setEmojis(prev => [...prev, newEmoji])
    setTimeout(() => setEmojis(prev => prev.filter(e => e.id !== id)), 4000)
  }, [])

  const handleLikeEmoji = useCallback((id: number) => {
    setEmojis(prev => prev.map(e => e.id === id ? { ...e, likes: e.likes + 1, liked: true } : e))
    setTimeout(() => setEmojis(prev => prev.map(e => e.id === id ? { ...e, liked: false } : e)), 300)
  }, [])

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 z-30"
      style={{ touchAction: 'none' }}
    >
      {emojis.map(e => (
        <div
          key={e.id}
          className="absolute animate-float-up select-none"
          style={{ left: `${e.x}%`, bottom: '20%' }}
          onClick={() => handleLikeEmoji(e.id)}
        >
          <span className={`text-4xl drop-shadow-lg cursor-pointer ${e.liked ? 'animate-like-pop' : ''}`}>
            {e.emoji}
          </span>
          {e.likes > 0 && (
            <span className="absolute -top-3 -right-4 text-xs text-primary font-bold">+{e.likes}</span>
          )}
        </div>
      ))}
      {showPicker && (
        <div data-emoji-picker>
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowPicker(false)} />
        </div>
      )}
    </div>
  )
}
