import { useState } from 'react'

export default function Page() {
    const [cont, setCont] = useState(0)
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            caça B {cont}
            <button className='btn bg-orange-400 py-2 px-4 hover:bg-orange-800 transition  rounded-lg'
            onClick={() => setCont(cont + 1)}
            >botao</button>
        </main>
    )
}
