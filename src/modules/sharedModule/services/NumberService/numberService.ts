export function formatToCurrency(number: number): string {
    return new Intl.NumberFormat('pt-BR', {
        currency: 'BRL',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    }).format(number);
}