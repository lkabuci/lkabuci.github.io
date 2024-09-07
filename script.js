let activeFilters = new Set();
let blogPosts = [];

async function fetchBlogPosts() {
    const response = await fetch('/posts/index.json');
    const postList = await response.json();
    
    for (const postFile of postList) {
        const postResponse = await fetch(`/posts/${postFile}`);
        const postContent = await postResponse.text();
        const postData = parseMarkdown(postContent);
        blogPosts.push(postData);
    }
    
    generateBlogPosts();
    setupEventListeners();
    handleInitialURL();
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
            <h2><a href="/${post.id}">${post.title}</a></h2>
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
            const tabName = link.dataset.tab;
            history.pushState(null, '', tabName === 'home' ? '/' : `/${tabName}`);
            showTab(tabName);
        });
    });

    document.querySelectorAll('.post h2 a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = link.getAttribute('href').substring(1);
            history.pushState(null, '', `/${postId}`);
            loadFullPost(postId);
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

    if (tabName === 'about') {
        fetch('about.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('about').innerHTML = data;
            });
    }
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
                <a href="/" class="back-link">Back to posts</a>
            </article>
        `;
        document.querySelector('.back-link').addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '/');
            generateBlogPosts();
            setupEventListeners();
        });
    }
}

function handleInitialURL() {
    const path = window.location.pathname.substring(1);
    if (path === '' || path === 'index.html') {
        showTab('home');
    } else if (path === 'about') {
        showTab('about');
    } else {
        loadFullPost(path);
    }
}

window.addEventListener('popstate', handleInitialURL);

// Initialize the blog
document.addEventListener('DOMContentLoaded', fetchBlogPosts);
