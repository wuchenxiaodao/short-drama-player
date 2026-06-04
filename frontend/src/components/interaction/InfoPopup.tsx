'use client';

import { BookOpen, User, Lightbulb } from 'lucide-react';
import type { InteractionPoint, InfoCategory } from '@/lib/types';

interface InfoPopupProps {
  interaction: InteractionPoint;
}

const categoryConfig: Record<InfoCategory, { icon: React.ReactNode; label: string; color: string }> = {
  note: { icon: <BookOpen className="w-4 h-4" />, label: '笔记', color: 'text-blue-400 bg-blue-400/10' },
  character: { icon: <User className="w-4 h-4" />, label: '角色', color: 'text-purple-400 bg-purple-400/10' },
  knowledge: { icon: <Lightbulb className="w-4 h-4" />, label: '知识点', color: 'text-yellow-400 bg-yellow-400/10' },
};

export default function InfoPopup({ interaction }: InfoPopupProps) {
  const info = interaction.infoContent;
  if (!info) return null;

  const config = categoryConfig[info.category] || categoryConfig.note;

  return (
    <div className="bg-drama-card/95 backdrop-blur-md border border-drama-border rounded-xl p-4 shadow-xl mx-2 mb-2 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
          {config.icon}
          {config.label}
        </div>
      </div>

      <h4 className="text-sm font-medium text-drama-text mb-1">{info.title}</h4>
      <p className="text-xs text-drama-muted leading-relaxed">{info.content}</p>

      {info.imageUrl && (
        <div className="mt-2 rounded-lg overflow-hidden">
          <img src={info.imageUrl} alt={info.title} className="w-full h-auto object-cover rounded-lg" />
        </div>
      )}
    </div>
  );
}
