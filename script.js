// Nav adaptativo: el texto del menú cambia de color según la sección detrás del header
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const themedSections = Array.from(document.querySelectorAll('[data-nav-theme]'));
    if (!header || !themedSections.length) return;

    const CHECK_Y = 40;
    let ticking = false;

    const updateHeaderTheme = () => {
        let current = null;
        for (const sec of themedSections) {
            const rect = sec.getBoundingClientRect();
            if (rect.top <= CHECK_Y && rect.bottom > CHECK_Y) {
                current = sec;
                break;
            }
        }
        if (current) {
            header.classList.toggle('theme-light', current.dataset.navTheme === 'light');
        }
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeaderTheme);
            ticking = true;
        }
    }, { passive: true });

    updateHeaderTheme();
});

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            // Reusa "mega-open" (mismo fondo blanco sólido + texto oscuro
            // que ya usa el mega-menú de desktop) para que la barra del
            // header no se quede transparente mostrando el fondo detrás
            // mientras el desplegable de mobile está abierto.
            const header = document.querySelector('.header');
            if (header) header.classList.toggle('mega-open', navLinks.classList.contains('active'));
        });
    }

    // Close mobile menu when clicking a link
    const closeMobileMenu = () => {
        navLinks.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        navLinks.querySelectorAll('.has-mega.open').forEach(li => li.classList.remove('open'));
        const header = document.querySelector('.header');
        if (header) header.classList.remove('mega-open');
    };

    // En el panel móvil, el enlace de un elemento con submenú (Plataforma,
    // Soluciones, Compañía) abre y cierra su submenú en vez de saltar; los
    // enlaces de adentro sí navegan y cierran el panel.
    const mqNavPanel = window.matchMedia('(max-width: 768px)');
    document.querySelectorAll('.nav-links > li > a').forEach(link => {
        link.addEventListener('click', function(e) {
            const item = link.parentElement;
            if (mqNavPanel.matches && item.classList.contains('has-mega')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const wasOpen = item.classList.contains('open');
                navLinks.querySelectorAll('.has-mega.open').forEach(li => li.classList.remove('open'));
                item.classList.toggle('open', !wasOpen);
                return;
            }
            closeMobileMenu();
        });
    });
    document.querySelectorAll('.nav-links .mega-link').forEach(link => {
        link.addEventListener('click', () => { if (mqNavPanel.matches) closeMobileMenu(); });
    });
    mqNavPanel.addEventListener('change', () => { if (!mqNavPanel.matches) closeMobileMenu(); });

    // Los mega-menús son puramente CSS (:hover), así que un clic en un enlace
    // no los cierra por sí solo: el cursor sigue sobre el menú, que es fixed,
    // y se queda tapando la sección a la que se acaba de saltar. Forzamos el
    // cierre con una clase hasta que el mouse realmente se mueva fuera.
    //
    // El cierre se hace de forma centralizada (para TODOS los mega-menús a la
    // vez, no solo el que contiene el link) y no depende de que el :hover siga
    // vigente: si el clic dispara un scroll, el navegador a veces no vuelve a
    // evaluar el :hover del item aunque el mouse ya no esté ahí, y antes eso
    // dejaba el header transparente con el menú todavía abierto encima.
    const megaItems = document.querySelectorAll('.nav-item.has-mega');
    const header = document.querySelector('.header');

    // Al reactivar cada item, si el mouse sigue encima (se quedó quieto ahí
    // después del clic) NO lo reabrimos solo: esperamos a que de verdad salga
    // y vuelva a entrar. Si ya se movió, se reactiva de inmediato. Antes había
    // un timeout ciego que quitaba "mega-force-closed" aunque el mouse siguiera
    // sobre la palabra del menú (justo arriba del link en el que se dio clic),
    // y el :hover de CSS reabría el desplegable solo mientras el usuario ya
    // estaba viendo el panel de detalle más abajo.
    const rearmItem = (item) => {
        if (item.matches(':hover')) {
            item.addEventListener('mouseleave', () => item.classList.remove('mega-force-closed'), { once: true });
        } else {
            item.classList.remove('mega-force-closed');
        }
    };

    const forceCloseAllMega = () => {
        megaItems.forEach(item => item.classList.add('mega-force-closed'));
        if (header) header.classList.remove('mega-open');
        megaItems.forEach(item => setTimeout(() => rearmItem(item), 600));
    };

    megaItems.forEach(item => {
        // "a" a secas: incluye tanto el link subrayado de arriba (Plataforma,
        // Soluciones, Compañía) como los links de adentro del desplegable.
        item.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', forceCloseAllMega);
        });
    });

    // Mientras cualquier mega-menú está abierto, el header se pone blanco
    // sólido (como en Wonderful), sin importar el tema de la sección de fondo.
    if (header && megaItems.length) {
        const syncMegaOpen = () => {
            const anyOpen = Array.from(megaItems).some(item =>
                item.matches(':hover') && !item.classList.contains('mega-force-closed')
            );
            header.classList.toggle('mega-open', anyOpen);
        };
        megaItems.forEach(item => {
            item.addEventListener('mouseenter', syncMegaOpen);
            item.addEventListener('mouseleave', syncMegaOpen);
        });
    }

    // Pantallas de celular y tableta: las tarjetas se apilan y no hay mouse
    const mqMobile = window.matchMedia('(max-width: 992px)');
    const isMobile = () => mqMobile.matches;

    // Al cerrar un "Conocer más" se regresa a la tarjeta que lo abrió (no a la
    // parte de arriba de la lista), centrándola en pantalla. En celular el salto
    // es instantáneo: un desplazamiento animado se siente lento y se descuadra.
    const returnTo = (el) => {
        if (!el) return;
        const headerH = 80;
        const r = el.getBoundingClientRect();
        const avail = window.innerHeight - headerH;
        const offset = r.height >= avail ? 12 : (avail - r.height) / 2;
        const y = Math.max(0, window.scrollY + r.top - headerH - offset);
        window.scrollTo({ top: y, behavior: isMobile() ? 'instant' : 'smooth' });
    };

    // Apertura programada de un "Conocer más" lanzada desde un enlace del menú
    let pendingOpen = null;

    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const telefono = document.getElementById('telefono').value;
            const mensaje = document.getElementById('mensaje').value;

            // Create mailto link
            const subject = encodeURIComponent('Contacto desde sitio web - ' + nombre);
            const body = encodeURIComponent(
                'Nombre: ' + nombre + '\n' +
                'Email: ' + email + '\n' +
                'Teléfono: ' + telefono + '\n\n' +
                'Mensaje:\n' + mensaje
            );

            window.location.href = 'mailto:jvazquez@v2rcx.com.mx?subject=' + subject + '&body=' + body;

            // Mensaje en línea (un alert() bloquea la página, sobre todo en celular)
            const status = document.getElementById('formStatus');
            if (status) {
                status.textContent = 'Gracias por contactarnos. Se abrirá tu programa de correo para que envíes el mensaje.';
                status.hidden = false;
            }
        });
    }

    // Smooth scroll for anchor links (en celular el salto es instantáneo)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            // Una apertura pendiente de un enlace anterior no debe pisar este salto
            if (!this.hasAttribute('data-modal')) clearTimeout(pendingOpen);
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: isMobile() ? 'instant' : 'smooth'
                });
            }
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedCards = document.querySelectorAll('.plataforma-card, .diferenciador-item');
    animatedCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        card.style.transitionDelay = (index * 0.1) + 's';
        observer.observe(card);
    });

    // Casos carousel arrows
    const casosCarousel = document.getElementById('casosCarousel');
    const casosPrev = document.getElementById('casosPrev');
    const casosNext = document.getElementById('casosNext');
    if (casosCarousel && casosPrev && casosNext) {
        // Paso = distancia real entre dos tarjetas (ancho + gap), que cambia en celular
        const casoStep = () => {
            const slides = casosCarousel.querySelectorAll('.caso-slide');
            return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 340 + 24;
        };
        casosNext.addEventListener('click', () => {
            casosCarousel.scrollBy({ left: casoStep(), behavior: 'smooth' });
        });
        casosPrev.addEventListener('click', () => {
            casosCarousel.scrollBy({ left: -casoStep(), behavior: 'smooth' });
        });
    }

    // Rubros tabs
    const rubrosData = {
        ventas: {
            label: 'Ventas',
            desc: 'Convierte cada interacción en una oportunidad real de cierre, sin perder de vista en qué etapa está cada cliente.',
            image: 'assets/rubros/ventas.jpg'
        },
        atencion: {
            label: 'Atención al cliente',
            desc: 'Respuestas rápidas y consistentes en cada canal, sin perder el toque humano cuando de verdad se necesita.',
            image: 'assets/rubros/atencion.jpg'
        },
        inventario: {
            label: 'Inventario',
            desc: 'Visibilidad total entre ubicaciones, en tiempo real, sin depender de una llamada para saber qué hay disponible.',
            image: 'assets/rubros/inventario.jpg'
        },
        cumplimiento: {
            label: 'Cumplimiento',
            desc: 'Operación regulada sin fricción para tu equipo: la parte legal se resuelve dentro del mismo flujo de trabajo.',
            image: 'assets/rubros/cumplimiento.jpg'
        },
        marketing: {
            label: 'Marketing',
            desc: 'Campañas que llegan a quien de verdad importa, con datos reales de comportamiento detrás de cada envío.',
            image: 'assets/rubros/marketing.jpg'
        },
        analitica: {
            label: 'Analítica',
            desc: 'Decisiones con datos, no con corazonadas: cada indicador conectado a lo que realmente pasa en tu negocio.',
            image: 'assets/rubros/analitica.jpg'
        }
    };

    const rubrosTabs = document.querySelectorAll('.rubro-tab');
    const rubroImage = document.getElementById('rubroImage');
    const rubroLabel = document.getElementById('rubroLabel');
    const rubroDesc = document.getElementById('rubroDesc');
    const rubroModalBtn = document.getElementById('rubroModalBtn');
    const rubrosPanel = document.getElementById('rubrosPanel');

    const activarRubro = (key) => {
        const data = rubrosData[key];
        if (!data || !rubroImage || !rubroLabel || !rubroDesc) return;

        rubrosTabs.forEach(t => t.classList.toggle('active', t.dataset.rubro === key));
        rubroImage.style.backgroundImage = `url('${data.image}')`;
        rubroLabel.textContent = data.label;
        rubroDesc.textContent = data.desc;

        if (rubroModalBtn) {
            rubroModalBtn.dataset.modal = `rubro-${key}`;
        }
        if (rubrosPanel) {
            rubrosPanel.classList.remove('detail-open');
        }
    };

    rubrosTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            activarRubro(tab.dataset.rubro);
            // En celular la tarjeta queda debajo de los botones: si no se ve
            // completa, se lleva a la vista (con los botones a la vista si caben).
            if (window.matchMedia('(max-width: 992px)').matches && rubrosPanel) {
                const headerH = 80;
                const r = rubrosPanel.getBoundingClientRect();
                if (r.bottom > window.innerHeight - 8 || r.top < headerH) {
                    const fits = r.height + 16 <= window.innerHeight - headerH;
                    const y = fits
                        ? window.scrollY + r.bottom - window.innerHeight + 16
                        : window.scrollY + r.top - headerH - 10;
                    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
                }
            }
        });
    });

    // Enlaces del mega-menú "Soluciones": además de llevar a #rubros,
    // activan directamente la pestaña que corresponde.
    document.querySelectorAll('.mega-link[data-rubro]').forEach(link => {
        link.addEventListener('click', () => activarRubro(link.dataset.rubro));
    });

    // Contenido de "Conocer más" para las cuatro secciones. Solo Plataforma usa
    // la ventana emergente compartida; Soluciones, Casos y Servicios reutilizan
    // este mismo texto pero lo despliegan cada uno con su propia animación
    // dentro de su sección (ver más abajo).
    const modalData = {
        'plataforma-vision': {
            title: 'Visión general',
            body: `
                <p>AVC es una empresa de software que diseña e implementa soluciones de automatización inteligente para negocios con múltiples puntos de atención y venta. No partimos de una sola tecnología: combinamos automatización robótica de procesos (RPA) para tareas repetitivas, modelos de machine learning para predicción y clasificación, sistemas de reconocimiento y captura automática de datos, y modelos de lenguaje (LLM) para todo lo que requiere conversación. Cada proyecto arranca identificando qué combinación de estas piezas resuelve mejor el proceso real de tu negocio, no al revés.</p>
                <p>La atención conversacional es hoy la pieza más visible de lo que hacemos, la que un cliente nota primero cuando escribe y recibe una respuesta útil de inmediato. Pero detrás de esa respuesta hay procesos automatizados que capturan, clasifican, concilian y ejecutan, sin que alguien tenga que hacerlo manualmente cada vez que ocurre. La plataforma conecta esas capas entre sí: lo que se captura en una conversación alimenta el inventario, lo que se predice en el inventario alimenta las alertas de negocio, y lo que se identifica en cumplimiento queda trazado para cualquier auditoría.</p>
                <ul>
                    <li>Automatización robótica de procesos (RPA) para captura, validación y conciliación de datos repetitivos.</li>
                    <li>Modelos de machine learning para predicción de demanda y clasificación de oportunidades.</li>
                    <li>Modelos de lenguaje (LLM) y asistentes conversacionales para la atención en canales digitales.</li>
                    <li>Reconocimiento y extracción automática de información desde documentos e imágenes.</li>
                </ul>
            `
        },
        'plataforma-atencion': {
            title: 'Atención inteligente 24/7',
            body: `
                <p>La atención al cliente es la aplicación más visible de nuestros modelos de lenguaje, pero no se trata solo de contestar mensajes uno tras otro. El asistente identifica la intención detrás de cada conversación, reconoce cuándo un caso necesita el criterio de una persona real y escala automáticamente, agenda citas validando la disponibilidad real de tu equipo, y da seguimiento proactivo cuando un cliente pospone la conversación o deja de responder.</p>
                <p>Todo esto corre sobre la misma infraestructura de automatización que usamos en el resto de la plataforma. La información capturada en una conversación (nombre, preferencia de producto, presupuesto, objeciones) queda disponible de inmediato para el resto del proceso comercial, sin que tu equipo tenga que volver a preguntarla ni capturarla dos veces.</p>
                <ul>
                    <li>Disponible en los canales digitales donde tu cliente ya te escribe.</li>
                    <li>Escala a una persona real cuando la conversación lo amerita, sin fricción.</li>
                    <li>La información capturada alimenta automáticamente el resto del proceso comercial.</li>
                </ul>
            `
        },
        'plataforma-conocimiento': {
            title: 'Conocimiento confiable',
            body: `
                <p>Un modelo de lenguaje sin una fuente de información confiable improvisa, y en un negocio eso significa prometer algo que no existe o dar un dato equivocado. Por eso cada respuesta se construye a partir de tu propio catálogo, tu documentación y tus reglas de negocio, nunca del conocimiento general del modelo. Usamos recuperación de información (RAG) para conectar al asistente con esa base de conocimiento en tiempo real.</p>
                <p>Mantener esa base actualizada suele ser el trabajo manual más pesado de cualquier proyecto de este tipo. Por eso combinamos la recuperación de información con reconocimiento automático de documentos: cuando tu catálogo cambia, el sistema puede leer e interpretar esos cambios sin que alguien tenga que transcribirlos a mano.</p>
                <ul>
                    <li>Reduce el riesgo de dar información incorrecta o desactualizada.</li>
                    <li>Se actualiza junto con tu catálogo y tu documentación real.</li>
                    <li>Una sola fuente de verdad para todos los canales y todos los procesos.</li>
                </ul>
            `
        },
        'plataforma-visibilidad': {
            title: 'Visibilidad y predicción',
            body: `
                <p>Aquí es donde entran con más fuerza los modelos de machine learning. Seguimos el embudo completo, del primer contacto al cierre, y entrenamos modelos con el histórico real de cada sucursal para anticipar la demanda antes de que se convierta en un problema de inventario o de capacidad de atención. No se trata de reportar lo que ya pasó, sino de anticipar lo que viene.</p>
                <p>Cada modelo se valida contra una línea base simple antes de considerarse listo: si un modelo más complejo no supera de forma consistente a un pronóstico sencillo basado en el histórico, no se pone en producción solo porque suena más sofisticado. La meta es un indicador confiable, no el algoritmo más llamativo.</p>
                <ul>
                    <li>Modelos de predicción de demanda entrenados con tu propio histórico, no con supuestos genéricos.</li>
                    <li>Indicadores por sucursal, por canal y por vendedor, reunidos en un solo lugar.</li>
                    <li>Alertas automáticas cuando un indicador se desvía de lo esperado.</li>
                </ul>
            `
        },
        'plataforma-inventario': {
            title: 'Inventario conectado',
            body: `
                <p>Detrás de la visibilidad de inventario hay procesos de automatización que concilian y actualizan existencias entre sucursales, muchas veces a partir de fuentes que llegan en formatos distintos: correos, hojas de cálculo, reportes escaneados. Ahí es donde entra el reconocimiento automático de datos: en vez de que alguien capture manualmente cada movimiento, el sistema lo extrae, lo valida contra reglas de negocio y lo concilia.</p>
                <p>El resultado es que el producto correcto queda visible en la sucursal correcta, en el momento correcto, con reglas claras para decidir qué existencia ofrecer primero cuando hay más de una opción disponible entre ubicaciones.</p>
                <ul>
                    <li>Conciliación automática de inventario entre sucursales.</li>
                    <li>Reglas de negocio para decidir qué producto ofrecer primero.</li>
                    <li>Extracción automática de datos desde correos y documentos, sin captura manual.</li>
                </ul>
            `
        },
        'plataforma-cumplimiento': {
            title: 'Cumplimiento integrado',
            body: `
                <p>El cumplimiento regulatorio suele tratarse como un trámite aparte, separado de la operación diaria, que detiene la venta mientras alguien llena un formulario. Nosotros lo integramos como un proceso automatizado más dentro del mismo flujo de trabajo: identificación del cliente, generación de expedientes, y clasificación de cada operación según el umbral que corresponda.</p>
                <p>Toda esa información queda trazada de forma automática, lista para cualquier auditoría, sin que tu equipo comercial tenga que interrumpir la atención al cliente para capturarla por separado.</p>
                <ul>
                    <li>Identificación y expedientes generados automáticamente.</li>
                    <li>Clasificación de operaciones según el umbral regulatorio correspondiente.</li>
                    <li>Trazabilidad completa, lista para auditoría, sin procesos manuales paralelos.</li>
                </ul>
            `
        },
        'rubro-ventas': {
            title: 'Ventas',
            body: `
                <p>Cada conversación, cada visita y cada cotización quedan registradas en un mismo embudo, de principio a fin. El sistema identifica automáticamente la intención de compra en cada interacción, agenda citas validando la disponibilidad real de tu equipo, y da seguimiento proactivo cuando un cliente deja de responder, en vez de perder esa oportunidad en silencio.</p>
                <p>Tu equipo comercial ve en un solo lugar en qué etapa está cada cliente y qué acción sigue, con datos que vienen de la conversación, del catálogo y del histórico de compra, no de una hoja de cálculo aparte que alguien tiene que actualizar a mano.</p>
                <ul>
                    <li>Identifica automáticamente la intención de compra en cada conversación.</li>
                    <li>Agenda citas validando la disponibilidad real de tu equipo.</li>
                    <li>Da seguimiento proactivo cuando un cliente deja de responder.</li>
                </ul>
            `
        },
        'rubro-atencion': {
            title: 'Atención al cliente',
            body: `
                <p>La atención consistente entre canales es uno de los puntos donde más se pierde a un cliente: preguntas repetidas, respuestas contradictorias, esperas largas. El asistente conversacional resuelve las preguntas frecuentes con tu propio catálogo como fuente de información, reconoce al cliente sin importar por qué canal digital escriba, y deriva a una persona real cuando la conversación de verdad lo necesita.</p>
                <p>El objetivo no es reemplazar a tu equipo de atención, sino que cada persona dedique su tiempo a los casos que realmente requieren su criterio, mientras lo repetitivo se resuelve solo.</p>
                <ul>
                    <li>Reconoce al cliente sin importar por qué canal digital escriba.</li>
                    <li>Resuelve preguntas frecuentes con tu propio catálogo como fuente.</li>
                    <li>Deriva a una persona real cuando la conversación lo amerita.</li>
                </ul>
            `
        },
        'rubro-inventario': {
            title: 'Inventario',
            body: `
                <p>Saber qué hay disponible, y dónde, sin tener que llamar entre sucursales para confirmarlo. Procesos de automatización concilian el inventario entre ubicaciones a partir de las fuentes que ya usas (correos, reportes, sistemas internos), y reglas de negocio definidas por tu equipo deciden qué existencia ofrecer primero cuando hay más de una opción.</p>
                <p>Cuando un producto está por agotarse, el sistema genera una alerta automática, en vez de que alguien lo note hasta que ya es tarde para reaccionar.</p>
                <ul>
                    <li>Consulta existencias por sucursal al instante, sin llamadas cruzadas.</li>
                    <li>Reglas automáticas para decidir qué existencia ofrecer primero.</li>
                    <li>Alertas cuando un producto está por agotarse.</li>
                </ul>
            `
        },
        'rubro-cumplimiento': {
            title: 'Cumplimiento',
            body: `
                <p>La parte regulatoria de una operación no tiene por qué ser un cuello de botella. Identificación del cliente, generación de expedientes y clasificación de cada operación según el umbral correspondiente ocurren dentro del mismo flujo de trabajo que ya usa tu equipo, no en un sistema aparte que alguien tiene que revisar por separado.</p>
                <p>Toda la trazabilidad queda lista para una auditoría en cualquier momento, sin que tu equipo comercial tenga que detener la atención al cliente para llenar un formulario adicional.</p>
                <ul>
                    <li>Identificación y expedientes generados automáticamente.</li>
                    <li>Clasificación de operaciones según el umbral que corresponda.</li>
                    <li>Trazabilidad completa para cualquier auditoría.</li>
                </ul>
            `
        },
        'rubro-marketing': {
            title: 'Marketing',
            body: `
                <p>Las campañas funcionan mejor cuando se dirigen a quien de verdad está listo para responder, no a toda tu base de contactos por igual. Segmentamos por intención real, con datos de comportamiento que vienen de las conversaciones y del histórico de compra, no solo por criterios demográficos genéricos.</p>
                <p>Desde el mismo panel se pueden enviar mensajes de difusión masiva a los segmentos correctos, y el sistema reactiva automáticamente a los clientes que se enfriaron, sin que tu equipo de marketing tenga que revisar manualmente quién dejó de responder.</p>
                <ul>
                    <li>Segmentación por intención real, no solo por datos demográficos.</li>
                    <li>Mensajes de difusión masiva desde el mismo panel.</li>
                    <li>Reactivación automática de clientes que se enfriaron.</li>
                </ul>
            `
        },
        'rubro-analitica': {
            title: 'Analítica',
            body: `
                <p>Decisiones con datos, no con corazonadas. Cada indicador de negocio (leads atendidos, tiempo de primera respuesta, tasa de conversión, ventas por sucursal) se conecta a lo que realmente ocurre en tu operación, no a un reporte armado manualmente al final del mes.</p>
                <p>Los modelos de predicción de demanda usan el histórico real de cada sucursal, comparados siempre contra una línea base simple para confirmar que la mejora es real y no ruido estadístico. Cuando un indicador se desvía de lo esperado, el sistema genera una alerta en vez de esperar a que alguien lo detecte por casualidad.</p>
                <ul>
                    <li>Predicción de demanda basada en tu propio histórico, no en supuestos genéricos.</li>
                    <li>Indicadores por sucursal, por canal y por vendedor, en un solo lugar.</li>
                    <li>Alertas automáticas cuando algo se desvía de lo esperado.</li>
                </ul>
            `
        },
        'caso-1': {
            title: 'Cero clientes esperando',
            body: `
                <p>El costo de una respuesta tardía casi nunca se ve en el momento: es la oportunidad que se enfría en silencio mientras un cliente espera. Un asistente conversacional atiende tus canales digitales de comunicación con el mismo criterio, las 24 horas, sin que la carga de trabajo de tu equipo determine qué tan rápido se atiende a alguien.</p>
                <p>El valor real no es solo la velocidad, es la consistencia: el mismo nivel de atención a la primera persona del día y a la última, sin depender de quién esté disponible en ese momento.</p>
            `
        },
        'caso-2': {
            title: 'Un cliente, un solo historial',
            body: `
                <p>Cuando un mismo cliente escribe por un canal digital y después visita en persona, lo habitual es que tenga que repetir todo desde cero: su nombre, lo que ya preguntó, lo que ya le dijeron. Identificamos al cliente por su perfil real, no por el nombre de perfil de una red social, y lo reconocemos sin importar por dónde se acerque.</p>
                <p>El valor de negocio está en no hacer que el cliente cargue con la responsabilidad de mantener el contexto de su propia atención. Eso le corresponde al sistema, no a la memoria de la persona.</p>
            `
        },
        'caso-3': {
            title: 'El inventario que se explica solo',
            body: `
                <p>Buena parte del tiempo operativo de cualquier negocio con varias ubicaciones se va en preguntar qué hay disponible y dónde. Automatizamos la conciliación de existencias entre sucursales a partir de las fuentes que ya generas, para que esa información esté disponible sin depender de una llamada telefónica entre ubicaciones.</p>
                <p>El valor no es solo el ahorro de tiempo, es la certeza: tu equipo y tu cliente ven el mismo dato, en el mismo momento, sin depender de la memoria de quién contestó el teléfono esa tarde.</p>
            `
        },
        'caso-4': {
            title: 'Ventas que se anticipan',
            body: `
                <p>La mayoría de los reportes de ventas explican lo que ya pasó. Entrenamos modelos de machine learning con el histórico real de cada sucursal para anticipar qué se va a vender, con la anticipación suficiente para ajustar inventario, personal o estrategia comercial antes de que la demanda se materialice.</p>
                <p>El valor de negocio de un modelo predictivo no está en su complejidad, sino en si supera de forma consistente a una proyección simple basada en el histórico. Esa comparación honesta es la que decide si un modelo se queda en producción o se descarta.</p>
            `
        },
        'servicio-automatizacion': {
            title: 'Automatización de Procesos',
            body: `
                <p>No hablamos de una sola tecnología. Automatización de Procesos, en AVC, significa combinar automatización robótica de procesos (RPA) para tareas repetitivas y basadas en reglas, modelos de machine learning para predicción, clasificación y detección de anomalías, sistemas de reconocimiento y captura automática de datos desde documentos e imágenes, y modelos de lenguaje (LLM) cuando el proceso requiere interpretar o generar texto.</p>
                <p>La IA conversacional es hoy la pieza más visible de nuestro trabajo, la que un cliente nota primero, pero es una capa más dentro de una estrategia de automatización mucho más amplia. El objetivo de cada proyecto es el mismo: que un proceso repetitivo de tu negocio deje de depender de captura manual, sin importar qué combinación de tecnologías se necesite para lograrlo.</p>
                <ul>
                    <li>RPA para tareas repetitivas de captura, validación y conciliación.</li>
                    <li>Modelos de machine learning para predicción y clasificación.</li>
                    <li>Reconocimiento automático de datos desde documentos e imágenes.</li>
                    <li>Modelos de lenguaje (LLM) para los procesos que requieren conversación.</li>
                </ul>
            `
        },
        'servicio-venta-consultiva': {
            title: 'Venta Consultiva',
            body: `
                <p>La venta consultiva no se trata de vender más rápido, sino de vender mejor: entender en qué etapa está cada cliente, qué objeciones tiene y qué información necesita antes de decidir. Diseñamos estrategias comerciales a la medida de tu equipo, apoyadas en los mismos datos que capturamos en el resto de la plataforma: el historial de cada cliente, su comportamiento real y las señales que indican que está listo para avanzar.</p>
                <p>El resultado es un equipo comercial que sabe a quién atender primero y con qué argumento, en vez de trabajar por intuición o por orden de llegada.</p>
                <ul>
                    <li>Diagnóstico del proceso comercial actual de tu equipo.</li>
                    <li>Estrategias de venta basadas en datos reales de comportamiento.</li>
                    <li>Capacitación y acompañamiento, no solo una recomendación en un documento.</li>
                </ul>
            `
        },
        'servicio-centros-contacto': {
            title: 'Centros de Contacto',
            body: `
                <p>Con 15 años de experiencia en el mercado de Centros de Contacto, sabemos que la experiencia del cliente no depende de un solo canal ni de una sola tecnología. Diseñamos e implementamos soluciones integrales que combinan atención humana y automatizada, en el canal que el cliente elija, con visibilidad completa de cada interacción para tu equipo de supervisión.</p>
                <p>No se trata de reemplazar a las personas con automatización, sino de que cada persona y cada proceso automatizado hagan la parte que mejor saben hacer, con el cliente en el centro de esa decisión.</p>
                <ul>
                    <li>Integración de canales de atención humana y automatizada.</li>
                    <li>Visibilidad completa de cada interacción para supervisión y calidad.</li>
                    <li>Diseño de la experiencia del cliente de principio a fin.</li>
                </ul>
            `
        }
    };

    // Plataforma: "Conocer más" expande el detalle en el mismo lugar de la
    // cuadrícula (igual que Soluciones), sin ventana emergente aparte.
    const plataformaGrid = document.querySelector('.plataforma-grid');
    const plataformaDetail = document.getElementById('plataformaDetail');
    const plataformaDetailTitle = document.getElementById('plataformaDetailTitle');
    const plataformaDetailBody = document.getElementById('plataformaDetailBody');
    const plataformaDetailClose = document.getElementById('plataformaDetailClose');

    let plataformaOrigin = null;

    const openPlataformaDetail = (key) => {
        const data = modalData[key];
        if (!data || !plataformaGrid || !plataformaDetail || !plataformaDetailTitle || !plataformaDetailBody) return;
        plataformaDetailTitle.textContent = data.title;
        plataformaDetailBody.innerHTML = data.body;
        plataformaOrigin = document.getElementById(key);
        plataformaGrid.style.display = 'none';
        plataformaDetail.style.display = 'block';
        // Al ocultar la cuadrícula y mostrar el detalle, la altura de la
        // sección cambia y el scroll que traía la página (venga de un
        // "Conocer más" ya visible o de un salto desde el menú) queda
        // desfasado. Se recalcula y se reacomoda contra el panel real,
        // sin importar desde dónde se haya abierto.
        const headerOffset = 80;
        const targetTop = plataformaDetail.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: targetTop, behavior: isMobile() ? 'instant' : 'smooth' });
        requestAnimationFrame(() => {
            requestAnimationFrame(() => plataformaDetail.classList.add('active'));
        });
    };

    // silent = cerrar sin regresar a la tarjeta (cuando se abre otra distinta)
    const closePlataformaDetail = (silent) => {
        if (!plataformaGrid || !plataformaDetail) return;
        plataformaDetail.classList.remove('active');
        const finish = () => {
            plataformaDetail.style.display = 'none';
            plataformaGrid.style.display = 'grid';
            if (!silent) returnTo(plataformaOrigin);
        };
        if (silent === true && isMobile()) finish();
        else setTimeout(finish, 400);
    };

    if (plataformaDetailClose) {
        plataformaDetailClose.addEventListener('click', () => closePlataformaDetail());
    }

    // Soluciones: "Conocer más" oculta la imagen/leyenda y despliega el
    // contenido dentro del mismo panel, en vez de abrir una ventana aparte.
    const rubroDetail = document.getElementById('rubroDetail');
    const rubroDetailTitle = document.getElementById('rubroDetailTitle');
    const rubroDetailBody = document.getElementById('rubroDetailBody');
    const rubroDetailClose = document.getElementById('rubroDetailClose');

    const openRubroDetail = (key) => {
        const data = modalData[key];
        if (!data || !rubrosPanel || !rubroDetailTitle || !rubroDetailBody) return;
        rubroDetailTitle.textContent = data.title;
        rubroDetailBody.innerHTML = data.body;
        rubrosPanel.classList.add('detail-open');
    };

    const closeRubroDetail = (silent) => {
        if (!rubrosPanel) return;
        rubrosPanel.classList.remove('detail-open');
        if (silent !== true) returnTo(rubrosPanel);
    };

    if (rubroDetailClose) {
        rubroDetailClose.addEventListener('click', () => closeRubroDetail());
    }

    // Scroll horizontal animado a mano: el "behavior: smooth" nativo del
    // navegador depende del hilo compositor y a veces no llega a completarse
    // (pestaña sin foco, throttling, etc.), dejando el carrusel descuadrado.
    // Esto anima moviendo scrollLeft directamente cuadro a cuadro, así que
    // siempre termina exactamente en el destino.
    const scrollHorizontalTo = (el, target, duration = 400) => {
        const start = el.scrollLeft;
        const change = target - start;
        if (change === 0) return;
        const startTime = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 3);
        const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            el.scrollLeft = start + change * ease(progress);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    // Casos: "Conocer más" expande esa misma tarjeta dentro del carrusel y
    // muestra ahí el desarrollo completo, en vez de abrir una ventana aparte.
    // Celular: el caso se lee en un panel con el texto completo; el carrusel se
    // oculta y, al cerrar, vuelve en la misma posición.
    const casosSection = document.getElementById('casos');
    const casosWrap = document.querySelector('.casos-carousel-wrap');
    const casoPanel = document.getElementById('casoPanel');
    const casoPanelImg = document.getElementById('casoPanelImg');
    const casoPanelTitle = document.getElementById('casoPanelTitle');
    const casoPanelBody = document.getElementById('casoPanelBody');
    let casoPanelSlide = null;
    let casoPanelScroll = 0;

    const openCasoPanel = (slide, data) => {
        if (!casoPanel || !casosWrap) return;
        const img = slide.querySelector('.caso-slide-image');
        casoPanelImg.style.backgroundImage = img ? getComputedStyle(img).backgroundImage : '';
        casoPanelTitle.textContent = data.title;
        casoPanelBody.innerHTML = data.body;
        casoPanelSlide = slide;
        casoPanelScroll = casosCarousel.scrollLeft;
        casosWrap.style.display = 'none';
        casoPanel.hidden = false;
        if (casosSection) casosSection.classList.add('casos-reading');
        const y = casoPanel.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
    };

    const closeCasoPanel = (silent) => {
        if (!casoPanel || casoPanel.hidden) return;
        casoPanel.hidden = true;
        if (casosWrap) casosWrap.style.display = '';
        if (casosSection) casosSection.classList.remove('casos-reading');
        casosCarousel.scrollLeft = casoPanelScroll;
        if (silent !== true) returnTo(casoPanelSlide);
    };

    const casoPanelClose = document.getElementById('casoPanelX');
    if (casoPanelClose) casoPanelClose.addEventListener('click', () => closeCasoPanel());
    mqMobile.addEventListener('change', () => { if (!isMobile()) closeCasoPanel(); });

    const openCasoDetail = (trigger, key) => {
        const slide = trigger.closest('.caso-slide');
        const data = modalData[key];
        if (!slide || !casosCarousel || !data) return;
        if (isMobile()) { openCasoPanel(slide, data); return; }
        document.querySelectorAll('.caso-slide.expanded').forEach(s => {
            if (s !== slide) s.classList.remove('expanded');
        });
        const detailBody = slide.querySelector('.caso-detail-body');
        if (detailBody) {
            detailBody.innerHTML = `<h3>${data.title}</h3>${data.body}<button type="button" class="btn-close-bottom" data-close="caso">Cerrar</button>`;
        }
        slide.classList.add('expanded');
        // El scroll-snap del carrusel pelea con cualquier intento de
        // centrado programático (te regresa al snap point más cercano a
        // medio camino), así que se desactiva mientras algo esté expandido.
        casosCarousel.classList.add('no-snap');
        // La tarjeta tarda 0.45s en llegar a su ancho final (ver transición de
        // .caso-slide.expanded en el CSS); si centramos antes de eso, el
        // cálculo se hace contra el ancho viejo y queda descuadrado una vez
        // que termina de crecer. Se espera a que la animación termine.
        setTimeout(() => {
            const target = slide.offsetLeft - (casosCarousel.clientWidth - slide.offsetWidth) / 2;
            const max = casosCarousel.scrollWidth - casosCarousel.clientWidth;
            scrollHorizontalTo(casosCarousel, Math.max(0, Math.min(target, max)));
        }, 460);
    };

    const closeCasoDetail = (slide, silent) => {
        slide.classList.remove('expanded');
        if (casosCarousel && !document.querySelector('.caso-slide.expanded')) {
            casosCarousel.classList.remove('no-snap');
        }
        if (silent !== true) returnTo(slide);
    };

    // Servicios: "Conocer más" voltea la tarjeta como un memorama, la expande
    // para que ocupe el espacio de las otras dos, y revela el desarrollo
    // completo en el reverso, en vez de abrir una ventana aparte.
    const servicesGrid = document.querySelector('.servicios-grid');

    const openServicioFlip = (trigger, key) => {
        const card = trigger.closest('.servicio-card');
        const data = modalData[key];
        if (!card || !data) return;
        document.querySelectorAll('.servicio-card.flipped').forEach(c => { if (c !== card) closeServicioFlip(c, true); });
        const backTitle = card.querySelector('.servicio-back-title');
        const backBody = card.querySelector('.servicio-back-body');
        if (backTitle) backTitle.textContent = data.title;
        if (backBody) backBody.innerHTML = data.body + '<button type="button" class="btn-close-bottom" data-close="servicio">Cerrar</button>';
        // Dos animaciones en secuencia, no al mismo tiempo: primero se voltea
        // sin cambiar de tamaño, y hasta que ese giro termina (0.6s) empieza,
        // con una pausa visible, la expansión que le quita el espacio a las
        // otras dos tarjetas.
        card.classList.add('flipped');
        setTimeout(() => {
            card.classList.add('expanded');
            if (servicesGrid) servicesGrid.classList.add('flip-open');
            // Celular: la tarjeta abierta se centra de inmediato (ya mide su alto final)
            if (isMobile()) returnTo(card);
        }, isMobile() ? 30 : 750);
    };

    const closeServicioFlip = (card, silent) => {
        card.classList.remove('flipped', 'expanded');
        if (servicesGrid) servicesGrid.classList.remove('flip-open');
        if (silent !== true) returnTo(card);
    };

    document.addEventListener('click', (e) => {
        // Botón "Cerrar" al final de cada tarjeta de "Conocer más"
        const bottomClose = e.target.closest('[data-close]');
        if (bottomClose) {
            const kind = bottomClose.dataset.close;
            if (kind === 'plataforma') closePlataformaDetail();
            else if (kind === 'rubro') closeRubroDetail();
            else if (kind === 'caso') closeCasoDetail(bottomClose.closest('.caso-slide'));
            else if (kind === 'caso-panel') closeCasoPanel();
            else if (kind === 'servicio') closeServicioFlip(bottomClose.closest('.servicio-card'));
            return;
        }

        const rubroClose = e.target.closest('.rubro-detail-close');
        if (rubroClose) return; // ya tiene su propio listener arriba

        const casoClose = e.target.closest('.caso-detail-close');
        if (casoClose) {
            const slide = casoClose.closest('.caso-slide');
            if (slide) closeCasoDetail(slide);
            return;
        }

        const servicioClose = e.target.closest('.servicio-back-close');
        if (servicioClose) {
            const card = servicioClose.closest('.servicio-card');
            if (card) closeServicioFlip(card);
            return;
        }

        const trigger = e.target.closest('[data-modal]');
        if (!trigger) return;
        e.preventDefault();
        const key = trigger.dataset.modal;
        // Una sola tarjeta abierta a la vez, y una apertura pendiente (enlace del
        // menú) se cancela si la persona toca otra antes de que ocurra.
        clearTimeout(pendingOpen);
        const runOpen = () => {
            if (!key.startsWith('plataforma-') && plataformaDetail && plataformaDetail.style.display === 'block') closePlataformaDetail(true);
            if (!key.startsWith('rubro-') && rubrosPanel && rubrosPanel.classList.contains('detail-open')) closeRubroDetail(true);
            if (!key.startsWith('caso-')) {
                closeCasoPanel(true);
                document.querySelectorAll('.caso-slide.expanded').forEach(s => closeCasoDetail(s, true));
            }
            if (!key.startsWith('servicio-')) document.querySelectorAll('.servicio-card.flipped').forEach(c => closeServicioFlip(c, true));
            if (key.startsWith('plataforma-')) {
                openPlataformaDetail(key);
            } else if (key.startsWith('rubro-')) {
                openRubroDetail(key);
            } else if (key.startsWith('caso-')) {
                openCasoDetail(trigger, key);
            } else if (key.startsWith('servicio-')) {
                openServicioFlip(trigger, key);
            }
        };
        // Los enlaces del mega-menú son <a> y ya disparan un scroll suave hacia
        // la sección; si la cuadrícula colapsa al mismo tiempo, el scroll se
        // descuadra a medio camino. Se espera a que el scroll termine.
        if (trigger.tagName === 'A') {
            pendingOpen = setTimeout(runOpen, isMobile() ? 30 : 500);
        } else {
            runOpen();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (plataformaDetail && plataformaDetail.style.display === 'block') {
            closePlataformaDetail();
        }
        if (rubrosPanel && rubrosPanel.classList.contains('detail-open')) {
            closeRubroDetail();
        }
        closeCasoPanel();
        document.querySelectorAll('.caso-slide.expanded').forEach(s => closeCasoDetail(s));
        document.querySelectorAll('.servicio-card.flipped').forEach(c => closeServicioFlip(c));
    });

    // Compañía: sin mouse no hay hover, así que el scroll decide qué tarjeta se
    // expande (arriba: "Sobre nosotros"; más abajo: "Contacto"), imitando el
    // hover de escritorio. El corte es el punto medio de la cuadrícula contra
    // el 55% de la altura de la ventana; la suma de alturas de las dos tarjetas
    // es constante, así que la posición no depende de cuál esté abierta.
    const aboutGrid = document.querySelector('.about-hover-grid');
    if (aboutGrid) {
        const aboutCards = Array.from(aboutGrid.querySelectorAll('.about-hover-card'));
        const mqStacked = window.matchMedia('(max-width: 992px)');
        let aboutCurrent = -1;
        const syncAboutCards = () => {
            if (!mqStacked.matches) {
                aboutCards.forEach(c => c.classList.remove('active'));
                aboutCurrent = -1;
                return;
            }
            const r = aboutGrid.getBoundingClientRect();
            const p = (window.innerHeight * 0.55 - r.top) / r.height;
            const idx = p < 0.5 ? 0 : 1;
            if (idx !== aboutCurrent) {
                aboutCurrent = idx;
                aboutCards.forEach((c, i) => c.classList.toggle('active', i === idx));
            }
        };
        window.addEventListener('scroll', syncAboutCards, { passive: true });
        window.addEventListener('resize', syncAboutCards);
        syncAboutCards();
    }

    // Casos en celular: carrusel infinito. Se agregan copias de las tarjetas y,
    // cuando el carrusel ya se detuvo, se salta en silencio al bloque central:
    // mover el scroll en pleno impulso lo frena y deja la pantalla en blanco.
    if (casosCarousel) {
        const casoOriginals = Array.from(casosCarousel.querySelectorAll('.caso-slide'));
        let casoClones = [];
        let casoWrapTimer = null;
        const setWidth = () => casoClones[0].offsetLeft - casoOriginals[0].offsetLeft;

        const jumpCasos = (d) => {
            casosCarousel.style.scrollSnapType = 'none';
            casosCarousel.scrollLeft += d;
            setTimeout(() => { casosCarousel.style.scrollSnapType = ''; }, 50);
        };

        const wrapCasos = () => {
            clearTimeout(casoWrapTimer);
            casoWrapTimer = setTimeout(() => {
                if (!casoClones.length || casosCarousel.querySelector('.caso-slide.expanded')) return;
                const w = setWidth();
                const k = Math.round((casosCarousel.scrollLeft - 2 * w) / w);
                if (k !== 0) jumpCasos(-k * w);
            }, 160);
        };

        const buildInfinite = () => {
            if (casoClones.length) return;
            [1, 2, 3, 4].forEach(() => casoOriginals.forEach(slide => {
                const copy = slide.cloneNode(true);
                copy.classList.add('caso-clone');
                copy.setAttribute('aria-hidden', 'true');
                copy.querySelectorAll('button').forEach(b => { b.tabIndex = -1; });
                casosCarousel.appendChild(copy);
                casoClones.push(copy);
            }));
            casosCarousel.style.scrollSnapType = 'none';
            casosCarousel.scrollLeft = setWidth() * 2;
            setTimeout(() => { casosCarousel.style.scrollSnapType = ''; }, 50);
        };

        const removeInfinite = () => {
            casoClones.forEach(c => c.remove());
            casoClones = [];
            casosCarousel.scrollLeft = 0;
        };

        const syncInfinite = () => { if (isMobile()) buildInfinite(); else removeInfinite(); };
        casosCarousel.addEventListener('scroll', wrapCasos, { passive: true });
        mqMobile.addEventListener('change', syncInfinite);
        window.addEventListener('load', () => { if (isMobile() && !casoClones.length) buildInfinite(); });
        syncInfinite();
    }

    // Video del hero: se detiene solo si la persona pidió menos movimiento o
    // ahorro de datos (queda el póster). En iPhone el sistema puede pausarlo
    // por ahorro de batería: se reanuda al volver a la pestaña y al primer toque.
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        const saveData = navigator.connection && navigator.connection.saveData;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || saveData) {
            heroVideo.removeAttribute('autoplay');
            heroVideo.pause();
            heroVideo.innerHTML = '';
            heroVideo.load();
        } else {
            heroVideo.muted = true;
            const tryPlay = () => {
                const p = heroVideo.play();
                if (p && p.catch) p.catch(() => {});
            };
            tryPlay();
            document.addEventListener('visibilitychange', () => { if (!document.hidden) tryPlay(); });
            window.addEventListener('touchstart', tryPlay, { once: true, passive: true });
        }
    }

    // Footer year, automatico
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    // Marquesina de logos: primero confirma cuáles archivos existen de verdad,
    // y hasta entonces arma el DOM una sola vez (nunca se modifica después),
    // para que el layout no cambie a medio scroll sin importar el navegador.
    const logosTracks = ['logosTrack1', 'logosTrack2', 'logosTrack3']
        .map((id) => document.getElementById(id))
        .filter(Boolean);
    if (logosTracks.length) {
        // Solo los 5 que de verdad existen hoy en assets/logos/ -- antes
        // probaba hasta 8 "por si acaso" y los que faltaban (6, 7, 8)
        // siempre tronaban un 404 en consola sin necesidad. Si se agregan
        // más logos después, subir este número.
        const candidatos = Array.from({ length: 5 }, (_, i) => `assets/logos/logo-${i + 1}.svg`);

        // Carga y decodifica cada imagen por completo antes de insertarla,
        // para que no truene un pop-in de decodificación a medio scroll.
        const probar = (src) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const listo = () => resolve(img);
                if (img.decode) {
                    img.decode().then(listo).catch(listo);
                } else {
                    listo();
                }
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });

        Promise.all(candidatos.map(probar)).then((imagenesListas) => {
            const logosValidos = imagenesListas.filter(Boolean);
            if (logosValidos.length === 0) return;

            const armarSlot = (imgListo, index, oculto) => {
                const slot = document.createElement('div');
                slot.className = 'logo-slot';
                const img = imgListo.cloneNode();
                if (oculto) {
                    img.alt = '';
                    img.setAttribute('aria-hidden', 'true');
                } else {
                    img.alt = `Logo cliente ${index + 1}`;
                }
                slot.appendChild(img);
                return slot;
            };

            // 3 filas alternando dirección (la del medio va invertida vía
            // .logos-track-reverse en CSS) -- misma lista de logos en las 3,
            // solo la primera fila lleva alt real; el resto es decorativo
            // puro (aria-hidden) para no repetirle 3 veces lo mismo a un
            // lector de pantalla. Cada fila se duplica una vez (igual que
            // antes) para el loop continuo.
            logosTracks.forEach((track, trackIndex) => {
                [false, true].forEach((oculto) => {
                    logosValidos.forEach((imgListo, index) => {
                        track.appendChild(armarSlot(imgListo, index, oculto || trackIndex > 0));
                    });
                });

                // Reinicia la animación ya con el contenido real adentro.
                // Sin esto, Safari a veces la deja "corriendo" (según la
                // Web Animations API) pero nunca vuelve a pintar el cambio
                // en pantalla, porque arrancó sobre el div todavía vacío
                // antes de que llegaran los logos.
                track.style.animation = 'none';
                void track.offsetWidth;
                track.style.animation = '';
            });
        });
    }
});

// Fondo animado tipo "lattice": red de puntos + etiquetas de valor flotantes
document.addEventListener('DOMContentLoaded', () => {
    const latticeBg = document.querySelector('.diferenciadores .lattice-bg');
    if (!latticeBg) return;

    const COLS = 13;
    const ROWS = 8;
    const DURATION = 9; // segundos, debe coincidir con las animaciones en CSS

    const grid = document.createElement('div');
    grid.className = 'lattice-grid';

    const dotRefs = [];
    for (let c = 0; c < COLS; c++) {
        const col = document.createElement('div');
        col.className = 'lattice-col';
        const colDots = [];
        for (let r = 0; r < ROWS; r++) {
            const dot = document.createElement('div');
            dot.className = 'lattice-dot' + ((c + r) % 5 === 0 ? ' accent' : '');
            const delay = ((c * ROWS + r) % 24) * (DURATION / 24);
            dot.style.setProperty('--d', `${delay}s`);
            col.appendChild(dot);
            colDots.push(dot);
        }
        grid.appendChild(col);
        dotRefs.push(colDots);
    }
    latticeBg.appendChild(grid);

    const keywords = [
        'Automatización', 'Machine Learning', 'RPA ', 'Reconocimiento de datos',
        'LLM aplicado', 'Consultoría', 'KPIs en vivo', 'Predicción de ventas',
        'Bots WhatsApp', 'Captura de datos', 'Antilavado', 'Inventarios'
    ];

    // Filas 2 y 4 (0-indexado) prohibidas para tags: caen sobre el título o
    // sobre el renglón de párrafos de las 3 tarjetas y ahí el texto no se
    // distingue bien. El resto de filas/columnas es libre.
    const tagSpots = [
        { col: 1, row: 1, side: 'right' },
        { col: 3, row: 6, side: 'right' },
        { col: 5, row: 0, side: 'left' }, // antes row:2, prohibida (choca con el título)
        { col: 7, row: 5, side: 'right' },
        { col: 9, row: 1, side: 'left' },
        { col: 11, row: 6, side: 'left' },
        { col: 2, row: 7, side: 'right' }, // antes row:4, chocaba con el texto de la 1ra tarjeta
        { col: 10, row: 3, side: 'left' }
    ];

    tagSpots.forEach((spot, index) => {
        const dot = dotRefs[spot.col] && dotRefs[spot.col][spot.row];
        if (!dot) return;

        const tag = document.createElement('div');
        tag.className = 'lattice-tag';

        const inner = document.createElement('div');
        inner.className = 'lattice-tag-inner';
        if (spot.side === 'left') {
            inner.style.flexDirection = 'row-reverse';
        }

        const box = document.createElement('div');
        box.className = 'lattice-tag-box';

        const label = document.createElement('span');
        label.className = 'lattice-tag-label';
        const word = keywords[index % keywords.length];
        label.textContent = word;
        label.style.setProperty('--tw', `${word.length}ch`);

        inner.appendChild(spot.side === 'left' ? label : box);
        inner.appendChild(spot.side === 'left' ? box : label);
        tag.appendChild(inner);

        const delay = (index * (DURATION / tagSpots.length));
        inner.style.setProperty('--d', `${delay}s`);
        label.style.setProperty('--d', `${delay}s`);

        tag.style.left = `calc(${(spot.col / (COLS - 1)) * 82 + 9}%)`;
        tag.style.top = `calc(${(spot.row / (ROWS - 1)) * 78 + 11}%)`;
        tag.style.transform = spot.side === 'left' ? 'translate(-100%, -50%)' : 'translate(0, -50%)';

        latticeBg.appendChild(tag);
    });
});
