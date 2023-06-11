export default interface ListItem {
    id: number;
    date: Date;
    transactionType: string;
    institution: string;
    tradingCode: string;
    quantity: number;
    totalCost: number;
}