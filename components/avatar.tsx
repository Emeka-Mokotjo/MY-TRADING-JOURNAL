interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
}

export function Avatar({ firstName, lastName, className = "w-10 h-10" }: AvatarProps) {
  const getInitials = () => {
    const first = firstName?.charAt(0).toUpperCase() || "";
    const last = lastName?.charAt(0).toUpperCase() || "";
    return first + last || "T"; // Default to "T" for Trader
  };

  const getBackgroundColor = () => {
    const name = (firstName || "") + (lastName || "");
    const hash = name.charCodeAt(0) || 0;
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-cyan-500",
    ];
    return colors[hash % colors.length];
  };

  return (
    <div
      className={`${className} ${getBackgroundColor()} rounded-full flex items-center justify-center text-white font-semibold text-sm`}
    >
      {getInitials()}
    </div>
  );
}
