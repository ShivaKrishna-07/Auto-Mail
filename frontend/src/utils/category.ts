/**
 * Returns consistent Tailwind/CSS classes for smart email categories.
 */
export function getCategoryColor(category: string): string {
  switch (category?.toLowerCase()) {
    case 'newsletter':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    case 'job':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'finance':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'notification':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'personal':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'professional':
    default:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
}
