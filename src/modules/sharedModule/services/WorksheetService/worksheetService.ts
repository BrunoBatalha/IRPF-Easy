import * as XLSX from 'xlsx';

export async function worksheetsToJson<TJson>(file: File) {
    const reader = new FileReader();
    reader.readAsBinaryString(file);

    return new Promise<TJson>((resolve) => {
        reader.onload = () => {
            const data = reader.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.SheetNames[0];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
            resolve(json as TJson);
        };
    });
}