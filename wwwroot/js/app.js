import { signal } from "https://esm.sh/@preact/signals-core";

const API_URL = "/api/posts";

const postsSignal = signal([]);

// Fetch initial posts from .NET backend
async function fetchPosts() {
    try {
        const res = await fetch(API_URL);
        postsSignal.value = await res.json();
    } catch (err) {
        console.error("Failed to fetch posts:", err);
    }
}

// Like a post action
window.handleLike = async function(id) {
    const res = await fetch(`${API_URL}/${id}/like`, { method: "POST" });
    if (res.ok) {
        const data = await res.json();
        postsSignal.value = postsSignal.value.map(p => 
            p.id === id ? { ...p, likes: data.likes } : p
        );
    }
};

// Add a comment action
window.handleAddComment = async function(id, event) {
    event.preventDefault();
    const input = document.getElementById(`comment-input-${id}`);
    const text = input.value.trim();
    if (!text) return;

    const res = await fetch(`${API_URL}/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });

    if (res.ok) {
        const updatedPost = await res.json();
        // Update local signal state with the updated post containing the new comment
        postsSignal.value = postsSignal.value.map(p => 
            p.id === id ? updatedPost : p
        );
        input.value = "";
    }
};

// Handle New Post Submission
document.getElementById("post-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("post-input");
    const content = input.value.trim();
    if (!content) return;

    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });

    if (res.ok) {
        const newPost = await res.json();
        postsSignal.value = [newPost, ...postsSignal.value];
        input.value = "";
    }
});

// Render Feed reactive loop
const feedContainer = document.getElementById("feed-container");
postsSignal.subscribe(posts => {
    feedContainer.innerHTML = posts.map(post => `
        <div class="bg-white rounded-lg shadow p-4 space-y-3">
            <!-- Author Header -->
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" class="w-full h-full object-cover">
                </div>
                <div>
                    <h3 class="font-bold text-sm">Alex Johnson</h3>
                    <span class="text-xs text-gray-500">${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            <!-- Post Content -->
            <p class="text-gray-800 text-sm whitespace-pre-line">${post.content}</p>
            
            <!-- Likes & Comments Count -->
            <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                <span>👍 ${post.likes} Likes</span>
                <span>${post.comments.length} Comments</span>
            </div>

            <!-- Action Buttons -->
            <div class="flex border-t pt-1">
                <button onclick="handleLike(${post.id})" class="flex-1 py-1 text-center font-semibold text-gray-600 hover:bg-gray-100 rounded text-sm transition">
                    Like
                </button>
                <button onclick="document.getElementById('comment-input-${post.id}').focus()" class="flex-1 py-1 text-center font-semibold text-gray-600 hover:bg-gray-100 rounded text-sm transition">
                    Comment
                </button>
            </div>

            <!-- Comments Section -->
            <div class="border-t pt-3 space-y-2">
                <!-- List of Comments -->
                <div class="space-y-2">
                    ${post.comments.map(c => `
                        <div class="bg-gray-50 p-2 rounded-lg text-xs flex flex-col">
                            <span class="font-bold text-gray-700">Alex Johnson</span>
                            <span class="text-gray-800 mt-0.5">${c.text}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Add Comment Form -->
                <form onsubmit="handleAddComment(${post.id}, event)" class="flex gap-2 mt-2">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." 
                           class="flex-1 bg-gray-100 px-3 py-1.5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <button type="submit" class="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-blue-700">Reply</button>
                </form>
            </div>
        </div>
    `).join('');
});

// Initialize app
fetchPosts();