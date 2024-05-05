// emojiUtils.js
export function getEmoji(eventType) {
    switch (eventType) {
        case 'feeding':
            return '🍼'; // Bottle emoji for feeding
        case 'poop':
            return '💩'; // Poop emoji for poop
        case 'spit up':
            return '🤮'; // Vomit emoji for spit up
        default:
            return '❓'; // Question mark emoji for unknown types
    }
}
