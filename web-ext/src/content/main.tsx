import './index.css'

let chatBtn: HTMLButtonElement | undefined;
let chatInput: HTMLTextAreaElement | undefined;
let chatBox: HTMLDivElement | undefined;
let socket: WebSocket | undefined;
let heartbeatInterval: number | undefined;

let gameId: string = '';
const ChatBoxObserver: MutationObserver = new MutationObserver(chatBoxChange);
const processedMsgId: string[] = [];

const serverHostname = import.meta.env.VITE_API_URL;
const wsHostname = import.meta.env.VITE_WS_URL;

console.log('ROLL20 PUSTAKA LOADED!')

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.flag === "start") {
        load(sendResponse);
    }

    return true; 
});

async function load(sendResponse: (response: any) => void) {
    chatBtn = document.querySelector('#chatSendBtn') as HTMLButtonElement;
    chatInput = document.querySelector('#textchat-input > textarea') as HTMLTextAreaElement;
    chatBox = document.querySelector('#textchat > div.content') as HTMLDivElement;

    if (!chatBtn || !chatInput || !chatBox) {
        return;
    }

    let activeNotif = document.querySelector('#roll20ActiveNotif') as HTMLDivElement;
    if (activeNotif) {
        activeNotif.remove();
    }

    gameId = '';
    for (const child of chatBox.children)  {
        if (child.classList.contains('message') && child.classList.contains('system')) {
            const joinLinkEle = child.querySelector('div.userscript-sharelink > a') as HTMLLinkElement | null;
            if (joinLinkEle) {
                if (joinLinkEle.href.startsWith('https://app.roll20.net/join/')) {
                    gameId = joinLinkEle.href.slice('https://app.roll20.net/join/'.length);
                    if (gameId.indexOf('/') != -1) {
                        gameId = gameId.slice(0, gameId.indexOf('/'));
                        
                    }
                    break;
                }
            }
        }
    }

    if (gameId == '') {
        return;
    }

    sendResponse({ gameId: gameId });

    //-------------------------- CONNECT TO WS --------------------------
    if (socket) {
        socket.close();
    }

    socket = new WebSocket(wsHostname + "/" + gameId);

    socket.onopen = () => {
        startHeartbeat();
    };

    socket.onclose = () => {
        stopHeartbeat();
        activeNotif.textContent = "🔴 PUSTAKA";
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        incomingMessageNexus(data.flag, data.data ?? undefined)
    };

    socket.onerror = () => {
        if (socket) {
            socket.close();
        }        
    };

    ChatBoxObserver.disconnect();
    ChatBoxObserver.observe(chatBox, { childList: true, subtree: true });

    activeNotif = document.createElement('div');
    activeNotif.id = 'roll20ActiveNotif';
    activeNotif.classList.add('pustaka-notif');
    activeNotif.textContent = "🟢 PUSTAKA";

    chatBtn.parentElement?.appendChild(activeNotif);
}

function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ flag: "ping" }));
        }
    }, 10000);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
}

async function chatBoxChange(mutationList: MutationRecord[], _observer: MutationObserver) {
    for (const mutation of mutationList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node: Node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const nodeEle = node as HTMLElement;
                    if (nodeEle.classList.contains('message') && !nodeEle.classList.contains('system') && !nodeEle.classList.contains('desc')) {
                        const byEle = nodeEle.querySelector('span.by') as HTMLSpanElement;
                        if (byEle) {
                            messageNexus(
                                byEle.textContent.slice(0, byEle.textContent.length - 1).trim(),
                                nodeEle.textContent.slice(nodeEle.textContent.indexOf(byEle.textContent) + byEle.textContent.length).trim(),
                                nodeEle.getAttribute('data-messageid') ?? ''
                            );
                        } else {
                            let author: string = '';
                            let prevNode = nodeEle.previousElementSibling;

                            while ((author == '') && (prevNode)) {
                                if (nodeEle.classList.contains('message') && !nodeEle.classList.contains('system') && !nodeEle.classList.contains('desc')) {
                                    const byEle = prevNode.querySelector('span.by') as HTMLSpanElement;
                                    if (byEle) {
                                        messageNexus(
                                            byEle.textContent.slice(0, byEle.textContent.length - 1).trim(),
                                            nodeEle.textContent.trim(),
                                            nodeEle.getAttribute('data-messageid') ?? ''
                                        );
                                        break;
                                    }
                                }
                                prevNode = prevNode.previousElementSibling;
                            }
                        }
                    }
                }
            });
        }
    }
}

async function messageNexus(author: string, text: string, msgId: string) {
    if (chatInput && chatBtn) {
        if (processedMsgId.includes(msgId)) {
            return;
        }

        if (text.toLowerCase() == '#ping') {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }

            chatInput.value = "/desc Pong!";
            chatBtn.click();
        } else if (text.toLowerCase() == '#hello') {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }
            
            if (socket) {
                socket.send(JSON.stringify({
                    flag: 'HELLO',
                    data: author
                }));
            }
        } else if (text.toLowerCase() == '#time') {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }
            
            if (socket) {
                socket.send(JSON.stringify({
                    flag: 'TIME-NOW',
                    data: author
                }));
            }
        } else if (text.toLowerCase() == '#effect') {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }
            
            if (socket) {
                socket.send(JSON.stringify({
                    flag: 'EFFECT-NOW',
                    data: author
                }));
            }
        } else if (text.startsWith('#add-effect')) {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }

            const payload = text.split(' ');
            if (payload.length <= 2 ) {
                chatInput.value = "/desc #add-effect {expire in mins} {description}";
                chatBtn.click();
            } else if (!(/^\d+$/).test(payload[1])) {
                chatInput.value = "/desc #add-effect {expire in mins} {description}";
                chatBtn.click();
            } else {
                if (socket) {
                    socket.send(JSON.stringify({
                        flag: 'EFFECT-ADD',
                        data: {
                            expire: Number(payload[1]),
                            desc: payload.slice(2).join(' ').trim()
                        }
                    }));
                }
            }
        } else if (text.startsWith('#remove-current-effect')) {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }

            const payload = text.split(' ');
            if (payload.length <= 1 ) {
                chatInput.value = "/desc #remove-current-effect {description}";
                chatBtn.click();
            } else {
                if (socket) {
                socket.send(JSON.stringify({
                    flag: 'EFFECT-REMOVE-CURRENT',
                    data: payload.slice(1).join(' ').trim()
                }));
            }
            }
        } else if (text.toLowerCase() == '#loot') {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }
            
            if (socket) {
                socket.send(JSON.stringify({
                    flag: 'LOOT-NOW',
                    data: author
                }));
            }
        } else if (text.startsWith('#add-loot')) {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }

            const payload = text.split(' ');
            if (payload.length <= 3 ) {
                chatInput.value = "/desc #add-loot {expire in mins} {qty} {description}";
                chatBtn.click();
            } else if ((!(/^\d+$/).test(payload[1])) || (!(/^\d+$/).test(payload[2]))) {
                chatInput.value = "/desc #add-loot {expire in mins} {qty} {description}";
                chatBtn.click();
            } else {
                if (socket) {
                    socket.send(JSON.stringify({
                        flag: 'LOOT-ADD',
                        data: {
                            expire: Number(payload[1]),
                            qty: Number(payload[2]),
                            desc: payload.slice(3).join(' ').trim()
                        }
                    }));
                }
            }
        } else if (text.startsWith('#remove-loot')) {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }

            const payload = text.split(' ');
            if (payload.length <= 2 ) {
                chatInput.value = "/desc #remove-loot {qty} {description}";
                chatBtn.click();
            } else if (!(/^\d+$/).test(payload[1])) {
                chatInput.value = "/desc #remove-loot {qty} {description}";
                chatBtn.click();
            } else {
                if (socket) {
                    if (socket) {
                        socket.send(JSON.stringify({
                            flag: 'LOOT-REMOVE',
                            data: {
                                qty: Number(payload[1]),
                                desc: payload.slice(2).join(' ').trim()
                            }
                        }));
                    }
                }
            }
        }
    }    
}

async function incomingMessageNexus(flag: string, data: any | undefined) {
    if (flag == "TEXT-MSG") {
        if (socket && chatInput && chatBtn) {
            chatInput.value = "/desc " + data;
            chatBtn.click();
        }
    } else if (flag == "TEXT-LIST") {
        if (socket && chatInput && chatBtn) {
            chatInput.value = (data as string[]).map(text => "/desc " + text).join('\n');
            chatBtn.click();
        }
    }
}