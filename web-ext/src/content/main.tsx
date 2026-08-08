import './index.css'

let chatBtn: HTMLButtonElement | undefined;
let chatInput: HTMLTextAreaElement | undefined;
let chatBox: HTMLDivElement | undefined;
const ChatBoxObserver: MutationObserver = new MutationObserver(chatBoxChange);
const processedMsgId: string[] = [];

console.log('ROLL20 PUSTAKA LOADED!')

chrome.runtime.onMessage.addListener((message) => {
    if (message.flag === "start") {
        load();
    }

    return true; 
});

async function load() {
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

    ChatBoxObserver.disconnect();
    ChatBoxObserver.observe(chatBox, { childList: true, subtree: true });

    activeNotif = document.createElement('div');
    activeNotif.id = 'roll20ActiveNotif';
    activeNotif.classList.add('pustaka-notif');
    activeNotif.textContent = "🟢 PUSTAKA";

    chatBtn.parentElement?.appendChild(activeNotif)
}

async function chatBoxChange(mutationList: MutationRecord[], _observer: MutationObserver) {
    for (const mutation of mutationList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node: Node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const nodeEle = node as HTMLElement;
                    if (nodeEle.classList.contains('message') && !nodeEle.classList.contains('system')) {
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
                                if (nodeEle.classList.contains('message') && !nodeEle.classList.contains('system')) {
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

async function messageNexus(_author: string, text: string, msgId: string) {
    if (chatInput && chatBtn) {
        if (processedMsgId.includes(msgId)) {
            return;
        }

        if(text == '#ping') {
            processedMsgId.push(msgId);
            if (processedMsgId.length > 100) {
                processedMsgId.shift();
            }

            chatInput.value = "Pong!";
            chatBtn.click();
        }
    }    
}