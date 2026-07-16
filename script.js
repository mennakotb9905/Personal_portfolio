document.addEventListener('DOMContentLoaded', () => {

    // --- Custom Cursor ---
    const cursor = document.getElementById('custom-cursor');
    const cursorDot = document.getElementById('custom-cursor-dot');
    let cursorX = 0, cursorY = 0;
    let targetX = 0, targetY = 0;

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        
        // Dot follows instantly
        cursorDot.style.left = `${targetX}px`;
        cursorDot.style.top = `${targetY}px`;
    });

    // Custom lagging trail animation for outer circle
    function animateCursor() {
        // Linear interpolation for smooth lag
        cursorX += (targetX - cursorX) * 0.15;
        cursorY += (targetY - cursorY) * 0.15;
        
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effect class toggle
    const hoverElements = document.querySelectorAll('a, button, .project-card, .stat-item, .social-icon, .award-card, .filter-btn, .form-input');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });

    // --- Spotlight Effect ---
    const mouseGlow = document.getElementById('mouse-glow');
    document.addEventListener('mousemove', (e) => {
        mouseGlow.style.left = `${e.clientX}px`;
        mouseGlow.style.top = `${e.clientY}px`;
    });

    // --- Theme Switching (Gold/Silver Accent) ---
    const themeSwitchBtn = document.getElementById('theme-switch-btn');
    const htmlElement = document.documentElement;

    // Load saved theme
    const savedTheme = localStorage.getItem('portfolio-accent') || 'gold';
    if (savedTheme === 'silver') {
        htmlElement.setAttribute('data-theme', 'silver');
    }

    themeSwitchBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        if (currentTheme === 'silver') {
            htmlElement.removeAttribute('data-theme');
            localStorage.setItem('portfolio-accent', 'gold');
        } else {
            htmlElement.setAttribute('data-theme', 'silver');
            localStorage.setItem('portfolio-accent', 'silver');
        }
    });

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });

    // --- Header Scroll State ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Typewriter Effect ---
    const typewriterElement = document.getElementById('typewriter');
    const words = [
        "Frontend React Developer", 
        "MERN Stack Developer", 
        "Programming Instructor", 
        "AI & IoT Enthusiast"
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50; // faster backspacing
        } else {
            typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100; // normal typing
        }

        if (!isDeleting && charIndex === currentWord.length) {
            typeSpeed = 2000; // pause at end of word
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500; // pause before typing next word
        }

        setTimeout(type, typeSpeed);
    }
    type();

    // --- Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Trigger stats counter animation if it's the about section
                if (entry.target.classList.contains('about-bio')) {
                    animateStats();
                }
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- Stats Counter Animation ---
    let statsAnimated = false;
    function animateStats() {
        if (statsAnimated) return;
        statsAnimated = true;

        const statNums = document.querySelectorAll('.stat-num');
        statNums.forEach(stat => {
            const targetVal = parseInt(stat.getAttribute('data-val'), 10);
            let currentVal = 0;
            const duration = 1500; // 1.5 seconds animation
            const stepTime = Math.max(Math.floor(duration / targetVal), 15);
            
            const timer = setInterval(() => {
                currentVal += Math.ceil(targetVal / 100) || 1;
                if (currentVal >= targetVal) {
                    currentVal = targetVal;
                    clearInterval(timer);
                }
                stat.textContent = `${currentVal}+`;
            }, stepTime);
        });
    }

    // --- 3D Tilt Card Effect ---
    const tiltCards = document.querySelectorAll('[data-tilt]');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt angles (max 10 degrees)
            const rotateX = ((centerY - y) / centerY) * 8;
            const rotateY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });


    // --- Contact Form Submission (Direct Email Client) ---
    const contactForm = document.getElementById('portfolio-contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect Form Data
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();

            if (!name || !email || !subject || !message) {
                formStatus.textContent = "Please fill in all fields.";
                formStatus.className = "form-status error";
                formStatus.style.display = 'block';
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = "Redirecting...";
            formStatus.style.display = 'none';

            try {
                // Construct the Gmail web compose URL pre-filling recipient, subject, and body details
                const recipientEmail = "mennakotb9905@gmail.com";
                const emailBody = `Hello Menna,\n\nYou have received a new message from your portfolio site:\n\nSender Name: ${name}\nSender Email: ${email}\n\nMessage:\n${message}`;
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
                
                // Open Gmail in a new tab (user-triggered click handler bypasses pop-up blockers)
                window.open(gmailUrl, '_blank');

                formStatus.textContent = `Thank you! Opening Gmail compose window. Please review and click "Send" in the new tab.`;
                formStatus.className = "form-status success";
                formStatus.style.display = 'block';
                contactForm.reset();
            } catch (error) {
                formStatus.textContent = "Oops! There was a problem opening Gmail.";
                formStatus.className = "form-status error";
                formStatus.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                
                // Hide status after 8 seconds to give the user enough time to read it
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 8000);
            }
        });
    }

});
