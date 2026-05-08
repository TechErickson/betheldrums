/* ═══════════════════════════════════════════════════════════
   BETHEL DRUMS — main.js
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const SETTINGS_KEY = 'bethelSiteSettings';
  const BOOKINGS_KEY = 'bethelBookings';
  const DASHBOARD_AUTH_KEY = 'bethelDashboardAuth';
  const DASHBOARD_SESSION_KEY = 'bethelDashboardSession';

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (!localStorage.getItem(DASHBOARD_AUTH_KEY)) {
    localStorage.setItem(DASHBOARD_AUTH_KEY, JSON.stringify({
      email: 'admin@bethel.com',
      password: 'password'
    }));
  }

  let savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const normalizeUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };
  const parseGalleryImages = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  };
  const parseLines = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  };
  const toEmbedUrl = (url) => {
    if (!url) return '';
    const clean = url.trim();
    if (clean.includes('youtube.com/watch?v=')) {
      return clean.replace('watch?v=', 'embed/');
    }
    if (clean.includes('youtu.be/')) {
      const id = clean.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return clean;
  };
  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const applySiteSettings = (settings) => {
    if (settings.email) {
      const normalizedEmail = settings.email.toLowerCase();
      document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
        a.href = `mailto:${normalizedEmail}`;
        a.textContent = normalizedEmail;
      });
    }
    if (settings.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
        const tel = settings.phone.replace(/[^\d+]/g, '');
        a.href = `tel:${tel}`;
        a.textContent = settings.phone;
      });
    }
    if (settings.whatsapp) {
      const waNumber = settings.whatsapp.replace(/[^\d]/g, '');
      document.querySelectorAll('.whatsapp-float').forEach((link) => {
        link.href = `https://wa.me/${waNumber}`;
      });
    }

    const facebookAnchor = document.querySelector('.top-socials a[aria-label="Facebook"]');
    const linkedinAnchor = document.querySelector('.top-socials a[aria-label="LinkedIn"]');
    const instagramAnchor = document.querySelector('.top-socials a[aria-label="Instagram"]');
    if (facebookAnchor && settings.facebook) facebookAnchor.href = normalizeUrl(settings.facebook);
    if (linkedinAnchor && settings.linkedin) linkedinAnchor.href = normalizeUrl(settings.linkedin);
    if (instagramAnchor && settings.instagram) instagramAnchor.href = normalizeUrl(settings.instagram);

    if (settings.homeTagline && document.querySelector('.hero-tagline')) {
      document.querySelector('.hero-tagline').textContent = settings.homeTagline;
    }
    const portfolioCta = document.getElementById('portfolioCta');
    if (portfolioCta) {
      const portfolioUrl = normalizeUrl(settings.portfolioLink || '');
      portfolioCta.href = portfolioUrl || '#';
      portfolioCta.setAttribute('aria-disabled', portfolioUrl ? 'false' : 'true');
    }
    if (settings.aboutText && document.querySelector('.about-text p')) {
      document.querySelector('.about-text p').textContent = settings.aboutText;
    }

    const aboutGallery = document.querySelector('.gallery-grid');
    const galleryImages = parseGalleryImages(settings.galleryImages);
    const uploadedGalleryImages = parseGalleryImages(settings.galleryUploads);
    const combinedGallery = [...galleryImages, ...uploadedGalleryImages];
    if (aboutGallery && combinedGallery.length) {
      aboutGallery.innerHTML = combinedGallery.map((url, idx) => `
        <img src="${url}" alt="Bethel Drums gallery image ${idx + 1}" />
      `).join('');
    }

    const aboutVideoGrid = document.querySelector('.video-grid');
    const aboutVideos = parseLines(settings.aboutVideos);
    const aboutUploadedVideos = parseLines(settings.aboutVideoUploads);
    const combinedVideos = [...aboutVideos, ...aboutUploadedVideos];
    if (aboutVideoGrid && combinedVideos.length) {
      aboutVideoGrid.innerHTML = combinedVideos.map((url, idx) => {
        const embedUrl = toEmbedUrl(url);
        const isMp4 = /\.(mp4|webm|ogg)(\?.*)?$/i.test(embedUrl) || /^data:video\//i.test(embedUrl);
        if (isMp4) {
          return `<video controls preload="metadata"><source src="${embedUrl}" />Your browser does not support video playback.</video>`;
        }
        return `<iframe src="${embedUrl}" title="Bethel Drums video ${idx + 1}" loading="lazy" allowfullscreen></iframe>`;
      }).join('');
    }
  };

  applySiteSettings(savedSettings);
  const portfolioCta = document.getElementById('portfolioCta');
  if (portfolioCta) {
    portfolioCta.addEventListener('click', (event) => {
      if (portfolioCta.getAttribute('aria-disabled') === 'true') {
        event.preventDefault();
      }
    });
  }
  window.addEventListener('storage', (event) => {
    if (event.key !== SETTINGS_KEY) return;
    const latestSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    applySiteSettings(latestSettings);
  });

  /* ── NAVBAR SCROLL ─────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── HAMBURGER MENU ────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  /* ── MOBILE DROPDOWN TOGGLE ────────────────────────── */
  document.querySelectorAll('.dropdown > .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        link.closest('.dropdown').classList.toggle('open');
      }
    });
  });

  /* ── SCROLL REVEAL ─────────────────────────────────── */
  const reveals = document.querySelectorAll(
    '.highlight-card, .value-card, .about-story-grid, .service-section, .section-header, .svc-pill'
  );
  reveals.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger children of grid containers
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => revealObserver.observe(el));

  /* ── STAGGER GRID CHILDREN ─────────────────────────── */
  ['highlight-grid', 'values-grid', 'services-row'].forEach(cls => {
    const grid = document.querySelector('.' + cls);
    if (!grid) return;
    Array.from(grid.children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  /* ── SERVICE RADIO — PRE-SELECT FROM URL PARAM ──────── */
  const urlParams = new URLSearchParams(window.location.search);
  const preService = urlParams.get('service');
  if (preService) {
    const radio = document.querySelector(`input[name="service"][value="${preService}"]`);
    if (radio) {
      radio.checked = true;
      radio.closest('.service-radio-card')
           ?.querySelector('.radio-content')
           ?.classList.add('selected');
    }
  }

  /* ── BOOKING FORM SUBMISSION ───────────────────────── */
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear previous errors
      document.querySelectorAll('.field-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
      });

      // Validate
      let valid = true;
      const required = ['fullname', 'contact', 'email', 'location'];
      required.forEach(field => {
        const input = document.getElementById(field);
        const errEl = document.getElementById(`err-${field}`);
        if (!input || !input.value.trim()) {
          if (errEl) {
            errEl.textContent = 'This field is required.';
            errEl.classList.add('visible');
          }
          valid = false;
        }
        // Email format
        if (field === 'email' && input?.value) {
          const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRx.test(input.value)) {
            if (errEl) {
              errEl.textContent = 'Please enter a valid email address.';
              errEl.classList.add('visible');
            }
            valid = false;
          }
        }
      });

      // Service required
      const serviceRadios = document.querySelectorAll('input[name="service"]');
      const serviceChecked = [...serviceRadios].some(r => r.checked);
      if (!serviceChecked) {
        const errService = document.getElementById('err-service');
        if (errService) {
          errService.textContent = 'Please select a service.';
          errService.classList.add('visible');
        }
        valid = false;
      }

      if (!valid) return;

      // Submit
      const submitBtn  = document.getElementById('submitBtn');
      const btnText    = submitBtn?.querySelector('.btn-text');
      const btnLoader  = submitBtn?.querySelector('.btn-loader');
      if (submitBtn)  submitBtn.disabled = true;
      if (btnText)    btnText.style.display = 'none';
      if (btnLoader)  btnLoader.style.display = 'inline';

      try {
        const formData = new FormData(bookingForm);
        const response = await fetch('booking.php', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();

        if (result.success) {
          const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
          bookings.unshift({
            fullname: formData.get('fullname') || '',
            contact: formData.get('contact') || '',
            email: formData.get('email') || '',
            service: formData.get('service') || '',
            event_date: formData.get('event_date') || '',
            location: formData.get('location') || ''
          });
          localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));

          if (btnText) btnText.textContent = 'Booking Successful';
          if (btnLoader) btnLoader.style.display = 'none';

          bookingForm.style.display = 'none';
          const successEl = document.getElementById('form-success');
          if (successEl) successEl.style.display = 'block';
          window.scrollTo({ top: successEl?.offsetTop - 100 || 0, behavior: 'smooth' });
        } else {
          alert('Error: ' + (result.message || 'Something went wrong. Please try again.'));
          if (submitBtn)  submitBtn.disabled = false;
          if (btnText)    btnText.style.display = 'inline';
          if (btnLoader)  btnLoader.style.display = 'none';
        }
      } catch (err) {
        console.error(err);
        const formData = new FormData(bookingForm);
        const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
        bookings.unshift({
          fullname: formData.get('fullname') || '',
          contact: formData.get('contact') || '',
          email: formData.get('email') || '',
          service: formData.get('service') || '',
          event_date: formData.get('event_date') || '',
          location: formData.get('location') || ''
        });
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));

        bookingForm.style.display = 'none';
        const successEl = document.getElementById('form-success');
        if (successEl) successEl.style.display = 'block';
      }
    });
  }

  /* ── SMOOTH ANCHOR SCROLL ──────────────────────────── */
  document.querySelectorAll('a[href*="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href.startsWith('#') || (href.includes(window.location.pathname) && href.includes('#'))) {
        const hash = '#' + href.split('#')[1];
        const target = document.querySelector(hash);
        if (target) {
          e.preventDefault();
          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) + 60;
          window.scrollTo({
            top: target.offsetTop - offset,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  /* ── CURSOR TRAIL (desktop only) ───────────────────── */
  if (window.innerWidth > 768) {
    let lastX = 0, lastY = 0;
    let dots = [];
    const MAX_DOTS = 6;

    document.addEventListener('mousemove', (e) => {
      if (Math.abs(e.clientX - lastX) < 8 && Math.abs(e.clientY - lastY) < 8) return;
      lastX = e.clientX; lastY = e.clientY;

      const dot = document.createElement('div');
      dot.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        width: 6px;
        height: 6px;
        background: rgba(245,168,0,0.5);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        transition: opacity 0.6s ease, transform 0.6s ease;
      `;
      document.body.appendChild(dot);
      dots.push(dot);

      if (dots.length > MAX_DOTS) {
        const old = dots.shift();
        old?.remove();
      }

      requestAnimationFrame(() => {
        dot.style.opacity = '0';
        dot.style.transform = 'translate(-50%, -50%) scale(0)';
      });
      setTimeout(() => dot.remove(), 600);
    });
  }

  /* ── ACTIVE NAV LINK ───────────────────────────────── */
  document.querySelectorAll('.nav-link:not(.btn-gold)').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && currentPage.includes(href.replace('.html', ''))) {
      link.classList.add('active');
    }
  });

  /* ── HERO SLIDESHOW ─────────────────────────────────── */
  const slides = document.querySelectorAll('.hero-slideshow .slide');
  if (slides.length > 1) {
    let index = 0;
    setInterval(() => {
      slides[index].classList.remove('active');
      index = (index + 1) % slides.length;
      slides[index].classList.add('active');
    }, 3500);
  }

  /* ── DASHBOARD SETTINGS + BOOKINGS ──────────────────── */
  const dashboardLoginCard = document.getElementById('dashboardLoginCard');
  const dashboardApp = document.getElementById('dashboardApp');
  const dashboardLoginForm = document.getElementById('dashboardLoginForm');
  const dashboardLoginEmail = document.getElementById('dashboardLoginEmail');
  const dashboardLoginPassword = document.getElementById('dashboardLoginPassword');
  const dashboardLoginMsg = document.getElementById('dashboard-login-msg');
  const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn');
  const dashboardAccountForm = document.getElementById('dashboardAccountForm');
  const dashboardAccountEmail = document.getElementById('dashboardAccountEmail');
  const dashboardCurrentPassword = document.getElementById('dashboardCurrentPassword');
  const dashboardNewPassword = document.getElementById('dashboardNewPassword');
  const dashboardConfirmPassword = document.getElementById('dashboardConfirmPassword');
  const dashboardAccountMsg = document.getElementById('dashboard-account-msg');

  const getAuthSettings = () => JSON.parse(localStorage.getItem(DASHBOARD_AUTH_KEY) || '{}');
  const showDashboardApp = () => {
    const authSettings = getAuthSettings();
    if (dashboardLoginCard) dashboardLoginCard.style.display = 'none';
    if (dashboardApp) dashboardApp.style.display = 'grid';
    if (dashboardAccountEmail) dashboardAccountEmail.value = authSettings.email || 'admin@bethel.com';
  };

  if (currentPage === 'dashboard.html') {
    const isLoggedIn = localStorage.getItem(DASHBOARD_SESSION_KEY) === 'true';
    if (isLoggedIn) {
      showDashboardApp();
    } else {
      if (dashboardLoginCard) dashboardLoginCard.style.display = 'block';
      if (dashboardApp) dashboardApp.style.display = 'none';
    }
  }

  if (dashboardLoginForm) {
    dashboardLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const authSettings = getAuthSettings();
      const email = dashboardLoginEmail?.value.trim().toLowerCase();
      const password = dashboardLoginPassword?.value || '';
      const match = email === (authSettings.email || '').toLowerCase() && password === (authSettings.password || '');
      if (match) {
        localStorage.setItem(DASHBOARD_SESSION_KEY, 'true');
        if (dashboardLoginMsg) dashboardLoginMsg.textContent = '';
        showDashboardApp();
      } else if (dashboardLoginMsg) {
        dashboardLoginMsg.textContent = 'Invalid login credentials.';
      }
    });
  }

  if (dashboardLogoutBtn) {
    dashboardLogoutBtn.addEventListener('click', () => {
      localStorage.removeItem(DASHBOARD_SESSION_KEY);
      window.location.reload();
    });
  }

  if (dashboardAccountForm) {
    dashboardAccountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const authSettings = getAuthSettings();
      const current = dashboardCurrentPassword?.value || '';
      const next = dashboardNewPassword?.value || '';
      const confirm = dashboardConfirmPassword?.value || '';
      const nextEmail = dashboardAccountEmail?.value.trim().toLowerCase() || 'admin@bethel.com';

      if (current !== authSettings.password) {
        if (dashboardAccountMsg) dashboardAccountMsg.textContent = 'Current password is incorrect.';
        return;
      }
      if (!next || next.length < 4) {
        if (dashboardAccountMsg) dashboardAccountMsg.textContent = 'New password must be at least 4 characters.';
        return;
      }
      if (next !== confirm) {
        if (dashboardAccountMsg) dashboardAccountMsg.textContent = 'New password and confirm password do not match.';
        return;
      }

      const updatedAuth = { email: nextEmail, password: next };
      localStorage.setItem(DASHBOARD_AUTH_KEY, JSON.stringify(updatedAuth));
      if (dashboardCurrentPassword) dashboardCurrentPassword.value = '';
      if (dashboardNewPassword) dashboardNewPassword.value = '';
      if (dashboardConfirmPassword) dashboardConfirmPassword.value = '';
      if (dashboardAccountMsg) dashboardAccountMsg.textContent = 'Dashboard login credentials updated.';
    });
  }

  const dashboardSettingsForm = document.getElementById('dashboardSettingsForm');
  const bookingsTableBody = document.querySelector('#bookingsTable tbody');
  if (bookingsTableBody) {
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    bookingsTableBody.innerHTML = bookings.length
      ? bookings.map((booking) => `
          <tr>
            <td>${booking.fullname || ''}</td>
            <td>${booking.contact || ''}</td>
            <td>${booking.email || ''}</td>
            <td>${booking.service || ''}</td>
            <td>${booking.event_date || ''}</td>
            <td>${booking.location || ''}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="6">No bookings yet.</td></tr>';
  }

  if (dashboardSettingsForm) {
    const sitePhone = document.getElementById('sitePhone');
    const siteWhatsapp = document.getElementById('siteWhatsapp');
    const siteEmail = document.getElementById('siteEmail');
    const facebookLink = document.getElementById('facebookLink');
    const linkedinLink = document.getElementById('linkedinLink');
    const instagramLink = document.getElementById('instagramLink');
    const homeTagline = document.getElementById('homeTagline');
    const portfolioLink = document.getElementById('portfolioLink');
    const aboutText = document.getElementById('aboutText');
    const aboutVideosField = document.getElementById('aboutVideos');
    const aboutVideoUploadFiles = document.getElementById('aboutVideoUploadFiles');
    const videoUploadInfo = document.getElementById('video-upload-info');
    const clearVideoUploads = document.getElementById('clearVideoUploads');
    const galleryImagesField = document.getElementById('galleryImages');
    const galleryUploadFiles = document.getElementById('galleryUploadFiles');
    const galleryUploadInfo = document.getElementById('gallery-upload-info');
    const clearGalleryUploads = document.getElementById('clearGalleryUploads');
    const saveMsg = document.getElementById('dashboard-save-msg');
    let storedGalleryUploads = parseGalleryImages(savedSettings.galleryUploads);
    let storedVideoUploads = parseLines(savedSettings.aboutVideoUploads);

    const renderUploadInfo = () => {
      if (!galleryUploadInfo) return;
      galleryUploadInfo.textContent = storedGalleryUploads.length
        ? `${storedGalleryUploads.length} uploaded gallery image(s) saved.`
        : 'No uploaded gallery images saved yet.';
    };
    const renderVideoUploadInfo = () => {
      if (!videoUploadInfo) return;
      videoUploadInfo.textContent = storedVideoUploads.length
        ? `${storedVideoUploads.length} uploaded video(s) saved.`
        : 'No uploaded videos saved yet.';
    };

    if (sitePhone) sitePhone.value = savedSettings.phone || '+254 700 000 000';
    if (siteWhatsapp) siteWhatsapp.value = savedSettings.whatsapp || '254700000000';
    if (siteEmail) siteEmail.value = savedSettings.email || 'betheldrums01@gmail.com';
    if (facebookLink) facebookLink.value = savedSettings.facebook || 'https://facebook.com';
    if (linkedinLink) linkedinLink.value = savedSettings.linkedin || 'https://linkedin.com';
    if (instagramLink) instagramLink.value = savedSettings.instagram || 'https://instagram.com/bethel.drums';
    if (homeTagline) homeTagline.value = savedSettings.homeTagline || '';
    if (portfolioLink) portfolioLink.value = savedSettings.portfolioLink || '';
    if (aboutText) aboutText.value = savedSettings.aboutText || '';
    if (aboutVideosField) aboutVideosField.value = parseLines(savedSettings.aboutVideos).join('\n');
    if (galleryImagesField) {
      galleryImagesField.value = parseGalleryImages(savedSettings.galleryImages).join('\n');
    }
    renderUploadInfo();
    renderVideoUploadInfo();

    if (clearGalleryUploads) {
      clearGalleryUploads.addEventListener('click', () => {
        storedGalleryUploads = [];
        if (galleryUploadFiles) galleryUploadFiles.value = '';
        renderUploadInfo();
        if (saveMsg) saveMsg.textContent = 'Uploaded gallery images cleared. Click Save to apply.';
      });
    }
    if (clearVideoUploads) {
      clearVideoUploads.addEventListener('click', () => {
        storedVideoUploads = [];
        if (aboutVideoUploadFiles) aboutVideoUploadFiles.value = '';
        renderVideoUploadInfo();
        if (saveMsg) saveMsg.textContent = 'Uploaded videos cleared. Click Save to apply.';
      });
    }

    dashboardSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let newUploadedFiles = [];
      const files = Array.from(galleryUploadFiles?.files || []);
      if (files.length) {
        const imageFiles = files.filter((file) => /image\/(png|jpeg)/.test(file.type));
        newUploadedFiles = await Promise.all(imageFiles.map(fileToDataUrl));
      }
      let newUploadedVideos = [];
      const videoFiles = Array.from(aboutVideoUploadFiles?.files || []);
      if (videoFiles.length) {
        const mp4Files = videoFiles.filter((file) => /video\/mp4/.test(file.type) || /\.mp4$/i.test(file.name));
        newUploadedVideos = await Promise.all(mp4Files.map(fileToDataUrl));
      }

      const payload = {
        phone: sitePhone?.value.trim() || '',
        whatsapp: siteWhatsapp?.value.trim() || '',
        email: siteEmail?.value.trim().toLowerCase() || '',
        facebook: facebookLink?.value.trim() || '',
        linkedin: linkedinLink?.value.trim() || '',
        instagram: instagramLink?.value.trim() || '',
        homeTagline: homeTagline?.value.trim() || '',
        portfolioLink: portfolioLink?.value.trim() || '',
        aboutText: aboutText?.value.trim() || '',
        aboutVideos: parseLines(aboutVideosField?.value || ''),
        aboutVideoUploads: [...storedVideoUploads, ...newUploadedVideos],
        galleryImages: parseGalleryImages(galleryImagesField?.value || ''),
        galleryUploads: [...storedGalleryUploads, ...newUploadedFiles]
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      savedSettings = payload;
      applySiteSettings(savedSettings);
      storedGalleryUploads = payload.galleryUploads;
      storedVideoUploads = payload.aboutVideoUploads;
      if (galleryUploadFiles) galleryUploadFiles.value = '';
      if (aboutVideoUploadFiles) aboutVideoUploadFiles.value = '';
      renderUploadInfo();
      renderVideoUploadInfo();
      if (saveMsg) saveMsg.textContent = 'Saved. Open Home or About page to confirm updates.';
    });
  }

  console.log('%cBETHEL DRUMS 🥁', 'color:#F5A800;font-size:20px;font-weight:bold;');
  console.log('%cBeat. Create. Inspire.', 'color:#888;font-size:14px;');
});
