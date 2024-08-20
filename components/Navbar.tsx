"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";

function Navbar() {
    const router = useRouter();
    async function logout () {
        try {
            const response = await fetch("http://localhost:8080/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({})
            });

            if (!response.ok) {
                console.error("[LOGIN ERROR]")
            }
            console.log("logout successful!")
            router.push("/")

        } catch(e) {
            console.log(e)
        }
    }
    return (
        <>
            <nav className={clsx("flex w-full h-[70px] bg-violet-500 p-10 items-center justify-between")}>
                <div className={clsx("text-white hover:underline cursor cursor-pointer")} onClick={() => router.push("/")}>Gambling Game</div>
                <div>
                    <button onClick={logout} className={clsx("bg-white p-1 uppercase text-xs rounded shadow")}>logout</button>
                </div>
            </nav>
        </>
    )
}

export default Navbar;