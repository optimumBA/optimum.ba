// Mobile menu toggle
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[role="button"][tabindex="0"]').forEach(function (control) {
    control.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); control.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
    });
  });
  var btn = document.getElementById("mobile-menu-btn");
  var menu = document.getElementById("mobile-menu");
  var iconHamburger = document.getElementById("icon-hamburger");
  var iconClose = document.getElementById("icon-close");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var opening = menu.classList.contains("hidden");
      menu.classList.toggle("hidden");
      btn.setAttribute("aria-expanded", String(opening));
      if (iconHamburger) iconHamburger.classList.toggle("hidden", opening);
      if (iconClose) iconClose.classList.toggle("hidden", !opening);
    });
  }

  // Slideshow
  var slides = document.querySelectorAll(".slide");
  if (slides.length > 0) {
    var showing = slides[0];
    var timer;

    function showSlide(slide) {
      slide.classList.add("show");
      slide.classList.remove("hide");
    }

    function hideSlide(slide) {
      slide.classList.add("hide");
      slide.classList.remove("show");
    }

    function nextSlide() {
      var idx = Array.from(slides).indexOf(showing);
      hideSlide(showing);
      idx = (idx + 1) % slides.length;
      showing = slides[idx];
      showSlide(showing);
    }

    function prevSlide() {
      var idx = Array.from(slides).indexOf(showing);
      hideSlide(showing);
      idx = (idx - 1 + slides.length) % slides.length;
      showing = slides[idx];
      showSlide(showing);
    }

    showSlide(showing);
    timer = setInterval(nextSlide, 5000);

    document.querySelectorAll(".next-slide-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        clearInterval(timer);
        nextSlide();
        timer = setInterval(nextSlide, 5000);
      });
    });

    document.querySelectorAll(".prev-slide-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        clearInterval(timer);
        prevSlide();
        timer = setInterval(nextSlide, 5000);
      });
    });
  }

  // In-place blog pagination
  var paginationControls = document.getElementById("pagination-controls");
  if (paginationControls) {
    paginationControls.addEventListener("click", function (e) {
      var li = e.target.closest("[data-page]");
      if (!li) return;
      var page = parseInt(li.dataset.page);

      // Update visible cards
      document.querySelectorAll("[data-blog-page]").forEach(function (el) {
        el.classList.toggle("hidden", parseInt(el.dataset.blogPage) !== page);
      });

      // Update active link
      document
        .querySelectorAll("#pagination-controls li")
        .forEach(function (el) {
          el.classList.toggle(
            "active-pagination-link",
            parseInt(el.dataset.page) === page,
          );
        });
    });
  }

  // TOC scroll spy
  var tocLinks = document.querySelectorAll(".table-of-contents li");
  if (tocLinks.length > 0) {
    // Collect all headings that have corresponding TOC anchors
    var headings = [];
    tocLinks.forEach(function (li) {
      var a = li.querySelector("a");
      if (a) {
        var id = a.getAttribute("href").replace("#", "");
        var el = document.getElementById(id);
        if (el) headings.push({ id: id, el: el, li: li });
      }
    });

    function updateActiveToc() {
      var scrollY = window.scrollY + 80;
      var active = headings[0];
      for (var i = 0; i < headings.length; i++) {
        if (
          headings[i].el.getBoundingClientRect().top + window.scrollY <=
          scrollY
        ) {
          active = headings[i];
        }
      }
      tocLinks.forEach(function (li) {
        li.classList.remove("toc-active");
      });
      if (active) active.li.classList.add("toc-active");
    }

    // Set first item active by default
    if (headings.length > 0) headings[0].li.classList.add("toc-active");
    window.addEventListener("scroll", updateActiveToc, { passive: true });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="/#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").replace("/", "");
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
        var menu = document.getElementById("mobile-menu");
        if (menu) { menu.classList.add("hidden"); if (btn) btn.setAttribute("aria-expanded", "false"); }
      }
    });
  });
});
