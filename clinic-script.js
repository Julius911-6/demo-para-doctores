/* =====================================================
   MedVita — Full-Screen Panel Navigation JS
   ===================================================== */

(function () {

    const TOTAL = 7;
    let current = 0;
    let isAnimating = false;
    let touchStartY = 0;

    // ── DOM References ──────────────────────────────
    const panels    = Array.from(document.querySelectorAll('.panel'));
    const dots      = Array.from(document.querySelectorAll('.side-dot'));
    const navbar    = document.getElementById('navbar');
    const arrowUp   = document.getElementById('arrow-up');
    const arrowDown = document.getElementById('arrow-down');
    const currentEl = document.getElementById('current-panel');
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');

    // ── Panel Navigation ────────────────────────────
    function goToPanel(index) {
        if (index === current || isAnimating) return;
        if (index < 0 || index >= TOTAL) return;

        isAnimating = true;
        const direction = index > current ? 1 : -1; // 1=down, -1=up
        const prev = current;

        // Exit current panel
        panels[prev].classList.remove('active');
        panels[prev].classList.add(direction > 0 ? 'exit-up' : 'exit-down');

        // Prepare next panel entry class
        panels[index].classList.add(direction > 0 ? 'from-below' : 'from-above');

        // Force reflow so transition fires
        void panels[index].offsetHeight;

        // Activate next panel
        panels[index].classList.remove('from-below', 'from-above');
        panels[index].classList.add('active');

        current = index;
        updateUI();

        // Cleanup after transition
        setTimeout(() => {
            panels[prev].classList.remove('exit-up', 'exit-down');
            isAnimating = false;
        }, 700);
    }

    function nextPanel() { goToPanel(current + 1); }
    function prevPanel() { goToPanel(current - 1); }

    // ── UI Updates ──────────────────────────────────
    function updateUI() {
        // Dots
        dots.forEach((d, i) => d.classList.toggle('active', i === current));

        // Counter
        currentEl.textContent = String(current + 1).padStart(2, '0');

        // Arrows
        arrowUp.disabled   = current === 0;
        arrowDown.disabled = current === TOTAL - 1;

        // Navbar style: solid on light panels (1, 3, 4, 6), transparent on dark/image
        const solidPanels = [1, 3, 4, 6];
        if (solidPanels.includes(current)) {
            navbar.classList.add('solid');
        } else {
            navbar.classList.remove('solid');
        }

        // Nav active link
        document.querySelectorAll('.nav-links a').forEach((a, i) => {
            a.classList.toggle('nav-active', i === current);
        });

        // Run counter animation on panel 0
        if (current === 0 && !countersRan) {
            animateCounters();
        }
    }

    // ── Keyboard Navigation ─────────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'PageDown') nextPanel();
        if (e.key === 'ArrowUp'   || e.key === 'PageUp')   prevPanel();
    });

    // ── Mouse Wheel Navigation ───────────────────────
    let wheelTimer = null;
    document.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (wheelTimer) return;
        if (e.deltaY > 30)  nextPanel();
        if (e.deltaY < -30) prevPanel();
        wheelTimer = setTimeout(() => { wheelTimer = null; }, 800);
    }, { passive: false });

    // ── Touch / Swipe Navigation ─────────────────────
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const deltaY = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(deltaY) < 50) return;
        if (deltaY > 0) nextPanel();
        else            prevPanel();
    }, { passive: true });

    // ── Hamburger ────────────────────────────────────
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
    });

    window.closeMobile = function () {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
    };

    // ── Parallax Hero ────────────────────────────────
    // Subtle parallax when on hero panel via mousemove
    const heroImg = document.getElementById('hero-img');
    document.addEventListener('mousemove', (e) => {
        if (current !== 0 || !heroImg) return;
        const xShift = ((e.clientX / window.innerWidth) - 0.5) * 15;
        const yShift = ((e.clientY / window.innerHeight) - 0.5) * 10;
        heroImg.style.transform = `scale(1.06) translate(${xShift}px, ${yShift}px)`;
    });

    // ── Animated Counters ────────────────────────────
    let countersRan = false;

    function animateCounters() {
        countersRan = true;
        document.querySelectorAll('.hstat-num').forEach(el => {
            const target = parseInt(el.dataset.target, 10);
            const dur = 2000;
            const start = performance.now();
            function tick(now) {
                const p = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.floor(eased * target).toLocaleString('es');
                if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }

    // ── Form Handling ────────────────────────────────
    // Set min date
    const dateInput = document.getElementById('f-date');
    if (dateInput) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        dateInput.min = d.toISOString().split('T')[0];
    }

    window.submitForm = function (e) {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        const txt = document.getElementById('btn-text');
        btn.disabled = true;
        txt.textContent = 'Enviando…';
        btn.style.opacity = '.75';

        setTimeout(() => {
            btn.disabled = false;
            txt.textContent = 'Confirmar Solicitud';
            btn.style.opacity = '1';
            e.target.reset();
            showToast();
        }, 1800);
    };

    function showToast() {
        const t = document.getElementById('toast');
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 4500);
    }

    // ── Expose globals ───────────────────────────────
    window.goToPanel  = goToPanel;
    window.nextPanel  = nextPanel;
    window.prevPanel  = prevPanel;

    // ── Init ─────────────────────────────────────────
    // Set all panels to initial state
    panels.forEach((p, i) => {
        p.classList.remove('active', 'exit-up', 'exit-down', 'from-below', 'from-above');
        if (i === 0) p.classList.add('active');
    });

    updateUI();
    animateCounters();

})();
