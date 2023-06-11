'use client'
import { Card, IconFile } from "..";

interface Props {
    onChange: (fileList: FileList | null) => void;
    value: FileList | null;
}

export default function InputFile({ onChange, value }: Props) {
    const hasFile = value && value.length;

    return (
        <Card className="items-center !p-1">
            <>
                <span className="mx-4">
                    <IconFile />
                </span>
                <span className={`${hasFile ? '' : 'text-gray-400'}`}>{
                    hasFile ? value.item(0)!.name : 'Selecione um arquivo'
                }</span>

                <LabelButtonImport />

                <input
                    type="file"
                    name="file-input"
                    id="file-input"
                    className="hidden"
                    onChange={e => onChange(e.target.files)}
                />
            </>
        </Card>
    )
}


function LabelButtonImport() {
    return (
        <label htmlFor="file-input"
            className="
                block
                rounded-md
                bg-orange-400
                hover:bg-orange-500
                hover:cursor-pointer
                transition
                duration-200
                ml-4
                px-5
                py-4
                text-orange-50
                font-semibold">
            Importar
        </label>
    )
}
