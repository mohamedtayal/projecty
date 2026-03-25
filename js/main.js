// Mohamed Tayal Portfolio - streamlined frontend behaviors
(function () {
  'use strict';

  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');
  const themeToggle = document.getElementById('normal');
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const formFeedback = document.getElementById('formFeedback');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.AOS) {
    window.AOS.init({
      duration: 900,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
      delay: 80,
      anchorPlacement: 'top-bottom'
    });
  }

  function closeMobileMenu() {
    const navbarCollapse = document.getElementById('navbarNav');
    const navToggler = document.getElementById('navToggler');
    if (!navbarCollapse || !navbarCollapse.classList.contains('show')) {
      return;
    }

    if (window.bootstrap && window.bootstrap.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(navbarCollapse).hide();
    } else {
      navbarCollapse.classList.remove('show');
      if (navToggler) {
        navToggler.setAttribute('aria-expanded', 'false');
      }
    }
  }

  function updateNavbarState() {
    if (!navbar) {
      return;
    }

    const isScrolled = window.scrollY > 50;
    navbar.classList.toggle('scrolled', isScrolled);

    if (backToTop) {
      backToTop.classList.toggle('show', window.scrollY > 500);
    }

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    let activeId = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - (navbar.offsetHeight + 120);
      const sectionBottom = sectionTop + section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
        activeId = section.id;
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
    });
  }

  window.addEventListener('scroll', updateNavbarState, { passive: true });
  updateNavbarState();

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const targetSelector = anchor.getAttribute('href');
    if (!targetSelector || targetSelector === '#') {
      return;
    }

    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(targetSelector);
      if (!target) {
        return;
      }

      event.preventDefault();
      const navHeight = navbar ? navbar.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;

      window.scrollTo({
        top: Math.max(targetPosition, 0),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      closeMobileMenu();
    });
  });

  if (!prefersReducedMotion) {
    document.querySelectorAll('.btn-primary, .btn-outline-light, .btn-hero-primary, .btn-hero-secondary').forEach((btn) => {
      btn.addEventListener('mousemove', (event) => {
        const rect = btn.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${offsetX * 0.08}px, ${offsetY * 0.08}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  const counters = document.querySelectorAll('.counter');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const counter = entry.target;
        const target = Number.parseInt(counter.getAttribute('data-target') || '0', 10);
        const duration = 2200;
        const startTime = performance.now();

        function step(currentTime) {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          counter.textContent = progress < 1 ? String(Math.floor(target * eased)) : `${target}+`;

          if (progress < 1) {
            requestAnimationFrame(step);
          }
        }

        requestAnimationFrame(step);
        observer.unobserve(counter);
      });
    }, { threshold: 0.45 });

    counters.forEach((counter) => counterObserver.observe(counter));
  }

  const skillBars = document.querySelectorAll('.skill-progress');
  if (skillBars.length) {
    const skillObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const bar = entry.target;
        const finalWidth = bar.getAttribute('data-width') || bar.style.width;
        bar.style.width = finalWidth;
        observer.unobserve(bar);
      });
    }, { threshold: 0.35 });

    skillBars.forEach((bar) => {
      bar.setAttribute('data-width', bar.style.width);
      bar.style.width = '0';
      skillObserver.observe(bar);
    });
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      filterButtons.forEach((item) => item.classList.toggle('active', item === button));

      portfolioItems.forEach((item) => {
        const category = item.getAttribute('data-category');
        const shouldShow = filter === 'all' || category === filter;
        item.style.display = shouldShow ? 'block' : 'none';
        item.style.opacity = shouldShow ? '1' : '0';
        item.style.transform = shouldShow ? 'translateY(0)' : 'translateY(12px)';
      });
    });
  });

  function setFormFeedback(message, tone) {
    if (!formFeedback) {
      return;
    }

    if (!message) {
      formFeedback.hidden = true;
      formFeedback.textContent = '';
      formFeedback.style.color = '';
      return;
    }

    formFeedback.hidden = false;
    formFeedback.textContent = message;
    formFeedback.style.color = tone === 'success' ? '#86efac' : '#fca5a5';
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFormFeedback('', 'error');

      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalHtml = submitButton ? submitButton.innerHTML : '';

      if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
      }

      const formData = new FormData(contactForm);
      const payload = {
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        company: String(formData.get('company') || '').trim(),
        subject: String(formData.get('subject') || '').trim() || 'General inquiry',
        budget: String(formData.get('budget') || '').trim(),
        message: String(formData.get('message') || '').trim()
      };

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Message could not be sent right now.');
        }

        contactForm.reset();
        contactForm.style.display = 'none';
        if (formSuccess) {
          formSuccess.style.display = 'block';
        }
      } catch (error) {
        console.error('Contact form error:', error);
        setFormFeedback('Message could not be sent right now. You can email me directly at mota200615@gmail.com.', 'error');
      } finally {
        if (submitButton) {
          submitButton.innerHTML = originalHtml;
          submitButton.disabled = false;
          submitButton.removeAttribute('aria-busy');
        }
      }
    });
  }

  window.resetForm = function resetForm() {
    if (!contactForm) {
      return;
    }

    contactForm.reset();
    contactForm.style.display = 'block';
    setFormFeedback('', 'error');
    if (formSuccess) {
      formSuccess.style.display = 'none';
    }
  };

  const savedTheme = window.localStorage.getItem('theme');
  if (themeToggle) {
    const isLightMode = savedTheme === 'light';
    document.body.classList.toggle('light-mode', isLightMode);
    themeToggle.checked = isLightMode;

    themeToggle.addEventListener('change', () => {
      const lightModeEnabled = themeToggle.checked;
      document.body.classList.toggle('light-mode', lightModeEnabled);
      window.localStorage.setItem('theme', lightModeEnabled ? 'light' : 'dark');
    });
  }

  (function init3DLogo() {
    if (prefersReducedMotion) {
      return;
    }

    const container = document.getElementById('logo3dContainer');
    const figure = document.getElementById('logo3dFigure');
    const laptop = document.getElementById('logo3dLaptop');

    if (!container || !figure) {
      return;
    }

    const config = {
      maxRotationX: 15,
      maxRotationY: 20,
      smoothing: 0.12
    };

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let isAnimating = false;

    function render() {
      currentX += (targetX - currentX) * config.smoothing;
      currentY += (targetY - currentY) * config.smoothing;

      figure.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`;

      if (laptop) {
        laptop.style.transform =
          `translateX(-50%) translateZ(30px) rotateX(${currentX * 0.2}deg) rotateY(${currentY * 0.2}deg)`;
      }

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        requestAnimationFrame(render);
      } else {
        isAnimating = false;
      }
    }

    function queueRender() {
      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(render);
      }
    }

    function updateTarget(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normalizedY = ((clientY - rect.top) / rect.height) * 2 - 1;

      targetY = Math.max(-1, Math.min(1, normalizedX)) * config.maxRotationY;
      targetX = Math.max(-1, Math.min(1, -normalizedY)) * config.maxRotationX;
      queueRender();
    }

    container.addEventListener('mousemove', (event) => {
      updateTarget(event.clientX, event.clientY);
    });

    container.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
      queueRender();
    });

    container.addEventListener('touchmove', (event) => {
      const touch = event.touches[0];
      if (touch) {
        updateTarget(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      targetX = 0;
      targetY = 0;
      queueRender();
    }, { passive: true });
  })();

  (function initAccessibleMobileNav() {
    const navToggler = document.getElementById('navToggler');
    const navTogglerIcon = document.getElementById('navTogglerIcon');
    const navbarCollapse = document.getElementById('navbarNav');

    if (!navToggler || !navbarCollapse) {
      return;
    }

    const observer = new MutationObserver(() => {
      const isOpen = navbarCollapse.classList.contains('show');
      navToggler.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (navTogglerIcon) {
        navTogglerIcon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
      }
    });

    observer.observe(navbarCollapse, {
      attributes: true,
      attributeFilter: ['class']
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
        navToggler.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (
        navbarCollapse.classList.contains('show') &&
        !navbarCollapse.contains(event.target) &&
        !navToggler.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });
  })();

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.rel = 'noopener noreferrer';
    if (!link.getAttribute('aria-label')) {
      const label = link.getAttribute('title') || link.textContent.trim();
      if (label) {
        link.setAttribute('aria-label', label);
      }
    }
  });
})();
