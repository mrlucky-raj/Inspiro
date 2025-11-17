import React from 'react';
import { Post } from '../types';
import Card from './Card';

interface GalleryProps {
  posts: Post[];
  onCardClick: (post: Post) => void;
}

const Gallery: React.FC<GalleryProps> = ({ posts, onCardClick }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-slate-600 dark:text-slate-400">No content found.</h2>
        <p className="text-slate-500 mt-2">Try adjusting your search query.</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
      {posts.map(post => (
        <Card key={post._id} post={post} onClick={() => onCardClick(post)} />
      ))}
    </div>
  );
};

export default Gallery;