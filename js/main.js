// ========================================
// Mohamed Tayal Portfolio - Enhanced JavaScript
// ========================================

// Initialize AOS with improved settings
AOS.init({
  duration: 900,
  easing: 'ease-out-cubic',
  once: true,
  offset: 80,
  delay: 100,
  anchorPlacement: 'top-bottom'
});

// Navbar Scroll Effect with smooth transitions
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;

  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});

// Magnetic effect for buttons
document.querySelectorAll('.btn-primary, .btn-outline-light').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const navHeight = navbar.offsetHeight;
      const targetPosition = target.offsetTop - navHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
    // Close mobile menu
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse.classList.contains('show')) {
      navbarCollapse.classList.remove('show');
    }
  });
});

// Active Navigation Link
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollY = window.pageYOffset;
  sections.forEach(section => {
    const sectionHeight = section.offsetHeight;
    const sectionTop = section.offsetTop - 100;
    const sectionId = section.getAttribute('id');
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

    if (navLink) {
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLink.classList.add('active');
      } else {
        navLink.classList.remove('active');
      }
    }
  });
});

// Counter Animation with enhanced easing
const counters = document.querySelectorAll('.counter');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counter = entry.target;
      const target = parseInt(counter.getAttribute('data-target'));
      const duration = 2500;
      const startTime = performance.now();

      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const current = Math.floor(easedProgress * target);

        counter.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target + '+';
        }
      };

      requestAnimationFrame(updateCounter);
      counterObserver.unobserve(counter);
    }
  });
}, { threshold: 0.5 });

counters.forEach(counter => counterObserver.observe(counter));


// Skill Bars Animation
const skillBars = document.querySelectorAll('.skill-progress');
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.width = entry.target.style.width;
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

skillBars.forEach(bar => {
  const width = bar.style.width;
  bar.style.width = '0';
  skillObserver.observe(bar);
  setTimeout(() => {
    bar.style.width = width;
  }, 500);
});

// Portfolio Filter with smooth animations
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button with ripple effect
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');

    portfolioItems.forEach((item, index) => {
      const category = item.getAttribute('data-category');

      if (filter === 'all' || category === filter) {
        item.style.display = 'block';
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0) scale(1)';
        }, index * 50);
      } else {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px) scale(0.95)';
        setTimeout(() => {
          item.style.display = 'none';
        }, 300);
      }
    });
  });
});

// Contact Form — posts to /api/contact (Vercel Serverless)
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    const formData = new FormData(contactForm);
    const getValue = (key) => {
      const value = formData.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };

    const payload = {
      name: getValue('name'),
      email: getValue('email'),
      phone: getValue('phone'),
      company: getValue('company'),
      subject: getValue('subject') || 'General inquiry',
      budget: getValue('budget'),
      message: getValue('message'),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (formSuccess) {
          contactForm.style.display = 'none';
          formSuccess.style.display = 'block';
        }
        contactForm.reset();
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to send';
      submitBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      submitBtn.style.borderColor = '#dc2626';
      submitBtn.disabled = false;
      setTimeout(function () {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.style.borderColor = '';
      }, 3000);
      return;
    }

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });
}

// Reset Form Function
function resetForm() {
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  contactForm.reset();
  contactForm.style.display = 'block';
  formSuccess.style.display = 'none';
}

// Back to Top Button
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTop.classList.add('show');
  } else {
    backToTop.classList.remove('show');
  }
});

// Typing Effect (Optional)
const typingText = document.querySelector('.typing-text');
if (typingText) {
  const texts = ['AI Developer', 'Full Stack Developer', 'Data Scientist'];
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentText = texts[textIndex];

    if (isDeleting) {
      typingText.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingText.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    if (!isDeleting && charIndex === currentText.length) {
      setTimeout(() => isDeleting = true, 2000);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
    }

    const speed = isDeleting ? 50 : 100;
    setTimeout(type, speed);
  }

  type();
}

// Particles Background (Enhanced)
function createParticles() {
  const particles = document.getElementById('particles');
  if (!particles) return;

  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 2;
    particle.className = 'particle';
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${Math.random() > 0.5 ? 'rgba(99, 102, 241, ' : 'rgba(139, 92, 246, '}${Math.random() * 0.5 + 0.1});
      border-radius: 50%;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      animation: floatParticle ${Math.random() * 15 + 10}s linear infinite;
      animation-delay: ${Math.random() * 5}s;
      filter: blur(${Math.random() > 0.5 ? 1 : 0}px);
    `;
    particles.appendChild(particle);
  }
}

// Add particle animation
const style = document.createElement('style');
style.textContent = `
  @keyframes floatParticle {
    0%, 100% {
      transform: translateY(0) translateX(0) scale(1);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 0.5;
    }
    100% {
      transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px) scale(0.5);
      opacity: 0;
    }
  }
  
  /* Smooth hover effects */
  .portfolio-card, .service-card, .skill-category, .contact-card {
    will-change: transform;
  }
  
  /* Text reveal animation */
  @keyframes textReveal {
    from { 
      opacity: 0;
      transform: translateY(30px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Glow pulse for hero */
  @keyframes glowPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }
`;
document.head.appendChild(style);

createParticles();

// Smooth reveal for text elements
document.querySelectorAll('.hero-title, .hero-subtitle, .section-title').forEach((el, i) => {
  el.style.animation = `textReveal 0.8s ease ${i * 0.1}s forwards`;
  el.style.opacity = '0';
});

// Interactive hover effect for service cards
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// Parallax effect for floating icons
document.addEventListener('mousemove', (e) => {
  const floatIcons = document.querySelectorAll('.float-icon');
  const mouseX = e.clientX / window.innerWidth - 0.5;
  const mouseY = e.clientY / window.innerHeight - 0.5;

  floatIcons.forEach((icon, i) => {
    const speed = (i + 1) * 10;
    const x = mouseX * speed;
    const y = mouseY * speed;
    icon.style.transform = `translate(${x}px, ${y}px)`;
  });
});

// Console Welcome Message
console.log('%c مرحباً! 👋', 'font-size: 24px; font-weight: bold; color: #6366f1;');
console.log('%c هذا الموقع من تطوير محمد طايل', 'font-size: 14px; color: #94a3b8;');
console.log('%c AI & Full Stack Developer', 'font-size: 12px; color: #8b5cf6;');

// ========== Dark/Light Mode Toggle ==========
const themeToggle = document.getElementById('normal');
const body = document.body;

// Check for saved theme preference or default to dark
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  body.classList.add('light-mode');
  themeToggle.checked = true;
}

// Toggle theme on switch change
themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    body.classList.add('light-mode');
    localStorage.setItem('theme', 'light');
  } else {
    body.classList.remove('light-mode');
    localStorage.setItem('theme', 'dark');
  }
});

// ========== 3D Rubik's Cube - Mouse Interaction ==========
const rubiksCube = document.querySelector('.rubiks-cube');

if (rubiksCube) {
  let isHovering = false;

  rubiksCube.parentElement.addEventListener('mouseenter', () => {
    isHovering = true;
    rubiksCube.style.animationPlayState = 'paused';
  });

  rubiksCube.parentElement.addEventListener('mouseleave', () => {
    isHovering = false;
    rubiksCube.style.animationPlayState = 'running';
  });

  rubiksCube.parentElement.addEventListener('mousemove', (e) => {
    if (!isHovering) return;

    const rect = rubiksCube.parentElement.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

    const rotateX = -25 + y * 30;
    const rotateY = -40 + x * 60;

    rubiksCube.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
}

// ========== Hero Typing Animation ==========
// Clean, production-ready letter-by-letter typing effect
(function initTypingAnimation() {
  'use strict';

  // ===== CONFIGURATION =====
  const CONFIG = {
    text: 'Mohamed Tayal',  // Text to type (easily changeable)
    speed: 85,              // Milliseconds per character
    startDelay: 800,        // Delay before typing starts
    cursorHideDelay: 2000   // Delay before cursor fades out
  };

  // ===== DOM ELEMENTS =====
  const nameElement = document.getElementById('typingName');
  const cursorElement = document.getElementById('typingCursor');

  if (!nameElement) return;

  // ===== REDUCED MOTION CHECK =====
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Show text instantly without animation
    nameElement.textContent = CONFIG.text;
    nameElement.classList.add('typing-complete');
    if (cursorElement) cursorElement.style.display = 'none';
    return;
  }

  // ===== TYPING ENGINE =====
  let charIndex = 0;
  let typingInterval = null;

  function typeNextChar() {
    if (charIndex < CONFIG.text.length) {
      // Append next character
      nameElement.textContent = CONFIG.text.substring(0, charIndex + 1);
      charIndex++;
    } else {
      // Typing complete
      clearInterval(typingInterval);
      nameElement.classList.add('typing-complete');

      // Fade out cursor after delay
      if (cursorElement) {
        setTimeout(() => {
          cursorElement.classList.add('cursor-hidden');
        }, CONFIG.cursorHideDelay);
      }
    }
  }

  function startTyping() {
    // Ensure element is empty before starting
    nameElement.textContent = '';
    charIndex = 0;

    // Start typing interval
    typingInterval = setInterval(typeNextChar, CONFIG.speed);
  }

  // ===== INITIALIZATION =====
  function init() {
    // Start typing after initial delay
    setTimeout(startTyping, CONFIG.startDelay);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ========== Interactive 3D Logo ==========
(function init3DLogo() {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const container = document.getElementById('logo3dContainer');
  const figure = document.getElementById('logo3dFigure');
  const laptop = document.getElementById('logo3dLaptop');

  if (!container || !figure) return;

  // Configuration
  const config = {
    maxRotationX: 15,  // Max vertical rotation in degrees
    maxRotationY: 20,  // Max horizontal rotation in degrees
    laptopExtra: 5,    // Extra rotation for laptop parallax
    smoothing: 0.12,   // Smoothing factor for animation
    resetDelay: 100    // Delay before resetting position
  };

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let isHovering = false;
  let animationId = null;
  let resetTimeout = null;

  // Smooth animation loop
  function animate() {
    // Interpolate towards target
    currentX += (targetX - currentX) * config.smoothing;
    currentY += (targetY - currentY) * config.smoothing;

    // Apply transforms
    figure.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`;

    if (laptop) {
      // Laptop has extra subtle movement
      const laptopX = currentX * 0.7;
      const laptopY = currentY * 1.2;
      laptop.style.transform = `translateX(-50%) translateZ(30px) rotateX(${laptopX * 0.3}deg) rotateY(${laptopY * 0.2}deg)`;
    }

    // Continue animation if values are still changing
    if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01 || isHovering) {
      animationId = requestAnimationFrame(animate);
    }
  }

  // Mouse move handler
  function handleMouseMove(e) {
    const rect = container.getBoundingClientRect();

    // Calculate mouse position relative to center (-1 to 1)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = (e.clientX - centerX) / (rect.width / 2);
    const mouseY = (e.clientY - centerY) / (rect.height / 2);

    // Clamp values
    const clampedX = Math.max(-1, Math.min(1, mouseX));
    const clampedY = Math.max(-1, Math.min(1, mouseY));

    // Set target rotations (inverted for natural feel)
    targetY = clampedX * config.maxRotationY;
    targetX = -clampedY * config.maxRotationX;
  }

  // Mouse enter handler
  function handleMouseEnter() {
    isHovering = true;
    if (resetTimeout) {
      clearTimeout(resetTimeout);
      resetTimeout = null;
    }
    // Start animation loop
    if (!animationId) {
      animationId = requestAnimationFrame(animate);
    }
  }

  // Mouse leave handler
  function handleMouseLeave() {
    isHovering = false;

    // Reset to center with delay
    resetTimeout = setTimeout(() => {
      targetX = 0;
      targetY = 0;
      if (!animationId) {
        animationId = requestAnimationFrame(animate);
      }
    }, config.resetDelay);
  }

  // Attach event listeners
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseenter', handleMouseEnter);
  container.addEventListener('mouseleave', handleMouseLeave);

  // Touch support for mobile
  container.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }, { passive: true });

  container.addEventListener('touchstart', handleMouseEnter, { passive: true });
  container.addEventListener('touchend', handleMouseLeave, { passive: true });

})();




// ========== Accessible Mobile Navigation ==========
// ESC to close, aria-expanded sync, icon swap, click-outside-to-close
(function initAccessibleMobileNav() {
  'use strict';

  const navToggler = document.getElementById('navToggler');
  const navTogglerIcon = document.getElementById('navTogglerIcon');
  const navbarCollapseEl = document.getElementById('navbarNav');

  if (!navToggler || !navbarCollapseEl) return;

  // Sync aria-expanded when Bootstrap toggles the menu
  const observer = new MutationObserver(() => {
    const isOpen = navbarCollapseEl.classList.contains('show');
    navToggler.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    // Swap hamburger icon to close icon
    if (navTogglerIcon) {
      navTogglerIcon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    }
  });

  observer.observe(navbarCollapseEl, {
    attributes: true,
    attributeFilter: ['class']
  });

  // ESC key closes the mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbarCollapseEl.classList.contains('show')) {
      navbarCollapseEl.classList.remove('show');
      navToggler.setAttribute('aria-expanded', 'false');
      navToggler.focus();
    }
  });

  // Click outside the nav to close
  document.addEventListener('click', (e) => {
    if (
      navbarCollapseEl.classList.contains('show') &&
      !navbarCollapseEl.contains(e.target) &&
      !navToggler.contains(e.target)
    ) {
      navbarCollapseEl.classList.remove('show');
      navToggler.setAttribute('aria-expanded', 'false');
    }
  });
})();
