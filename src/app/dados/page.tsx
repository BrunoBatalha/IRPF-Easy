'use client'

import { Card, IconInfo, IconSearch, Table, Tabs } from "@/modules/sharedModule/components"
import { ReactKey } from "@/modules/sharedModule/interfaces";
import { DateService, NumberService } from "@/modules/sharedModule/services";
import { useEffect, useState } from "react";
import { WorksheetIncome, WorksheetStocksAndFiisItem } from "../page";

// INFO: o preco medio é a soma de todos dos valores pagos nas ações divida pela quantidade de ações
// INFO: o valor é o preço médio vezes a quantidade de ações
// TODO: Exportar lista completa de Fundos em CSV somente os ETFs, tem no site da B3
// TODO: checar se a ação existe
// TODO: permitir enviar planilha de rendimentos e exibir no card
// TODO: mostrar as intruções detalhadas de onde vai preencher no imposto de renda
// TODO: fazer barra de progresso do arquivo sendo carregado
// TODO: olhar pelo lighthouse a perfomance e melhorar com useMemo useCallback e ver se tem ganho


interface StorageWorksheet {
    worksheetJsonStocks: WorksheetStocksAndFiisItem[],
    worksheetJsonIncomes: WorksheetIncome[]
}

interface GroupingStock {
    code: string;
    totalQuantity: number;
    totalAverageCost: number;
    totalCost: number;
    discriminating: string;
    income: number;
    jcp: number;
    cnpj: string;
}

interface Stock {
    id: number;
    date: Date;
    transactionType: string;
    institution: string;
    tradingCode: string;
    quantity: number;
    totalCost: number;
}

interface Income {
    id: number;
    eventType: WorksheetIncome['Tipo de Evento'];
    product: string;
    value: number;
}

type ValueOverride = React.ReactNode | (() => JSX.Element)
type PropertiesToString<T> = Record<keyof T, ValueOverride> & ReactKey
type TableListAllStocks = PropertiesToString<Stock>
type TableListStockGrouping = PropertiesToString<GroupingStock>
type TableListIncomes = PropertiesToString<Income>

type ResultFactory<TValue, TValueTable> = { value: TValue, mapperToTable: () => TValueTable }
type ResultFactoryStock = ResultFactory<Stock, TableListAllStocks>
type ResultFactoryGroupingStock = ResultFactory<GroupingStock, TableListStockGrouping>;
type ResultFactoryIncome = ResultFactory<Income, TableListIncomes>
type ResultFactoryGroupingIncome = Pick<Income, 'eventType' | 'product' | 'value'>

export default function Home() {
    const [listAllStocks, setListAllStocks] = useState<ResultFactoryStock[]>([])
    const [listStockGroupings, setListStockGroupings] = useState<ResultFactoryGroupingStock[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false)

    useEffect(() => {
        const data = window.sessionStorage.getItem('worksheets')
        if (!data) {
            return;
        }

        setIsLoading(true)

        const { worksheetJsonIncomes, worksheetJsonStocks } = JSON.parse(data) as StorageWorksheet
        const worksheetStocksAsc = worksheetJsonStocks.reverse()
        const transfers = worksheetStocksAsc.filter(w => w['Movimentação'] === 'Transferência - Liquidação')

        const listStocks = transfers.map<ResultFactoryStock>((w, index) => createStock({
            id: index,
            date: DateService.DDMMYYYYToDate(w["Data"]),
            institution: w['Instituição'],
            quantity: Number(w.Quantidade),
            totalCost: Number(w['Valor da Operação']),
            tradingCode: w["Produto"],
            transactionType: w["Movimentação"]
        }))

        const listIncomes = worksheetJsonIncomes.map<ResultFactoryIncome>((w, index) => createIncome({
            id: index,
            product: w['Produto'],
            eventType: w['Tipo de Evento'] as Income['eventType'],
            value: Number(w["Valor líquido"]),
        }))

        const listStocksWithoutEtfsAndFiis = listStocks.filter(g => !g.value.tradingCode.includes('11'))
        // const listIncomesWithoutEtfsAndFiis = listIncomes.filter(g => !g.value.product.includes('FII'))

        // const groupingsIncomes = createGroupingsIncomes(listIncomesWithoutEtfsAndFiis)
        const groupings = createGroupingsFrom(listStocksWithoutEtfsAndFiis, listIncomes);

        setListStockGroupings(groupings)
        setListAllStocks(listStocksWithoutEtfsAndFiis)
        setIsLoading(false)
    }, [])

    return (
        <main className="flex min-h-screen max-h-screen flex-col pt-24 px-24">
            <Tabs initialTab={0} tabs={['Como declarar?', 'Todas', 'Ações']}>
                <Card className="my-8 flex flex-col">
                    <div className="flex items-center mb-3">
                        <span className="inline-flex text-yellow-500"><IconInfo /></span>
                        <span className="pl-4">Como declarar?</span>
                    </div>
                    <div className="pl-10 leading-8">
                        <ol className="mb-4">
                            <li>1º Acesse o menu lateral “Bens e Dívidas”</li>
                            <li>2º Selecione as opções  “Grupo 3 - Participações Societárias” e “Código 1 - Ações (inclusive as listadas em bolsa)”</li>
                        </ol>

                        <span>Levando em conta a tabela a baixo, preencha:</span>
                        <ol>
                            <li>1º Em “código de negociação” coloque o Código;</li>
                            <li>2º Em “CNPJ” coloque o CNPJ;</li>
                            <li>3º Em “Discriminação” coloque o “Discriminante”;</li>
                            <li>4º Em “Valor em 31/12/(ultimo ano) R$” coloque o Custo médio total;</li>
                        </ol>
                    </div>
                </Card>

                <Card>
                    <Table<Stock>
                        classNameContainer="max-h-[42rem]"
                        isLoading={isLoading}
                        list={listAllStocks.map(l => l.mapperToTable())}
                        headers={[
                            { value: 'Data do negócio', accessor: 'date' },
                            { value: 'Código', accessor: 'tradingCode' },
                            { value: 'Quantidade', accessor: 'quantity' },
                            { value: 'Preço total (R$)', accessor: 'totalCost' },
                            { value: 'Instituição', accessor: 'institution' }
                        ]}
                    />
                </Card>

                <Card>
                    <Table<GroupingStock>
                        classNameContainer="max-h-[42rem]"
                        isLoading={isLoading}
                        list={listStockGroupings.map(l => l.mapperToTable())}
                        headers={[
                            { value: 'Código', accessor: 'code' },
                            { value: 'CNPJ', accessor: 'cnpj' },
                            { value: 'Custo médio (R$)', accessor: 'totalAverageCost' },
                            { value: 'Rendimentos (R$)', accessor: 'income' },
                            { value: 'Juros sobre capital próprio (R$)', accessor: 'jcp' },
                            { value: 'Quantidade', accessor: 'totalQuantity' },
                            { value: 'Discriminante', accessor: 'discriminating' },
                        ]}
                    />
                </Card>
            </Tabs>
        </main >
    )
}

function createGroupingsFrom(listWithoutEtfsAndFiis: ResultFactoryStock[], listIncomeWithoutFiis: ResultFactoryIncome[]) {
    const grouped = listWithoutEtfsAndFiis.reduce<{ [k: string]: ResultFactoryGroupingStock; }>((acc, { value: item }) => {
        if (acc[item.tradingCode]) {
            const totalQuantity = acc[item.tradingCode].value.totalQuantity + item.quantity;
            const totalCost = acc[item.tradingCode].value.totalCost + item.totalCost;
            const avarageCost = totalCost / totalQuantity;
            acc[item.tradingCode] = createGroupingStock({
                ...acc[item.tradingCode].value,
                totalQuantity: totalQuantity,
                totalAverageCost: avarageCost,
                totalCost: totalCost,
                discriminating: createDiscriminating(totalQuantity, item, avarageCost),
            });
        } else {
            const avarageCost = item.totalCost / item.quantity;
            const income = getIncome(listIncomeWithoutFiis, item)
            const jcp = getJcp(listIncomeWithoutFiis, item)

            acc[item.tradingCode] = createGroupingStock({
                code: item.tradingCode,
                totalQuantity: item.quantity,
                totalAverageCost: avarageCost,
                totalCost: item.totalCost,
                discriminating: createDiscriminating(item.quantity, item, avarageCost),
                income: income ?? 0,
                jcp: jcp ?? 0,
                cnpj: `https://www.google.com/search?q=cnpj+da+${item.tradingCode}`
            });
        }

        return acc;
    }, {});

    return Object.entries(grouped).map(g => g[1]);
}

function getIncome(listIncomeWithoutFiis: ResultFactoryIncome[], item: Stock) {
    const { isStockFractional, tradingCodeLowerCase } = getInfoStock(item);

    if (isStockFractional) {
        return listIncomeWithoutFiis.find(i =>
            (i.value.eventType === 'Dividendo' || i.value.eventType === 'Rendimento') &&
            i.value.product.toLowerCase().includes(tradingCodeLowerCase.substring(0, tradingCodeLowerCase.length - 1))
        )?.value.value;
    }

    return listIncomeWithoutFiis.find(i =>
        (i.value.eventType === 'Dividendo' || i.value.eventType === 'Rendimento') &&
        i.value.product.toLowerCase().includes(tradingCodeLowerCase)
    )?.value.value;
}

function getJcp(listIncomeWithoutFiis: ResultFactoryIncome[], item: Stock) {
    const { isStockFractional, tradingCodeLowerCase } = getInfoStock(item);

    if (isStockFractional) {
        return listIncomeWithoutFiis.find(i =>
            (i.value.eventType === 'Juros Sobre Capital Próprio') &&
            i.value.product.toLowerCase().includes(tradingCodeLowerCase.substring(0, tradingCodeLowerCase.length - 1))
        )?.value.value;
    }

    return listIncomeWithoutFiis.find(i =>
        (i.value.eventType === 'Juros Sobre Capital Próprio') &&
        i.value.product.toLowerCase().includes(tradingCodeLowerCase)
    )?.value.value;
}

function getInfoStock(item: Stock) {
    const tradingCode = item.tradingCode.split(' - ')[0]
    const tradingCodeLowerCase = tradingCode.toLowerCase();
    const lastCharacter = tradingCodeLowerCase[tradingCodeLowerCase.length - 1];
    const penultimateCharacter = tradingCodeLowerCase[tradingCodeLowerCase.length - 2];
    const isStockFractional = lastCharacter.toUpperCase() === 'F' && !isNaN(Number(penultimateCharacter));
    return { isStockFractional, tradingCodeLowerCase };
}

function createDiscriminating(totalQuantity: number, item: Stock, avarageCost: number): string {
    return `${totalQuantity} acoes da ${item.tradingCode} pelo valor medio de R$ ${NumberService.formatToCurrency(avarageCost)} por meio da ${item.institution}`;
}

function createStock(stock: Stock): ResultFactoryStock {
    return {
        value: stock,
        mapperToTable: () => ({
            reactKey: stock.id,
            date: DateService.toFormatDDMMYYYY(stock.date),
            id: stock.id,
            institution: stock.institution,
            quantity: stock.quantity,
            totalCost: NumberService.formatToCurrency(stock.totalCost),
            tradingCode: stock.tradingCode,
            transactionType: stock.transactionType,
        })
    }
}

function createIncome(income: Income): ResultFactoryIncome {
    return {
        value: income,
        mapperToTable: () => ({
            id: income.id,
            eventType: income.eventType,
            reactKey: income.id,
            product: income.product,
            value: income.value
        })
    }
}

function createGroupingStock(groupingStock: GroupingStock): ResultFactoryGroupingStock {
    return {
        value: groupingStock,
        mapperToTable: () => ({
            totalAverageCost: NumberService.formatToCurrency(groupingStock.totalAverageCost),
            code: groupingStock.code,
            discriminating: groupingStock.discriminating,
            income: NumberService.formatToCurrency(groupingStock.income),
            reactKey: groupingStock.code,
            totalCost: NumberService.formatToCurrency(groupingStock.totalCost),
            totalQuantity: groupingStock.totalQuantity,
            jcp: NumberService.formatToCurrency(groupingStock.jcp),
            cnpj: <a href={groupingStock.cnpj} target="_blank" className="inline-flex text-blue-600 hover:text-blue-900" title="Procurar CNPJ"><IconSearch /></a>
        })
    }
}
