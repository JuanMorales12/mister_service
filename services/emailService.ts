
import { ServiceOrder } from '../types';

const COMPANY_EMAIL = "notificaciones@misterservicerd.com";

export const EmailService = {
  sendNewServiceOrderNotification: (order: ServiceOrder): void => {
    const subject = `Nueva Orden de Servicio #${order.id}: ${order.title}`;
    
    const body = `
      ====================================
      NUEVA ORDEN DE SERVICIO CREADA
      ====================================

      Se ha creado una nueva orden de servicio en el sistema.

      Detalles:
      ------------------------------------
      ID de Orden: ${order.id}
      Cliente: ${order.customerName}
      Teléfono: ${order.customerPhone}
      Dirección: ${order.customerAddress}
      Servicio: ${order.applianceType}
      Descripción de la Falla: ${order.issueDescription}
      Estado: ${order.status}
      
      ${order.start ? `Fecha y Hora: ${new Date(order.start).toLocaleString('es-ES')}` : 'Fecha y Hora: Por definir'}

      ------------------------------------
      Este es un correo de notificación automático.
    `;

    console.log("--- SIMULACIÓN DE ENVÍO DE CORREO ---");
    console.log(`Para: ${COMPANY_EMAIL}`);
    console.log(`Asunto: ${subject}`);
    console.log("Cuerpo del correo:");
    console.log(body);
    console.log("---------------------------------------");

    // En una aplicación real, usarías un servicio de backend para enviar el correo,
    // por ejemplo, haciendo una llamada fetch a tu API.
    // fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ to: COMPANY_EMAIL, subject, body })
    // });
  }
};