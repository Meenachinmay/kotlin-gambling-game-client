"use client";

import React from "react";
import clsx from "clsx";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";

interface LoginBody {
    email: string;
    password: string;
    userType: "singleUser" | "host" | "participant";
    hostEmail?: string;
}

export default function Home() {
    const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginBody>();
    const router = useRouter();

    const userType = watch("userType");

    const onSubmit: SubmitHandler<LoginBody> = async (data) => {
        console.log(JSON.stringify(data));

        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                console.error("[LOGIN ERROR]");
                return;
            }
            console.log("[LOGIN SUCCESSFUL]");
            localStorage.setItem("user_email", data.email);

            let redirectUrl = "/game?usertype=" + data.userType;
            if (data.userType === "participant" && data.hostEmail) {
                redirectUrl += "&hostemail=" + encodeURIComponent(data.hostEmail);
            }
            router.push(redirectUrl);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div id={"main-section"} className={clsx("flex items-center justify-center w-full h-full")}>
                <form onSubmit={handleSubmit(onSubmit)} className={clsx("flex flex-col w-1/2 space-y-4")}>
                    <input
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                message: "Invalid email address"
                            }
                        })}
                        className={clsx("w-full p-2 border border-gray-900 focus:outline-none")}
                        placeholder={"Email"}
                    />
                    {errors.email && <p className="text-red-500">{errors.email.message}</p>}

                    <input
                        {...register("password", {
                            required: "Password is required",
                            minLength: {
                                value: 6,
                                message: "Password must be at least 6 characters long"
                            }
                        })}
                        type="password"
                        className={clsx("w-full p-2 border border-gray-900 focus:outline-none")}
                        placeholder={"Password"}
                    />
                    {errors.password && <p className="text-red-500">{errors.password.message}</p>}

                    <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                {...register("userType", { required: "Please select a user type" })}
                                value="singleUser"
                            />
                            <span>Single User</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                {...register("userType", { required: "Please select a user type" })}
                                value="host"
                            />
                            <span>Host</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                {...register("userType", { required: "Please select a user type" })}
                                value="participant"
                            />
                            <span>Participant</span>
                        </label>
                    </div>
                    {errors.userType && <p className="text-red-500">{errors.userType.message}</p>}

                    {userType === "participant" && (
                        <div>
                            <input
                                {...register("hostEmail", {
                                    required: "Host Email is required for participants",
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                        message: "Invalid email address"
                                    }
                                })}
                                className={clsx("w-full p-2 border border-gray-900 focus:outline-none")}
                                placeholder={"Host Email"}
                            />
                            {errors.hostEmail && <p className="text-red-500">{errors.hostEmail.message}</p>}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={clsx("w-full p-2 border border-gray-900 focus:outline-none hover:bg-gray-100")}
                    >
                        Login
                    </button>
                </form>
            </div>
        </main>
    );
}