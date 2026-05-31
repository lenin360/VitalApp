const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
function extract(url) {
    const match = url.match(regex);
    return match ? match[1] : null;
}
console.log(extract('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
console.log(extract('https://youtube.com/shorts/dQw4w9WgXcQ?feature=share'));
console.log(extract('https://www.youtube.com/live/dQw4w9WgXcQ?feature=share'));
console.log(extract('https://www.youtube.com/embed/dQw4w9WgXcQ'));
console.log(extract('https://youtu.be/dQw4w9WgXcQ?t=5'));
console.log(extract('dQw4w9WgXcQ'));
