'use client'

import { Card, InputFile, Table } from "@/modules/sharedModule/components"
import { ReactKey } from "@/modules/sharedModule/interfaces";
import { DateService, NumberService, WorksheetService } from "@/modules/sharedModule/services";
import { useEffect, useState } from "react";

// INFO: o valor é o preço médio vezes a quantidade de ações
// TODO: Exportar lista completa de Fundos em CSV somente os ETFs, tem no site da B3
// TODO: checar se a ação existe
// TODO: permitir enviar planilha de rendimentos e exibir no card
// TODO: mostrar as intruções detalhadas de onde vai preencher no imposto de renda
// TODO: fazer barra de progresso do arquivo sendo carregado
// TODO: olhar pelo lighthouse a perfomance e melhorar com useMemo useCallback e ver se tem ganho
interface WorksheetItem {
  'Data do Negócio': string;
  'Tipo de Movimentação': string;
  'Instituição': string;
  'Código de Negociação': string;
  'Quantidade': string;
  'Valor': string;
}

interface GroupingStock {
  code: string;
  totalQuantity: number;
  totalAverageCost: number;
  totalCost: number;
  discriminating: string;
  income: number;
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

type ValueOverride = React.ReactNode | (() => JSX.Element)
type PropertiesToString<T> = Record<keyof T, ValueOverride> & ReactKey
type TableListAllStocks = PropertiesToString<Stock>
type TableListStockGrouping = PropertiesToString<GroupingStock>

type ResultFactory<TValue, TValueTable> = { value: TValue, mapperToTable: () => TValueTable }
type ResultFactoryStock = ResultFactory<Stock, TableListAllStocks>
type ResultFactoryGroupingStock = ResultFactory<GroupingStock, TableListStockGrouping>;

export default function Home() {
  const [file, setFile] = useState<FileList | null>(null)
  const [listAllStocks, setListAllStocks] = useState<ResultFactoryStock[]>([])
  const [listStockGroupings, setListStockGroupings] = useState<ResultFactoryGroupingStock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    handleOnChangeFile();

    async function handleOnChangeFile() {
      if (!file || file.length === 0) {
        setIsLoading(false);
        return
      }

      const worksheetJson = await WorksheetService.worksheetsToJson<WorksheetItem[]>(file.item(0)!)

      const list = worksheetJson.map<ResultFactoryStock>((w, index) => createStock({
        id: index,
        date: DateService.DDMMYYYYToDate(w["Data do Negócio"]),
        institution: w['Instituição'],
        quantity: Number(w.Quantidade),
        totalCost: Number(w.Valor),
        tradingCode: w["Código de Negociação"],
        transactionType: w["Tipo de Movimentação"]
      }))

      const listWithoutEtfsAndFiis = list.filter(g => !g.value.tradingCode.includes('11'))
      const groupings = createGroupingsFrom(listWithoutEtfsAndFiis);

      setListStockGroupings(groupings)
      setListAllStocks(listWithoutEtfsAndFiis)
    }

  }, [file])

  useEffect(() => setIsLoading(false), [listAllStocks])

  function onChangeFile(filelist: FileList | null) {
    setIsLoading(true)
    setFile(filelist)
  }

  return (
    <main className="flex min-h-screen flex-col p-24">
      <section className="flex justify-end mb-4">
        <Card className="items-center !p-1">
          <InputFile onChange={onChangeFile} value={file} />
        </Card >
      </section>

      <Card>
        <Table<Stock>
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

      <div className="grid xl:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4 mt-12">
        <ul>
          <li className="mb-4">
            Na declação de imposto de renda acesse o menu lateral: <br />
            | Bens e Dívidas <br />
            <br />
            Selecione as opções:<br />
            | Grupo 3 - Participações Societárias<br />
            | Código 1 - Ações (inclusive as listadas em bolsa)
          </li>
        </ul>
      </div>

      <Card>
        <Table<GroupingStock>
          isLoading={isLoading}
          list={listStockGroupings.map(l => l.mapperToTable())}
          headers={[
            { value: 'Código', accessor: 'code' },
            { value: 'Custo médio (R$)', accessor: 'totalAverageCost' },
            { value: 'Rendimentos (R$)', accessor: 'income' },
            { value: 'Quantidade', accessor: 'totalQuantity' },
            { value: 'Discriminante', accessor: 'discriminating' },
          ]}
        />
      </Card>
    </main>
  )
}

function createGroupingsFrom(listWithoutEtfsAndFiis: ResultFactoryStock[]) {
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
      acc[item.tradingCode] = createGroupingStock({
        code: item.tradingCode,
        totalQuantity: item.quantity,
        totalAverageCost: avarageCost,
        totalCost: item.totalCost,
        discriminating: createDiscriminating(item.quantity, item, avarageCost),
        income: 0,
      });
    }

    return acc;
  }, {});

  const groupings = Object.entries(grouped).map(g => g[1]);
  return groupings;
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
      transactionType: stock.transactionType
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
      totalQuantity: groupingStock.totalQuantity
    })
  }
}
