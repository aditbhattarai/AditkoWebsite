document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    const contactForm = document.getElementById('contact-form');
    const skillProgress = document.querySelectorAll('.skill-progress');

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Update navbar shadow and background
        if (currentScroll > 100) {
            navbar.style.boxShadow = 'var(--shadow-md)';
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.boxShadow = 'var(--shadow-sm)';
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }

        // Hide navbar on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 100) {
            // Scrolling down & past threshold
            navbar.classList.add('hidden');
        } else {
            // Scrolling up or at top
            navbar.classList.remove('hidden');
        }

        lastScroll = currentScroll;

        highlightActiveSection();
    });

    function highlightActiveSection() {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);

                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 60;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.service-card, .project-card, .skill-category, .timeline-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBars = entry.target.querySelectorAll('.skill-progress');
                progressBars.forEach(bar => {
                    const width = bar.style.width;
                    bar.style.width = '0';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 100);
                });
                skillObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.skill-category').forEach(category => {
        skillObserver.observe(category);
    });

    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            const submitBtn = contactForm.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    submitBtn.textContent = 'Sent! ✓';
                    submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                    contactForm.reset();

                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        submitBtn.style.background = '';
                    }, 2000);
                } else {
                    throw new Error(result.message || 'Failed to send message');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                submitBtn.textContent = 'Error! Try again';
                submitBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                }, 2000);
            }
        });
    }

    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                const offsetTop = target.offsetTop - 60;

                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    const cursorFollower = document.createElement('div');
    cursorFollower.classList.add('cursor-follower');
    document.body.appendChild(cursorFollower);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;

        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;

        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
        cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px)`;

        requestAnimationFrame(animateCursor);
    }

    animateCursor();

    const interactiveElements = document.querySelectorAll('a, button, input, textarea');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform += ' scale(1.5)';
            cursorFollower.style.transform += ' scale(1.5)';
        });

        el.addEventListener('mouseleave', () => {
            cursor.style.transform = cursor.style.transform.replace(' scale(1.5)', '');
            cursorFollower.style.transform = cursorFollower.style.transform.replace(' scale(1.5)', '');
        });
    });

    console.log('Portfolio initialized successfully! 🚀');
});

// Load My Work section
async function loadMyWork() {
    const workGrid = document.getElementById('work-grid');
    if (!workGrid) return;

    try {
        const response = await fetch('/api/works?featured=true');
        const data = await response.json();

        if (data.success && data.works.length > 0) {
            // Show only first 6 works
            const displayWorks = data.works.slice(0, 6);

            workGrid.innerHTML = displayWorks.map(work => {
                const tags = work.tags ? work.tags.split(',').map(tag =>
                    `<span class="work-tag">${escapeHtml(tag.trim())}</span>`
                ).join('') : '';

                // Convert YouTube URL to embed
                let videoEmbed = '';
                if (work.video_url) {
                    const videoId = extractYouTubeID(work.video_url);
                    if (videoId) {
                        videoEmbed = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
                    }
                }

                // Use image or video
                const mediaContent = videoEmbed || (work.image_url ?
                    `<img src="${escapeHtml(work.image_url)}" alt="${escapeHtml(work.title)}">` :
                    '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 3rem;">🎬</div>');

                return `
                    <div class="work-card-item">
                        <div class="work-video">
                            ${mediaContent}
                        </div>
                        <div class="work-details">
                            <span class="work-category-badge">${escapeHtml(work.category)}</span>
                            <h3 class="work-title">${escapeHtml(work.title)}</h3>
                            ${work.description ? `<p class="work-description">${escapeHtml(work.description)}</p>` : ''}
                            ${tags ? `<div class="work-tags">${tags}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            workGrid.innerHTML = `
                <div class="empty-work">
                    <div class="empty-work-icon">🎬</div>
                    <h3>No works yet</h3>
                    <p>Upload your video editing projects to showcase them here!</p>
                    <a href="/upload-works.html" class="btn-view-all" style="margin-top: 1.5rem;">Upload Your First Work →</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading works:', error);
        workGrid.innerHTML = `
            <div class="empty-work">
                <p>Unable to load works. Make sure the server is running.</p>
            </div>
        `;
    }
}

// Extract YouTube video ID from URL
function extractYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Escape HTML helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load works when page loads
if (document.getElementById('work-grid')) {
    loadMyWork();
}

// Function to handle service card clicks
function contactForService(serviceName) {
    // Scroll to contact section
    const contactSection = document.getElementById('contact');
    const offsetTop = contactSection.offsetTop - 60;

    window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });

    // Select the appropriate option in the subject dropdown
    setTimeout(() => {
        const subjectField = document.getElementById('subject');
        if (subjectField) {
            // Set the value to match the option value
            subjectField.value = `Inquiry about ${serviceName}`;
            subjectField.focus();

            // Add a visual highlight effect
            subjectField.style.background = 'rgba(255, 255, 255, 0.2)';
            setTimeout(() => {
                subjectField.style.background = '';
            }, 1000);
        }
    }, 800);
}
