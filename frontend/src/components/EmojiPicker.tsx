'use client'

const EMOJI_LIST = ['😂','😍','😭','😡','👏','🔥','💔','🤣','😱','💯','✨','❤️']

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div className="fixed bottom-1/3 left-1/2 -translate-x-1/2 z-[70]
        bg-black/60 backdrop-blur-xl rounded-2xl p-4
        grid grid-cols-6 gap-3
        animate-scale-in border border-white/10">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="text-3xl hover:scale-125 active:scale-90 transition-transform duration-150 p-1"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
