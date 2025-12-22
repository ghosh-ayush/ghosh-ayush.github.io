/*==================== MENU SHOW Y HIDDEN ====================*/
const navMenu = document.getElementById("nav-menu"),
  navToggle = document.getElementById("nav-toggle"),
  navClose = document.getElementById("nav-close");

/*===== MENU SHOW =====*/
/* Validate if constant exists */
if (navToggle) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.add("show-menu");
  });
}

/*===== MENU HIDDEN =====*/
/* Validate if constant exists */
if (navClose) {
  navClose.addEventListener("click", () => {
    navMenu.classList.remove("show-menu");
  });
}

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll(".nav__link");

function linkAction() {
  const navMenu = document.getElementById("nav-menu");
  // When we click on each nav__link, we remove the show-menu class
  navMenu.classList.remove("show-menu");
}
navLink.forEach((n) => n.addEventListener("click", linkAction));

/*==================== ACCORDION SKILLS ====================*/
const skillsContent = document.getElementsByClassName("skills__content"),
  skillsHeader = document.querySelectorAll(".skills__header");

function toggleSkills() {
  let itemClass = this.parentNode.className;

  for (i = 0; i < skillsContent.length; i++) {
    skillsContent[i].className = "skills__content skills__close";
  }
  if (itemClass === "skills__content skills__close") {
    this.parentNode.className = "skills__content skills__open";
  }
}

skillsHeader.forEach((el) => {
  el.addEventListener("click", toggleSkills);
});

/*==================== QUALIFICATION TABS ====================*/
const tabs = document.querySelectorAll("[data-target]"),
  tabContents = document.querySelectorAll("[data-content]");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = document.querySelector(tab.dataset.target);

    tabContents.forEach((tabContent) => {
      tabContent.classList.remove("qualification__active");
    });
    target.classList.add("qualification__active");

    tabs.forEach((tab) => {
      tab.classList.remove("qualification__active");
    });
    tab.classList.add("qualification__active");
  });
});

/*==================== SERVICES MODAL ====================*/
const modalViews = document.querySelectorAll(".services__modal"),
  modalBtns = document.querySelectorAll(".services__button"),
  modalCloses = document.querySelectorAll(".services__modal-close");

let modal = function (modalClick) {
  modalViews[modalClick].classList.add("active-modal");
};

modalBtns.forEach((modalBtn, i) => {
  modalBtn.addEventListener("click", () => {
    modal(i);
  });
});

modalCloses.forEach((modalClose) => {
  modalClose.addEventListener("click", () => {
    modalViews.forEach((modalView) => {
      modalView.classList.remove("active-modal");
    });
  });
});

/*==================== PORTFOLIO SWIPER  ====================*/
let swiperPortfolio = new Swiper(".portfolio__container", {
  cssMode: true,
  loop: true,

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },

  /* mousewheel: true,
  keyboard: true, */
});

/*==================== TESTIMONIAL ====================*/
// Testimonial Swiper is initialized later as `testimonialSwiper` (consolidated)

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll("section[id]");

function scrollActive() {
  const scrollY = window.pageYOffset;

  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 50;
    sectionId = current.getAttribute("id");

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document
        .querySelector(".nav__menu a[href*=" + sectionId + "]")
        .classList.add("active-link");
    } else {
      document
        .querySelector(".nav__menu a[href*=" + sectionId + "]")
        .classList.remove("active-link");
    }
  });
}
window.addEventListener("scroll", scrollActive);

/*==================== CHANGE BACKGROUND HEADER ====================*/
function scrollHeader() {
  const nav = document.getElementById("header");
  // When the scroll is greater than 200 viewport height, add the scroll-header class to the header tag
  if (this.scrollY >= 80) nav.classList.add("scroll-header");
  else nav.classList.remove("scroll-header");
}
window.addEventListener("scroll", scrollHeader);

/*==================== SHOW SCROLL UP ====================*/
function scrollUp() {
  const scrollUp = document.getElementById("scroll-up");
  // When the scroll is higher than 560 viewport height, add the show-scroll class to the a tag with the scroll-top class
  if (this.scrollY >= 560) scrollUp.classList.add("show-scroll");
  else scrollUp.classList.remove("show-scroll");
}
window.addEventListener("scroll", scrollUp);

/*==================== DARK LIGHT THEME ====================*/

const themeButton = document.getElementById("theme-button");
const darkTheme = "dark-theme";
const iconTheme = "uil-sun";

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () =>
  document.body.classList.contains(darkTheme) ? "dark" : "light";
  const getCurrentIcon = () =>
  themeButton.classList.contains(iconTheme) ? "uil-moon" : "uil-sun";

// We validate if the user previously chose a topic
if (selectedTheme) {
  // Apply the user's previously selected theme
  document.body.classList[selectedTheme === "dark" ? "add" : "remove"](
    darkTheme
  );
  if (themeButton)
    themeButton.classList[selectedIcon === "uil-moon" ? "add" : "remove"](
      iconTheme
    );
} else {
  // If no explicit preference stored, respect the OS-level color scheme
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add(darkTheme);
    if (themeButton) themeButton.classList.add(iconTheme);
  }
}

// Activate / deactivate the theme manually with the button
if (themeButton) themeButton.addEventListener("click", () => {
  // Add or remove the dark / icon theme
  document.body.classList.toggle(darkTheme);
  themeButton.classList.toggle(iconTheme);
  // We save the theme and the current icon that the user chose
  localStorage.setItem("selected-theme", getCurrentTheme());
  localStorage.setItem("selected-icon", getCurrentIcon());
});

/*--------------------------------------------------
  3) helper to build each .qualification__data
--------------------------------------------------*/
function makeEntry(item) {
  const isLeft = (typeof leftCats !== 'undefined' && leftCats && typeof leftCats.has === 'function') ? leftCats.has(item.category) : false;

  // choose dot-colour class
  const rounderClass =
    item.category === "leadership" || item.category === "projects"
      ? "rounder--lead"
      : item.category === "work" || item.category === "internship"
      ? "rounder--work"
      : "rounder--edu";                // degrees / certificates

  const htmlParts = [];

  htmlParts.push(`<div class="qualification__data">`);

  /* keep the empty cell for zig-zag layout when entry is on the right */
  if (!isLeft) {
    htmlParts.push(`<div></div>`);
  }

  // timeline column (dot + line)
  htmlParts.push(`
    <div>
      <span class="qualification__rounder ${rounderClass}"></span>
      <span class="qualification__line"></span>
    </div>
  `);

  // content column
  htmlParts.push(`
    <div>
      <h3 class="qualification__title">${item.title}</h3>
      <span class="qualification__subtitle">${item.subtitle}</span>
      <div class="qualification__calendar">
        <i class="uil uil-calendar-alt"></i> ${item.calendar}
      </div>
    </div>
  `);

  htmlParts.push(`</div>`);

  // inside makeEntry(item) …
  const bgColor =
  item.category === "leadership" || item.category === "projects"
    ? "var(--leader-clr)"
  : item.category === "work" || item.category === "internship"
    ? "var(--work-clr)"
  : "var(--degree-clr)";

  htmlParts.push(`
  <div>
    <span
      class="qualification__rounder ${rounderClass}"
      style="background-color: ${bgColor};"
    ></span>
    <span class="qualification__line"></span>
  </div>
  `);

  return htmlParts.join("");
}

// Skills tabs logic
const skillTabs     = document.querySelectorAll('.skills__button');
const skillPanels   = document.querySelectorAll('.skills__content');

skillTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // 1) deactivate all tabs + panels
    skillTabs.forEach(t => t.classList.remove('skills__active'));
    skillPanels.forEach(p => p.classList.remove('skills__active'));

    // 2) activate the clicked tab
    tab.classList.add('skills__active');

    // 3) show its corresponding panel
    const panel = document.querySelector(tab.dataset.target);
    panel.classList.add('skills__active');
  });
});

// 1) Initialize your testimonial Swiper instance
  const testimonialSwiper = new Swiper('.testimonial__container', {
  loop: true,
  grabCursor: true,
  spaceBetween: 48,
  pagination: {
    // use the pagination element that exists inside the testimonial container
    el: '.testimonial__container .swiper-pagination',
    clickable: true,
    dynamicBullets: true,
  },
  breakpoints: {
    568: { slidesPerView: 2 },
  },
});

// LinkedIn API fetch removed
// The site uses static screenshot testimonials included in `index.html` (packages/images/recomm*.png).
// Keeping the function would require server-side auth and secure tokens; avoid client-side tokens.
// If you want dynamic LinkedIn recommendations in future, implement a server-side proxy that
// exchanges OAuth tokens and returns sanitized recommendation data to the client.
