// emojiUtils.js
export function getEmoji(eventType) {
    switch (eventType) {
        case 'feeding':
            return '🍼'; // Bottle emoji for feeding
        case 'poop':
            return '💩'; // Poop emoji for poop
        case 'spit up':
            return '🤮'; // Vomit emoji for spit up
        case 'breastfeeding':
            return '🤱'; // Breastfeeding emoji
        case 'milestone':
            return '🌟'; // Star emoji for milestones
        case 'bath':
            return '🛁'; // Bathtub emoji for baths
        case 'other':
            return '🗂️';
        default:
            return '❓'; // Question mark emoji for unknown types
    }
}
