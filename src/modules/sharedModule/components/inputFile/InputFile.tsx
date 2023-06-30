'use client'

import { IconFile } from "..";

interface Props {
    onChange: (fileList: FileList | null) => void;
    value: FileList | null;
    labelId: string;
}

export default function InputFile({ onChange, value, labelId }: Props) {
    const hasFile = value && value.length;

    return (
        <>
            <span className="mx-4">
                <IconFile />
            </span>
            <span className={`${hasFile ? '' : 'text-gray-500'}`}>{
                hasFile ? value.item(0)!.name : 'Selecione um arquivo'
            }</span>

            <LabelButtonImport labelId={labelId} />

            <input
                type="file"
                name={labelId}
                id={labelId}
                className="hidden"
                onChange={e => onChange(e.target.files)}
            />
        </>
    )
}


function LabelButtonImport({ labelId }: { labelId: string }) {
    return (
        <label htmlFor={labelId}
            className="
                block
                rounded-md
                bg-orange-700
                hover:bg-orange-800
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
