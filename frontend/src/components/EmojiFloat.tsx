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
  const [pressing, setPressing] = useState(false)
  const [pressPos, setPressPos] = useState({ x: 0, y: 0 })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const nextId = useRef(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a, [data-interaction], [data-emoji-picker]')) return
    setPressing(true)
    setPressPos({ x: e.clientX, y: e.clientY })
    const timer = setTimeout(() => {
      setPressing(false)
      setShowPicker(true)
    }, 500)
    longPressTimer.current = timer
  }, [])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setPressing(false)
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
    setTimeout(() => setEmojis(prev => prev.map(e => e.id === id ? { ...e, liked: false } : e)), 350)
  }, [])

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 z-30"
      style={{ touchAction: 'none' }}
    >
      {pressing && !showPicker && (
        <div
          className="absolute animate-press-hint pointer-events-none"
          style={{ left: pressPos.x, top: pressPos.y, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/30" />
        </div>
      )}

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
            <span className="absolute -top-3 -right-4 text-xs text-primary font-bold animate-like-pop">
              +{e.likes}
            </span>
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
