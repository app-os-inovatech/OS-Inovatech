// ==================== NAVEGAÇÃO MOBILE ====================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle menu mobile
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Fechar menu ao clicar em um link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ==================== SCROLL SUAVE ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const offsetTop = target.offsetTop - 70; // Compensar altura do header
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ==================== HEADER SCROLL EFFECT ====================
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Adicionar classe quando rolar
    if (currentScroll > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// ==================== BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ==================== ANIMAÇÕES AO SCROLL ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Elementos para animar
const animatedElements = document.querySelectorAll('.service-card, .product-card, .stat-card, .contact-card');

animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ==================== SCROLL INDICATOR ====================
const scrollIndicator = document.querySelector('.scroll-indicator');

if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const quemSomosSection = document.getElementById('quem-somos');
        if (quemSomosSection) {
            quemSomosSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ==================== CONTADOR ANIMADO PARA ESTATÍSTICAS ====================
const animateCounter = (element, target) => {
    const duration = 2000; // 2 segundos
    const start = 0;
    const increment = target / (duration / 16); // 60 FPS
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, 16);
};

// Observador para contadores
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const numberElement = entry.target.querySelector('.stat-number');
            const targetText = numberElement.textContent;
            const targetNumber = parseInt(targetText);
            
            if (!isNaN(targetNumber) && !entry.target.dataset.animated) {
                animateCounter(numberElement, targetNumber);
                entry.target.dataset.animated = 'true';
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-card').forEach(card => {
    statsObserver.observe(card);
});

// ==================== LOADER DE PÁGINA (OPCIONAL) ====================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ==================== PREVENIR COMPORTAMENTO PADRÃO DE LINKS EXTERNOS ====================
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', (e) => {
        // Links externos abrem em nova aba (comportamento padrão)
    });
});

// ==================== FORMULÁRIO DE CONTATO (SE HOUVER) ====================
const contactForms = document.querySelectorAll('form');

contactForms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Aqui você pode adicionar lógica para enviar o formulário
        // Por exemplo, usando fetch para enviar para um backend
        
        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        form.reset();
    });
});

// ==================== DETECÇÃO DE DISPOSITIVO MOBILE ====================
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
    document.body.classList.add('mobile-device');
}

// ==================== LAZY LOADING DE IMAGENS ====================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ==================== TOOLTIP PERSONALIZADO (OPCIONAL) ====================
const tooltipElements = document.querySelectorAll('[data-tooltip]');

tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = e.target.dataset.tooltip;
        document.body.appendChild(tooltip);

        const rect = e.target.getBoundingClientRect();
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        tooltip.style.left = rect.left + (rect.width - tooltip.offsetWidth) / 2 + 'px';
    });

    element.addEventListener('mouseleave', () => {
        const tooltip = document.querySelector('.custom-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    });
});

// ==================== CONSOLE LOG DE BOAS-VINDAS ====================
console.log('%c🏭 Inovaguil Manutenção', 'font-size: 20px; font-weight: bold; color: #FF6B00;');
console.log('%cSite carregado com sucesso!', 'font-size: 14px; color: #666;');
console.log('%cDesenvolvido com ❤️', 'font-size: 12px; color: #999;');

// ==================== ANALYTICS TRACKING (OPCIONAL) ====================
// Adicione seu código de tracking do Google Analytics ou similar aqui
// Exemplo:
// gtag('config', 'GA_MEASUREMENT_ID');

// ==================== PERFORMANCE MONITORING ====================
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Página carregada em ${pageLoadTime}ms`);
    });
}
