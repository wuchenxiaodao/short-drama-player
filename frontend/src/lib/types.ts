export interface Drama {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  category: string;
  totalEpisodes: number;
  rating: number;
  viewCount: number;
  isNew: boolean;
  isHot: boolean;
  status: 'ongoing' | 'completed';
  createdAt: string;
}

export interface Episode {
  id: number;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  durationSeconds: number;
  streams?: Stream[];
}

export interface Stream {
  quality: '720p' | '1080p';
  url: string;
}

export type InteractionType =
  | 'CHOICE'
  | 'VOTE'
  | 'EGG'
  | 'QUIZ'
  | 'INFO'
  | 'LINK'
  | 'EMOJI';

export interface InteractionPoint {
  id: number;
  timestampMs: number;
  interactionType: InteractionType;
  questionText: string;
  hint: string;
  hintCost: number;
  options?: InteractionOption[];
  infoContent?: InfoContent;
  linkContent?: LinkContent;
  emojiList?: string[];
  branchGroupId?: number | null;
  prerequisiteId?: number | null;
  prerequisiteChoiceOptionId?: number | null;
}

export interface InteractionOption {
  id: number;
  optionIndex: number;
  optionText: string;
  isCorrect: boolean;
  feedbackText: string;
  nextInteractionId: number | null;
}

export type InfoCategory = 'note' | 'character' | 'knowledge';

export interface InfoContent {
  title: string;
  content: string;
  category: InfoCategory;
  imageUrl?: string;
}

export type LinkType = 'related' | 'product' | 'external';

export interface LinkContent {
  title: string;
  description: string;
  url: string;
  coverUrl?: string;
  linkType: LinkType;
}

export interface InteractionAnswer {
  id: number;
  interactionId: number;
  selectedOptionId: number;
}

export interface Comment {
  id: number;
  userId: number;
  username: string;
  content: string;
  likeCount: number;
  isLiked: boolean;
  replyCount: number;
  createdAt: string;
  replies?: Comment[];
}

export interface Danmaku {
  id: number;
  episodeId: number;
  userId: number;
  content: string;
  positionMs: number;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  avatarUrl: string;
  points: number;
}

export interface WatchProgress {
  userId: number;
  episodeId: number;
  positionMs: number;
  completed: boolean;
}

export interface Favorite {
  id: number;
  dramaId: number;
}

export interface Rating {
  id: number;
  dramaId: number;
  score: number;
}

export interface UserEgg {
  id: number;
  interactionId: number;
  eggContent: string;
  collectedAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface InteractionStats {
  totalInteractions: number;
  participationRate: number;
  topInteractions: { interactionId: number; count: number }[];
  typeDistribution: Record<InteractionType, number>;
  hourlyDistribution: { hour: number; count: number }[];
}
