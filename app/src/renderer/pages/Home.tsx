import { useNavigate } from "react-router-dom"

export default function Home() {
    const navigate = useNavigate();

    return(
        <div className="flex flex-cols gap-2">
            <div className="text-blue-500 text-lg">
                HOME
            </div>
            <div className="cursor-pointer" onClick={() => navigate('/roll20')}>
                Roll 20 Character
            </div>
        </div>
    )
}