document.addEventListener('DOMContentLoaded', function() {
    console.log('Richfield Connect - Application Initialized');
    initializePageFeatures();
});

function initializePageFeatures() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('signup.html') || currentPage.endsWith('/')) {
        if (document.getElementById('signupForm')) {
            initializeSignUpPage();
        }
    }
    
    if (currentPage.includes('profile.html')) {
        initializeProfilePage();
    }
    
    if (currentPage.includes('feed.html')) {
        initializeFeedPage();
    }
}

function initializeSignUpPage() {
    console.log('Initializing Sign-Up Page');
    const form = document.getElementById('signupForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSignUpSubmit();
    });
}

function initializeProfilePage() {
    console.log('Initializing Profile Page');
    loadProfileData();
    initializeSectionToggles();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
}

function initializeFeedPage() {
    console.log('Initializing Feed Page');
    
    if (!isUserLoggedIn()) {
        showNoFeedContent();
        return;
    }
    
    showFeedContent();
    loadUserPosts();
    
    const postBtn = document.getElementById('postBtn');
    if (postBtn) {
        postBtn.addEventListener('click', handleCreatePost);
    }
    
    const postContent = document.getElementById('postContent');
    if (postContent) {
        postContent.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreatePost();
            }
        });
    }
}

function handleSignUpSubmit() {
    console.log('Handling Sign-Up Submission');
    
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        studentNumber: document.getElementById('studentNumber').value.trim(),
        campus: document.getElementById('campus').value,
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        interests: document.getElementById('interests').value.trim(),
        bio: document.getElementById('bio').value.trim()
    };
    
    if (!validateSignUpForm(formData)) {
        return;
    }
    
    const userData = {
        fullName: formData.fullName,
        studentNumber: formData.studentNumber,
        campus: formData.campus,
        email: formData.email,
        password: formData.password,
        interests: formData.interests.split(',').map(i => i.trim()),
        bio: formData.bio,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('richfieldUser', JSON.stringify(userData));
    console.log('User data saved to localStorage');
    
    alert('Account created successfully! Redirecting to your profile...');
    window.location.href = 'profile.html';
}

function isUserLoggedIn() {
    return localStorage.getItem('richfieldUser') !== null;
}

function getCurrentUser() {
    const userData = localStorage.getItem('richfieldUser');
    return userData ? JSON.parse(userData) : null;
}

function loadProfileData() {
    const user = getCurrentUser();
    
    if (!user) {
        const profileContent = document.getElementById('profileContent');
        const noProfileContent = document.getElementById('noProfileContent');
        if (profileContent) profileContent.style.display = 'none';
        if (noProfileContent) noProfileContent.style.display = 'block';
        return;
    }
    
    const profileContent = document.getElementById('profileContent');
    const noProfileContent = document.getElementById('noProfileContent');
    if (profileContent) profileContent.style.display = 'block';
    if (noProfileContent) noProfileContent.style.display = 'none';
    
    document.getElementById('profileName').textContent = user.fullName;
    document.getElementById('profileFullName').textContent = user.fullName;
    document.getElementById('profileStudentNumber').textContent = user.studentNumber;
    document.getElementById('profileCampus').textContent = user.campus;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileBio').textContent = user.bio || 'No bio provided';
    
    const interestsContainer = document.getElementById('profileInterests');
    if (interestsContainer) {
        interestsContainer.innerHTML = '';
        if (user.interests && user.interests.length > 0) {
            user.interests.forEach(interest => {
                const tag = document.createElement('span');
                tag.className = 'interest-tag';
                tag.textContent = interest;
                interestsContainer.appendChild(tag);
            });
        } else {
            interestsContainer.innerHTML = '<span class="interest-tag">No interests added</span>';
        }
    }
}

function initializeSectionToggles() {
    $('.section-toggle').on('click', function() {
        const $section = $(this).next('.section-content');
        $section.slideToggle(300);
        $section.toggleClass('active');
        $(this).toggleClass('expanded');
    });
    
    $('.section-toggle').first().next('.section-content').slideDown(300);
    $('.section-toggle').first().addClass('expanded');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('richfieldUser');
        localStorage.removeItem('userPosts');
        alert('Logged out successfully');
        window.location.href = 'index.html';
    }
}

function handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        if (confirm('This will permanently delete all your data. Continue?')) {
            localStorage.removeItem('richfieldUser');
            localStorage.removeItem('userPosts');
            alert('Account deleted successfully');
            window.location.href = 'index.html';
        }
    }
}

function showFeedContent() {
    const feedContent = document.getElementById('feedContent');
    const noFeedContent = document.getElementById('noFeedContent');
    if (feedContent) feedContent.style.display = 'block';
    if (noFeedContent) noFeedContent.style.display = 'none';
}

function showNoFeedContent() {
    const feedContent = document.getElementById('feedContent');
    const noFeedContent = document.getElementById('noFeedContent');
    if (feedContent) feedContent.style.display = 'none';
    if (noFeedContent) noFeedContent.style.display = 'block';
}

function loadUserPosts() {
    const user = getCurrentUser();
    if (!user) return;
    
    const postsData = localStorage.getItem('userPosts');
    const userPosts = postsData ? JSON.parse(postsData) : [];
    
    const currentUserPosts = userPosts.filter(post => post.userId === user.email);
    
    const feedPosts = document.getElementById('feedPosts');
    if (!feedPosts) return;
    
    feedPosts.innerHTML = '';
    
    if (currentUserPosts.length === 0) {
        feedPosts.innerHTML = '<div class="empty-feed"><p>No posts yet. Be the first to share!</p></div>';
        return;
    }
    
    currentUserPosts.reverse().forEach(post => {
        const postElement = createPostElement(post);
        feedPosts.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post fade-in';
    postDiv.setAttribute('data-post-id', post.id);
    
    const postDate = new Date(post.timestamp);
    const formattedDate = postDate.toLocaleString();
    
    const user = getCurrentUser();
    
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-author-info">
                <div class="post-author-avatar">${user.fullName.charAt(0).toUpperCase()}</div>
                <div>
                    <h3 class="post-author-details">${user.fullName}</h3>
                    <p class="post-timestamp">${formattedDate}</p>
                </div>
            </div>
            <div class="post-actions">
                <button class="post-delete" title="Delete post">Delete</button>
            </div>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-footer">
            <div class="post-action like-action" data-likes="${post.likes || 0}">
                <button class="like-button ${post.liked ? 'liked' : ''}">${post.liked ? 'LIKED' : 'LIKE'}</button>
                <span class="like-count">${post.likes || 0}</span>
            </div>
        </div>
    `;
    
    postDiv.querySelector('.post-delete').addEventListener('click', function() {
        deletePost(post.id);
    });
    
    postDiv.querySelector('.like-button').addEventListener('click', function() {
        toggleLike(post.id, postDiv);
    });
    
    return postDiv;
}

function handleCreatePost() {
    const postContent = document.getElementById('postContent');
    if (!postContent) return;
    
    const content = postContent.value.trim();
    
    if (content === '') {
        alert('Please write something before posting!');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in first');
        return;
    }
    
    const post = {
        id: Date.now(),
        userId: user.email,
        content: content,
        timestamp: new Date().toISOString(),
        likes: 0,
        liked: false
    };
    
    const postsData = localStorage.getItem('userPosts');
    const allPosts = postsData ? JSON.parse(postsData) : [];
    
    allPosts.push(post);
    
    localStorage.setItem('userPosts', JSON.stringify(allPosts));
    console.log('Post created:', post);
    
    postContent.value = '';
    
    loadUserPosts();
}

function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    const postsData = localStorage.getItem('userPosts');
    let allPosts = postsData ? JSON.parse(postsData) : [];
    
    allPosts = allPosts.filter(post => post.id !== postId);
    
    localStorage.setItem('userPosts', JSON.stringify(allPosts));
    console.log('Post deleted:', postId);
    
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
        $(postElement).fadeOut(300, function() {
            $(this).remove();
            
            const feedPosts = document.getElementById('feedPosts');
            if (feedPosts && feedPosts.children.length === 0) {
                feedPosts.innerHTML = '<div class="empty-feed"><p>No posts yet. Be the first to share!</p></div>';
            }
        });
    }
}

function toggleLike(postId, postElement) {
    const postsData = localStorage.getItem('userPosts');
    let allPosts = postsData ? JSON.parse(postsData) : [];
    
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    
    post.liked = !post.liked;
    post.likes = post.liked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);
    
    localStorage.setItem('userPosts', JSON.stringify(allPosts));
    
    const likeButton = postElement.querySelector('.like-button');
    const likeCount = postElement.querySelector('.like-count');
    
    $(likeButton).toggleClass('liked');
    
    likeButton.textContent = post.liked ? 'LIKED' : 'LIKE';
    likeCount.textContent = post.likes;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

window.handleSignUpSubmit = handleSignUpSubmit;
window.handleCreatePost = handleCreatePost;
window.isUserLoggedIn = isUserLoggedIn;
window.getCurrentUser = getCurrentUser;
