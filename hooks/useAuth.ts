"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {useEffect, useState} from "react";

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        const authCookie = Cookies.get('SESSION'); // Replace with your actual cookie name
        setIsAuthenticated(!!authCookie);
        setIsLoading(false);
    };

    const login = async (email: string, password: string) => {
        // Your login logic here
        // If login is successful:
        setIsAuthenticated(true);
        router.push('/home'); // or wherever you want to redirect after login
    };

    const logout = () => {
        Cookies.remove('SESSION');
        setIsAuthenticated(false);
        router.push('/');
    };

}