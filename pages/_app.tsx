import type {AppProps} from "next/app";

import {HeroUIProvider} from "@heroui/system";
import {ThemeProvider as NextThemesProvider} from "next-themes";
import {useRouter} from "next/router";

import {fontMono, fontSans} from "@/config/fonts";
import "@/styles/globals.css";
import {AuthProvider} from "@/context/AuthContext";
import {TranslationProvider} from "@/context/TranslationContext";
import {ToastProvider} from "@heroui/toast";

export default function App({Component, pageProps}: AppProps) {
    const router = useRouter();

    return (
        <HeroUIProvider navigate={router.push}>
            <NextThemesProvider attribute="class" defaultTheme="light">
                <TranslationProvider>
                    <AuthProvider>
                        <ToastProvider/>
                        <Component {...pageProps} />
                    </AuthProvider>
                </TranslationProvider>
            </NextThemesProvider>
        </HeroUIProvider>
    );
}

export const fonts = {
    sans: fontSans.style.fontFamily,
    mono: fontMono.style.fontFamily,
};
