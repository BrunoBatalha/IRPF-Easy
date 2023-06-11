import { Spinner } from ".."
import { ListItem } from "../../interfaces"
import { DateService, NumberService } from "../../services"

export interface Props {
    list: ListItem[];
    isLoading: boolean;
}

export default function Table({ list, isLoading }: Props) {

    return (
        <table className="bg-white flex-1">
            <thead className="text-gray-600 tracking-wider border-solid border-orange-300 border-b-2 sticky top-0 bg-white">
                <tr className="px-8 py-4 flex">
                    <th className="flex items-start px-4 font-medium flex-1">Data do negócio</th>
                    <th className="flex items-start px-4 font-medium flex-1">Código</th>
                    <th className="flex items-start px-4 font-medium flex-1">Quantidade</th>
                    <th className="flex items-start px-4 font-medium flex-1">Preço total</th>
                </tr>
            </thead>
            <tbody className="block max-h-96 overflow-auto">
                {isLoading && (
                    <tr className="mx-auto block">
                        <td align="center" colSpan={4} className="block my-4"><Spinner /></td>
                    </tr>
                )}

                {!isLoading && list.map((item: ListItem) => (
                    <tr className="
                        px-8 
                        py-4
                        text-gray-600 
                        border-solid 
                        border-gray-100 
                        border-b-2 
                        flex"
                        key={item.id}>
                        <td className="px-4 flex-1">{DateService.toFormatDDMMYYYY(item.date)}</td>
                        <td className="px-4 flex-1">{item.tradingCode}</td>
                        <td className="px-4 flex-1">{item.quantity}</td>
                        <td className="px-4 flex-1">{NumberService.formatToCurrency(item.totalCost)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
