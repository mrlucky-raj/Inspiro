export enum PostType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Note = 'note',
  Quote = 'quote',
}

export interface Post {
  _id: string;
  createdAt: string;
  title: string;
  type: PostType;
  description?: string | null;
  fileUrl?: string | null;
  coverUrl?: string | null;
  noteText?: string | null;
  quoteText?: string | null;
  source?: string | null;
  tags?: string[] | null;
  initialTime?: number; // Used to resume media from a specific time
}