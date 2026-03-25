/* ─────────────────────────────────────────────
   PHOTOGRAPHY WEBSITE — SCRIPT
   Uses Cloudinary Search API to auto-load photos
   from folders — no manual photo listing needed.
   ───────────────────────────────────────────── */

// === STATE ===
let config          = {};
let currentGallery  = null;
let currentIndex    = 0;
let sessionUnlocked = false;
let pendingUrl      = '';

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    loadConfig();
    bindLightboxEvents();
    bindModalEvents();
    bindHeaderScroll();
    bindMobileNav();
});

// === LOAD CONFIG ===
function loadConfig() {
    fetch('photos.json')
        .then(r => {
            if (!r.ok) throw new Error('photos.json not found');
            return r.json();
        })
        .then(data => {
            config = data;
            applyConfig(data);
            loadAllGalleries(data.galleries || []);
        })
        .catch(err => {
            console.error('Could not load photos.json:', err);
            document.getElementById('gallery-list').innerHTML =
                `<p style="color:#666;text-align:center;padding:5rem 2rem;font-size:0.8rem;letter-spacing:0.1em">
                    Could not load photos.json — please check the setup guide.
                </p>`;
        });
}

function applyConfig(data) {
    if (data.siteName) {
        document.getElementById('site-name').textContent   = data.siteName;
        document.getElementById('hero-title').textContent  = data.siteName;
        document.getElementById('footer-name').textContent = data.siteName;
        document.title = data.siteName;
    }
    if (data.heroSubtitle) document.getElementById('hero-subtitle').textContent = data.heroSubtitle;
    if (data.aboutTitle)   document.getElementById('about-title').textContent   = data.aboutTitle;
    if (data.aboutText)    document.getElementById('about-text').textContent    = data.aboutText;
    if (data.contactText)  document.getElementById('contact-text').textContent  = data.contactText;
    if (data.contactEmail) {
        const link = document.getElementById('contact-email');
        link.textContent = data.contactEmail;
        link.href = 'mailto:' + data.contactEmail;
    }
}

// === LOAD ALL GALLERIES ===
function loadAllGalleries(galleries) {
    const container = document.getElementById('gallery-list');
    container.innerHTML = '';

    if (!galleries.length) {
        container.innerHTML = `<p style="color:#666;text-align:center;padding:5rem 2rem;font-size:0.8rem;letter-spacing:0.1em">
            No galleries yet — add some to photos.json.
        </p>`;
        return;
    }

    const sorted = [...galleries].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach((gallery, gi) => {
        // Build section shell immediately so order is preserved while async loads happen
        const section = document.createElement('section');
        section.className = 'gallery-section';
        section.id        = 'section-' + gi;
        section.style.animationDelay = `${gi * 0.08}s`;
        section.innerHTML = `
            <div class="gallery-header">
                <h2 class="gallery-title">${escHtml(gallery.title)}</h2>
                <span class="gallery-date">${formatDate(gallery.date)}</span>
                <span class="gallery-count" id="count-${gi}">Loading…</span>
            </div>
            <div class="photo-grid" id="grid-${gi}">${skeletons(6)}</div>
        `;
        container.appendChild(section);

        fetchGalleryPhotos(gallery.folder)
            .then(data => {
                const publicIds = data.photos || [];
                const countEl   = document.getElementById('count-' + gi);
                const gridEl    = document.getElementById('grid-' + gi);

                if (!publicIds.length) {
                    const debugInfo = data.debug ? '<br><small style="color:#444;font-family:monospace;white-space:pre-wrap">' + JSON.stringify(data.debug, null, 2) + '</small>' : '';
                    gridEl.innerHTML = `<p style="color:#888;font-size:0.75rem;padding:1rem 0;letter-spacing:0.08em">No photos found in folder "${gallery.folder}".${debugInfo}</p>`;
                    countEl.textContent = '0 photos';
                    return;
                }

                countEl.textContent = `${publicIds.length} photo${publicIds.length !== 1 ? 's' : ''}`;
                gridEl.innerHTML    = '';

                const resolvedGallery = { ...gallery, photos: publicIds };
                renderGrid(resolvedGallery, gridEl);
            })
            .catch(err => {
                console.error(`Failed to load gallery "${gallery.folder}":`, err);
                document.getElementById('grid-' + gi).innerHTML =
                    `<p style="color:#c06060;font-size:0.75rem;padding:1rem 0;letter-spacing:0.08em">
                        Could not load photos. Check your API credentials and folder name in photos.json.<br>
                        <small style="color:#666">${err.message}</small>
                    </p>`;
                document.getElementById('count-' + gi).textContent = 'Error';
            });
    });
}

// === PHOTO FETCHING ===
// Calls our Netlify serverless function which securely proxies to Cloudinary.
// The API secret never touches the browser - it lives in Netlify env variables.
async function fetchGalleryPhotos(folder) {
    const response = await fetch(`/api/photos?folder=${encodeURIComponent(folder)}`);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const detail = data.debug ? JSON.stringify(data.debug, null, 2) : '';
        throw new Error((data.error || `Server error ${response.status}`) + (detail ? '\n' + detail : ''));
    }

    // Return full data object so caller can access debug info
    return data;
}

// === RENDER GRID ===
function renderGrid(gallery, grid) {
    gallery.photos.forEach((publicId, index) => {
        const item       = document.createElement('div');
        item.className   = 'photo-item skeleton';

        const img        = document.createElement('img');
        img.src          = cloudUrl(publicId, { w: 700, q: 72 });
        img.alt          = `${gallery.title} — photo ${index + 1}`;
        img.loading      = 'lazy';
        img.decoding     = 'async';

        img.addEventListener('load',  () => { img.classList.add('loaded'); item.classList.remove('skeleton'); });
        img.addEventListener('error', () => { item.classList.remove('skeleton'); item.style.background = '#1a1a1a'; });

        const hint       = document.createElement('div');
        hint.className   = 'photo-hint';
        hint.innerHTML   = '<span>View</span>';

        item.appendChild(img);
        item.appendChild(hint);
        item.addEventListener('click', () => openLightbox(gallery, index));
        grid.appendChild(item);
    });
}

function skeletons(n) {
    return Array.from({ length: n }, () => `<div class="photo-item skeleton"></div>`).join('');
}

// === CLOUDINARY URL BUILDER ===
function cloudUrl(publicId, opts = {}) {
    const base = `https://res.cloudinary.com/${config.cloudName}/image/upload`;
    if (opts.full) return `${base}/${publicId}`;
    return `${base}/w_${opts.w || 800},q_${opts.q || 75},c_limit,f_auto/${publicId}`;
}

// === LIGHTBOX ===
function openLightbox(gallery, index) {
    currentGallery = gallery;
    currentIndex   = index;
    updateLightboxImage();
    document.getElementById('lightbox').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.add('hidden');
    document.body.style.overflow = '';
    const img = document.getElementById('lb-img');
    img.src = '';
    img.classList.remove('loaded');
}

function updateLightboxImage() {
    const publicId = currentGallery.photos[currentIndex];
    const img      = document.getElementById('lb-img');
    const spinner  = document.querySelector('.lb-spinner');

    img.classList.remove('loaded');
    spinner.classList.remove('hidden');

    img.src    = cloudUrl(publicId, { w: 1800, q: 88 });
    pendingUrl = cloudUrl(publicId, { full: true });

    img.onload  = () => { img.classList.add('loaded'); spinner.classList.add('hidden'); };
    img.onerror = () => { spinner.classList.add('hidden'); };

    const total = currentGallery.photos.length;
    document.getElementById('lb-counter').textContent = `${currentIndex + 1} / ${total}`;
    document.getElementById('lb-prev').disabled = currentIndex === 0;
    document.getElementById('lb-next').disabled = currentIndex === total - 1;
}

function navigate(dir) {
    const next = currentIndex + dir;
    if (next >= 0 && next < currentGallery.photos.length) {
        currentIndex = next;
        updateLightboxImage();
    }
}

function bindLightboxEvents() {
    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', () => navigate(-1));
    document.getElementById('lb-next').addEventListener('click', () => navigate(1));
    document.getElementById('lb-download').addEventListener('click', initiateDownload);

    document.addEventListener('keydown', e => {
        if (document.getElementById('lightbox').classList.contains('hidden')) return;
        if (e.key === 'Escape')     closeLightbox();
        if (e.key === 'ArrowLeft')  navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });

    document.getElementById('lightbox').addEventListener('click', e => {
        if (e.target === document.getElementById('lightbox')) closeLightbox();
    });
}

// === PASSWORD & DOWNLOAD ===
function initiateDownload() {
    sessionUnlocked ? triggerDownload(pendingUrl) : showModal();
}

function showModal() {
    document.getElementById('pw-modal').classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('pw-input').value = '';
    document.getElementById('pw-error').classList.add('hidden');
    setTimeout(() => document.getElementById('pw-input').focus(), 50);
}

function hideModal() {
    document.getElementById('pw-modal').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
}

function checkPassword() {
    if (document.getElementById('pw-input').value === config.downloadPassword) {
        sessionUnlocked = true;
        hideModal();
        triggerDownload(pendingUrl);
    } else {
        document.getElementById('pw-error').classList.remove('hidden');
        document.getElementById('pw-input').value = '';
        document.getElementById('pw-input').focus();
    }
}

function triggerDownload(url) {
    const a = document.createElement('a');
    a.href   = url.replace('/upload/', '/upload/fl_attachment/');
    a.target = '_blank';
    a.rel    = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function bindModalEvents() {
    document.getElementById('pw-cancel').addEventListener('click', hideModal);
    document.getElementById('pw-submit').addEventListener('click', checkPassword);
    document.getElementById('overlay').addEventListener('click', hideModal);
    document.getElementById('pw-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') checkPassword();
    });
}

// === HEADER / NAV ===
function bindHeaderScroll() {
    const header = document.getElementById('site-header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
}

function bindMobileNav() {
    const ham = document.getElementById('hamburger');
    const nav = document.getElementById('mobile-nav');
    ham.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

// === UTILS ===
function formatDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
