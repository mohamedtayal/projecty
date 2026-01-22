// ========================================
// Mohamed Tayel Portfolio - Main JavaScript
// ========================================

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-out',
  once: true,
  offset: 100
});

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
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

// Counter Animation
const counters = document.querySelectorAll('.counter');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counter = entry.target;
      const target = parseInt(counter.getAttribute('data-target'));
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;
      
      const updateCounter = () => {
        current += step;
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target + '+';
        }
      };
      
      updateCounter();
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

// Portfolio Filter
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const filter = btn.getAttribute('data-filter');
    
    portfolioItems.forEach(item => {
      const category = item.getAttribute('data-category');
      
      if (filter === 'all' || category === filter) {
        item.style.display = 'block';
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, 10);
      } else {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
          item.style.display = 'none';
        }, 300);
      }
    });
  });
});

// Contact Form
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

// API Base URL - Check if backend is available
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:3000/api' : null;

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    submitBtn.disabled = true;
    
    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    
    try {
      // If running locally with backend
      if (API_URL) {
        const response = await fetch(`${API_URL}/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          contactForm.style.display = 'none';
          formSuccess.style.display = 'block';
        } else {
          alert(result.error || 'حدث خطأ أثناء الإرسال');
        }
      } else {
        // Demo mode - save to localStorage (for GitHub Pages)
        const requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
        requests.push({
          ...data,
          id: Date.now(),
          status: 'NEW',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('contactRequests', JSON.stringify(requests));
        
        // Show success
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';
      }
    } catch (error) {
      console.error('Contact form error:', error);
      
      // Fallback to localStorage if API fails
      const requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
      requests.push({
        ...data,
        id: Date.now(),
        status: 'NEW',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('contactRequests', JSON.stringify(requests));
      
      // Show success anyway
      contactForm.style.display = 'none';
      formSuccess.style.display = 'block';
    }
    
    // Reset button
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

// Particles Background (Simple)
function createParticles() {
  const particles = document.getElementById('particles');
  if (!particles) return;
  
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 5 + 2}px;
      height: ${Math.random() * 5 + 2}px;
      background: rgba(99, 102, 241, ${Math.random() * 0.5});
      border-radius: 50%;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
    `;
    particles.appendChild(particle);
  }
}

// Add particle animation
const style = document.createElement('style');
style.textContent = `
  @keyframes floatParticle {
    0%, 100% {
      transform: translateY(0) translateX(0);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

createParticles();

// Console Welcome Message
console.log('%c مرحباً! 👋', 'font-size: 24px; font-weight: bold; color: #6366f1;');
console.log('%c هذا الموقع من تطوير محمد طايل', 'font-size: 14px; color: #94a3b8;');
console.log('%c AI & Full Stack Developer', 'font-size: 12px; color: #8b5cf6;');
