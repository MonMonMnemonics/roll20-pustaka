import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Roll20Char() {
    const navigate = useNavigate();

    useEffect(() => {
        window.browserAPI?.loadBrowserChild(true, 'https://roll20.net/');

        return () => {
            window.browserAPI?.loadBrowserChild(false, '');
        }
    }, []);

    return(
        <div className="flex flex-cols gap-2">
            <div className="text-red-500 text-lg cursor-pointer" onClick={() => navigate('/')}>
                HOME
            </div>
            <div>
                Roll 20 Character
            </div>
        </div>
    )
}