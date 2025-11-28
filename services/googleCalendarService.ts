import { ServiceOrder, ServiceOrderStatus } from '../types';
import { GOOGLE_CLIENT_ID } from '../config';

declare global {
  interface Window {
    gapi: any;
  }
}

const API_KEY = process.env.API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let gapiInited = false;

const formatRemindersForGoogle = (reminders: { minutes: number }[]) => {
    return {
        'useDefault': false,
        'overrides': reminders.map(rem => ({ 'method': 'popup', 'minutes': rem.minutes }))
    };
};

const statusToColorId: Record<ServiceOrderStatus, string> = {
    'Pendiente': '5', // Banana Yellow
    'En Proceso': '10', // Basil Green
    'Completado': '9', // Blueberry Blue
    'Cancelado': '8', // Graphite Gray
    'Por Confirmar': '3', // Grape Purple
    'Garantía': '11', // Tomato Red
    'No Agendado': '8', // Graphite Gray
};

const buildEventDescription = (order: ServiceOrder): string => {
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    let description = `
<b>-- INFORMACIÓN DEL CLIENTE --</b>
<b>Nombre:</b> ${order.customerName}
<b>Teléfono:</b> ${order.customerPhone}
<b>WhatsApp:</b> <a href="https://wa.me/${cleanPhone}">https://wa.me/${cleanPhone}</a>
<b>Dirección:</b> ${order.customerAddress}

<b>-- DETALLES DEL SERVICIO --</b>
<b>Servicio:</b> ${order.applianceType}
${order.isCheckupOnly ? '<b>Tipo:</b> Solo Chequeo\n' : ''}
<b>Falla Reportada:</b> ${order.issueDescription}
    `;

    if (order.serviceNotes) {
        description += `

<b>-- TRABAJO REALIZADO Y NOTAS --</b>
${order.serviceNotes}
        `;
    }
    return description;
};

export const GoogleCalendarService = {
  async initGapiClient(): Promise<void> {
    if (gapiInited) return;
    await new Promise((resolve, reject) => {
      window.gapi.load('client', {
        callback: resolve,
        onerror: reject
      });
    });
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
  },

  initTokenClient(callback: (tokenResponse: any) => void): any {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY no está configurada");
    }
    const clientId = GOOGLE_CLIENT_ID;
    if (!clientId) {
        console.error("Falta el ID de Cliente de Google. Por favor, asegúrate de que la variable de entorno GOOGLE_CLIENT_ID esté configurada.");
        return null;
    }
      
    const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: callback,
    });
    return client;
  },
  
  async listUpcomingEvents(): Promise<any[]> {
    if (!window.gapi.client.calendar) {
        await this.initGapiClient();
    }
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'orderBy': 'startTime'
    });
    
    return response.result.items;
  },

  async createEvent(order: ServiceOrder, calendarId: string = 'primary'): Promise<any> {
    if (!window.gapi.client.calendar) {
        await this.initGapiClient();
    }
    
    const event = {
      'summary': `${order.applianceType} - ${order.customerName} [${order.status}]`,
      'location': order.customerAddress,
      'description': buildEventDescription(order),
      'start': {
        'dateTime': order.start!.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': order.end!.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'reminders': order.reminders && order.reminders.length > 0
        ? formatRemindersForGoogle(order.reminders)
        : { 'useDefault': true },
      'colorId': statusToColorId[order.status],
    };

    const request = window.gapi.client.calendar.events.insert({
      'calendarId': calendarId,
      'resource': event
    });
    
    const response = await request;
    return response.result;
  },

  async patchEvent(eventId: string, calendarId: string, data: Partial<{ summary: string; description: string; reminders: { minutes: number }[]; colorId: string; start: { dateTime: string }; end: { dateTime: string }; }>): Promise<any> {
    if (!window.gapi.client.calendar) {
        await this.initGapiClient();
    }
    const resource: any = {};
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if(data.reminders) {
        resource.reminders = formatRemindersForGoogle(data.reminders);
    }
    if (data.summary) {
        resource.summary = data.summary;
    }
    if (data.description) {
        resource.description = data.description;
    }
    if (data.colorId) {
        resource.colorId = data.colorId;
    }
    if (data.start) {
        resource.start = { dateTime: data.start.dateTime, timeZone };
    }
    if (data.end) {
        resource.end = { dateTime: data.end.dateTime, timeZone };
    }

    const request = window.gapi.client.calendar.events.patch({
        calendarId: calendarId,
        eventId: eventId,
        resource: resource,
    });
    const response = await request;
    return response.result;
  },

  async moveEvent(eventId: string, sourceCalendarId: string, destinationCalendarId: string): Promise<any> {
    if (!window.gapi.client.calendar) {
        await this.initGapiClient();
    }
    const request = window.gapi.client.calendar.events.move({
      calendarId: sourceCalendarId,
      eventId: eventId,
      destination: destinationCalendarId,
    });
    const response = await request;
    return response.result;
  },
  
  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<any> {
    if (!window.gapi.client.calendar) {
        await this.initGapiClient();
    }
    const request = window.gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
    });
    const response = await request;
    return response;
  },

  buildEventDescription: buildEventDescription,
  getStatusColorId: (status: ServiceOrderStatus) => statusToColorId[status],
};