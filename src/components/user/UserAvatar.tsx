interface UserAvatarProps {
  user: {
    avatar_url?: string;
    name: string;
  };
  className?: string;
}

export function UserAvatar({ user, className = "" }: UserAvatarProps) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className={`rounded-full ${className}`}
      />
    );
  }

  return (
    <div className={`bg-gray-200 rounded-full flex items-center justify-center ${className}`}>
      <span className="text-gray-600 text-sm">
        {user.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
} 