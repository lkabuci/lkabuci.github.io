let activeFilters = new Set();
let blogPosts = [];

async function fetchBlogPosts() {
    const response = await fetch('posts/index.json');
    const postList = await response.json();
    
    for (const postFile of postList) {
        const postResponse = await fetch(`posts/${postFile}`);
        const postContent = await postResponse.text();
        const postData = parseMarkdown(postContent);
        blogPosts.push(postData);
    }
    
    generateBlogPosts();
    setupEventListeners();
}

function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const title = lines[0].replace('# ', '');
    const id = title.toLowerCase().replace(/\s+/g, '-');
    let date = '';
    let summary = '';
    let tags = [];
    let content = '';
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].startsWith('Date: ')) {
            date = lines[i].replace('Date: ', '');
        } else if (lines[i].startsWith('Summary: ')) {
            summary = lines[i].replace('Summary: ', '');
        } else if (lines[i].startsWith('Tags: ')) {
            tags = lines[i].replace('Tags: ', '').split(', ');
        } else {
            content += lines[i] + '\n';
        }
    }
    
    return { id, title, date, summary, tags, content };
}

function generateBlogPosts() {
    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = blogPosts.map(post => `
        <article class="post">
            <h2><a href="#" onclick="loadFullPost('${post.id}'); return false;">${post.title}</a></h2>
            <p class="date">${post.date}</p>
            <p>${post.summary}</p>
            <div class="tags">
                ${post.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}
            </div>
        </article>
    `).join('');
}

function setupEventListeners() {
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => filterByTag(tag.dataset.tag));
    });

    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showTab(link.dataset.tab);
        });
    });
}

function filterByTag(tag) {
    if (activeFilters.has(tag)) {
        activeFilters.delete(tag);
    } else {
        activeFilters.add(tag);
    }
    updateActiveFilters();
    applyFilters();
}

function updateActiveFilters() {
    const activeFiltersElement = document.getElementById('active-filters');
    activeFiltersElement.innerHTML = Array.from(activeFilters).map(tag => 
        `<span class="active-filter">${tag} <span class="close" data-tag="${tag}">&times;</span></span>`
    ).join('');

    activeFiltersElement.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => removeFilter(closeBtn.dataset.tag));
    });
}

function removeFilter(tag) {
    activeFilters.delete(tag);
    updateActiveFilters();
    applyFilters();
}

function applyFilters() {
    document.querySelectorAll('.post').forEach(post => {
        const postTags = Array.from(post.querySelectorAll('.tag')).map(tag => tag.textContent);
        const showPost = activeFilters.size === 0 || postTags.some(tag => activeFilters.has(tag));
        post.style.display = showPost ? 'block' : 'none';
    });
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    document.getElementById(tabName).style.display = 'block';
    
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('active', link.dataset.tab === tabName);
    });
}

function loadFullPost(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
        const content = marked(post.content);
        const postContainer = document.getElementById('posts');
        postContainer.innerHTML = `
            <article class="full-post">
                <h1>${post.title}</h1>
                <p class="date">${post.date}</p>
                ${content}
            </article>
        `;
    }
}

function generateBlogPosts() {
    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = blogPosts.map(post => `
        <article class="post">
            <h2><a href="/${post.id}" onclick="navigateToPost(event, '${post.id}');">${post.title}</a></h2>
            <p class="date">${post.date}</p>
            <p>${post.summary}</p>
            <div class="tags">
                ${post.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}
            </div>
        </article>
    `).join('');
}

function navigateToPost(event, postId) {
    event.preventDefault();
    history.pushState(null, '', `/${postId}`);
    loadFullPost(postId);
}

// load the content of about.html
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('nav a');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            event.preventDefault();
            const targetTab = this.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            tabContents.forEach(content => {
                content.style.display = content.id === targetTab ? 'block' : 'none';
            });

            if (targetTab === 'about') {
                fetch('about.html')
                    .then(response => response.text())
                    .then(data => {
                        document.getElementById('about').innerHTML = data;
                    });
            }
        });
    });
});

// Initialize the blog
document.addEventListener('DOMContentLoaded', fetchBlogPosts);

window.addEventListener('popstate', () => {
    const postId = location.pathname.substring(1);
    if (postId) {
        loadFullPost(postId);
    }
});
