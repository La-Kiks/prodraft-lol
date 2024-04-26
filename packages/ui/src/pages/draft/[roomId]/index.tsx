import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';
import { Champion, DraftPayload } from "@prodraft/common/src/type";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:3001";
const PLAYER = 'spec'


function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const socketIo = io(SOCKET_URL, {
            reconnection: true,
            upgrade: true,
            transports: ["websocket", "polling"],
        });


        setSocket(socketIo);

        return function () {
            socketIo.disconnect()
        };
    }, []);

    return socket;
}


export default function SpecDraftPage() {
    // useState declarations :
    const [champdata, setChampdata] = useState<{ [key: string]: Champion }>({});
    const [champArray, setChampArray] = useState<string[]>(new Array(20).fill('Helmet'))
    const [slotIndex, setSlotIndex] = useState(0)
    const [timer, setTimer] = useState(69)
    const [gamePhase, setGamePhase] = useState<string>('WAITING')
    const [turn, setTurn] = useState('')
    const [spectators, setSpectators] = useState(0)

    // Other declarations
    const router = useRouter();
    const { ROOM_ID, blueName, redName } = router.query as { ROOM_ID: string; blueName: string; redName: string; }
    const socket = useSocket();
    const helmetUrl = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/icon-helmet.png"




    // Functions : 
    // INITIALIZE STEP 0 - champ grid + waiting room + not ready
    // F5
    useEffect(() => {
        socket?.on('connect', () => {
            console.log("Socket connected")
            socket?.emit('draftpage', (data: { [key: string]: Champion }) => setChampdata(data))
            socket?.emit('new:room', ROOM_ID)
            socket?.emit('spectate:enter', ROOM_ID)


            socket?.on(`state:${ROOM_ID}`, (state: DraftPayload) => {
                if (state) {
                    const { phase, pturn, idx, champs } = state.draft
                    setGamePhase(phase)
                    setTurn(pturn)
                    setSlotIndex(idx)
                    setChampArray(champs)
                }
            })

            socket?.on(`timer:${ROOM_ID}`, (time: number) => {
                setTimeout(() => {
                    setTimer(time)
                }, 500)

            })
        })

    }, [ROOM_ID]);

    socket?.on(`specators:count:${ROOM_ID}`, (specount: number) => {
        setSpectators(specount)
    })

    socket?.on(`start:${ROOM_ID}`, () => {
        setGamePhase('PLAYING')
        setTurn('blue')
    })

    socket?.on(`click:blue:${ROOM_ID}`, (idx: number, currentChamp: string) => {
        const updtChampArray = [...champArray]
        updtChampArray[idx] = currentChamp
        setChampArray(updtChampArray)
    })
    socket?.on(`click:red:${ROOM_ID}`, (idx: number, currentChamp: string) => {
        const updtChampArray = [...champArray]
        updtChampArray[idx] = currentChamp
        setChampArray(updtChampArray)
    })


    // DRAFT GAMES & TURNS
    socket?.on(`validate:${ROOM_ID}`, (payload: { idx: number, pturn: string, phase: string } | { phase: string }) => {
        if (payload) {
            const phase = payload.phase
            if (phase === 'PLAYING' && 'idx' in payload && 'pturn' in payload) {
                const idx = payload.idx
                const pturn = payload.pturn
                setGamePhase(phase)
                setTurn(pturn)
                setSlotIndex(idx)
            } else if (payload.phase === 'OVER') {
                setGamePhase(phase)
            }
        } else {
            console.log('error receiving validation')
        }
    })

    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            setTimer(60)
        } else if (gamePhase == 'OVER') {
            setTimer(0)
        }
    }, [gamePhase])
    // timer logc
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            const countdown = setTimeout(() => {
                if (timer > 0) {
                    setTimer(prevTimer => prevTimer - 1);
                }
            }, 1000);
            return () => clearTimeout(countdown)
        }
    }, [timer])

    // Reset timer on new idx (new pick/ban)
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            setTimer(60)
        }
    }, [slotIndex])

    // Redirect to the base page
    const bannerClick = async () => {
        await router.push(`/`)
    }

    // Return the page view :
    return (
        <main className="flex flex-col p-0 w-full min-h-screen min-w-[540px] space-y-0 m-auto  items-center place-content-start bg-slate-800 bg-gradient-to-r from-blue-900 to-red-900">
            <div className="p-2 mt-8 mb-8 flex content-start justify-center text-4xl text-white hover:text-slate-300">
                <h1 onClick={() => bannerClick()}>Prodraft.lol</h1>
            </div>

            <div className="max-w-5xl w-full flex flex-col items-center border rounded border-slate-500 bg-slate-700 bg-gradient-to-r from-blue-900 to-red-900">

                {/* DRAFT HEADER :bg-slate-100
                BOX 1 : Blue team name  + blue teams bans (x3)
                BOX 2 : Timer
                BOX 3 : Red team name + red team bans (x3)
                */}

                <div className="draft-header flex  w-full items-center  ">
                    <div className="box1 basis-5/12  flex flex-col ">
                        <div className={`team-name max-w-48 sm:max-w-96 text-white bg-blue-500 p-1 transition-width duration-500 ${turn === 'red' ? 'w-1/2 ' : 'w-full'}`}>
                            <h1 className="text-xl overflow-hidden">{blueName}</h1>
                        </div>
                        <div className="team-bans w-fit flex">
                            {champArray && champArray[0] && champdata && champdata[champArray[0]] && champdata[champArray[0]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 0) ? 'animate-pulse' : ''}`} alt={champdata[champArray[0]]['name']}
                                    src={champdata[champArray[0]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20"
                                    src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[2] && champdata && champdata[champArray[2]] && champdata[champArray[2]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 2) ? 'animate-pulse' : ''}`} alt={champdata[champArray[2]]['name']}
                                    src={champdata[champArray[2]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[4] && champdata && champdata[champArray[4]] && champdata[champArray[4]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 4) ? 'animate-pulse' : ''}`} alt={champdata[champArray[4]]['name']}
                                    src={champdata[champArray[4]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                        </div>
                    </div>

                    <div className="box2 basis-2/12 flex justify-center p-1 text-white text-5xl"> {timer} </div>

                    <div className="box3 basis-5/12 flex flex-col place-items-end ">
                        <div className={`team-name max-w-48 sm:max-w-96 text-white bg-red-500 flex flex-row-reverse p-1 transition-width duration-500 ${turn === 'blue' ? 'w-1/2' : 'w-full '}`}>
                            <h1 className="text-xl overflow-hidden">{redName}</h1>
                        </div>
                        <div className="team-bans mx-1 w-fit flex flex-row-reverse ">
                            {champArray && champArray[1] && champdata && champdata[champArray[1]] && champdata[champArray[1]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 1) ? 'animate-pulse' : ''}`} alt={champdata[champArray[1]]['name']}
                                    src={champdata[champArray[1]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[3] && champdata && champdata[champArray[3]] && champdata[champArray[3]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 3) ? 'animate-pulse' : ''}`} alt={champdata[champArray[3]]['name']}
                                    src={champdata[champArray[3]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[5] && champdata && champdata[champArray[5]] && champdata[champArray[5]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 5) ? 'animate-pulse' : ''}`} alt={champdata[champArray[5]]['name']}
                                    src={champdata[champArray[5]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                        </div>
                    </div>
                </div>

                {/* CORE DRAFT :
                 BOX 1 : BLUE TEAM (6 elements : 5 champs square + 1 box for 2 bans)
                 BOX 2 : CHAMPION GRID (1 header + 1 big grid)
                 BOX 3 : RED TEAM (6 elements)
                */}

                <div className="overflow-hidden w-full flex flex-nowrap ">

                    <div className="box1 flex flex-col h-full justify-around  basis-1/3 md:basis-3/12 ">

                        {champArray && champArray[6] && champdata && champdata[champArray[6]] && champdata[champArray[6]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 6) ? 'animate-pulse' : ''}`} alt={champdata[champArray[6]]['name']}
                                src={champdata[champArray[6]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[9] && champdata && champdata[champArray[9]] && champdata[champArray[9]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 9) ? 'animate-pulse' : ''}`} alt={champdata[champArray[9]]['name']}
                                src={champdata[champArray[9]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[10] && champdata && champdata[champArray[10]] && champdata[champArray[10]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 10) ? 'animate-pulse' : ''}`} alt={champdata[champArray[10]]['name']}
                                src={champdata[champArray[10]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                        <div className="bans2 flex w-fit">

                            {champArray && champArray[13] && champdata && champdata[champArray[13]] && champdata[champArray[13]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 13) ? 'animate-pulse' : ''}`} alt={champdata[champArray[13]]['name']}
                                    src={champdata[champArray[13]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[15] && champdata && champdata[champArray[15]] && champdata[champArray[15]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 15) ? 'animate-pulse' : ''}`} alt={champdata[champArray[15]]['name']}
                                    src={champdata[champArray[15]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}

                        </div>

                        {champArray && champArray[17] && champdata && champdata[champArray[17]] && champdata[champArray[17]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 17) ? 'animate-pulse' : ''}`} alt={champdata[champArray[17]]['name']}
                                src={champdata[champArray[17]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[18] && champdata && champdata[champArray[18]] && champdata[champArray[18]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 18) ? 'animate-pulse' : ''}`} alt={champdata[champArray[18]]['name']}
                                src={champdata[champArray[18]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                    </div>

                    <div className=" box2   h-[640px] w-full flex justify-content items-center basis-1/3 md:basis-6/12 ">
                        {gamePhase === 'PLAYING' && champArray && champArray[slotIndex] && champdata && champdata[champArray[slotIndex]] && champdata[champArray[slotIndex]]['champ_ct'] ? (
                            <img className="border-4 rounded border-slate-800 m-auto w-auto h-auto" alt={champdata[champArray[slotIndex]]['name']}
                                src={champdata[champArray[slotIndex]]['champ_ct']} />
                        ) : (

                            <h1 className="p-1 text-xl text-white m-auto"> . . . </h1>
                        )}
                    </div>

                    <div className="box3 flex flex-col h-full justify-around items-end basis-1/3 md:basis-3/12 ">

                        {champArray && champArray[7] && champdata && champdata[champArray[7]] && champdata[champArray[7]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 7) ? 'animate-pulse' : ''}`} alt={champdata[champArray[7]]['name']}
                                src={champdata[champArray[7]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[8] && champdata && champdata[champArray[8]] && champdata[champArray[8]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 8) ? 'animate-pulse' : ''}`} alt={champdata[champArray[8]]['name']}
                                src={champdata[champArray[8]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[11] && champdata && champdata[champArray[11]] && champdata[champArray[11]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 11) ? 'animate-pulse' : ''}`} alt={champdata[champArray[11]]['name']}
                                src={champdata[champArray[11]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                        <div className="bans2 flex flex-row-reverse  w-fit">

                            {champArray && champArray[12] && champdata && champdata[champArray[12]] && champdata[champArray[12]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 12) ? 'animate-pulse' : ''}`} alt={champdata[champArray[12]]['name']}
                                    src={champdata[champArray[12]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[14] && champdata && champdata[champArray[14]] && champdata[champArray[14]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 14) ? 'animate-pulse' : ''}`} alt={champdata[champArray[14]]['name']}
                                    src={champdata[champArray[14]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}

                        </div>

                        {champArray && champArray[16] && champdata && champdata[champArray[16]] && champdata[champArray[16]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 16) ? 'animate-pulse' : ''}`} alt={champdata[champArray[16]]['name']}
                                src={champdata[champArray[16]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[19] && champdata && champdata[champArray[19]] && champdata[champArray[19]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 19) ? 'animate-pulse' : ''}`} alt={champdata[champArray[19]]['name']}
                                src={champdata[champArray[19]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                    </div>
                </div>

                {/* DRAFT FOOTER :
                 BOX 1 : BUTTON TO VALIDATE THE CURRENT ACTION
                */}

                <div className="draft-footer w-full flex items-center  justify-center ">
                    <h1 className=" w-auto h-12 p-2 mt-10 mb-10 text-lg flex-shrink-0 text-white"> Spectators : {spectators}</h1>
                </div>
            </div>
        </main>
    )
}