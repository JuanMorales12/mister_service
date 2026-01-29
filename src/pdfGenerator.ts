import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Convierte una URL de imagen a base64 usando un proxy canvas
 */
const imageUrlToBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } else {
                    resolve(null);
                }
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        // Agregar timestamp para evitar cache
        img.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    });
};

/**
 * Pre-procesa las imágenes del elemento para convertirlas a base64
 * Si una imagen no puede ser cargada (CORS), se oculta para evitar errores
 */
const preprocessImages = async (element: HTMLElement): Promise<Map<HTMLImageElement, { src: string; display: string }>> => {
    const originalState = new Map<HTMLImageElement, { src: string; display: string }>();
    const images = element.querySelectorAll('img');

    const promises = Array.from(images).map(async (img) => {
        // Solo procesar imágenes HTTP (no data URLs que ya son base64)
        if (img.src && img.src.startsWith('http')) {
            originalState.set(img, { src: img.src, display: img.style.display });
            const base64 = await imageUrlToBase64(img.src);
            if (base64) {
                img.src = base64;
            } else {
                // Si no se puede cargar la imagen (CORS), ocultarla
                img.style.display = 'none';
            }
        }
    });

    await Promise.all(promises);
    return originalState;
};

/**
 * Restaura las URLs originales y visibilidad de las imágenes
 */
const restoreImages = (originalState: Map<HTMLImageElement, { src: string; display: string }>) => {
    originalState.forEach((state, img) => {
        img.src = state.src;
        img.style.display = state.display;
    });
};

/**
 * Genera un PDF a partir de un elemento HTML
 * @param elementId - ID del elemento HTML a convertir
 * @param filename - Nombre del archivo (sin extensión)
 * @returns Blob del PDF generado
 */
export const generatePDF = async (elementId: string, filename: string): Promise<Blob> => {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Elemento con ID "${elementId}" no encontrado`);
    }

    // Pre-procesar imágenes para convertirlas a base64
    const originalSrcs = await preprocessImages(element);

    // Capturar el elemento como canvas
    let canvas: HTMLCanvasElement;
    try {
        canvas = await html2canvas(element, {
            scale: 2, // Buena resolución para calidad
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: '#ffffff',
            imageTimeout: 15000
        });
    } finally {
        // Restaurar las URLs originales
        restoreImages(originalSrcs);
    }

    // Crear PDF en formato A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calcular dimensiones de la imagen
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calcular ratio para ajustar al ancho del PDF
    const ratioByWidth = pdfWidth / imgWidth;
    const scaledHeightByWidth = imgHeight * ratioByWidth;

    // Si el contenido escalado por ancho es más alto que la página,
    // escalar por altura para que quepa en una sola página
    let finalWidth: number;
    let finalHeight: number;

    if (scaledHeightByWidth > pdfHeight) {
        // Escalar por altura para que quepa en una página
        const ratioByHeight = pdfHeight / imgHeight;
        finalWidth = imgWidth * ratioByHeight;
        finalHeight = pdfHeight;
    } else {
        // Cabe en una página con escala por ancho
        finalWidth = pdfWidth;
        finalHeight = scaledHeightByWidth;
    }

    // Centrar horizontalmente si es necesario
    const xOffset = (pdfWidth - finalWidth) / 2;

    // Agregar imagen al PDF (siempre una sola página)
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', xOffset, 0, finalWidth, finalHeight);

    return pdf.output('blob');
};

/**
 * Genera un PDF y lo descarga localmente
 * @param elementId - ID del elemento HTML a convertir
 * @param filename - Nombre del archivo (sin extensión)
 */
export const downloadPDF = async (elementId: string, filename: string): Promise<void> => {
    const blob = await generatePDF(elementId, filename);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
