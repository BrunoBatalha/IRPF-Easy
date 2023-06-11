'use client'

import { Card, InputFile, Spinner, Table } from "@/modules/sharedModule/components"
import { ListItem } from "@/modules/sharedModule/interfaces";
import { DateService, NumberService, WorksheetService } from "@/modules/sharedModule/services";
import { useEffect, useState } from "react";

// TODO: Exportar lista completa de Fundos em CSV somente os ETFs, tem no site da B3
// o valor é o preço médio vezes a quantidade de ações
interface WorksheetItem {
  'Data do Negócio': string;
  'Tipo de Movimentação': string;
  'Instituição': string;
  'Código de Negociação': string;
  'Quantidade': string;
  'Valor': string;
}

interface GroupingItem {
  code: string;
  totalQuantity: number;
  averageCost: number;
  totalCost: number;
  discriminating: string;
  income: number;
}

export default function Home() {
  const [file, setFile] = useState<FileList | null>(null)
  const [list, setList] = useState<ListItem[]>([])
  const [listGroupings, setListGroupings] = useState<GroupingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    handleOnChangeFile();

    async function handleOnChangeFile() {
      if (!file || file.length === 0) {
        setIsLoading(false);
        return
      }

      const worksheetJson = await WorksheetService.worksheetsToJson<WorksheetItem[]>(file.item(0)!)

      const list = worksheetJson.map<ListItem>((w, index) => ({
        id: index,
        date: DateService.DDMMYYYYToDate(w["Data do Negócio"]),
        institution: w['Instituição'],
        quantity: Number(w.Quantidade),
        totalCost: Number(w.Valor),
        tradingCode: w["Código de Negociação"],
        transactionType: w["Tipo de Movimentação"]
      }))

      const listWithoutEtfsAndFiis = list.filter(g => !g.tradingCode.includes('11'))
      const groupings = createGroupingsFrom(listWithoutEtfsAndFiis);

      setListGroupings(groupings)
      setList(listWithoutEtfsAndFiis)
    }

  }, [file])

  useEffect(() => {
    setIsLoading(false);
  }, [list])


  function onChangeFile(filelist: FileList | null) {
    setIsLoading(true)
    setFile(filelist)
  }

  return (
    <main className="flex min-h-screen flex-col p-24">
      <section className="flex justify-end mb-4">
        <InputFile onChange={onChangeFile} value={file} />
      </section>

      <Card>
        <Table list={list} isLoading={isLoading} />
      </Card>

      <div className="grid xl:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4 mt-6">
        {listGroupings.map(g => (
          <Card key={g.code}>
            <ul>
              <li className="mb-4">
                No site do IRPF: <br />
                Menu Bens e Dívidas <br />
                Grupo 3 - Participações Societárias<br />
                Código 1 - Ações (inclusive as listadas em bolsa)
              </li>
              <li>Código do negócio: {g.code}</li>
              <li>Quantidade: {NumberService.formatToCurrency(g.totalQuantity)}</li>
              <li>Preço médio: {NumberService.formatToCurrency(g.averageCost)}</li>
              <li>Rendimentos: {g.income}</li>
              <li>Discriminante: {g.discriminating}</li>
            </ul>
          </Card>
        ))}
      </div>

    </main>
  )
}


function createGroupingsFrom(listWithoutEtfsAndFiis: ListItem[]) {
  const grouped = listWithoutEtfsAndFiis.reduce<{ [k: string]: GroupingItem; }>((acc, item) => {
    if (acc[item.tradingCode]) {
      const totalQuantity = acc[item.tradingCode].totalQuantity + item.quantity;
      const totalCost = acc[item.tradingCode].totalCost + item.totalCost;
      const avarageCost = totalCost / totalQuantity;
      acc[item.tradingCode] = {
        ...acc[item.tradingCode],
        totalQuantity: totalQuantity,
        averageCost: avarageCost,
        totalCost: totalCost,
        discriminating: createDiscriminating(totalQuantity, item, avarageCost),
      };
    } else {
      const avarageCost = item.totalCost / item.quantity;
      acc[item.tradingCode] = {
        code: item.tradingCode,
        totalQuantity: item.quantity,
        averageCost: avarageCost,
        totalCost: item.totalCost,
        discriminating: createDiscriminating(item.quantity, item, avarageCost),
        income: 0,
      };
    }

    return acc;
  }, {});

  const groupings = Object.entries(grouped).map(g => g[1]);
  return groupings;
}

function createDiscriminating(totalQuantity: number, item: ListItem, avarageCost: number): string {
  return `${totalQuantity} acoes da ${item.tradingCode} pelo valor medio de R$ ${NumberService.formatToCurrency(avarageCost)} por meio da ${item.institution}`;
}
