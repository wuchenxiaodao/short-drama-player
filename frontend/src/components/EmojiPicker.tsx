'use client'

import { useState } from 'react'

const EMOJI_LIST = ['😂','😍','😭','😡','👏','🔥','💔','🤣','😱','💯','✨','❤️']

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [closing, setClosing] = useState(false)

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 150)
  }

  const handleSelect = (emoji: string) => {
    setClosing(true)
    setTimeout(() => onSelect(emoji), 150)
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={handleClose} />
      <div className={`fixed bottom-1/3 left-1/2 -translate-x-1/2 z-[70]
        bg-black/60 backdrop-blur-xl rounded-2xl p-4
        grid grid-cols-6 gap-3
        border border-white/10
        ${closing ? 'animate-scale-out' : 'animate-scale-in'}`}>
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSelect(emoji)}
            className="text-3xl hover:scale-125 active:scale-90 transition-transform duration-150 p-1"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
