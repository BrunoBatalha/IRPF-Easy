interface Props {
    children: React.ReactElement,
    className?: string
}

export default function Card({ children, className }: Props) {
    return (
        <div className={`p-5 bg-white shadow-sm rounded-md flex border border-gray-200 ${className}`}>
            {children}
        </div>
    )
}