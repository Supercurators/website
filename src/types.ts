// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  website?: string;
  created_at: string;
  subscribers_count?: number;
  subscriptions_count?: number;
}

export interface TagCategory {
  id: string;
  name: string;
  color: string;
  tags: string[];
}

export interface Supercuration {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  created_by: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
    bio?: string;
    website?: string;
  };
  links_count: number;
  topics: string[];
  is_public: boolean;
  slug?: string;
  tagCategories: TagCategory[];
}

export interface Link {
  id: string;
  url?: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  emoji_tags: string[];
  topic_ids: string[];
  supercuration_ids?: string[];
  supercuration_tags?: Record<string, string[]>;
  is_original_content: boolean;
  created_by: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
  };
  liked: boolean;
  likes: number;
  reposts_count: number;
  repost_note?: string;
  original_post?: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar_url: string;
    };
  };
}

export interface ExtractedLink {
  url: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  selected: boolean;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  publisher_id: string;
  subscriber_email: string;
  subscriber_name: string;
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface TopicCategory extends Topic {
  // Any additional properties specific to TopicCategory
}