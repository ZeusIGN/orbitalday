import {Navbar as HeroUINavbar, NavbarBrand, NavbarContent, NavbarItem,} from "@heroui/navbar";
import {link as linkStyles} from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";

import {siteConfig} from "@/config/site";
import {ThemeSwitch} from "@/components/theme-switch";
import {Logo,} from "@/components/icons";
import {useAuth} from "@/context/AuthContext";

export const Navbar = () => {
    const {user} = useAuth();

    return (
        <HeroUINavbar maxWidth="xl" position="sticky">
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand className="gap-3 max-w-fit">
                    <NextLink className="flex justify-start items-center gap-1" href="/">
                        <Logo/>
                        <p className="font-bold text-inherit">Orbital</p>
                    </NextLink>
                </NavbarBrand>
                <div className="hidden lg:flex gap-4 justify-start ml-2">
                    {siteConfig.navItemsLoggedOut.filter(item => !user || (user && !item.userHidden)).map((item) => (
                        <NavbarItem key={item.href}>
                            <NextLink
                                className={clsx(
                                    linkStyles({color: "foreground"}),
                                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                                )}
                                color="foreground"
                                href={item.href}
                            >
                                {item.label}
                            </NextLink>
                        </NavbarItem>
                    ))}
                </div>
            </NavbarContent>

            <NavbarContent
                className="hidden sm:flex basis-1/5 sm:basis-full"
                justify="end"
            >
                <NavbarItem>
                    <div className="hidden lg:flex gap-4 justify-start ml-2">
                        {user && siteConfig.navItemsLoggedIn.map((item) => (
                            <NavbarItem key={item.href}>
                                <NextLink
                                    className={clsx(
                                        linkStyles({color: "foreground"}),
                                        "data-[active=true]:text-primary data-[active=true]:font-medium",
                                    )}
                                    color="foreground"
                                    href={item.href}
                                >
                                    {item.label}
                                </NextLink>
                            </NavbarItem>
                        ))}
                        <ThemeSwitch/>
                    </div>
                </NavbarItem>
            </NavbarContent>
        </HeroUINavbar>
    );
};
