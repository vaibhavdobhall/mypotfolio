/* ==========================================================================
   CONFIGURATION — Insert your real API keys here
   ========================================================================== */
const GOOGLE_CLIENT_ID = '574686409793-kk60q4hcuq21dlmoghisauetibdg2co8.apps.googleusercontent.com';
const WEB3FORMS_ACCESS_KEY = '2d1d1add-4b87-4cd7-b6fd-958d99e03a79';
const WHATSAPP_NUMBER = '919999999999';


/* ==========================================================================
   COOKIE CONSENT BANNER
   ========================================================================== */
(function() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAccept');
  const declineBtn = document.getElementById('cookieDecline');

  // Check if user already made a choice
  const consent = localStorage.getItem('cookieConsent');

  if (!consent) {
    // No choice yet — show the banner immediately
    console.log('[Cookie] No consent found, showing banner');
    banner.classList.add('show');
  } else {
    console.log('[Cookie] Consent already:', consent);
  }

  acceptBtn.addEventListener('click', function() {
    localStorage.setItem('cookieConsent', 'accepted');
    banner.classList.remove('show');
    console.log('[Cookie] Accepted');
  });

  declineBtn.addEventListener('click', function() {
    localStorage.setItem('cookieConsent', 'declined');
    banner.classList.remove('show');
    // Clear saved Google user data
    localStorage.removeItem('savedGoogleUser');
    location.reload();
    console.log('[Cookie] Declined');
  });
})();


/* ==========================================================================
   GOOGLE SIGN-IN
   ========================================================================== */
(function() {
  const signInBtn = document.getElementById('signInTrigger');
  const modal = document.getElementById('authModal');
  const modalClose = document.getElementById('authModalClose');
  const signOutBtn = document.getElementById('signOutBtn');
  const avatarWrapper = document.getElementById('userAvatarWrapper');
  const avatarImg = document.getElementById('userAvatar');
  const nameSpan = document.getElementById('userName');

  // Modal open/close
  signInBtn.addEventListener('click', function() { modal.classList.add('open'); });
  modalClose.addEventListener('click', function() { modal.classList.remove('open'); });
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('open'); });

  // Helper to update UI when signed in
  function showSignedIn(user) {
    signInBtn.style.display = 'none';
    avatarWrapper.style.display = 'flex';
    avatarImg.src = user.picture;
    nameSpan.textContent = user.name;
    console.log('[Auth] Signed in as:', user.name);
  }

  function showSignedOut() {
    signInBtn.style.display = 'inline-flex';
    avatarWrapper.style.display = 'none';
    avatarImg.src = '';
    nameSpan.textContent = '';
    console.log('[Auth] Signed out');
  }

  // Sign out handler
  signOutBtn.addEventListener('click', function() {
    localStorage.removeItem('savedGoogleUser');
    showSignedOut();
    try { google.accounts.id.disableAutoSelect(); } catch(e) {}
    console.log('[Auth] User signed out');
  });

  // Decode JWT payload (base64)
  function decodeJWT(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      return JSON.parse(atob(b64));
    } catch(e) {
      console.error('[Auth] JWT decode error:', e);
      return null;
    }
  }

  // Handle Google credential response
  window.handleGoogleCredential = function(response) {
    console.log('[Auth] Google credential received');
    const decoded = decodeJWT(response.credential);
    if (!decoded) {
      console.error('[Auth] Failed to decode credential');
      return;
    }
    console.log('[Auth] Decoded user:', decoded.name, decoded.email);

    const user = { name: decoded.name, email: decoded.email, picture: decoded.picture, sub: decoded.sub };

    // ALWAYS save to localStorage so it persists across refreshes
    localStorage.setItem('savedGoogleUser', JSON.stringify(user));
    console.log('[Auth] User saved to localStorage');

    showSignedIn(user);
    modal.classList.remove('open');
  };

  // Initialize GIS
  function initGIS() {
    if (typeof google === 'undefined' || !google.accounts) {
      console.log('[Auth] GIS not loaded yet, retrying...');
      setTimeout(initGIS, 500);
      return;
    }

    console.log('[Auth] Initializing Google Sign-In');

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: window.handleGoogleCredential,
      auto_select: false
    });

    google.accounts.id.renderButton(
      document.getElementById('googleButton'),
      { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 280 }
    );

    // Try to restore saved session
    const saved = localStorage.getItem('savedGoogleUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user && user.name && user.picture) {
          showSignedIn(user);
          console.log('[Auth] Session restored from localStorage');
        }
      } catch(e) {
        localStorage.removeItem('savedGoogleUser');
      }
    } else {
      console.log('[Auth] No saved session found');
    }
  }

  initGIS();
})();


/* ==========================================================================
   WHATSAPP BUTTON
   ========================================================================== */
document.getElementById('whatsappBtn').href =
  'https://wa.me/' + WHATSAPP_NUMBER + '?text=Hello%2C%20I%27m%20interested%20in%20your%20services';


/* ==========================================================================
   CONTACT FORM (Web3Forms)
   ========================================================================== */
(function() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const submitBtn = document.getElementById('formSubmit');

  const fields = {
    name: document.getElementById('formName'),
    email: document.getElementById('formEmail'),
    subject: document.getElementById('formSubject'),
    message: document.getElementById('formMessage')
  };

  const errors = {
    name: document.getElementById('nameError'),
    email: document.getElementById('emailError'),
    subject: document.getElementById('subjectError'),
    message: document.getElementById('messageError')
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(field, errorEl, condition) {
    if (!condition) {
      field.classList.add('error');
      errorEl.classList.add('show');
      return false;
    }
    field.classList.remove('error');
    errorEl.classList.remove('show');
    return true;
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';

    const v = fields;
    const ok =
      validate(v.name, errors.name, v.name.value.trim().length > 0) &&
      validate(v.email, errors.email, emailRegex.test(v.email.value.trim())) &&
      validate(v.subject, errors.subject, v.subject.value.trim().length > 0) &&
      validate(v.message, errors.message, v.message.value.trim().length > 0);

    if (!ok) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: v.name.value.trim(),
          email: v.email.value.trim(),
          subject: v.subject.value.trim(),
          message: v.message.value.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        status.className = 'form-status success';
        status.textContent = "Thanks! We'll get back to you soon.";
        form.reset();
        document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.form-error.show').forEach(el => el.classList.remove('show'));
      } else {
        status.className = 'form-status error';
        status.textContent = data.message || 'Something went wrong.';
      }
    } catch(e) {
      status.className = 'form-status error';
      status.textContent = 'Network error. Please try again.';
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  });

  // Clear errors on input
  document.querySelectorAll('.form-input').forEach(function(input) {
    input.addEventListener('input', function() {
      this.classList.remove('error');
      var err = this.parentElement.querySelector('.form-error');
      if (err) err.classList.remove('show');
    });
  });
})();


/* ==========================================================================
   NAVBAR SCROLL
   ========================================================================== */
(function() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
})();


/* ==========================================================================
   MOBILE HAMBURGER MENU
   ========================================================================== */
(function() {
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('mobileOverlay');
  const links = document.querySelectorAll('.mobile-link');

  function toggle() {
    hamburger.classList.toggle('active');
    overlay.classList.toggle('open');
    document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggle);
  links.forEach(function(link) { link.addEventListener('click', toggle); });
})();


/* ==========================================================================
   INTERSECTION OBSERVER — Reveal animations + Count-up numbers
   ========================================================================== */
(function() {
  // Create one observer for both reveal and count-up
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;

      // Reveal animation
      if (entry.target.classList.contains('reveal')) {
        entry.target.classList.add('visible');
      }

      // Count-up stat numbers
      if (entry.target.classList.contains('stat-number')) {
        var max = parseInt(entry.target.getAttribute('data-target'), 10);
        animateCountUp(entry.target, max);
      }

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
  document.querySelectorAll('.stat-number').forEach(function(el) { observer.observe(el); });

  function animateCountUp(el, target) {
    var current = 0;
    var increment = target / 125; // ~2 seconds at 60fps
    (function update() {
      current += increment;
      if (current >= target) {
        el.textContent = target;
        return;
      }
      el.textContent = Math.floor(current);
      requestAnimationFrame(update);
    })();
  }
})();


/* ==========================================================================
   TESTIMONIAL SLIDER
   ========================================================================== */
(function() {
  var track = document.getElementById('testimonialTrack');
  var prev = document.getElementById('prevTestimonial');
  var next = document.getElementById('nextTestimonial');
  var dots = document.querySelectorAll('.dot');
  var current = 0;
  var total = document.querySelectorAll('.testimonial-slide').length;

  function goTo(index) {
    current = index;
    if (current < 0) current = total - 1;
    if (current >= total) current = 0;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach(function(d, i) { d.classList.toggle('active', i === current); });
  }

  prev.addEventListener('click', function() { goTo(current - 1); });
  next.addEventListener('click', function() { goTo(current + 1); });
  dots.forEach(function(d, i) { d.addEventListener('click', function() { goTo(i); }); });

  var auto = setInterval(function() { goTo(current + 1); }, 6000);
  var slider = document.querySelector('.testimonial-slider');
  slider.addEventListener('mouseenter', function() { clearInterval(auto); });
  slider.addEventListener('mouseleave', function() { auto = setInterval(function() { goTo(current + 1); }, 6000); });
})();


/* ==========================================================================
   SMOOTH ANCHOR SCROLL
   ========================================================================== */
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    var href = this.getAttribute('href');
    if (href === '#') return;
    var target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  });
});


console.log('[App] Loaded successfully');