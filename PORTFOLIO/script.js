AOS.init({
    duration: 1200,
    once: false,
    offset: 150
});

particlesJS('particles-js', {
    particles: {
        number: {
            value: 120,
            density: { enable: true, value_area: 1000 }
        },
        color: { value: '#64ffda' },
        shape: {
            type: 'circle',
            stroke: { width: 0, color: '#000000' },
            polygon: { nb_sides: 5 }
        },
        opacity: {
            value: 0.6,
            random: true,
            anim: {
                enable: true,
                speed: 2,
                opacity_min: 0.2,
                sync: false
            }
        },
        size: {
            value: 4,
            random: true,
            anim: {
                enable: true,
                speed: 3,
                size_min: 0.2,
                sync: false
            }
        },
        line_linked: {
            enable: true,
            distance: 120,
            color: '#64ffda',
            opacity: 0.5,
            width: 1
        },
        move: {
            enable: true,
            speed: 4,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
            attract: { enable: true, rotateX: 700, rotateY: 1400 }
        }
    },
    interactivity: {
        detect_on: 'canvas',
        events: {
            onhover: { enable: true, mode: 'repulse' },
            onclick: { enable: true, mode: 'push' },
            resize: true
        },
        modes: {
            repulse: { distance: 120, duration: 0.5 },
            push: { particles_nb: 5 }
        }
    },
    retina_detect: true
});

gsap.registerPlugin(ScrollTrigger);

const animateSkillBars = () => {
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach(bar => {
        const progress = bar.getAttribute('data-progress');
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: bar,
                start: 'top 85%',
                end: 'bottom 15%',
                toggleActions: 'play none none reverse'
            }
        });
        tl.to(bar, {
            width: `${progress}%`,
            duration: 1.8,
            ease: 'power4.out',
            onStart: () => {
                bar.style.filter = 'brightness(1.3)';
            },
            onComplete: () => {
                gsap.to(bar, {
                    filter: 'brightness(1)',
                    duration: 0.4
                });
            }
        });
    });
};

const animateHero = () => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.glitch', {
        y: 120,
        opacity: 0,
        duration: 1.2,
        stagger: 0.3
    })
    .from('.cyberpunk-title', {
        y: 60,
        opacity: 0,
        duration: 1,
    }, '-=0.7')
    .from('.hero-description', {
        y: 40,
        opacity: 0,
        duration: 1,
    }, '-=0.5');
};

const createParallaxSections = () => {
    gsap.utils.toArray('.parallax-section').forEach(section => {
        const depth = section.dataset.depth || 0.3;
        gsap.to(section, {
            y: () => (ScrollTrigger.maxScroll(window) * depth),
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true
            }
        });
    });
};

class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.follower = document.querySelector('.cursor-follower');
        this.links = document.querySelectorAll('a, button, .clickable');
        this.pos = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        this.speed = 0.15;
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        this.links.forEach(link => {
            link.addEventListener('mouseenter', () => this.setState('hover'));
            link.addEventListener('mouseleave', () => this.setState('default'));
        });

        gsap.ticker.add(() => this.update());
    }

    setState(state) {
        if (state === 'hover') {
            gsap.to([this.cursor, this.follower], {
                scale: 1.7,
                duration: 0.4,
                ease: 'power3.out'
            });
        } else {
            gsap.to([this.cursor, this.follower], {
                scale: 1,
                duration: 0.4,
                ease: 'power3.out'
            });
        }
    }

    update() {
        this.pos.x += (this.mouse.x - this.pos.x) * this.speed;
        this.pos.y += (this.mouse.y - this.pos.y) * this.speed;

        gsap.set(this.cursor, {
            x: this.mouse.x,
            y: this.mouse.y
        });

        gsap.set(this.follower, {
            x: this.pos.x,
            y: this.pos.y
        });
    }
}

class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#_________';
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise(resolve => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 50);
            const end = start + Math.floor(Math.random() * 50);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += char;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CustomCursor();
    animateHero();
    animateSkillBars();
    createParallaxSections();

    const phrases = ['Node.js Developer', 'Express Expert', 'Web Developer','UI/UX Designer'];
    const scrambleText = document.querySelector('.cyberpunk-title');
    const fx = new TextScramble(scrambleText);
    let counter = 0;

    const next = () => {
        fx.setText(phrases[counter]).then(() => {
            setTimeout(next, 2500);
        });
        counter = (counter + 1) % phrases.length;
    };
    next();
});

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 300);
});