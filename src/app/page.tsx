'use client'

import { Card, IconInfo, IconSearch, InputFile, Table, Tabs } from "@/modules/sharedModule/components"
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
interface WorksheetStocksAndFiisItem {
  'Data do Negócio': string;
  'Tipo de Movimentação': string;
  'Instituição': string;
  'Código de Negociação': string;
  'Quantidade': string;
  'Valor': string;
}

interface WorksheetIncome {
  'Produto': string;
  'Pagamento': string;
  'Tipo de Evento': string;
  'Quantidade': string;
  'Valor líquido': string;
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
  date: Date;
  eventType: 'Dividendo' | 'Rendimento' | 'Juros Sobre Capital Próprio';
  product: string;
  quantity: number;
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
  const [fileStocksAndFiis, setFileStocksAndFiis] = useState<FileList | null>(null)
  const [fileIncome, setFileIncome] = useState<FileList | null>(null)
  const [listAllStocks, setListAllStocks] = useState<ResultFactoryStock[]>([])
  const [listStockGroupings, setListStockGroupings] = useState<ResultFactoryGroupingStock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (fileStocksAndFiis?.length && fileIncome?.length) {
      handleOnChangeFile();
    }

    async function handleOnChangeFile() {
      setIsLoading(true)

      if (!fileStocksAndFiis || fileStocksAndFiis.length === 0 || !fileIncome || fileIncome.length === 0) {
        setIsLoading(false);
        return
      }

      const worksheetJsonStocks = await WorksheetService.worksheetsToJson<WorksheetStocksAndFiisItem[]>(fileStocksAndFiis.item(0)!)
      const worksheetJsonIncomes = await WorksheetService.worksheetsToJson<WorksheetIncome[]>(fileIncome.item(0)!)

      const listStocks = worksheetJsonStocks.map<ResultFactoryStock>((w, index) => createStock({
        id: index,
        date: DateService.DDMMYYYYToDate(w["Data do Negócio"]),
        institution: w['Instituição'],
        quantity: Number(w.Quantidade),
        totalCost: Number(w.Valor),
        tradingCode: w["Código de Negociação"],
        transactionType: w["Tipo de Movimentação"]
      }))

      const listIncomes = worksheetJsonIncomes.map<ResultFactoryIncome>((w, index) => createIncome({
        id: index,
        product: w['Produto'],
        eventType: w['Tipo de Evento'] as Income['eventType'],
        date: DateService.DDMMYYYYToDate(w["Pagamento"]),
        quantity: Number(w['Quantidade']),
        value: Number(w["Valor líquido"]),
      }))

      const listStocksWithoutEtfsAndFiis = listStocks.filter(g => !g.value.tradingCode.includes('11'))
      const listIncomesWithoutEtfsAndFiis = listIncomes.filter(g => !g.value.product.includes('FII'))

      const groupingsIncomes = createGroupingsIncomes(listIncomesWithoutEtfsAndFiis)
      const groupings = createGroupingsFrom(listStocksWithoutEtfsAndFiis, groupingsIncomes);

      setListStockGroupings(groupings)
      setListAllStocks(listStocksWithoutEtfsAndFiis)
    }
  }, [fileStocksAndFiis, fileIncome])


  useEffect(() => setIsLoading(false), [listAllStocks])

  function onChangeFileStockAndFiis(filelist: FileList | null) {
    setFileStocksAndFiis(filelist)
  }

  function onChangeFileIncome(filelist: FileList | null) {
    setFileIncome(filelist)
  }

  return (
    <main className="flex min-h-screen flex-col p-24">
      <section className="flex justify-end items-end mb-4 gap-1">
        <Card className="items-center !p-1">
          <div>Planilha de negociações</div>
          <InputFile onChange={onChangeFileStockAndFiis} value={fileStocksAndFiis} labelId="fileStock" />
        </Card>

        <Card className="items-center !p-1">
          <div>Planilha de proventos</div>
          <InputFile onChange={onChangeFileIncome} value={fileIncome} labelId="fileIncome" />
        </Card>
      </section>
      <Tabs initialTab={0} tabs={['Todas', 'Ações', 'Como declarar?']}>
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
        <section>
          <Card>
            <Table<GroupingStock>
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
        </section>
        <section>
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
        </section>
      </Tabs>
    </main>
  )
}

function createGroupingsFrom(listWithoutEtfsAndFiis: ResultFactoryStock[], listIncomeWithoutFiis: ResultFactoryGroupingIncome[]) {
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

function createGroupingsIncomes(listIncomeWithoutFiis: ResultFactoryIncome[]) {
  const grouped = listIncomeWithoutFiis.reduce<{ [k: string]: ResultFactoryGroupingIncome; }>((acc, { value: item }) => {
    if (acc[item.product]) {
      const sumValueTotal = acc[item.product].value + item.quantity;
      acc[item.product] = { ...item, value: sumValueTotal }
    } else {
      acc[item.product] = {
        ...item,
        product: item.product,
        value: item.value,
        eventType: item.eventType,
      }
    }

    return acc;
  }, {});

  return Object.entries(grouped).map(g => g[1]);
}

function getIncome(listIncomeWithoutFiis: ResultFactoryGroupingIncome[], item: Stock) {
  const { isStockFractional, tradingCodeLowerCase } = getInfoStock(item);

  if (isStockFractional) {
    return listIncomeWithoutFiis.find(i =>
      (i.eventType === 'Dividendo' || i.eventType === 'Rendimento') &&
      i.product.toLowerCase().includes(tradingCodeLowerCase.substring(0, tradingCodeLowerCase.length - 1))
    )?.value;
  }

  return listIncomeWithoutFiis.find(i =>
    (i.eventType === 'Dividendo' || i.eventType === 'Rendimento') &&
    i.product.toLowerCase().includes(tradingCodeLowerCase)
  )?.value;
}

function getJcp(listIncomeWithoutFiis: ResultFactoryGroupingIncome[], item: Stock) {
  const { isStockFractional, tradingCodeLowerCase } = getInfoStock(item);

  if (isStockFractional) {
    return listIncomeWithoutFiis.find(i =>
      (i.eventType === 'Juros Sobre Capital Próprio') &&
      i.product.toLowerCase().includes(tradingCodeLowerCase.substring(0, tradingCodeLowerCase.length - 1))
    )?.value;
  }

  return listIncomeWithoutFiis.find(i =>
    (i.eventType === 'Juros Sobre Capital Próprio') &&
    i.product.toLowerCase().includes(tradingCodeLowerCase)
  )?.value;
}

function getInfoStock(item: Stock) {
  const tradingCodeLowerCase = item.tradingCode.toLowerCase();
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
      date: DateService.toFormatDDMMYYYY(income.date),
      eventType: income.eventType,
      reactKey: income.id,
      product: income.product,
      quantity: income.quantity,
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
