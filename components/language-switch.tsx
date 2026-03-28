import {FC, useState, useEffect} from "react";
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@heroui/dropdown";
import {Button} from "@heroui/button";
import {useTranslation} from "@/context/TranslationContext";
import {Locale} from "@/locales";

export interface LanguageSwitchProps {
    className?: string;
}

export const LanguageSwitch: FC<LanguageSwitchProps> = ({className}) => {
    const [isMounted, setIsMounted] = useState(false);
    const {locale, setLocale, availableLocales, t} = useTranslation();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="w-6 h-6"/>;

    const currentLocale = availableLocales.find(l => l.code === locale);

    return (
        <Dropdown className={className}>
            <DropdownTrigger>
                <Button variant="light" size="sm" className="min-w-[80px]">
                    {currentLocale?.name || t("language.switch")}
                </Button>
            </DropdownTrigger>
            <DropdownMenu
                aria-label={t("language.switch")}
                onAction={(key) => setLocale(key as Locale)}
                selectedKeys={[locale]}
                selectionMode="single"
            >
                {availableLocales.map((loc) => (
                    <DropdownItem key={loc.code}>
                        {loc.name}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
};

