"use client";

import React, {useRef, useEffect, useState, useCallback} from 'react';
import Navbar from "@/components/Navbar";
import clsx from "clsx";
import Pusher from "pusher-js";
import { useSearchParams} from "next/navigation";

interface GridCell {
    number: number;
    x: number;
    y: number;
}

interface User {
    name: string
    currentWalletAmount: number
    currentBetAmount: number
    currentBet: string
    totalWin: number,
    currentWin: number,
    currentLose: number
}

const users: User[] = [
    {
        name: "Chinmay",
        currentWalletAmount: 100,
        currentBetAmount: 0,
        currentBet: "",
        totalWin: 0,
        currentWin: 0,
        currentLose: 0,
    },
]

// Utility function to extract name from email
const extractNameFromEmail = (email: string): string => {
    return email.split('@')[0];
};

function Game() {
    const searchParams = useSearchParams();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [shareLink, setShareLink] = useState("");
    const [currentUserType, setCurrentUserType] = useState("");
    const [channelToSubscribe, setChannelToSubscribe] = useState("");

    const GRID_SIZE = 10;
    const CELL_SIZE = 40;
    const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

    const cells: GridCell[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const x = (i % GRID_SIZE) * CELL_SIZE;
        const y = Math.floor(i / GRID_SIZE) * CELL_SIZE;
        cells.push({ number: i + 1, x, y });
    }

    // load the user
    useEffect(() => {
        const loadUserAndSetInitialStates = async () => {
            const user = users[0];
            setCurrentUser(user);

            if (searchParams.get("usertype")) {
                const userType = searchParams.get("usertype");

                if (userType === "host") {
                    // @ts-ignore
                    let userEmail = localStorage.getItem("user_email");
                    let userName = extractNameFromEmail(userEmail!);
                    setChannelToSubscribe(`private-room-${userName}`);
                }

                if (userType === "participant") {
                    // @ts-ignore
                    let userEmail = searchParams.get("hostemail");
                    let userName = extractNameFromEmail(userEmail!);
                    setChannelToSubscribe(`private-room-${userName}`);
                }
                // @ts-ignore
                setCurrentUserType(userType);
            }
        }
        loadUserAndSetInitialStates()

    }, [searchParams])

    // pusher setup
    const setupPusher = useCallback(() => {
        if (currentUserType !== "host" && currentUserType !== "participant") {
            return () => {}; // Return empty cleanup function if not host or participant
        }

        const pusher = new Pusher("6ba8c285cf1ace0586de", {
            cluster: "ap3",
            channelAuthorization: {
                endpoint: "http://localhost:8080/pusher/auth",
                transport: 'ajax'
            },
        });

        // subscribing to a private channel
        console.log("channel to subscribe: ", channelToSubscribe)
        const privateChannel = pusher.subscribe(channelToSubscribe);
        privateChannel.bind("pusher:subscription_succeeded", () => {
            console.log("Successfully subscribed to private channel");
            setShareLink(`${localStorage.getItem("user_email")}`);
        });

        privateChannel.bind("pusher:subscription_error", (error: Error) => {
            console.error("Error subscribing to private channel:", error);
        });

        // put real time logic here------------------------------------------------------------
        privateChannel.bind("participant-joined", (data: any) => {
            alert('new participant joined' + data)
        });
        // real time logic here----------------------------------------------------------------

        return () => {
            privateChannel.unbind_all();
            privateChannel.unsubscribe();
            pusher.unsubscribe(channelToSubscribe);
        };
    }, [currentUserType, channelToSubscribe]);

    const joinRoom = useCallback(async () => {
        if (channelToSubscribe && (currentUserType === "host" || currentUserType === "participant")) {
            try {
                const response = await fetch(`http://localhost:8080/api/game/join-room?roomId=${encodeURIComponent(channelToSubscribe)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error('Failed to join room');
                }

                const result = await response.text();
                console.log(result); // Log the response from the server
            } catch (error) {
                console.error('Error joining room:', error);
            }
        }
    }, [channelToSubscribe, currentUserType]);

    useEffect(() => {
        if (currentUser && channelToSubscribe) {
            const pusherCleanup = setupPusher();
            joinRoom();

            return () => {
                pusherCleanup();
            };
        }
    }, [currentUser, channelToSubscribe, setupPusher, joinRoom]);

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.strokeStyle = '#ccc';
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';

        cells.forEach(cell => {
            ctx.strokeRect(cell.x, cell.y, CELL_SIZE, CELL_SIZE);
            ctx.fillText(cell.number.toString(), cell.x + 5, cell.y + 20);
        });
    };

    const highlightSelectedRange = (ctx: CanvasRenderingContext2D) => {
        if (!selectedRange) return;

        ctx.fillStyle = 'rgba(0, 128, 255, 0.3)';
        cells.forEach(cell => {
            if (cell.number >= selectedRange.start && cell.number <= selectedRange.end) {
                ctx.fillRect(cell.x, cell.y, CELL_SIZE, CELL_SIZE);
            }
        });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            drawGrid(ctx);
            highlightSelectedRange(ctx);
        };

        render();
    }, [selectedRange, isLocked]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isLocked) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellIndex = Math.floor(y / CELL_SIZE) * GRID_SIZE + Math.floor(x / CELL_SIZE);
        const selectedNumber = cellIndex + 1;

        setSelectedRange({ start: selectedNumber, end: selectedNumber });
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isLocked || !isDragging || !selectedRange) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellIndex = Math.floor(y / CELL_SIZE) * GRID_SIZE + Math.floor(x / CELL_SIZE);
        const currentNumber = cellIndex + 1;

        setSelectedRange(prev => ({
            start: Math.min(prev!.start, currentNumber),
            end: Math.max(prev!.start, currentNumber)
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setSelectedRange(null);
        setIsLocked(false);
        if (currentUser) {
            setCurrentUser({
                ...currentUser,
                currentBetAmount: 0,
                currentBet: ""
            })
        }
    };

    const handleLock = () => {
       if (selectedRange && currentUser) {
           setIsLocked(true);
           setCurrentUser({
               ...currentUser,
               currentBet: `${selectedRange.start}-${selectedRange.end}`,
           })
       }
    }

    const handleBetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newBetAmount = Number(e.target.value)
        if (currentUser && newBetAmount <= currentUser.currentWalletAmount) {
           setCurrentUser({
               ...currentUser,
               currentBetAmount: newBetAmount,
           })
        }
    };

    const availableBetOptions = currentUser
        ? [10, 50, 100, 300, 500].filter(amount => amount <= currentUser.currentWalletAmount)
        : [];

    return (
        <>
            <Navbar />
            <main className={clsx("flex w-full min-h-screen")}>
                <section className="flex w-full h-full space-x-5 items-center justify-between p-12">
                    <div className={clsx("flex flex-col items-center w-1/2")}>
                        <h1 className="text-3xl font-bold mb-4">Gambing Grid</h1>
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            className="border border-gray-300 shadow-lg"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                        {/*{selectedRange && (*/}
                        {/*    <p className="mt-4 text-lg">*/}
                        {/*        Selected range: {selectedRange.start} - {selectedRange.end}*/}
                        {/*    </p>*/}
                        {/*)}*/}
                        <div className="mt-4 space-x-4">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                disabled={isLocked}
                            >
                                Reset Selection
                            </button>
                            <button
                                onClick={handleLock}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                disabled={isLocked || !selectedRange || !currentUser?.currentBetAmount}
                            >
                                Lock Selection
                            </button>
                        </div>
                        <div className="mt-4 flex items-center space-x-2">
                            <label htmlFor="bet-amount" className="text-lg font-semibold">Bet Amount (INR):</label>
                            <select
                                id="bet-amount"
                                value={currentUser?.currentBetAmount || ""}
                                onChange={handleBetChange}
                                className="px-2 py-1 border rounded"
                                disabled={isLocked || availableBetOptions.length === 0}
                            >
                                <option value="">Select amount</option>
                                {availableBetOptions.map(amount => (
                                    <option key={amount} value={amount}>{amount}</option>
                                ))}
                            </select>
                        </div>
                        {isLocked && currentUser && (
                            <p className="mt-4 text-lg font-semibold text-green-600">
                                Selection locked! Bet amount: {currentUser.currentBetAmount} INR
                            </p>
                        )}
                    </div>
                    <div className={clsx("flex flex-col w-full h-[600px] border border-gray-300 p-12")}>
                        <span className={clsx("font-bold text-3xl mb-10")}>This game users:</span>
                        <div>
                            <div className={clsx("flex flex-col border border-orange-300 p-1")}>
                                <p className={clsx("font-bold")}>{currentUser?.name}</p>
                                <span
                                    className={clsx("font-bold")}>Wallet Balance: {currentUser?.currentWalletAmount}</span>
                                <span
                                    className={clsx("font-bold")}>Current bet amount: {currentUser?.currentBetAmount}</span>
                                <span
                                    className={clsx("font-bold")}>Current bet: {selectedRange?.start} - {selectedRange?.end}</span>
                                {shareLink && <span
                                    className={clsx("font-bold")}>Link to share: {shareLink}</span>}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

export default Game;