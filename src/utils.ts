/**
 * Formatea un número con separador de miles (coma) y dos decimales
 * @param value - El número a formatear
 * @returns String formateado, ej: "1,234.56"
 */
export const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Formatea un número entero con separador de miles
 * @param value - El número a formatear
 * @returns String formateado, ej: "1,234"
 */
export const formatNumber = (value: number): string => {
    return value.toLocaleString('en-US');
};
