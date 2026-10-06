# AVC Software · sitio web

Sitio web de **AVC Software Automatización Venta Consultiva S.A. de C.V.**: IA aplicada a la atención y la venta, con automatización, venta consultiva y centros de contacto.

- **Producción:** https://avc.v2rcx.com.mx (también abre en https://www.avc.v2rcx.com.mx)
- **Tablero de trabajo:** https://github.com/orgs/avc-software-mx/projects/6

## Qué es

Sitio estático de una sola página, hecho con HTML, CSS y JavaScript puro. No usa frameworks, dependencias ni paso de compilación: lo que está en el repositorio es lo que se publica.

### Secciones de la página

1. **Inicio:** video de fondo, titular y llamadas a la acción.
2. **Logos:** marquesina de empresas que confían en AVC.
3. **Plataforma:** seis frentes, cada uno con su «Conocer más».
4. **Soluciones:** pestañas por frente (Ventas, Atención al cliente, Inventario, Cumplimiento, Marketing, Analítica).
5. **Casos:** carrusel infinito de casos de uso.
6. **Por qué trabajar con nosotros.**
7. **Servicios:** tres frentes (Automatización de Procesos, Venta Consultiva, Centros de Contacto).
8. **El equipo detrás de cada automatización**, **Quiénes somos** y **Contacto**.

Además hay una página aparte, `aviso-privacidad.html`, con el aviso de privacidad conforme a la LFPDPPP.

## Estructura del repositorio

| Archivo o carpeta | Para qué sirve |
| --- | --- |
| `index.html` | Todo el contenido de la página (textos, menú, secciones). |
| `aviso-privacidad.html` | Aviso de privacidad. |
| `styles.css` | Estilos. Los tamaños de escritorio (≥ 993 px) escalan con `clamp()`; celular y tableta usan tamaños fijos. |
| `script.js` | Comportamiento: menú, carruseles, tarjetas de «Conocer más», formulario de contacto y textos de cada detalle (`modalData`). |
| `assets/` | Imágenes y video: `casos/`, `rubros/`, `servicios/`, `logos/`, favicon, póster y video del inicio (las fotos de `nav/` ya no se usan: los submenús no llevan imágenes). |

## Ver el sitio en tu computadora

No hace falta instalar nada. Desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

y abre http://localhost:8000. Si usas varios sitios a la vez, usa un puerto distinto para cada uno: el navegador guarda en caché el CSS por dirección y mezcla los de sitios distintos.

Para probar el celular desde Chrome, abre las herramientas de desarrollo y activa el modo dispositivo, o carga la página dentro de un `iframe` de 390 px de ancho. En Chrome, una pestaña en segundo plano congela las animaciones y `requestAnimationFrame`.

## Cómo editar el contenido

- **Textos de la página:** directamente en `index.html`.
- **Texto de cada «Conocer más»** (Plataforma, Soluciones, Casos, Servicios): en el objeto `modalData` de `script.js`.
- **Fotos:** reemplaza el archivo en `assets/` conservando el nombre. Las fotos de Casos tienen una versión ligera para celular (`caso-N-m.jpg`, ~800 px).
- **Logos de la marquesina:** `assets/logos/logo-1.svg` a `logo-5.svg`. Si agregas más, sube el número de candidatos en `script.js` (busca «Marquesina de logos»).
- **Formulario de contacto:** no tiene servidor. Al enviarlo abre el programa de correo de la persona con el mensaje ya redactado (`mailto:`). El destinatario está en `script.js`.

## Comportamiento por tamaño de pantalla

- **Escritorio (≥ 993 px):** tipografías y alturas proporcionales a la ventana, cada sección alineada al inicio de la pantalla (snap vertical) y submenús completos con presentación y enlaces.
- **Tableta (769 a 992 px):** diseño de escritorio con tamaños fijos, sin el fondo de puntos.
- **Celular (≤ 768 px):** menú con acordeón, casos en un panel de lectura, secciones a pantalla completa y botón «Cerrar» al final de cada tarjeta abierta.

## Publicación

El sitio se publica en **AWS Amplify**: cada `push` a la rama `main` lanza un build automático y publica en producción en pocos minutos. No hay ramas de pruebas ni flujo de aprobación, por eso **todo lo que llega a `main` queda en vivo**.

El dominio `avc.v2rcx.com.mx` (y `www`) lo sirve Amplify con certificado administrado; el DNS está en Route 53.

## Cómo trabajamos

- Cada cambio nace de un **issue** del repositorio, que se agrega al [tablero](https://github.com/orgs/avc-software-mx/projects/6) con tipo, etiqueta, responsable, tamaño y estimación.
- Un commit por issue, con `Closes #N` en el mensaje para cerrarlo al publicar.
- Antes de publicar, el cambio se prueba en el navegador (escritorio y celular).
- Idioma de commits, issues y textos: español (México).
