import { Fragment, useState } from "react";
const serverHostname = import.meta.env.VITE_API_URL;

function intToTimeString(time: number) {
    const hour = Math.floor(time/60);
    const min = time - hour*60;

    return (hour.toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0'));
}

async function sendTimeMsg (gameId: string, flag:string, value:number) {
    await fetch(serverHostname + '/popup/time', {
        method: "POST",
        body: JSON.stringify({
            gameId,
            flag,
            value
        })
    });
}

export default function Popup() {
    const [currTime, setCurrTime] = useState<string>('00:00');
    const [oldTime, setOldTime] = useState<string>('00:00');
    const [gameId, setGameId] = useState<string>('');

    async function reloadPustaka() {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tab) return;

        const res = await chrome.tabs.sendMessage(tab.id ?? 0, { flag: 'start' });
        setGameId(res.gameId);

        const timeRes = await fetch(serverHostname + '/popup/time?gameid=' + res.gameId, {
            method: 'GET'
        });

        const time = await timeRes.text();
        setCurrTime(intToTimeString(Number(time)));
        setOldTime(intToTimeString(Number(time)));
    }

    return(
        <div className='container'>
            <div className='title'>Roll20 + Pustaka</div>
            <button className='btn-primary'
                onClick={reloadPustaka}
            >Load \ Reload Pustaka</button>
            {
                (gameId != '') ?
                <Fragment>
                    <div className="set-time-container">
                        <button className='btn-primary'
                            onClick={async () => {
                                await sendTimeMsg(gameId, 'SHIFT', 
                                    currTime.split(':').reduce((acc, val, idx) => acc + Number(val) * Math.pow(60, 1 - idx), 0)
                                    - oldTime.split(':').reduce((acc, val, idx) => acc + Number(val) * Math.pow(60, 1 - idx), 0)
                                );
                                setOldTime(currTime);
                            }}
                        >Shift Time</button>
                        <button className='btn-primary'
                            onClick={async () => {
                                await sendTimeMsg(gameId, 'SET', currTime.split(':').reduce((acc, val, idx) => acc + Number(val) * Math.pow(60, 1 - idx), 0));
                                setOldTime(currTime);
                            }}
                        >Set Time</button>
                    </div>
                    <input
                        id="time-input"
                        type="time"
                        value={currTime}
                        onChange={(ev) => {
                            setCurrTime(ev.target.value);
                        }}
                    />
                </Fragment>
                : null
            }
        </div>
    )
}