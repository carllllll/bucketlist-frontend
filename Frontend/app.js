// =============================================
//   BUCKETLIST STAYCATIONS — APP LOGIC
//   Connected to backend API
// =============================================

const API_URL = 'https://bucketlist-backend-jx24.onrender.com'; // Change to your Render URL when deployed
// For local testing use: const API_URL = 'http://localhost:5000';

const properties = [
  {
    id: 'cfa7c66c-5ffc-4836-a673-199d02937990',
    name: "Tatu City Airbnb",
    location: "Tatu City, Nairobi",
    pricePerNight: 7000,
    airbnbUrl: "https://www.airbnb.co.uk/rooms/1398676139265440613?unique_share_id=a24474a5-e536-4839-b037-66001bd5f2f9&viralityEntryPoint=1&s=76",
    whatsapp: "254716564174",
    description: "A stunning 3-bedroom apartment within the vibrant Tatu City development.",
    amenities: ["🛏 3 Bedrooms", "🚿 2.5 Bathrooms", "👑 Master En-Suite", "⚽ Football Pitch", "🏊 Pool", "🏋️ Gym", "🏪 Mini Mart", "🏀 Basketball Court"],
    coverImage: "images/IMG_0039.jpg",
    images: [
      "images/IMG_0039.jpg","images/IMG_0068.jpg","images/IMG_0070.jpg",
      "images/IMG_0052.jpg","images/IMG_0061.jpg","images/IMG_0080.jpg",
      "images/IMG_0078.jpg","images/IMG_0073.jpg","images/IMG_0080.jpg","images/IMG_0055.jpg"
    ]
  },
  {
    id: '3592bce4-e2d3-49b8-bb1d-27042e1d8ff8',
    name: "Riverside Winchester Gardens",
    location: "Riverside, Nairobi",
    pricePerNight: 10000,
    airbnbUrl: "https://www.airbnb.com",
    whatsapp: "254716564174",
    description: "A luxurious 2-bedroom on the 15th floor with breathtaking Nairobi skyline views.",
    amenities: ["🛏 2 Bedrooms", "🚿 2 Bathrooms", "🏙️ 15th Floor Views", "🛁 Private Balcony", "🅿️ Free Parking", "🏊 Pool", "🛗 Elevator", "📍 Near Malls"],
    coverImage: "images/riverside_01.jpg",
    images: [
      "images/riverside_01.jpg","images/riverside_02.jpg","images/riverside_03.jpg",
      "images/riverside_04.jpg","images/riverside_05.jpg","images/riverside_06.jpg",
      "images/riverside_07.jpg","images/riverside_08.jpg","images/riverside_09.jpg","images/riverside_10.jpg"
    ]
  },
  {
    id: 'c724a8f4-d8a2-481c-a2ed-d17e85fead74',
    name: "Racecourse Gardens",
    location: "Racecourse, Nairobi",
    pricePerNight: 10,
    airbnbUrl: "https://www.airbnb.com",
    whatsapp: "254716564174",
    description: "A cosy 1-bedroom apartment in Racecourse Gardens with gym, pool and laundromat.",
    amenities: ["🛏 1 Bedroom", "🚿 1 Bathroom", "🏋️ Gym", "🏊 Pool", "👕 Laundromat", "🍽️ Restaurant", "🛍️ Near Junction Mall", "🅿️ Parking"],
    coverImage: "images/racecourse_01.jpg",
    images: [
      "images/racecourse_01.jpg","images/racecourse_02.jpg","images/racecourse_03.jpg",
      "images/racecourse_04.jpg","images/racecourse_05.jpg","images/racecourse_06.jpg","images/racecourse_07.jpg"
    ]
  }
];

// Load saved ratings from localStorage
properties.forEach(p => {
  const saved = localStorage.getItem('ratings_' + p.id);
  p.ratings = saved ? JSON.parse(saved) : [];
});

// Per-property SEO pages (for internal links + booking deep-links)
const PROPERTY_SLUGS = {
  'cfa7c66c-5ffc-4836-a673-199d02937990': 'tatu-city-nairobi.html',
  '3592bce4-e2d3-49b8-bb1d-27042e1d8ff8': 'riverside-winchester-gardens.html',
  'c724a8f4-d8a2-481c-a2ed-d17e85fead74': 'racecourse-gardens.html'
};

let currentGalleryProperty = null;
let currentPhotoIndex = 0;
let currentBookingProperty = null;
let ratingPropertyId = null;
let selectedRating = 0;
let _paymentPollTimer = null;

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) { alert(message); return; } // graceful fallback
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span class="toast-icon"></span><span class="toast-msg"></span>`;
  toast.querySelector('.toast-icon').textContent = icon;
  toast.querySelector('.toast-msg').textContent = message; // textContent = no HTML injection
  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 250);
  };
  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

// =============================================
// AUTH STATE
// =============================================
function getToken() { return localStorage.getItem('token'); }
function getUser()  { return JSON.parse(localStorage.getItem('user') || 'null'); }

function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateAuthUI();
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
}

function updateAuthUI() {
  const user = getUser();
  const loginBtn    = document.getElementById('loginBtn');
  const userMenu    = document.getElementById('userMenu');
  const userName    = document.getElementById('userName');
  const bookingsNav = document.getElementById('bookingsNav');

  if (user) {
    if (loginBtn)    loginBtn.style.display    = 'none';
    if (userMenu)    userMenu.style.display    = 'flex';
    if (userName)    userName.textContent      = user.full_name.split(' ')[0];
    if (bookingsNav) bookingsNav.style.display = 'flex';
  } else {
    if (loginBtn)    loginBtn.style.display    = 'flex';
    if (userMenu)    userMenu.style.display    = 'none';
    if (bookingsNav) bookingsNav.style.display = 'none';
  }
}

function logout() {
  clearAuth();
  showPage('listings', document.querySelector('.nav-link'));
  showToast('Logged out successfully.', 'success');
}

// =============================================
// SKELETON LOADERS
// =============================================
function listingSkeletonHTML(count = 3) {
  const card = `
    <div class="property-card skeleton-card" aria-hidden="true">
      <div class="card-image-wrap skeleton"></div>
      <div class="card-body">
        <div class="skeleton skeleton-line sk-sm"></div>
        <div class="skeleton skeleton-line sk-md"></div>
        <div class="skeleton-chip-row">
          <div class="skeleton skeleton-chip"></div>
          <div class="skeleton skeleton-chip"></div>
          <div class="skeleton skeleton-chip"></div>
        </div>
        <div class="skeleton-footer">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      </div>
    </div>`;
  return card.repeat(count);
}

function bookingSkeletonHTML(count = 2) {
  const card = `
    <div class="booking-card skeleton-booking" aria-hidden="true">
      <div class="booking-card-img"><div class="skeleton"></div></div>
      <div class="booking-card-body" style="padding:1.25rem">
        <div class="skeleton skeleton-line sk-md"></div>
        <div class="skeleton skeleton-line sk-lg"></div>
        <div class="skeleton skeleton-line sk-sm"></div>
        <div class="skeleton-footer">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-chip"></div>
        </div>
      </div>
    </div>`;
  return card.repeat(count);
}

// =============================================
// RENDER LISTINGS
// =============================================
async function renderListings() {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;
  grid.innerHTML = listingSkeletonHTML(properties.length || 3);

  // Fetch live ratings for all properties in parallel
  const ratingsMap = {};
  await Promise.all(properties.map(async prop => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${prop.id}`);
      const data = await res.json();
      ratingsMap[prop.id] = {
        average: data.average_rating || 0,
        total: data.total_reviews || 0
      };
    } catch (err) {
      ratingsMap[prop.id] = { average: 0, total: 0 };
    }
  }));

  grid.innerHTML = '';

  properties.forEach(prop => {
    const { average, total } = ratingsMap[prop.id] || { average: 0, total: 0 };
    const card = document.createElement('div');
    card.className = 'property-card';
    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${prop.coverImage}" alt="${prop.name}" class="card-img" loading="lazy" />
        <div class="card-badge">Available</div>
        <div class="card-overlay">
          <button class="btn-view" onclick="openGallery('${prop.id}')">View Photos</button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-location">📍 ${prop.location}</div>
        <h3 class="card-title">${PROPERTY_SLUGS[prop.id] ? `<a href="${PROPERTY_SLUGS[prop.id]}" style="color:inherit;text-decoration:none">${prop.name}</a>` : prop.name}</h3>
        <div class="card-star-row">
          ${renderStarsDisplay(average)}
          <span class="rating-count">${total > 0 ? average + ' · ' + total + ' review' + (total > 1 ? 's' : '') : 'No reviews yet'}</span>
        </div>
        <div class="card-amenities">
          ${prop.amenities.slice(0,6).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
        </div>
        <div class="card-footer">
          <div class="card-price">KES ${prop.pricePerNight.toLocaleString()} <span>/night</span></div>
          <button class="btn-book" onclick="openBooking('${prop.id}', '${prop.name}')">Book Now</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Placeholder cards
  const placeholders = Math.max(0, 6 - properties.length);
  for (let i = 0; i < placeholders; i++) {
    const ph = document.createElement('div');
    ph.className = 'property-card placeholder-card';
    ph.innerHTML = `
      <div class="card-image-wrap placeholder-img"><div class="placeholder-content"><span class="plus-icon">+</span><p>Coming soon</p></div></div>
      <div class="card-body">
        <div class="card-location">📍 Coming Soon</div>
        <h3 class="card-title">New Property</h3>
        <div class="card-footer"><div class="card-price">— <span>/night</span></div><button class="btn-book" disabled>Coming Soon</button></div>
      </div>`;
    grid.appendChild(ph);
  }
}

// =============================================
// STAR RATINGS
// =============================================
function getAverageRating(prop) {
  if (!prop.ratings || prop.ratings.length === 0) return 0;
  return prop.ratings.reduce((a, b) => a + b, 0) / prop.ratings.length;
}

function renderStarsDisplay(avg) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (avg >= i) stars += '<span class="star filled">★</span>';
    else if (avg >= i - 0.5) stars += '<span class="star half">★</span>';
    else stars += '<span class="star empty">★</span>';
  }
  return stars;
}

function openRatingModal(propertyId, bookingId, propertyName) {
  ratingPropertyId = propertyId;
  window._ratingBookingId = bookingId;
  selectedRating = 0;
  document.getElementById('ratingPropertyName').textContent = propertyName || '';
  updateStarSelector(0);
  document.getElementById('ratingModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRatingModal() {
  document.getElementById('ratingModal').classList.remove('open');
  document.body.style.overflow = '';
}

function updateStarSelector(rating) {
  document.querySelectorAll('.star-selector span').forEach((s, i) => {
    s.classList.toggle('active', i < rating);
  });
  selectedRating = rating;
}

async function submitRating() {
  if (selectedRating === 0) { showToast('Please select a star rating.', 'error'); return; }

  const btn = document.querySelector('#ratingModal .btn-submit');
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        booking_id: window._ratingBookingId,
        rating: selectedRating,
        comment: document.getElementById('ratingComment') ? document.getElementById('ratingComment').value : ''
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error, 'error');
      return;
    }

    closeRatingModal();
    showToast('Thank you for your review! ⭐', 'success');
    loadMyBookings();
    renderListings(); // refresh star ratings on listing cards

  } catch (err) {
    showToast('Error submitting review. Please try again.', 'error');
  } finally {
    btn.textContent = 'Submit Rating';
    btn.disabled = false;
  }
}

// =============================================
// MOBILE MENU
// =============================================
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
  document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

// =============================================
// PAGE NAVIGATION
// =============================================
function showPage(pageId, clickedLink) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  if (clickedLink) clickedLink.classList.add('active');
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) toggleMobileMenu();
  if (pageId === 'bookings') loadMyBookings();
  return false;
}

// =============================================
// DARK / LIGHT MODE
// =============================================
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeIcon').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('themeLabel').textContent = isDark ? 'Dark Mode' : 'Light Mode';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

(function () {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (icon) icon.textContent = '☀️';
    if (label) label.textContent = 'Light Mode';
  }
})();

// =============================================
// AUTH MODAL
// =============================================
function openAuthModal(tab) {
  document.getElementById('authModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  switchAuthTab(tab || 'login');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('authError').textContent = '';
}

function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display  = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('authError').textContent = '';
}

async function submitLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginSubmitBtn');

  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    const res  = await fetch(`${API_URL}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.unverified) {
        document.getElementById('authError').innerHTML = `
          ${data.error}<br>
          <a href="javascript:void(0)" onclick="resendVerification('${document.getElementById('loginEmail').value}')"
             style="color:#7a9b35;font-weight:500">Resend verification email</a>
        `;
      } else {
        document.getElementById('authError').textContent = data.error;
      }
      return;
    }

    setAuth(data.token, data.user);
    closeAuthModal();

    // Show verified success message if redirected from email
    if (window._justVerified) {
      window._justVerified = false;
      showToast('Email verified successfully! Welcome to Bucketlist Staycations.', 'success', 5000);
    }

    // If there was a pending booking, continue it
    if (window._pendingBooking) {
      const { id, name } = window._pendingBooking;
      window._pendingBooking = null;
      openBooking(id, name);
    }

  } catch (err) {
    document.getElementById('authError').textContent = 'Connection error. Is the server running?';
  } finally {
    btn.textContent = 'Login';
    btn.disabled = false;
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const full_name = document.getElementById('registerName').value;
  const email     = document.getElementById('registerEmail').value;
  const phone     = document.getElementById('registerPhone').value;
  const password  = document.getElementById('registerPassword').value;
  const btn       = document.getElementById('registerSubmitBtn');

  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const res  = await fetch(`${API_URL}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ full_name, email, phone, password })
    });
    const data = await res.json();

    if (!res.ok) {
      document.getElementById('authError').textContent = data.error;
      return;
    }

    // Use the backend's actual message (it tells us whether verification is needed),
    // then drop the user on the login tab with their email prefilled.
    showToast(data.message || 'Account created! You can now log in.', 'success', 6000);
    switchAuthTab('login');
    document.getElementById('loginEmail').value = email;

  } catch (err) {
    document.getElementById('authError').textContent = 'Connection error. Is the server running?';
  } finally {
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
}

// =============================================
// GALLERY MODAL
// =============================================
function openGallery(propertyId) {
  currentGalleryProperty = properties.find(p => p.id === propertyId) || properties[propertyId];
  currentPhotoIndex = 0;
  document.getElementById('galleryTitle').textContent = currentGalleryProperty.name + ' — Gallery';
  renderGallery();
  document.getElementById('galleryModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderGallery() {
  const imgs = currentGalleryProperty.images;
  const mainImg = document.getElementById('galleryMainImg');
  mainImg.src = imgs[currentPhotoIndex];
  mainImg.alt = currentGalleryProperty.name + ' photo ' + (currentPhotoIndex + 1);
  const thumbsContainer = document.getElementById('galleryThumbs');
  thumbsContainer.innerHTML = '';
  imgs.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.loading = 'lazy';
    img.className = 'gallery-thumb' + (i === currentPhotoIndex ? ' active' : '');
    img.onclick = () => { currentPhotoIndex = i; renderGallery(); };
    thumbsContainer.appendChild(img);
  });
}

function prevPhoto() {
  currentPhotoIndex = (currentPhotoIndex - 1 + currentGalleryProperty.images.length) % currentGalleryProperty.images.length;
  renderGallery();
}

function nextPhoto() {
  currentPhotoIndex = (currentPhotoIndex + 1) % currentGalleryProperty.images.length;
  renderGallery();
}

function closeGallery() {
  document.getElementById('galleryModal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeGalleryOutside(e) {
  if (e.target === document.getElementById('galleryModal')) closeGallery();
}

// =============================================
// BOOKING MODAL
// =============================================
function openBooking(propertyId, propertyName) {
  // Check if user is logged in
  if (!getToken()) {
    window._pendingBooking = { id: propertyId, name: propertyName };
    openAuthModal('login');
    return;
  }

  currentBookingProperty = properties.find(p => p.id === propertyId) || properties[propertyId];
  document.getElementById('bookingPropertyName').textContent = propertyName;
  document.getElementById('bookingModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('checkIn').min  = today;
  document.getElementById('checkOut').min = today;

  // Reset to a clean step 1 (step 4 is the M-Pesa waiting/result screen)
  if (_paymentPollTimer) { clearInterval(_paymentPollTimer); _paymentPollTimer = null; }
  document.getElementById('step1').style.display = 'block';
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step4').style.display = 'none';
  document.getElementById('paymentResult').style.display = 'none';
  document.getElementById('paymentWaiting').style.display = 'block';
  document.getElementById('bookingSummary').style.display = 'none';
  document.getElementById('checkIn').value  = '';
  document.getElementById('checkOut').value = '';
  document.getElementById('ratePerNight').textContent = 'KES ' + currentBookingProperty.pricePerNight.toLocaleString();
  window._bookingTotal  = 0;
  window._bookingNights = 0;
  window._bookingId     = null;
}

function closeBooking() {
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow = '';
  if (_paymentPollTimer) { clearInterval(_paymentPollTimer); _paymentPollTimer = null; }
}

function closeBookingOutside(e) {
  if (e.target === document.getElementById('bookingModal')) closeBooking();
}

function calculateTotal() {
  const checkIn   = document.getElementById('checkIn').value;
  const checkOutEl = document.getElementById('checkOut');
  // Keep check-out from preceding check-in
  if (checkIn) checkOutEl.min = checkIn;
  const checkOut = checkOutEl.value;
  if (!checkIn || !checkOut) return;

  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  if (nights <= 0) {
    showToast('Check-out must be after check-in.', 'error');
    checkOutEl.value = '';
    document.getElementById('bookingSummary').style.display = 'none';
    return;
  }

  const total = nights * currentBookingProperty.pricePerNight;
  document.getElementById('nightsCount').textContent = nights + (nights > 1 ? ' nights' : ' night');
  document.getElementById('totalAmount').textContent  = 'KES ' + total.toLocaleString();
  document.getElementById('bookingSummary').style.display = 'block';
  window._bookingTotal  = total;
  window._bookingNights = nights;
}

async function goToOptions() {
  const checkIn  = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  if (!checkIn || !checkOut || !window._bookingTotal) {
    showToast('Please select your check-in and check-out dates first.', 'error');
    return;
  }

  const btn = document.getElementById('continueBtn');
  btn.textContent = 'Checking availability...';
  btn.disabled = true;

  try {
    // Check availability with backend
    const res = await fetch(
      `${API_URL}/api/bookings/availability?property_id=${currentBookingProperty.id}&check_in=${checkIn}&check_out=${checkOut}`
    );
    const data = await res.json();

    if (!data.available) {
      showToast('Sorry, this property is already booked for these dates. Please choose different dates.', 'error', 5000);
      btn.textContent = 'Continue →';
      btn.disabled = false;
      return;
    }

    // Create booking in backend
    const bookingRes = await fetch(`${API_URL}/api/bookings`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        property_id:  currentBookingProperty.id.toString(),
        check_in:     checkIn,
        check_out:    checkOut,
        guests_count: parseInt(document.getElementById('guestCount').value)
      })
    });

    const bookingData = await bookingRes.json();

    if (!bookingRes.ok) {
      showToast(bookingData.error, 'error');
      return;
    }

    window._bookingId = bookingData.booking.id;

    // Show step 2 — choose payment method
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    document.getElementById('summaryProperty').textContent = currentBookingProperty.name;
    document.getElementById('summaryCheckin').textContent  = checkIn;
    document.getElementById('summaryCheckout').textContent = checkOut;
    document.getElementById('summaryNights').textContent   = window._bookingNights + (window._bookingNights > 1 ? ' nights' : ' night');
    document.getElementById('summaryTotal').textContent    = 'KES ' + window._bookingTotal.toLocaleString();

  } catch (err) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    btn.textContent = 'Continue →';
    btn.disabled = false;
  }
}

function goBack() {
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step1').style.display = 'block';
}

function goBackToOptions() {
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step2').style.display = 'block';
}

// Pay with M-Pesa
function payWithMpesa() {
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = 'block';
  document.getElementById('payAmount').textContent = 'KES ' + window._bookingTotal.toLocaleString();
}

async function submitMpesaPayment() {
  const phone = document.getElementById('mpesaPhone').value.trim();
  if (!phone) { showToast('Please enter your M-Pesa phone number.', 'error'); return; }

  const btn = document.getElementById('payNowBtn');
  btn.textContent = 'Sending STK Push...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/api/payments/initiate`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        booking_id:   window._bookingId,
        phone_number: phone
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error, 'error', 5000);
      return;
    }

    // Move to the live waiting screen and start polling for confirmation
    showToast('STK Push sent to ' + phone + '. Enter your M-Pesa PIN.', 'info', 5000);
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step4').style.display = 'block';
    document.getElementById('paymentResult').style.display = 'none';
    document.getElementById('paymentWaiting').style.display = 'block';
    pollPaymentStatus(window._bookingId);

  } catch (err) {
    showToast('Payment error. Please try again.', 'error');
  } finally {
    btn.textContent = 'Pay Now via M-Pesa';
    btn.disabled = false;
  }
}

// Poll the backend until the payment succeeds, fails, or times out
function pollPaymentStatus(bookingId) {
  const startedAt = Date.now();
  const TIMEOUT_MS = 90000; // stop after 90s
  if (_paymentPollTimer) clearInterval(_paymentPollTimer);

  _paymentPollTimer = setInterval(async () => {
    if (Date.now() - startedAt > TIMEOUT_MS) {
      clearInterval(_paymentPollTimer);
      _paymentPollTimer = null;
      showPaymentResult('timeout');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/payments/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) return; // 404 = no record yet, keep waiting
      const p = await res.json();
      if (p.status === 'success') {
        clearInterval(_paymentPollTimer); _paymentPollTimer = null;
        showPaymentResult('success');
      } else if (p.status === 'failed') {
        clearInterval(_paymentPollTimer); _paymentPollTimer = null;
        showPaymentResult('failed');
      }
    } catch (err) {
      // network blip — keep polling
    }
  }, 4000);
}

function showPaymentResult(state) {
  document.getElementById('paymentWaiting').style.display = 'none';
  const box = document.getElementById('paymentResult');
  box.style.display = 'block';

  if (state === 'success') {
    box.className = 'payment-result success';
    box.innerHTML = `
      <div class="result-icon">✅</div>
      <h3>Payment Confirmed!</h3>
      <p>Your booking is confirmed and a confirmation email is on its way.</p>
      <button class="btn-submit" style="width:100%" onclick="finishPayment()">View My Bookings</button>`;
    showToast('Payment confirmed! 🎉', 'success', 5000);
  } else if (state === 'failed') {
    box.className = 'payment-result failed';
    box.innerHTML = `
      <div class="result-icon">❌</div>
      <h3>Payment Failed</h3>
      <p>The payment was cancelled or didn't go through. You can try again.</p>
      <button class="btn-submit" style="width:100%" onclick="retryPayment()">Try Again</button>`;
  } else {
    box.className = 'payment-result';
    box.innerHTML = `
      <div class="result-icon">⏳</div>
      <h3>Still waiting…</h3>
      <p>We haven't received confirmation yet. If you completed the payment, it will appear in My Bookings shortly.</p>
      <button class="btn-submit" style="width:100%" onclick="finishPayment()">Go to My Bookings</button>`;
  }
}

function finishPayment() {
  if (_paymentPollTimer) { clearInterval(_paymentPollTimer); _paymentPollTimer = null; }
  closeBooking();
  showPage('bookings', document.getElementById('bookingsNav'));
  loadMyBookings();
}

function retryPayment() {
  document.getElementById('step4').style.display = 'none';
  document.getElementById('step3').style.display = 'block';
}

// Backup options
function bookViaWhatsApp() {
  const checkIn  = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  const guests   = document.getElementById('guestCount').value;
  const prop     = currentBookingProperty;
  const message  = encodeURIComponent(
    "Hi! I'd like to book *" + prop.name + "*.\n\n" +
    "📅 Check-in: " + checkIn + "\n" +
    "📅 Check-out: " + checkOut + "\n" +
    "👥 Guests: " + guests + "\n" +
    "🌙 Nights: " + window._bookingNights + "\n" +
    "💰 Total: KES " + window._bookingTotal.toLocaleString() + "\n\n" +
    "Please confirm availability."
  );
  window.open("https://wa.me/" + prop.whatsapp + "?text=" + message, '_blank');
  closeBooking();
}

function bookViaAirbnb() {
  window.open(currentBookingProperty.airbnbUrl, '_blank');
  closeBooking();
}

// =============================================
// MY BOOKINGS PAGE
// =============================================
async function loadMyBookings() {
  const container = document.getElementById('bookingsList');
  if (!container) return;

  if (!getToken()) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Please log in to view your bookings.</p>
        <button class="btn-submit" onclick="openAuthModal('login')">Login</button>
      </div>`;
    return;
  }

  container.innerHTML = bookingSkeletonHTML(2);

  try {
    const res  = await fetch(`${API_URL}/api/bookings/my`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();

    if (!res.ok) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Couldn't load your bookings.</p>
          <button class="btn-submit" onclick="loadMyBookings()">Try Again</button>
        </div>`;
      return;
    }

    if (data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>You have no bookings yet.</p>
          <button class="btn-submit" onclick="showPage('listings', document.querySelector('.nav-link'))">Browse Properties</button>
        </div>`;
      return;
    }

    container.innerHTML = data.map(b => `
      <div class="booking-card">
        <div class="booking-card-img">
          <img src="${b.property_image || 'images/IMG_0039.jpg'}" alt="${b.property_name}" loading="lazy" />
        </div>
        <div class="booking-card-body">
          <h3>${b.property_name}</h3>
          <p class="booking-location">📍 ${b.property_location}</p>
          <div class="booking-dates">
            <span>📅 ${b.check_in} → ${b.check_out}</span>
            <span>🌙 ${b.nights} night${b.nights > 1 ? 's' : ''}</span>
          </div>
          <div class="booking-footer">
            <span class="booking-amount">KES ${parseFloat(b.total_amount).toLocaleString()}</span>
            <span class="booking-status status-${b.status}">${b.status.toUpperCase()}</span>
          </div>
          ${b.status === 'pending' ? `
            <button class="btn-cancel" onclick="cancelBooking('${b.id}')">Cancel Booking</button>
          ` : ''}
          ${b.status === 'confirmed' || b.status === 'completed' ? `
            <button class="btn-rate" onclick="openRatingModal('${b.property_id}', '${b.id}', '${b.property_name}')" style="margin-top:0.5rem">Leave a Review ★</button>
          ` : ''}
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Connection error. The server may be waking up — please try again.</p>
        <button class="btn-submit" onclick="loadMyBookings()">Try Again</button>
      </div>`;
  }
}

async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;

  try {
    const res  = await fetch(`${API_URL}/api/bookings/${bookingId}/cancel`, {
      method:  'PATCH',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();

    if (!res.ok) { showToast(data.error, 'error'); return; }

    showToast('Booking cancelled successfully.', 'success');
    loadMyBookings();
  } catch (err) {
    showToast('Error cancelling booking.', 'error');
  }
}

// =============================================
// RESEND VERIFICATION
// =============================================
async function resendVerification(email) {
  try {
    const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    showToast(data.message || data.error, data.message ? 'success' : 'error', 5000);
  } catch (err) {
    showToast('Error sending email. Please try again.', 'error');
  }
}

// =============================================
// FORGOT PASSWORD
// =============================================
function showForgotPassword() {
  const email = document.getElementById('loginEmail').value;
  closeAuthModal();
  document.getElementById('forgotEmail').value = email || '';
  document.getElementById('forgotError').textContent = '';
  document.getElementById('forgotModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeForgotModal() {
  document.getElementById('forgotModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function submitForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  const btn = document.getElementById('forgotSubmitBtn');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    closeForgotModal();
    showToast(data.message || data.error || 'If that email exists, a reset link has been sent.', 'success', 5000);
  } catch (err) {
    showToast('Error sending reset email. Please try again.', 'error');
  } finally {
    btn.textContent = 'Send Reset Link';
    btn.disabled = false;
  }
}

// Check URL for email verification success
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('verified') === 'true') {
    window._justVerified = true;
    openAuthModal('login');
    document.getElementById('authError').style.color = '#7a9b35';
    document.getElementById('authError').textContent = '✅ Email verified! Please log in.';
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
  }
})();

// =============================================
// KEYBOARD NAVIGATION
// =============================================
document.addEventListener('keydown', function (e) {
  if (document.getElementById('galleryModal').classList.contains('open')) {
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft')  prevPhoto();
    if (e.key === 'Escape')     closeGallery();
  }
  if (document.getElementById('bookingModal').classList.contains('open') && e.key === 'Escape') closeBooking();
  if (document.getElementById('authModal') && document.getElementById('authModal').classList.contains('open') && e.key === 'Escape') closeAuthModal();
  if (document.getElementById('ratingModal') && document.getElementById('ratingModal').classList.contains('open') && e.key === 'Escape') closeRatingModal();
  if (document.getElementById('forgotModal') && document.getElementById('forgotModal').classList.contains('open') && e.key === 'Escape') closeForgotModal();
});

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Clear old localStorage ratings — ratings now come from backend
  properties.forEach(p => localStorage.removeItem('ratings_' + p.id));
  await renderListings();
  updateAuthUI();

  // Deep link from a per-property page: index.html?book=<property-id>
  const bookId = new URLSearchParams(window.location.search).get('book');
  if (bookId) {
    const prop = properties.find(p => p.id === bookId);
    if (prop) {
      openBooking(prop.id, prop.name);
      history.replaceState({}, '', window.location.pathname); // clean the URL
    }
  }
});