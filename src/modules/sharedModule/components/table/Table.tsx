import { Spinner } from ".."
import { ReactKey } from "../../interfaces";

type PropertiesItem<TItem> = { [k in keyof TItem]: (() => JSX.Element) | React.ReactNode }
type List<TItem> = ReactKey & PropertiesItem<TItem>

export interface Props<TItem> {
    list: Array<List<TItem>>;
    headers: Array<{ value: React.ReactNode, accessor: keyof TItem }>;
    isLoading: boolean;
    classNameContainer?: string
}

export default function Table<TListItem>({ list, isLoading, headers, classNameContainer }: Props<TListItem>) {

    // TODO: refatorar para não usar any
    function valueToCell(value: any) {
        const canBeFunctionThatReturnJsxElement = typeof value === "function"
        return canBeFunctionThatReturnJsxElement ? value() : value
    }

    return (
        <div className={`relative overflow-auto w-full ${classNameContainer}`}>
            <table className="bg-white w-full">
                <thead>
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i}
                                scope="col"
                                role="columnheader"
                                align="left"
                                className="
                                    sticky 
                                    px-4        
                                    py-6                       
                                    top-0 
                                  bg-white
                                  text-gray-600 
                                    tracking-wider                                  
                                    font-medium
                                    cs-inset-shadow-bottom-orange-500">
                                {h.value}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {isLoading && (
                        <tr>
                            <td align="center" colSpan={headers.length} className="py-8"><Spinner /></td>
                        </tr>
                    )}

                    {!isLoading && list.map((item) => (
                        <tr key={item.reactKey} className="text-gray-600 even:bg-orange-50">
                            {headers.map((h, i) => <td key={i} className="px-4 py-5" align="left">{valueToCell(item[h.accessor])}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
