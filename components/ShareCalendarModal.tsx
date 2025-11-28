import React, { useState } from 'react';
import { Calendar } from '../src/types';
import { X, Clipboard, Check, Link as LinkIcon, Code } from 'lucide-react';

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: Calendar;
}

export const ShareCalendarModal: React.FC<ShareCalendarModalProps> = ({ isOpen, onClose, calendar }) => {
  const [copiedItem, setCopiedItem] = useState<'link' | 'iframe' | null>(null);

  if (!isOpen) return null;

  const embedUrl = `${window.location.origin}/public-form.html?calendarId=${calendar.id}`;

  const embedCode = `<iframe src="${embedUrl}" style="width: 100%; height: 800px; border: none;" allow="geolocation" title="Formulario de Citas - ${calendar.name}"></iframe>`;

  const handleCopy = (text: string, type: 'link' | 'iframe') => {
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-2 text-slate-700">Compartir Calendario</h2>
        <p className="text-sm text-slate-500 mb-6">Calendario: <span className="font-semibold">{calendar.name}</span></p>

        <div className="space-y-6">
          <div>
            <label className="label-style flex items-center gap-2"><LinkIcon size={16} /> Enlace Directo</label>
            <div className="mt-1 relative">
              <input
                type="text"
                readOnly
                value={embedUrl}
                className="input-style pr-10"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => handleCopy(embedUrl, 'link')}
                className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-slate-500 hover:bg-slate-200 rounded-md"
                title="Copiar enlace"
              >
                {copiedItem === 'link' ? <Check size={16} className="text-green-600" /> : <Clipboard size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label-style flex items-center gap-2"><Code size={16} /> Código para Incrustar (HTML)</label>
            <div className="mt-1 relative">
              <textarea
                readOnly
                value={embedCode}
                rows={4}
                className="input-style font-mono text-xs pr-10"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => handleCopy(embedCode, 'iframe')}
                className="absolute top-2 right-2 p-1.5 text-slate-500 hover:bg-slate-200 rounded-md"
                title="Copiar código"
              >
                {copiedItem === 'iframe' ? <Check size={16} className="text-green-600" /> : <Clipboard size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Pega este código en tu página web donde quieras que aparezca el formulario.</p>
          </div>
        </div>

        <div className="flex justify-end pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
            Cerrar
          </button>
        </div>
        <style>{`.input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .label-style { display: block; font-medium; color: #334155; }`}</style>
      </div>
    </div>
  );
};
