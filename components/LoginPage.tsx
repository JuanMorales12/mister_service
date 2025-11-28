

import React, { useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { Wrench, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await firebaseService.signIn(email, password);
            // onAuthStateChanged in App.tsx will handle the redirect
        } catch (err) {
            setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <Wrench className="mx-auto h-12 w-auto text-sky-600" />
                    <h2 className="mt-6 text-3xl font-bold text-slate-900">
                        Mister Service RD
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Inicia sesión para acceder al panel de control
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            Correo Electrónico
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white text-slate-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                            Contraseña
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white text-slate-900"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
