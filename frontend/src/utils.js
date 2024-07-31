// emojiUtils.js
export function getEmoji(eventType) {
    switch (eventType) {
        case 'feeding':
            return '🍼'; // Bottle emoji for feeding
        case 'solids_feeding':
            return '🥕🍠🥑';
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
        case 'weight_recorded':
            return '⚖️'
        case 'incomplete_feeding':
            return '❌'
        default:
            return '❓'; // Question mark emoji for unknown types
    }
}

export function formatDateToInputString(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function convertUnixTimeToLocalTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
    });
}